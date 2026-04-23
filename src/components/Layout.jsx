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
    <div className="min-h-screen">
      <div className="flex">
        <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 min-h-screen fixed left-0 top-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-10 group cursor-pointer">
              <div className="bg-gradient-to-br from-primary-500 to-purple-600 p-2.5 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">YASAR PROSPECTION</h1>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg shadow-primary-500/30'
                        : item.highlight
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                        : 'text-gray-700 hover:bg-gray-100/80 font-medium hover:shadow-md'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    {item.highlight && !isActive && (
                      <span className="ml-auto text-xs bg-white/30 px-2 py-1 rounded-full font-bold">IA</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-gradient-to-t from-gray-50/80 to-transparent backdrop-blur-sm">
            <div className="text-xs font-medium text-gray-500 mb-3 truncate px-2" title={user?.email}>
              👤 {user?.email}
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 font-medium hover:shadow-md"
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
