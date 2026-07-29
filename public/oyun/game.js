/* ============================================================
   EV NETWORK TYCOON — game.js
   Canvas engine, vehicle spawner, charging logic,
   grid load calculator and the main game loop.
   No external assets: everything is drawn with vector shapes.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 1. Configuration -------------------------------------- */

  const CFG = {
    TILE: 44,
    COLS: 26,
    ROWS: 20,
    DAY_SECONDS: 60,            // 60 real seconds = 1 in-game day
    START_MONEY: 12000,
    START_GRID: 200,            // kW transformer limit
    ENERGY_COST: 3.2,           // operator cost per kWh (TL)
    PRICE_MIN: 4,
    PRICE_MAX: 15,
    PRICE_DEFAULT: 8,
    CHARGE_FACTOR: 0.04,        // kWh delivered per kW per real second
    OVERLOAD_SECONDS: 15,
    MAX_VEHICLES: 46,
    GOAL_MONEY: 100000,
    GOAL_LEVEL: 10,
    STATIONS: {
      AC: { cost: 1000, kw: 22, connectors: 2, upkeep: 60, label: 'AC 22 kW' },
      DC: { cost: 5000, kw: 150, connectors: 2, upkeep: 240, label: 'DC 150 kW' }
    },
    SOLAR: { cost: 2500, offsetKw: 20, costMultiplier: 0.35 },
    BESS: { cost: 4000, kwh: 60, maxOffset: 60, rechargeKw: 12 },
    TRANSFORMER: { step: 100, baseCost: 6000, growth: 1.6 }
  };

  const ZONE = {
    highway: { name: 'Otoyol', tint: 'rgba(0,176,255,0.055)', speed: 118, dcBias: 1.0, acBias: -0.55 },
    commercial: { name: 'AVM / Plaza', tint: 'rgba(0,230,118,0.05)', speed: 78, dcBias: 0.3, acBias: 0.3 },
    residential: { name: 'Konut', tint: 'rgba(255,183,77,0.045)', speed: 58, dcBias: -0.35, acBias: 0.9 }
  };

  const H_ROADS = [2, 9, 16];
  const V_ROADS = [4, 12, 20];

  const SAVE_KEY = 'evnt.save.v1';
  const SCORE_KEY = 'evnt.scores.v1';

  /* ---------- 2. Tiny event emitter --------------------------------- */

  const handlers = {};
  function on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); }
  function emit(evt, data) { (handlers[evt] || []).forEach(function (fn) { fn(data); }); }
  function toast(text, tone) { emit('toast', { text: text, tone: tone || 'info' }); }

  /* ---------- 3. Reactive-ish game state ---------------------------- */

  const state = {
    money: CFG.START_MONEY,
    price: CFG.PRICE_DEFAULT,
    gridCapacity: CFG.START_GRID,
    gridLoad: 0,
    satisfaction: 80,
    level: 1,
    totalRevenue: 0,
    dailyRevenue: 0,
    dailyProfit: 0,
    bestDaily: 0,
    day: 1,
    clock: 0,            // 0..1 across a day
    served: 0,
    lost: 0,
    overloadUntil: 0,
    overloadCount: 0,
    goalReached: false,
    paused: false,
    stations: [],
    time: 0
  };

  // Values the UI polls every frame; kept flat so bindings stay cheap.
  const readout = {
    hour: 6, minute: 0, isDay: true, loadPct: 0, overloaded: false,
    activeSessions: 0, nextLevelAt: 0, levelProgress: 0
  };

  /* ---------- 4. Map ------------------------------------------------ */

  const tiles = [];

  function hash(c, r) {
    const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function zoneOfRow(r) {
    if (r <= 5) return 'highway';
    if (r <= 12) return 'commercial';
    return 'residential';
  }

  function tileAt(c, r) {
    if (c < 0 || r < 0 || c >= CFG.COLS || r >= CFG.ROWS) return null;
    return tiles[r * CFG.COLS + c];
  }

  function isRoad(c, r) {
    return H_ROADS.indexOf(r) !== -1 || V_ROADS.indexOf(c) !== -1;
  }

  function buildMap() {
    tiles.length = 0;
    for (let r = 0; r < CFG.ROWS; r++) {
      for (let c = 0; c < CFG.COLS; c++) {
        tiles.push({
          c: c, r: r,
          road: isRoad(c, r),
          zone: zoneOfRow(r),
          buildable: false,
          station: null,
          h: hash(c, r)
        });
      }
    }
    tiles.forEach(function (t) {
      if (t.road) return;
      const near = [tileAt(t.c + 1, t.r), tileAt(t.c - 1, t.r), tileAt(t.c, t.r + 1), tileAt(t.c, t.r - 1)];
      t.buildable = near.some(function (n) { return n && n.road; });
    });
  }

  function roadNeighbours(t) {
    const out = [];
    const cand = [tileAt(t.c + 1, t.r), tileAt(t.c - 1, t.r), tileAt(t.c, t.r + 1), tileAt(t.c, t.r - 1)];
    for (let i = 0; i < cand.length; i++) if (cand[i] && cand[i].road) out.push(cand[i]);
    return out;
  }

  function findPath(from, to) {
    if (!from || !to || !from.road || !to.road) return null;
    const key = function (t) { return t.r * CFG.COLS + t.c; };
    const prev = new Map();
    const queue = [from];
    prev.set(key(from), null);
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      if (cur === to) break;
      const nb = roadNeighbours(cur);
      for (let i = 0; i < nb.length; i++) {
        if (!prev.has(key(nb[i]))) { prev.set(key(nb[i]), cur); queue.push(nb[i]); }
      }
    }
    if (!prev.has(key(to))) return null;
    const path = [];
    let cur = to;
    while (cur) { path.unshift(cur); cur = prev.get(key(cur)); }
    return path;
  }

  /** Entry / exit tiles at the four map edges. */
  function gateways() {
    const g = [];
    H_ROADS.forEach(function (r) {
      g.push({ tile: tileAt(0, r), dir: [1, 0] });
      g.push({ tile: tileAt(CFG.COLS - 1, r), dir: [-1, 0] });
    });
    V_ROADS.forEach(function (c) {
      g.push({ tile: tileAt(c, 0), dir: [0, 1] });
      g.push({ tile: tileAt(c, CFG.ROWS - 1), dir: [0, -1] });
    });
    return g;
  }

  const GATES = [];

  const LANE = 10;

  function pathToPoints(tilePath) {
    const pts = [];
    for (let i = 0; i < tilePath.length; i++) {
      const t = tilePath[i];
      const nxt = tilePath[i + 1] || t;
      const prv = tilePath[i - 1] || t;
      let dx = (nxt.c - t.c) || (t.c - prv.c);
      let dy = (nxt.r - t.r) || (t.r - prv.r);
      if (dx === 0 && dy === 0) dx = 1;
      let ox = 0, oy = 0;
      if (dx > 0) oy = LANE; else if (dx < 0) oy = -LANE;
      else if (dy > 0) ox = -LANE; else if (dy < 0) ox = LANE;
      pts.push({ x: t.c * CFG.TILE + CFG.TILE / 2 + ox, y: t.r * CFG.TILE + CFG.TILE / 2 + oy });
    }
    return pts;
  }

  /* ---------- 5. Stations ------------------------------------------- */

  function makeStation(tile, type) {
    const spec = CFG.STATIONS[type];
    const st = {
      id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36),
      c: tile.c, r: tile.r, type: type,
      kw: spec.kw,
      connectors: spec.connectors,
      solar: false,
      bess: false,
      bessStored: 0,
      slots: new Array(spec.connectors).fill(null),
      sessions: 0,
      earned: 0,
      draw: 0
    };
    tile.station = st;
    return st;
  }

  function stationTile(st) { return tileAt(st.c, st.r); }

  function approachTile(st) {
    const t = stationTile(st);
    const nb = roadNeighbours(t);
    return nb.length ? nb[0] : null;
  }

  function slotPosition(st, index) {
    const base = { x: st.c * CFG.TILE + CFG.TILE / 2, y: st.r * CFG.TILE + CFG.TILE / 2 };
    const offset = (index - (st.connectors - 1) / 2) * 17;
    const t = stationTile(st);
    const road = approachTile(st);
    const horizontal = road && road.r === t.r;
    if (horizontal) { base.y += offset; base.x += (road.c > t.c ? 8 : -8); }
    else { base.x += offset; base.y += (road && road.r > t.r ? 8 : -8); }
    return base;
  }

  function freeSlot(st) {
    if (isOverloaded()) return -1;
    for (let i = 0; i < st.slots.length; i++) if (!st.slots[i]) return i;
    return -1;
  }

  function placeStation(tile, type) {
    if (!tile || !tile.buildable || tile.station) {
      toast('Buraya kurulum yapılamaz. Yola komşu boş bir parsel seç.', 'warn');
      return null;
    }
    const cost = CFG.STATIONS[type].cost;
    if (state.money < cost) { toast('Yetersiz bakiye. Gereken: ' + money(cost), 'warn'); return null; }
    state.money -= cost;
    const st = makeStation(tile, type);
    state.stations.push(st);
    toast(CFG.STATIONS[type].label + ' kuruldu — ' + ZONE[tile.zone].name, 'good');
    emit('change');
    save();
    return st;
  }

  function sellStation(st) {
    const idx = state.stations.indexOf(st);
    if (idx === -1) return;
    releaseVehiclesOf(st);
    const refund = Math.round(CFG.STATIONS[st.type].cost * 0.5 +
      (st.solar ? CFG.SOLAR.cost * 0.4 : 0) + (st.bess ? CFG.BESS.cost * 0.4 : 0));
    state.money += refund;
    state.stations.splice(idx, 1);
    const t = stationTile(st);
    if (t) t.station = null;
    toast('İstasyon söküldü. İade: ' + money(refund), 'info');
    emit('change');
    save();
  }

  function upgradeStation(st, kind) {
    if (!st) return;
    if (kind === 'solar') {
      if (st.solar) return toast('Bu istasyonda zaten güneş paneli var.', 'warn');
      if (state.money < CFG.SOLAR.cost) return toast('Yetersiz bakiye.', 'warn');
      state.money -= CFG.SOLAR.cost; st.solar = true;
      toast('Güneş paneli çatısı kuruldu — gündüz enerji maliyeti %65 düşük.', 'good');
    } else if (kind === 'bess') {
      if (st.bess) return toast('Bu istasyonda zaten batarya var.', 'warn');
      if (state.money < CFG.BESS.cost) return toast('Yetersiz bakiye.', 'warn');
      state.money -= CFG.BESS.cost; st.bess = true; st.bessStored = CFG.BESS.kwh * 0.5;
      toast('BESS batarya kuruldu — pik anında şebekeyi rahatlatır.', 'good');
    }
    emit('change'); save();
  }

  function transformerCost() {
    const steps = Math.round((state.gridCapacity - CFG.START_GRID) / CFG.TRANSFORMER.step);
    return Math.round(CFG.TRANSFORMER.baseCost * Math.pow(CFG.TRANSFORMER.growth, steps));
  }

  function upgradeGrid() {
    const cost = transformerCost();
    if (state.money < cost) return toast('Trafo yükseltmesi için ' + money(cost) + ' gerekli.', 'warn');
    state.money -= cost;
    state.gridCapacity += CFG.TRANSFORMER.step;
    toast('Trafo kapasitesi ' + state.gridCapacity + ' kW oldu.', 'good');
    emit('change'); save();
  }

  function setPrice(v) {
    state.price = Math.min(CFG.PRICE_MAX, Math.max(CFG.PRICE_MIN, Number(v) || CFG.PRICE_DEFAULT));
    emit('change');
  }

  /* ---------- 6. Vehicles ------------------------------------------- */

  const vehicles = [];
  const CAR_COLORS = ['#e8eaed', '#7c8b99', '#2f3a45', '#c62828', '#00b0ff', '#00e676', '#ffb74d', '#8e6cf0'];

  function spawnVehicle() {
    if (vehicles.length >= CFG.MAX_VEHICLES) return;
    const gate = GATES[Math.floor(Math.random() * GATES.length)];
    if (!gate || !gate.tile) return;

    const battery = 0.05 + Math.random() * 0.42;
    const car = {
      x: gate.tile.c * CFG.TILE + CFG.TILE / 2 - gate.dir[0] * CFG.TILE * 1.4,
      y: gate.tile.r * CFG.TILE + CFG.TILE / 2 - gate.dir[1] * CFG.TILE * 1.4,
      angle: Math.atan2(gate.dir[1], gate.dir[0]),
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      capacity: 42 + Math.round(Math.random() * 48),      // kWh pack
      accept: 30 + Math.round(Math.random() * 130),       // max kW the car accepts
      battery: battery,
      target: 0.82 + Math.random() * 0.16,
      state: 'transit',
      station: null,
      slot: -1,
      points: null,
      pi: 0,
      speed: ZONE[gate.tile.zone].speed,
      waited: 0,
      delivered: 0,
      gate: gate
    };

    const choice = chooseStation(car, gate.tile);
    if (choice) routeToStation(car, gate.tile, choice);
    else routeThrough(car, gate.tile);
    vehicles.push(car);
  }

  /** Scores every station the way a driver would: need, price, distance, zone fit. */
  function chooseStation(car, fromTile) {
    if (!state.stations.length) return null;
    if (car.battery > 0.55) return null;                 // not looking for a charger yet
    if (isOverloaded()) return null;

    const priceNorm = (state.price - CFG.PRICE_MIN) / (CFG.PRICE_MAX - CFG.PRICE_MIN);
    let best = null, bestScore = -Infinity;

    for (let i = 0; i < state.stations.length; i++) {
      const st = state.stations[i];
      if (freeSlot(st) === -1) continue;
      const t = stationTile(st);
      const dist = Math.abs(t.c - fromTile.c) + Math.abs(t.r - fromTile.r);
      const zone = ZONE[t.zone];
      const fit = st.type === 'DC' ? zone.dcBias : zone.acBias;
      const urgency = (1 - car.battery) * 2.2;

      let score = 2.9 + fit + urgency
        - priceNorm * 2.6
        - dist * 0.035
        + (Math.random() * 0.5 - 0.25);

      if (st.type === 'DC' && car.battery < 0.18) score += 0.6;   // desperate drivers want speed
      if (st.solar) score += 0.12;                                // green branding pulls customers
      score += (state.satisfaction - 60) / 90;

      if (score > bestScore) { bestScore = score; best = st; }
    }
    if (!best || bestScore < 0.6) {
      if (best) { state.lost++; state.satisfaction = clamp(state.satisfaction - 0.2, 0, 100); }
      return null;
    }
    return best;
  }

  function routeToStation(car, fromTile, st) {
    const road = approachTile(st);
    const path = findPath(fromTile, road);
    if (!path) { routeThrough(car, fromTile); return; }
    car.points = pathToPoints(path);
    const slotIdx = freeSlot(st);
    if (slotIdx === -1) { routeThrough(car, fromTile); return; }
    st.slots[slotIdx] = car;
    car.slot = slotIdx;
    car.station = st;
    car.state = 'approach';
    car.pi = 0;
  }

  function routeThrough(car, fromTile) {
    const exits = GATES.filter(function (g) { return g.tile !== fromTile; });
    const gate = exits[Math.floor(Math.random() * exits.length)];
    const path = findPath(fromTile, gate.tile);
    car.points = path ? pathToPoints(path) : null;
    car.state = 'transit';
    car.pi = 0;
    car.exitDir = gate.dir;
  }

  function releaseVehiclesOf(st) {
    for (let i = vehicles.length - 1; i >= 0; i--) {
      if (vehicles[i].station === st) {
        vehicles[i].station = null;
        vehicles[i].slot = -1;
        leaveMap(vehicles[i]);
      }
    }
  }

  function leaveMap(car) {
    if (car.station && car.slot >= 0) { car.station.slots[car.slot] = null; }
    car.station = null; car.slot = -1;
    const here = tileAt(Math.floor(car.x / CFG.TILE), Math.floor(car.y / CFG.TILE));
    const start = here && here.road ? here : nearestRoadTile(car.x, car.y);
    if (!start) { car.dead = true; return; }
    routeThrough(car, start);
    car.state = 'transit';
  }

  function nearestRoadTile(px, py) {
    let best = null, bd = Infinity;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (!t.road) continue;
      const dx = t.c * CFG.TILE + CFG.TILE / 2 - px;
      const dy = t.r * CFG.TILE + CFG.TILE / 2 - py;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  function advance(car, dt) {
    if (!car.points || car.pi >= car.points.length) return true;
    const p = car.points[car.pi];
    const dx = p.x - car.x, dy = p.y - car.y;
    const dist = Math.hypot(dx, dy);
    const step = car.speed * dt;
    if (dist <= step) {
      car.x = p.x; car.y = p.y; car.pi++;
      if (car.pi >= car.points.length) return true;
    } else {
      car.x += dx / dist * step;
      car.y += dy / dist * step;
      const wanted = Math.atan2(dy, dx);
      let diff = wanted - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.angle += diff * Math.min(1, dt * 9);
    }
    return false;
  }

  function moveToPoint(car, target, dt) {
    const dx = target.x - car.x, dy = target.y - car.y;
    const dist = Math.hypot(dx, dy);
    const step = 42 * dt;
    if (dist <= step) { car.x = target.x; car.y = target.y; return true; }
    car.x += dx / dist * step; car.y += dy / dist * step;
    const wanted = Math.atan2(dy, dx);
    let diff = wanted - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += diff * Math.min(1, dt * 7);
    return false;
  }

  /* ---------- 7. Grid + charging ------------------------------------ */

  function isOverloaded() { return state.time < state.overloadUntil; }

  function sessionKw(car) {
    const st = car.station;
    if (!st) return 0;
    let active = 0;
    for (let i = 0; i < st.slots.length; i++) {
      const c = st.slots[i];
      if (c && c.state === 'charging') active++;
    }
    active = Math.max(1, active);
    const taper = car.battery > 0.8 ? 0.35 : 1;              // real packs taper near full
    // A cabinet shares its rated power across busy connectors.
    return Math.min(st.kw / active, car.accept) * taper;
  }

  function calcGridLoad(dt) {
    let total = 0;
    let sessions = 0;

    for (let i = 0; i < state.stations.length; i++) {
      const st = state.stations[i];
      let draw = 0;
      for (let s = 0; s < st.slots.length; s++) {
        const car = st.slots[s];
        if (car && car.state === 'charging') { draw += sessionKw(car); sessions++; }
      }

      // Solar shaves load during daylight hours.
      if (st.solar && readout.isDay) draw = Math.max(0, draw - CFG.SOLAR.offsetKw * solarStrength());

      // Battery storage discharges into peaks, recharges when idle.
      if (st.bess) {
        if (draw > 0 && st.bessStored > 0.5) {
          const offset = Math.min(CFG.BESS.maxOffset, draw, st.bessStored / (CFG.CHARGE_FACTOR * Math.max(dt, 0.001)));
          st.bessStored = Math.max(0, st.bessStored - offset * CFG.CHARGE_FACTOR * dt);
          draw -= offset;
        } else if (draw === 0 && st.bessStored < CFG.BESS.kwh) {
          st.bessStored = Math.min(CFG.BESS.kwh, st.bessStored + CFG.BESS.rechargeKw * CFG.CHARGE_FACTOR * dt);
          draw += CFG.BESS.rechargeKw;
        }
      }
      st.draw = draw;
      total += draw;
    }

    state.gridLoad = total;
    readout.activeSessions = sessions;
    readout.loadPct = state.gridCapacity ? total / state.gridCapacity : 0;
    return total;
  }

  function solarStrength() {
    const h = readout.hour + readout.minute / 60;
    if (h < 6 || h > 18) return 0;
    return Math.sin(((h - 6) / 12) * Math.PI);
  }

  function triggerOverload() {
    if (isOverloaded()) return;
    state.overloadUntil = state.time + CFG.OVERLOAD_SECONDS;
    state.overloadCount++;
    state.satisfaction = clamp(state.satisfaction - 9, 0, 100);
    for (let i = 0; i < state.stations.length; i++) {
      const st = state.stations[i];
      for (let s = 0; s < st.slots.length; s++) {
        const car = st.slots[s];
        if (car) { state.lost++; leaveMap(car); }
      }
    }
    emit('overload', { until: state.overloadUntil });
  }

  function restorePower(reason) {
    if (!isOverloaded()) return;
    state.overloadUntil = 0;
    state.satisfaction = clamp(state.satisfaction + 4, 0, 100);
    toast(reason === 'ad' ? 'Sigorta yenilendi, şebeke tekrar devrede.' : 'Şebeke normale döndü.', 'good');
    emit('change');
  }

  function energyCostFor(st) {
    if (st.solar && readout.isDay) {
      const s = solarStrength();
      return CFG.ENERGY_COST * (1 - s * (1 - CFG.SOLAR.costMultiplier));
    }
    return CFG.ENERGY_COST * (readout.isDay ? 1 : 0.82);   // night tariff is cheaper
  }

  function deliverEnergy(dt) {
    if (isOverloaded()) return;
    for (let i = 0; i < state.stations.length; i++) {
      const st = state.stations[i];
      for (let s = 0; s < st.slots.length; s++) {
        const car = st.slots[s];
        if (!car || car.state !== 'charging') continue;
        const kwh = sessionKw(car) * CFG.CHARGE_FACTOR * dt;
        const added = kwh / car.capacity;
        car.battery = Math.min(1, car.battery + added);
        car.delivered += kwh;
        const revenue = kwh * state.price;
        const cost = kwh * energyCostFor(st);
        state.money += revenue - cost;
        state.dailyRevenue += revenue;
        state.dailyProfit += revenue - cost;
        state.totalRevenue += revenue;
        st.earned += revenue - cost;
      }
    }
  }

  /* ---------- 8. Demand, levels, day cycle -------------------------- */

  function demandMultiplier() {
    const priceNorm = (state.price - CFG.PRICE_MIN) / (CFG.PRICE_MAX - CFG.PRICE_MIN);
    const priceFactor = clamp(1.15 - priceNorm * 1.05, 0.08, 1.15);
    const satFactor = 0.45 + (state.satisfaction / 100) * 0.75;
    const h = readout.hour;
    const rush = (h >= 7 && h <= 10) || (h >= 16 && h <= 20) ? 1.45 : (h >= 0 && h < 5 ? 0.45 : 1);
    return priceFactor * satFactor * rush;
  }

  function levelThreshold(n) { return Math.round(2500 * Math.pow(n, 1.4)); }

  function checkLevel() {
    let lvl = 1;
    while (state.totalRevenue >= levelThreshold(lvl)) lvl++;
    readout.nextLevelAt = levelThreshold(lvl);
    const prev = lvl > 1 ? levelThreshold(lvl - 1) : 0;
    readout.levelProgress = clamp((state.totalRevenue - prev) / (readout.nextLevelAt - prev), 0, 1);
    if (lvl > state.level) {
      state.level = lvl;
      emit('levelup', { level: lvl });
      toast('Seviye ' + lvl + '! Yeni bölgelerde talep arttı.', 'good');
      save();
    }
    if (!state.goalReached && (state.level >= CFG.GOAL_LEVEL || state.money >= CFG.GOAL_MONEY)) {
      state.goalReached = true;
      emit('goal', { level: state.level, money: state.money });
      save();
    }
  }

  function endOfDay() {
    let upkeep = 0;
    state.stations.forEach(function (st) { upkeep += CFG.STATIONS[st.type].upkeep; });
    state.money -= upkeep;
    if (state.dailyRevenue > state.bestDaily) {
      state.bestDaily = state.dailyRevenue;
      pushScore(state.dailyRevenue);
    }
    emit('newday', {
      day: state.day,
      revenue: state.dailyRevenue,
      profit: state.dailyProfit - upkeep,
      upkeep: upkeep
    });
    state.day++;
    state.dailyRevenue = 0;
    state.dailyProfit = 0;
    save();
  }

  /* ---------- 9. Update loop ---------------------------------------- */

  let spawnTimer = 0;

  function update(dt) {
    if (state.paused) return;
    state.time += dt;

    const before = state.clock;
    state.clock = (state.clock + dt / CFG.DAY_SECONDS) % 1;
    if (state.clock < before) endOfDay();

    const hours = state.clock * 24;
    readout.hour = Math.floor(hours);
    readout.minute = Math.floor((hours - readout.hour) * 60);
    readout.isDay = readout.hour >= 6 && readout.hour < 18;
    readout.overloaded = isOverloaded();

    // Spawning
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnVehicle();
      const base = 1.5 / Math.max(0.25, demandMultiplier());
      spawnTimer = base * (0.6 + Math.random() * 0.9);
    }

    // Vehicles
    for (let i = vehicles.length - 1; i >= 0; i--) {
      const car = vehicles[i];
      updateVehicle(car, dt);
      if (car.dead) {
        if (car.station && car.slot >= 0) car.station.slots[car.slot] = null;
        vehicles.splice(i, 1);
      }
    }

    // Grid
    const load = calcGridLoad(dt);
    if (load > state.gridCapacity + 0.5) triggerOverload();
    else deliverEnergy(dt);

    state.satisfaction = clamp(state.satisfaction + (isOverloaded() ? -0.6 : 0.22) * dt, 0, 100);
    checkLevel();
  }

  function updateVehicle(car, dt) {
    switch (car.state) {
      case 'transit': {
        const done = advance(car, dt);
        if (done) {
          car.x += Math.cos(car.angle) * car.speed * dt * 2;
          car.y += Math.sin(car.angle) * car.speed * dt * 2;
          if (car.x < -120 || car.y < -120 || car.x > CFG.COLS * CFG.TILE + 120 || car.y > CFG.ROWS * CFG.TILE + 120) {
            car.dead = true;
          }
        }
        break;
      }
      case 'approach': {
        if (!car.station) { leaveMap(car); break; }
        if (advance(car, dt)) { car.state = 'parking'; }
        break;
      }
      case 'parking': {
        if (!car.station) { leaveMap(car); break; }
        const target = slotPosition(car.station, car.slot);
        if (moveToPoint(car, target, dt)) {
          car.state = 'charging';
          car.station.sessions++;
        }
        break;
      }
      case 'charging': {
        if (!car.station) { leaveMap(car); break; }
        car.waited += dt;
        if (isOverloaded()) break;
        if (car.battery >= car.target || car.waited > 120) {
          const happy = car.battery >= car.target * 0.92;
          state.served++;
          state.satisfaction = clamp(state.satisfaction + (happy ? 0.6 : -0.4), 0, 100);
          emit('session', { kwh: car.delivered, station: car.station.id, happy: happy });
          leaveMap(car);
        }
        break;
      }
      default:
        car.dead = true;
    }
  }

  /* ---------- 10. Camera + rendering -------------------------------- */

  const camera = { x: 0, y: 0, zoom: 1, minZoom: 0.45, maxZoom: 2.2 };
  let canvas = null, ctx = null, dpr = 1;
  let viewW = 0, viewH = 0;
  const ui = { selected: null, ghost: null, hoverTile: null };

  const WORLD_W = CFG.COLS * CFG.TILE;
  const WORLD_H = CFG.ROWS * CFG.TILE;

  function resize() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    viewW = rect.width; viewH = rect.height;
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    camera.minZoom = Math.min(viewW / WORLD_W, viewH / WORLD_H) * 0.92;
    camera.zoom = clamp(camera.zoom, camera.minZoom, camera.maxZoom);
    clampCamera();
  }

  function fitToScreen() {
    camera.zoom = Math.min(viewW / WORLD_W, viewH / WORLD_H);
    camera.x = WORLD_W / 2; camera.y = WORLD_H / 2;
    clampCamera();
  }

  function clampCamera() {
    const halfW = viewW / (2 * camera.zoom);
    const halfH = viewH / (2 * camera.zoom);
    if (WORLD_W < halfW * 2) camera.x = WORLD_W / 2;
    else camera.x = clamp(camera.x, halfW, WORLD_W - halfW);
    if (WORLD_H < halfH * 2) camera.y = WORLD_H / 2;
    else camera.y = clamp(camera.y, halfH, WORLD_H - halfH);
  }

  function panBy(dxScreen, dyScreen) {
    camera.x -= dxScreen / camera.zoom;
    camera.y -= dyScreen / camera.zoom;
    clampCamera();
  }

  function zoomAt(factor, sx, sy) {
    const before = screenToWorld(sx, sy);
    camera.zoom = clamp(camera.zoom * factor, camera.minZoom, camera.maxZoom);
    const after = screenToWorld(sx, sy);
    camera.x += before.x - after.x;
    camera.y += before.y - after.y;
    clampCamera();
  }

  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    const px = sx - rect.left, py = sy - rect.top;
    return {
      x: (px - viewW / 2) / camera.zoom + camera.x,
      y: (py - viewH / 2) / camera.zoom + camera.y
    };
  }

  function pickTileAt(sx, sy) {
    const w = screenToWorld(sx, sy);
    return tileAt(Math.floor(w.x / CFG.TILE), Math.floor(w.y / CFG.TILE));
  }

  /* --- drawing helpers --- */

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function nightAlpha() {
    const h = readout.hour + readout.minute / 60;
    if (h >= 7 && h <= 17) return 0;
    if (h > 17 && h < 21) return (h - 17) / 4 * 0.55;
    if (h > 5 && h < 7) return (7 - h) / 2 * 0.55;
    return 0.55;
  }

  function render() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = '#0b0d0f';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    drawZones();
    drawRoads();
    drawPlots();
    state.stations.forEach(drawStation);
    vehicles.forEach(drawCar);
    drawNight();
    drawSelection();

    ctx.restore();
    drawOverloadOverlay();
  }

  function drawZones() {
    const bands = [
      { from: 0, to: 5, key: 'highway' },
      { from: 6, to: 12, key: 'commercial' },
      { from: 13, to: CFG.ROWS - 1, key: 'residential' }
    ];
    bands.forEach(function (b) {
      ctx.fillStyle = ZONE[b.key].tint;
      ctx.fillRect(0, b.from * CFG.TILE, WORLD_W, (b.to - b.from + 1) * CFG.TILE);
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, WORLD_W - 1, WORLD_H - 1);

    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    bands.forEach(function (b) {
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.fillText(ZONE[b.key].name.toUpperCase(), 8, b.from * CFG.TILE + 16);
    });
  }

  function drawRoads() {
    ctx.fillStyle = '#1c2026';
    H_ROADS.forEach(function (r) { ctx.fillRect(0, r * CFG.TILE, WORLD_W, CFG.TILE); });
    V_ROADS.forEach(function (c) { ctx.fillRect(c * CFG.TILE, 0, CFG.TILE, WORLD_H); });

    ctx.save();
    ctx.setLineDash([14, 14]);
    ctx.lineWidth = 2;
    H_ROADS.forEach(function (r) {
      ctx.strokeStyle = r === 2 ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.moveTo(0, r * CFG.TILE + CFG.TILE / 2);
      ctx.lineTo(WORLD_W, r * CFG.TILE + CFG.TILE / 2);
      ctx.stroke();
    });
    V_ROADS.forEach(function (c) {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.moveTo(c * CFG.TILE + CFG.TILE / 2, 0);
      ctx.lineTo(c * CFG.TILE + CFG.TILE / 2, WORLD_H);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawPlots() {
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t.road) continue;
      const x = t.c * CFG.TILE, y = t.r * CFG.TILE;
      if (t.buildable) {
        if (!t.station) {
          ctx.save();
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = ui.ghost ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.07)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 5.5, y + 5.5, CFG.TILE - 11, CFG.TILE - 11);
          ctx.restore();
        }
      } else {
        const hgt = 6 + Math.floor(t.h * 10);
        ctx.fillStyle = '#15181d';
        roundRect(x + 4, y + 4, CFG.TILE - 8, CFG.TILE - 8, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        roundRect(x + 4, y + 4, CFG.TILE - 8, hgt, 4);
        ctx.fill();
        // Lit windows after dark
        const na = nightAlpha();
        if (na > 0.15) {
          ctx.fillStyle = 'rgba(255,214,120,' + (0.16 + t.h * 0.35) * na + ')';
          for (let w = 0; w < 3; w++) {
            const wx = x + 10 + w * 9;
            const wy = y + 14 + ((t.h * 100 + w * 7) % 12);
            if ((t.h * 1000 + w) % 3 !== 0) ctx.fillRect(wx, wy, 5, 5);
          }
        }
      }
    }
  }

  function drawStation(st) {
    const x = st.c * CFG.TILE, y = st.r * CFG.TILE;
    const accent = st.type === 'DC' ? '#00b0ff' : '#00e676';
    const busy = st.slots.filter(Boolean).length;
    const dead = isOverloaded();

    // pad
    ctx.fillStyle = '#171b21';
    roundRect(x + 3, y + 3, CFG.TILE - 6, CFG.TILE - 6, 6);
    ctx.fill();
    ctx.strokeStyle = dead ? 'rgba(255,82,82,0.6)' : accent + '55';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // solar roof
    if (st.solar) {
      ctx.fillStyle = readout.isDay ? 'rgba(0,176,255,0.45)' : 'rgba(0,176,255,0.18)';
      roundRect(x + 7, y + 6, CFG.TILE - 14, 7, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x + CFG.TILE / 2, y + 6); ctx.lineTo(x + CFG.TILE / 2, y + 13);
      ctx.stroke();
    }

    // charger unit
    const ux = x + CFG.TILE / 2 - 6, uy = y + CFG.TILE / 2 - 8;
    ctx.fillStyle = dead ? '#3a2226' : '#22272e';
    roundRect(ux, uy, 12, 18, 3);
    ctx.fill();
    ctx.strokeStyle = dead ? '#ff5252' : accent;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // screen + bolt
    ctx.fillStyle = dead ? '#ff5252' : accent;
    ctx.fillRect(ux + 2.5, uy + 3, 7, 5);
    ctx.beginPath();
    ctx.moveTo(ux + 7, uy + 10); ctx.lineTo(ux + 4, uy + 14);
    ctx.lineTo(ux + 6.4, uy + 14); ctx.lineTo(ux + 4.6, uy + 17.5);
    ctx.lineTo(ux + 9, uy + 13); ctx.lineTo(ux + 6.6, uy + 13);
    ctx.closePath();
    ctx.fill();

    // connector dots
    for (let i = 0; i < st.connectors; i++) {
      const p = slotPosition(st, i);
      ctx.beginPath();
      ctx.arc(p.x, p.y + 12, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = st.slots[i] ? (dead ? '#ff5252' : accent) : 'rgba(255,255,255,0.18)';
      ctx.fill();
    }

    // battery badge
    if (st.bess) {
      const pct = st.bessStored / CFG.BESS.kwh;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(x + CFG.TILE - 14, y + CFG.TILE - 12, 10, 6, 1.5);
      ctx.fill();
      ctx.fillStyle = '#00e676';
      ctx.fillRect(x + CFG.TILE - 13.5, y + CFG.TILE - 11.5, 9 * pct, 5);
    }

    // active glow
    if (busy && !dead) {
      const pulse = 0.35 + Math.sin(state.time * 4) * 0.15;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x + CFG.TILE / 2, y + CFG.TILE / 2, CFG.TILE * 0.55, 0, Math.PI * 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCar(car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(-11, -5.5, 22, 11, 3);
    ctx.fill();

    ctx.fillStyle = car.color;
    roundRect(-10, -5, 20, 10, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(10,16,24,0.75)';
    roundRect(-2.5, -4, 7, 8, 2);
    ctx.fill();

    if (nightAlpha() > 0.2) {
      ctx.fillStyle = 'rgba(255,238,170,' + (0.5 + nightAlpha() * 0.5) + ')';
      ctx.fillRect(9, -4, 2, 2.4);
      ctx.fillRect(9, 1.6, 2, 2.4);
      ctx.fillStyle = 'rgba(255,60,60,0.7)';
      ctx.fillRect(-11, -4, 1.6, 2);
      ctx.fillRect(-11, 2, 1.6, 2);
    }
    ctx.restore();

    // battery bar
    const low = car.battery < 0.3;
    if (car.state === 'charging' || low) {
      const bx = car.x - 9, by = car.y - 13;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(bx, by, 18, 4.5, 2);
      ctx.fill();
      ctx.fillStyle = car.battery < 0.2 ? '#ff5252' : car.battery < 0.5 ? '#ffb74d' : '#00e676';
      ctx.fillRect(bx + 1, by + 1, 16 * car.battery, 2.5);
      if (car.state === 'charging' && !isOverloaded()) {
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 7px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', car.x, by - 2);
      }
    }
  }

  function drawNight() {
    const a = nightAlpha();
    if (a <= 0) return;
    ctx.fillStyle = 'rgba(6,10,26,' + a + ')';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.stations.forEach(function (st) {
      const accent = st.type === 'DC' ? 'rgba(0,176,255,' : 'rgba(0,230,118,';
      const g = ctx.createRadialGradient(
        st.c * CFG.TILE + CFG.TILE / 2, st.r * CFG.TILE + CFG.TILE / 2, 2,
        st.c * CFG.TILE + CFG.TILE / 2, st.r * CFG.TILE + CFG.TILE / 2, CFG.TILE * 1.6);
      g.addColorStop(0, accent + (0.28 * a / 0.55) + ')');
      g.addColorStop(1, accent + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(st.c * CFG.TILE - CFG.TILE * 1.6, st.r * CFG.TILE - CFG.TILE * 1.6, CFG.TILE * 4.2, CFG.TILE * 4.2);
    });
    ctx.restore();
  }

  function drawSelection() {
    const t = ui.selected;
    if (t) {
      ctx.strokeStyle = '#00b0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.c * CFG.TILE + 2, t.r * CFG.TILE + 2, CFG.TILE - 4, CFG.TILE - 4);
    }
    const h = ui.hoverTile;
    if (ui.ghost && h) {
      const ok = h.buildable && !h.station && state.money >= CFG.STATIONS[ui.ghost].cost;
      ctx.fillStyle = ok ? 'rgba(0,230,118,0.22)' : 'rgba(255,82,82,0.22)';
      roundRect(h.c * CFG.TILE + 3, h.r * CFG.TILE + 3, CFG.TILE - 6, CFG.TILE - 6, 5);
      ctx.fill();
      ctx.strokeStyle = ok ? '#00e676' : '#ff5252';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawOverloadOverlay() {
    if (!isOverloaded()) return;
    const pulse = 0.12 + Math.abs(Math.sin(state.time * 3)) * 0.12;
    const g = ctx.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.2,
      viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.75);
    g.addColorStop(0, 'rgba(255,82,82,0)');
    g.addColorStop(1, 'rgba(255,82,82,' + pulse + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  /* ---------- 11. Persistence --------------------------------------- */

  function save() {
    try {
      const data = {
        v: 1,
        money: state.money, price: state.price, gridCapacity: state.gridCapacity,
        satisfaction: state.satisfaction, level: state.level, totalRevenue: state.totalRevenue,
        bestDaily: state.bestDaily, day: state.day, clock: state.clock,
        served: state.served, lost: state.lost, goalReached: state.goalReached,
        stations: state.stations.map(function (s) {
          return { c: s.c, r: s.r, type: s.type, solar: s.solar, bess: s.bess, bessStored: s.bessStored, earned: s.earned, sessions: s.sessions };
        })
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* storage disabled — game still runs in-memory */ }
  }

  function load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { data = null; }
    if (!data) return false;
    state.money = data.money;
    state.price = data.price;
    state.gridCapacity = data.gridCapacity;
    state.satisfaction = data.satisfaction;
    state.level = data.level;
    state.totalRevenue = data.totalRevenue;
    state.bestDaily = data.bestDaily || 0;
    state.day = data.day || 1;
    state.clock = data.clock || 0;
    state.served = data.served || 0;
    state.lost = data.lost || 0;
    state.goalReached = !!data.goalReached;
    state.stations = [];
    (data.stations || []).forEach(function (s) {
      const t = tileAt(s.c, s.r);
      if (!t) return;
      const st = makeStation(t, s.type);
      st.solar = !!s.solar; st.bess = !!s.bess; st.bessStored = s.bessStored || 0;
      st.earned = s.earned || 0; st.sessions = s.sessions || 0;
      state.stations.push(st);
    });
    return true;
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    state.stations.forEach(function (s) { const t = stationTile(s); if (t) t.station = null; });
    state.stations = [];
    vehicles.length = 0;
    state.money = CFG.START_MONEY;
    state.price = CFG.PRICE_DEFAULT;
    state.gridCapacity = CFG.START_GRID;
    state.satisfaction = 80;
    state.level = 1;
    state.totalRevenue = 0;
    state.dailyRevenue = 0;
    state.dailyProfit = 0;
    state.day = 1;
    state.clock = 0.25;
    state.served = 0;
    state.lost = 0;
    state.overloadUntil = 0;
    state.goalReached = false;
    ui.selected = null; ui.ghost = null;
    emit('change');
  }

  function scores() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); } catch (e) { return []; }
  }

  function pushScore(value) {
    try {
      const list = scores();
      list.push({ value: Math.round(value), day: state.day, date: Date.now() });
      list.sort(function (a, b) { return b.value - a.value; });
      localStorage.setItem(SCORE_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) { /* ignore */ }
  }

  /* ---------- 12. Utilities + boot ---------------------------------- */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function money(v) {
    return '₺' + Math.round(v).toLocaleString('tr-TR');
  }

  let last = 0, running = false;

  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    buildMap();
    GATES.length = 0;
    gateways().forEach(function (g) { GATES.push(g); });
    const restored = load();
    if (!restored) { state.clock = 0.25; }
    resize();
    fitToScreen();
    global.addEventListener('resize', function () { resize(); });
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
    emit('ready', { restored: restored });
    return restored;
  }

  /* ---------- 13. Public API ---------------------------------------- */

  global.EV = {
    CFG: CFG, ZONE: ZONE,
    state: state, readout: readout, vehicles: vehicles,
    on: on, emit: emit, toast: toast,
    init: init, resize: resize, fitToScreen: fitToScreen,
    camera: camera, panBy: panBy, zoomAt: zoomAt, screenToWorld: screenToWorld,
    pickTileAt: pickTileAt, tileAt: tileAt, tiles: tiles,
    ui: ui,
    placeStation: placeStation, sellStation: sellStation,
    upgradeStation: upgradeStation, upgradeGrid: upgradeGrid, transformerCost: transformerCost,
    setPrice: setPrice, restorePower: restorePower, isOverloaded: isOverloaded,
    save: save, reset: reset, scores: scores,
    money: money,
    setPaused: function (p) { state.paused = !!p; },
    /** Manual tick — used by the headless test harness. */
    __step: function (dt) { update(dt); render(); },
    /** Hook for a real rewarded-ad SDK. Replace with your network's callback. */
    onRewardedAd: null
  };

})(window);
