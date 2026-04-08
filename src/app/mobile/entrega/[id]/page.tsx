'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ScanBarcode, Camera, PenTool, MapPin, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowLeft, Truck, XCircle
} from 'lucide-react';

const MOCK_ORDEM = {
  id: 'DSP-99281-A',
  paciente: 'Maria Aparecida da Silva',
  endereco: 'Rua das Flores, 120 - Centro',
  isAltoCusto: true, // Aciona a exigência de InputOTP
  itens: [
    { id: 'item1', medicamento: 'Insulina NPH 100UI/ml', qtd: 3, loteEsperadoFEFO: 'LT-2023-B15' }
  ]
};

export default function ConfirmacaoEntregaPage() {
  const router = useRouter();
  const [step, setStep] = useState<'SCAN' | 'EVIDENCIAS' | 'FALHA' | 'CONCLUIDA'>('SCAN');
  
  // FEFO Scan
  const [scannedLote, setScannedLote] = useState('');
  const [erroFEFO, setErroFEFO] = useState('');
  
  // Evidências
  const [fotoCapturada, setFotoCapturada] = useState(false);
  const [assinaturaCapturada, setAssinaturaCapturada] = useState(false);
  const [gpsColetado, setGpsColetado] = useState(false);
  
  // Segurança OTP (High Cost)
  const [otpVal, setOtpVal] = useState('');

  // Registro de Falha (Radio Group Simulado Shadcn)
  const [motivoFalha, setMotivoFalha] = useState('');

  const handleValidarScan = () => {
    setErroFEFO('');
    if (scannedLote.toUpperCase() !== MOCK_ORDEM.itens[0].loteEsperadoFEFO) {
      setErroFEFO(`LOTE INCORRETO! Protocolo FEFO exige: ${MOCK_ORDEM.itens[0].loteEsperadoFEFO}`);
      return;
    }
    setStep('EVIDENCIAS');
  };

  const handleRegistrarInsucesso = () => {
    if (!motivoFalha) return;
    // Call Supabase / auditoriaAPI mock
    console.log('[Auditoria] Insucesso de Entrega:', motivoFalha);
    setStep('CONCLUIDA');
  };

  // Renderização do Fluxo de Conclusão Positiva ou Negativa
  if (step === 'CONCLUIDA') {
    return (
      <div className="min-h-screen bg-[#1E3A8A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ${motivoFalha ? 'bg-orange-500 ring-orange-500/30' : 'bg-emerald-500 ring-emerald-500/30'}`}>
          {motivoFalha ? <XCircle size={40} className="text-white" /> : <CheckCircle2 size={40} className="text-white" />}
        </div>
        <h1 className="text-2xl font-bold mb-2">{motivoFalha ? 'Insucesso Localizado' : 'Protocolo Concluído!'}</h1>
        <p className="text-blue-200 text-sm mb-8">{motivoFalha ? `Registro formalizado: ${motivoFalha}.` : 'Lotes FEFO e evidências gravadas no WORM.'}</p>
        <button onClick={() => router.push('/dashboard/entregas')} className="px-8 py-3 bg-white text-[#1E3A8A] font-bold rounded-xl shadow-md w-full">Voltar à Central</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* HEADER */}
      <div className="bg-[#1E3A8A] pt-12 pb-6 px-6 text-white shrink-0 shadow-md">
         <div className="flex items-center gap-3 mb-4">
           <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-lg"><ArrowLeft size={18}/></button>
           <h1 className="font-bold text-lg leading-tight flex items-center gap-2"><Truck size={16}/> {MOCK_ORDEM.id}</h1>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
         
         {/* ABORTAR ENTREGA BUTTON */}
         {step !== 'FALHA' && (
           <button 
             onClick={() => setStep('FALHA')}
             className="w-full text-center py-2 text-sm font-bold text-slate-500 underline hover:text-slate-800"
           >
             Registrar Insucesso na Entrega
           </button>
         )}

         {/* PASSO: INSUCESSO (RadioGroup Mock) */}
         {step === 'FALHA' && (
           <div className="animate-in slide-in-from-bottom flex flex-col h-full space-y-4">
              <h3 className="font-bold text-lg text-slate-800">Motivo do Insucesso</h3>
              <div className="space-y-3 flex-1">
                {['Paciente Ausente', 'Endereço Incorreto', 'Recusa Formal'].map(razao => (
                  <label key={razao} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${motivoFalha === razao ? 'border-[#1E3A8A] bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${motivoFalha === razao ? 'border-[#1E3A8A]' : 'border-slate-300'}`}>
                      {motivoFalha === razao && <div className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-full" />}
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">{razao}</span>
                  </label>
                ))}
              </div>
              <button onClick={handleRegistrarInsucesso} disabled={!motivoFalha} className="w-full py-4 bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl mt-4">Confirmar Devolução</button>
              <button onClick={() => setStep('SCAN')} className="w-full py-4 bg-transparent text-slate-600 font-bold rounded-xl">Cancelar</button>
           </div>
         )}
         
         {/* PASSO: SCAN FEFO */}
         {step === 'SCAN' && (
           <div className="space-y-6 animate-in slide-in-from-right">
             <div className="text-center">
               <h3 className="font-bold text-slate-800 text-xl">{MOCK_ORDEM.itens[0].medicamento}</h3>
               {MOCK_ORDEM.isAltoCusto && <span className="mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Alto Custo Controlado</span>}
             </div>

             <div className="aspect-square bg-slate-900 rounded-3xl flex flex-col items-center justify-center border-4 border-slate-800">
               <ScanBarcode size={48} className="text-slate-600 mb-4" />
             </div>

             {erroFEFO && (
               <div className="bg-red-50 border-l-4 border-[#DC2626] p-4 rounded-r-xl shadow-sm text-sm text-red-800 font-semibold flex items-start gap-3">
                 <ShieldAlert className="text-[#DC2626] shrink-0 animate-pulse-red" size={20} />
                 {erroFEFO}
               </div>
             )}

             <input 
                type="text" 
                value={scannedLote} 
                onChange={(e) => setScannedLote(e.target.value.toUpperCase())}
                placeholder="Digitar Lote (Ex: LT-2023-B15)" 
                className="w-full text-center px-4 py-4 bg-white border border-slate-300 rounded-xl font-mono text-lg outline-none focus:border-[#1E3A8A]"
             />
             <button onClick={handleValidarScan} className="w-full py-4 bg-[#1E3A8A] text-white font-bold rounded-xl">Validar Lote FEFO</button>
           </div>
         )}

         {/* PASSO: EVIDÊNCIAS & OTP */}
         {step === 'EVIDENCIAS' && (
           <div className="space-y-4 animate-in slide-in-from-right">
             
             {MOCK_ORDEM.isAltoCusto && (
               <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                 <h4 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2"><LockKeyhole size={16}/> Token do Paciente (InputOTP)</h4>
                 <div className="flex gap-2 justify-between">
                   {[1,2,3,4,5,6].map((i) => (
                     <input key={i} type="text" maxLength={1} value={otpVal[i-1] || ''} onChange={(e) => setOtpVal(prev => prev.length < 6 ? prev + e.target.value : prev)} className="w-10 h-10 md:w-12 md:h-12 text-center text-xl font-bold border border-orange-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" />
                   ))}
                 </div>
               </div>
             )}

             <div className="space-y-3">
               <button onClick={() => setFotoCapturada(true)} className={`w-full p-4 rounded-xl border flex justify-between ${fotoCapturada ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-300'}`}>
                 <div className="flex items-center gap-3"><Camera size={20} className={fotoCapturada ? 'text-emerald-500' : 'text-slate-400'}/> <span className="font-bold text-sm">Foto da Entrega</span></div>
                 {fotoCapturada && <CheckCircle2 className="text-emerald-500"/>}
               </button>
               <button onClick={() => setAssinaturaCapturada(true)} className={`w-full p-4 rounded-xl border flex justify-between ${assinaturaCapturada ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-300'}`}>
                 <div className="flex items-center gap-3"><PenTool size={20} className={assinaturaCapturada ? 'text-emerald-500' : 'text-slate-400'}/> <span className="font-bold text-sm">Assinatura do Paciente</span></div>
                 {assinaturaCapturada && <CheckCircle2 className="text-emerald-500"/>}
               </button>
               <button onClick={() => setGpsColetado(true)} className={`w-full p-4 rounded-xl border flex justify-between ${gpsColetado ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-300'}`}>
                 <div className="flex items-center gap-3"><MapPin size={20} className={gpsColetado ? 'text-emerald-500' : 'text-slate-400'}/> <span className="font-bold text-sm">GPS e Timestamp</span></div>
                 {gpsColetado && <CheckCircle2 className="text-emerald-500"/>}
               </button>
             </div>

             <div className="pt-4">
                <button 
                  onClick={() => setStep('CONCLUIDA')}
                  disabled={!fotoCapturada || !assinaturaCapturada || !gpsColetado || (MOCK_ORDEM.isAltoCusto && otpVal.length < 6)}
                  className="w-full py-4 bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl"
                >
                  Finalizar Entrega Segura
                </button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}

function LockKeyhole({size}: {size:number}) { 
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> 
}
