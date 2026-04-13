import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron job: atualização semanal de preços CMED
 * Executa toda sexta-feira às 17h00 BRT (20h00 UTC)
 * Configurado em vercel.json
 */
export async function GET(req: NextRequest) {
  // Verifica autorização do Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const agora = new Date().toISOString();

  // Busca todos os medicamentos com preço CMED cadastrado
  const { data: medicamentos, error } = await supabase
    .from('medicamentos')
    .select('id, nome, dosagem, preco_teto_cmed, updated_at')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const semPreco = medicamentos?.filter(m => !m.preco_teto_cmed) ?? [];
  const comPreco = medicamentos?.filter(m => m.preco_teto_cmed) ?? [];

  // Registra verificação na trilha de auditoria
  await supabase.from('logs_auditoria').insert({
    acao: 'CRON_VERIFICACAO_CMED_SEMANAL',
    detalhes: JSON.stringify({
      executado_em: agora,
      dia_semana: 'sexta-feira',
      horario: '17:00 BRT',
      total_medicamentos: medicamentos?.length ?? 0,
      com_preco_cmed: comPreco.length,
      sem_preco_cmed: semPreco.length,
      medicamentos_sem_teto: semPreco.map(m => ({ id: m.id, nome: m.nome })),
    }),
  });

  return NextResponse.json({
    success: true,
    executado_em: agora,
    resumo: {
      total: medicamentos?.length ?? 0,
      com_preco_cmed: comPreco.length,
      sem_preco_cmed: semPreco.length,
    },
    alerta: semPreco.length > 0
      ? `${semPreco.length} medicamento(s) sem teto CMED cadastrado: ${semPreco.map(m => m.nome).join(', ')}`
      : 'Todos os medicamentos possuem teto CMED configurado.',
  });
}
