import { Link } from 'react-router';
import { mockPedidosCompra, mockAtas } from '../../lib/mockData';
import { DataTable, ColumnDef } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CheckCircle } from 'lucide-react';

export function PedidosLista() {
  const data = mockPedidosCompra.map(pedido => {
    const ata = mockAtas.find(a => a.id === pedido.ataId);
    return {
      ...pedido,
      ataNumero: ata?.numero || 'Desconhecida'
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const columns: ColumnDef<typeof data[0]>[] = [
    {
      header: 'ID do Pedido',
      accessorKey: 'id',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-900 uppercase">{row.id}</span>
    },
    {
      header: 'Ata Vinculada',
      accessorKey: 'ataNumero',
      sortable: true,
    },
    {
      header: 'Data de Criação',
      accessorKey: 'dataCriacao',
      sortable: true,
      cell: (row) => formatDate(row.dataCriacao),
    },
    {
      header: 'Valor Total',
      accessorKey: 'valorTotal',
      sortable: true,
      cell: (row) => formatCurrency(row.valorTotal),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        let variant: any = 'gray';
        if (row.status === 'APROVADO') variant = 'blue';
        if (row.status === 'EM_TRANSITO') variant = 'yellow';
        if (row.status === 'ENTREGUE') variant = 'green';
        if (row.status === 'CANCELADO') variant = 'red';
        if (row.status === 'PENDENTE') variant = 'orange';
        
        return <StatusBadge status={row.status} variant={variant} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Compra</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe todos os PdCs registrados no sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <DataTable 
          data={data} 
          columns={columns} 
          rowActions={(row) => {
            if (row.status === 'EM_TRANSITO') {
              return (
                <Link 
                  to={`/confirmar-entrega/${row.id}`} 
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Confirmar Entrega</span>
                </Link>
              );
            }
            return null;
          }}
        />
      </div>
    </div>
  );
}
