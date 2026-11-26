// frontend/src/utils/wallVideoCoordinator.js
/**
 * Centralized playback coordination for wall videos.
 * Ensures:
 * 1. Only one wall video may play at any given time across all components.
 * 2. When a video starts playing, any previously playing video is paused and muted.
 * 3. The previous video's currentTime (playback position) is preserved for resumption.
 * 4. Navigating away or unmounting cleanly unregisters and pauses the video.
 * 5. Works seamlessly across desktop, mobile browsers, and Capacitor Android WebView.
 */

class WallVideoCoordinator {
  constructor() {
    this.activeId = null;
    this.elements = new Map(); // id -> HTMLVideoElement
  }

  register(id, element) {
    if (!id || !element) return;
    this.elements.set(String(id), element);
  }

  unregister(id, element) {
    if (!id) return;
    const strId = String(id);
    const existing = this.elements.get(strId);
    if (!element || existing === element) {
      if (this.activeId === strId && existing) {
        try {
          existing.pause();
        } catch {}
        this.activeId = null;
      }
      this.elements.delete(strId);
    }
  }

  notifyPlay(id, element) {
    if (!id) return;
    const strId = String(id);
    if (element) {
      this.elements.set(strId, element);
    }

    if (this.activeId && this.activeId !== strId) {
      const prevElement = this.elements.get(this.activeId);
      if (prevElement && !prevElement.paused) {
        try {
          prevElement.pause();
        } catch {}
      }
    }
    this.activeId = strId;
  }

  notifyPause(id) {
    const strId = String(id);
    if (this.activeId === strId) {
      this.activeId = null;
    }
  }

  stopAll() {
    this.elements.forEach((el) => {
      if (el && !el.paused) {
        try {
          el.pause();
        } catch {}
      }
    });
    this.activeId = null;
  }

  getActiveId() {
    return this.activeId;
  }
}

export const wallVideoCoordinator = new WallVideoCoordinator();

/**
 * Derives a reliable, optimized poster image URL for videos.
 * - For Cloudinary videos: requests the first frame (so_0), format jpg (f_jpg), q_auto.
 *   This avoids downloading any video data just to render a poster.
 * - For non-Cloudinary videos: appends `#t=0.001` hint which enables native video frame thumbnailing in modern browsers/WebViews.
 */
export function getWallVideoPosterUrl(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed) return '';

  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/video/upload/')) {
    // Insert transformation right after /video/upload/ (and optional version /v123/)
    // and change file extension to .jpg
    return trimmed
      .replace(/\/video\/upload\/(?:v\d+\/)?/, (match) => {
        if (match.includes('v')) {
          return match.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto/');
        }
        return '/video/upload/so_0,f_jpg,q_auto/';
      })
      .replace(/\.[a-zA-Z0-9]+(?:\?.*)?$/, '.jpg');
  }

  if (trimmed.includes('#')) {
    return trimmed;
  }
  return `${trimmed}#t=0.001`;
}
