import brandMark from '../assets/edustore-luxury-mark.svg';

export default function Footer() {
  const whatsappNumber = '+212625395438';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}`;

  return (
    <footer className="edu-footer text-white mt-5 py-5">
      <div className="container">
        <div className="row g-4 align-items-start">
          <div className="col-md-5">
            <div className="d-flex align-items-center gap-2 mb-2">
              <img src={brandMark} alt="EduStore" className="edu-footer-logo" />
              <div>
                <div className="fw-bold">edustore</div>
                <div className="text-white-50 small">Votre bibliothèque en ligne</div>
              </div>
            </div>
            <p className="text-white-50 small mb-0">
              Livres scolaires, fournitures et essentiels de rentrée. Une expérience simple, rapide et fiable.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <div className="fw-bold mb-2">Navigation</div>
            <ul className="list-unstyled small mb-0">
              <li>
                <a href="/" className="edu-footer-link">
                  Accueil
                </a>
              </li>
              <li>
                <a href="/catalogue" className="edu-footer-link">
                  Catalogue
                </a>
              </li>
              <li>
                <a href="/contact" className="edu-footer-link">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <div className="fw-bold mb-2">Contact</div>
            <div className="small text-white-50">
              <div className="mb-1">📞 XXX-XXX-XXXX</div>
              <div className="mb-1">
                💬{' '}
                <a className="edu-footer-link text-decoration-none" href={whatsappLink} target="_blank" rel="noreferrer">
                  WhatsApp: {whatsappNumber}
                </a>
              </div>
              <div className="mb-1">✉️ info@edustore.com</div>
              <div>📍 123 School Lane, Education City</div>
            </div>
          </div>
        </div>

        <hr className="edu-footer-sep my-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div className="text-white-50 small">© 2026 EduStore. Tous droits réservés.</div>
          <div className="text-white-50 small">Conçu avec React + Bootstrap</div>
        </div>
      </div>
    </footer>
  );
}

