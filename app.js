'use strict';
/* POS SOE COME TO! - Front-end (Fase 1.5) */

const $ = (s, r = document) => r.querySelector(s);
const num = n => Number(n || 0).toLocaleString('id-ID');
const rp = n => (Number(n) < 0 ? '-Rp' : 'Rp') + num(Math.abs(Number(n) || 0));
const rpk = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'jt' : n >= 1e3 ? Math.round(n / 1e3) + 'rb' : String(n);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = 'assets/';
const emo = (n, c) => `<img class="emo ${c || ''}" src="${A}emo-${n}.png" alt="">`;
const hashN = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
const emoOf = s => (hashN(s) % 8) + 1;

const ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M18 14a6.5 6.5 0 013.5 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  wallet: '<path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 7l12-4v4"/><circle cx="17" cy="13.5" r="1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  full: '<path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>',
  vol: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/>',
  mute: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 14h12v7H6z"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  star: '<path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z" fill="currentColor"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'
};
const ic = (n, c) => `<svg class="ic ${c || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ''}</svg>`;
const deco = (n, style) => `<span class="deco" style="--m:url(${A}emo-${n}.png);${style}"></span>`;

const state = {
  user: null, pin: null, settings: {}, menu: [], varian: [], addon: [], members: [], terlaris: {}, shift: null, shiftInfo: null,
  view: 'kasir', cart: [], cat: 'Semua', opt: null, pay: null, form: null, member: null,
  hist: [], users: [], kupons: [], rep: null, repTab: 'ringkasan', repFrom: '', repTo: '', repPreset: 'hari',
  pgFrom: '', pgTo: '', pg: [], tmpLogo: null
};

/* ---------- Util ---------- */
function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.innerHTML = (type === 'ok' ? emo(7) : '') + `<span>${esc(msg)}</span>`;
  $('#toast').appendChild(el);
  setTimeout(() => el.remove(), type === 'err' ? 4800 : 2400);
}
function busy(on) { $('#busy').classList.toggle('on', !!on); }
async function run(fn) {
  busy(1);
  try { return await fn(); }
  catch (e) { toast(e.message || String(e), 'err'); }
  finally { busy(0); }
}
async function api(action, data = {}) {
  if (!CONFIG.API_URL || CONFIG.API_URL.startsWith('PASTE')) throw new Error('API_URL belum diisi di config.js');
  let res;
  try {
    res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(Object.assign({ action, pin: state.pin }, data)) });
  } catch (e) { throw new Error('Tidak bisa terhubung ke server. Cek internet.'); }
  let j;
  try { j = await res.json(); } catch (e) { throw new Error('Respons server tidak valid. Cek deploy Apps Script.'); }
  if (!j.ok) throw new Error(j.error);
  return j.data;
}
function modal(html, wide) { $('#modal').innerHTML = `<div class="mbox${wide ? ' wide' : ''}">${html}</div>`; }
function closeModal() { $('#modal').innerHTML = ''; }
const dStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fmtWaktu(w) { const s = String(w); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)}`; }
const intl = wa => { const d = String(wa || '').replace(/\D/g, ''); return d.startsWith('0') ? '62' + d.slice(1) : d; };
function ting() {
  if (localStorage.getItem('sc_sound') === '0') return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1318].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.12;
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
    if (navigator.vibrate) navigator.vibrate(60);
  } catch (e) { /* abaikan */ }
}
function table(head, body, foot) {
  const cell = (c, th) => {
    const isH = c && typeof c === 'object';
    const right = !isH && /^(Rp|-Rp|-?\d[\d.,]*%?$)/.test(String(c));
    const tg = th ? 'th' : 'td';
    return `<${tg}${right ? ' class="r"' : ''}>${isH ? c.h : esc(c)}</${tg}>`;
  };
  return `<div class="tbl-wrap"><table><thead><tr>${head.map(h => cell(h, 1)).join('')}</tr></thead><tbody>${
    body.length ? body.map(r => `<tr${r._cls ? ` class="${r._cls}"` : ''}>${r.map(c => cell(c)).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}" class="muted">Belum ada data</td></tr>`
  }</tbody>${foot ? `<tfoot><tr>${foot.map(c => cell(c)).join('')}</tr></tfoot>` : ''}</table></div>`;
}
function exportCSV(name, head, body, foot) {
  const txt = c => (c && typeof c === 'object') ? '' : String(c == null ? '' : c);
  const rows = [head.map(txt)].concat(body.map(r => r.map(txt)));
  if (foot) rows.push(foot.map(txt));
  const csv = '﻿' + rows.map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(';')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), name);
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Login ---------- */
let pinBuf = '';
function showLogin(msg) {
  pinBuf = '';
  const floats = [[1, 'left:6%;top:12%;width:110px;--r:-12deg'], [5, 'right:8%;top:10%;width:120px;--r:10deg;animation-delay:-2s'], [4, 'left:10%;bottom:10%;width:130px;--r:8deg;animation-delay:-4s'],
    [7, 'right:7%;bottom:14%;width:110px;--r:-8deg;animation-delay:-1s'], [3, 'left:34%;top:4%;width:80px;--r:6deg;animation-delay:-3s'], [6, 'right:30%;bottom:4%;width:90px;--r:-6deg;animation-delay:-5s']];
  $('#app').innerHTML = `<div class="login">${floats.map(f => deco(f[0], f[1])).join('')}<div class="login-box">
    <img class="login-logo" src="${A}logo-blue.png" alt="Soe Come To!">
    <div class="muted" style="font-weight:700">Masukkan PIN kasir</div>
    <div class="dots" id="dots"></div>
    <div class="err-t" id="lerr">${esc(msg || '')}</div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="pin" data-v="${n}">${n}</button>`).join('')}
      <button data-act="pinClear">C</button><button data-act="pin" data-v="0">0</button><button data-act="pinDel">&#9003;</button></div>
    <button class="btn big" style="margin-top:12px" data-act="login">Masuk</button></div></div>`;
  drawDots();
}
function drawDots() {
  const d = $('#dots'); if (!d) return;
  d.innerHTML = Array.from({ length: Math.max(4, pinBuf.length) }, (_, i) => `<i class="${i < pinBuf.length ? 'f' : ''}"></i>`).join('');
}
async function doLogin() {
  if (pinBuf.length < 4) return;
  state.pin = pinBuf;
  busy(1);
  try {
    state.user = await api('login');
    sessionStorage.setItem('sc_pin', state.pin);
    await loadAll();
    state.view = state.user.role === 'owner' ? 'beranda' : 'kasir';
    render();
  } catch (e) {
    state.pin = null; state.user = null;
    showLogin(e.message);
  } finally { busy(0); }
}
async function loadAll() {
  const d = await api('bootstrap');
  Object.assign(state, { user: d.user, settings: d.settings, menu: d.menu, varian: d.varian, addon: d.addon, members: d.members || [], terlaris: d.terlaris || {}, shift: d.shift, shiftInfo: d.shiftInfo });
  if (state.member) state.member = state.members.find(m => m.id === state.member.id) || null;
}
function logout() {
  sessionStorage.removeItem('sc_pin');
  Object.assign(state, { pin: null, user: null, cart: [], rep: null, member: null });
  showLogin();
}

/* ---------- Shell ---------- */
function render() {
  const u = state.user, owner = u.role === 'owner';
  const tabs = [];
  if (owner) tabs.push(['beranda', 'Beranda', 'home']);
  tabs.push(['kasir', 'Kasir', 'bag'], ['riwayat', 'Riwayat', 'clock'], ['shift', 'Shift', 'lock'], ['member', 'Member', 'users']);
  if (owner) tabs.push(['menu', 'Menu', 'grid'], ['pengeluaran', 'Pengeluaran', 'wallet'], ['laporan', 'Laporan', 'chart'], ['pengaturan', 'Pengaturan', 'gear']);
  const sound = localStorage.getItem('sc_sound') !== '0';
  $('#app').innerHTML = `<header class="hdr">
    ${deco(3, 'right:26%;top:-18px;width:90px;transform:rotate(12deg)')}${deco(5, 'right:6%;bottom:-20px;width:100px;transform:rotate(-10deg)')}${deco(7, 'left:42%;bottom:-14px;width:70px;transform:rotate(6deg)')}
    <div class="hdr-top"><img class="hdr-logo" src="${A}logo-white.png" alt="Soe Come To!">
      <div class="hdr-tools">
        <span class="chip ${state.shift ? 'on' : ''}"><i></i>${state.shift ? 'Shift buka' : 'Shift tutup'}</span>
        <button class="iconbtn" data-act="toggleSound" title="Suara">${ic(sound ? 'vol' : 'mute')}</button>
        <button class="iconbtn" data-act="fullscreen" title="Layar penuh">${ic('full')}</button>
        <div class="user"><span class="avatar">${emo(emoOf(u.nama))}</span>${esc(u.nama)}</div>
        <button class="iconbtn" data-act="logout" title="Keluar">${ic('logout')}</button></div></div>
    <nav class="nav">${tabs.map(t => `<button data-act="nav" data-v="${t[0]}" class="${state.view === t[0] ? 'on' : ''}">${ic(t[2])}${t[1]}</button>`).join('')}</nav></header>
    <main id="main"></main>`;
  (views[state.view] || views.kasir)();
}

