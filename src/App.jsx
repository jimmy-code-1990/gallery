import { useState, useEffect, useCallback } from 'react';
import { Agentation } from 'agentation';
import NavBar from './components/NavBar';
import Gallery from './components/Gallery';
import VideoGallery from './components/VideoGallery';
import DetailModal from './components/DetailModal';
import Toast from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [imgRes, vidRes] = await Promise.all([
        fetch('/api/images'),
        fetch('/api/videos')
      ]);
      const imgData = await imgRes.json();
      const vidData = await vidRes.json();
      setImages(imgData.images || []);
      setVideos(vidData.videos || []);
    } catch (e) {
      console.error('Failed to load:', e);
    }
  }

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2200);
  }, []);

  const handleCopyPrompt = useCallback((prompt) => {
    navigator.clipboard.writeText(prompt).then(() => showToast('✅ Prompt copied'));
  }, [showToast]);

  const handleDownload = useCallback((item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    a.click();
    showToast('⬇️ Downloading...');
  }, [showToast]);

  // Sort by time, newest first
  const sortedImages = [...images].sort((a, b) => b.mtime - a.mtime);
  const sortedVideos = [...videos].sort((a, b) => b.mtime - a.mtime);

  const filteredImages = searchQuery.trim()
    ? sortedImages.filter(img =>
        (img.prompt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (img.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedImages;

  return (
    <div className="app-container">
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        imageCount={images.length}
        videoCount={videos.length}
      />

      {activeTab === 'image' ? (
        <Gallery
          images={filteredImages}
          onSelect={setSelectedImage}
          onDownload={handleDownload}
          onCopyPrompt={handleCopyPrompt}
        />
      ) : (
        <VideoGallery
          videos={sortedVideos}
          onDownload={handleDownload}
          onCopyPrompt={handleCopyPrompt}
        />
      )}

      {selectedImage && (
        <DetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onCopyPrompt={handleCopyPrompt}
          onDownload={handleDownload}
        />
      )}

      <Toast show={toast.show} message={toast.message} />
      <Agentation endpoint="http://localhost:4747" />
    </div>
  );
}

export default App;
