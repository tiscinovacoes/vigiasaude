'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserSearch, CreditCard, Save, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api, Paciente } from '@/lib/api';
import { validateCNS, formatCNS, normalizeCPF, normalizeCNS } from '@/utils/validate-cns';

export default function VinculoSUSPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null);
  const [cnsError, setCnsError] = useState('');
  const [cartaoSusInvalidCount, setCartaoSusInvalidCount] = useState(0);

  // Monitora CPF e CNS — busca automática
  useEffect(() => {
    async function buscarPaciente() {
      const cpfLimpo = normalizeCPF(cpf);
      const cnsLimpo = normalizeCNS(cartaoSus);
      const identificador = cpfLimpo || cnsLimpo;

      if ((cpfLimpo.length === 11 || cnsLimpo.length === 15) && identificador) {
        setIsSearching(true);
        const resultado = await api.getPacienteByIdentifier(identificador);
        setPacienteEncontrado(resultado);
        setIsSearching(false);

        if (resultado) {
          toast.success('✅ Paciente encontrado! Dados carregados.');
        }
      } else {
        setPacienteEncontrado(null);
      }
    }

    const debounceTimer = setTimeout(buscarPaciente, 300);
    return () => clearTimeout(debounceTimer);
  }, [cpf, cartaoSus]);

  // Validação CNS onBlur
  const handleCartaoSusBlur = () => {
    const cnsLimpo = normalizeCNS(cartaoSus);
    if (cnsLimpo.length === 15 && !validateCNS(cnsLimpo)) {
      setCnsError('Número de Cartão SUS inválido conforme algoritmo do Ministério da Saúde');
      setCartaoSusInvalidCount((prev) => {
        const novoCount = prev + 1;
        // TODO: Log SUSPEITA_DADOS_INVALIDOS se novoCount === 3
        return novoCount;
      });
      toast.error('❌ CNS inválido');
    } else {
      setCnsError('');
    }
  };

  // Salvar vínculo
  const handleSalvar = async () => {
    const cpfLimpo = normalizeCPF(cpf);
    const cnsLimpo = normalizeCNS(cartaoSus);

    // Validações
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      toast.error('❌ CPF inválido');
      return;
    }

    if (cnsLimpo && cnsLimpo.length === 15 && !validateCNS(cnsLimpo)) {
      toast.error('❌ CNS inválido');
      return;
    }

    if (!pacienteEncontrado) {
      toast.error('❌ Paciente não encontrado');
      return;
    }

    try {
      // Atualizar paciente com CNS (se fornecido)
      if (cnsLimpo) {
        const { error } = await api.supabase
          .from('pacientes')
          .update({ cartao_sus: cnsLimpo })
          .eq('id', pacienteEncontrado.id);

        if (error) throw error;
      }

      // Log auditoria
      await api.auditoriaAPI.log('VINCULAR_PACIENTE_CNS', 'pacientes', {
        paciente_id: pacienteEncontrado.id,
        cpf: cpfLimpo,
        cartao_sus: cnsLimpo || null,
      });

      toast.success('✅ Vínculo salvo com sucesso!');
      setTimeout(() => router.push('/dashboard/pacientes'), 1000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('❌ Erro ao salvar vínculo');
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/pacientes')}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-black text-[#1E293B]">Vínculo de Paciente</h1>
        <Badge className="bg-blue-100 text-blue-700">CNS / CPF</Badge>
      </div>

      {/* Card Principal */}
      <Card className="shadow-md border-l-4 border-l-[#1E3A8A]">
        <CardHeader>
          <CardTitle className="text-[#1E293B] flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-[#1E3A8A]" />
            Busca Automática por CPF ou Cartão SUS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campos de entrada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPF */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                CPF do Paciente *
              </label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="border-slate-300"
              />
            </div>

            {/* Cartão SUS */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                Cartão Nacional de Saúde (CNS)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-10 border-slate-300"
                  placeholder="000 0000 0000 0000"
                  value={cartaoSus}
                  onChange={(e) => setCartaoSus(formatCNS(e.target.value))}
                  onBlur={handleCartaoSusBlur}
                  aria-invalid={!!cnsError}
                />
              </div>
              {cnsError && <p className="text-xs text-red-600 mt-1">{cnsError}</p>}
            </div>
          </div>

          {/* Resultado da busca ou Skeleton */}
          {isSearching ? (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : pacienteEncontrado ? (
            // Paciente encontrado
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong className="block mb-2">✅ Paciente encontrado!</strong>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Nome:</strong> {pacienteEncontrado.nome_completo}
                  </p>
                  <p>
                    <strong>CPF:</strong> {pacienteEncontrado.cpf}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {pacienteEncontrado.endereco_completo}
                  </p>
                  {pacienteEncontrado.telefone && (
                    <p>
                      <strong>Telefone:</strong> {pacienteEncontrado.telefone}
                    </p>
                  )}
                  {pacienteEncontrado.cartao_sus && (
                    <p>
                      <strong>CNS Atual:</strong> {formatCNS(pacienteEncontrado.cartao_sus)}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : cpf.replace(/\D/g, '').length === 11 || cartaoSus.replace(/\D/g, '').length === 15 ? (
            // Não encontrado
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Paciente não encontrado.</strong> Você pode criar um novo cadastro em{' '}
                <span className="font-semibold text-amber-900">/dashboard/pacientes</span>
              </AlertDescription>
            </Alert>
          ) : (
            // Aguardando entrada
            <Alert className="bg-blue-50 border-blue-200">
              <UserSearch className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Digite um CPF (11 dígitos) ou Cartão SUS (15 dígitos) para buscar um paciente
              </AlertDescription>
            </Alert>
          )}

          {/* Botão Salvar */}
          <Button
            onClick={handleSalvar}
            disabled={!pacienteEncontrado || !!cnsError}
            className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-black h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Vínculo
          </Button>

          {/* Informativo */}
          <Alert className="bg-slate-50 border-slate-200">
            <AlertCircle className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700 text-sm">
              <strong>Validação CNS:</strong> O Cartão SUS é validado conforme algoritmo do Ministério da Saúde. Formatos antigos (1, 2) e novos (7, 8, 9) são suportados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
