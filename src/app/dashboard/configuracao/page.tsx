'use client';

import { Settings, User, Bell, Shield, Database, Smartphone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ConfiguracaoPage() {
  const handleSave = () => {
    toast.success('Configurações salvas e auditadas com sucesso.');
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configurações</h1>
        <p className="text-slate-500 font-medium">Gerencie as preferências do sistema e parâmetros de segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* NAV LATERAL DE CONFIGS */}
        <div className="space-y-2">
           <ConfigNavItem icon={User} label="Perfil do Usuário" active />
           <ConfigNavItem icon={Bell} label="Notificações e Alertas" />
           <ConfigNavItem icon={Shield} label="Segurança (2FA / RBAC)" />
           <ConfigNavItem icon={Database} label="Integração Supabase" />
           <ConfigNavItem icon={Smartphone} label="App Mobile Motorista" />
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="md:col-span-2 space-y-6">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader>
                 <CardTitle className="text-lg font-black">Dados Profissionais</CardTitle>
                 <CardDescription>Informações utilizadas para assinatura digital de dispensas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="name">Nome Completo</Label>
                       <Input id="name" defaultValue="Luca Reis" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="crm">Registro Profissional (CRF/CRM)</Label>
                       <Input id="crm" defaultValue="CRF-MS 12345" className="rounded-xl" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">E-mail Institucional</Label>
                    <Input id="email" defaultValue="luca.reis@vigiasaude.gov.br" className="rounded-xl" disabled />
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader>
                 <CardTitle className="text-lg font-black">Preferências de Alerta</CardTitle>
                 <CardDescription>Configure quando o Motor de Recall e Geofence devem disparar notificações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-2">
                    <div className="space-y-0.5">
                       <Label>Alertas de Desvio de Rota</Label>
                       <p className="text-xs text-slate-500">Notificar quando motorista desviar mais de 500m.</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between p-2">
                    <div className="space-y-0.5">
                       <Label>Relatório FEFO Semanal</Label>
                       <p className="text-xs text-slate-500">Enviar resumo de lotes próximos ao vencimento por e-mail.</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
              </CardContent>
           </Card>

           <div className="flex justify-end pt-4">
              <Button onClick={handleSave} className="bg-[#1A2B6D] hover:bg-[#121f4f] rounded-xl px-8 py-6 font-bold gap-2">
                 <Save size={18} /> Salvar Alterações
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ConfigNavItem({ icon: Icon, label, active }: any) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
      active ? "bg-white text-[#1A2B6D] shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
    )}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