/* ---------- Beranda (owner) ---------- */
async function vBeranda() {
  $('#main').innerHTML = `<div class="empty">${emo(8)}Memuat ringkasan...</div>`;
  const d = await run(() => api('dashboard'));
  if (!d) return;
  const max = Math.max(1, ...d.seri.map(s => s.total));
  const chg = d.kemarin.penjualan > 0 ? Math.round((d.hari.penjualan - d.kemarin.penjualan) / d.kemarin.penjualan * 100) : null;
  const tmax = Math.max(1, ...d.top.map(t => t.qty));
  const tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#main').innerHTML = `<div class="hello">${emo(5)}<div><h2>Halo, ${esc(state.user.nama)}!</h2><div class="muted" style="font-weight:700">${esc(tgl)}</div></div></div>
    <div class="kpis">
      <div class="kpi main">${deco(5, '')}<span>Omzet hari ini</span><b>${rp(d.hari.penjualan)}</b>
        <small>${chg === null ? 'Belum ada pembanding kemarin' : (chg >= 0 ? '▲ ' : '▼ ') + Math.abs(chg) + '% dari kemarin'}</small></div>
      <div class="kpi"><span>Transaksi</span><b>${num(d.hari.jumlah)}</b></div>
      <div class="kpi"><span>Tunai</span><b>${rp(d.hari.tunai)}</b></div>
      <div class="kpi"><span>QRIS bersih</span><b>${rp(d.hari.qris_bersih)}</b></div>
      <div class="kpi"><span>Pengeluaran</span><b>${rp(d.hari.pengeluaran)}</b></div></div>
    <div class="two"><div class="card"><h3>Omzet 7 hari terakhir</h3><div class="bars">${d.seri.map((s, i) => `<div class="bar${i === 6 ? ' today' : ''}"><b>${s.total ? rpk(s.total) : ''}</b><i style="height:${Math.max(2, Math.round(s.total / max * 100))}%"></i><span>${s.tanggal.slice(8)}/${s.tanggal.slice(5, 7)}</span></div>`).join('')}</div></div>
      <div class="card"><h3>Menu terlaris (7 hari)</h3>${d.top.length ? d.top.map(t => `<div class="hbar"><div><span>${esc(t.nama)}</span><span>${num(t.qty)}</span></div><i style="width:${Math.round(t.qty / tmax * 100)}%"></i></div>`).join('') : `<div class="empty">${emo(4)}Belum ada penjualan</div>`}</div></div>
    <div class="two"><div class="card"><h3>Stok menipis</h3>${d.stok_menipis.length ? d.stok_menipis.map(s => `<div class="alert"><span>${esc(s.nama)}</span><span>sisa ${num(s.stok)}</span></div>`).join('') : `<div class="muted">Semua stok aman ${emo(2)}</div>`}</div>
      <div class="card hl-card"><h3>Member</h3><div class="kv"><span>Total member</span><b>${num(d.member.total)}</b></div><div class="kv"><span>Baru hari ini</span><b>${num(d.member.baru)}</b></div></div></div>`;
}

/* ---------- Kasir ---------- */
const cartSub = () => state.cart.reduce((s, l) => s + l.harga * l.qty, 0);
const activeVarian = mid => state.varian.filter(v => v.menu_id === mid && v.aktif !== false);
const activeAddon = () => state.addon.filter(a => a.aktif !== false);
const holds = () => { try { return JSON.parse(localStorage.getItem('sc_hold') || '[]'); } catch (e) { return []; } };
const saveHolds = h => localStorage.setItem('sc_hold', JSON.stringify(h));

function vKasir() {
  const m = $('#main');
  if (!state.shift) {
    m.innerHTML = `<div class="card center">${emo(8, 'big')}<h2>Shift belum dibuka</h2><p class="muted">Masukkan modal awal kas laci.</p>
      <input class="inp" id="modal_awal" type="number" inputmode="numeric" placeholder="Modal awal (Rp)" value="0">
      <div style="height:14px"></div><button class="btn big" data-act="openShift">Buka Shift</button></div>`;
    return;
  }
  const menus = state.menu.filter(x => x.aktif !== false).sort((a, b) => (state.terlaris[b.id] || 0) - (state.terlaris[a.id] || 0) || String(a.nama).localeCompare(b.nama));
  const top3 = menus.filter(x => (state.terlaris[x.id] || 0) > 0).slice(0, 3).map(x => x.id);
  const cats = ['Semua'].concat([...new Set(menus.map(x => x.kategori || 'Lainnya'))]);
  const list = menus.filter(x => state.cat === 'Semua' || (x.kategori || 'Lainnya') === state.cat);
  const tiles = list.map(x => {
    const vs = activeVarian(x.id), habis = x.lacak_stok === true && Number(x.stok) <= 0, noPrice = Number(x.harga) <= 0;
    return `<button class="tile${habis || noPrice ? ' off' : ''}" data-act="pick" data-id="${x.id}">
      <span class="bub">${emo(emoOf(x.id))}</span>
      <div><b>${esc(x.nama)}</b><div class="meta">${top3.includes(x.id) ? `<span class="badge star">${ic('star')} Terlaris</span>` : ''}${vs.length ? `<span class="badge">${vs.length} varian</span>` : ''}${x.lacak_stok === true ? `<span class="badge${Number(x.stok) <= Number(x.stok_min) ? ' w' : ''}">${habis ? 'Habis' : 'Stok ' + num(x.stok)}</span>` : ''}</div></div>
      ${noPrice ? '<span class="badge w">Harga belum diisi</span>' : `<span class="price">${rp(x.harga)}</span>`}</button>`;
  }).join('');
  const lines = state.cart.map((l, i) => `<div class="line"><div class="row sb" style="flex-wrap:nowrap"><div>
      <div class="nm">${esc(l.nama)}${l.varian ? ' (' + esc(l.varian) + ')' : ''}</div>
      ${l.addons.length ? `<div class="dt">+ ${l.addons.map(a => esc(a.nama)).join(', ')}</div>` : ''}
      ${l.catatan ? `<div class="dt">Catatan: ${esc(l.catatan)}</div>` : ''}</div>
      <b style="font-family:var(--fh)">${rp(l.harga * l.qty)}</b></div>
      <div class="ctl"><div class="qty"><button data-act="qtyDec" data-i="${i}">&minus;</button><span>${l.qty}</span><button data-act="qtyInc" data-i="${i}">+</button></div>
      <button class="btn ghost sm" data-act="editLine" data-i="${i}">Ubah</button><button class="btn ghost sm" data-act="delLine" data-i="${i}">${ic('x')}</button></div></div>`).join('');
  const nh = holds().length, mem = state.member;
  m.innerHTML = `<div class="pos"><section class="catalog">
      <div class="cats">${cats.map(c => `<button data-act="cat" data-v="${esc(c)}" class="${state.cat === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
      <div class="grid">${tiles || `<div class="empty">${emo(8)}Belum ada menu. Tambah lewat tab Menu.</div>`}</div></section>
    <aside class="cart"><div class="cart-h"><h3>Pesanan</h3><div class="row" style="gap:6px">
        <button class="btn ghost sm" data-act="holdAsk" ${state.cart.length ? '' : 'disabled'}>${ic('pause')} Tahan</button>
        <button class="btn ghost sm" data-act="holdList">Ditahan${nh ? ' (' + nh + ')' : ''}</button></div></div>
      <div class="memrow">${mem ? `<button class="memchip" data-act="memberPick"><span class="avatar">${emo(emoOf(mem.id))}</span><div style="flex:1"><b>${esc(mem.nama)}</b><div class="hint" style="margin:0">${num(mem.poin)} poin • ${num(mem.kunjungan)}x kunjungan</div></div><span data-act="memberClear" class="badge pink" style="padding:6px 10px">${ic('x')}</span></button>`
        : `<button class="memadd" data-act="memberPick">${ic('users')} Pilih / daftar member</button>`}</div>
      <div class="lines">${lines || `<div class="empty">${emo(2)}Ketuk menu untuk menambah</div>`}</div>
      <div class="sum"><div class="tot"><span>Subtotal</span><span>${rp(cartSub())}</span></div>
      <div class="row" style="flex-wrap:nowrap"><button class="btn ghost" data-act="clearCart" ${state.cart.length ? '' : 'disabled'}>Kosongkan</button>
      <button class="btn big" style="flex:1;width:auto" data-act="openPay" ${state.cart.length ? '' : 'disabled'}>Bayar</button></div></div></aside></div>`;
}

function pick(id) {
  const m = state.menu.find(x => x.id === id);
  if (!m) return;
  if (Number(m.harga) <= 0) return toast('Harga ' + m.nama + ' belum diisi (tab Menu, owner)', 'err');
  if (m.lacak_stok === true && Number(m.stok) <= 0) return toast('Stok ' + m.nama + ' habis', 'err');
  const vs = activeVarian(id), ads = activeAddon();
  if (!vs.length && !ads.length) {
    state.cart.push({ menu_id: id, nama: m.nama, varian_id: '', varian: '', addon_ids: [], addons: [], catatan: '', qty: 1, harga: Number(m.harga) });
    return vKasir();
  }
  state.opt = { menu: m, varian_id: vs[0] ? vs[0].id : '', addon_ids: [], qty: 1, catatan: '', idx: -1 };
  renderOpt();
}
function editLine(i) {
  const l = state.cart[i], m = state.menu.find(x => x.id === l.menu_id);
  if (!m) return;
  state.opt = { menu: m, varian_id: l.varian_id, addon_ids: l.addon_ids.slice(), qty: l.qty, catatan: l.catatan, idx: i };
  renderOpt();
}
function optPrice() {
  const o = state.opt;
  let h = Number(o.menu.harga);
  const v = state.varian.find(x => x.id === o.varian_id); if (v) h += Number(v.selisih) || 0;
  o.addon_ids.forEach(id => { const a = state.addon.find(x => x.id === id); if (a) h += Number(a.harga) || 0; });
  return h;
}
function renderOpt() {
  const o = state.opt, vs = activeVarian(o.menu.id), ads = activeAddon();
  modal(`<h3>${emo(emoOf(o.menu.id))} ${esc(o.menu.nama)}</h3>
    ${vs.length ? `<label class="f">Varian</label><div class="chips">${vs.map(v => `<button class="chip2${o.varian_id === v.id ? ' on' : ''}" data-act="optVar" data-id="${v.id}">${esc(v.nama)}${Number(v.selisih) ? ' (' + (v.selisih > 0 ? '+' : '') + num(v.selisih) + ')' : ''}</button>`).join('')}</div>` : ''}
    ${ads.length ? `<label class="f">Add-on</label><div class="chips">${ads.map(a => `<button class="chip2${o.addon_ids.includes(a.id) ? ' on' : ''}" data-act="optAdd" data-id="${a.id}">${esc(a.nama)}${Number(a.harga) ? ' (+' + num(a.harga) + ')' : ''}</button>`).join('')}</div>` : ''}
    <label class="f">Catatan</label><input class="inp" data-in="optNote" value="${esc(o.catatan)}" maxlength="100" placeholder="Misal: tanpa keju, extra susu">
    <div class="row sb" style="margin-top:16px"><div class="qty"><button data-act="optQ" data-v="-1">&minus;</button><span id="oq">${o.qty}</span><button data-act="optQ" data-v="1">+</button></div>
    <div class="big-n" id="op">${rp(optPrice() * o.qty)}</div></div>
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn" data-act="optOk">${o.idx >= 0 ? 'Simpan' : 'Tambah'}</button></div>`);
}
function optSave() {
  const o = state.opt, v = state.varian.find(x => x.id === o.varian_id);
  const line = {
    menu_id: o.menu.id, nama: o.menu.nama, varian_id: o.varian_id || '', varian: v ? v.nama : '',
    addon_ids: o.addon_ids.slice(), addons: o.addon_ids.map(id => { const a = state.addon.find(x => x.id === id); return { id, nama: a.nama, harga: Number(a.harga) || 0 }; }),
    catatan: o.catatan.trim(), qty: o.qty, harga: optPrice()
  };
  if (o.idx >= 0) state.cart[o.idx] = line; else state.cart.push(line);
  state.opt = null; closeModal(); vKasir();
}

/* Pesanan ditahan */
function holdAsk() {
  if (!state.cart.length) return;
  const def = state.member ? state.member.nama : 'Pesanan ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
  modal(`<h3>Tahan pesanan</h3><p class="muted">Pesanan disimpan di tablet ini dan bisa dilanjutkan kapan saja.</p>
    <label class="f">Label (nama pelanggan / meja)</label><input class="inp" id="hold_label" value="${esc(def)}" maxlength="40">
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn" data-act="holdSave">Tahan</button></div>`);
}
function holdSave() {
  const h = holds();
  h.push({ id: 'H' + Date.now(), label: $('#hold_label').value.trim() || 'Pesanan', cart: state.cart, member_id: state.member ? state.member.id : '', waktu: Date.now() });
  saveHolds(h);
  state.cart = []; state.member = null; closeModal(); toast('Pesanan ditahan', 'ok'); vKasir();
}
function holdList() {
  const h = holds();
  modal(`<h3>Pesanan ditahan</h3>${h.length ? h.map(x => `<div class="mrow" style="margin-bottom:8px"><div><b>${esc(x.label)}</b><div class="hint" style="margin:0">${x.cart.length} item • ${rp(x.cart.reduce((s, l) => s + l.harga * l.qty, 0))} • ${pad(new Date(x.waktu).getHours())}:${pad(new Date(x.waktu).getMinutes())}</div></div>
      <button class="btn sm" data-act="holdResume" data-id="${x.id}">Lanjut</button><button class="btn ghost sm" data-act="holdDel" data-id="${x.id}">${ic('x')}</button></div>`).join('') : `<div class="empty">${emo(8)}Tidak ada pesanan ditahan</div>`}
    <div class="row end"><button class="btn ghost" data-act="closeModal">Tutup</button></div>`);
}
function holdResume(id) {
  const h = holds(), x = h.find(y => y.id === id); if (!x) return;
  if (state.cart.length && !confirm('Pesanan yang sedang dibuat akan diganti. Lanjutkan?')) return;
  state.cart = x.cart; state.member = state.members.find(m => m.id === x.member_id) || null;
  saveHolds(h.filter(y => y.id !== id)); closeModal(); vKasir();
}

/* Member di kasir */
function openMemberPick() {
  modal(`<h3>Pilih member</h3><input class="inp" id="memq" data-in="memSearch" placeholder="Ketik nama atau nomor WhatsApp" autocomplete="off">
    <div id="memList" class="memlist"></div>
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn" data-act="newMember" data-pick="1">${ic('plus')} Member baru</button></div>`);
  drawMemPick('');
  setTimeout(() => { const q = $('#memq'); if (q) q.focus(); }, 60);
}
function drawMemPick(q) {
  q = q.trim().toLowerCase();
  const list = state.members.filter(m => m.aktif && (!q || m.nama.toLowerCase().includes(q) || m.wa.includes(q.replace(/\D/g, '') || '###'))).slice(0, 30);
  $('#memList').innerHTML = list.length ? list.map(m => `<button class="mrow" data-act="setMember" data-id="${m.id}"><span class="avatar" style="background:var(--bl)">${emo(emoOf(m.id))}</span><div><b>${esc(m.nama)}</b><div class="hint" style="margin:0">${esc(m.wa)}</div></div><span class="badge star">${num(m.poin)} poin</span></button>`).join('')
    : `<div class="empty">${emo(2)}Member tidak ditemukan</div>`;
}

/* ---------- Pembayaran ---------- */
const settingNum = k => Number(state.settings[k]) || 0;
function payCalc() {
  const p = state.pay, sub = cartSub(), mem = state.member, st = state.settings;
  const d1 = Math.min(sub, p.dtipe === 'persen' ? Math.round(sub * Math.min(100, Math.max(0, p.dnilai)) / 100) : Math.max(0, p.dnilai));
  const k = p.kupon ? Math.min(p.kupon.diskon, sub - d1) : 0;
  const sisa = sub - d1 - k, nilai = settingNum('poin_nilai'), poinOn = st.poin_aktif !== '0' && mem && nilai > 0;
  const maxPoin = poinOn ? Math.min(mem.poin, Math.ceil(sisa / nilai)) : 0;
  let pp = poinOn ? Math.min(Math.max(0, Math.floor(p.poin || 0)), maxPoin) : 0, poinWarn = '';
  if (pp > 0 && pp < settingNum('poin_min_tukar')) { poinWarn = 'Minimal tukar ' + num(settingNum('poin_min_tukar')) + ' poin'; pp = 0; }
  const pd = Math.min(pp * nilai, sisa), total = sisa - pd;
  const kel = settingNum('poin_kelipatan'), dapat = (mem && st.poin_aktif !== '0' && kel > 0) ? Math.floor(total / kel) * settingNum('poin_per') : 0;
  const mdrp = settingNum('mdr_persen');
  return { sub, d1, k, pp, pd, poinWarn, maxPoin, total, dapat, mdrp, mdr: p.metode === 'QRIS' ? Math.round(total * mdrp / 100) : 0, kembali: p.bayar - total };
}
function renderPay() {
  const p = state.pay, c = payCalc(), mem = state.member, st = state.settings;
  const poinOn = st.poin_aktif !== '0' && mem && settingNum('poin_nilai') > 0;
  modal(`<h3>Pembayaran</h3>
    <div class="kv"><span>Subtotal</span><b>${rp(c.sub)}</b></div>
    ${mem ? `<div class="kv"><span>Member</span><span class="tag">${esc(mem.nama)} • ${num(mem.poin)} poin</span></div>` : ''}
    <label class="f">Kupon</label>
    ${p.kupon ? `<div class="row sb"><span class="tag">${ic('tag')} ${esc(p.kupon.kode)} (-${rp(c.k)})</span><button class="btn ghost sm" data-act="kuponDel">Lepas</button></div>`
      : `<div class="row" style="flex-wrap:nowrap"><input class="inp" style="flex:1;text-transform:uppercase" data-in="kuponKode" value="${esc(p.kuponKode || '')}" placeholder="Kode kupon"><button class="btn ghost" data-act="kuponCek">Pakai</button></div>`}
    ${poinOn ? `<label class="f">Tukar poin <span class="muted">(1 poin = ${rp(settingNum('poin_nilai'))}, saldo ${num(mem.poin)})</span></label>
      <div class="row" style="flex-wrap:nowrap"><input class="inp" style="flex:1" type="number" inputmode="numeric" data-in="poin" value="${p.poin || ''}" placeholder="0"><button class="btn ghost" data-act="poinMax">Maks</button></div>
      <div class="hint err" id="poinwarn">${esc(c.poinWarn)}</div>` : ''}
    <label class="f">Diskon manual</label>
    <div class="row" style="flex-wrap:nowrap"><div class="seg" style="width:170px"><button class="${p.dtipe === 'nominal' ? 'on' : ''}" data-act="setDtipe" data-v="nominal">Rp</button><button class="${p.dtipe === 'persen' ? 'on' : ''}" data-act="setDtipe" data-v="persen">%</button></div>
    <input class="inp" style="flex:1" type="number" inputmode="numeric" data-in="dnilai" value="${p.dnilai || ''}" placeholder="0"></div>
    <div class="kv hl"><span>Total bayar</span><span class="big-n" id="ptotal">${rp(c.total)}</span></div>
    ${mem && st.poin_aktif !== '0' ? `<div class="hint" id="pdapat">Member dapat +${num(c.dapat)} poin dari transaksi ini</div>` : ''}
    <label class="f">Metode</label>
    <div class="seg"><button class="${p.metode === 'Tunai' ? 'on' : ''}" data-act="setMetode" data-v="Tunai">Tunai</button><button class="${p.metode === 'QRIS' ? 'on' : ''}" data-act="setMetode" data-v="QRIS">QRIS</button></div>
    ${p.metode === 'Tunai' ? `<label class="f">Uang diterima</label>
      <input class="inp" id="pbayar" type="number" inputmode="numeric" data-in="bayar" value="${p.bayar || ''}" placeholder="0">
      <div class="chips" style="margin-top:8px"><button class="chip2" data-act="quick" data-v="pas">Uang pas</button>${[5000, 10000, 20000, 50000, 100000].map(n => `<button class="chip2" data-act="quick" data-v="${n}">${num(n)}</button>`).join('')}</div>
      <div class="kv"><span>Kembalian</span><b id="pkembali" style="font-family:var(--fh);font-size:1.3rem">${c.kembali >= 0 ? rp(c.kembali) : 'Kurang ' + rp(-c.kembali)}</b></div>`
    : `<p class="muted">Pastikan pembayaran QRIS pelanggan sudah masuk sebelum memproses.</p>`}
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button>
    <button class="btn ok" id="pgo" data-act="doPay" ${p.metode === 'Tunai' && c.kembali < 0 ? 'disabled' : ''}>Proses</button></div>`);
}
function updPay() {
  const c = payCalc(), p = state.pay;
  $('#ptotal').textContent = rp(c.total);
  const k = $('#pkembali'); if (k) k.textContent = c.kembali >= 0 ? rp(c.kembali) : 'Kurang ' + rp(-c.kembali);
  const w = $('#poinwarn'); if (w) w.textContent = c.poinWarn;
  const d = $('#pdapat'); if (d) d.textContent = 'Member dapat +' + num(c.dapat) + ' poin dari transaksi ini';
  $('#pgo').toggleAttribute('disabled', p.metode === 'Tunai' && c.kembali < 0);
}
async function kuponCek() {
  const kode = (state.pay.kuponKode || '').trim();
  if (!kode) return toast('Isi kode kupon', 'err');
  const r = await run(() => api('kupon_cek', { kode, subtotal: cartSub() }));
  if (!r) return;
  state.pay.kupon = { kode: r.kode, diskon: r.diskon, nama: r.nama }; state.pay.kuponKode = '';
  toast('Kupon dipakai: ' + r.kode, 'ok'); renderPay();
}
async function doPay() {
  const p = state.pay, c = payCalc();
  const r = await run(() => api('trx_create', {
    items: state.cart.map(l => ({ menu_id: l.menu_id, varian_id: l.varian_id, addon_ids: l.addon_ids, catatan: l.catatan, qty: l.qty })),
    diskon: { tipe: p.dtipe, nilai: p.dnilai }, metode: p.metode, bayar: p.bayar,
    member_id: state.member ? state.member.id : '', kupon: p.kupon ? p.kupon.kode : '', poin_pakai: c.pp
  }));
  if (!r) return;
  Object.keys(r.stok).forEach(id => { const m = state.menu.find(x => x.id === id); if (m) m.stok = r.stok[id]; });
  if (r.member) {
    const i = state.members.findIndex(x => x.id === r.member.id);
    if (i >= 0) state.members[i] = r.member; else state.members.push(r.member);
    r.trx._saldo = r.member.poin;
  }
  state.cart = []; state.pay = null; state.member = null;
  ting();
  showReceipt(r.trx, true);
  vKasir();
}

/* ---------- Struk: gambar (WA) ---------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
async function receiptCanvas(t) {
  try { await Promise.all([document.fonts.load('800 24px "Baloo 2"'), document.fonts.load('700 16px "Nunito"'), document.fonts.load('400 16px "Nunito"')]); } catch (e) { /* pakai font cadangan */ }
  const [logo, kiss] = await Promise.all([loadImg(A + 'logo-blue.png'), loadImg(A + 'emo-7.png')]);
  const s = state.settings, W = 560, M = 34, SC = 2, BLUE = '#29a9e0', DARK = '#12303f', GRAY = '#6a8496';
  const FH = '"Baloo 2","Nunito",system-ui,sans-serif', FB = '"Nunito",system-ui,sans-serif';
  const wrapT = (ctx, text, maxW) => {
    const out = []; let cur = '';
    String(text).split(/\s+/).forEach(w => {
      if (!w) return;
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test;
    });
    if (cur) out.push(cur);
    return out;
  };
  const layout = ctx => {
    let y = 0;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, 6000);
    ctx.fillStyle = BLUE; ctx.fillRect(0, 0, W, 10);
    y = 34;
    const lw = 150, lh = logo.height * lw / logo.width;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh); y += lh + 14;
    ctx.textAlign = 'center'; ctx.fillStyle = GRAY; ctx.font = `600 13px ${FB}`;
    wrapT(ctx, s.alamat || '', W - 2 * M - 30).forEach(l => { ctx.fillText(l, W / 2, y + 12); y += 18; });
    y += 12;
    const dash = () => { ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = '#c8dce8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke(); ctx.restore(); y += 18; };
    const row = (l, v, o) => {
      o = o || {};
      ctx.textAlign = 'left'; ctx.fillStyle = o.lc || GRAY; ctx.font = o.lf || `600 14px ${FB}`; ctx.fillText(l, M, y + 14);
      ctx.textAlign = 'right'; ctx.fillStyle = o.vc || DARK; ctx.font = o.vf || `700 14px ${FB}`; ctx.fillText(v, W - M, y + 14);
      y += o.h || 24;
    };
    dash();
    row('No. Transaksi', t.no); row('Waktu', fmtWaktu(t.waktu)); row('Kasir', t.kasir);
    if (t.member_nama) row('Member', t.member_nama);
    y += 8;
    ctx.fillStyle = t.status === 'void' ? '#e04848' : BLUE; rr(ctx, (W - 240) / 2, y, 240, 56, 28); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `800 28px ${FH}`;
    ctx.fillText(t.status === 'void' ? 'VOID' : 'ANTRIAN #' + t.antrian, W / 2, y + 38); y += 56 + 22;
    dash();
    (t.items || []).forEach(i => {
      ctx.font = `800 17px ${FH}`; ctx.textAlign = 'left'; ctx.fillStyle = DARK;
      const nm = i.nama + (i.varian ? ' (' + i.varian + ')' : '');
      const ls = wrapT(ctx, nm, W - 2 * M - 120);
      ls.forEach((l, k) => { ctx.fillText(l, M, y + 16); if (k === 0) { ctx.textAlign = 'right'; ctx.fillText(num(i.subtotal), W - M, y + 16); ctx.textAlign = 'left'; } y += 22; });
      ctx.font = `600 13px ${FB}`; ctx.fillStyle = GRAY;
      (i.addons || []).forEach(a => { ctx.fillText('+ ' + a.nama + (a.harga ? ' (' + num(a.harga) + ')' : ''), M + 10, y + 12); y += 18; });
      if (i.catatan) wrapT(ctx, 'Catatan: ' + i.catatan, W - 2 * M - 20).forEach(l => { ctx.fillText(l, M + 10, y + 12); y += 18; });
      ctx.fillText(`${i.qty} x ${num(i.harga)}`, M + 10, y + 12); y += 28;
    });
    dash();
    const manual = Math.max(0, t.diskon - t.kupon_diskon - t.poin_diskon);
    if (t.diskon > 0) row('Subtotal', num(t.subtotal));
    if (manual > 0) row('Diskon', '-' + num(manual), { vc: '#17a35a' });
    if (t.kupon_diskon > 0) row('Kupon ' + t.kupon_kode, '-' + num(t.kupon_diskon), { vc: '#17a35a' });
    if (t.poin_diskon > 0) row('Tukar ' + num(t.poin_pakai) + ' poin', '-' + num(t.poin_diskon), { vc: '#17a35a' });
    y += 4;
    row('TOTAL', 'Rp' + num(t.total), { lc: DARK, lf: `800 20px ${FH}`, vc: BLUE, vf: `800 26px ${FH}`, h: 36 });
    row('Bayar (' + t.metode + ')', 'Rp' + num(t.bayar));
    if (t.metode === 'Tunai') row('Kembalian', 'Rp' + num(t.kembali));
    y += 8;
    if (t.member_nama) {
      ctx.fillStyle = '#e6f5fc'; rr(ctx, M, y, W - 2 * M, t._saldo !== undefined ? 62 : 40, 16); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#126a93'; ctx.font = `800 15px ${FH}`;
      ctx.fillText('Poin didapat: +' + num(t.poin_dapat), W / 2, y + 26);
      if (t._saldo !== undefined) { ctx.font = `700 13px ${FB}`; ctx.fillText('Saldo poin kamu: ' + num(t._saldo), W / 2, y + 48); }
      y += (t._saldo !== undefined ? 62 : 40) + 16;
    }
    dash();
    const kw = 70, kh = kiss.height * kw / kiss.width;
    ctx.drawImage(kiss, (W - kw) / 2, y, kw, kh); y += kh + 10;
    ctx.textAlign = 'center'; ctx.fillStyle = BLUE; ctx.font = `800 24px ${FH}`; ctx.fillText('Terima kasih!', W / 2, y + 22); y += 32;
    ctx.fillStyle = GRAY; ctx.font = `600 13px ${FB}`;
    if (!/^terima kasih/i.test(String(s.footer || '').trim())) wrapT(ctx, s.footer || '', W - 2 * M - 30).forEach(l => { ctx.fillText(l, W / 2, y + 14); y += 19; });
    const soc = [s.instagram ? 'IG ' + s.instagram : '', s.whatsapp ? 'WA ' + s.whatsapp : ''].filter(Boolean).join('   •   ');
    if (soc) { ctx.fillStyle = DARK; ctx.font = `700 14px ${FB}`; ctx.fillText(soc, W / 2, y + 18); y += 30; }
    y += 14;
    ctx.fillStyle = BLUE; ctx.fillRect(0, y, W, 10);
    return y + 10;
  };
  const probe = document.createElement('canvas').getContext('2d');
  const H = layout(probe);
  const cv = document.createElement('canvas'); cv.width = W * SC; cv.height = H * SC;
  const cx = cv.getContext('2d'); cx.scale(SC, SC); layout(cx);
  return cv;
}
const canvasBlob = cv => new Promise(r => cv.toBlob(r, 'image/png'));
async function shareReceipt(t) {
  t = t || lastTrx; if (!t) return;
  const blob = await run(async () => canvasBlob(await receiptCanvas(t)));
  if (!blob) return;
  const file = new File([blob], `nota-${t.no}.png`, { type: 'image/png' });
  const mem = state.members.find(m => m.id === t.member_id);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Nota ' + t.no, text: 'Terima kasih sudah jajan di ' + (state.settings.nama_usaha || 'Soe Come To!') }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  download(blob, file.name);
  toast('Gambar nota diunduh, kirim lewat WhatsApp', 'ok');
  if (mem) window.open('https://wa.me/' + intl(mem.wa), '_blank');
}
async function downloadReceipt(t) {
  t = t || lastTrx; if (!t) return;
  const blob = await run(async () => canvasBlob(await receiptCanvas(t)));
  if (blob) download(blob, `nota-${t.no}.png`);
}
let lastTrx = null;
function showReceipt(t, fresh) {
  lastTrx = t;
  modal(`<div class="${fresh ? 'success' : ''}">${fresh ? emo(5) : ''}<h3>${fresh ? 'Transaksi berhasil!' : 'Nota ' + esc(t.no)}</h3></div>
    <div class="rwrap"><div class="rimg" id="rimg"><div class="empty">${emo(8)}Membuat nota...</div></div>
    <div class="ractions">${fresh && t.metode === 'Tunai' ? `<div class="kv hl"><span>Kembalian</span><b class="big-n" style="font-size:1.6rem">${rp(t.kembali)}</b></div>` : ''}
      ${fresh && t.poin_dapat ? `<div class="kv hl" style="background:#fff1c2"><span>Poin didapat</span><b>+${num(t.poin_dapat)}</b></div>` : ''}
      <button class="btn ok" data-act="shareWA">${ic('send')} Kirim nota (WA)</button>
      <button class="btn" data-act="printTrx">${ic('print')} Cetak struk</button>
      <button class="btn ghost" data-act="dlReceipt">${ic('dl')} Unduh gambar</button>
      <button class="btn ghost" data-act="closeModal">${fresh ? 'Transaksi baru' : 'Tutup'}</button></div></div>`, true);
  receiptCanvas(t).then(cv => { const el = $('#rimg'); if (el && lastTrx === t) el.innerHTML = `<img alt="Nota" src="${cv.toDataURL('image/png')}">`; })
    .catch(() => { const el = $('#rimg'); if (el) el.innerHTML = '<div class="empty">Gagal membuat gambar nota</div>'; });
}

