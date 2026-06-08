import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', adresse: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const panierRes = await api.post('/paniers', {});
      const panierId = panierRes.data.panier?.id;
      for (const item of cart) {
        await api.post(`/paniers/${panierId}/ajouter`, { produit_id: item.id, quantite: item.qty });
      }
      await api.post('/commandes', {
        panier_id: panierId,
        adresse_livraison: `${form.prenom} ${form.nom} - ${form.adresse}`,
        telephone_livraison: form.telephone,
        mode_paiement: 'cash_on_delivery',
      });
      clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la commande.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="container py-5 text-center">
        <div style={{ fontSize: 80 }} className="mb-3">
          ✅
        </div>
        <h2 className="fw-bold mb-2">Commande confirmée !</h2>
        <p className="text-muted mb-4">
          Votre commande a été passée avec succès. Vous serez contacté pour la livraison.
        </p>
        <Link to="/" className="btn text-white px-5 py-2 edu-btn-accent">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="fw-semibold mb-4">Commander</h1>
      {error && <div className="alert alert-danger">⚠️ {error}</div>}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Informations de livraison</h5>
              <form onSubmit={handleOrder}>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">Prénom</label>
                    <input className="form-control edu-input" value={form.prenom} onChange={set('prenom')} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Nom</label>
                    <input className="form-control edu-input" value={form.nom} onChange={set('nom')} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Téléphone</label>
                    <input className="form-control edu-input" value={form.telephone} onChange={set('telephone')} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Adresse complète</label>
                    <textarea className="form-control edu-input" rows={3} value={form.adresse} onChange={set('adresse')} required />
                  </div>
                </div>

                <hr className="my-4" />
                <h5 className="fw-bold mb-3">Mode de paiement</h5>
                <div className="card border-2 p-3 mb-4 edu-pay-card">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" checked readOnly />
                    <label className="form-check-label fw-semibold">💵 Paiement à la livraison</label>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn w-100 text-white fw-semibold py-2 edu-btn-accent">
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: 84 }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Récapitulatif</h5>
              {cart.map((item) => (
                <div key={item.id} className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">📖</span>
                    <div>
                      <div className="small fw-semibold">{item.nom}</div>
                      <div className="small text-muted">x{item.qty}</div>
                    </div>
                  </div>
                  <span className="fw-semibold">{(Number(item.prix || 0) * item.qty).toFixed(2)} DH</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Sous-total</span>
                <span>{total.toFixed(2)} DH</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Livraison</span>
                <span className="text-success">Gratuite</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5">
                <span>Total</span>
                <span className="edu-text-accent">{total.toFixed(2)} DH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

