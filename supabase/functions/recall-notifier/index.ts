import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    
    // 1. Rastrear pacientes afetados
    const { data: pacientes, error: rpcError } = await supabase.rpc(
      'fn_rastrear_pacientes_por_lote', 
      { batch_codigo: record.codigo_lote_fabricante }
    )

    if (rpcError) throw rpcError

    // 2. Processar notificações em modo resiliente
    for (const p of pacientes) {
      const mensagem = `🚨 ALERTA VIGIA SAÚDE: O medicamento ${record.medicamento_nome} (Lote: ${record.codigo_lote_fabricante}) que você recebeu foi colocado em RECALL. Por favor, SUSPENDA O USO imediatamente e procure sua UBS para substituição.`
      
      // Criar registro na fila de notificações (Persistência Interna)
      const { data: notifRecord, error: insertError } = await supabase
        .from('notificacoes_fila')
        .insert([{
          paciente_id: p.paciente_id || p.id,
          mensagem: mensagem,
          status: 'PENDENTE'
        }])
        .select()
        .single()

      if (insertError) {
        console.error(`Erro ao enfileirar notificação: ${insertError.message}`)
        continue
      }

      // 3. Tentar envio via WhatsApp Cloud API se houver configuração
      const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
      const token = Deno.env.get('WHATSAPP_TOKEN')

      if (phoneNumberId && token && p.paciente_telefone) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: p.paciente_telefone.replace(/\D/g, ''),
                type: 'text',
                text: { body: mensagem }
              }),
            }
          )

          if (response.ok) {
            await supabase
              .from('notificacoes_fila')
              .update({ status: 'ENVIADO' })
              .eq('id', notifRecord.id)
          } else {
            const errData = await response.json()
            await supabase
              .from('notificacoes_fila')
              .update({ status: 'FALHA', log_erro: JSON.stringify(errData) })
              .eq('id', notifRecord.id)
          }
        } catch (fetchErr) {
          await supabase
            .from('notificacoes_fila')
            .update({ status: 'FALHA', log_erro: fetchErr.message })
            .eq('id', notifRecord.id)
        }
      } else {
        // Modo Fallback: Apenas aguardando configuração da API
        await supabase
          .from('notificacoes_fila')
          .update({ status: 'AGUARDANDO_API' })
          .eq('id', notifRecord.id)
      }
    }

    return new Response(JSON.stringify({ success: true, count: pacientes.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
