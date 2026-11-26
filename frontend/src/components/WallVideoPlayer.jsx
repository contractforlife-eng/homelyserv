// frontend/src/components/WallVideoPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { wallVideoCoordinator, getWallVideoPosterUrl } from '../utils/wallVideoCoordinator';

/**
 * WallVideoPlayer renders a wall video with:
 * 1. Automatic coordination: pauses other playing videos when playback starts.
 * 2. Reliable video preview poster (Cloudinary first-frame transformation or HTML5 #t=0.001).
 * 3. Preserves aspect ratio (portrait, landscape, square) with object-contain.
 * 4. Eliminates the Android WebView default giant black play icon before user tap.
 * 5. Clean, appropriately sized, centered play overlay button.
 * 6. Preserves native controls once started, volume, fullscreen, seeking.
 * 7. Clean unmount cleanup (prevents orphaned playback).
 */
export default function WallVideoPlayer({ id, src, className = '' }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const posterUrl = getWallVideoPosterUrl(src);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !id) return;

    wallVideoCoordinator.register(id, el);

    const onPlay = () => {
      setIsPlaying(true);
      wallVideoCoordinator.notifyPlay(id, el);
    };

    const onPause = () => {
      setIsPlaying(false);
      wallVideoCoordinator.notifyPause(id);
    };

    const onEnded = () => {
      setIsPlaying(false);
      wallVideoCoordinator.notifyPause(id);
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      wallVideoCoordinator.unregister(id, el);
    };
  }, [id, src]);

  // Preload poster image to detect if it loaded cleanly
  useEffect(() => {
    if (!posterUrl) {
      setPosterLoaded(false);
      setPosterError(true);
      return;
    }
    const img = new Image();
    img.src = posterUrl;
    img.onload = () => {
      setPosterLoaded(true);
      setPosterError(false);
    };
    img.onerror = () => {
      setPosterLoaded(false);
      setPosterError(true);
    };
  }, [posterUrl]);

  const handleStartPlay = () => {
    const el = videoRef.current;
    if (el) {
      el.play().catch(() => {});
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-black group ${className}`}>
      {/* Background Poster Image (if available) before playback */}
      {!isPlaying && posterLoaded && !posterError && (
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Actual HTML5 Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={!posterError ? posterUrl : undefined}
        controls
        playsInline
        preload="metadata"
        className="relative z-10 max-h-[550px] w-full object-contain"
        style={{ aspectRatio: 'auto' }}
      />

      {/* Centered Play Button Overlay before playback begins */}
      {!isPlaying && (
        <div
          onClick={handleStartPlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Play video"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStartPlay();
            }
          }}
        >
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110 active:scale-95">
            <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-current translate-x-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
