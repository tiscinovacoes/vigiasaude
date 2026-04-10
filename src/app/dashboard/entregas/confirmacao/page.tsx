'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Camera,
  MapPin,
  Pill,
  User,
  PenLine,
  AlertTriangle,
  ScanBarcode,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { api } from '@/lib/api';

export default function ConfirmacaoEntregaPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [signature, setSignature] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [loteScanned, setLoteScanned] = useState<string | null>(null);
  const [fefoAlert, setFefoAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Real world this would come from the database based on route params
  const entrega = {
    id: "demo-id",
    paciente: "Maria da Silva Santos",
    cpf: "123.456.789-00",
    endereco: "Rua das Flores, 123 - Jd. Primavera",
    medicamento: "Insulina NPH 100UI/ml",
    quantidade: 2,
    loteRecomendado: "LT2024001" 
  };
  
  const handleScanLote = (lote: string) => {
    setLoteScanned(lote);
    
    // Demo constraint for FEFO
    if (lote !== entrega.loteRecomendado) {
      setFefoAlert(true);
    } else {
      setFefoAlert(false);
    }
  };

  const handleConfirm = async () => {
    if (!signature || !photo || fefoAlert) {
      toast.warning('Complete todas as validações (Assinatura, Foto e Lote correto) para continuar.');
      return;
    }

    setLoading(true);
    try {
      const success = await api.concluirEntrega(entrega.id, {
        foto_comprovante_url: 'https://exemplo.com/foto.jpg',
        assinatura_digital_url: 'https://exemplo.com/ass.jpg',
        lat_entrega: -22.2233,
        lng_entrega: -54.8083,
        status: 'ENTREGUE'
      });

      if (success) {
        setConfirmed(true);
        toast.success('Entrega confirmada e auditada com sucesso!');
      } else {
        toast.error('Erro ao confirmar no servidor. (Mock ID falhará no DB real, simulando sucesso.)');
        // fallback for demo
        setConfirmed(true);
      }
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16 sm:pt-0">
      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Paciente info */}
        <Card className="shadow-sm mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-[#1E293B] font-bold">{entrega.paciente}</p>
                <p className="text-sm text-[#64748B]">CPF: {entrega.cpf}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{entrega.endereco}</span>
            </div>
          </CardContent>
        </Card>

        {/* Medicamento */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-[#64748B] mb-2 font-bold uppercase tracking-widest text-[10px]">Medicamento</p>
            <div className="bg-[#EFF6FF] p-3 rounded-lg border border-blue-100">
              <p className="text-[#1E3A8A] font-bold">{entrega.medicamento}</p>
              <p className="text-sm text-[#64748B] mt-1">Qtd: {entrega.quantidade} frascos</p>
            </div>
          </CardContent>
        </Card>

        {/* Scanner de Lote (FEFO) */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#64748B] font-bold uppercase tracking-widest text-[10px]">Lote FEFO Recomendado</p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {entrega.loteRecomendado}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-[#94A3B8] mb-2">Simulador de Scanner:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleScanLote("LT2024001")}
                  className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    loteScanned === "LT2024001"
                      ? "border-green-300 bg-green-50"
                      : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ScanBarcode className="w-4 h-4" />
                    <span className="text-sm font-mono font-bold">LT2024001</span>
                  </div>
                </button>
                <button
                  onClick={() => handleScanLote("LT-ERROR")}
                  className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    loteScanned === "LT-ERROR"
                      ? "border-red-300 bg-red-50"
                      : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ScanBarcode className="w-4 h-4" />
                    <span className="text-sm font-mono font-bold">LT-ERROR</span>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta FEFO */}
        {fefoAlert && (
          <Card className="shadow-sm border-2 border-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                <div>
                  <p className="text-red-900 font-black mb-1 leading-none pt-1">BLOQUEIO FEFO</p>
                  <p className="text-sm text-red-800 mb-3">
                    Você escaneou o lote <strong className="font-mono">{loteScanned}</strong>, mas há um lote com validade mais próxima disponível.
                  </p>
                  <div className="bg-white p-3 rounded border border-red-200 mb-2">
                    <p className="text-xs text-red-700 mb-1 font-bold">✓ Lote correto (FEFO):</p>
                    <p className="font-mono font-black text-red-900">{entrega.loteRecomendado}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sucesso FEFO */}
        {loteScanned === entrega.loteRecomendado && (
          <Card className="shadow-sm border-2 border-green-500 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-green-900 font-bold">✓ Lote validado (FEFO)</p>
                  <p className="text-sm text-green-700">
                    O lote está de acordo com as regras de prioridade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
           {/* Assinatura */}
           <Card className="shadow-sm">
             <CardContent className="p-4 text-center">
               <p className="text-sm text-[#64748B] mb-2 font-bold uppercase tracking-widest text-[10px]">Assinatura</p>
               <button
                 onClick={() => setSignature(!signature)}
                 className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                   signature
                     ? "border-green-300 bg-green-50"
                     : "border-[#E2E8F0] bg-[#F8FAFC]"
                 }`}
               >
                 {signature ? (
                   <>
                     <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                     <span className="text-xs text-green-600 font-bold">Capturada</span>
                   </>
                 ) : (
                   <>
                     <PenLine className="w-6 h-6 text-[#94A3B8] mb-1" />
                     <span className="text-xs text-[#94A3B8] font-medium">Toque para assinar</span>
                   </>
                 )}
               </button>
             </CardContent>
           </Card>

           {/* Foto */}
           <Card className="shadow-sm">
             <CardContent className="p-4 text-center">
               <p className="text-sm text-[#64748B] mb-2 font-bold uppercase tracking-widest text-[10px]">Comprovante</p>
               <button
                 onClick={() => setPhoto(!photo)}
                 className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                   photo
                     ? "border-green-300 bg-green-50"
                     : "border-[#E2E8F0] bg-[#F8FAFC]"
                 }`}
               >
                 {photo ? (
                   <>
                     <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                     <span className="text-xs text-green-600 font-bold">Capturada</span>
                   </>
                 ) : (
                   <>
                     <Camera className="w-6 h-6 text-[#94A3B8] mb-1" />
                     <span className="text-xs text-[#94A3B8] font-medium">Toque para foto</span>
                   </>
                 )}
               </button>
             </CardContent>
           </Card>
        </div>

        {/* Confirmar */}
        {confirmed ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center animate-in zoom-in">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-800 font-bold mt-2">Entrega confirmada com sucesso!</p>
            <p className="text-sm text-emerald-600 mt-1 uppercase tracking-widest text-[10px] font-black">{new Date().toLocaleString('pt-BR')}</p>
          </div>
        ) : (
          <Button
            className="w-full h-12 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white cursor-pointer font-bold mt-4 shadow-xl shadow-green-900/20"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <CheckCircle className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            Confirmar Entrega
          </Button>
        )}
      </div>
    </div>
  );
}
