import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function CatalogPage() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('categorie');
    if (cat) setCatFilter(cat);
    api
      .get('/categories')
      .then((r) => {
        // API may return categories as array, or { data: [...] }
        const data = r.data;
        setCategories(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.data)
                ? data.data.data
                : []
        );
      })
      .catch((err) => {
        // Les catégories sont uniquement utiles pour le filtre ; on ne doit pas masquer tout le catalogue.
        setCategories([]);
      });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (catFilter) params.append('categorie_id', catFilter);
    const qs = params.toString();
    const url = qs ? `/produits?${qs}` : '/produits';
    api
      .get(url)
      .then((r) => {
        const data = r.data;
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
            ? data.data.data
            : Array.isArray(data)
              ? data
              : [];
        setProduits(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des produits.');
        setLoading(false);
      });
  }, [search, catFilter]);

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-4">
        <h1 className="fw-semibold mb-0">Catalogue</h1>
        <div className="text-muted small">Trouvez vos livres et fournitures en quelques clics.</div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            className="form-control edu-input"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select edu-input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select edu-input" disabled>
            <option>Tous les niveaux</option>
            <option>Primaire</option>
            <option>Collège</option>
            <option>Lycée</option>
          </select>
        </div>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setCatFilter('')}
          className={`btn btn-sm ${!catFilter ? 'text-white edu-btn-accent' : 'btn-outline-secondary'}`}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(String(c.id))}
            className={`btn btn-sm ${catFilter === String(c.id) ? 'text-white edu-btn-accent' : 'btn-outline-secondary'}`}
          >
            {c.nom}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border edu-spinner" />
          <p className="mt-3 text-muted">Chargement des produits...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <div className="fs-1 mb-3">⚠️</div>
          <h5 className="text-muted mb-2">Impossible de charger le catalogue</h5>
          <p className="text-muted small mb-4">{error}</p>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      ) : produits.length === 0 ? (
        <div className="text-center py-5">
          <div className="fs-1 mb-3">📭</div>
          <h5 className="text-muted">Aucun produit trouvé</h5>
        </div>
      ) : (
        <>
          <p className="text-muted small mb-3">{produits.length} produit(s) trouvé(s)</p>
          <div className="row g-4">
            {produits.map((p) => (
              <div key={p.id} className="col-sm-6 col-lg-3">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

