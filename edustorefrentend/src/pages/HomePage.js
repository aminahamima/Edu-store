import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import PromoPubSlider from '../components/PromoPubSlider';
import brandLogo from '../assets/edustore-luxury-logo.svg';

export default function HomePage() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [publicites, setPublicites] = useState([]);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    api
      .get('/produits?per_page=4')
      .then((r) => setProduits(r.data.data || []))
      .catch(() => {});
    api
      .get('/categories')
      .then((r) => setCategories(r.data))
      .catch(() => {});

    api
      .get('/publicites?per_page=12')
      .then((r) => {
        const data = r.data?.data ?? r.data?.publicites ?? r.data;
        setPublicites(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    api
      .get('/promotions?per_page=12')
      .then((r) => {
        const data = r.data?.data ?? r.data?.promotions ?? r.data;
        setPromotions(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const catIcons = useMemo(() => ['📚', '📓', '✏️', '🎒', '📐', '🖊️'], []);
  const fallbackCats = useMemo(
    () => [
      { id: 1, nom: 'Livres Scolaires' },
      { id: 2, nom: 'Cahiers' },
      { id: 3, nom: 'Papeterie' },
      { id: 4, nom: 'Sacs' },
    ],
    []
  );

  const fallbackProducts = useMemo(
    () => [
      { id: 1, nom: 'Mathématiques Terminale', prix: 150, disponible: true, categorie: { nom: 'Livres' } },
      { id: 2, nom: 'Cahier Grand Format', prix: 25, disponible: true, categorie: { nom: 'Cahiers' } },
      { id: 3, nom: 'Sac à dos scolaire', prix: 180, disponible: true, categorie: { nom: 'Sacs' } },
      { id: 4, nom: 'Kit de stylos', prix: 45, disponible: false, categorie: { nom: 'Papeterie' } },
    ],
    []
  );

  const cats = categories.length ? categories : fallbackCats;
  const featured = produits.length ? produits : fallbackProducts;

  return (
    <div>
      <section className="edu-hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <div className="edu-badge mb-3">Nouveau · Livraison rapide · Paiement à la livraison</div>
              <h1 className="display-5 fw-bold mb-3 edu-reveal">
                Votre bibliothèque en ligne, pensée pour la rentrée.
              </h1>
              <p className="lead text-white-75 mb-4 edu-reveal" style={{ animationDelay: '80ms' }}>
                Livres scolaires et essentiels de papeterie, avec une expérience simple et moderne.
              </p>
              <div className="d-flex gap-2 flex-wrap edu-reveal" style={{ animationDelay: '140ms' }}>
                <Link to="/catalogue" className="btn btn-light btn-lg fw-semibold px-4 edu-btn-hero">
                  Voir le catalogue
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg fw-semibold px-4 edu-btn-soft">
                  Créer un compte
                </Link>
              </div>
              <div className="d-flex gap-3 mt-4 text-white-75 small edu-reveal" style={{ animationDelay: '200ms' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="edu-dot" aria-hidden="true" /> Retours 30 jours
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="edu-dot" aria-hidden="true" /> Support réactif
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="edu-dot" aria-hidden="true" /> Stock vérifié
                </div>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <div className="edu-hero-art">
                <img src={brandLogo} alt="edustore" className="edu-hero-logo" />
              </div>
            </div>
          </div>
        </div>
        <div className="edu-hero-wave" aria-hidden="true" />
      </section>

      <div className="container py-5">
        <h2 className="fw-semibold mb-4">Catégories</h2>
        <div className="row g-3 mb-5">
          {cats.map((c, i) => (
            <div key={c.id} className="col-6 col-md-3">
              <Link to={`/catalogue?categorie=${c.id}`} className="text-decoration-none">
                <div className="card text-center border-0 shadow-sm py-3 h-100 edu-cat-card">
                  <div className="fs-1 mb-2">{catIcons[i] || '📦'}</div>
                  <div className="fw-semibold text-dark small">{c.nom}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>

          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3">
            <h2 className="fw-semibold mb-0">Publicités & Promotions</h2>
            <div className="text-muted small">Défilement automatique</div>
          </div>

          <div className="row mb-5">
            <div className="col-12 col-lg-8 col-xl-7 mx-auto">
              <div className="card border-0 shadow-sm rounded-4 edu-soft-panel p-3 p-md-4">
                <PromoPubSlider publicites={publicites} promotions={promotions} intervalMs={5000} imageHeight={200} />
              </div>
            </div>
          </div>

        <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-4">
          <h2 className="fw-semibold mb-0">Produits vedettes</h2>
          <Link to="/catalogue" className="text-decoration-none edu-link-accent fw-semibold">
            Tout voir →
          </Link>
        </div>

        <div className="row g-4">
          {featured.map((p) => (
            <div key={p.id} className="col-sm-6 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        <div className="edu-cta rounded-4 text-white text-center py-5 mt-5 px-3">
          <h3 className="fw-bold mb-2">Prêt pour la rentrée ?</h3>
          <p className="mb-4 text-white-75">Livraison rapide partout au Maroc</p>
          <Link to="/register" className="btn btn-light fw-semibold px-4 edu-btn-hero">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}

