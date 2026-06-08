import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ImageSlider from './ImageSlider';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const price = Number(product.prix || 0).toFixed(2);

  return (
    <div className="card h-100 shadow-sm border-0 edu-card">
      <div className="card-img-top d-flex align-items-center justify-content-center edu-card-media">
        {Array.isArray(product?.images) && product.images.length ? (
          <ImageSlider images={product.images} interval={3000} showControls={false} height={160} />
        ) : product?.image ? (
          <ImageSlider images={[product.image]} interval={3000} showControls={false} height={160} />
        ) : (
          <span className="edu-emoji" aria-hidden="true">
            📖
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <span className="badge bg-secondary-subtle text-secondary-emphasis mb-2" style={{ width: 'fit-content' }}>
          {product.categorie?.nom || 'Scolaire'}
        </span>

        <h6 className="card-title fw-semibold mb-2">{product.nom}</h6>

        <p className="card-text text-muted small flex-grow-1">
          {(product.description?.substring(0, 70) || 'Description non disponible.') + (product.description ? '…' : '')}
        </p>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fw-bold fs-5 edu-text-accent">{price} DH</span>
          <span className={`badge ${product.disponible ? 'bg-success' : 'bg-danger'}`}>
            {product.disponible ? 'En stock' : 'Rupture'}
          </span>
        </div>
      </div>

      <div className="card-footer bg-white border-0 d-flex gap-2 pb-3">
        <Link to={`/produit/${product.id}`} className="btn btn-outline-secondary btn-sm flex-grow-1">
          Voir détails
        </Link>
        <button
          onClick={() => {
            if (!product.disponible) return;
            if (!user) {
              navigate('/login');
              return;
            }
            addToCart(product);
          }}
          disabled={!product.disponible}
          className="btn btn-sm flex-grow-1 text-white edu-btn-accent"
        >
          + Panier
        </button>
      </div>
    </div>
  );
}

