'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  Truck, 
  ShieldAlert, 
  FileText, 
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShoppingCart,
  PackageCheck,
  Building2,
  Timer,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MENU_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Estoque FEFO', href: '/dashboard/estoque' },
  { icon: Users, label: 'Pacientes/CRM', href: '/dashboard/pacientes' },
  { icon: Truck, label: 'Monitoramento', href: '/dashboard/monitoramento' },
  { icon: ShoppingCart, label: 'Compras', href: '/dashboard/compras' },
  { icon: PackageCheck, label: 'Entregas', href: '/dashboard/entregas' },
  { icon: Building2, label: 'Fornecedores', href: '/dashboard/fornecedores' },
  { icon: Timer, label: 'Lead Time', href: '/dashboard/lead-time' },
  { icon: ShieldAlert, label: 'Motor de Recall', href: '/dashboard/recall' },
  { icon: ShieldCheck, label: 'Auditoria Master', href: '/dashboard/auditoria' },
  { icon: FileText, label: 'Relatórios', href: '/dashboard/relatorios' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside
        className={cn(
          'relative flex flex-col bg-[#1E3A8A] text-white transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 p-5 overflow-hidden', collapsed && 'justify-center px-0')}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="text-[#1E3A8A]" size={22} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-black text-lg leading-none text-white truncate">Vigia Saúde</h2>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1 truncate">Municipio Teste / MS</p>
            </div>
          )}
        </div>

        <Separator className="bg-white/10" />

        {/* Menu items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-black text-blue-200/50 uppercase tracking-widest px-3 mb-3">Menu Principal</p>
          )}
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 font-bold text-sm group',
                  collapsed ? 'justify-center p-3' : 'px-4 py-3',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 space-y-1">
          <Separator className="bg-white/10 mb-2" />
          <button
            onClick={() => router.push('/dashboard/configuracao')}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-all',
              collapsed && 'justify-center px-3'
            )}
            title={collapsed ? 'Configuração' : undefined}
          >
            <Settings size={20} className="shrink-0" />
            {!collapsed && <span>Configuração</span>}
          </button>
          <button
            onClick={async () => {
              toast.info('Encerrando sessão auditada...');
              try {
                const { supabase } = await import('@/lib/supabase');
                await supabase.auth.signOut();
              } catch (_) {}
              router.push('/');
            }}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-red-300 hover:bg-red-500/20 hover:text-red-100 transition-all',
              collapsed && 'justify-center px-3'
            )}
            title={collapsed ? 'Sair do Sistema' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Sair do Sistema</span>}
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md text-[#1E3A8A] hover:bg-slate-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Menu size={20} />
            </button>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-slate-400">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Buscador Global (S/N, CPF, Lote)..." 
                className="text-xs font-medium bg-transparent border-none outline-none w-64 text-slate-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.toUpperCase();
                    if (val.startsWith('LT-')) {
                      router.push(`/dashboard/recall?q=${val}`);
                      toast.info(`Iniciando investigação de Lote: ${val}`);
                    } else if (val.length >= 11) {
                      router.push(`/dashboard/pacientes?q=${val}`);
                      toast.info(`Buscando registro de CPF: ${val}`);
                    } else {
                      toast.warning('Insira um Lote (LT-...) ou CPF completo.');
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-slate-400">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none">Luca Reis</p>
                <p className="text-[10px] font-bold text-emerald-600 leading-none mt-1 uppercase">Farmacêutico RT</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[#1E3A8A]">LR</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
