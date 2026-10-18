'use strict';
/* POS SOE COME TO! - Front-end Fase 1 */

const $ = (s, r = document) => r.querySelector(s);
const num = n => Number(n || 0).toLocaleString('id-ID');
const rp = n => (Number(n) < 0 ? '-Rp' : 'Rp') + num(Math.abs(Number(n) || 0));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const state = {
  user: null, pin: null, settings: {}, menu: [], varian: [], addon: [], shift: null, shiftInfo: null,
  view: 'kasir', cart: [], cat: 'Semua', opt: null, pay: null, form: null,
  rep: null, repTab: 'ringkasan', repFrom: '', repTo: '', repPreset: 'hari', tmpLogo: null
};

/* ---------- Util ---------- */
function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(() => el.remove(), type === 'err' ? 4500 : 2200);
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
function modal(html, wide) {
  $('#modal').innerHTML = `<div class="mbox${wide ? ' wide' : ''}">${html}</div>`;
}
function closeModal() { $('#modal').innerHTML = ''; }
const dStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fmtWaktu(w) { const s = String(w); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)}`; }
function table(head, body, foot) {
  const cell = (c, th) => {
    const isH = c && typeof c === 'object';
    const v = isH ? c.h : esc(c);
    const right = !isH && /^(Rp|-Rp|-?\d[\d.,]*%?$)/.test(String(c));
    return `<${th ? 'th' : 'td'}${right ? ' class="r"' : ''}>${v}</${th ? 'th' : 'td'}>`;
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
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- Login ---------- */
let pinBuf = '';
function showLogin(msg) {
  pinBuf = '';
  $('#app').innerHTML = `<div class="login"><div class="login-box">
    <h1>Soe Come To!</h1><div class="muted">Masukkan PIN</div>
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
    state.view = 'kasir';
    render();
  } catch (e) {
    state.pin = null; state.user = null;
    showLogin(e.message);
  } finally { busy(0); }
}
async function loadAll() {
  const d = await api('bootstrap');
  state.user = d.user;
  Object.assign(state, { settings: d.settings, menu: d.menu, varian: d.varian, addon: d.addon, shift: d.shift, shiftInfo: d.shiftInfo });
}
function logout() {
  sessionStorage.removeItem('sc_pin');
  Object.assign(state, { pin: null, user: null, cart: [], rep: null });
  showLogin();
}

