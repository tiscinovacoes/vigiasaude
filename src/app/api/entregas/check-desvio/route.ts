import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to simulate calculating distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { motoristaId, entregaId, currentLat, currentLon, baseRouteLat, baseRouteLon } = body;

    if (!motoristaId || !entregaId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Calcula a distância do desvio
    const distanceKm = calculateDistance(currentLat, currentLon, baseRouteLat, baseRouteLon);

    // Regra de Negócio: Se a distância for maior que 1km (Desvio Crítico)
    if (distanceKm > 1) {
      // 1. Inserir um registro na tabela logs_auditoria / alertas
      const { data, error } = await supabase
        .from('logs_auditoria')
        .insert([
          {
            tipo_alerta: 'DESVIO_ROTA',
            entidade_id: motoristaId,
            entrega_logistica_id: entregaId,
            severidade: 'CRITICAL',
            metadados: {
              distance_km: distanceKm,
              lat: currentLat,
              lon: currentLon,
              timestamp: new Date().toISOString()
            }
          }
        ]);

      if (error) {
        console.error('Falha ao registrar auditoria Supabase:', error);
        return NextResponse.json({ error: 'Failed to record audit log' }, { status: 500 });
      }

      // TODO: Disparar webhooks ou Realtime push events para a interface web

      return NextResponse.json({ 
        alert_triggered: true, 
        distance_km: distanceKm,
        message: 'Desvio maior que 1km detectado. Alerta disparado no Painel.' 
      }, { status: 200 });
    }

    // Se estiver dentro da margem de segurança, apenas atualizar a posição em entregas_logistica
    const { error: updateError } = await supabase
      .from('entregas_logistica')
      .update({ ultima_lat: currentLat, ultima_lon: currentLon })
      .eq('id', entregaId);

    if (updateError) {
       console.error('Error updating location:', updateError);
    }

    return NextResponse.json({ 
      alert_triggered: false, 
      status: 'Motorista em rota normal' 
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