/* ---------- Struk thermal: teks / ESC-POS ---------- */
const thermalLogo = () => state.settings.logo || 'logo.png';
function asc(s) { return String(s).normalize('NFD').replace(/[^\x20-\x7E]/g, ''); }
function wrap(text, W) {
  const out = []; let cur = '';
  asc(text).split(/\s+/).forEach(w => {
    if (!w) return;
    if ((cur + ' ' + w).trim().length > W) {
      if (cur) out.push(cur);
      cur = w;
      while (cur.length > W) { out.push(cur.slice(0, W)); cur = cur.slice(W); }
    } else cur = (cur + ' ' + w).trim();
  });
  if (cur) out.push(cur);
  return out;
}
function receiptLines(t) {
  const W = 32, s = state.settings, L = [];
  const c = x => { x = asc(x); return ' '.repeat(Math.max(0, Math.floor((W - x.length) / 2))) + x; };
  const lr = (a, b) => { a = asc(a); b = asc(b); const sp = W - a.length - b.length; return sp > 0 ? a + ' '.repeat(sp) + b : a.slice(0, Math.max(0, W - b.length - 1)) + ' ' + b; };
  const sep = '-'.repeat(W);
  wrap(s.alamat || '', W).forEach(l => L.push(c(l)));
  L.push(sep);
  L.push(lr('No', t.no)); L.push(lr('Waktu', fmtWaktu(t.waktu))); L.push(lr('Kasir', t.kasir));
  if (t.member_nama) L.push(lr('Member', t.member_nama));
  L.push(c('ANTRIAN #' + t.antrian));
  if (t.status === 'void') L.push(c('*** VOID ***'));
  L.push(sep);
  t.items.forEach(i => {
    wrap(i.nama + (i.varian ? ' (' + i.varian + ')' : ''), W).forEach(l => L.push(l));
    i.addons.forEach(a => wrap('+ ' + a.nama, W - 2).forEach(l => L.push('  ' + l)));
    if (i.catatan) wrap('* ' + i.catatan, W - 2).forEach(l => L.push('  ' + l));
    L.push(lr(`${i.qty} x ${num(i.harga)}`, num(i.subtotal)));
  });
  L.push(sep);
  const manual = Math.max(0, (t.diskon || 0) - (t.kupon_diskon || 0) - (t.poin_diskon || 0));
  if (Number(t.diskon) > 0) L.push(lr('Subtotal', num(t.subtotal)));
  if (manual > 0) L.push(lr('Diskon', '-' + num(manual)));
  if (t.kupon_diskon > 0) L.push(lr('Kupon ' + t.kupon_kode, '-' + num(t.kupon_diskon)));
  if (t.poin_diskon > 0) L.push(lr('Tukar ' + t.poin_pakai + ' poin', '-' + num(t.poin_diskon)));
  L.push(lr('TOTAL', num(t.total)));
  L.push(lr('Bayar (' + t.metode + ')', num(t.bayar)));
  if (t.metode === 'Tunai') L.push(lr('Kembali', num(t.kembali)));
  if (t.member_nama) { L.push(sep); L.push(lr('Poin didapat', '+' + num(t.poin_dapat))); if (t._saldo !== undefined) L.push(lr('Saldo poin', num(t._saldo))); }
  L.push(sep);
  if (s.instagram) L.push(c('IG ' + s.instagram));
  if (s.whatsapp) L.push(c('WA ' + s.whatsapp));
  wrap(s.footer || '', W).forEach(l => L.push(c(l)));
  return L;
}
const printerMode = () => localStorage.getItem('sc_printer') || 'browser';
function printBrowser(t) {
  $('#printArea').innerHTML = `<img src="${thermalLogo()}">` + `<pre>${esc(receiptLines(t).join('\n'))}</pre>`;
  setTimeout(() => window.print(), 80);
}
async function logoRaster() {
  const img = await loadImg(thermalLogo()), w = 256, h = Math.round(img.height * w / img.width);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h).data, bpr = w / 8, out = new Uint8Array(8 + bpr * h);
  out.set([0x1D, 0x76, 0x30, 0, bpr & 255, bpr >> 8, h & 255, h >> 8]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < 160) out[8 + y * bpr + (x >> 3)] |= 0x80 >> (x & 7);
  }
  return out;
}
async function buildEscpos(t) {
  const enc = new TextEncoder(), parts = [Uint8Array.from([0x1B, 0x40, 0x1B, 0x61, 1])];
  try { parts.push(await logoRaster()); parts.push(Uint8Array.from([0x0A])); } catch (e) { /* tanpa logo */ }
  parts.push(Uint8Array.from([0x1B, 0x61, 0]));
  parts.push(enc.encode(receiptLines(t).map(asc).join('\n') + '\n\n\n\n'));
  const total = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(total);
  let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
  return out;
}
const BLE_SERVICES = ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455', '0000fee7-0000-1000-8000-00805f9b34fb'];
let bleChar = null;
async function bleConnect() {
  if (!navigator.bluetooth) throw new Error('Web Bluetooth tidak didukung. Pakai Chrome di Android, atau pilih mode RawBT.');
  if (bleChar && bleChar.service.device.gatt.connected) return bleChar;
  const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BLE_SERVICES });
  const server = await dev.gatt.connect();
  for (const s of await server.getPrimaryServices()) {
    for (const c of await s.getCharacteristics()) {
      if (c.properties.write || c.properties.writeWithoutResponse) { bleChar = c; return c; }
    }
  }
  throw new Error('Printer ini tidak mendukung BLE untuk cetak. Coba mode RawBT.');
}
async function bleWrite(bytes) {
  const c = await bleConnect();
  for (let i = 0; i < bytes.length; i += 100) {
    const chunk = bytes.slice(i, i + 100);
    if (c.properties.writeWithoutResponse) await c.writeValueWithoutResponse(chunk); else await c.writeValue(chunk);
    await sleep(30);
  }
}
function printRawBT(bytes) {
  let bin = ''; for (let i = 0; i < bytes.length; i += 8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8000));
  window.location.href = 'rawbt:base64,' + btoa(bin);
}
async function printTrx(t) {
  t = t || lastTrx; if (!t) return;
  const mode = printerMode();
  try {
    if (mode === 'browser') return printBrowser(t);
    const bytes = await buildEscpos(t);
    if (mode === 'rawbt') return printRawBT(bytes);
    busy(1); await bleWrite(bytes); toast('Struk dicetak', 'ok');
  } catch (e) { toast(e.message || 'Gagal mencetak', 'err'); }
  finally { busy(0); }
}

