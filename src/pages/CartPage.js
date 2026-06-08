import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="fs-1 mb-3">🛒</div>
        <h3 className="fw-semibold mb-2">Votre panier est vide</h3>
        <p className="text-muted mb-4">Ajoutez des produits depuis le catalogue</p>
        <Link to="/catalogue" className="btn text-white px-4 edu-btn-accent">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="fw-semibold mb-4">Mon panier</h1>
      <div className="row g-4">
        <div className="col-lg-8">
          {cart.map((item) => (
            <div key={item.id} className="card border-0 shadow-sm mb-3 edu-cart-item">
              <div className="card-body">
                <div className="row align-items-center g-3">
                  <div className="col-2 text-center">
                    <div className="fs-1">📖</div>
                  </div>
                  <div className="col-4">
                    <h6 className="fw-semibold mb-1">{item.nom}</h6>
                    <small className="text-muted">{item.categorie?.nom}</small>
                  </div>
                  <div className="col-3">
                    <div className="input-group input-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => updateQty(item.id, item.qty - 1)}>
                        -
                      </button>
                      <input type="text" className="form-control text-center" value={item.qty} readOnly style={{ maxWidth: 50 }} />
                      <button className="btn btn-outline-secondary" onClick={() => updateQty(item.id, item.qty + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="col-2 text-end fw-bold edu-text-accent">
                    {(Number(item.prix || 0) * item.qty).toFixed(2)} DH
                  </div>
                  <div className="col-1 text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(item.id)} aria-label="Supprimer">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: 84 }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Récapitulatif</h5>
              {cart.map((item) => (
                <div key={item.id} className="d-flex justify-content-between small text-muted mb-2">
                  <span>
                    {item.nom} x{item.qty}
                  </span>
                  <span>{(Number(item.prix || 0) * item.qty).toFixed(2)} DH</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span className="edu-text-accent">{total.toFixed(2)} DH</span>
              </div>
              <button
                onClick={() => (user ? navigate('/checkout') : navigate('/login'))}
                className="btn w-100 text-white fw-semibold py-2 edu-btn-accent"
              >
                {user ? 'Passer la commande' : 'Se connecter pour commander'}
              </button>
              <Link to="/catalogue" className="btn btn-outline-secondary w-100 mt-2">
                Continuer les achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

