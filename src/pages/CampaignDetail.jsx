import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCampaign, getCampaignProspects, addProspectsToCampaign, removeProspectFromCampaign } from '../services/campaigns';
import { getProspects } from '../services/prospects';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [allProspects, setAllProspects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignDetails();
    fetchAllProspects();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const [camp, prospects] = await Promise.all([
        getCampaign(id),
        getCampaignProspects(id)
      ]);
      setCampaign({ ...camp, prospects });
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProspects = async () => {
    try {
      const data = await getProspects();
      setAllProspects(data);
    } catch (error) {
      console.error('Erreur chargement prospects');
    }
  };

  const addProspects = async (prospectIds) => {
    try {
      await addProspectsToCampaign(id, prospectIds);
      toast.success('Prospects ajoutés');
      setShowAddModal(false);
      fetchCampaignDetails();
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    }
  };

  const removeProspect = async (prospectId) => {
    if (!confirm('Retirer ce prospect de la campagne ?')) return;

    try {
      await removeProspectFromCampaign(id, prospectId);
      toast.success('Prospect retiré');
      fetchCampaignDetails();
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!campaign) {
    return <div className="text-center py-8">Campagne non trouvée</div>;
  }

  const availableProspects = allProspects.filter(
    p => !campaign.prospects?.find(cp => cp.id === p.id)
  );

  return (
    <div>
      <button
        onClick={() => navigate('/campaigns')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux campagnes
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
        <p className="text-gray-600 mt-2">Gérez les prospects de cette campagne</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Prospects</h3>
          <p className="text-2xl font-bold">{campaign.prospects?.length || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Statut</h3>
          <p className="text-2xl font-bold capitalize">{campaign.status}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Relances</h3>
          <p className="text-2xl font-bold">
            {campaign.follow_up_enabled ? `${campaign.follow_up_count}x` : 'Désactivées'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Prospects de la campagne</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter des prospects
          </button>
        </div>

        {campaign.prospects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun prospect dans cette campagne
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Entreprise</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaign.prospects.map((prospect) => (
                  <tr key={prospect.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium">
                      {prospect.first_name} {prospect.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm">{prospect.email}</td>
                    <td className="py-3 px-4 text-sm">{prospect.company || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {prospect.campaign_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeProspect(prospect.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProspectsModal
          prospects={availableProspects}
          onAdd={addProspects}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AddProspectsModal({ prospects, onAdd, onClose }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleProspect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Ajouter des prospects</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {prospects.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Tous les prospects sont déjà dans la campagne</p>
        ) : (
          <>
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {prospects.map((prospect) => (
                <label
                  key={prospect.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(prospect.id)}
                    onChange={() => toggleProspect(prospect.id)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {prospect.first_name} {prospect.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{prospect.email}</p>
                  </div>
                  {prospect.company && (
                    <span className="text-sm text-gray-500">{prospect.company}</span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onAdd(selectedIds)}
                disabled={selectedIds.length === 0}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
              <button onClick={onClose} className="btn-secondary">
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