/* ---------- Riwayat ---------- */
async function vRiwayat() {
  $('#main').innerHTML = `<div class="empty">${emo(8)}Memuat...</div>`;
  const from = dStr(new Date());
  const list = await run(() => api('trx_list', { from, to: from }));
  if (!list) return;
  state.hist = list;
  const body = list.map(t => {
    const r = [t.no, '#' + t.antrian, String(t.waktu).slice(11, 16), t.metode, t.member_nama || '-', rp(t.total), t.status === 'void' ? 'VOID' : 'Selesai',
      { h: `<button class="btn ghost sm" data-act="reprint" data-id="${t.id}">Nota</button> ${t.status !== 'void' ? `<button class="btn ghost sm" data-act="voidAsk" data-id="${t.id}">Void</button>` : ''}` }];
    r._cls = t.status === 'void' ? 'void' : ''; return r;
  });
  $('#main').innerHTML = `<div class="sec"><h2>Riwayat hari ini</h2></div>${table(['No', 'Antrian', 'Jam', 'Metode', 'Member', 'Total', 'Status', ''], body)}`;
}
const findTrx = id => state.hist.find(x => x.id === id) || (state.rep && state.rep.transaksi.find(x => x.id === id));
function voidAsk(id) {
  const t = findTrx(id); if (!t) return;
  modal(`<h3>Void ${esc(t.no)}</h3><p>Total ${rp(t.total)}. Stok${t.member_id ? ', poin member,' : ''}${t.kupon_kode ? ' dan kuota kupon' : ''} akan dikembalikan.</p>
    <label class="f">Alasan void (wajib)</label><input class="inp" id="valasan" maxlength="100">
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn danger" data-act="voidGo" data-id="${id}">Void transaksi</button></div>`);
}
async function voidGo(id) {
  const alasan = $('#valasan').value.trim();
  if (!alasan) return toast('Isi alasan void', 'err');
  const ok = await run(() => api('trx_void', { id, alasan }));
  if (!ok) return;
  closeModal(); toast('Transaksi di-void', 'ok');
  await run(loadAll);
  if (state.view === 'laporan') loadReport(); else render();
}

