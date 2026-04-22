import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCampaign, updateCampaign } from '../services/campaigns';

export default function CampaignModal({ campaign, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    subject_template: '',
    body_template: '',
    status: 'draft',
    follow_up_enabled: true,
    follow_up_delay_days: 3,
    follow_up_count: 2,
  });
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (campaign) {
        await updateCampaign(campaign.id, formData);
        toast.success('Campagne mise à jour');
      } else {
        await createCampaign(formData);
        toast.success('Campagne créée');
      }
      onClose();
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    }
  };

  const generateWithAI = async () => {
    toast('Utilisez la page Découverte IA pour générer des emails personnalisés', { icon: '✨' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom de la campagne *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Objet de l'email *</label>
              <button
                type="button"
                onClick={generateWithAI}
                disabled={generatingAI}
                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                {generatingAI ? 'Génération...' : 'Générer avec l\'IA'}
              </button>
            </div>
            <input
              type="text"
              required
              className="input"
              value={formData.subject_template}
              onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
              placeholder="Utilisez {{first_name}}, {{last_name}}, {{company}}"
            />
          </div>

          <div>
            <label className="label">Corps de l'email *</label>
            <textarea
              required
              className="input"
              rows="8"
              value={formData.body_template}
              onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
              placeholder="Utilisez {{first_name}}, {{last_name}}, {{company}}, {{position}}"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Paramètres de relance</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="follow_up_enabled"
                checked={formData.follow_up_enabled}
                onChange={(e) => setFormData({ ...formData, follow_up_enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <label htmlFor="follow_up_enabled" className="text-sm text-gray-700">
                Activer les relances automatiques
              </label>
            </div>

            {formData.follow_up_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Délai entre relances (jours)</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.follow_up_delay_days}
                    onChange={(e) => setFormData({ ...formData, follow_up_delay_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Nombre de relances</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input"
                    value={formData.follow_up_count}
                    onChange={(e) => setFormData({ ...formData, follow_up_count: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {campaign ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