/* ---------- Shell ---------- */
function render() {
  const u = state.user;
  const tabs = [['kasir', 'Kasir'], ['riwayat', 'Riwayat'], ['shift', 'Shift']];
  if (u.role === 'owner') tabs.push(['menu', 'Menu'], ['laporan', 'Laporan'], ['pengaturan', 'Pengaturan']);
  $('#app').innerHTML = `<header class="top"><div class="brand">${esc(state.settings.nama_usaha || 'Soe Come To!')}</div>
    <nav>${tabs.map(t => `<button data-act="nav" data-v="${t[0]}" class="${state.view === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</nav>
    <div class="who">${esc(u.nama)}<button data-act="logout">Keluar</button></div></header><main id="main"></main>`;
  (views[state.view] || views.kasir)();
}

/* ---------- Kasir ---------- */
const cartSub = () => state.cart.reduce((s, l) => s + l.harga * l.qty, 0);
function activeVarian(mid) { return state.varian.filter(v => v.menu_id === mid && v.aktif !== false); }
function activeAddon() { return state.addon.filter(a => a.aktif !== false); }

function vKasir() {
  const m = $('#main');
  if (!state.shift) {
    m.innerHTML = `<div class="card center"><h2>Shift belum dibuka</h2><p class="muted">Masukkan modal awal kas laci.</p>
      <input class="inp" id="modal_awal" type="number" inputmode="numeric" placeholder="Modal awal (Rp)" value="0">
      <div style="height:12px"></div><button class="btn big" data-act="openShift">Buka Shift</button></div>`;
    return;
  }
  const menus = state.menu.filter(x => x.aktif !== false);
  const cats = ['Semua'].concat([...new Set(menus.map(x => x.kategori || 'Lainnya'))]);
  const list = menus.filter(x => state.cat === 'Semua' || (x.kategori || 'Lainnya') === state.cat);
  const tiles = list.map(x => {
    const vs = activeVarian(x.id);
    const habis = x.lacak_stok === true && Number(x.stok) <= 0;
    const noPrice = Number(x.harga) <= 0;
    return `<button class="tile${habis || noPrice ? ' off' : ''}" data-act="pick" data-id="${x.id}">
      <div><b>${esc(x.nama)}</b>${vs.length ? `<div class="badge">${vs.length} varian</div>` : ''}
      ${x.lacak_stok === true ? `<div class="badge${Number(x.stok) <= Number(x.stok_min) ? ' w' : ''}">Stok ${num(x.stok)}</div>` : ''}</div>
      <div class="p">${noPrice ? '<span class="badge w">Harga belum diisi</span>' : rp(x.harga)}</div></button>`;
  }).join('');
  const lines = state.cart.map((l, i) => `<div class="line"><div class="row sb"><div>
      <div class="nm">${esc(l.nama)}${l.varian ? ' (' + esc(l.varian) + ')' : ''}</div>
      ${l.addons.length ? `<div class="dt">+ ${l.addons.map(a => esc(a.nama)).join(', ')}</div>` : ''}
      ${l.catatan ? `<div class="dt">Catatan: ${esc(l.catatan)}</div>` : ''}</div>
      <b>${rp(l.harga * l.qty)}</b></div>
      <div class="ctl"><div class="qty"><button data-act="qtyDec" data-i="${i}">&minus;</button><span>${l.qty}</span><button data-act="qtyInc" data-i="${i}">+</button></div>
      <button class="btn ghost sm" data-act="editLine" data-i="${i}">Ubah</button>
      <button class="btn ghost sm" data-act="delLine" data-i="${i}">Hapus</button></div></div>`).join('');
  m.innerHTML = `<div class="pos"><section class="catalog">
      <div class="cats">${cats.map(c => `<button data-act="cat" data-v="${esc(c)}" class="${state.cat === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
      <div class="grid">${tiles || '<div class="empty">Belum ada menu. Tambah lewat tab Menu.</div>'}</div></section>
    <aside class="cart"><h3>Pesanan</h3><div class="lines">${lines || '<div class="empty">Ketuk menu untuk menambah</div>'}</div>
      <div class="sum"><div class="tot"><span>Subtotal</span><span>${rp(cartSub())}</span></div>
      <div class="row"><button class="btn ghost" data-act="clearCart" ${state.cart.length ? '' : 'disabled'}>Kosongkan</button>
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
  modal(`<h3>${esc(o.menu.nama)}</h3>
    ${vs.length ? `<label class="f">Varian</label><div class="chips">${vs.map(v => `<button class="chip${o.varian_id === v.id ? ' on' : ''}" data-act="optVar" data-id="${v.id}">${esc(v.nama)}${Number(v.selisih) ? ' (' + (v.selisih > 0 ? '+' : '') + num(v.selisih) + ')' : ''}</button>`).join('')}</div>` : ''}
    ${ads.length ? `<label class="f">Add-on</label><div class="chips">${ads.map(a => `<button class="chip${o.addon_ids.includes(a.id) ? ' on' : ''}" data-act="optAdd" data-id="${a.id}">${esc(a.nama)}${Number(a.harga) ? ' (+' + num(a.harga) + ')' : ''}</button>`).join('')}</div>` : ''}
    <label class="f">Catatan</label><input class="inp" data-in="optNote" value="${esc(o.catatan)}" maxlength="100" placeholder="Misal: tanpa keju, pedas">
    <div class="row sb" style="margin-top:14px"><div class="qty"><button data-act="optQ" data-v="-1">&minus;</button><span id="oq">${o.qty}</span><button data-act="optQ" data-v="1">+</button></div>
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

/* ---------- Pembayaran ---------- */
function payCalc() {
  const p = state.pay, sub = cartSub();
  let d = p.dtipe === 'persen' ? Math.round(sub * Math.min(100, Math.max(0, p.dnilai)) / 100) : Math.max(0, p.dnilai);
  d = Math.min(d, sub);
  const total = sub - d, mdrp = Number(state.settings.mdr_persen) || 0;
  return { sub, d, total, mdrp, mdr: p.metode === 'QRIS' ? Math.round(total * mdrp / 100) : 0, kembali: p.bayar - total };
}
function renderPay() {
  const p = state.pay, c = payCalc();
  modal(`<h3>Pembayaran</h3>
    <div class="kv"><span>Subtotal</span><b>${rp(c.sub)}</b></div>
    <label class="f">Diskon</label>
    <div class="row"><div class="seg" style="width:190px"><button class="${p.dtipe === 'nominal' ? 'on' : ''}" data-act="setDtipe" data-v="nominal">Rp</button><button class="${p.dtipe === 'persen' ? 'on' : ''}" data-act="setDtipe" data-v="persen">%</button></div>
    <input class="inp" style="flex:1" type="number" inputmode="numeric" data-in="dnilai" value="${p.dnilai || ''}" placeholder="0"></div>
    <div class="kv" style="margin-top:10px"><span>Total bayar</span><span class="big-n" id="ptotal">${rp(c.total)}</span></div>
    <label class="f">Metode</label>
    <div class="seg"><button class="${p.metode === 'Tunai' ? 'on' : ''}" data-act="setMetode" data-v="Tunai">Tunai</button><button class="${p.metode === 'QRIS' ? 'on' : ''}" data-act="setMetode" data-v="QRIS">QRIS</button></div>
    ${p.metode === 'Tunai' ? `<label class="f">Uang diterima</label>
      <input class="inp" id="pbayar" type="number" inputmode="numeric" data-in="bayar" value="${p.bayar || ''}" placeholder="0">
      <div class="chips" style="margin-top:8px"><button class="chip" data-act="quick" data-v="pas">Uang pas</button>${[5000, 10000, 20000, 50000, 100000].map(n => `<button class="chip" data-act="quick" data-v="${n}">${num(n)}</button>`).join('')}</div>
      <div class="kv"><span>Kembalian</span><b id="pkembali">${c.kembali >= 0 ? rp(c.kembali) : 'Kurang ' + rp(-c.kembali)}</b></div>`
    : `<p class="muted">Pastikan pembayaran QRIS pelanggan sudah masuk sebelum memproses.</p>`}
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button>
    <button class="btn" id="pgo" data-act="doPay" ${p.metode === 'Tunai' && c.kembali < 0 ? 'disabled' : ''}>Proses</button></div>`);
}
function updPay() {
  const c = payCalc(), p = state.pay;
  $('#ptotal').textContent = rp(c.total);
  const k = $('#pkembali'); if (k) k.textContent = c.kembali >= 0 ? rp(c.kembali) : 'Kurang ' + rp(-c.kembali);
  $('#pgo').toggleAttribute('disabled', p.metode === 'Tunai' && c.kembali < 0);
}
async function doPay() {
  const p = state.pay;
  const r = await run(() => api('trx_create', {
    items: state.cart.map(l => ({ menu_id: l.menu_id, varian_id: l.varian_id, addon_ids: l.addon_ids, catatan: l.catatan, qty: l.qty })),
    diskon: { tipe: p.dtipe, nilai: p.dnilai }, metode: p.metode, bayar: p.bayar
  }));
  if (!r) return;
  Object.keys(r.stok).forEach(id => { const m = state.menu.find(x => x.id === id); if (m) m.stok = r.stok[id]; });
  state.cart = []; state.pay = null;
  showReceipt(r.trx, true);
  vKasir();
}

/* ---------- Struk ---------- */
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
  if (!s.logo && s.nama_usaha) L.push(c(s.nama_usaha));
  wrap(s.alamat || '', W).forEach(l => L.push(c(l)));
  L.push(sep);
  L.push(lr('No', t.no)); L.push(lr('Waktu', fmtWaktu(t.waktu))); L.push(lr('Kasir', t.kasir));
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
  if (Number(t.diskon) > 0) { L.push(lr('Subtotal', num(t.subtotal))); L.push(lr('Diskon', '-' + num(t.diskon))); }
  L.push(lr('TOTAL', num(t.total)));
  L.push(lr('Bayar (' + t.metode + ')', num(t.bayar)));
  if (t.metode === 'Tunai') L.push(lr('Kembali', num(t.kembali)));
  L.push(sep);
  if (s.instagram) L.push(c('IG ' + s.instagram));
  if (s.whatsapp) L.push(c('WA ' + s.whatsapp));
  wrap(s.footer || '', W).forEach(l => L.push(c(l)));
  return L;
}
function receiptHtml(t) {
  return `<div class="receipt">${state.settings.logo ? `<img src="${state.settings.logo}" alt="logo">` : ''}<pre>${esc(receiptLines(t).join('\n'))}</pre></div>`;
}
let lastTrx = null;
function showReceipt(t, fresh) {
  lastTrx = t;
  modal(`<h3>${fresh ? 'Transaksi berhasil' : 'Struk ' + esc(t.no)}</h3>
    ${t.metode === 'Tunai' && fresh ? `<div class="kv"><span>Kembalian</span><span class="big-n">${rp(t.kembali)}</span></div>` : ''}
    ${receiptHtml(t)}
    <div class="row end"><button class="btn ghost" data-act="shareWA">WhatsApp</button>
    <button class="btn" data-act="printTrx">Cetak</button><button class="btn ghost" data-act="closeModal">${fresh ? 'Transaksi baru' : 'Tutup'}</button></div>`);
}

/* ---------- Cetak: browser / Bluetooth / RawBT ---------- */
const printerMode = () => localStorage.getItem('sc_printer') || 'browser';
function printBrowser(t) {
  $('#printArea').innerHTML = (state.settings.logo ? `<img src="${state.settings.logo}">` : '') + `<pre>${esc(receiptLines(t).join('\n'))}</pre>`;
  window.print();
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
async function logoRaster() {
  const src = state.settings.logo; if (!src) return null;
  const img = await loadImg(src), w = 256, h = Math.round(img.height * w / img.width);
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
  const logo = await logoRaster();
  if (logo) { parts.push(logo); parts.push(Uint8Array.from([0x0A])); }
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
function shareWA(t) {
  t = t || lastTrx; if (!t) return;
  window.open('https://wa.me/?text=' + encodeURIComponent(receiptLines(t).join('\n')), '_blank');
}

/* ---------- Riwayat ---------- */
async function vRiwayat() {
  $('#main').innerHTML = '<div class="empty">Memuat...</div>';
  const from = dStr(new Date());
  const list = await run(() => api('trx_list', { from, to: from }));
  if (!list) return;
  state.hist = list;
  const body = list.map(t => {
    const r = [t.no, '#' + t.antrian, String(t.waktu).slice(11, 16), t.metode, rp(t.total), t.status === 'void' ? 'VOID' : 'Selesai',
      { h: `<button class="btn ghost sm" data-act="reprint" data-id="${t.id}">Struk</button> ${t.status !== 'void' ? `<button class="btn ghost sm" data-act="voidAsk" data-id="${t.id}">Void</button>` : ''}` }];
    r._cls = t.status === 'void' ? 'void' : ''; return r;
  });
  $('#main').innerHTML = `<h2>Riwayat hari ini</h2>${table(['No', 'Antrian', 'Jam', 'Metode', 'Total', 'Status', ''], body)}`;
}
function voidAsk(id) {
  const t = state.hist.find(x => x.id === id) || (state.rep && state.rep.transaksi.find(x => x.id === id)); if (!t) return;
  modal(`<h3>Void ${esc(t.no)}</h3><p>Total ${rp(t.total)}. Stok akan dikembalikan.</p>
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
  if (!sh) { m.innerHTML = `<div class="card center"><h2>Belum ada shift terbuka</h2><button class="btn big" data-act="nav" data-v="kasir">Buka di tab Kasir</button></div>`; return; }
  m.innerHTML = `<div class="card center" style="text-align:left"><h2>Shift berjalan</h2>
    <div class="kv"><span>Dibuka</span><b>${esc(fmtWaktu(sh.buka))}</b></div>
    <div class="kv"><span>Kasir</span><b>${esc(sh.kasir)}</b></div>
    <div class="kv"><span>Modal awal</span><b>${rp(sh.modal)}</b></div>
    <div class="kv"><span>Transaksi</span><b>${num(i.jumlah)}</b></div>
    <div class="kv"><span>Penjualan tunai</span><b>${rp(i.tunai)}</b></div>
    <div class="kv"><span>Penjualan QRIS (kotor)</span><b>${rp(i.qris)}</b></div>
    <div class="kv"><span>Kas seharusnya di laci</span><b>${rp(i.diharapkan)}</b></div>
    <label class="f">Kas aktual di laci (hitung uang)</label>
    <input class="inp" id="kas_aktual" type="number" inputmode="numeric" placeholder="Rp">
    <div style="height:12px"></div><button class="btn big danger" data-act="closeShift">Tutup Shift</button></div>`;
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
  modal(`<h3>Shift ditutup</h3>
    <div class="kv"><span>Kas seharusnya</span><b>${rp(s.kas_diharapkan)}</b></div>
    <div class="kv"><span>Kas aktual</span><b>${rp(s.kas_aktual)}</b></div>
    <div class="kv"><span>Selisih</span><b style="color:${s.selisih === 0 ? 'var(--ok)' : 'var(--err)'}">${rp(s.selisih)}</b></div>
    <div class="kv"><span>Penjualan tunai</span><b>${rp(r.ringkas.tunai)}</b></div>
    <div class="kv"><span>QRIS kotor / bersih</span><b>${rp(r.ringkas.qris)} / ${rp(r.ringkas.qris_bersih)}</b></div>
    <div class="row end"><button class="btn" data-act="afterClose">Selesai</button></div>`);
}

/* ---------- Form generik (Menu / Varian / Add-on / Pengguna) ---------- */
function fieldHtml(f, v) {
  const id = 'f_' + f.k;
  if (f.t === 'check') return `<label class="ck"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${esc(f.l)}</label>`;
  if (f.t === 'select') return `<label class="f">${esc(f.l)}</label><select class="inp" id="${id}">${f.o.map(o => `<option value="${esc(o[0])}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  return `<label class="f">${esc(f.l)}</label><input class="inp" id="${id}" type="${f.t === 'num' ? 'number' : f.t === 'pin' ? 'password' : 'text'}" ${f.t === 'num' || f.t === 'pin' ? 'inputmode="numeric"' : ''} value="${esc(v == null ? '' : v)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
}
function formModal(title, sheet, fields, rec) {
  state.form = { sheet, fields, rec: rec || {} };
  modal(`<h3>${esc(title)}</h3><div class="form">${fields.map(f => fieldHtml(f, state.form.rec[f.k])).join('')}</div>
    <div class="row end"><button class="btn ghost" data-act="closeModal">Batal</button><button class="btn" data-act="saveForm">Simpan</button></div>`);
}
async function saveForm() {
  const { sheet, fields, rec } = state.form, vals = {};
  fields.forEach(f => {
    const el = $('#f_' + f.k);
    vals[f.k] = f.t === 'check' ? el.checked : f.t === 'num' ? Number(el.value) || 0 : el.value.trim();
  });
  const ok = await run(() => sheet === '__user'
    ? api('user_save', { row: Object.assign({ id: rec.id }, vals) })
    : api('save', { sheet, row: Object.assign({}, rec, vals) }));
  if (!ok) return;
  closeModal(); toast('Tersimpan', 'ok');
  await run(loadAll);
  render();
}
const F_MENU = [{ k: 'nama', l: 'Nama menu' }, { k: 'kategori', l: 'Kategori', ph: 'Minuman / Makanan' }, { k: 'harga', l: 'Harga (Rp)', t: 'num' },
  { k: 'lacak_stok', l: 'Lacak stok (produk jadi)', t: 'check' }, { k: 'stok', l: 'Stok saat ini', t: 'num' }, { k: 'stok_min', l: 'Stok minimum (peringatan)', t: 'num' }, { k: 'aktif', l: 'Aktif (tampil di kasir)', t: 'check' }];
const F_ADDON = [{ k: 'nama', l: 'Nama add-on' }, { k: 'harga', l: 'Harga tambahan (Rp)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }];
const fVarian = () => [{ k: 'menu_id', l: 'Untuk menu', t: 'select', o: state.menu.map(m => [m.id, m.nama]) }, { k: 'nama', l: 'Nama varian' },
  { k: 'selisih', l: 'Selisih harga (Rp, boleh minus)', t: 'num' }, { k: 'aktif', l: 'Aktif', t: 'check' }];

/* ---------- Menu ---------- */
function vMenu() {
  const nm = id => (state.menu.find(m => m.id === id) || {}).nama || '-';
  const edit = (s, id) => ({ h: `<button class="btn ghost sm" data-act="editRec" data-s="${s}" data-id="${id}">Ubah</button>` });
  const ya = v => v === false ? 'Nonaktif' : 'Aktif';
  $('#main').innerHTML = `
    <div class="sec"><h2>Menu</h2><button class="btn" data-act="newRec" data-s="Menu">+ Menu</button></div>
    ${table(['Nama', 'Kategori', 'Harga', 'Stok', 'Status', ''], state.menu.map(m => [m.nama, m.kategori, rp(m.harga), m.lacak_stok === true ? num(m.stok) : '-', ya(m.aktif), edit('Menu', m.id)]))}
    <div class="sec"><h2>Varian</h2><button class="btn" data-act="newRec" data-s="Varian">+ Varian</button></div>
    ${table(['Menu', 'Varian', 'Selisih harga', 'Status', ''], state.varian.map(v => [nm(v.menu_id), v.nama, rp(v.selisih), ya(v.aktif), edit('Varian', v.id)]))}
    <div class="sec"><h2>Add-on</h2><button class="btn" data-act="newRec" data-s="Addon">+ Add-on</button></div>
    ${table(['Nama', 'Harga', 'Status', ''], state.addon.map(a => [a.nama, rp(a.harga), ya(a.aktif), edit('Addon', a.id)]))}`;
}
function recFields(s) { return s === 'Menu' ? F_MENU : s === 'Addon' ? F_ADDON : fVarian(); }
function newRec(s) {
  if (s === 'Varian' && !state.menu.length) return toast('Tambah menu dulu', 'err');
  const rec = { aktif: true }; if (s === 'Varian') rec.menu_id = state.menu[0].id;
  formModal('Tambah ' + s, s, recFields(s), rec);
}
function editRec(s, id) {
  const list = s === 'Menu' ? state.menu : s === 'Addon' ? state.addon : state.varian;
  formModal('Ubah ' + s, s, recFields(s), list.find(x => x.id === id));
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
function vLaporan() {
  if (!state.repFrom) setPreset('hari');
  loadReport();
}
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
      const row = [t.no, fmtWaktu(t.waktu), t.kasir, t.metode, rp(t.total), t.status === 'void' ? 'VOID: ' + (t.void_alasan || '') : 'Selesai',
        { h: `<button class="btn ghost sm" data-act="reprint" data-id="${t.id}">Struk</button> ${t.status !== 'void' ? `<button class="btn ghost sm" data-act="voidAsk" data-id="${t.id}">Void</button>` : ''}` }];
      row._cls = t.status === 'void' ? 'void' : ''; return row;
    });
    return { name: 'laporan-transaksi', head: ['No', 'Waktu', 'Kasir', 'Metode', 'Total', 'Status', ''], body };
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
      <div class="card"><span>Tunai (${num(r.tunai.jumlah)} trx)</span><b>${rp(r.tunai.total)}</b></div>
      <div class="card"><span>QRIS kotor (${num(r.qris.jumlah)} trx)</span><b>${rp(r.qris.kotor)}</b></div>
      <div class="card"><span>Potongan MDR QRIS</span><b>${rp(r.qris.mdr)}</b></div>
      <div class="card"><span>QRIS bersih</span><b>${rp(r.qris.bersih)}</b></div>
      <div class="card"><span>Diskon diberikan</span><b>${rp(r.diskon)}</b></div>
      <div class="card"><span>Transaksi / void</span><b>${num(r.jumlah)} / ${num(r.void)}</b></div></div>
      <div class="sec"><h3>Per hari</h3></div>${table(['Tanggal', 'Transaksi', 'Penjualan'], r.hari.map(h => [h.tanggal, num(h.jumlah), rp(h.total)]))}
      <div class="sec"><h3>Jam ramai</h3></div>${table(['Jam', 'Transaksi', 'Penjualan'], r.jam.map(j => [pad(j.jam) + ':00', num(j.jumlah), rp(j.total)]))}`;
  } else {
    const t = repTable(state.repTab);
    content = `<div class="row end" style="margin:0 0 8px"><button class="btn ghost sm" data-act="exportRep">Ekspor CSV</button></div>${table(t.head, t.body, t.foot)}`;
  }
  $('#main').innerHTML = `<div class="row sb"><h2>Laporan</h2>
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
  $('#main').innerHTML = `<h2>Pengaturan</h2><div class="card"><div class="grid2"><div>
      ${inp('nama_usaha', 'Nama usaha')}${inp('alamat', 'Alamat (header struk)')}${inp('instagram', 'Instagram')}${inp('whatsapp', 'WhatsApp')}${inp('footer', 'Teks penutup struk')}
      ${inp('mdr_persen', 'MDR QRIS (%)', 'type="number" step="0.01" inputmode="decimal"')}
      <div class="muted" style="font-size:.85rem;margin-top:4px">Perubahan MDR hanya berlaku untuk transaksi berikutnya.</div></div>
      <div><label class="f">Logo struk</label><img id="logoPrev" class="logo-prev" src="${s.logo || ''}" ${s.logo ? '' : 'style="display:none"'}>
      <div class="row" style="margin-top:8px"><input type="file" id="logoFile" accept="image/*" class="hide"><button class="btn ghost sm" data-act="pickLogo">Unggah logo</button><button class="btn ghost sm" data-act="defLogo">Pakai logo.png bawaan</button></div>
      <div class="muted" style="font-size:.85rem;margin-top:4px">Otomatis diubah hitam-putih agar terbaca di printer thermal.</div></div></div>
      <div class="row end"><button class="btn" data-act="saveSet">Simpan pengaturan</button></div></div>
    <div class="sec"><h2>Printer</h2></div><div class="card"><label class="f">Cara cetak</label>
      <select class="inp" id="printer_mode"><option value="browser">Print browser / pratinjau</option><option value="ble">Bluetooth langsung (Chrome Android, printer BLE)</option><option value="rawbt">RawBT (printer Bluetooth klasik)</option></select>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="testPrint">Cetak tes</button><button class="btn ghost" data-act="pairBle">Sambungkan printer BLE</button></div></div>
    <div class="sec"><h2>Pengguna</h2><button class="btn" data-act="newUser">+ Pengguna</button></div>
    ${table(['Nama', 'Peran', 'Status', ''], users.map(u => [u.nama, u.role, u.aktif ? 'Aktif' : 'Nonaktif', { h: `<button class="btn ghost sm" data-act="editUser" data-id="${u.id}">Ubah</button>` }]))}`;
  $('#printer_mode').value = printerMode();
  state.users = users;
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
  const p = $('#logoPrev'); p.src = state.tmpLogo; p.style.display = '';
}
async function saveSettings() {
  const map = {};
  ['nama_usaha', 'alamat', 'instagram', 'whatsapp', 'footer', 'mdr_persen'].forEach(k => map[k] = $('#set_' + k).value.trim());
  if (state.tmpLogo) map.logo = state.tmpLogo;
  const r = await run(() => api('settings_save', { map }));
  if (!r) return;
  state.settings = r; state.tmpLogo = null;
  localStorage.setItem('sc_printer', $('#printer_mode').value);
  toast('Pengaturan tersimpan', 'ok'); render();
}
const F_USER = [{ k: 'nama', l: 'Nama' }, { k: 'role', l: 'Peran', t: 'select', o: [['kasir', 'Kasir'], ['owner', 'Owner']] },
  { k: 'pin', l: 'PIN (4-8 angka, kosongkan jika tidak diganti)', t: 'pin' }, { k: 'aktif', l: 'Aktif', t: 'check' }];

const views = { kasir: vKasir, riwayat: vRiwayat, shift: vShift, menu: vMenu, laporan: vLaporan, pengaturan: vPengaturan };

/* ---------- Event ---------- */
const actions = {
  pin: d => { if (pinBuf.length < 8) { pinBuf += d.v; drawDots(); } },
  pinDel: () => { pinBuf = pinBuf.slice(0, -1); drawDots(); },
  pinClear: () => { pinBuf = ''; drawDots(); },
  login: doLogin,
  logout,
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
  openPay: () => { if (!state.cart.length) return; state.pay = { metode: 'Tunai', dtipe: 'nominal', dnilai: 0, bayar: 0 }; renderPay(); },
  setMetode: d => { state.pay.metode = d.v; renderPay(); },
  setDtipe: d => { state.pay.dtipe = d.v; renderPay(); },
  quick: d => {
    const c = payCalc(); state.pay.bayar = d.v === 'pas' ? c.total : Number(d.v);
    $('#pbayar').value = state.pay.bayar; updPay();
  },
  doPay,
  printTrx: () => printTrx(),
  shareWA: () => shareWA(),
  reprint: d => {
    const t = state.hist.find(x => x.id === d.id) || (state.rep && state.rep.transaksi.find(x => x.id === d.id));
    if (t) showReceipt(t, false);
  },
  voidAsk: d => voidAsk(d.id),
  voidGo: d => voidGo(d.id),
  openShift: doOpenShift,
  closeShift: () => { if (confirm('Tutup shift sekarang?')) doCloseShift(); },
  afterClose: async () => { closeModal(); state.cart = []; await run(loadAll); state.view = 'kasir'; render(); },
  newRec: d => newRec(d.s),
  editRec: d => editRec(d.s, d.id),
  saveForm,
  preset: d => { setPreset(d.v); loadReport(); },
  repTab: d => { state.repTab = d.v; renderReport(); },
  exportRep: () => {
    const t = repTable(state.repTab); if (t) exportCSV(`${t.name}_${state.repFrom}_${state.repTo}.csv`, t.head, t.body, t.foot);
  },
  pickLogo: () => $('#logoFile').click(),
  defLogo: () => run(() => processLogo('logo.png')),
  saveSet: saveSettings,
  testPrint: () => {
    localStorage.setItem('sc_printer', $('#printer_mode').value);
    printTrx({ no: 'SC-TEST', antrian: 0, waktu: dStr(new Date()) + ' ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()), kasir: state.user.nama, metode: 'Tunai',
      items: [{ nama: 'Tes Cetak', varian: '', addons: [], catatan: '', qty: 1, harga: 10000, subtotal: 10000 }], subtotal: 10000, diskon: 0, total: 10000, bayar: 10000, kembali: 0, status: 'selesai' });
  },
  pairBle: () => run(async () => { await bleConnect(); toast('Printer tersambung', 'ok'); }),
  newUser: () => formModal('Tambah pengguna', '__user', F_USER, { role: 'kasir', aktif: true }),
  editUser: d => formModal('Ubah pengguna', '__user', F_USER, state.users.find(u => u.id === d.id))
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el.dataset);
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (!k) return;
  const v = e.target.value;
  if (k === 'optNote') state.opt.catatan = v;
  if (k === 'dnilai') { state.pay.dnilai = Number(v) || 0; updPay(); }
  if (k === 'bayar') { state.pay.bayar = Number(v) || 0; updPay(); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (k === 'repFrom' || k === 'repTo') {
    state[k] = e.target.value; state.repPreset = '';
    if (state.repFrom && state.repTo && state.repFrom <= state.repTo) loadReport();
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
(async function init() {
  const saved = sessionStorage.getItem('sc_pin');
  if (!saved) return showLogin();
  state.pin = saved; busy(1);
  try { await loadAll(); render(); }
  catch (e) { state.pin = null; showLogin(e.message); }
  finally { busy(0); }
})();
