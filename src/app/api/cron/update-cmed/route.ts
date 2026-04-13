import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cron/update-cmed
 * Cron semanal — toda sexta-feira às 17h00 BRT (20h00 UTC)
 * Configurado em vercel.json: "0 20 * * 5"
 *
 * Verifica se a tabela cmed_referencia está atualizada.
 * Se dados > 7 dias, registra alerta na auditoria.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const agora = new Date().toISOString();

  // Status da tabela cmed_referencia
  const { data: ultimoRegistro } = await supabase
    .from('cmed_referencia')
    .select('atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .single();

  const { count: totalCmed } = await supabase
    .from('cmed_referencia')
    .select('*', { count: 'exact', head: true });

  const diasDesdeAtualizacao = ultimoRegistro?.atualizado_em
    ? Math.floor((Date.now() - new Date(ultimoRegistro.atualizado_em).getTime()) / 86400000)
    : 999;

  const tabela_desatualizada = diasDesdeAtualizacao > 7 || (totalCmed ?? 0) === 0;

  // Medicamentos sem teto CMED cadastrado
  const { data: medicamentos } = await supabase
    .from('medicamentos')
    .select('id, nome, preco_teto_cmed')
    .eq('ativo', true);

  const semTeto = medicamentos?.filter(m => !m.preco_teto_cmed) ?? [];

  // Registra na auditoria
  await supabase.from('logs_auditoria').insert({
    acao: 'CRON_CMED_VERIFICACAO_SEMANAL',
    detalhes: JSON.stringify({
      executado_em: agora,
      horario_programado: 'sexta-feira 17:00 BRT',
      cmed_referencia: {
        total_registros: totalCmed ?? 0,
        ultima_atualizacao: ultimoRegistro?.atualizado_em ?? 'nunca',
        dias_desde_atualizacao: diasDesdeAtualizacao,
        tabela_desatualizada,
      },
      medicamentos: {
        total: medicamentos?.length ?? 0,
        sem_teto_cmed: semTeto.length,
        lista_sem_teto: semTeto.map(m => m.nome),
      },
    }),
  });

  // Monta resposta com alertas
  const alertas: string[] = [];
  if (tabela_desatualizada) {
    alertas.push(
      totalCmed === 0
        ? 'Tabela CMED vazia — faça o upload do arquivo CMED em /dashboard/cmed'
        : `Tabela CMED desatualizada (${diasDesdeAtualizacao} dias) — acesse /dashboard/cmed para reimportar`
    );
  }
  if (semTeto.length > 0) {
    alertas.push(`${semTeto.length} medicamento(s) sem teto CMED: ${semTeto.map(m => m.nome).join(', ')}`);
  }

  return NextResponse.json({
    success: true,
    executado_em: agora,
    cmed_referencia: {
      total: totalCmed ?? 0,
      dias_desde_atualizacao: diasDesdeAtualizacao,
      atualizada: !tabela_desatualizada,
    },
    medicamentos: {
      total: medicamentos?.length ?? 0,
      sem_teto: semTeto.length,
    },
    alertas,
    status: alertas.length === 0 ? 'OK' : 'ATENCAO',
  });
}
