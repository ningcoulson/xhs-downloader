'use client';

import { useState } from 'react';

type MediaItem = {
  url: string;
  traceId: string;
  original: string;
};

type NoteData = {
  title: string;
  desc: string;
  type: 'video' | 'normal';
  user: {
    nickname: string;
    avatar: string;
  };
  images: MediaItem[];
  video: string | null;
};

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NoteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/parse?url=${encodeURIComponent(inputUrl)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to parse');
      }

      setData(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Method 1: Open in new tab (Preview/Manual Save)
  const handlePreview = (url: string, filename: string) => {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&inline=true`;
    window.open(proxyUrl, '_blank');
  };

  // Method 2: Trigger browser download (Auto-save)
  const handleDirectDownload = (url: string, filename: string) => {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Method 3: Batch download
  const handleDownloadAll = async () => {
    if (!data || !data.images) return;

    let count = 0;
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      // Stagger downloads to prevent browser blocking
      setTimeout(() => {
        handleDirectDownload(img.original, `xhs-image-${i}.jpg`);
      }, count * 800);
      count++;
    }
  };

  return (
    <main className="container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px' }}>
          <span className="gradient-text">XHS</span> Downloader
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Paste a Xiaohongshu link to extract HD images and videos.
        </p>
      </div>

      <div className="input-group">
        <input
          type="text"
          placeholder="Paste link here (e.g. http://xhslink.com/...)"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleParse()}
        />
        <button onClick={handleParse} disabled={loading}>
          {loading ? <span className="loader"></span> : 'Parse'}
        </button>
      </div>

      {error && (
        <div className="error-msg">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {data && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {data.user.avatar && (
              <img
                src={data.user.avatar}
                alt="Avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary-color)' }}
              />
            )}
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>{data.user.nickname}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{data.type === 'video' ? 'Video Note' : 'Image Note'}</p>
            </div>
          </div>

          <h2 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>{data.title}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {data.desc}
          </p>

          {/* Download All Button */}
          {data.type === 'normal' && data.images.length > 1 && (
            <button
              onClick={handleDownloadAll}
              style={{
                width: '100%',
                background: 'var(--primary-color)',
                fontSize: '1.2rem',
                padding: '16px',
                marginBottom: '40px', // Extra space below the big button
                boxShadow: '0 4px 12px rgba(255, 36, 66, 0.4)', // Slightly stronger shadow for impact
                borderRadius: '12px'
              }}
            >
              Download All ({data.images.length}) Images
            </button>
          )}

          {data.video ? (
            <div>
              <div className="video-player">
                <video controls src={data.video} poster={data.images[0]?.original}></video>
              </div>
              <button
                style={{ marginTop: '16px', width: '100%' }}
                onClick={() => handleDirectDownload(data.video!, `xhs-video-${Date.now()}.mp4`)}
              >
                Download HD Video
              </button>
            </div>
          ) : (
            <div className="media-grid">
              {data.images.map((img, idx) => (
                <div key={idx} className="media-item">
                  <img src={img.url} alt={`Image ${idx + 1}`} />
                  <div className="btn-group" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="preview-btn"
                      title="Preview & Save Check"
                      style={{ flex: 1, padding: '8px' }}
                      onClick={() => handlePreview(img.original, `xhs-image-${idx}.jpg`)}
                    >
                      Preview
                    </button>
                    <button
                      className="download-btn"
                      title="Direct Download"
                      style={{ flex: 1, padding: '8px' }}
                      onClick={() => handleDirectDownload(img.original, `xhs-image-${idx}.jpg`)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
