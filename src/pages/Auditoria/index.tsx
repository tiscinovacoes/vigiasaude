import { useState, useMemo } from 'react';
import { mockAuditoria } from '../../lib/mockData';
import { DataTable, ColumnDef } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Filter, Download, Terminal, Search, User } from 'lucide-react';

export function AuditoriaLista() {
  const [periodo, setPeriodo] = useState('90');
  const [tipoAcao, setTipoAcao] = useState('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  // Ordenar por data (mais recente primeiro)
  const dataSorted = useMemo(() => {
    return [...mockAuditoria].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, []);

  // Filtragem (Simulada para UI)
  const filteredData = useMemo(() => {
    return dataSorted.filter(log => {
      const matchAcao = tipoAcao === 'TODOS' || log.acao === tipoAcao;
      const matchUser = filtroUsuario === '' || log.usuarioId.toLowerCase().includes(filtroUsuario.toLowerCase());
      return matchAcao && matchUser;
    });
  }, [dataSorted, tipoAcao, filtroUsuario]);

  const columns: ColumnDef<typeof filteredData[0]>[] = [
    {
      header: 'Data/Hora',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (row) => (
        <span className="text-gray-600 font-mono text-xs">
          {new Date(row.timestamp).toLocaleString('pt-BR')}
        </span>
      )
    },
    {
      header: 'Usuário',
      accessorKey: 'usuarioId',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-3 h-3 text-gray-500" />
          </div>
          <span className="font-medium text-gray-900">{row.usuarioId}</span>
        </div>
      )
    },
    {
      header: 'Ação',
      accessorKey: 'acao',
      sortable: true,
      cell: (row) => {
        const variants: Record<string, any> = {
          'CRIACAO': 'green',
          'ATUALIZACAO': 'blue',
          'APROVACAO': 'blue',
          'BLOQUEIO': 'red',
          'EXCLUSAO': 'red'
        };
        return <StatusBadge status={row.acao} variant={variants[row.acao] || 'gray'} />;
      }
    },
    {
      header: 'Recurso',
      accessorKey: 'entidadeId',
      cell: (row) => <span className="uppercase text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{row.entidadeId}</span>
    },
    {
      header: 'Resumo',
      accessorKey: 'detalhes',
      cell: (row) => <span className="text-gray-600 truncate max-w-[300px] inline-block">{row.detalhes}</span>
    }
  ];

  const renderExpandedRow = (log: typeof filteredData[0]) => (
    <div className="p-6 bg-gray-50 border-y border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bloco de Dados (Antes/Depois) */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Rastreabilidade de Dados
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Estado Anterior</p>
              {log.estadoAnterior ? (
                <pre className="text-[11px] text-gray-600 font-mono overflow-auto max-h-40">
                  {JSON.stringify(log.estadoAnterior, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-400 italic">Nulo (Criação)</p>
              )}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Estado Novo</p>
              <pre className="text-[11px] text-gray-800 font-mono overflow-auto max-h-40">
                {JSON.stringify(log.estadoNovo, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Bloco de Contexto */}
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Justificativa da Alteração</h4>
            <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200 border-l-4 border-l-blue-500 italic">
              "{log.justificativa || 'Nenhuma justificativa fornecida.'}"
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Endereço IP</h4>
              <code className="text-sm font-mono text-gray-900">{log.ip || '0.0.0.0'}</code>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">ID do Evento</h4>
              <code className="text-sm font-mono text-gray-500">#{log.id}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoria e Compliance TCU</h1>
          <p className="mt-1 text-sm text-gray-500">Registro histórico imutável de todas as ações sensíveis no sistema.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Exportar Relatório PDF/CSV
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Período</label>
          <div className="relative">
            <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 pr-8 outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <Filter className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Ação</label>
          <select 
            value={tipoAcao} 
            onChange={(e) => setTipoAcao(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            <option value="TODOS">Todas as ações</option>
            <option value="CRIACAO">Criação</option>
            <option value="ATUALIZACAO">Atualização</option>
            <option value="APROVACAO">Aprovação</option>
            <option value="BLOQUEIO">Bloqueio</option>
          </select>
        </div>

        <div className="flex-1 space-y-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase text-gray-400">Buscar Usuário</label>
          <div className="relative">
            <input 
              type="text"
              placeholder="Digite o ID ou nome..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10 outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable 
          data={filteredData} 
          columns={columns}
          renderExpandedRow={renderExpandedRow}
        />
      </div>
    </div>
  );
}
