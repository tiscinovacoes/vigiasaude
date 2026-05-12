import { Link, useLocation } from 'react-router';
import { LayoutDashboard, ShoppingCart, Truck, Menu } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const location = useLocation();

  const links = [
    { name: 'Comprador', path: '/comprador', icon: ShoppingCart },
    { name: 'Fornecedor', path: '/fornecedor', icon: Truck },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-blue-600 text-xl">
            <LayoutDashboard className="h-6 w-6" />
            Vigia Saúde
          </Link>
        </div>

        <nav className="mt-6 flex flex-col gap-2 px-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
