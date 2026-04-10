'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ScanBarcode, Camera, PenTool, MapPin, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowLeft, Truck, XCircle,
  Loader2, Lock
} from 'lucide-react';
import { api, type EntregaLogistica } from '@/lib/api';
import { toast } from 'sonner';

export default function ConfirmacaoEntregaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entrega, setEntrega] = useState<EntregaLogistica | null>(null);
  const [step, setStep] = useState<'LOADING' | 'SCAN' | 'EVIDENCIAS' | 'FALHA' | 'CONCLUIDA'>('LOADING');
  
  // FEFO Scan
  const [scannedLote, setScannedLote] = useState('');
  const [erroFEFO, setErroFEFO] = useState('');
  
  // Evidências
  const [fotoURL, setFotoURL] = useState<string | null>(null);
  const [assinaturaData, setAssinaturaData] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // Segurança OTP (High Cost) - Mock validation
  const [otpVal, setOtpVal] = useState('');

  // Registro de Falha
  const [motivoFalha, setMotivoFalha] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Canvas Ref for Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (id) {
       loadEntrega();
    }
  }, [id]);

  const loadEntrega = async () => {
    const data = await api.getEntregaById(id);
    if (!data) {
       toast.error('Entrega não encontrada');
       router.push('/dashboard/entregas');
       return;
    }
    setEntrega(data);
    setStep('SCAN');
  };

  // --- Signature Logic ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
        setAssinaturaData(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAssinaturaData(null);
  };

  // --- Geolocation ---
  const capturarGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('Localização capturada com precisão');
      }, (error) => {
        console.error(error);
        toast.error('Erro ao acessar GPS. Verifique as permissões.');
      });
    }
  };

  const handleValidarScan = () => {
    setErroFEFO('');
    // No mundo real, validaríamos se o lote escaneado é o que foi reservado no banco
    // Por enquanto, aceitamos qualquer lote que comece com 'LT' para simular a validação
    if (!scannedLote.startsWith('LT')) {
      setErroFEFO(`LOTE INVÁLIDO! Protocolo FEFO exige um lote válido da base.`);
      return;
    }
    setStep('EVIDENCIAS');
  };

  const handleFinalizar = async (status: 'ENTREGUE' | 'FALHA') => {
    if (!entrega) return;
    setSubmitting(true);

    const success = await api.concluirEntrega(entrega.id, {
      status,
      lat_entrega: coords?.lat || 0,
      lng_entrega: coords?.lng || 0,
      assinatura_digital_url: assinaturaData || undefined,
      foto_comprovante_url: fotoURL || 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=400' // Mock image
    });

    if (success) {
      setStep('CONCLUIDA');
    } else {
      toast.error('Erro ao sincronizar com o servidor');
    }
    setSubmitting(false);
  };

  if (step === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#1E3A8A]" size={40} />
      </div>
    );
  }

  if (step === 'CONCLUIDA') {
    return (
      <div className="min-h-screen bg-[#1E3A8A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ${motivoFalha ? 'bg-orange-500 ring-orange-500/30' : 'bg-emerald-500 ring-emerald-500/30'}`}>
          {motivoFalha ? <XCircle size={40} className="text-white" /> : <CheckCircle2 size={40} className="text-white" />}
        </div>
        <h1 className="text-2xl font-bold mb-2">{motivoFalha ? 'Insucesso Registrado' : 'Entrega Concluída!'}</h1>
        <p className="text-blue-200 text-sm mb-8">{motivoFalha ? `Motivo: ${motivoFalha}. Dados salvos para auditoria.` : 'Trilha de auditoria e evidências sincronizadas.'}</p>
        <button onClick={() => router.push('/dashboard/entregas')} className="px-8 py-4 bg-white text-[#1E3A8A] font-bold rounded-2xl shadow-md w-full active:scale-95 transition-transform tracking-tight">Voltar à Central</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-200 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="bg-[#1E3A8A] pt-12 pb-6 px-6 text-white shrink-0 shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10"><Truck size={120} /></div>
         <div className="flex items-center gap-3 mb-4 relative z-10">
           <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"><ArrowLeft size={18}/></button>
           <div>
             <h1 className="font-black text-lg leading-tight uppercase tracking-tight">{entrega?.dispense_id}</h1>
             <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Protocolo de Entrega Segura</p>
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-12">
         
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Paciente</h2>
            <p className="font-bold text-slate-800 text-lg leading-tight">{entrega?.pacientes?.nome_completo}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} className="text-blue-500"/> {entrega?.pacientes?.endereco_completo}</p>
         </div>

         {/* PASSO: INSUCESSO */}
         {step === 'FALHA' && (
           <div className="animate-in slide-in-from-bottom flex flex-col space-y-4">
              <h3 className="font-black text-lg text-slate-800 tracking-tight">Motivo do Insucesso</h3>
              <div className="space-y-3">
                {['Paciente Ausente', 'Endereço Incorreto', 'Recusa Formal', 'Outros'].map(razao => (
                  <label key={razao} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${motivoFalha === razao ? 'border-[#1E3A8A] bg-blue-50 scale-[1.02]' : 'border-slate-100 bg-white'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${motivoFalha === razao ? 'border-[#1E3A8A]' : 'border-slate-200'}`}>
                      {motivoFalha === razao && <div className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-full" />}
                    </div>
                    <span className="font-bold text-slate-700 text-sm tracking-tight">{razao}</span>
                  </label>
                ))}
              </div>
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => handleFinalizar('FALHA')} 
                  disabled={!motivoFalha || submitting} 
                  className="w-full py-4 bg-orange-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <AlertTriangle size={20} />} Confirmar Devolução
                </button>
                <button onClick={() => setStep('SCAN')} className="w-full py-4 bg-transparent text-slate-500 font-bold text-sm">Cancelar e Voltar</button>
              </div>
           </div>
         )}
         
         {/* PASSO: SCAN FEFO */}
         {step === 'SCAN' && (
           <div className="space-y-6 animate-in slide-in-from-right">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Escaneamento Obrigatório</p>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Validação de Lote FEFO</h3>
              </div>

              <div className="aspect-square bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center border-8 border-slate-100 relative group">
                <ScanBarcode size={64} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-[2rem] m-6 pointer-events-none" />
              </div>

              {erroFEFO && (
                <div className="bg-red-50 border-l-4 border-[#DC2626] p-4 rounded-r-2xl shadow-sm text-xs text-red-800 font-bold flex items-start gap-3">
                  <ShieldAlert className="text-[#DC2626] shrink-0" size={18} />
                  {erroFEFO}
                </div>
              )}

              <input 
                 type="text" 
                 value={scannedLote} 
                 onChange={(e) => setScannedLote(e.target.value.toUpperCase())}
                 placeholder="Digitar Lote ou Escanear" 
                 className="w-full text-center px-4 py-5 bg-white border-2 border-slate-100 rounded-2xl font-mono text-xl outline-none focus:border-[#1E3A8A] placeholder:text-slate-300 shadow-inner"
              />
              
              <div className="space-y-3">
                <button onClick={handleValidarScan} className="w-full py-4 bg-[#1E3A8A] text-white font-black rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all">Validar Lote</button>
                <button onClick={() => setStep('FALHA')} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600">Problema na entrega?</button>
              </div>
           </div>
         )}

         {/* PASSO: EVIDÊNCIAS */}
         {step === 'EVIDENCIAS' && (
           <div className="space-y-6 animate-in slide-in-from-right pb-8">
              
              {/* Foto Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} /> Foto do Comprovante
                </h4>
                <div 
                   onClick={() => setFotoURL('https://mock-image.url')}
                   className={`h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${fotoURL ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  {fotoURL ? (
                    <div className="text-center">
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-black text-emerald-700 uppercase">Imagem Capturada</p>
                    </div>
                  ) : (
                    <>
                      <Camera size={32} className="text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Toque para Capturar</p>
                    </>
                  )}
                </div>
              </div>

              {/* Signature Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <PenTool size={14} /> Assinatura do Paciente
                   </h4>
                   <button onClick={clearCanvas} className="text-[10px] font-black text-blue-600 uppercase">Limpar</button>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-inner">
                   <canvas 
                      ref={canvasRef}
                      width={350}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full touch-none cursor-crosshair"
                   />
                </div>
              </div>

              {/* GPS Section */}
              <button 
                onClick={capturarGPS}
                className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${coords ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={20} className={coords ? 'text-emerald-500' : 'text-slate-400'}/> 
                  <div className="text-left">
                    <p className="font-black text-sm text-slate-700">Coletar Coordenadas</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Aguardando GPS'}</p>
                  </div>
                </div>
                {coords && <CheckCircle2 size={20} className="text-emerald-500"/>}
              </button>

              <div className="pt-4">
                 <button 
                   onClick={() => handleFinalizar('ENTREGUE')}
                   disabled={!fotoURL || !assinaturaData || !coords || submitting}
                   className="w-full py-5 bg-emerald-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-lg"
                 >
                   {submitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />} Finalizar Entrega
                 </button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
