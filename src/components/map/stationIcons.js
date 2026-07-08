import L from 'leaflet';

/**
 * İstasyon pin'leri ve cluster baloncukları için L.divIcon fabrikaları.
 * Renk ve parlama efektleri tamamen CSS'te (styles/markers.css) tanımlıdır,
 * böylece Dark/Light tema değişiminde ikonlar otomatik uyum sağlar.
 */

const BOLT_PATH = 'M17.5 9.5L13 21h4l-2.5 9L24 17h-4.5l2-7.5z';

function pinHtml(variant, isSelected) {
  const classes = [
    'ev-pin',
    `ev-pin--${variant}`,
    isSelected ? 'ev-pin--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${classes}">
      <span class="ev-pin__halo" aria-hidden="true"></span>
      <svg viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          class="ev-pin__body"
          d="M18 1C8.6 1 1 8.6 1 18c0 12.5 17 27 17 27s17-14.5 17-27C35 8.6 27.4 1 18 1z"
        />
        <circle class="ev-pin__disc" cx="18" cy="17" r="11.5" />
        <path class="ev-pin__bolt" d="${BOLT_PATH}" transform="translate(0,-3)" />
      </svg>
    </div>
  `;
}

/**
 * @param {{ isDC: boolean }} station normalizeStation çıktısı
 * @param {boolean} [isSelected]
 * @returns {L.DivIcon}
 */
export function createStationIcon(station, isSelected = false) {
  const variant = station.isDC ? 'dc' : 'ac';

  return L.divIcon({
    className: 'ev-pin-wrapper', // Leaflet'in varsayılan beyaz kutusunu iptal eder
    html: pinHtml(variant, isSelected),
    iconSize: [36, 46],
    iconAnchor: [18, 46],
  });
}

/**
 * Cluster baloncuğu: içindeki istasyon sayısına göre boyut,
 * içerikte DC istasyon varsa turuncu vurgu alır.
 * leaflet.markercluster `iconCreateFunction` opsiyonuna verilir.
 */
export function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  const hasDC = markers.some((m) => m.options.stationType === 'dc');

  const size = count >= 100 ? 'lg' : count >= 20 ? 'md' : 'sm';
  const px = size === 'lg' ? 56 : size === 'md' ? 46 : 38;

  return L.divIcon({
    className: 'ev-cluster-wrapper',
    html: `
      <div class="ev-cluster ev-cluster--${size} ${hasDC ? 'ev-cluster--dc' : 'ev-cluster--ac'}">
        <span>${count}</span>
      </div>
    `,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
  });
}
