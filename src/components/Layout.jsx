import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  BarChart3, 
  Megaphone,
  Sparkles,
  Target,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Découverte IA', href: '/discovery', icon: Target, highlight: true },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Campagnes', href: '/campaigns', icon: Megaphone },
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">Prospection AI</h1>
            </div>
            
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : item.highlight
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 font-medium shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    {item.highlight && !isActive && (
                      <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">IA</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2 truncate" title={user?.email}>
              {user?.email}
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
