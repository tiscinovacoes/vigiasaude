import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/medicamentos
 * Server-side endpoint para criar medicamentos usando service_role key,
 * bypassing RLS policies. Usado quando auto-cadastrando da base CMED.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, dosagem, estoque_minimo, preco_teto_cmed, codigo_catmat, unidade_fornecimento } = body;
    
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase incompleta no servidor' },
        { status: 500 }
      );
    }

    // Criar client com service_role para bypass do RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Verificar se já existe um medicamento com mesmo nome (evitar duplicatas)
    const { data: existing } = await supabaseAdmin
      .from('medicamentos')
      .select('id, nome, dosagem, preco_teto_cmed')
      .ilike('nome', nome)
      .limit(1);

    if (existing && existing.length > 0) {
      // Já existe — retorna o existente em vez de criar duplicata
      return NextResponse.json({ 
        success: true, 
        data: existing[0],
        already_existed: true 
      });
    }

    // Inserir novo medicamento
    const { data, error } = await supabaseAdmin
      .from('medicamentos')
      .insert([{
        nome,
        dosagem: dosagem || null,
        estoque_minimo: estoque_minimo ?? 0,
        preco_teto_cmed: preco_teto_cmed ?? 0,
        codigo_catmat: codigo_catmat || null,
        unidade_fornecimento: unidade_fornecimento || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('[API /api/medicamentos] Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[API /api/medicamentos] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
