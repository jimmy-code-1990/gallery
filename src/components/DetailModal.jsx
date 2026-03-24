import { useState, useEffect } from 'react';

export default function DetailModal({ image, onClose, onCopyPrompt, onDownload }) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const prompt = image.prompt || '';
  const isLongPrompt = prompt.length > 150;

  return (
    <div className="detail-modal" onClick={onClose}>
      <button className="detail-close" onClick={onClose}>&times;</button>

      <div className="detail-layout" onClick={(e) => e.stopPropagation()}>
        {/* Left: Image */}
        <div className="detail-image-wrap">
          <img src={image.url} alt="" />
        </div>

        {/* Right: Info Panel */}
        <div className="detail-panel">
          {/* Prompt Section */}
          <div className="detail-section">
            <div className="detail-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              PROMPT
              <button className="copy-btn" onClick={() => onCopyPrompt(prompt)} style={{ marginLeft: 'auto' }}>
                Copy
              </button>
            </div>
            <div className={`detail-prompt ${promptExpanded ? 'expanded' : ''}`}>
              {prompt || <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>No prompt available</span>}
            </div>
            {isLongPrompt && (
              <span className="detail-see-more" onClick={() => setPromptExpanded(!promptExpanded)}>
                {promptExpanded ? 'Show less' : 'See all ▾'}
              </span>
            )}
          </div>

          {/* Information Section */}
          <div className="detail-section">
            <div className="detail-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              INFORMATION
            </div>

            {image.model && (
              <div className="detail-info-row">
                <span className="detail-info-label">Model</span>
                <span className="detail-info-value">{image.model || 'Gemini'}</span>
              </div>
            )}

            <div className="detail-info-row">
              <span className="detail-info-label">Resolution</span>
              <span className="detail-info-value">{image.width} × {image.height}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label">Size</span>
              <span className="detail-info-value">{fmtSize(image.size)}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label">Created</span>
              <span className="detail-info-value">{new Date(image.mtime).toLocaleString('zh-CN')}</span>
            </div>

            {image.tags && image.tags.length > 0 && (
              <div className="detail-info-row">
                <span className="detail-info-label">Tags</span>
                <span className="detail-info-value">
                  {image.tags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,.06)',
                      fontSize: '11px',
                      color: 'var(--t2)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button className="detail-btn-primary" onClick={() => onCopyPrompt(prompt)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1014.85-3.36L23 6"/>
              </svg>
              Recreate
            </button>

            <div className="detail-btn-row">
              <button className="detail-btn-secondary" onClick={(e) => { e.stopPropagation(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Video
              </button>
              <button className="detail-btn-secondary" onClick={() => onDownload(image)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
            </div>

            <div className="detail-btn-row">
              <button className="detail-btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Upscale
              </button>
              <button className="detail-btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtSize(b) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}
