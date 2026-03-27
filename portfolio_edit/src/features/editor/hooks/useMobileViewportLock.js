import { useEffect } from 'react';

export function useMobileViewportLock(isMobile) {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewportMeta?.getAttribute('content') || '';

    if (isMobile && viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      );
    }

    if (!isMobile) {
      if (viewportMeta && previousViewport) {
        viewportMeta.setAttribute('content', previousViewport);
      }
      return undefined;
    }

    const preventGesture = (event) => {
      event.preventDefault();
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);

      if (viewportMeta && previousViewport) {
        viewportMeta.setAttribute('content', previousViewport);
      }
    };
  }, [isMobile]);
}
