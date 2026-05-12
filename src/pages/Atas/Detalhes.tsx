import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { getAtaFullDetails } from '../../services/ataService';
import type { AtaFullDetails } from '../../services/ataService';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { TableSkeleton } from '../../components/ui/TableSkeleton';
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export function AtasDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AtaFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const result = await getAtaFullDetails(id);
        if (!result) {
          setError('Ata não encontrada.');
          toast.error('Ata não encontrada');
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da ata:', err);
        setError('Ocorreu um erro ao carregar os detalhes da Ata.');
        toast.error('Erro ao carregar detalhes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl border border-gray-200"></div>
          ))}
        </div>
        <TableSkeleton rows={3} columns={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-semibold text-red-900">Erro no carregamento</h3>
        <p className="mt-1 text-sm text-red-500">{error || 'Ata não encontrada'}</p>
        <Link 
          to="/atas"
          className="mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para listagem
        </Link>
      </div>
    );
  }

  const { medicamentos, pedidos, ...ata } = data;

  // Lógica de consumo
  const consumido = pedidos
    .filter(p => p.status === 'ENTREGUE')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const comprometido = pedidos
    .filter(p => p.status === 'APROVADO' || p.status === 'EM_TRANSITO')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const disponivel = ata.valorTeto - consumido - comprometido;

  // Lógica de alertas de vigência
  const hoje = new Date();
  const fim = new Date(ata.dataFim);
  const difDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
  const isVencendo = difDias >= 0 && difDias <= 45;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const columns: ColumnDef<typeof medicamentos[0]>[] = [
    { header: 'Nome do Medicamento', accessorKey: 'nome', sortable: true },
    { header: 'P. Unitário', cell: (row) => formatCurrency(row.precoUnitario) },
    { header: 'Preço BPS', cell: (row) => formatCurrency(row.precoBPS) },
    { header: 'Preço CMED', cell: (row) => formatCurrency(row.precoCMED) },
    { header: 'Qtd Inicial', cell: (row) => row.quantidadeInicial.toLocaleString('pt-BR') },
    { header: 'Qtd Usada', cell: (row) => row.quantidadeUsada.toLocaleString('pt-BR') },
    {
      header: 'Consumo',
      cell: (row) => {
        const percent = (row.quantidadeUsada / row.quantidadeInicial) * 100;
        return <ProgressBar percentage={percent} variant="linear" className="w-32" />;
      }
    }
  ];

  // Renderização do detalhe da linha (Pedidos que usaram o medicamento)
  const renderExpandedRow = (medicamento: typeof medicamentos[0]) => {
    const pedidosComItem = pedidos.filter(p => p.itens.some(i => i.medicamentoId === medicamento.id));

    if (pedidosComItem.length === 0) {
      return <p className="text-sm text-gray-500">Nenhum pedido realizado para este item.</p>;
    }

    return (
      <div className="bg-white p-4 rounded border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Histórico de Pedidos</h4>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">ID Pedido</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Qtd Solicitada</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {pedidosComItem.map(p => {
              const itemInfo = p.itens.find(i => i.medicamentoId === medicamento.id);
              return (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-gray-800">{p.id.toUpperCase()}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(p.dataCriacao)}</td>
                  <td className="px-3 py-2 text-gray-600">{itemInfo?.quantidade.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/atas" className="hover:text-blue-600 transition-colors">Atas</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{ata.numero}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ata {ata.numero}</h1>
          <p className="mt-1 text-sm text-gray-500">Fornecedor: <span className="font-medium text-gray-900">{ata.fornecedorNome}</span></p>
        </div>
      </div>

      {isVencendo && (
        <AlertBanner variant="warning" title="Atenção: Vigência próxima do fim">
          Ata vence em {difDias} {difDias === 1 ? 'dia' : 'dias'} ({formatDate(ata.dataFim)}). Planeje novas licitações para evitar desabastecimento.
        </AlertBanner>
      )}

      {/* 4 Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-gray-500">Valor Teto</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(ata.valorTeto)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-gray-500">Consumido (Entregue)</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(consumido)}</p>
          <ProgressBar percentage={(consumido / ata.valorTeto) * 100} className="mt-3" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-gray-500">Comprometido</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{formatCurrency(comprometido)}</p>
          <ProgressBar percentage={(comprometido / ata.valorTeto) * 100} className="mt-3" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-gray-500">Saldo Disponível</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(disponivel)}</p>
          <ProgressBar percentage={(disponivel / ata.valorTeto) * 100} className="mt-3" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens da Ata</h3>
        <DataTable 
          data={medicamentos}
          columns={columns}
          renderExpandedRow={renderExpandedRow}
        />
      </div>
    </div>
  );
}
