import { Menu, Bell, UserCircle } from 'lucide-react';
import { Link } from 'react-router';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-5 w-5" />
        </button>
        <Link to="/auth" className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <span className="hidden text-sm font-medium text-gray-700 sm:block">Sair</span>
        </Link>
      </div>
    </header>
  );
}
