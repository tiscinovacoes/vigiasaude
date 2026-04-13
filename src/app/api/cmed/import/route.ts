import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

/**
 * POST /api/cmed/import
 * Recebe um arquivo XLS/XLSX da ANVISA/CMED e popula a tabela cmed_referencia.
 *
 * Colunas esperadas no arquivo CMED (Layout ANVISA):
 * SUBSTÂNCIA | LABORATÓRIO | CÓDIGO GGREM | REGISTRO | PRODUTO | APRESENTAÇÃO |
 * CLASS. TERAPÊUTICA | PF Sem Impostos | PF 17% | PMC 0% | PMC 17%
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['xls', 'xlsx'].includes(ext ?? '')) {
      return NextResponse.json({ error: 'Formato inválido. Envie um arquivo .xls ou .xlsx' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converte para JSON com header da primeira linha
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      defval: null,
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados' }, { status: 400 });
    }

    // Normaliza nomes de colunas (remove espaços, acentos, uppercase)
    const normalize = (s: string) =>
      s?.toString().trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');

    // Mapeia possíveis nomes de coluna do arquivo CMED ANVISA
    const findCol = (row: Record<string, any>, ...candidates: string[]) => {
      const keys = Object.keys(row);
      for (const c of candidates) {
        const found = keys.find(k => normalize(k).includes(normalize(c)));
        if (found) return found;
      }
      return null;
    };

    // Detecta colunas na primeira linha de dados
    const sample = rows[0];
    const colProduto       = findCol(sample, 'PRODUTO');
    const colApresentacao  = findCol(sample, 'APRESENTACAO', 'APRESENTAÇÃO');
    const colSubstancia    = findCol(sample, 'SUBSTANCIA', 'SUBSTÂNCIA');
    const colLaboratorio   = findCol(sample, 'LABORATORIO', 'LABORATÓRIO');
    const colGgrem         = findCol(sample, 'GGREM', 'CODIGO GGREM');
    const colRegistro      = findCol(sample, 'REGISTRO');
    const colClasse        = findCol(sample, 'CLASS', 'CLASSE');
    const colPfSem         = findCol(sample, 'PF SEM', 'PF SEM IMPOSTO');
    const colPf17          = findCol(sample, 'PF 17%');
    const colPmc0          = findCol(sample, 'PMC 0%');
    const colPmc17         = findCol(sample, 'PMC 17%');
    const colRestr         = findCol(sample, 'RESTRICAO', 'RESTRIÇÃO HOSPITALAR');

    if (!colProduto) {
      return NextResponse.json({
        error: 'Coluna PRODUTO não encontrada. Verifique se o arquivo é da tabela CMED/ANVISA.',
        colunas_detectadas: Object.keys(sample).slice(0, 10),
      }, { status: 422 });
    }

    // Monta registros para upsert
    const parseNum = (v: any) => {
      if (v == null || v === '') return null;
      const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
      return isNaN(n) ? null : n;
    };

    const registros = rows
      .filter(r => r[colProduto!])
      .map(r => ({
        produto:            String(r[colProduto!]).trim(),
        apresentacao:       colApresentacao ? String(r[colApresentacao] ?? '').trim() || null : null,
        substancia:         colSubstancia   ? String(r[colSubstancia]  ?? '').trim() || null : null,
        laboratorio:        colLaboratorio  ? String(r[colLaboratorio] ?? '').trim() || null : null,
        codigo_ggrem:       colGgrem        ? String(r[colGgrem]       ?? '').trim() || null : null,
        registro_anvisa:    colRegistro     ? String(r[colRegistro]    ?? '').trim() || null : null,
        classe_terapeutica: colClasse       ? String(r[colClasse]      ?? '').trim() || null : null,
        pf_sem_imposto:     parseNum(colPfSem  ? r[colPfSem]  : null),
        pf_17:              parseNum(colPf17   ? r[colPf17]   : null),
        pmc_0:              parseNum(colPmc0   ? r[colPmc0]   : null),
        pmc_17:             parseNum(colPmc17  ? r[colPmc17]  : null),
        restricao_hospitalar: colRestr
          ? String(r[colRestr] ?? '').toUpperCase().includes('SIM')
          : false,
        atualizado_em: new Date().toISOString(),
      }));

    // Upsert em lotes de 500
    const BATCH = 500;
    let inseridos = 0;
    let erros = 0;

    for (let i = 0; i < registros.length; i += BATCH) {
      const lote = registros.slice(i, i + BATCH);
      const { error } = await supabase
        .from('cmed_referencia')
        .upsert(lote, { onConflict: 'codigo_ggrem', ignoreDuplicates: false });

      if (error) {
        console.error(`Lote ${i}-${i + BATCH} erro:`, error.message);
        erros += lote.length;
      } else {
        inseridos += lote.length;
      }
    }

    // Registra na auditoria
    await supabase.from('logs_auditoria').insert({
      acao: 'IMPORT_CMED_MANUAL',
      detalhes: JSON.stringify({
        arquivo: file.name,
        total_linhas: rows.length,
        inseridos,
        erros,
        data_import: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      arquivo: file.name,
      total_linhas: rows.length,
      inseridos,
      erros,
      message: `${inseridos} medicamentos importados com sucesso da tabela CMED`,
    });
  } catch (err: any) {
    console.error('Erro no import CMED:', err);
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

/** GET /api/cmed/import — status da última importação */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: ultimo } = await supabase
    .from('cmed_referencia')
    .select('atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .single();

  const { count } = await supabase
    .from('cmed_referencia')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    total_registros: count ?? 0,
    ultima_atualizacao: ultimo?.atualizado_em ?? null,
    dias_desde_atualizacao: ultimo?.atualizado_em
      ? Math.floor((Date.now() - new Date(ultimo.atualizado_em).getTime()) / 86400000)
      : null,
  });
}
