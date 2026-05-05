import { useState } from 'react';
import { Search, Sparkles, Download, Mail, ExternalLink, Target, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverProspects, generatePersonalizedEmail } from '../services/discovery';
import { bulkCreateProspects } from '../services/prospects';

const SECTORS = [
  'Tous secteurs',
  'Vins & Spiritueux',
  'Brasseries craft',
  'Agroalimentaire',
  'Cosmétique & Parfumerie',
  'Pharmacie & Parapharmacie',
  'Huiles & Condiments',
  'Miel & Confitures',
  'Produits laitiers',
  'Épicerie fine Bio',
  'Chimie & Produits d\'entretien',
  'Compléments alimentaires'
];

const CONTAINER_TYPES = [
  'Tous types',
  'Bouteilles (vin, bière, spiritueux)',
  'Pots en verre',
  'Flacons cosmétiques',
  'Flacons pharmaceutiques',
  'Canettes',
  'Emballages alimentaires',
  'Bidons industriels'
];

const COMPANY_SIZES = [
  'Toutes tailles',
  'Artisan (<20 employés)',
  'PME (20-100 employés)',
  'ETI (100-500 employés)',
  'Grande entreprise (500+)'
];

const DEPARTMENTS = [
  { code: '', name: 'Tous les départements' },
  { code: '01', name: '01 - Ain' },
  { code: '02', name: '02 - Aisne' },
  { code: '03', name: '03 - Allier' },
  { code: '04', name: '04 - Alpes-de-Haute-Provence' },
  { code: '05', name: '05 - Hautes-Alpes' },
  { code: '06', name: '06 - Alpes-Maritimes' },
  { code: '07', name: '07 - Ardèche' },
  { code: '08', name: '08 - Ardennes' },
  { code: '09', name: '09 - Ariège' },
  { code: '10', name: '10 - Aube' },
  { code: '11', name: '11 - Aude' },
  { code: '12', name: '12 - Aveyron' },
  { code: '13', name: '13 - Bouches-du-Rhône' },
  { code: '14', name: '14 - Calvados' },
  { code: '15', name: '15 - Cantal' },
  { code: '16', name: '16 - Charente' },
  { code: '17', name: '17 - Charente-Maritime' },
  { code: '18', name: '18 - Cher' },
  { code: '19', name: '19 - Corrèze' },
  { code: '2A', name: '2A - Corse-du-Sud' },
  { code: '2B', name: '2B - Haute-Corse' },
  { code: '21', name: '21 - Côte-d\'Or' },
  { code: '22', name: '22 - Côtes-d\'Armor' },
  { code: '23', name: '23 - Creuse' },
  { code: '24', name: '24 - Dordogne' },
  { code: '25', name: '25 - Doubs' },
  { code: '26', name: '26 - Drôme' },
  { code: '27', name: '27 - Eure' },
  { code: '28', name: '28 - Eure-et-Loir' },
  { code: '29', name: '29 - Finistère' },
  { code: '30', name: '30 - Gard' },
  { code: '31', name: '31 - Haute-Garonne' },
  { code: '32', name: '32 - Gers' },
  { code: '33', name: '33 - Gironde' },
  { code: '34', name: '34 - Hérault' },
  { code: '35', name: '35 - Ille-et-Vilaine' },
  { code: '36', name: '36 - Indre' },
  { code: '37', name: '37 - Indre-et-Loire' },
  { code: '38', name: '38 - Isère' },
  { code: '39', name: '39 - Jura' },
  { code: '40', name: '40 - Landes' },
  { code: '41', name: '41 - Loir-et-Cher' },
  { code: '42', name: '42 - Loire' },
  { code: '43', name: '43 - Haute-Loire' },
  { code: '44', name: '44 - Loire-Atlantique' },
  { code: '45', name: '45 - Loiret' },
  { code: '46', name: '46 - Lot' },
  { code: '47', name: '47 - Lot-et-Garonne' },
  { code: '48', name: '48 - Lozère' },
  { code: '49', name: '49 - Maine-et-Loire' },
  { code: '50', name: '50 - Manche' },
  { code: '51', name: '51 - Marne' },
  { code: '52', name: '52 - Haute-Marne' },
  { code: '53', name: '53 - Mayenne' },
  { code: '54', name: '54 - Meurthe-et-Moselle' },
  { code: '55', name: '55 - Meuse' },
  { code: '56', name: '56 - Morbihan' },
  { code: '57', name: '57 - Moselle' },
  { code: '58', name: '58 - Nièvre' },
  { code: '59', name: '59 - Nord' },
  { code: '60', name: '60 - Oise' },
  { code: '61', name: '61 - Orne' },
  { code: '62', name: '62 - Pas-de-Calais' },
  { code: '63', name: '63 - Puy-de-Dôme' },
  { code: '64', name: '64 - Pyrénées-Atlantiques' },
  { code: '65', name: '65 - Hautes-Pyrénées' },
  { code: '66', name: '66 - Pyrénées-Orientales' },
  { code: '67', name: '67 - Bas-Rhin' },
  { code: '68', name: '68 - Haut-Rhin' },
  { code: '69', name: '69 - Rhône' },
  { code: '70', name: '70 - Haute-Saône' },
  { code: '71', name: '71 - Saône-et-Loire' },
  { code: '72', name: '72 - Sarthe' },
  { code: '73', name: '73 - Savoie' },
  { code: '74', name: '74 - Haute-Savoie' },
  { code: '75', name: '75 - Paris' },
  { code: '76', name: '76 - Seine-Maritime' },
  { code: '77', name: '77 - Seine-et-Marne' },
  { code: '78', name: '78 - Yvelines' },
  { code: '79', name: '79 - Deux-Sèvres' },
  { code: '80', name: '80 - Somme' },
  { code: '81', name: '81 - Tarn' },
  { code: '82', name: '82 - Tarn-et-Garonne' },
  { code: '83', name: '83 - Var' },
  { code: '84', name: '84 - Vaucluse' },
  { code: '85', name: '85 - Vendée' },
  { code: '86', name: '86 - Vienne' },
  { code: '87', name: '87 - Haute-Vienne' },
  { code: '88', name: '88 - Vosges' },
  { code: '89', name: '89 - Yonne' },
  { code: '90', name: '90 - Territoire de Belfort' },
  { code: '91', name: '91 - Essonne' },
  { code: '92', name: '92 - Hauts-de-Seine' },
  { code: '93', name: '93 - Seine-Saint-Denis' },
  { code: '94', name: '94 - Val-de-Marne' },
  { code: '95', name: '95 - Val-d\'Oise' },
  { code: '971', name: '971 - Guadeloupe' },
  { code: '972', name: '972 - Martinique' },
  { code: '973', name: '973 - Guyane' },
  { code: '974', name: '974 - La Réunion' },
  { code: '976', name: '976 - Mayotte' }
];

