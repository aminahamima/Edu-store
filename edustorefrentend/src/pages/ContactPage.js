export default function ContactPage() {
  const whatsappNumber = '+212625395438';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}`;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="fw-semibold mb-2">Contactez-nous</h1>
          <p className="text-muted mb-5">Notre équipe est disponible pour vous aider</p>

          <div className="row g-4 mb-5">
            {[
              { icon: '📞', title: 'Téléphone', value: 'XXX-XXX-XXXX', sub: 'Lun-Ven 9h-18h' },
              { icon: '💬', title: 'WhatsApp', value: whatsappNumber, sub: 'Réponse rapide', href: whatsappLink },
              { icon: '✉️', title: 'Email', value: 'info@edustore.com', sub: 'Réponse sous 24h' },
              { icon: '📍', title: 'Adresse', value: '123 School Lane', sub: 'Education City, EC 12345' },
            ].map(({ icon, title, value, sub, href }) => (
              <div key={title} className="col-md-4">
                <div className="card border-0 shadow-sm text-center p-4 h-100 edu-card">
                  <div className="fs-1 mb-2">{icon}</div>
                  <h6 className="fw-bold">{title}</h6>
                  {href ? (
                    <a className="mb-1 fw-semibold edu-text-accent text-decoration-none d-inline-block" href={href} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : (
                    <p className="mb-1 fw-semibold edu-text-accent">{value}</p>
                  )}
                  <small className="text-muted">{sub}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-5">
              <h4 className="fw-bold mb-4">Envoyer un message</h4>
              <form>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">Prénom</label>
                    <input className="form-control edu-input" placeholder="Jean" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Nom</label>
                    <input className="form-control edu-input" placeholder="Dupont" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className="form-control edu-input" placeholder="votre@email.com" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Sujet</label>
                    <input className="form-control edu-input" placeholder="Sujet de votre message" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Message</label>
                    <textarea className="form-control edu-input" rows={5} placeholder="Votre message..." />
                  </div>
                  <div className="col-12">
                    <button className="btn text-white fw-semibold px-5 py-2 edu-btn-accent" type="button">
                      Envoyer le message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

