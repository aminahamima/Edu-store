import { useEffect, useMemo, useState } from 'react';

export default function ImageSlider({
  images,
  interval = 3000,
  showControls = false,
  height = 260,
}) {
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [safeImages.length]);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const id = setInterval(() => setIndex((prev) => (prev + 1) % safeImages.length), interval);
    return () => clearInterval(id);
  }, [safeImages.length, interval]);

  if (!safeImages.length) {
    return (
      <div
        className="bg-light d-flex align-items-center justify-content-center rounded"
        style={{ height, overflow: 'hidden' }}
      >
        <span className="text-muted small">Aucune image</span>
      </div>
    );
  }

  const goPrev = () => setIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  const goNext = () => setIndex((prev) => (prev + 1) % safeImages.length);

  return (
    <div
      className="position-relative bg-white rounded overflow-hidden"
      style={{ height, border: '1px solid rgba(0,0,0,0.05)' }}
    >
      {safeImages.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ))}

      {showControls && safeImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="btn btn-sm btn-light position-absolute top-50 start-0 translate-middle-y"
            style={{ opacity: 0.85 }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="btn btn-sm btn-light position-absolute top-50 end-0 translate-middle-y"
            style={{ opacity: 0.85 }}
          >
            ›
          </button>
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-1 d-flex gap-1">
            {safeImages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: i === index ? '#c2185b' : '#ddd',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

