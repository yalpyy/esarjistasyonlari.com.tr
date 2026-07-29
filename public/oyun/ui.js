/* ============================================================
   EV NETWORK TYCOON — ui.js
   DOM bindings, build menu, tariff controls, modals,
   mouse + touch camera controls and the mobile bottom sheet.
   ============================================================ */
(function () {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  const canvas = $('#game');

  const el = {
    money: $('#money'), level: $('#level'), levelBar: $('#levelBar'),
    hudClock: $('#hudClock'), hudDay: $('#hudDay'),
    hudLoadFill: $('#hudLoadFill'), hudLoadText: $('#hudLoadText'), hudSessions: $('#hudSessions'),
    overloadBanner: $('#overloadBanner'), overloadTimer: $('#overloadTimer'),
    buildHint: $('#buildHint'), buildHintText: $('#buildHintText'),
    selectedCard: $('#selectedCard'), selectedTitle: $('#selectedTitle'),
    selectedMeta: $('#selectedMeta'), selectedStats: $('#selectedStats'),
    stationList: $('#stationList'),
    btnSolar: $('#btnSolar'), btnBess: $('#btnBess'), btnSell: $('#btnSell'),
    transformerCost: $('#transformerCost'), gridCapText: $('#gridCapText'),
    priceRange: $('#priceRange'), priceValue: $('#priceValue'), demandText: $('#demandText'),
    statRevenue: $('#statRevenue'), statBest: $('#statBest'),
    statServed: $('#statServed'), statLost: $('#statLost'),
    satFill: $('#satFill'), satText: $('#satText'),
    toasts: $('#toasts'), sheet: $('#dash'), sheetHandle: $('#sheetHandle')
  };

  let selectedStation = null;

  /* ---------- Boot --------------------------------------------------- */

  const restored = EV.init(canvas);
  if (el.priceRange) el.priceRange.value = EV.state.price;

  /* ---------- Camera: mouse + touch ---------------------------------- */

  const pointers = new Map();
  let dragging = false, moved = 0, lastPos = null, pinchDist = 0;

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { dragging = true; moved = 0; lastPos = { x: e.clientX, y: e.clientY }; }
    if (pointers.size === 2) { pinchDist = pointerSpread(); dragging = false; }
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) {
      if (!isTouch()) EV.ui.hoverTile = EV.pickTileAt(e.clientX, e.clientY);
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const d = pointerSpread();
      if (pinchDist > 0) {
        const mid = pointerMid();
        EV.zoomAt(d / pinchDist, mid.x, mid.y);
      }
      pinchDist = d;
      return;
    }
    if (dragging && lastPos) {
      const dx = e.clientX - lastPos.x, dy = e.clientY - lastPos.y;
      moved += Math.abs(dx) + Math.abs(dy);
      EV.panBy(dx, dy);
      lastPos = { x: e.clientX, y: e.clientY };
      if (EV.ui.ghost) EV.ui.hoverTile = EV.pickTileAt(e.clientX, e.clientY);
    }
  });

  function endPointer(e) {
    if (pointers.has(e.pointerId)) {
      if (pointers.size === 1 && dragging && moved < 10) handleTap(e.clientX, e.clientY);
      pointers.delete(e.pointerId);
    }
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) { dragging = false; lastPos = null; }
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', function () { if (!isTouch()) EV.ui.hoverTile = null; });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    EV.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX, e.clientY);
  }, { passive: false });

  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); cancelBuild(); });

  function isTouch() { return window.matchMedia('(pointer: coarse)').matches; }
  function pointerSpread() {
    const p = Array.from(pointers.values());
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }
  function pointerMid() {
    const p = Array.from(pointers.values());
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
  }

  function handleTap(x, y) {
    const tile = EV.pickTileAt(x, y);
    if (!tile) return;
    if (EV.ui.ghost) {
      const built = EV.placeStation(tile, EV.ui.ghost);
      if (built) { selectStation(built); if (!buildKeepOpen()) cancelBuild(); }
      return;
    }
    EV.ui.selected = tile;
    if (tile.station) selectStation(tile.station);
    else { selectedStation = null; renderSelected(); }
  }

  function buildKeepOpen() { return false; }

  /* ---------- Build menu --------------------------------------------- */

  $$('[data-build]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const type = btn.getAttribute('data-build');
      if (EV.ui.ghost === type) { cancelBuild(); return; }
      EV.ui.ghost = type;
      $$('[data-build]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      el.buildHint.classList.remove('hidden');
      el.buildHintText.textContent = EV.CFG.STATIONS[type].label +
        ' — kurmak için haritada yola komşu boş bir parsele dokun';
      collapseSheet();
    });
  });

  $('#buildCancel').addEventListener('click', cancelBuild);

  function cancelBuild() {
    EV.ui.ghost = null;
    EV.ui.hoverTile = null;
    $$('[data-build]').forEach(function (b) { b.classList.remove('is-active'); });
    el.buildHint.classList.add('hidden');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { cancelBuild(); closeModals(); }
    if (e.key === '1') $('[data-build="AC"]').click();
    if (e.key === '2') $('[data-build="DC"]').click();
    if (e.key === 'f' || e.key === 'F') EV.fitToScreen();
  });

  /* ---------- Selection panel ---------------------------------------- */

  function selectStation(st) {
    selectedStation = st;
    EV.ui.selected = EV.tileAt(st.c, st.r);
    switchTab('stations');
    renderSelected();
  }

  el.btnSolar.addEventListener('click', function () { if (selectedStation) { EV.upgradeStation(selectedStation, 'solar'); renderSelected(); } });
  el.btnBess.addEventListener('click', function () { if (selectedStation) { EV.upgradeStation(selectedStation, 'bess'); renderSelected(); } });
  el.btnSell.addEventListener('click', function () {
    if (!selectedStation) return;
    EV.sellStation(selectedStation);
    selectedStation = null;
    EV.ui.selected = null;
    renderSelected();
  });

  function renderSelected() {
    const st = selectedStation;
    if (!st) { el.selectedCard.classList.add('hidden'); return; }
    el.selectedCard.classList.remove('hidden');
    const tile = EV.tileAt(st.c, st.r);
    const zone = EV.ZONE[tile.zone].name;
    const accent = st.type === 'DC' ? 'text-[#00B0FF]' : 'text-[#00E676]';
    el.selectedTitle.className = 'font-semibold ' + accent;
    el.selectedTitle.textContent = EV.CFG.STATIONS[st.type].label;
    el.selectedMeta.textContent = zone + ' • ' + st.slots.filter(Boolean).length + '/' + st.connectors + ' dolu';
    el.selectedStats.innerHTML =
      row('Anlık çekiş', Math.round(st.draw) + ' kW') +
      row('Seans', String(st.sessions)) +
      row('Net kazanç', EV.money(st.earned)) +
      (st.bess ? row('Batarya', Math.round(st.bessStored) + ' / ' + EV.CFG.BESS.kwh + ' kWh') : '');
    el.btnSolar.disabled = st.solar;
    el.btnBess.disabled = st.bess;
    el.btnSolar.textContent = st.solar ? 'Güneş paneli ✓' : 'Güneş paneli · ' + EV.money(EV.CFG.SOLAR.cost);
    el.btnBess.textContent = st.bess ? 'BESS batarya ✓' : 'BESS batarya · ' + EV.money(EV.CFG.BESS.cost);
  }

  function row(label, value) {
    return '<div class="flex justify-between py-1 border-b border-white/5"><span class="text-white/50">' +
      label + '</span><span class="font-medium">' + value + '</span></div>';
  }

  let listSignature = '';

  el.stationList.addEventListener('click', function (e) {
    const row = e.target.closest('[data-station]');
    if (!row) return;
    const st = EV.state.stations[Number(row.getAttribute('data-station'))];
    if (st) { selectStation(st); centerOn(st); }
  });

  function renderStationList() {
    if (!EV.state.stations.length) {
      if (listSignature !== 'empty') {
        el.stationList.innerHTML = '<p class="text-white/40 text-sm">Henüz istasyon yok. Yukarıdan bir şarj ünitesi seç ve haritaya yerleştir.</p>';
        listSignature = 'empty';
      }
      return;
    }
    const sig = EV.state.stations.map(function (st) {
      return st.id + st.solar + st.bess + st.slots.filter(Boolean).length + Math.round(st.draw / 5);
    }).join('|');
    if (sig === listSignature) return;
    listSignature = sig;

    el.stationList.innerHTML = EV.state.stations.map(function (st, i) {
      const busy = st.slots.filter(Boolean).length;
      const dot = st.type === 'DC' ? '#00B0FF' : '#00E676';
      return '<button class="station-row" data-station="' + i + '">' +
        '<span class="dot" style="background:' + dot + '"></span>' +
        '<span class="grow text-left">' + EV.CFG.STATIONS[st.type].label +
        '<em class="block text-white/40 not-italic text-xs">' + EV.ZONE[EV.tileAt(st.c, st.r).zone].name +
        (st.solar ? ' · ☀' : '') + (st.bess ? ' · 🔋' : '') + '</em></span>' +
        '<span class="text-right text-xs"><b>' + Math.round(st.draw) + ' kW</b>' +
        '<em class="block text-white/40 not-italic">' + busy + '/' + st.connectors + '</em></span>' +
        '</button>';
    }).join('');
  }

  function centerOn(st) {
    EV.camera.x = st.c * EV.CFG.TILE + EV.CFG.TILE / 2;
    EV.camera.y = st.r * EV.CFG.TILE + EV.CFG.TILE / 2;
    EV.camera.zoom = Math.max(EV.camera.zoom, 1.1);
  }

  /* ---------- Tariff + grid ------------------------------------------ */

  el.priceRange.addEventListener('input', function () {
    EV.setPrice(el.priceRange.value);
    paintPrice();
  });

  function paintPrice() {
    const p = EV.state.price;
    el.priceValue.textContent = '₺' + Number(p).toFixed(2) + ' / kWh';
    const norm = (p - EV.CFG.PRICE_MIN) / (EV.CFG.PRICE_MAX - EV.CFG.PRICE_MIN);
    const label = norm < 0.28 ? 'Talep çok yüksek, kâr marjı dar' :
      norm < 0.55 ? 'Dengeli — istikrarlı doluluk' :
        norm < 0.8 ? 'Yüksek marj, sürücüler seçici' : 'Çok pahalı, araçlar uğramadan geçiyor';
    el.demandText.textContent = label;
    el.demandText.className = 'text-xs mt-1 ' + (norm < 0.55 ? 'text-[#00E676]' : norm < 0.8 ? 'text-amber-400' : 'text-red-400');
  }

  $('#btnTransformer').addEventListener('click', function () { EV.upgradeGrid(); paintUpgrades(); });

  function paintUpgrades() {
    el.transformerCost.textContent = EV.money(EV.transformerCost());
    el.gridCapText.textContent = EV.state.gridCapacity + ' kW';
  }

  /* ---------- Tabs + bottom sheet ------------------------------------ */

  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(tab.getAttribute('data-tab')); expandSheet(); });
  });

  function switchTab(name) {
    $$('.tab').forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-tab') === name); });
    $$('.panel').forEach(function (p) { p.classList.toggle('hidden', p.getAttribute('data-panel') !== name); });
  }

  let sheetOpen = false;
  function expandSheet() {
    if (window.innerWidth >= 768) return;
    el.sheet.classList.add('sheet-open'); sheetOpen = true;
    setTimeout(EV.resize, 280);
  }
  function collapseSheet() {
    if (window.innerWidth >= 768) return;
    el.sheet.classList.remove('sheet-open'); sheetOpen = false;
    setTimeout(EV.resize, 280);
  }

  el.sheetHandle.addEventListener('click', function () { sheetOpen ? collapseSheet() : expandSheet(); });

  let sheetDragY = null;
  el.sheetHandle.addEventListener('pointerdown', function (e) { sheetDragY = e.clientY; el.sheetHandle.setPointerCapture(e.pointerId); });
  el.sheetHandle.addEventListener('pointermove', function (e) {
    if (sheetDragY === null) return;
    const dy = e.clientY - sheetDragY;
    if (dy < -28) { expandSheet(); sheetDragY = null; }
    else if (dy > 28) { collapseSheet(); sheetDragY = null; }
  });
  el.sheetHandle.addEventListener('pointerup', function () { sheetDragY = null; });

  window.addEventListener('resize', function () { setTimeout(EV.resize, 60); });

  /* ---------- Header controls ---------------------------------------- */

  $('#btnFit').addEventListener('click', EV.fitToScreen);
  $('#btnHelp').addEventListener('click', function () { openModal('#modalHelp'); });
  $('#btnScores').addEventListener('click', function () { renderScores(); openModal('#modalScores'); });

  const btnPause = $('#btnPause');
  btnPause.addEventListener('click', function () {
    EV.setPaused(!EV.state.paused);
    btnPause.textContent = EV.state.paused ? '▶' : '❚❚';
    btnPause.setAttribute('aria-label', EV.state.paused ? 'Devam et' : 'Duraklat');
  });

  $('#btnSave').addEventListener('click', function () { EV.save(); EV.toast('Oyun kaydedildi.', 'good'); });
  $('#btnReset').addEventListener('click', function () {
    if (confirm('Tüm ilerleme silinsin mi? Bu işlem geri alınamaz.')) {
      EV.reset(); selectedStation = null; renderSelected(); paintUpgrades(); paintPrice();
      EV.toast('Yeni şehir hazır.', 'info');
    }
  });

  /* ---------- Modals -------------------------------------------------- */

  function openModal(sel) { const m = $(sel); if (m) m.classList.add('is-open'); }
  function closeModal(sel) { const m = $(sel); if (m) m.classList.remove('is-open'); }
  function closeModals() { $$('.modal').forEach(function (m) { m.classList.remove('is-open'); }); }

  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeModal(b.getAttribute('data-close')); });
  });

  /* Rewarded ad flow ---------------------------------------------------- */

  EV.on('overload', function () {
    el.overloadBanner.classList.remove('hidden');
    openModal('#modalOverload');
  });

  $('#adWatch').addEventListener('click', function () {
    closeModal('#modalOverload');
    playRewardedAd(function () { EV.restorePower('ad'); });
  });
  $('#adSkip').addEventListener('click', function () { closeModal('#modalOverload'); });

  function playRewardedAd(onReward) {
    // Drop your ad SDK in here: set EV.onRewardedAd = function(done){ sdk.show(done); }
    if (typeof EV.onRewardedAd === 'function') { EV.onRewardedAd(onReward); return; }
    openModal('#modalAd');
    const fill = $('#adFill'), label = $('#adSeconds');
    let left = 5;
    label.textContent = left;
    fill.style.width = '0%';
    const timer = setInterval(function () {
      left--;
      label.textContent = Math.max(0, left);
      fill.style.width = ((5 - left) / 5 * 100) + '%';
      if (left <= 0) { clearInterval(timer); closeModal('#modalAd'); onReward(); }
    }, 1000);
  }

  /* Coupon / lead generation -------------------------------------------- */

  EV.on('goal', function (d) {
    $('#couponLevel').textContent = d.level;
    $('#couponCode').textContent = couponCode();
    openModal('#modalCoupon');
  });

  function couponCode() {
    let code;
    try { code = localStorage.getItem('evnt.coupon'); } catch (e) { code = null; }
    if (!code) {
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      code = 'ESARJ15-' + rnd;
      try { localStorage.setItem('evnt.coupon', code); } catch (e) { /* ignore */ }
    }
    return code;
  }

  $('#btnCopyCoupon').addEventListener('click', function () {
    const code = $('#couponCode').textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    EV.toast('Kupon kodu kopyalandı: ' + code, 'good');
  });

  /* Leaderboard ---------------------------------------------------------- */

  function renderScores() {
    const list = EV.scores();
    const box = $('#scoreList');
    if (!list.length) { box.innerHTML = '<p class="text-white/40 text-sm">Henüz kayıt yok. Bir günü tamamla, ciron buraya yazılsın.</p>'; return; }
    box.innerHTML = list.map(function (s, i) {
      return '<div class="flex items-center justify-between py-2 border-b border-white/5">' +
        '<span class="text-white/50 w-8">' + (i + 1) + '.</span>' +
        '<span class="grow">' + new Date(s.date).toLocaleDateString('tr-TR') + ' · ' + s.day + '. gün</span>' +
        '<b class="text-[#00E676]">' + EV.money(s.value) + '</b></div>';
    }).join('');
  }

  /* ---------- Toasts + engine events ---------------------------------- */

  EV.on('toast', function (t) {
    const node = document.createElement('div');
    node.className = 'toast toast-' + t.tone;
    node.textContent = t.text;
    el.toasts.appendChild(node);
    setTimeout(function () { node.classList.add('out'); }, 3200);
    setTimeout(function () { node.remove(); }, 3800);
  });

  EV.on('newday', function (d) {
    EV.toast(d.day + '. gün kapandı — ciro ' + EV.money(d.revenue) + ' · net ' + EV.money(d.profit), d.profit >= 0 ? 'good' : 'warn');
  });

  EV.on('change', function () { paintUpgrades(); renderSelected(); renderStationList(); });

  /* ---------- Render loop for the DOM --------------------------------- */

  function paint() {
    const s = EV.state, r = EV.readout;
    el.money.textContent = EV.money(s.money);
    el.money.className = 'font-bold tabular-nums ' + (s.money < 0 ? 'text-red-400' : 'text-[#00E676]');
    el.level.textContent = 'Sv ' + s.level;
    el.levelBar.style.width = (r.levelProgress * 100).toFixed(1) + '%';

    const hh = String(r.hour).padStart(2, '0'), mm = String(r.minute).padStart(2, '0');
    el.hudClock.textContent = hh + ':' + mm + (r.isDay ? ' ☀' : ' ☾');
    el.hudDay.textContent = s.day + '. gün';

    const pct = Math.min(1, r.loadPct);
    el.hudLoadFill.style.width = (pct * 100).toFixed(1) + '%';
    el.hudLoadFill.style.background = pct > 0.9 ? '#ff5252' : pct > 0.7 ? '#ffb74d' : '#00E676';
    el.hudLoadText.textContent = Math.round(s.gridLoad) + ' / ' + s.gridCapacity + ' kW';
    el.hudSessions.textContent = r.activeSessions + ' aktif seans';

    if (EV.isOverloaded()) {
      el.overloadBanner.classList.remove('hidden');
      el.overloadTimer.textContent = Math.ceil(s.overloadUntil - s.time) + ' sn';
    } else {
      el.overloadBanner.classList.add('hidden');
    }

    el.statRevenue.textContent = EV.money(s.dailyRevenue);
    el.statBest.textContent = EV.money(s.bestDaily);
    el.statServed.textContent = String(s.served);
    el.statLost.textContent = String(s.lost);
    el.satFill.style.width = s.satisfaction.toFixed(0) + '%';
    el.satFill.style.background = s.satisfaction < 40 ? '#ff5252' : s.satisfaction < 70 ? '#ffb74d' : '#00E676';
    el.satText.textContent = Math.round(s.satisfaction) + '%';

    renderStationList();
    if (selectedStation) renderSelected();
  }

  paintPrice();
  paintUpgrades();
  paint();

  if (!restored) openModal('#modalHelp');
  else EV.toast('Kayıtlı oyun yüklendi — ' + EV.state.day + '. gün', 'info');

  setInterval(paint, 400);

  // Autosave every 20 seconds.
  setInterval(EV.save, 20000);
  window.addEventListener('beforeunload', EV.save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) EV.save(); });
})();
