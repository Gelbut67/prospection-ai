import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ProspectModal from '../components/ProspectModal';
import { getProspects, deleteProspect } from '../services/prospects';

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);

  useEffect(() => {
    fetchProspects();
  }, [statusFilter]);

  const fetchProspects = async () => {
    try {
      const data = await getProspects({ status: statusFilter, search: searchTerm });
      setProspects(data);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) return;

    try {
      await deleteProspect(id);
      toast.success('Prospect supprimé');
      fetchProspects();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (prospect) => {
    setEditingProspect(prospect);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProspect(null);
    fetchProspects();
  };

  const exportToExcel = () => {
    if (prospects.length === 0) {
      toast.error('Aucun prospect à exporter');
      return;
    }

    // Préparer les données pour l'export
    const exportData = prospects.map(p => ({
      'Prénom': p.first_name,
      'Nom': p.last_name,
      'Email': p.email,
      'Téléphone': p.phone || '',
      'Entreprise': p.company,
      'Poste': p.position || '',
      'Site web': p.website || '',
      'Ville': p.city || '',
      'Département': p.department || '',
      'Secteur': p.sector || '',
      'Taille entreprise': p.company_size || '',
      'Type de contenant': p.container_type || '',
      'Score de pertinence': p.relevance_score || '',
      'Statut': p.status,
      'Tags': p.tags || '',
      'Notes': p.notes || '',
      'Raison découverte': p.discovery_reason || '',
      'Date création': new Date(p.created_at).toLocaleDateString('fr-FR')
    }));

    // Créer le fichier Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospects');

    // Télécharger le fichier
    const fileName = `prospects_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success(`${prospects.length} prospects exportés !`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-600 mt-2">Gérez votre base de prospects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter Excel
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouveau prospect
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un prospect..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchProspects()}
            />
          </div>
          <select
            className="input md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="qualified">Qualifié</option>
            <option value="converted">Converti</option>
            <option value="lost">Perdu</option>
          </select>
          <button onClick={fetchProspects} className="btn-secondary">
            Rechercher
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun prospect trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Entreprise</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Poste</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">
                      {prospect.first_name} {prospect.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{prospect.email}</td>
                    <td className="py-3 px-4 text-sm">{prospect.company || '-'}</td>
                    <td className="py-3 px-4 text-sm">{prospect.position || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prospect.status === 'converted' ? 'bg-green-100 text-green-800' :
                        prospect.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                        prospect.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        prospect.status === 'lost' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(prospect)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prospect.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProspectModal
          prospect={editingProspect}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
