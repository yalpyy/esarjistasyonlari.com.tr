export function getDirectionsUrl(lat, lng) {
  const destination = `${lat},${lng}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      return `maps://maps.apple.com/?daddr=${destination}&dirflg=d`;
    }
    return `google.navigation:q=${destination}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function openDirections(lat, lng) {
  const url = getDirectionsUrl(lat, lng);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroidApp = /Android/i.test(navigator.userAgent) && url.startsWith('google.navigation');

  if (isAndroidApp) {
    window.location.href = `intent://${url}#Intent;scheme=google.navigation;package=com.google.android.apps.maps;end`;
    return;
  }

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}
