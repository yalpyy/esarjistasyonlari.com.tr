import { useState, useRef, useCallback } from 'react';

export function useAdInterstitial() {
  const [showAd, setShowAd] = useState(false);
  const filterCountRef = useRef(0);
  const pendingCallbackRef = useRef(null);

  const triggerAdOnDirections = useCallback((callback) => {
    pendingCallbackRef.current = callback;
    setShowAd(true);
  }, []);

  const trackFilterChange = useCallback(() => {
    filterCountRef.current += 1;
    if (filterCountRef.current >= 3) {
      filterCountRef.current = 0;
      setShowAd(true);
    }
  }, []);

  const closeAd = useCallback(() => {
    setShowAd(false);
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current();
      pendingCallbackRef.current = null;
    }
  }, []);

  return { showAd, triggerAdOnDirections, trackFilterChange, closeAd };
}
