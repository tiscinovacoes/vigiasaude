'use client';

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
  Search
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MENU_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Estoque FEFO', href: '/dashboard/estoque' },
  { icon: Users, label: 'Pacientes/CRM', href: '/dashboard/pacientes' },
  { icon: Truck, label: 'Monitoramento', href: '/dashboard/monitoramento' },
  { icon: ShieldAlert, label: 'Motor de Recall', href: '/dashboard/recall' },
  { icon: FileText, label: 'Relatórios', href: '/dashboard/relatorios' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="bg-[#1E3A8A] border-none text-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <ShieldAlert className="text-[#1E3A8A]" size={24} />
            </div>
            <div>
              <h2 className="font-black text-xl leading-none text-white">Vigia Saúde</h2>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Municipio Teste / MS</p>
            </div>
          </div>
        </div>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-200/50 mb-2 px-6 uppercase text-[10px] font-black tracking-tighter">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarMenu className="px-3">
              {MENU_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-6 rounded-xl transition-all duration-200",
                      pathname === item.href 
                        ? "bg-white/20 text-white shadow-lg" 
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href} className="w-full h-full flex items-center">
                      <item.icon size={20} className="shrink-0" />
                      <span className="font-bold text-sm ml-2">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <div className="mt-auto p-4 flex flex-col gap-2">
          <Separator className="bg-white/10 mb-2" />
          <Button variant="ghost" className="justify-start gap-4 text-blue-100 hover:bg-white/10 hover:text-white group">
            <Settings size={20} />
            <span className="font-bold text-sm">Configuração</span>
          </Button>
          <Button 
            onClick={() => {
              toast.info("Encerrando sessão auditada...");
              router.push('/');
            }} 
            variant="ghost" 
            className="justify-start gap-4 text-red-300 hover:bg-red-500/20 hover:text-red-100"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm">Sair do Sistema</span>
          </Button>
        </div>
      </Sidebar>

      <SidebarInset className="bg-slate-50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 text-slate-400">
               <Search size={16}/>
               <span className="text-xs font-medium">Buscador Global (S/N, CPF, Lote)</span>
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
