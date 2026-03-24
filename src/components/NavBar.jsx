export default function NavBar({ activeTab, onTabChange, imageCount, videoCount }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* LOGO */}
        <div className="navbar-logo">
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* U 形外框 */}
            <path
              d="M10 10V33C10 36.866 13.134 40 17 40H31C34.866 40 38 36.866 38 33V10"
              stroke="#e8e8e8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* X 交叉线 */}
            <line x1="10" y1="10" x2="38" y2="33" stroke="#e8e8e8" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="38" y1="10" x2="10" y2="33" stroke="#e8e8e8" strokeWidth="3.5" strokeLinecap="round"/>
          </svg>
          <span className="navbar-title">Gallery</span>
        </div>

        {/* Tabs */}
        <div className="navbar-tabs">
          <button
            className={`navbar-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => onTabChange('image')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            Image
            {imageCount > 0 && <span className="navbar-tab-count">{imageCount}</span>}
          </button>
          <button
            className={`navbar-tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => onTabChange('video')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Video
            {videoCount > 0 && <span className="navbar-tab-count">{videoCount}</span>}
          </button>
        </div>

        {/* Right: placeholder for future actions */}
        <div className="navbar-right" />
      </div>
    </nav>
  );
}
