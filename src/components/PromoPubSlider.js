import { useEffect, useMemo, useState } from 'react';

/**
 * Affiche publicités et promotions dans un seul bloc, défilement automatique.
 */
export default function PromoPubSlider({ publicites = [], promotions = [], intervalMs = 4500, imageHeight = 200 }) {
  const slides = useMemo(() => {
    const pub = (Array.isArray(publicites) ? publicites : []).map((p) => ({ ...p, kind: 'pub' }));
    const pro = (Array.isArray(promotions) ? promotions : []).map((p) => ({ ...p, kind: 'promo' }));
    return [...pub, ...pro];
  }, [publicites, promotions]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) {
    return (
      <div
        className="rounded-4 border bg-white d-flex align-items-center justify-content-center text-muted small"
        style={{ minHeight: imageHeight + 120 }}
      >
        Aucune publicité ni promotion pour le moment
      </div>
    );
  }

  return (
    <div className="rounded-4 overflow-hidden bg-white">
      <div className="position-relative" style={{ minHeight: imageHeight + 140 }}>
        {slides.map((s, i) => (
          <article
            key={`${s.kind}-${s.id}`}
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{
              opacity: i === index ? 1 : 0,
              transition: 'opacity 0.55s ease',
              zIndex: i === index ? 2 : 1,
              pointerEvents: i === index ? 'auto' : 'none',
            }}
            aria-hidden={i !== index}
          >
            <div
              className="w-100 flex-shrink-0 bg-light border-bottom overflow-hidden"
              style={{ height: imageHeight }}
            >
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt=""
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">
                  {s.kind === 'pub' ? 'Publicité' : 'Promotion'}
                </div>
              )}
            </div>
            <div className="p-3 flex-grow-1 d-flex flex-column">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span
                  className={`badge text-white ${s.kind === 'pub' ? 'bg-primary' : ''}`}
                  style={s.kind === 'promo' ? { background: 'var(--edu-primary, #5c1520)' } : undefined}
                >
                  {s.kind === 'pub' ? 'Publicité' : 'Promotion'}
                </span>
              </div>
              <h3 className="fw-semibold h6 mb-2">{s.titre || 'Sans titre'}</h3>
              {s.kind === 'promo' && s.code_promo ? (
                <p className="small text-muted mb-2 mb-md-0">Code : <strong>{s.code_promo}</strong></p>
              ) : null}
              {s.description ? (
                <p className="small text-muted mb-2 flex-grow-1" style={{ lineHeight: 1.45 }}>
                  {String(s.description).slice(0, 140)}
                  {String(s.description).length > 140 ? '…' : ''}
                </p>
              ) : (
                <div className="flex-grow-1" />
              )}
              {s.lien ? (
                <a className="edu-link-accent text-decoration-none small fw-semibold mt-auto" href={s.lien} target="_blank" rel="noreferrer">
                  {s.kind === 'pub' ? "Voir l'offre →" : 'Profiter →'}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="px-3 pb-3 d-flex justify-content-center align-items-center gap-1 flex-wrap" role="tablist" aria-label="Diapositive">
          {slides.map((s, i) => (
            <button
              key={`dot-${s.kind}-${s.id}`}
              type="button"
              className="border-0 rounded-pill p-0"
              onClick={() => setIndex(i)}
              aria-label={`Afficher la diapositive ${i + 1} sur ${slides.length}`}
              aria-current={i === index ? 'true' : undefined}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                backgroundColor: i === index ? 'var(--edu-primary, #5c1520)' : '#dee2e6',
                transition: 'width 0.2s ease, background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
