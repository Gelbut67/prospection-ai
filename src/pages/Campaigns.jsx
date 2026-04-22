import { useEffect, useState } from 'react';
import { Plus, Play, Edit, Trash2, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CampaignModal from '../components/CampaignModal';
import { getCampaigns, deleteCampaign } from '../services/campaigns';
import { sendCampaign } from '../services/emails';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;

    try {
      await deleteCampaign(id);
      toast.success('Campagne supprimée');
      fetchCampaigns();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleLaunch = async (id) => {
    if (!confirm('Lancer cette campagne maintenant ?')) return;

    try {
      await sendCampaign(id);
      toast.success('Campagne lancée avec succès');
      fetchCampaigns();
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCampaign(null);
    fetchCampaigns();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-gray-600 mt-2">Créez et gérez vos campagnes de prospection</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle campagne
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
          <p className="text-gray-600 mb-4">Commencez par créer votre première campagne</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Créer une campagne
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Prospects</span>
                  <span className="font-medium">{campaign.total_prospects || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Envoyés</span>
                  <span className="font-medium">{campaign.emails_sent || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ouverts</span>
                  <span className="font-medium">{campaign.emails_opened || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  className="flex-1 btn-secondary text-sm"
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Détails
                </button>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleLaunch(campaign.id)}
                    className="btn-primary text-sm"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(campaign)}
                  className="text-primary-600 hover:text-primary-700 p-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