/* ---------- Shift ---------- */
function vShift() {
  const m = $('#main'), sh = state.shift, i = state.shiftInfo;
  if (!sh) { m.innerHTML = `<div class="card center">${emo(4, 'big')}<h2>Belum ada shift terbuka</h2><button class="btn big" data-act="nav" data-v="kasir">Buka di tab Kasir</button></div>`; return; }
  m.innerHTML = `<div class="card center" style="text-align:left"><h2>${emo(1)} Shift berjalan</h2>
    <div class="kv"><span>Dibuka</span><b>${esc(fmtWaktu(sh.buka))}</b></div>
    <div class="kv"><span>Kasir</span><b>${esc(sh.kasir)}</b></div>
    <div class="kv"><span>Modal awal</span><b>${rp(sh.modal)}</b></div>
    <div class="kv"><span>Transaksi</span><b>${num(i.jumlah)}</b></div>
    <div class="kv"><span>Penjualan tunai</span><b>${rp(i.tunai)}</b></div>
    <div class="kv"><span>Penjualan QRIS (kotor)</span><b>${rp(i.qris)}</b></div>
    <div class="kv hl"><span>Kas seharusnya di laci</span><b>${rp(i.diharapkan)}</b></div>
    <label class="f">Kas aktual di laci (hitung uang)</label>
    <input class="inp" id="kas_aktual" type="number" inputmode="numeric" placeholder="Rp">
    <div style="height:14px"></div><button class="btn big danger" data-act="closeShift">Tutup Shift</button></div>`;
}
async function doOpenShift() {
  const modalAwal = Number($('#modal_awal').value) || 0;
  const r = await run(() => api('shift_open', { modal: modalAwal }));
  if (!r) return;
  await run(loadAll); render();
}
async function doCloseShift() {
  const v = $('#kas_aktual').value;
  if (v === '') return toast('Isi kas aktual', 'err');
  const r = await run(() => api('shift_close', { kas_aktual: Number(v) }));
  if (!r) return;
  const s = r.shift;
  modal(`<div class="success">${emo(s.selisih === 0 ? 5 : 8)}<h3>Shift ditutup</h3></div>
    <div class="kv"><span>Kas seharusnya</span><b>${rp(s.kas_diharapkan)}</b></div>
    <div class="kv"><span>Kas aktual</span><b>${rp(s.kas_aktual)}</b></div>
    <div class="kv hl"><span>Selisih</span><b style="color:${s.selisih === 0 ? 'var(--ok)' : 'var(--err)'}">${rp(s.selisih)}</b></div>
    <div class="kv"><span>Penjualan tunai</span><b>${rp(r.ringkas.tunai)}</b></div>
    <div class="kv"><span>QRIS kotor / bersih</span><b>${rp(r.ringkas.qris)} / ${rp(r.ringkas.qris_bersih)}</b></div>
    <div class="row end"><button class="btn" data-act="afterClose">Selesai</button></div>`);
}

