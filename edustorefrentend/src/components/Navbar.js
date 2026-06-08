import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import brandMark from '../assets/edustore-luxury-mark.svg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark edu-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="edu-brand-mark" aria-hidden="true">
            <img className="edu-brand-logo" src={brandMark} alt="" />
          </span>
          <span className="fw-bold">edustore</span>
          <span className="edu-brand-tagline d-none d-md-inline">Votre bibliothèque en ligne</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Accueil
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/catalogue">
                Catalogue
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <Link to="/panier" className="btn btn-outline-light btn-sm position-relative edu-btn-soft">
              Panier
              {count > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="dropdown">
                <button className="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                  {user.prenom ? `👤 ${user.prenom}` : '👤 Mon compte'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {user.role === 'admin' && (
                    <li>
                      <Link className="dropdown-item" to="/admin">
                        Dashboard Admin
                      </Link>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm edu-btn-soft">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-light btn-sm edu-btn-solid">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

