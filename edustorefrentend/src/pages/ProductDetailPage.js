import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ImageSlider from '../components/ImageSlider';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const numericId = Number(id);
    setError('');
    api
      .get(`/produits/${Number.isNaN(numericId) ? id : numericId}`)
      .then((r) => {
        // API may return { data: {...} } or directly the product object
        const payload = r.data?.data?.data ?? r.data?.data ?? r.data?.produit ?? r.data;
        setProduct(payload);
        const categorieId = payload?.categorie_id ?? payload?.categorie?.id ?? payload?.categorie?.categorie_id;
        if (categorieId) {
          api
            .get(`/produits?categorie_id=${categorieId}&per_page=4`)
            .then((r2) => {
              const list = Array.isArray(r2.data?.data)
                ? r2.data.data
                : Array.isArray(r2.data?.data?.data)
                  ? r2.data.data.data
                  : Array.isArray(r2.data)
                    ? r2.data
                    : [];
              setRelated(list.filter((p) => p.id !== numericId));
            })
            .catch(() => {});
        }
      })
      .catch(() => setError('Impossible de charger le produit. Vérifiez l’identifiant puis réessayez.'));
  }, [id, navigate]);

  const handleAdd = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
        <Link to="/catalogue" className="btn btn-outline-secondary">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border edu-spinner" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Accueil</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/catalogue">Catalogue</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.nom}
          </li>
        </ol>
      </nav>

      <div className="row g-5">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm d-flex align-items-center justify-content-center edu-detail-media">
            {Array.isArray(product?.images) && product.images.length ? (
              <ImageSlider images={product.images} interval={3000} showControls={true} height={350} />
            ) : product?.image ? (
              <ImageSlider images={[product.image]} interval={3000} showControls={true} height={350} />
            ) : (
              <span className="edu-emoji" aria-hidden="true">
                📖
              </span>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <span className="badge bg-secondary-subtle text-secondary-emphasis mb-2">
            {product.categorie?.nom || 'Scolaire'}
          </span>
          <h1 className="fw-bold h2 mb-3">{product.nom}</h1>

          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
            <span className="fs-3 fw-bold edu-text-accent">{Number(product.prix || 0).toFixed(2)} DH</span>
            <span className={`badge fs-6 ${product.disponible ? 'bg-success' : 'bg-danger'}`}>
              {product.disponible
                ? `En stock${product.stock ? ` (${product.stock.quantite_disponible} unités)` : ''}`
                : 'Rupture de stock'}
            </span>
          </div>

          <p className="text-muted mb-4">{product.description || 'Description non disponible.'}</p>

          {product.disponible && (
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
              <div className="input-group" style={{ width: 140 }}>
                <button className="btn btn-outline-secondary" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  -
                </button>
                <input type="text" className="form-control text-center" value={qty} readOnly />
                <button className="btn btn-outline-secondary" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>
              <button onClick={handleAdd} className="btn btn-lg px-4 text-white flex-grow-1 edu-btn-accent">
                {added ? '✅ Ajouté !' : '🛒 Ajouter au panier'}
              </button>
            </div>
          )}

          <div className="row g-2 text-center">
            {[
              ['🚚', 'Livraison rapide'],
              ['↩️', 'Retour 30 jours'],
              ['✅', 'Produit certifié'],
            ].map(([icon, label]) => (
              <div key={label} className="col-4">
                <div className="p-2 rounded edu-soft-panel">
                  <div className="fs-5">{icon}</div>
                  <div className="small text-muted">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ul className="nav nav-tabs">
          {[
            ['description', 'Description'],
            ['specifications', 'Spécifications'],
            ['avis', 'Avis'],
          ].map(([tab, label]) => (
            <li key={tab} className="nav-item">
              <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border border-top-0 rounded-bottom bg-white">
          {activeTab === 'description' && <p className="text-muted mb-0">{product.description || 'Aucune description.'}</p>}
          {activeTab === 'specifications' && (
            <table className="table table-sm mb-0">
              <tbody>
                {[
                  ['Langue', product.langue],
                  ['Fournisseur', product.fournisseur],
                  ['Catégorie', product.categorie?.nom],
                ].map(([k, v]) =>
                  v ? (
                    <tr key={k}>
                      <td className="text-muted" style={{ width: 160 }}>
                        {k}
                      </td>
                      <td className="fw-semibold">{v}</td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          )}
          {activeTab === 'avis' && <p className="text-muted mb-0">Aucun avis pour le moment.</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-5">
          <h4 className="fw-semibold mb-4">Produits similaires</h4>
          <div className="row g-4">
            {related.slice(0, 4).map((p) => (
              <div key={p.id} className="col-sm-6 col-lg-3">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