/* ---------- Form generik ---------- */
function fieldHtml(f, v) {
  const id = 'f_' + f.k;
  if (f.t === 'check') return `<label class="ck"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${esc(f.l)}</label>`;
  if (f.t === 'select') return `<label class="f">${esc(f.l)}</label><select class="inp" id="${id}">${f.o.map(o => `<option value="${esc(o[0])}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  const type = f.t === 'num' ? 'number' : f.t === 'pin' ? 'password' : f.t === 'date' ? 'date' : 'text';
  return `<label class="f">${esc(f.l)}</label><input class="inp" id="${id}" type="${type}" ${f.t === 'num' || f.t === 'pin' ? 'inputmode="numeric"' : ''} value="${esc(v == null ? '' : v)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
}
function formModal(title, sheet, fields, rec, pickAfter) {
  state.form = { sheet, fields, rec: rec || {}, pick: !!pickAfter };
  modal(`<h3>${esc(title)}</h3><div class="form">${fields.map(f => fieldHtml(f, state.form.rec[f.k])).join('')}</div>
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn" data-act="saveForm">Simpan</button></div>`);
}
async function saveForm() {
  const { sheet, fields, rec, pick: pickAfter } = state.form, vals = {};
  fields.forEach(f => {
    const el = $('#f_' + f.k);
    vals[f.k] = f.t === 'check' ? el.checked : f.t === 'num' ? Number(el.value) || 0 : el.value.trim();
  });
  const row = Object.assign({}, rec, vals);
  const call = sheet === '__user' ? () => api('user_save', { row })
    : sheet === '__member' ? () => api('member_save', { row })
    : sheet === '__pengeluaran' ? () => api('pengeluaran_save', { row })
    : () => api('save', { sheet, row });
  const r = await run(call);
  if (!r) return;
  closeModal(); toast('Tersimpan', 'ok');
  if (sheet === '__member') {
    const i = state.members.findIndex(x => x.id === r.id);
    if (i >= 0) state.members[i] = r; else state.members.push(r);
    if (pickAfter) state.member = r;
  } else if (sheet !== '__pengeluaran') await run(loadAll);
  render();
}
const F_MENU = [{ k: 'nama', l: 'Nama menu' }, { k: 'kategori', l: 'Kategori', ph: 'Minuman / Makanan' }, { k: 'harga', l: 'Harga (Rp)', t: 'num' },
  { k: 'lacak_stok', l: 'Lacak stok (produk jadi)', t: 'check' }, { k: 'stok', l: 'Stok saat ini', t: 'num' }, { k: 'stok_min', l: 'Stok minimum (peringatan)', t: 'num' }, { k: 'aktif', l: 'Aktif (tampil di kasir)', t: 'check' }];