export default function Discovery() {
  const [criteria, setCriteria] = useState({
    sector: 'Vins & Spiritueux',
    location: '',
    department: '',
    containerType: 'Tous types',
    companySize: 'PME (20-100 employés)',
    keywords: '',
    customPrompt: '',
    count: 10
  });

  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [emailPreview, setEmailPreview] = useState(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  
  // Chat avec Groq
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('chat-groq', {
        body: {
          message: userMessage,
          context: {
            criteria,
            prospects: prospects.map(p => ({
              name: p.company_name,
              city: p.city,
              sector: p.sector
            }))
          }
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.data?.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
      } else {
        toast.error('Erreur lors du chat');
      }
    } catch (error) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setProspects([]);
    setSelectedIds(new Set());

    try {
      const data = await discoverProspects(criteria);
      
      if (data.success) {
        setProspects(data.prospects);
        toast.success(`${data.count} prospects trouvés par l'IA !`);
      } else {
        toast.error('Erreur lors de la recherche');
      }
    } catch (error) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const selected = prospects.filter((_, i) => selectedIds.has(i));
    
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins un prospect');
      return;
    }

    try {
      const toImport = selected.map(p => {
        const [firstName, ...lastNameParts] = (p.contact_name || 'Contact Inconnu').split(' ');
        return {
          first_name: firstName,
          last_name: lastNameParts.join(' ') || '-',
          email: p.email,
          company: p.company_name,
          position: p.contact_position,
          website: p.website ? `https://${p.website}` : null,
          city: p.city,
          department: p.department,
          sector: p.sector,
          company_size: p.company_size,
          container_type: p.container_type,
          relevance_score: p.relevance_score,
          discovery_reason: p.reason,
          tags: `ia-discovery,${p.sector}`.toLowerCase().replace(/\s+/g, '-')
        };
      });

      const imported = await bulkCreateProspects(toImport);
      toast.success(`${imported.length} prospects importés !`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Erreur lors de l\'import : ' + error.message);
    }
  };

  const handleGenerateEmail = async (prospect) => {
    setGeneratingEmail(true);
    setEmailPreview({ prospect, loading: true });

    try {
      const email = await generatePersonalizedEmail(prospect);
      setEmailPreview({ prospect, ...email });
    } catch (error) {
      toast.error('Erreur lors de la génération : ' + error.message);
      setEmailPreview(null);
    } finally {
      setGeneratingEmail(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-xl">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Découverte de Prospects par IA</h1>
            <p className="text-gray-600 mt-1">Laissez l'IA trouver les entreprises qui ont besoin de vos étiquettes</p>
          </div>
        </div>
      </div>

      <div className="card mb-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          Critères de ciblage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Secteur d'activité</label>
            <select
              className="input"
              value={criteria.sector}
              onChange={(e) => setCriteria({ ...criteria, sector: e.target.value })}
            >
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Type de contenants</label>
            <select
              className="input"
              value={criteria.containerType}
              onChange={(e) => setCriteria({ ...criteria, containerType: e.target.value })}
            >
              {CONTAINER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Taille d'entreprise</label>
            <select
              className="input"
              value={criteria.companySize}
              onChange={(e) => setCriteria({ ...criteria, companySize: e.target.value })}
            >
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Département</label>
            <select
              className="input"
              value={criteria.department}
              onChange={(e) => setCriteria({ ...criteria, department: e.target.value })}
            >
              {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Ville / Région (optionnel)</label>
            <input
              type="text"
              className="input"
              placeholder="Bordeaux, Île-de-France..."
              value={criteria.location}
              onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Mots-clés spécifiques</label>
            <input
              type="text"
              className="input"
              placeholder="bio, premium, export, artisanal..."
              value={criteria.keywords}
              onChange={(e) => setCriteria({ ...criteria, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Nombre de prospects</label>
            <input
              type="number"
              min="5"
              max="30"
              className="input"
              value={criteria.count}
              onChange={(e) => setCriteria({ ...criteria, count: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="label flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            Instructions personnalisées pour l'IA (optionnel)
          </label>
          <textarea
            className="input"
            rows="3"
            placeholder="Ex: Je cherche des vignerons qui exportent à l'international, avec une production bio certifiée, et qui utilisent des bouteilles premium..."
            value={criteria.customPrompt}
            onChange={(e) => setCriteria({ ...criteria, customPrompt: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Ajoutez des détails spécifiques pour affiner la recherche de l'IA
          </p>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 text-lg py-3 px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                L'IA recherche...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Lancer la recherche
              </>
            )}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="btn-secondary flex items-center gap-2 py-3 px-6"
          >
            <Sparkles className="w-5 h-5" />
            {showChat ? 'Masquer le chat' : 'Discuter avec Groq'}
          </button>
        </div>
      </div>

      {/* Chat avec Groq */}
      {showChat && (
        <div className="card mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Discussion avec Groq
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Posez des questions sur vos critères de recherche, demandez des précisions sur les résultats, ou affinez votre ciblage.
          </p>

          <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4 max-h-96 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Commencez une conversation avec Groq</p>
                <p className="text-xs mt-1">Ex: "Pourquoi ces entreprises ?" ou "Trouve-moi des brasseries à Bordeaux"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
              placeholder="Posez votre question à Groq..."
              className="input flex-1"
              disabled={chatLoading}
            />
            <button
              onClick={handleChatMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="btn-primary px-6"
            >
              {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      {prospects.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                🎯 {prospects.length} prospects identifiés
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedIds.size > 0 ? `${selectedIds.size} sélectionné(s)` : 'Sélectionnez les prospects à importer'}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={selectAll} className="btn-secondary text-sm">
                {selectedIds.size === prospects.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={handleImport}
                disabled={selectedIds.size === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Importer ({selectedIds.size})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prospects.map((prospect, index) => (
              <div
                key={index}
                className={`border rounded-lg p-5 transition-all cursor-pointer ${
                  selectedIds.has(index) 
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => toggleSelection(index)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(index)}
                        onChange={() => toggleSelection(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary-600"
                      />
                      <h3 className="font-bold text-lg text-gray-900">{prospect.company_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{prospect.sector}</p>
                  </div>

                  <div className={`text-right ${prospect.relevance_score >= 90 ? 'text-green-600' : prospect.relevance_score >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                    <div className="text-2xl font-bold">{prospect.relevance_score}</div>
                    <div className="text-xs">/ 100</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-24">📍 Lieu :</span>
                    <span>{prospect.city}{prospect.department ? ` (${prospect.department})` : ''}, {prospect.country}</span>
                    {prospect.city_confidence && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{prospect.city_confidence}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-24">📦 Contenants :</span>
                    <span>{prospect.container_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-24">🏢 Taille :</span>
                    <span>{prospect.company_size}</span>
                    {prospect.company_size_confidence && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{prospect.company_size_confidence}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-24">👤 Contact :</span>
                    <span className="font-medium">{prospect.contact_name}</span>
                    <span className="text-gray-500">({prospect.contact_position})</span>
                    {prospect.contact_name_confidence && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{prospect.contact_name_confidence}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-24">✉️ Email :</span>
                    <span className="text-primary-600">{prospect.email}</span>
                    {prospect.email_confidence && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{prospect.email_confidence}</span>
                    )}
                  </div>
                  {prospect.website && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 min-w-24">🌐 Site :</span>
                      <a
                        href={`https://${prospect.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        {prospect.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {prospect.website_confidence && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{prospect.website_confidence}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900 mb-1">Pourquoi ce prospect :</p>
                      <p className="text-yellow-800">{prospect.reason}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateEmail(prospect);
                  }}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Générer un email personnalisé
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {emailPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEmailPreview(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  Email personnalisé
                </h2>
                <button 
                  onClick={() => setEmailPreview(null)} 
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Pour : <strong>{emailPreview.prospect.contact_name}</strong> - {emailPreview.prospect.company_name}
              </p>
            </div>

            <div className="p-6">
              {emailPreview.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  <span className="ml-3 text-gray-600">L'IA rédige l'email...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="label">Objet</label>
                    <div className="p-3 bg-gray-50 rounded-lg font-medium">
                      {emailPreview.subject}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="label">Corps du message</label>
                    <div 
                      className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: emailPreview.body }}
                    />
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Objet: ${emailPreview.subject}\n\n${emailPreview.body.replace(/<[^>]*>/g, '')}`);
                        toast.success('Email copié !');
                      }}
                      className="btn-secondary flex-1"
                    >
                      Copier
                    </button>
                    <button onClick={() => setEmailPreview(null)} className="btn-primary flex-1">
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {prospects.length === 0 && !loading && (
        <div className="card text-center py-16">
          <div className="inline-block p-4 bg-primary-100 rounded-full mb-4">
            <Target className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Prêt à trouver vos prospects ?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Configurez vos critères ci-dessus et laissez l'IA identifier les entreprises 
            qui ont besoin de vos étiquettes en bobine.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Ciblage précis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Contacts identifiés
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Emails personnalisés
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
