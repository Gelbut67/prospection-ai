import { useEffect, useState } from 'react';
import { Users, Mail, MousePointerClick, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { getDashboardStats } from '../services/analytics';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!stats || !stats.stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Aucune donnée disponible pour le moment.</p>
        <p className="text-sm text-gray-500">Commencez par créer des prospects et des campagnes !</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Prospects',
      value: stats?.stats?.total_prospects || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Emails envoyés',
      value: stats?.stats?.emails_sent || 0,
      icon: Mail,
      color: 'bg-green-500',
    },
    {
      name: 'Taux d\'ouverture',
      value: `${stats?.stats?.open_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Taux de clic',
      value: `${stats?.stats?.click_rate || 0}%`,
      icon: MousePointerClick,
      color: 'bg-orange-500',
    },
    {
      name: 'Relances actives',
      value: stats?.stats?.active_follow_ups || 0,
      icon: Clock,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité de prospection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Statut des prospects</h2>
          <div className="space-y-3">
            {stats?.prospect_status?.length > 0 ? stats.prospect_status.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{status.status}</span>
                <span className="font-semibold">{status.count}</span>
              </div>
            )) : <p className="text-gray-500 text-center py-4">Aucun prospect</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Performance des campagnes</h2>
          {stats?.campaign_performance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.campaign_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_sent" fill="#0ea5e9" name="Envoyés" />
                <Bar dataKey="opened" fill="#10b981" name="Ouverts" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune campagne pour le moment</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Emails récents</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Prospect</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sujet</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_emails?.length > 0 ? stats.recent_emails.map((email) => (
                <tr key={email.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm">
                    {email.first_name} {email.last_name}
                  </td>
                  <td className="py-3 px-4 text-sm">{email.subject}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      email.status === 'sent' ? 'bg-green-100 text-green-800' :
                      email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {email.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    Aucun email envoyé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