const F_ADDON = [{ k: 'nama', l: 'Nama add-on' }, { k: 'harga', l: 'Harga tambahan (Rp)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }];
const fVarian = () => [{ k: 'menu_id', l: 'Untuk menu', t: 'select', o: state.menu.map(m => [m.id, m.nama]) }, { k: 'nama', l: 'Nama varian' },
  { k: 'selisih', l: 'Selisih harga (Rp, boleh minus)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }];
const F_KUPON = [{ k: 'kode', l: 'Kode kupon', ph: 'MERDEKA10' }, { k: 'nama', l: 'Keterangan', ph: 'Diskon 17 Agustus' },
  { k: 'tipe', l: 'Jenis diskon', t: 'select', o: [['persen', 'Persen (%)'], ['nominal', 'Nominal (Rp)']] }, { k: 'nilai', l: 'Nilai diskon', t: 'num' },
  { k: 'min_belanja', l: 'Minimal belanja (Rp)', t: 'num' }, { k: 'mulai', l: 'Berlaku mulai (kosong = langsung)', t: 'date' }, { k: 'selesai', l: 'Berlaku sampai (kosong = tanpa batas)', t: 'date' },
  { k: 'kuota', l: 'Kuota pemakaian (0 = tanpa batas)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }];
const F_MEMBER = [{ k: 'nama', l: 'Nama member' }, { k: 'wa', l: 'Nomor WhatsApp', ph: '08xxxxxxxxxx' }];
const F_MEMBER_EDIT = F_MEMBER.concat([{ k: 'poin', l: 'Saldo poin (koreksi owner)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }]);
const KAT_KELUAR = ['Bahan baku', 'Kemasan', 'Gas', 'Listrik', 'Upah', 'Sewa', 'Transportasi', 'Promosi', 'Lainnya'];
const F_KELUAR = [{ k: 'tanggal', l: 'Tanggal', t: 'date' }, { k: 'kategori', l: 'Kategori', t: 'select', o: KAT_KELUAR.map(k => [k, k]) },
  { k: 'keterangan', l: 'Keterangan', ph: 'Misal: LPG 3 kg' }, { k: 'jumlah', l: 'Jumlah (Rp)', t: 'num' }];
const F_USER = [{ k: 'nama', l: 'Nama' }, { k: 'role', l: 'Peran', t: 'select', o: [['kasir', 'Kasir'], ['owner', 'Owner']] },
  { k: 'pin', l: 'PIN (4-8 angka, kosongkan jika tidak diganti)', t: 'pin' }, { k: 'aktif', l: 'Aktif', t: 'check' }];

/* ---------- Member (halaman) ---------- */
function vMember() {
  $('#main').innerHTML = `<div class="sec"><h2>Member</h2><div class="row"><input class="inp" style="width:280px" data-in="memFilter" placeholder="Cari nama / nomor WA"><button class="btn" data-act="newMember">${ic('plus')} Member</button></div></div><div id="memTbl"></div>`;
  drawMemberTable('');
}
function drawMemberTable(q) {
  q = q.trim().toLowerCase();
  const owner = state.user.role === 'owner';
  const list = state.members.filter(m => (owner || m.aktif) && (!q || m.nama.toLowerCase().includes(q) || m.wa.includes(q.replace(/\D/g, '') || '###')));
  const body = list.map(m => [m.nama + (m.aktif ? '' : ' (nonaktif)'), m.wa, num(m.poin), rp(m.total_belanja), num(m.kunjungan), m.terakhir ? fmtWaktu(m.terakhir) : '-',
    { h: `<button class="btn ghost sm" data-act="waMember" data-id="${m.id}">${ic('send')} WA</button> ${owner ? `<button class="btn ghost sm" data-act="editMember" data-id="${m.id}">Ubah</button>` : ''}` }]);
  const el = $('#memTbl');
  if (el) el.innerHTML = table(['Nama', 'WhatsApp', 'Poin', 'Total belanja', 'Kunjungan', 'Terakhir beli', ''], body);
}

/* ---------- Menu ---------- */
async function vMenu() {
  const nm = id => (state.menu.find(m => m.id === id) || {}).nama || '-';
  const edit = (s, id) => ({ h: `<button class="btn ghost sm" data-act="editRec" data-s="${s}" data-id="${id}">Ubah</button>` });
  const ya = v => v === false ? 'Nonaktif' : 'Aktif';
  $('#main').innerHTML = `
    <div class="sec"><h2>Menu</h2><button class="btn" data-act="newRec" data-s="Menu">${ic('plus')} Menu</button></div>
    ${table(['Nama', 'Kategori', 'Harga', 'Stok', 'Status', ''], state.menu.map(m => [m.nama, m.kategori, rp(m.harga), m.lacak_stok === true ? num(m.stok) : '-', ya(m.aktif), edit('Menu', m.id)]))}
    <div class="sec"><h2>Varian</h2><button class="btn" data-act="newRec" data-s="Varian">${ic('plus')} Varian</button></div>
    ${table(['Menu', 'Varian', 'Selisih harga', 'Status', ''], state.varian.map(v => [nm(v.menu_id), v.nama, rp(v.selisih), ya(v.aktif), edit('Varian', v.id)]))}
    <div class="sec"><h2>Add-on</h2><button class="btn" data-act="newRec" data-s="Addon">${ic('plus')} Add-on</button></div>
    ${table(['Nama', 'Harga', 'Status', ''], state.addon.map(a => [a.nama, rp(a.harga), ya(a.aktif), edit('Addon', a.id)]))}
    <div class="sec"><h2>Kupon diskon</h2><button class="btn" data-act="newRec" data-s="Kupon">${ic('plus')} Kupon</button></div><div id="kuponTbl"><div class="empty">Memuat kupon...</div></div>`;
  const ks = await run(() => api('kupon_list'));
  if (!ks) return;
  state.kupons = ks;
  const el = $('#kuponTbl'); if (!el) return;
  el.innerHTML = table(['Kode', 'Keterangan', 'Diskon', 'Min. belanja', 'Periode', 'Terpakai', 'Status', ''], ks.map(k => [k.kode, k.nama, k.tipe === 'persen' ? k.nilai + '%' : rp(k.nilai), rp(k.min_belanja),
    (k.mulai || '...') + ' s/d ' + (k.selesai || '...'), k.terpakai + ' / ' + (k.kuota || '∞'), k.aktif ? 'Aktif' : 'Nonaktif', edit('Kupon', k.id)]));
}
function recFields(s) { return s === 'Menu' ? F_MENU : s === 'Addon' ? F_ADDON : s === 'Kupon' ? F_KUPON : fVarian(); }
function newRec(s) {
  if (s === 'Varian' && !state.menu.length) return toast('Tambah menu dulu', 'err');
  const rec = { aktif: true }; if (s === 'Varian') rec.menu_id = state.menu[0].id; if (s === 'Kupon') rec.tipe = 'persen';
  formModal('Tambah ' + (s === 'Addon' ? 'add-on' : s.toLowerCase()), s, recFields(s), rec);
}
function editRec(s, id) {
  const list = s === 'Menu' ? state.menu : s === 'Addon' ? state.addon : s === 'Kupon' ? state.kupons : state.varian;
  formModal('Ubah ' + (s === 'Addon' ? 'add-on' : s.toLowerCase()), s, recFields(s), list.find(x => x.id === id));
}

/* ---------- Pengeluaran ---------- */
function setPgBulan() { const n = new Date(); state.pgFrom = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`; state.pgTo = dStr(n); }
async function vPengeluaran() {
  if (!state.pgFrom) setPgBulan();
  $('#main').innerHTML = `<div class="empty">${emo(8)}Memuat...</div>`;
  const list = await run(() => api('pengeluaran_list', { from: state.pgFrom, to: state.pgTo }));
  if (!list) return;
  state.pg = list;
  const total = list.reduce((s, x) => s + x.jumlah, 0);
  const body = list.map(p => [p.tanggal, p.kategori, p.keterangan || '-', rp(p.jumlah), p.user || '-',
    { h: `<button class="btn ghost sm" data-act="editPg" data-id="${p.id}">Ubah</button> <button class="btn ghost sm" data-act="delPg" data-id="${p.id}">Hapus</button>` }]);
  $('#main').innerHTML = `<div class="sec"><h2>Pengeluaran</h2><div class="row">
    <input class="inp" style="width:160px" type="date" data-in="pgFrom" value="${state.pgFrom}"><input class="inp" style="width:160px" type="date" data-in="pgTo" value="${state.pgTo}">
    <button class="btn" data-act="newPg">${ic('plus')} Catat</button></div></div>
    ${table(['Tanggal', 'Kategori', 'Keterangan', 'Jumlah', 'Dicatat', ''], body, ['Total', '', '', rp(total), '', ''])}`;
}

/* ---------- Laporan ---------- */
function setPreset(p) {
  const n = new Date(); state.repPreset = p;
  if (p === 'hari') state.repFrom = state.repTo = dStr(n);
  if (p === '7') { const d = new Date(n); d.setDate(d.getDate() - 6); state.repFrom = dStr(d); state.repTo = dStr(n); }
  if (p === 'bulan') { state.repFrom = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`; state.repTo = dStr(n); }
}
async function loadReport() {
  const r = await run(() => api('report', { from: state.repFrom, to: state.repTo }));
  if (!r) return;
  state.rep = r; renderReport();
}
function vLaporan() { if (!state.repFrom) setPreset('hari'); loadReport(); }
function repTable(tab) {
  const r = state.rep, ok = r.transaksi.filter(t => t.status === 'selesai');
  if (tab === 'tunai') {
    const rows = ok.filter(t => t.metode === 'Tunai');
    return { name: 'laporan-tunai', head: ['No', 'Waktu', 'Kasir', 'Total'], body: rows.map(t => [t.no, fmtWaktu(t.waktu), t.kasir, rp(t.total)]), foot: ['Total', '', '', rp(r.tunai.total)] };
  }
  if (tab === 'qris') {
    const rows = ok.filter(t => t.metode === 'QRIS');
    return { name: 'laporan-qris', head: ['No', 'Waktu', 'Kasir', 'Kotor', 'MDR %', 'Potongan MDR', 'Diterima bersih'],
      body: rows.map(t => [t.no, fmtWaktu(t.waktu), t.kasir, rp(t.total), String(t.mdr_persen), rp(t.mdr_nominal), rp(t.bersih)]),
      foot: ['Total', '', '', rp(r.qris.kotor), '', rp(r.qris.mdr), rp(r.qris.bersih)] };
  }
  if (tab === 'produk') {
    const body = r.produk.map(p => [p.nama, p.varian || '-', num(p.qty), rp(p.total)]).concat(r.addon.map(a => ['+ ' + a.nama, 'add-on', num(a.qty), rp(a.total)]));
    return { name: 'laporan-produk', head: ['Produk', 'Varian', 'Qty', 'Penjualan (sebelum diskon)'], body };
  }
  if (tab === 'transaksi') {
    const body = r.transaksi.map(t => {
      const row = [t.no, fmtWaktu(t.waktu), t.kasir, t.metode, t.member_nama || '-', rp(t.total), t.status === 'void' ? 'VOID: ' + (t.void_alasan || '') : 'Selesai',
        { h: `<button class="btn ghost sm" data-act="reprint" data-id="${t.id}">Nota</button> ${t.status !== 'void' ? `<button class="btn ghost sm" data-act="voidAsk" data-id="${t.id}">Void</button>` : ''}` }];
      row._cls = t.status === 'void' ? 'void' : ''; return row;
    });
    return { name: 'laporan-transaksi', head: ['No', 'Waktu', 'Kasir', 'Metode', 'Member', 'Total', 'Status', ''], body };
  }
  return null;
}
function renderReport() {
  const r = state.rep, tabs = [['ringkasan', 'Ringkasan'], ['tunai', 'Tunai'], ['qris', 'QRIS'], ['produk', 'Produk'], ['transaksi', 'Transaksi']];
  const pre = [['hari', 'Hari ini'], ['7', '7 hari'], ['bulan', 'Bulan ini']];
  let content;
  if (state.repTab === 'ringkasan') {
    content = `<div class="cards">
      <div class="card"><span>Penjualan kotor</span><b>${rp(r.penjualan)}</b></div>
      <div class="card"><span>Diterima bersih (tunai + QRIS setelah MDR)</span><b>${rp(r.diterima_bersih)}</b></div>
      <div class="card"><span>Pengeluaran</span><b>${rp(r.pengeluaran)}</b></div>
      <div class="card hl-card"><span>Laba kas (diterima bersih - pengeluaran, sebelum HPP)</span><b>${rp(r.laba_kas)}</b></div>
      <div class="card"><span>Tunai (${num(r.tunai.jumlah)} trx)</span><b>${rp(r.tunai.total)}</b></div>
      <div class="card"><span>QRIS kotor (${num(r.qris.jumlah)} trx)</span><b>${rp(r.qris.kotor)}</b></div>
      <div class="card"><span>Potongan MDR QRIS</span><b>${rp(r.qris.mdr)}</b></div>
      <div class="card"><span>QRIS bersih</span><b>${rp(r.qris.bersih)}</b></div>
      <div class="card"><span>Total diskon</span><b>${rp(r.diskon)}</b></div>
      <div class="card"><span>Dari kupon / dari tukar poin</span><b>${rp(r.kupon)} / ${rp(r.poin)}</b></div>
      <div class="card"><span>Transaksi / void</span><b>${num(r.jumlah)} / ${num(r.void)}</b></div></div>
      <div class="sec"><h3>Per hari</h3></div>${table(['Tanggal', 'Transaksi', 'Penjualan'], r.hari.map(h => [h.tanggal, num(h.jumlah), rp(h.total)]))}
      <div class="sec"><h3>Jam ramai</h3></div>${table(['Jam', 'Transaksi', 'Penjualan'], r.jam.map(j => [pad(j.jam) + ':00', num(j.jumlah), rp(j.total)]))}`;
  } else {
    const t = repTable(state.repTab);
    content = `<div class="row end" style="margin:0 0 8px"><button class="btn ghost sm" data-act="exportRep">${ic('dl')} Ekspor CSV</button></div>${table(t.head, t.body, t.foot)}`;
  }
  $('#main').innerHTML = `<div class="sec"><h2>Laporan</h2>
    <div class="row"><div class="tabs" style="margin:0">${pre.map(p => `<button data-act="preset" data-v="${p[0]}" class="${state.repPreset === p[0] ? 'on' : ''}">${p[1]}</button>`).join('')}</div>
    <input class="inp" style="width:160px" type="date" data-in="repFrom" value="${state.repFrom}"><input class="inp" style="width:160px" type="date" data-in="repTo" value="${state.repTo}"></div></div>
    <div class="tabs">${tabs.map(t => `<button data-act="repTab" data-v="${t[0]}" class="${state.repTab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>${content}`;
}

/* ---------- Pengaturan ---------- */
async function vPengaturan() {
  const s = state.settings;
  const users = await run(() => api('users_list'));
  if (!users) return;
  state.tmpLogo = null;
  const inp = (k, l, extra) => `<label class="f">${l}</label><input class="inp" id="set_${k}" value="${esc(s[k] || '')}" ${extra || ''}>`;
  const numI = (k, l) => inp(k, l, 'type="number" inputmode="numeric"');
  $('#main').innerHTML = `<div class="sec"><h2>Pengaturan</h2></div>
    <div class="card"><h3>Usaha & struk</h3><div class="grid2"><div>
      ${inp('nama_usaha', 'Nama usaha')}${inp('alamat', 'Alamat (header struk)')}${inp('instagram', 'Instagram')}${inp('whatsapp', 'WhatsApp')}${inp('footer', 'Teks penutup struk')}
      ${inp('mdr_persen', 'MDR QRIS (%)', 'type="number" step="0.01" inputmode="decimal"')}
      <div class="hint">Perubahan MDR hanya berlaku untuk transaksi berikutnya.</div></div>
      <div><label class="f">Logo struk thermal (hitam-putih)</label><img id="logoPrev" class="logo-prev" src="${s.logo || 'logo.png'}">
      <div class="row" style="margin-top:8px"><input type="file" id="logoFile" accept="image/*" class="hide"><button class="btn ghost sm" data-act="pickLogo">Unggah logo lain</button></div>
      <div class="hint">Bawaan sudah memakai logo Soe Come To!. Nota gambar (WA) memakai logo biru berwarna.</div></div></div></div>
    <div class="card" style="margin-top:14px"><h3>${emo(5)} Program poin member</h3><div class="grid2"><div>
      <label class="f">Program poin</label><select class="inp" id="set_poin_aktif"><option value="1">Aktif</option><option value="0">Dimatikan</option></select>
      ${numI('poin_kelipatan', 'Tiap kelipatan belanja (Rp)')}${numI('poin_per', 'Dapat poin sebanyak')}</div><div>
      ${numI('poin_nilai', '1 poin bernilai (Rp) saat ditukar')}${numI('poin_min_tukar', 'Minimal poin sekali tukar')}
      <div class="hint" id="poinHint"></div></div></div>
      <div class="row end"><button class="btn" data-act="saveSet">Simpan pengaturan</button></div></div>
    <div class="sec"><h2>Printer</h2></div><div class="card"><label class="f">Cara cetak struk thermal 58 mm</label>
      <select class="inp" id="printer_mode"><option value="browser">Print browser / pratinjau</option><option value="ble">Bluetooth langsung (Chrome Android, printer BLE)</option><option value="rawbt">RawBT (printer Bluetooth klasik)</option></select>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="testPrint">${ic('print')} Cetak tes</button><button class="btn ghost" data-act="pairBle">Sambungkan printer BLE</button></div></div>
    <div class="sec"><h2>Pengguna</h2><button class="btn" data-act="newUser">${ic('plus')} Pengguna</button></div>
    ${table(['Nama', 'Peran', 'Status', ''], users.map(u => [u.nama, u.role, u.aktif ? 'Aktif' : 'Nonaktif', { h: `<button class="btn ghost sm" data-act="editUser" data-id="${u.id}">Ubah</button>` }]))}`;
  $('#printer_mode').value = printerMode();
  $('#set_poin_aktif').value = s.poin_aktif === '0' ? '0' : '1';
  poinHint();
  state.users = users;
}
function poinHint() {
  const g = k => Number(($('#set_' + k) || {}).value) || 0, el = $('#poinHint'); if (!el) return;
  el.textContent = `Contoh: belanja Rp${num(g('poin_kelipatan'))} dapat ${num(g('poin_per'))} poin. ${num(g('poin_min_tukar'))} poin = Rp${num(g('poin_min_tukar') * g('poin_nilai'))}.`;
}
async function processLogo(src) {
  const img = await loadImg(src), w = 256, h = Math.round(img.height * w / img.width);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
  const im = cx.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) < 180 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  cx.putImageData(im, 0, 0);
  state.tmpLogo = cv.toDataURL('image/png');
  $('#logoPrev').src = state.tmpLogo;
}
async function saveSettings() {
  const map = {};
  ['nama_usaha', 'alamat', 'instagram', 'whatsapp', 'footer', 'mdr_persen', 'poin_aktif', 'poin_kelipatan', 'poin_per', 'poin_nilai', 'poin_min_tukar'].forEach(k => map[k] = $('#set_' + k).value.trim());
  if (state.tmpLogo) map.logo = state.tmpLogo;
  const r = await run(() => api('settings_save', { map }));
  if (!r) return;
  state.settings = r; state.tmpLogo = null;
  localStorage.setItem('sc_printer', $('#printer_mode').value);
  toast('Pengaturan tersimpan', 'ok'); render();
}

const views = { beranda: vBeranda, kasir: vKasir, riwayat: vRiwayat, shift: vShift, member: vMember, menu: vMenu, pengeluaran: vPengeluaran, laporan: vLaporan, pengaturan: vPengaturan };

/* ---------- Event ---------- */
const actions = {
  pin: d => { if (pinBuf.length < 8) { pinBuf += d.v; drawDots(); } },
  pinDel: () => { pinBuf = pinBuf.slice(0, -1); drawDots(); },
  pinClear: () => { pinBuf = ''; drawDots(); },
  login: doLogin,
  logout,
  toggleSound: () => { localStorage.setItem('sc_sound', localStorage.getItem('sc_sound') === '0' ? '1' : '0'); ting(); render(); },
  fullscreen: () => { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); },
  nav: d => { state.view = d.v; render(); },
  closeModal: () => { state.opt = null; closeModal(); },
  cat: d => { state.cat = d.v; vKasir(); },
  pick: d => pick(d.id),
  qtyInc: d => { state.cart[d.i].qty++; vKasir(); },
  qtyDec: d => { const l = state.cart[d.i]; if (l.qty > 1) l.qty--; else state.cart.splice(d.i, 1); vKasir(); },
  delLine: d => { state.cart.splice(d.i, 1); vKasir(); },
  editLine: d => editLine(Number(d.i)),
  clearCart: () => { if (confirm('Kosongkan pesanan?')) { state.cart = []; vKasir(); } },
  optVar: d => { state.opt.varian_id = d.id; renderOpt(); },
  optAdd: d => { const a = state.opt.addon_ids, i = a.indexOf(d.id); if (i >= 0) a.splice(i, 1); else a.push(d.id); renderOpt(); },
  optQ: d => { const o = state.opt; o.qty = Math.max(1, o.qty + Number(d.v)); $('#oq').textContent = o.qty; $('#op').textContent = rp(optPrice() * o.qty); },
  optOk: optSave,
  holdAsk, holdSave, holdList, holdResume: d => holdResume(d.id),
  holdDel: d => { saveHolds(holds().filter(x => x.id !== d.id)); holdList(); },
  memberPick: e => { if (e && e.__x) return; openMemberPick(); },
  memberClear: () => { state.member = null; vKasir(); },
  setMember: d => { state.member = state.members.find(m => m.id === d.id) || null; closeModal(); vKasir(); },
  newMember: d => {
    const q = ($('#memq') || {}).value || '';
    formModal('Member baru', '__member', F_MEMBER, { wa: /^[\d+\s-]{6,}$/.test(q) ? q : '', nama: /^[\d+\s-]{6,}$/.test(q) ? '' : q }, !!d.pick);
  },
  editMember: d => formModal('Ubah member', '__member', F_MEMBER_EDIT, state.members.find(m => m.id === d.id)),
  waMember: d => { const m = state.members.find(x => x.id === d.id); if (m) window.open('https://wa.me/' + intl(m.wa), '_blank'); },
  openPay: () => { if (!state.cart.length) return; state.pay = { metode: 'Tunai', dtipe: 'nominal', dnilai: 0, bayar: 0, kupon: null, kuponKode: '', poin: 0 }; renderPay(); },
  setMetode: d => { state.pay.metode = d.v; renderPay(); },
  setDtipe: d => { state.pay.dtipe = d.v; renderPay(); },
  kuponCek,
  kuponDel: () => { state.pay.kupon = null; renderPay(); },
  poinMax: () => { state.pay.poin = payCalc().maxPoin; renderPay(); },
  quick: d => {
    const c = payCalc(); state.pay.bayar = d.v === 'pas' ? c.total : Number(d.v);
    $('#pbayar').value = state.pay.bayar; updPay();
  },
  doPay,
  printTrx: () => printTrx(),
  shareWA: () => shareReceipt(),
  dlReceipt: () => downloadReceipt(),
  reprint: d => { const t = findTrx(d.id); if (t) showReceipt(t, false); },
  voidAsk: d => voidAsk(d.id),
  voidGo: d => voidGo(d.id),
  openShift: doOpenShift,
  closeShift: () => { if (confirm('Tutup shift sekarang?')) doCloseShift(); },
  afterClose: async () => { closeModal(); state.cart = []; await run(loadAll); state.view = 'kasir'; render(); },
  newRec: d => newRec(d.s),
  editRec: d => editRec(d.s, d.id),
  newPg: () => formModal('Catat pengeluaran', '__pengeluaran', F_KELUAR, { tanggal: dStr(new Date()), kategori: KAT_KELUAR[0] }),
  editPg: d => formModal('Ubah pengeluaran', '__pengeluaran', F_KELUAR, state.pg.find(x => x.id === d.id)),
  delPg: async d => {
    if (!confirm('Hapus catatan pengeluaran ini?')) return;
    const ok = await run(() => api('pengeluaran_del', { id: d.id }));
    if (ok) { toast('Dihapus', 'ok'); vPengeluaran(); }
  },
  saveForm,
  preset: d => { setPreset(d.v); loadReport(); },
  repTab: d => { state.repTab = d.v; renderReport(); },
  exportRep: () => { const t = repTable(state.repTab); if (t) exportCSV(`${t.name}_${state.repFrom}_${state.repTo}.csv`, t.head, t.body, t.foot); },
  pickLogo: () => $('#logoFile').click(),
  saveSet: saveSettings,
  testPrint: () => {
    localStorage.setItem('sc_printer', $('#printer_mode').value);
    const n = new Date();
    printTrx({ no: 'SC-TEST', antrian: 0, waktu: dStr(n) + ' ' + pad(n.getHours()) + ':' + pad(n.getMinutes()), kasir: state.user.nama, metode: 'Tunai',
      items: [{ nama: 'Tes Cetak', varian: '', addons: [], catatan: '', qty: 1, harga: 10000, subtotal: 10000 }], subtotal: 10000, diskon: 0, total: 10000, bayar: 10000, kembali: 0, status: 'selesai' });
  },
  pairBle: () => run(async () => { await bleConnect(); toast('Printer tersambung', 'ok'); }),
  newUser: () => formModal('Tambah pengguna', '__user', F_USER, { role: 'kasir', aktif: true }),
  editUser: d => formModal('Ubah pengguna', '__user', F_USER, state.users.find(u => u.id === d.id))
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  // tombol "x" di chip member tidak ikut membuka pemilih member
  if (el.dataset.act === 'memberPick' && e.target.closest('[data-act="memberClear"]')) return actions.memberClear();
  const fn = actions[el.dataset.act];
  if (fn) fn(el.dataset);
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  const v = e.target.value;
  if (!k) { if (e.target.id && e.target.id.startsWith('set_poin')) poinHint(); return; }
  if (k === 'optNote') state.opt.catatan = v;
  if (k === 'dnilai') { state.pay.dnilai = Number(v) || 0; updPay(); }
  if (k === 'bayar') { state.pay.bayar = Number(v) || 0; updPay(); }
  if (k === 'poin') { state.pay.poin = Number(v) || 0; updPay(); }
  if (k === 'kuponKode') state.pay.kuponKode = v.toUpperCase();
  if (k === 'memSearch') drawMemPick(v);
  if (k === 'memFilter') drawMemberTable(v);
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (k === 'repFrom' || k === 'repTo') {
    state[k] = e.target.value; state.repPreset = '';
    if (state.repFrom && state.repTo && state.repFrom <= state.repTo) loadReport();
  }
  if (k === 'pgFrom' || k === 'pgTo') {
    state[k] = e.target.value;
    if (state.pgFrom && state.pgTo && state.pgFrom <= state.pgTo) vPengeluaran();
  }
  if (e.target.id === 'logoFile' && e.target.files[0]) {
    const fr = new FileReader();
    fr.onload = () => run(() => processLogo(fr.result));
    fr.readAsDataURL(e.target.files[0]);
  }
});
document.addEventListener('keydown', e => {
  if (!state.user && $('.login')) {
    if (/^\d$/.test(e.key) && pinBuf.length < 8) { pinBuf += e.key; drawDots(); }
    else if (e.key === 'Backspace') { pinBuf = pinBuf.slice(0, -1); drawDots(); }
    else if (e.key === 'Enter') doLogin();
  }
});

/* ---------- Start ---------- */
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
(async function init() {
  const saved = sessionStorage.getItem('sc_pin');
  if (!saved) return showLogin();
  state.pin = saved; busy(1);
  try { await loadAll(); state.view = state.user.role === 'owner' ? 'beranda' : 'kasir'; render(); }
  catch (e) { state.pin = null; showLogin(e.message); }
  finally { busy(0); }
})();
