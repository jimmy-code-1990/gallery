import { memo, useState, useCallback, useRef } from 'react';

function VideoGallery({ videos, onDownload, onCopyPrompt }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (videos.length === 0) {
    return (
      <div className="gallery">
        <div className="empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <div>No videos found</div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>
            Configure GALLERY_VIDEO_DIRS to scan video directories
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gallery">
        <div className="masonry video-masonry">
          {videos.map((vid) => (
            <VideoCard
              key={vid.key}
              video={vid}
              onSelect={setSelectedVideo}
              onDownload={onDownload}
              onCopyPrompt={onCopyPrompt}
            />
          ))}
        </div>
      </div>

      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onCopyPrompt={onCopyPrompt}
          onDownload={onDownload}
        />
      )}
    </>
  );
}

const VideoCard = memo(function VideoCard({ video, onSelect, onDownload, onCopyPrompt }) {
  const videoRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div
      className="vid-card"
      onClick={() => onSelect(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="vid-card-inner">
        <video
          ref={videoRef}
          src={video.url}
          muted
          loop
          playsInline
          preload="metadata"
        />
        {/* Play icon badge */}
        <div className="vid-play-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>

      <div className="hover-overlay">
        {/* Top-right action buttons */}
        <div className="hover-actions">
          <button
            className="hover-btn"
            title="Download"
            onClick={(e) => { e.stopPropagation(); onDownload(video); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {video.prompt && (
            <button
              className="hover-btn"
              title="Copy prompt"
              onClick={(e) => { e.stopPropagation(); onCopyPrompt(video.prompt); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bottom info */}
        <div className="hover-bottom">
          <span className="hover-pill vid-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {video.name}
          </span>
        </div>
      </div>
    </div>
  );
});

function VideoDetailModal({ video, onClose, onCopyPrompt, onDownload }) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  const prompt = video.prompt || '';
  const isLongPrompt = prompt.length > 150;

  const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };

  return (
    <div className="detail-modal" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <button className="detail-close" onClick={onClose}>&times;</button>

      <div className="detail-layout" onClick={(e) => e.stopPropagation()}>
        {/* Left: Video */}
        <div className="detail-image-wrap">
          <video
            src={video.url}
            controls
            autoPlay
            loop
            playsInline
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }}
          />
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
              {prompt && (
                <button className="copy-btn" onClick={() => onCopyPrompt(prompt)} style={{ marginLeft: 'auto' }}>
                  Copy
                </button>
              )}
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

            <div className="detail-info-row">
              <span className="detail-info-label">File</span>
              <span className="detail-info-value" style={{ fontSize: 12 }}>{video.name}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label">Size</span>
              <span className="detail-info-value">{fmtSize(video.size)}</span>
            </div>

            <div className="detail-info-row">
              <span className="detail-info-label">Created</span>
              <span className="detail-info-value">{new Date(video.mtime).toLocaleString('zh-CN')}</span>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="detail-info-row">
                <span className="detail-info-label">Tags</span>
                <span className="detail-info-value">
                  {video.tags.map((tag, i) => (
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
            <button className="detail-btn-primary" onClick={() => onDownload(video)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>

            {prompt && (
              <button className="detail-btn-secondary" onClick={() => onCopyPrompt(prompt)} style={{ width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy Prompt
              </button>
            )}
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

export default VideoGallery;
