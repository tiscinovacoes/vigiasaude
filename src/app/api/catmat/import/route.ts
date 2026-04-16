import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/catmat/import
 * Recebe um arquivo CSV do CATMAT (COMPRASNET) e popula a tabela catmat_medicamentos.
 *
 * Formato esperado do CSV (vírgula ou ponto-e-vírgula):
 *   codigo_br,descricao,unidade_fornecimento
 *   BR0268315,"ABACAVIR SULFATO, 300 MG",COMPRIMIDO
 */
export async function POST(req: NextRequest) {
  try {
    // Usa service key para garantir permissão de escrita mesmo com RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY
        ?? process.env.SUPABASE_SERVICE_ROLE_KEY
        ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'csv') {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .csv' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV vazio ou sem dados' }, { status: 400 });
    }

    // Parse do cabeçalho (aceita vírgula ou ponto-e-vírgula)
    const sep = lines[0].includes(';') ? ';' : ',';
    const header = parseCSVLine(lines[0], sep).map(h =>
      h.trim().toLowerCase().replace(/[\s\-]+/g, '_')
    );

    const idxCodigo = header.indexOf('codigo_br');
    const idxDescricao = header.indexOf('descricao');
    const idxUnidade = header.indexOf('unidade_fornecimento');

    if (idxCodigo === -1 || idxDescricao === -1) {
      return NextResponse.json(
        {
          error: 'Colunas obrigatórias não encontradas. Esperado: codigo_br, descricao',
          cabecalho_detectado: header,
        },
        { status: 422 }
      );
    }

    // Parse das linhas de dados
    const registros: { codigo_br: string; descricao: string; unidade_fornecimento: string | null }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i], sep);
      const codigo = (cols[idxCodigo] ?? '').trim();
      const descricao = (cols[idxDescricao] ?? '').trim();
      if (!codigo || !descricao) continue;

      registros.push({
        codigo_br: codigo,
        descricao,
        unidade_fornecimento: idxUnidade !== -1 ? (cols[idxUnidade] ?? '').trim() || null : null,
      });
    }

    if (registros.length === 0) {
      return NextResponse.json({
        error: 'Nenhum registro válido encontrado no CSV',
        cabecalho_detectado: header,
        linhas_lidas: lines.length,
      }, { status: 400 });
    }

    // Deduplica por codigo_br (CSV pode ter duplicatas — mantém a última ocorrência)
    const mapaUnico = new Map<string, typeof registros[0]>();
    for (const r of registros) mapaUnico.set(r.codigo_br, r);
    const registrosUnicos = Array.from(mapaUnico.values());

    // Upsert em lotes de 500
    const BATCH = 500;
    let inseridos = 0;
    let erros = 0;
    let lastError: string | null = null;

    for (let i = 0; i < registrosUnicos.length; i += BATCH) {
      const lote = registrosUnicos.slice(i, i + BATCH);
      const { error } = await supabase
        .from('catmat_medicamentos')
        .upsert(lote, { onConflict: 'codigo_br', ignoreDuplicates: false });

      if (error) {
        console.error(`[CATMAT Import] Lote ${i}–${i + BATCH}:`, error.message);
        erros += lote.length;
        lastError = error.message;
      } else {
        inseridos += lote.length;
      }
    }

    // Se todos os lotes falharam, retorna erro com a mensagem do banco
    if (inseridos === 0 && erros > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Falha no banco de dados: ${lastError}`,
          dica: 'Execute o catmat_schema.sql no Supabase Studio para criar a tabela.',
          registros_validos: registros.length,
        },
        { status: 500 }
      );
    }

    // Auditoria (tenta, mas não falha o request se não conseguir)
    try {
      await supabase.from('logs_auditoria').insert({
        acao: 'IMPORT_CATMAT',
        detalhes: JSON.stringify({
          arquivo: file.name,
          total_linhas: lines.length - 1,
          registros_validos: registros.length,
          inseridos,
          erros,
          data_import: new Date().toISOString(),
        }),
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      arquivo: file.name,
      total_linhas: lines.length - 1,
      registros_validos: registros.length,
      inseridos,
      erros,
      duplicatas_removidas: registros.length - registrosUnicos.length,
      message: `${inseridos} itens CATMAT importados com sucesso`,
    });
  } catch (err: any) {
    console.error('[CATMAT Import] Erro:', err);
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

/**
 * Parseia uma linha CSV respeitando campos entre aspas.
 * Ex: 'BR0001,"NOME, COM VIRGULA",COMPRIMIDO' → ['BR0001', 'NOME, COM VIRGULA', 'COMPRIMIDO']
 */
function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

/** GET /api/catmat/import — status da tabela */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY
      ?? process.env.SUPABASE_SERVICE_ROLE_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { count, error } = await supabase
    .from('catmat_medicamentos')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({
      error: error.message,
      dica: 'Execute o catmat_schema.sql no Supabase Studio para criar a tabela.',
    }, { status: 500 });
  }

  const { data: ultimo } = await supabase
    .from('catmat_medicamentos')
    .select('importado_em')
    .order('importado_em', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    total_registros: count ?? 0,
    ultima_importacao: ultimo?.importado_em ?? null,
  });
}
