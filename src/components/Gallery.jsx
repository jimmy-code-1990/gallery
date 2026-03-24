import { memo } from 'react';

function Gallery({ images, onSelect, onDownload, onCopyPrompt }) {
  if (images.length === 0) {
    return (
      <div className="gallery">
        <div className="empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <div>No images found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="masonry">
        {images.map((img) => (
          <ImageCard
            key={img.key}
            image={img}
            onSelect={onSelect}
            onDownload={onDownload}
            onCopyPrompt={onCopyPrompt}
          />
        ))}
      </div>
    </div>
  );
}

const ImageCard = memo(function ImageCard({ image, onSelect, onDownload, onCopyPrompt }) {
  return (
    <div className="img-card" onClick={() => onSelect(image)}>
      <img
        src={image.url}
        alt=""
        loading="lazy"
      />
      <div className="hover-overlay">
        {/* Top-right action buttons */}
        <div className="hover-actions">
          <button
            className="hover-btn"
            title="Like"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
          <button
            className="hover-btn"
            title="Download"
            onClick={(e) => { e.stopPropagation(); onDownload(image); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            className="hover-btn"
            title="Copy prompt"
            onClick={(e) => { e.stopPropagation(); onCopyPrompt(image.prompt || ''); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>

        {/* Bottom action pills */}
        <div className="hover-bottom">
          <button className="hover-pill" onClick={(e) => { e.stopPropagation(); onCopyPrompt(image.prompt || ''); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9l6 6m0-6l-6 6"/>
            </svg>
            Reference
          </button>
          <button className="hover-pill" onClick={(e) => { e.stopPropagation(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Animate
          </button>
          <button className="hover-pill" onClick={(e) => { e.stopPropagation(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Upscale
          </button>
        </div>
      </div>
    </div>
  );
});

export default Gallery;
