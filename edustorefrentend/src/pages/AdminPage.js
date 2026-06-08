import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ImageSlider from '../components/ImageSlider';

function formatCommandeClient(c) {
  const u = c?.client?.utilisateur;
  if (!u) return '—';
  const name = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
  return name || u.email || '—';
}

function formatCommandeDate(d) {
  if (!d) return '—';
  if (typeof d === 'string') return d.slice(0, 10);
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [factures, setFactures] = useState([]);
  const [publicites, setPublicites] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchFacture, setSearchFacture] = useState('');

  // Modal + form produits (ajout / édition)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productEditing, setProductEditing] = useState(null); // produit ou null (ajout)
  const [newImageUrl, setNewImageUrl] = useState('');
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie_id: '',
    langue: 'Français',
    niveau_scolaire: '',
    image: '',
    images: [],
    promo_image: '',
    disponible: true,
    quantite_disponible: '',
    seuil_alerte: '',
  });

  // Formulaires pour admin (publicités / promotions)
  const [pubEditingId, setPubEditingId] = useState(null);
  const [pubForm, setPubForm] = useState({
    titre: '',
    description: '',
    lien: '',
    image_url: '',
    date_debut: '',
    date_fin: '',
    active: true,
  });

  const [promoEditingId, setPromoEditingId] = useState(null);
  const [promoForm, setPromoForm] = useState({
    titre: '',
    description: '',
    code_promo: '',
    reduction_percent: '',
    reduction_montant: '',
    lien: '',
    image_url: '',
    date_debut: '',
    date_fin: '',
    active: true,
  });

  // Edits rapides pour factures (montants)
  const [factureEdits, setFactureEdits] = useState({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError('');

        const results = await Promise.allSettled([
          api.get('/commandes'),
          api.get('/produits'),
          api.get('/stocks'),
          api.get('/factures?per_page=50'),
          api.get('/admin/publicites?all=1&per_page=50'),
          api.get('/admin/promotions?all=1&per_page=50'),
          api.get('/categories'),
        ]);

        const [cmdRes, prodRes, stockRes, factRes, pubRes, promoRes, catRes] = results;

        if (cmdRes.status === 'fulfilled') {
          setCommandes(cmdRes.value.data?.data ?? []);
        }
        if (prodRes.status === 'fulfilled') {
          setProduits(prodRes.value.data?.data ?? []);
        }
        if (stockRes.status === 'fulfilled') {
          setStocks(stockRes.value.data?.data ?? []);
        }
        if (factRes.status === 'fulfilled') {
          setFactures(factRes.value.data?.data ?? []);
        }
        if (pubRes.status === 'fulfilled') {
          setPublicites(pubRes.value.data?.data ?? []);
        }
        if (promoRes.status === 'fulfilled') {
          setPromotions(promoRes.value.data?.data ?? []);
        }
        if (catRes.status === 'fulfilled') {
          const data = catRes.value.data;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.data)
                ? data.data.data
                : [];
          setCategories(list);
        }

        const firstError = results.find((r) => r.status === 'rejected');
        const coreFailed =
          cmdRes.status === 'rejected' &&
          prodRes.status === 'rejected' &&
          stockRes.status === 'rejected';

        if (firstError && coreFailed) {
          setError('Impossible de charger le dashboard. Veuillez vérifier votre connexion ou vous reconnecter.');
        } else if (firstError && !coreFailed) {
          setError('Certaines données admin n\'ont pas pu être chargées, mais le dashboard reste utilisable.');
        }
      } catch (err) {
        setError('Impossible de charger le dashboard. Veuillez vérifier votre connexion ou vous reconnecter.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const facturesParCommande = useMemo(() => new Set(factures.map((f) => f.commande_id)), [factures]);
  const commandesLivreesSansFacture = useMemo(
    () => commandes.filter((c) => c.statut === 'livree' && !facturesParCommande.has(c.id)),
    [commandes, facturesParCommande]
  );

  const reloadFactures = async () => {
    const res = await api.get('/factures?per_page=50');
    setFactures(res.data?.data ?? []);
  };

  const reloadPublicites = async () => {
    const res = await api.get('/admin/publicites?all=1&per_page=50');
    setPublicites(res.data?.data ?? []);
  };

  const reloadPromotions = async () => {
    const res = await api.get('/admin/promotions?all=1&per_page=50');
    setPromotions(res.data?.data ?? []);
  };

  const handleGenererFacture = async (commandeId) => {
    try {
      setError('');
      await api.post('/factures', { commande_id: commandeId, taux_tva: 0.20 });
      await reloadFactures();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de générer la facture.');
    }
  };

  const reloadProduits = async () => {
    const res = await api.get('/produits?per_page=50');
    setProduits(res.data?.data ?? []);
  };

  const reloadStocks = async () => {
    const res = await api.get('/stocks?per_page=50');
    setStocks(res.data?.data ?? []);
  };

  const filteredProduits = produits.filter((p) => {
    const searchLower = searchProduct.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.categorie?.nom?.toLowerCase().includes(searchLower) ||
      String(p.id).includes(searchLower)
    );
  });

  const filteredFactures = factures.filter((f) => {
    const searchLower = searchFacture.toLowerCase();
    return (
      f.numero?.toLowerCase().includes(searchLower) ||
      String(f.id).includes(searchLower) ||
      String(f.commande_id).includes(searchLower)
    );
  });

  const openAddProduct = () => {
    setError('');
    setProductEditing(null);
    setNewImageUrl('');
    setProductForm({
      nom: '',
      description: '',
      prix: '',
      categorie_id: categories?.[0]?.id ? String(categories[0].id) : '',
      langue: 'Français',
      niveau_scolaire: '',
      image: '',
      images: [],
      promo_image: '',
      disponible: true,
      quantite_disponible: '',
      seuil_alerte: '',
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (p) => {
    setError('');
    setProductEditing(p);
    setNewImageUrl('');
    const imgs = Array.isArray(p?.images)
      ? p.images.filter(Boolean)
      : p?.image
        ? [p.image]
        : [];
    setProductForm({
      nom: p?.nom ?? '',
      description: p?.description ?? '',
      prix: p?.prix ?? '',
      categorie_id: p?.categorie_id ? String(p.categorie_id) : p?.categorie?.id ? String(p.categorie.id) : '',
      langue: p?.langue ?? 'Français',
      niveau_scolaire: p?.niveau_scolaire ?? '',
      image: p?.image ?? '',
      images: imgs,
      promo_image: p?.promo_image ?? '',
      disponible: !!p?.disponible,
      quantite_disponible: p?.stock?.quantite_disponible ?? '',
      seuil_alerte: p?.stock?.seuil_alerte ?? '',
    });
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (productSaving) return;
    setProductModalOpen(false);
  };

  const saveProduct = async () => {
    try {
      setError('');
      setProductSaving(true);

      const imagesClean = Array.isArray(productForm.images)
        ? productForm.images.map((s) => String(s || '').trim()).filter(Boolean)
        : [];

      const payload = {
        nom: productForm.nom,
        description: productForm.description || null,
        prix: productForm.prix === '' ? undefined : Number(productForm.prix),
        categorie_id: productForm.categorie_id === '' ? undefined : Number(productForm.categorie_id),
        langue: productForm.langue || null,
        niveau_scolaire: productForm.niveau_scolaire || null,
        // compat backend: on conserve `image` (première image)
        image: (imagesClean[0] || productForm.image || '').trim() || null,
        images: imagesClean.length ? imagesClean : undefined,
        promo_image: (productForm.promo_image || '').trim() || null,
        disponible: !!productForm.disponible,
        quantite_disponible:
          productForm.quantite_disponible === '' ? undefined : Number(productForm.quantite_disponible),
        seuil_alerte: productForm.seuil_alerte === '' ? undefined : Number(productForm.seuil_alerte),
      };

      if (productEditing?.id) {
        await api.put(`/produits/${productEditing.id}`, payload);
      } else {
        await api.post('/produits', payload);
      }

      setProductModalOpen(false);
      await reloadProduits();
      await reloadStocks();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible d'enregistrer le produit.");
    } finally {
      setProductSaving(false);
    }
  };

  const handleSaveFactureMontants = async (factureId) => {
    const edit = factureEdits[factureId] || {};
    const montant_ht = edit.montant_ht ?? '';
    const montant_ttc = edit.montant_ttc ?? '';

    try {
      setError('');
      await api.put(`/factures/${factureId}`, {
        montant_ht: montant_ht === '' ? undefined : Number(montant_ht),
        montant_ttc: montant_ttc === '' ? undefined : Number(montant_ttc),
      });
      setFactureEdits((prev) => {
        const next = { ...prev };
        delete next[factureId];
        return next;
      });
      await reloadFactures();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de mettre à jour la facture.');
    }
  };

  const handleTelechargerFacturePDF = async (factureId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/factures/${factureId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${factureId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err?.message || 'Impossible de télécharger la facture.');
    }
  };

  const handleProduitDelete = async (produitId) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      setError('');
      await api.delete(`/produits/${produitId}`);
      await reloadProduits();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de supprimer le produit.');
    }
  };

  const handleProduitQuickEdit = async (produit) => {
    const prixStr = window.prompt('Nouveau prix (DH) :', String(produit.prix ?? ''));
    if (prixStr === null) return;
    const disponibleStr = window.prompt('Disponible ? (oui/non) :', produit.disponible ? 'oui' : 'non');
    if (disponibleStr === null) return;

    const prixNum = Number(prixStr);
    const disponibleBool = String(disponibleStr).toLowerCase().startsWith('o');

    try {
      setError('');
      await api.put(`/produits/${produit.id}`, { prix: prixNum, disponible: disponibleBool });
      await reloadProduits();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de mettre à jour le produit.');
    }
  };

  const handleStockQuickEdit = async (stock) => {
    const quantiteStr = window.prompt(
      'Quantité disponible :',
      String(stock.quantite_disponible ?? '')
    );
    if (quantiteStr === null) return;
    const seuilStr = window.prompt('Seuil d\'alerte :', String(stock.seuil_alerte ?? ''));
    if (seuilStr === null) return;

    const quantiteNum = Number(quantiteStr);
    const seuilNum = Number(seuilStr);

    try {
      setError('');
      await api.put(`/stocks/${stock.id}`, { quantite_disponible: quantiteNum, seuil_alerte: seuilNum });
      await reloadStocks();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de mettre à jour le stock.');
    }
  };

  const defaultPubForm = {
    titre: '',
    description: '',
    lien: '',
    image_url: '',
    date_debut: '',
    date_fin: '',
    active: true,
  };

  const handlePubStartEdit = (p) => {
    setPubEditingId(p.id);
    setPubForm({
      titre: p.titre || '',
      description: p.description || '',
      lien: p.lien || '',
      image_url: p.image_url || '',
      date_debut: p.date_debut || '',
      date_fin: p.date_fin || '',
      active: p.active ?? true,
    });
  };

  const handlePubSubmit = async () => {
    try {
      setError('');
      const payload = {
        ...pubForm,
        date_debut: pubForm.date_debut || null,
        date_fin: pubForm.date_fin || null,
      };

      if (pubEditingId) {
        await api.put(`/admin/publicites/${pubEditingId}`, payload);
      } else {
        await api.post('/admin/publicites', payload);
      }

      setPubEditingId(null);
      setPubForm(defaultPubForm);
      await reloadPublicites();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible d'enregistrer la publicité.");
    }
  };

  const handlePubDelete = async (id) => {
    if (!window.confirm('Supprimer cette publicité ?')) return;
    try {
      setError('');
      await api.delete(`/admin/publicites/${id}`);
      await reloadPublicites();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de supprimer la publicité.');
    }
  };

  const defaultPromoForm = {
    titre: '',
    description: '',
    code_promo: '',
    reduction_percent: '',
    reduction_montant: '',
    lien: '',
    image_url: '',
    date_debut: '',
    date_fin: '',
    active: true,
  };

  const handlePromoStartEdit = (p) => {
    setPromoEditingId(p.id);
    setPromoForm({
      titre: p.titre || '',
      description: p.description || '',
      code_promo: p.code_promo || '',
      reduction_percent: p.reduction_percent ?? '',
      reduction_montant: p.reduction_montant ?? '',
      lien: p.lien || '',
      image_url: p.image_url || '',
      date_debut: p.date_debut || '',
      date_fin: p.date_fin || '',
      active: p.active ?? true,
    });
  };

  const handlePromoSubmit = async () => {
    try {
      setError('');
      const payload = {
        ...promoForm,
        reduction_percent: promoForm.reduction_percent === '' ? null : promoForm.reduction_percent,
        reduction_montant: promoForm.reduction_montant === '' ? null : promoForm.reduction_montant,
        date_debut: promoForm.date_debut || null,
        date_fin: promoForm.date_fin || null,
      };

      if (promoEditingId) {
        await api.put(`/admin/promotions/${promoEditingId}`, payload);
      } else {
        await api.post('/admin/promotions', payload);
      }

      setPromoEditingId(null);
      setPromoForm(defaultPromoForm);
      await reloadPromotions();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible d\'enregistrer la promotion.');
    }
  };

  const handlePromoDelete = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      setError('');
      await api.delete(`/admin/promotions/${id}`);
      await reloadPromotions();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de supprimer la promotion.');
    }
  };

  const statusBadge = {
    en_attente: 'warning',
    confirmee: 'info',
    en_livraison: 'primary',
    livree: 'success',
    annulee: 'danger',
  };
  const statusLabel = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    en_livraison: 'En livraison',
    livree: 'Livrée',
    annulee: 'Annulée',
  };

  const updateStatut = async (id, statut) => {
    try {
      await api.put(`/commandes/${id}`, { statut });
      setCommandes((prev) => prev.map((c) => (c.id === id ? { ...c, statut } : c)));
    } catch (err) {
      setError('Impossible de mettre à jour le statut de la commande.');
    }
  };

  const totalVentes = commandes
    .filter((c) => c.statut === 'livree')
    .reduce((s, c) => s + Number(c.montant_total || 0), 0);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="fw-bold h3 mb-0">Admin Dashboard</h1>
        <span className="badge text-white px-3 py-2 edu-badge-accent">EduStore Admin</span>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        {[
          ['📦', 'Commandes totales', commandes.length, 'primary'],
          ['📚', 'Produits', produits.length, 'success'],
          ['💰', 'Ventes (DH)', totalVentes.toFixed(2), 'warning'],
          ['⚠️', 'Alertes stock', stocks.filter((s) => s.quantite_disponible <= s.seuil_alerte).length, 'danger'],
        ].map(([icon, label, val, color]) => (
          <div key={label} className="col-6 col-md-3">
            <div className={`card border-0 shadow-sm border-start border-${color} border-4 edu-card`}>
              <div className="card-body">
                <div className="fs-2">{icon}</div>
                <div className="text-muted small">{label}</div>
                <div className="fw-bold fs-4">{val}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ul className="nav nav-tabs mb-4">
        {[
          ['dashboard', 'Dashboard'],
          ['products', 'Produits'],
          ['orders', 'Commandes'],
          ['stocks', 'Stocks'],
          ['factures', 'Factures'],
          ['publicites', 'Publicités'],
          ['promotions', 'Promotions'],
        ].map(([t, label]) => (
          <li key={t} className="nav-item">
            <button className={`nav-link ${tab === t ? 'active fw-semibold' : ''}`} onClick={() => setTab(t)}>
              {label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border edu-spinner" />
        </div>
      ) : (
        <>
          {tab === 'dashboard' && (
            <div className="edu-admin-dashboard-panel">
              <h2 className="fw-bold h5 mb-3">Commandes récentes</h2>
              <div className="table-responsive">
                <table className="table table-bordered align-middle bg-white mb-0">
                  <thead className="table-secondary">
                    <tr>
                      <th>N° commande</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandes.slice(0, 5).map((c) => (
                      <tr key={c.id}>
                        <td className="fw-semibold">#{String(c.id).padStart(3, '0')}</td>
                        <td>{formatCommandeClient(c)}</td>
                        <td>{formatCommandeDate(c.date_commande)}</td>
                        <td className="fw-semibold">{Number(c.montant_total || 0).toFixed(2)} DH</td>
                        <td>
                          <span className={`badge bg-${statusBadge[c.statut] || 'secondary'}`}>
                            {statusLabel[c.statut] || c.statut}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm edu-input"
                            value={c.statut}
                            onChange={(e) => updateStatut(c.id, e.target.value)}
                            style={{ minWidth: 150 }}
                          >
                            {Object.entries(statusLabel).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div>
              <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                <h5 className="fw-semibold mb-0">Gestion des produits</h5>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Rechercher un produit..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    style={{ maxWidth: '250px' }}
                  />
                  <button className="btn btn-sm text-white edu-btn-accent" type="button" onClick={openAddProduct}>
                    + Ajouter un produit
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Prix</th>
                      <th>Stock</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProduits.length > 0 ? (
                      filteredProduits.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td className="fw-semibold">{p.nom}</td>
                          <td>
                            <span className="badge bg-secondary">{p.categorie?.nom || '-'}</span>
                          </td>
                          <td className="edu-text-accent">{Number(p.prix || 0).toFixed(2)} DH</td>
                          <td>{p.stock?.quantite_disponible ?? '-'}</td>
                          <td>
                            <span className={`badge ${p.disponible ? 'bg-success' : 'bg-danger'}`}>
                              {p.disponible ? 'Disponible' : 'Indisponible'}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => openEditProduct(p)}>
                              ✏️
                            </button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleProduitDelete(p.id)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          {searchProduct ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {productModalOpen && (
            <>
              <div className="modal show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title fw-semibold">
                        {productEditing?.id ? `Modifier le produit #${productEditing.id}` : 'Ajouter un produit'}
                      </h5>
                      <button type="button" className="btn-close" aria-label="Close" onClick={closeProductModal} />
                    </div>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold">Nom</label>
                          <input
                            className="form-control edu-input"
                            value={productForm.nom}
                            onChange={(e) => setProductForm((p) => ({ ...p, nom: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Prix (DH)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control edu-input"
                            value={productForm.prix}
                            onChange={(e) => setProductForm((p) => ({ ...p, prix: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Catégorie</label>
                          <select
                            className="form-select edu-input"
                            value={productForm.categorie_id}
                            onChange={(e) => setProductForm((p) => ({ ...p, categorie_id: e.target.value }))}
                            required
                          >
                            <option value="" disabled>
                              Choisir...
                            </option>
                            {categories.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.nom}
                              </option>
                            ))}
                          </select>
                          {!categories.length && (
                            <div className="text-muted small mt-1">Aucune catégorie trouvée. Créez une catégorie avant d’ajouter un produit.</div>
                          )}
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Stock</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control edu-input"
                            value={productForm.quantite_disponible}
                            onChange={(e) => setProductForm((p) => ({ ...p, quantite_disponible: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Seuil alerte</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control edu-input"
                            value={productForm.seuil_alerte}
                            onChange={(e) => setProductForm((p) => ({ ...p, seuil_alerte: e.target.value }))}
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Langue</label>
                          <input
                            className="form-control edu-input"
                            value={productForm.langue}
                            onChange={(e) => setProductForm((p) => ({ ...p, langue: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Niveau scolaire</label>
                          <input
                            className="form-control edu-input"
                            value={productForm.niveau_scolaire}
                            onChange={(e) => setProductForm((p) => ({ ...p, niveau_scolaire: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="produit_disponible"
                              checked={!!productForm.disponible}
                              onChange={(e) => setProductForm((p) => ({ ...p, disponible: e.target.checked }))}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="produit_disponible">
                              Disponible
                            </label>
                          </div>
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Images (plusieurs URLs)</label>
                          <div className="d-flex gap-2">
                            <input
                              className="form-control edu-input"
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              placeholder="https://..."
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                const url = String(newImageUrl || '').trim();
                                if (!url) return;
                                setProductForm((p) => ({
                                  ...p,
                                  images: [...(Array.isArray(p.images) ? p.images : []), url],
                                }));
                                setNewImageUrl('');
                              }}
                            >
                              Ajouter
                            </button>
                          </div>

                          {Array.isArray(productForm.images) && productForm.images.length > 0 && (
                            <div className="mt-2">
                              <div className="d-flex flex-wrap gap-2">
                                {productForm.images.map((url, idx) => (
                                  <span key={`${url}-${idx}`} className="badge bg-light text-dark border">
                                    {url}
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger ms-2 p-0"
                                      onClick={() =>
                                        setProductForm((p) => ({
                                          ...p,
                                          images: p.images.filter((_, i) => i !== idx),
                                        }))
                                      }
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>

                              <div className="mt-3">
                                <ImageSlider images={productForm.images} interval={3000} showControls={true} height={260} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Image de promotion (URL)</label>
                          <input
                            className="form-control edu-input"
                            value={productForm.promo_image}
                            onChange={(e) => setProductForm((p) => ({ ...p, promo_image: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Description</label>
                          <textarea
                            className="form-control edu-input"
                            rows={3}
                            value={productForm.description}
                            onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-secondary" onClick={closeProductModal} disabled={productSaving}>
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="btn text-white edu-btn-accent"
                        onClick={saveProduct}
                        disabled={productSaving || !productForm.nom || !productForm.prix || !productForm.categorie_id}
                      >
                        {productSaving ? 'Enregistrement...' : 'Valider'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop show" onClick={closeProductModal} />
            </>
          )}

          {tab === 'orders' && (
            <div>
              <h5 className="fw-semibold mb-3">Gestion des commandes</h5>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>#ID</th>
                      <th>Date</th>
                      <th>Adresse</th>
                      <th>Montant</th>
                      <th>Paiement</th>
                      <th>Statut</th>
                      <th>Modifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandes.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-semibold">#{c.id}</td>
                        <td>{c.date_commande}</td>
                        <td className="small text-muted">{(c.adresse_livraison || '').substring(0, 40)}…</td>
                        <td className="fw-bold edu-text-accent">{Number(c.montant_total || 0).toFixed(2)} DH</td>
                        <td>
                          <span className="badge bg-info text-dark">{c.mode_paiement}</span>
                        </td>
                        <td>
                          <span className={`badge bg-${statusBadge[c.statut] || 'secondary'}`}>
                            {statusLabel[c.statut] || c.statut}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm edu-input"
                            value={c.statut}
                            onChange={(e) => updateStatut(c.id, e.target.value)}
                            style={{ width: 150 }}
                          >
                            {Object.entries(statusLabel).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'stocks' && (
            <div>
              <h5 className="fw-semibold mb-3">Gestion des stocks</h5>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Seuil alerte</th>
                      <th>Dernière MAJ</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td className="fw-semibold">{s.produit?.nom || `Produit #${s.produit_id}`}</td>
                        <td className="fw-bold">{s.quantite_disponible}</td>
                        <td>{s.seuil_alerte}</td>
                        <td>{s.date_mise_a_jour || '-'}</td>
                        <td>
                          {s.quantite_disponible <= s.seuil_alerte ? (
                            <span className="badge bg-danger">⚠️ Alerte stock</span>
                          ) : (
                            <span className="badge bg-success">✅ Normal</span>
                          )}
                        </td>
                        <td style={{ width: 160 }}>
                          <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => handleStockQuickEdit(s)}>
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'factures' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="fw-semibold mb-0">Gestion des factures</h5>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Rechercher une facture..."
                    value={searchFacture}
                    onChange={(e) => setSearchFacture(e.target.value)}
                    style={{ maxWidth: '250px' }}
                  />
                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={reloadFactures}>
                    Rafraîchir
                  </button>
                </div>
              </div>

              {commandesLivreesSansFacture.length > 0 && (
                <div className="alert alert-info">
                  <div className="fw-semibold mb-2">Commandes livrées sans facture</div>
                  <div className="d-flex flex-wrap gap-2">
                    {commandesLivreesSansFacture.slice(0, 6).map((c) => (
                      <button key={c.id} className="btn btn-sm text-white edu-btn-accent" type="button" onClick={() => handleGenererFacture(c.id)}>
                        Générer #{c.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredFactures.length ? (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle bg-white">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Numéro</th>
                        <th>Commande</th>
                        <th>Date émission</th>
                        <th>Montant HT</th>
                        <th>Montant TTC</th>
                        <th>PDF</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFactures.map((f) => (
                        <tr key={f.id}>
                          <td className="fw-semibold">#{f.id}</td>
                          <td>{f.numero}</td>
                          <td>#{f.commande_id ?? f.commande?.id}</td>
                          <td>{f.date_emission}</td>
                          <td>
                            <input
                              className="form-control form-control-sm edu-input"
                              type="number"
                              step="0.01"
                              value={factureEdits[f.id]?.montant_ht ?? f.montant_ht ?? ''}
                              onChange={(e) =>
                                setFactureEdits((prev) => ({
                                  ...prev,
                                  [f.id]: { ...(prev[f.id] || {}), montant_ht: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm edu-input"
                              type="number"
                              step="0.01"
                              value={factureEdits[f.id]?.montant_ttc ?? f.montant_ttc ?? ''}
                              onChange={(e) =>
                                setFactureEdits((prev) => ({
                                  ...prev,
                                  [f.id]: { ...(prev[f.id] || {}), montant_ttc: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => handleTelechargerFacturePDF(f.id)}>
                              Télécharger
                            </button>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-success" type="button" onClick={() => handleSaveFactureMontants(f.id)}>
                              Enregistrer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="fs-1 mb-3">🧾</div>
                  <div className="text-muted">
                    {searchFacture ? 'Aucune facture trouvée' : 'Aucune facture pour le moment.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'publicites' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="fw-semibold mb-0">Gestion des publicités</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setPubEditingId(null);
                    setPubForm(defaultPubForm);
                  }}
                >
                  Nouveau
                </button>
              </div>

              <div className="card border-0 shadow-sm rounded-4 edu-soft-panel mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">{pubEditingId ? 'Modifier' : 'Créer'} une publicité</h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Titre</label>
                      <input className="form-control edu-input" value={pubForm.titre} onChange={(e) => setPubForm({ ...pubForm, titre: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Lien</label>
                      <input className="form-control edu-input" value={pubForm.lien} onChange={(e) => setPubForm({ ...pubForm, lien: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control edu-input" rows={3} value={pubForm.description} onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Image URL</label>
                      <input className="form-control edu-input" value={pubForm.image_url} onChange={(e) => setPubForm({ ...pubForm, image_url: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date début</label>
                      <input type="date" className="form-control edu-input" value={pubForm.date_debut} onChange={(e) => setPubForm({ ...pubForm, date_debut: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date fin</label>
                      <input type="date" className="form-control edu-input" value={pubForm.date_fin} onChange={(e) => setPubForm({ ...pubForm, date_fin: e.target.value })} />
                    </div>
                    <div className="col-12 d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!pubForm.active}
                        onChange={(e) => setPubForm({ ...pubForm, active: e.target.checked })}
                      />
                      <label className="form-check-label fw-semibold">Active</label>
                    </div>
                    <div className="col-12">
                      <button className="btn w-100 text-white fw-semibold py-2 edu-btn-accent" type="button" onClick={handlePubSubmit}>
                        {pubEditingId ? 'Mettre à jour' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Titre</th>
                      <th>Actif</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicites.length ? (
                      publicites.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">#{p.id}</td>
                          <td>
                            <div className="fw-semibold">{p.titre}</div>
                            {p.lien ? <div className="small text-muted">{p.lien}</div> : null}
                          </td>
                          <td>{p.active ? <span className="badge bg-success">Oui</span> : <span className="badge bg-secondary">Non</span>}</td>
                          <td className="small text-muted">
                            {p.date_debut || '-'} → {p.date_fin || '-'}
                          </td>
                          <td style={{ width: 230 }}>
                            <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => handlePubStartEdit(p)}>
                              Modifier
                            </button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handlePubDelete(p.id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Aucune publicité.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'promotions' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="fw-semibold mb-0">Gestion des promotions</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setPromoEditingId(null);
                    setPromoForm(defaultPromoForm);
                  }}
                >
                  Nouveau
                </button>
              </div>

              <div className="card border-0 shadow-sm rounded-4 edu-soft-panel mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">{promoEditingId ? 'Modifier' : 'Créer'} une promotion</h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Titre</label>
                      <input className="form-control edu-input" value={promoForm.titre} onChange={(e) => setPromoForm({ ...promoForm, titre: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Code promo</label>
                      <input className="form-control edu-input" value={promoForm.code_promo} onChange={(e) => setPromoForm({ ...promoForm, code_promo: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control edu-input" rows={3} value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Lien</label>
                      <input className="form-control edu-input" value={promoForm.lien} onChange={(e) => setPromoForm({ ...promoForm, lien: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Image URL</label>
                      <input className="form-control edu-input" value={promoForm.image_url} onChange={(e) => setPromoForm({ ...promoForm, image_url: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">% réduction</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control edu-input"
                        value={promoForm.reduction_percent}
                        onChange={(e) => setPromoForm({ ...promoForm, reduction_percent: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Montant réduction</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control edu-input"
                        value={promoForm.reduction_montant}
                        onChange={(e) => setPromoForm({ ...promoForm, reduction_montant: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date début</label>
                      <input type="date" className="form-control edu-input" value={promoForm.date_debut} onChange={(e) => setPromoForm({ ...promoForm, date_debut: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date fin</label>
                      <input type="date" className="form-control edu-input" value={promoForm.date_fin} onChange={(e) => setPromoForm({ ...promoForm, date_fin: e.target.value })} />
                    </div>
                    <div className="col-12 d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!promoForm.active}
                        onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })}
                      />
                      <label className="form-check-label fw-semibold">Active</label>
                    </div>
                    <div className="col-12">
                      <button className="btn w-100 text-white fw-semibold py-2 edu-btn-accent" type="button" onClick={handlePromoSubmit}>
                        {promoEditingId ? 'Mettre à jour' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Titre</th>
                      <th>Code</th>
                      <th>Actif</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.length ? (
                      promotions.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">#{p.id}</td>
                          <td className="fw-semibold">{p.titre}</td>
                          <td className="small text-muted">{p.code_promo || '-'}</td>
                          <td>{p.active ? <span className="badge bg-success">Oui</span> : <span className="badge bg-secondary">Non</span>}</td>
                          <td className="small text-muted">
                            {p.date_debut || '-'} → {p.date_fin || '-'}
                          </td>
                          <td style={{ width: 230 }}>
                            <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => handlePromoStartEdit(p)}>
                              Modifier
                            </button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handlePromoDelete(p.id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          Aucune promotion.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

