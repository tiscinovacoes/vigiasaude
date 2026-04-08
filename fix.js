const fs = require('fs');

function fixInputOtp() {
  const f = 'src/components/ui/input-otp.tsx';
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace('lucide-material', 'lucide-react');
  fs.writeFileSync(f, c);
}

function fixResizable() {
  const f = 'src/components/ui/resizable.tsx';
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace('import * as ResizablePrimitive from "react-resizable-panels"', 'import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"');
  c = c.replaceAll('ResizablePrimitive.PanelGroup', 'PanelGroup');
  c = c.replaceAll('ResizablePrimitive.PanelResizeHandle', 'PanelResizeHandle');
  c = c.replaceAll('ResizablePrimitive.Panel', 'Panel');
  fs.writeFileSync(f, c);
}

function fixRelatorios() {
  const f = 'src/app/dashboard/relatorios/page.tsx';
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('cn ')) {
     c = c.replace(/import \{.*?\} from "lucide-react";/s, match => match + '\nimport { cn } from "@/lib/utils";\n');
  }
  fs.writeFileSync(f, c);
}

fixInputOtp();
fixResizable();
fixRelatorios();

console.log('Fixed');
