'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status?: string;
};

interface MapRealTimeProps {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerData[];
}

export default function MapRealTime({ 
  center = [-22.2234, -54.8064], // Centro de Dourados-MS (Aprox)
  zoom = 13, 
  markers = [] 
}: MapRealTimeProps) {
  
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-800 m-0">{m.label}</p>
                {m.status && <p className="text-[10px] text-slate-500 uppercase font-bold m-0 mt-1">{m.status}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
