import { useEffect, useRef, useCallback } from 'react';

/**
 * Safe AdSense push hook.
 * - Only pushes once per <ins> element lifetime
 * - Waits until container is visible and has width > 0
 * - Uses ResizeObserver + IntersectionObserver for reliable detection
 * - Fails silently — no console errors
 */
export function useAdsenseSafePush() {
  const insRef = useRef(null);
  const pushed = useRef(false);
  const observersRef = useRef({ resize: null, intersection: null });

  const tryPush = useCallback(() => {
    if (pushed.current) return;

    const el = insRef.current;
    if (!el) return;

    // Element must be in the DOM and have real width
    if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return;

    // Check computed visibility
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;

    // Check parent chain isn't hidden
    const parent = el.closest('.ad-banner-container');
    if (parent && parent.offsetWidth <= 0) return;

    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
        cleanup();
      }
    } catch {
      // Fail silently — do not pollute console
    }
  }, []);

  const cleanup = useCallback(() => {
    const { resize, intersection } = observersRef.current;
    if (resize) {
      resize.disconnect();
      observersRef.current.resize = null;
    }
    if (intersection) {
      intersection.disconnect();
      observersRef.current.intersection = null;
    }
  }, []);

  useEffect(() => {
    const el = insRef.current;
    if (!el || pushed.current) return;

    // Attempt immediate push (element might already be visible)
    tryPush();
    if (pushed.current) return;

    // Set up ResizeObserver to detect when element gets width
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            tryPush();
            break;
          }
        }
      });
      ro.observe(el);
      observersRef.current.resize = ro;
    }

    // Set up IntersectionObserver to detect visibility
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              tryPush();
              break;
            }
          }
        },
        { threshold: 0.1 }
      );
      io.observe(el);
      observersRef.current.intersection = io;
    }

    // Fallback: retry with requestAnimationFrame for edge cases
    let rafId;
    let retries = 0;
    const maxRetries = 20; // ~20 frames, roughly 300ms

    const rafRetry = () => {
      if (pushed.current || retries >= maxRetries) return;
      retries++;
      tryPush();
      if (!pushed.current) {
        rafId = requestAnimationFrame(rafRetry);
      }
    };
    rafId = requestAnimationFrame(rafRetry);

    return () => {
      cleanup();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [tryPush, cleanup]);

  return { insRef, pushed };
}
