import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { getDashboardStats, getCampaignAnalytics } from '../services/analytics';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashStats, campaignStats] = await Promise.all([
        getDashboardStats(),
        getCampaignAnalytics()
      ]);
      setStats({ ...dashStats, campaigns: campaignStats });
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Analysez les performances de vos campagnes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Taux d'ouverture</h3>
          <p className="text-3xl font-bold text-primary-600">{stats?.stats.open_rate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.stats.emails_opened || 0} / {stats?.stats.emails_sent || 0} emails
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Taux de clic</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.stats.click_rate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.stats.emails_clicked || 0} clics
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Emails envoyés</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.stats.emails_sent || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total envoyés</p>
        </div>

        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Relances actives</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.stats.active_follow_ups || 0}</p>
          <p className="text-xs text-gray-500 mt-1">En cours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Performance par campagne</h2>
          {stats?.campaign_performance && stats.campaign_performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.campaign_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sent" fill="#0ea5e9" name="Envoyés" />
                <Bar dataKey="opened" fill="#10b981" name="Ouverts" />
                <Bar dataKey="clicked" fill="#f59e0b" name="Cliqués" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée disponible</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Répartition des prospects</h2>
          {stats?.prospect_status && stats.prospect_status.length > 0 ? (
            <div className="space-y-4">
              {stats.prospect_status.map((status) => {
                const total = stats.prospect_status.reduce((sum, s) => sum + s.count, 0);
                const percentage = ((status.count / total) * 100).toFixed(1);
                
                return (
                  <div key={status.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{status.status}</span>
                      <span className="text-sm text-gray-600">{status.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Détails des campagnes</h2>
        {stats?.campaign_performance && stats.campaign_performance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Campagne</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Envoyés</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ouverts</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cliqués</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Taux d'ouverture</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Taux de clic</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaign_performance.map((campaign) => {
                  const openRate = campaign.total_sent > 0 
                    ? ((campaign.opened / campaign.total_sent) * 100).toFixed(1)
                    : 0;
                  const clickRate = campaign.total_sent > 0
                    ? ((campaign.clicked / campaign.total_sent) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={campaign.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-medium">{campaign.name}</td>
                      <td className="py-3 px-4 text-sm">{campaign.total_sent}</td>
                      <td className="py-3 px-4 text-sm">{campaign.opened}</td>
                      <td className="py-3 px-4 text-sm">{campaign.clicked}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium text-primary-600">{openRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium text-green-600">{clickRate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Aucune campagne disponible</p>
        )}
      </div>
    </div>
  );
}
