import { useCallback, useEffect, useRef, useState } from 'react';
import ConsentGate from './ConsentGate';
import GameMap from './GameMap';
import useGeoPlayer from './useGeoPlayer';
import { canBuildAt, formatDistance, RULES, distance, cellCount, turkeyProgress } from './geo';
import {
  cellsInBbox, stationsInBbox, buildStation, claimStation, collectIncome, signOut
} from './api';
import './game3d.css';

const COST = { AC: 1000, DC: 5000 };

export default function GamePage() {
  return <ConsentGate>{(ctx) => <Game {...ctx} />}</ConsentGate>;
}

function Game({ profile, refreshProfile }) {
  const [serverCells, setServerCells] = useState([]);
  const [stations, setStations] = useState([]);
  const [buildMode, setBuildMode] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const { position, cells, status, error, suspicious, exploredKm2 } =
    useGeoPlayer({ enabled: true, initialCells: serverCells });

  const say = useCallback((text, tone = 'info') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* Görünen alandaki veriyi çek — tüm dünyayı değil. */
  const refreshViewport = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const box = { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
    const [c, s] = await Promise.all([cellsInBbox(box), stationsInBbox(box)]);
    if (c.length) setServerCells(c);
    setStations(s.map((row) => ({
      id: row.id, kind: row.kind, title: row.title, lat: row.lat, lng: row.lng,
      power: row.power, owner: row.owner, mine: row.mine
    })));
  }, []);

  const onReady = useCallback((map) => {
    mapRef.current = map;
    let timer = null;
    map.on('moveend', () => {
      clearTimeout(timer);
      timer = setTimeout(refreshViewport, 400);
    });
    refreshViewport();
  }, [refreshViewport]);

  useEffect(() => {
    const id = setInterval(refreshViewport, 60000);
    return () => clearInterval(id);
  }, [refreshViewport]);

  const owned = stations.filter((s) => s.mine).length;
  const quota = 2 + (profile.level ?? 1);

  /* ---------- Kurulum ---------- */
  const handleMapTap = async ({ lat, lng }) => {
    if (!buildMode) return;
    const target = { lat, lng };
    const pre = canBuildAt(target, {
      player: position,
      cells,
      stations,
      balance: profile.balance,
      cost: COST[buildMode],
      quota,
      owned
    });
    if (!pre.ok) return say(pre.message, 'warn');

    setBusy(true);
    const res = await buildStation({
      lat, lng, kind: buildMode,
      accuracy: position.accuracy,
      playerLat: position.lat,
      playerLng: position.lng
    });
    setBusy(false);

    if (res?.ok) {
      say(`${buildMode} istasyonu kuruldu. Kalan kota: ${res.left}`, 'good');
      setBuildMode(null);
      await Promise.all([refreshProfile(), refreshViewport()]);
    } else {
      say(reasonText(res?.reason), 'warn');
    }
  };

  /* ---------- Gerçek istasyonu ele geçirme ---------- */
  const handleStationTap = (s) => {
    setSelected(s);
    if (buildMode) setBuildMode(null);
  };

  const claim = async () => {
    if (!selected || !position) return;
    setBusy(true);
    const res = await claimStation({
      ocmId: Number(selected.id), lat: position.lat, lng: position.lng, accuracy: position.accuracy
    });
    setBusy(false);
    if (res?.ok) {
      say('İstasyon 24 saatliğine senin.', 'good');
      setSelected(null);
      refreshViewport();
    } else {
      say(reasonText(res?.reason, res), 'warn');
    }
  };

  const collect = async () => {
    setBusy(true);
    const res = await collectIncome();
    setBusy(false);
    if (res?.ok) {
      say(res.over_capacity
        ? `₺${res.earned} toplandı — trafo aşımı geliri kırptı (${Math.round(res.load_kw)} kW).`
        : `₺${res.earned} toplandı.`, res.over_capacity ? 'warn' : 'good');
      refreshProfile();
    } else {
      say('Gelir toplanamadı.', 'warn');
    }
  };

  const claimDistance = selected && position ? distance(position, selected) : null;
  const canClaim = selected?.kind === 'real' && claimDistance !== null && claimDistance <= RULES.CLAIM_RANGE;

  return (
    <div className="game-shell">
      <GameMap
        position={position}
        cells={cells}
        stations={stations}
        buildMode={buildMode}
        onMapTap={handleMapTap}
        onStationTap={handleStationTap}
        onReady={onReady}
      />

      {/* HUD */}
      <div className="hud-top">
        <div className="hud-card">
          <b>₺{Math.round(profile.balance).toLocaleString('tr-TR')}</b>
          <span>Sv {profile.level} · {owned}/{quota} istasyon</span>
        </div>
        <div className="hud-card">
          <b>{cellCount(cells).toLocaleString('tr-TR')} mahalle</b>
          <span>{exploredKm2} km² · Türkiye'nin %{turkeyProgress(cells)}'i</span>
        </div>
        <button className="hud-card action" onClick={collect} disabled={busy}>
          <b>Geliri topla</b>
          <span>pasif kazanç</span>
        </button>
      </div>

      {status === 'weak' && <div className="banner warn">GPS sinyali zayıf — keşif duraklatıldı.</div>}
      {status === 'denied' && <div className="banner err">{error}</div>}
      {suspicious && <div className="banner err">Olağandışı hareket algılandı. Sunucu bu adımları saymadı.</div>}

      {/* Kurulum çubuğu */}
      <div className="build-bar">
        {['AC', 'DC'].map((kind) => (
          <button
            key={kind}
            className={`build-chip ${kind.toLowerCase()} ${buildMode === kind ? 'on' : ''}`}
            onClick={() => setBuildMode(buildMode === kind ? null : kind)}
          >
            <b>{kind === 'AC' ? 'AC 22 kW' : 'DC 150 kW'}</b>
            <span>₺{COST[kind].toLocaleString('tr-TR')}</span>
          </button>
        ))}
        <button className="build-chip ghost" onClick={signOut}>Çıkış</button>
      </div>

      {buildMode && (
        <div className="banner info">
          {position
            ? `Yeşil daire içinde bir noktaya dokun (en fazla ${RULES.BUILD_RANGE} m).`
            : 'Konumun bekleniyor…'}
        </div>
      )}

      {/* İstasyon kartı */}
      {selected && (
        <div className="station-sheet">
          <button className="close" onClick={() => setSelected(null)}>✕</button>
          <h3>{selected.kind === 'real' ? selected.title : 'Sanal istasyon'}</h3>
          <p className="muted">
            {selected.kind === 'real' ? 'Gerçek istasyon' : 'Oyun içi istasyon — burada fiziksel şarj ünitesi yoktur.'}
            {selected.owner ? ` · Sahibi: ${selected.owner}` : ''}
          </p>
          {claimDistance !== null && <p className="muted">Uzaklık: {formatDistance(claimDistance)}</p>}
          {selected.kind === 'real' && (
            <button className="game-btn primary" disabled={!canClaim || busy} onClick={claim}>
              {canClaim ? 'Bağlan ve ele geçir' : `${RULES.CLAIM_RANGE} m yakınına git`}
            </button>
          )}
        </div>
      )}

      {toast && <div className={`toast ${toast.tone}`}>{toast.text}</div>}
    </div>
  );
}

function reasonText(reason, extra) {
  switch (reason) {
    case 'unexplored': return 'Burası henüz keşfedilmedi.';
    case 'too_far': return extra?.distance
      ? `Çok uzaksın (${Math.round(extra.distance)} m).`
      : 'Çok uzaksın.';
    case 'too_close': return 'Başka bir istasyona çok yakın.';
    case 'quota': return `İstasyon kotan dolu (${extra?.quota ?? ''}).`;
    case 'funds': return 'Bakiyen yetersiz.';
    case 'implausible': return 'Konum sıçraması algılandı, işlem sayılmadı.';
    case 'consent': return 'Konum rızası gerekiyor.';
    case 'cooldown': return 'Bu istasyon şu an başkasında, süresi dolunca dene.';
    case 'banned': return 'Hesabın oyun dışı bırakıldı.';
    case 'weak_signal': return 'GPS sinyali zayıf, işlem sayılmadı.';
    case 'unknown_station': return 'Bu istasyon oyun veritabanında yok.';
    default: return 'İşlem tamamlanamadı.';
  }
}
