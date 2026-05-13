import React from 'react';
import { Database, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'database' | 'search';
  className?: string;
}

export function EmptyState({ 
  title = "Nenhum dado encontrado", 
  description = "Não há registros correspondentes aos critérios de busca ou a lista está vazia.", 
  icon = 'database',
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-dashed border-gray-300 animate-in fade-in zoom-in duration-300",
      className
    )}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 mb-4">
        {icon === 'database' ? (
          <Database className="h-10 w-10 text-gray-400" />
        ) : (
          <Search className="h-10 w-10 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}
