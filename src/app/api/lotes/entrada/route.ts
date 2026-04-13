import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/lotes/entrada
 * Server-side endpoint para registrar entrada de lotes usando service_role key,
 * bypassing RLS policies na tabela lotes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicamento_id, codigo_lote, data_validade, quantidade, custo_unitario, fornecedor_id } = body;

    // Validação básica
    if (!medicamento_id || !codigo_lote || !data_validade || !quantidade || custo_unitario == null) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: medicamento_id, codigo_lote, data_validade, quantidade, custo_unitario' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase incompleta no servidor' },
        { status: 500 }
      );
    }

    // Client com service_role para bypass do RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Inserir lote
    const { data, error } = await supabaseAdmin
      .from('lotes')
      .insert([{
        medicamento_id,
        codigo_lote_fabricante: codigo_lote,
        data_validade,
        quantidade_disponivel: quantidade,
        quantidade_recebida: quantidade,
        custo_unitario,
        ...(fornecedor_id ? { fornecedor_id } : {}),
        status: 'ATIVO'
      }])
      .select()
      .single();

    if (error) {
      console.error('[API /api/lotes/entrada] Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[API /api/lotes/entrada] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
