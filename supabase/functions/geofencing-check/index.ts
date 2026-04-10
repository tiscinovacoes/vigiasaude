import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { entrega_id, motorista_id, current_lat, current_lng } = await req.json()

    if (!entrega_id || !current_lat || !current_lng) {
      throw new Error('Parâmetros insuficientes: entrega_id, current_lat e current_lng são obrigatórios.')
    }

    // 1. Buscar localização destino (paciente)
    const { data: entrega, error: entregaErr } = await supabase
      .from('entregas_logistica')
      .select('*, pacientes(nome_completo, geolocalizacao)')
      .eq('id', entrega_id)
      .single()

    if (entregaErr || !entrega) throw new Error('Entrega não encontrada.')

    const destino = entrega.pacientes.geolocalizacao
    if (!destino || !destino.lat || !destino.lng) {
      throw new Error('Paciente sem geolocalização cadastrada.')
    }

    // 2. Cálculo de Distância (Haversine)
    const R = 6371e3 // raio da terra em metros
    const phi1 = current_lat * Math.PI / 180
    const phi2 = destino.lat * Math.PI / 180
    const deltaPhi = (destino.lat - current_lat) * Math.PI / 180
    const deltaLambda = (destino.lng - current_lng) * Math.PI / 180

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distancia = R * c

    const threshold = 500 // 500 metros
    const desvioDetectado = distancia > threshold

    // 3. Registrar Log se houver desvio
    if (desvioDetectado) {
      await supabase.from('logs_auditoria').insert([{
        acao: 'ALERTA_SEGURANCA',
        tabela_afetada: 'entregas_logistica',
        ator: `Motorista ID: ${motorista_id || 'Desconhecido'}`,
        metadados: {
          tipo: 'DESVIO_ROTA',
          distancia_metros: Math.round(distancia),
          entrega_id,
          coords_motorista: { lat: current_lat, lng: current_lng },
          coords_destino: { lat: destino.lat, lng: destino.lng }
        },
        severidade: 'Alta'
      }])
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        distancia: Math.round(distancia), 
        desvioDetectado,
        msg: desvioDetectado ? '⚠️ Alerta: Motorista fora do raio permitido!' : '✅ Rota normal.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
