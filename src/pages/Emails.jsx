import { useEffect, useState } from 'react';
import { Mail, Eye, MousePointerClick, Reply } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmails } from '../services/emails';

export default function Emails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEmails();
  }, [statusFilter]);

  const fetchEmails = async () => {
    try {
      const data = await getEmails({ status: statusFilter });
      setEmails(data);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (email) => {
    if (email.replied_at) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <Reply className="w-3 h-3 mr-1" />
        Répondu
      </span>;
    }
    if (email.clicked_at) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <MousePointerClick className="w-3 h-3 mr-1" />
        Cliqué
      </span>;
    }
    if (email.opened_at) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Eye className="w-3 h-3 mr-1" />
        Ouvert
      </span>;
    }
    if (email.status === 'sent') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Envoyé
      </span>;
    }
    if (email.status === 'failed') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Échec
      </span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      En attente
    </span>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
        <p className="text-gray-600 mt-2">Historique et suivi de vos emails</p>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <select
            className="input md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyés</option>
            <option value="pending">En attente</option>
            <option value="failed">Échecs</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun email trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Prospect</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sujet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Campagne</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">
                      {email.first_name} {email.last_name}
                      <div className="text-xs text-gray-500">{email.prospect_email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{email.subject}</td>
                    <td className="py-3 px-4 text-sm">{email.campaign_name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        email.type === 'follow_up' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {email.type === 'follow_up' ? 'Relance' : 'Initial'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(email)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {email.sent_at 
                        ? new Date(email.sent_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
