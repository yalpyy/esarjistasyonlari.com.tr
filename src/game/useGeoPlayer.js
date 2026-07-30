import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RULES, distance, opensNewCells, isPlausibleMove, exploredArea, cellsAround,
  FALLBACK_POSITION
} from './geo';
import { recordDiscovery } from './api';

const CACHE_KEY = 'sarj.geo.cells.v2';

/**
 * Oyuncunun konumunu izler, yeni H3 hücrelerini açar ve sunucuya bildirir.
 * Rıza verilmeden `enabled` true olmamalı.
 *
 * Konum alınamazsa (izin reddi, sinyal yok, desteklenmeyen cihaz) oyuncuya
 * DEMO modu sunulur: harita Ataşehir'de açılır, 3B dünya gezilebilir, ama
 * konum sunucuya gönderilmez ve ekonomiye dokunulamaz. Sahte konumu sunucuya
 * göndermek, izni reddeden herkese serbest istasyon kurma hakkı verirdi.
 */
export default function useGeoPlayer({ enabled = false, initialCells = [] } = {}) {
  const [position, setPosition] = useState(null);      // {lat, lng, accuracy, t}
  const [cells, setCells] = useState(() => new Set([...readCache(), ...initialCells]));
  // idle | locating | tracking | denied | weak | error | demo
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [suspicious, setSuspicious] = useState(false);
  const [demo, setDemo] = useState(false);

  const cellsRef = useRef(cells);
  const prevRef = useRef(null);
  const watchRef = useRef(null);
  const pendingRef = useRef(false);
  const demoRef = useRef(false);

  useEffect(() => { cellsRef.current = cells; }, [cells]);
  useEffect(() => { demoRef.current = demo; }, [demo]);

  useEffect(() => {
    if (!initialCells.length) return;
    setCells((prev) => {
      const next = new Set(prev);
      initialCells.forEach((c) => next.add(c));
      return next;
    });
  }, [initialCells]);

  const mergeCells = useCallback((incoming) => {
    setCells((prev) => {
      const next = new Set(prev);
      incoming.forEach((c) => next.add(c));
      writeCache(next);
      return next;
    });
  }, []);

  const commit = useCallback(async (point) => {
    if (demoRef.current) return;   // demo konumu sunucuya ASLA gönderilmez
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const res = await recordDiscovery(point);
      if (res?.ok && Array.isArray(res.cells)) {
        mergeCells(res.cells);
      } else if (res?.reason === 'implausible') {
        setSuspicious(true);
      } else if (res?.reason === 'network') {
        // Çevrimdışı: yerelde aç, bir sonraki açılışta sunucu listesi esas alınır.
        mergeCells(cellsAround(point));
      }
    } finally {
      pendingRef.current = false;
    }
  }, [mergeCells]);

  useEffect(() => {
    if (!enabled || demo) return undefined;
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Bu cihaz konum servisini desteklemiyor.');
      return undefined;
    }

    setStatus('locating');

    const onPos = (pos) => {
      const point = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        t: pos.timestamp || Date.now()
      };
      setPosition(point);
      setError(null);

      if (point.accuracy > RULES.MAX_ACCURACY) {
        setStatus('weak');   // konumu göster ama keşif sayma
        return;
      }
      if (!isPlausibleMove(prevRef.current, point)) {
        setSuspicious(true);
        return;
      }

      setStatus('tracking');
      prevRef.current = point;
      if (opensNewCells(point, cellsRef.current)) commit(point);
    };

    const onErr = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setStatus('denied');
        setError('Oyunu oynamak için konum izni gerekiyor.');
      } else {
        setStatus('error');
        setError('Konum alınamadı. Açık alanda tekrar dene.');
      }
    };

    const start = () => {
      if (watchRef.current !== null) return;
      watchRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      });
    };
    const stop = () => {
      if (watchRef.current === null) return;
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };

    // Pil koruması: sekme arka plandayken GPS'i bırak.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [enabled, demo, commit]);

  /**
   * Demo moduna geç: haritayı Ataşehir'de aç.
   *
   * Hücreler yalnızca BELLEKTE açılıyor — writeCache çağrılmıyor, çünkü demo
   * izini kalıcı önbelleğe yazmak, oyuncu gerçek konumla döndüğünde sahte
   * keşfedilmiş alan bırakırdı.
   */
  const startDemo = useCallback(() => {
    setDemo(true);
    setStatus('demo');
    setError(null);
    setSuspicious(false);
    prevRef.current = null;
    setPosition({ ...FALLBACK_POSITION, accuracy: null, demo: true, t: Date.now() });
    setCells(new Set(cellsAround(FALLBACK_POSITION)));
  }, []);

  /** Demodan çık ve konumu yeniden dene. */
  const retryLocation = useCallback(() => {
    setDemo(false);
    setStatus('locating');
    setError(null);
    setPosition(null);
    setCells(new Set(readCache()));
  }, []);

  return {
    position,
    cells,
    status,
    error,
    suspicious,
    isDemo: demo,
    /** Konum alınamadı; oyuncuya demo teklif edilmeli. */
    locationUnavailable: status === 'denied' || status === 'error',
    startDemo,
    retryLocation,
    exploredKm2: exploredArea(cells),
    distanceTo: useCallback(
      (target) => (position && target ? distance(position, target) : null),
      [position]
    ),
    /** Rıza geri çekildiğinde yerel izi de sil. */
    forget: () => {
      setCells(new Set());
      setPosition(null);
      prevRef.current = null;
      try { localStorage.removeItem(CACHE_KEY); } catch { /* yoksay */ }
    }
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(set) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(set).slice(-20000)));
  } catch { /* depolama kapalı olabilir */ }
}
