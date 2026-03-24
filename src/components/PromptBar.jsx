export default function PromptBar({ searchQuery, onSearchChange, imageCount }) {
  return (
    <div className="prompt-bar" style={{ display: 'none' }}>
      <div className="prompt-bar-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#555', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          className="prompt-bar-input"
          type="text"
          placeholder="Describe the scene you imagine"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="prompt-bar-tags">
          <div className="prompt-tag">
            <span style={{ color: '#6366F1', fontWeight: 700, fontSize: 13 }}>G</span>
            Gemini
          </div>
          <div className="prompt-tag">📷 {imageCount}</div>
        </div>
      </div>
    </div>
  );
}
