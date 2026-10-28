'use strict';
/* ALBA DE CENIZA — motor del juego */

const KEY = 'albaCeniza.v1';
const KEY_G = 'albaCeniza.caidos';
let S = null;                 // partida
let DRAFT = null;             // personaje en creación
const UI = { modal: null, cb: null };

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const rnd = n => Math.floor(Math.random() * n);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const rojo = s => s === 'H' || s === 'D';
const lab = c => RANGOS[c.r] + PALOS[c.s];
const cartaH = (c, x = '') => `<span class="carta ${rojo(c.s) ? 'roja' : 'negra'} ${x}"><b>${RANGOS[c.r]}</b><i>${PALOS[c.s]}</i></span>`;
const tmpCard = () => ({ r: 1 + rnd(13), s: 'SCHD'[rnd(4)] });
const idxRango = r => r <= 2 ? 0 : r <= 4 ? 1 : r <= 6 ? 2 : r <= 8 ? 3 : r <= 10 ? 4 : r <= 12 ? 5 : 6;

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('off'), 2600);
  setTimeout(() => t.remove(), 3100);
}

/* ---------- guardado ---------- */
function save() { try { if (S) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function loadSave() {
  try { const t = localStorage.getItem(KEY); if (t) { const o = JSON.parse(t); if (o && o.v === 1) return o; } } catch (e) { }
  return null;
}
function commit() { save(); render(); }

/* ---------- baraja ---------- */
function newDeck() { const d = []; for (const s of ['S', 'C', 'H', 'D']) for (let r = 1; r <= 13; r++) d.push({ r, s }); return shuffle(d); }
function draw() {
  if (!S.deck.length) { S.deck = shuffle(S.discard.splice(0)); if (!S.deck.length) S.deck = newDeck(); }
  const c = S.deck.pop(); S.discard.push(c); return c;
}
function logr(t) { if (S && S.exp) S.exp.log.push(t); }

/* ---------- creación de personaje ---------- */
function newDraft() {
  return { nombre: '', clase: 0, llamado: null, llamC: '', nat: null, natC: '', arma: '', look: '', compa: COMPANEROS[rnd(COMPANEROS.length)], meta: 5 };
}

function createScreen() {
  const d = DRAFT, cl = CLASES[d.clase];
  const ll = d.llamado != null ? LLAMADOS[d.llamado] : null;
  return `
  <header class="titulo-peq"><h1>Nueva aventurera</h1><p class="sub">Crea a la persona cuyo diario vas a escribir.</p></header>
  <section class="panel">
    <label class="lbl">Nombre</label>
    <input class="inp" data-draft="nombre" value="${esc(d.nombre)}" placeholder="¿Cómo te llamas?" maxlength="40" autocomplete="off">
  </section>
  <section class="panel">
    <label class="lbl">Clase</label>
    <div class="clases">
      ${CLASES.map((c, i) => `<button class="clase ${i === d.clase ? 'sel' : ''}" data-act="setClase" data-i="${i}"><span class="ico">${c.ico}</span><b>${c.n}</b><small>Exploración ${c.e} · Combate ${c.c}</small></button>`).join('')}
    </div>
    <p class="desc">${esc(cl.d)}</p>
    <ul class="ideas">${cl.ideas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${cl.id === 'guia' ? `<label class="lbl">Tu compañero de ceniza</label>
      <input class="inp" data-draft="compa" value="${esc(d.compa)}" maxlength="80">
      <button class="btn sec" data-act="sortCompa">🎲 Sortear otro</button>` : ''}
  </section>
  <section class="panel">
    <label class="lbl">Tu Llamado</label>
    <p class="nota">Lo que te empuja a salir al camino. Elige uno o deja que lo decida una carta.</p>
    <select class="inp" data-draftsel="llamado"><option value="">— elige —</option>${LLAMADOS.map((l, i) => `<option value="${i}" ${d.llamado === i ? 'selected' : ''}>${esc(l.t)}</option>`).join('')}</select>
    <button class="btn sec" data-act="sortLlamado">🃏 Robar carta${d.llamC ? ` (salió ${esc(d.llamC)})` : ''}</button>
    ${ll ? `<p class="desc">${esc(ll.x)}</p>` : ''}
  </section>
  <section class="panel">
    <label class="lbl">Tu Naturaleza</label>
    <p class="nota">Cómo reaccionas ante la gente y las decisiones. Úsala al escribir tu diario.</p>
    <select class="inp" data-draftsel="nat"><option value="">— elige —</option>${NATURALEZAS.map((n, i) => `<option value="${i}" ${d.nat === i ? 'selected' : ''}>${esc(n.split(':')[0])}</option>`).join('')}</select>
    <button class="btn sec" data-act="sortNat">🃏 Robar carta${d.natC ? ` (salió ${esc(d.natC)})` : ''}</button>
    ${d.nat != null ? `<p class="desc">${esc(NATURALEZAS[d.nat])}</p>` : ''}
  </section>
  <section class="panel">
    <label class="lbl">Tu arma</label>
    <p class="nota">Lo que quieras: espada, honda, cañón de mano... mantén un nivel medieval.</p>
    <input class="inp" data-draft="arma" value="${esc(d.arma)}" placeholder="Ej.: una espada ancha con la hoja mellada" maxlength="80">
    <label class="lbl">Tu aspecto (opcional)</label>
    <input class="inp" data-draft="look" value="${esc(d.look)}" placeholder="Ej.: pelo rojo, bufanda azul, cicatriz en la mano" maxlength="120">
  </section>
  <section class="panel">
    <label class="lbl">Duración de la aventura</label>
    <select class="inp" data-draftsel="meta">
      <option value="3" ${d.meta === 3 ? 'selected' : ''}>Corta · 3 Fragmentos de Alba</option>
      <option value="5" ${d.meta === 5 ? 'selected' : ''}>Normal · 5 Fragmentos de Alba</option>
      <option value="7" ${d.meta === 7 ? 'selected' : ''}>Larga · 7 Fragmentos de Alba</option>
    </select>
  </section>
  <div class="fila">
    <button class="btn" data-act="comenzar">Comenzar la aventura</button>
    <button class="btn sec" data-act="atras">Volver</button>
  </div>`;
}

function comenzar() {
  const d = DRAFT, cl = CLASES[d.clase];
  if (!d.nombre.trim()) return toast('Escribe tu nombre.');
  if (d.llamado == null) return toast('Elige o roba tu Llamado.');
  if (d.nat == null) return toast('Elige o roba tu Naturaleza.');
  if (!d.arma.trim()) return toast('Describe tu arma.');
  S = {
    v: 1, nombre: d.nombre.trim(), clase: cl.id, claseN: cl.n,
    llamado: LLAMADOS[d.llamado], naturaleza: NATURALEZAS[d.nat],
    arma: d.arma.trim(), look: d.look.trim(), companero: cl.id === 'guia' ? d.compa.trim() : '',
    e: cl.e, c: cl.c, perdE: 0, perdC: 0, tesoros: 0, inv: [], fragmentos: 0, meta: d.meta, pistas: 0,
    deck: newDeck(), discard: [], cap: 0, fase: 'home', exp: null, cmb: null, city: null,
    diario: [], notas: '', ganada: false, creado: Date.now()
  };
  DRAFT = null;
  commit();
}

/* ---------- pantallas ---------- */
function titleScreen() {
  const has = !!loadSave();
  return `
  <div class="portada">
    <div class="llama">🕯️</div>
    <h1>Alba de Ceniza</h1>
    <p class="sub">Un juego de rol en solitario con una baraja de cartas</p>
    <p class="frase">El sol se apagó hace generaciones. Quedan lámparas, ciudades de humo y cinco Faros que podrían despertar el alba. Tú eres quien sale a buscarlos.</p>
    <div class="menu-col">
      ${has ? `<button class="btn" data-act="continuar">Continuar aventura</button>` : ''}
      <button class="btn ${has ? 'sec' : ''}" data-act="nuevo">Nueva aventura</button>
      <button class="btn sec" data-act="importar">Importar partida guardada</button>
      <button class="btn sec" data-act="reglas">Cómo se juega</button>
    </div>
    <p class="creditos">Inspirado en el sistema de cartas de <i>Colostle</i>, de Nich Angell. El mundo, los textos y las tablas de este juego son originales.</p>
  </div>`;
}

function pips(v, p) { let s = ''; for (let i = 1; i <= 5; i++) s += `<i class="pip ${i <= v ? 'on' : (i <= v + p ? 'lost' : '')}"></i>`; return s; }

function hud() {
  const prog = Math.min(S.fragmentos, S.meta);
  return `
  <header class="hud">
    <div class="hud-top">
      <div class="quien"><b>${esc(S.nombre)}</b><small>${esc(S.claseN)} · Capítulo ${S.cap}</small></div>
      <div class="hud-btn"><button data-act="ficha" aria-label="Ficha">📜</button><button data-act="diario" aria-label="Diario">📖</button><button data-act="menu" aria-label="Menú">☰</button></div>
    </div>
    <div class="stats">
      <div><span>Exploración</span><div class="pips">${pips(S.e, S.perdE)}</div></div>
      <div><span>Combate</span><div class="pips">${pips(S.c, S.perdC)}</div></div>
      <div><span>Tesoros</span><b class="num">${S.tesoros}</b></div>
      <div><span>Fragmentos</span><b class="num">${prog}/${S.meta}</b></div>
    </div>
  </header>`;
}

function homeScreen() {
  const ult = S.diario[S.diario.length - 1];
  const listo = S.fragmentos >= S.meta && !S.ganada;
  return `
  <section class="panel central">
    ${S.cap === 0 ? `<h2>Tu primer paso</h2><p class="desc">${esc(S.llamado.x)}</p><p class="nota">Antes de partir, escribe en tu diario quién eres y por qué te marchas. Luego comienza el primer capítulo.</p>`
      : `<h2>Entre capítulos</h2><p class="desc">Respira. Mira tu ficha, repasa tu diario y cuando estés lista, sigue el camino.</p>`}
    ${ult ? `<div class="ultimo"><small>Último capítulo (${ult.cap}) · ${esc(ult.cartas)}</small><p>${esc(ult.texto ? ult.texto.slice(0, 220) + (ult.texto.length > 220 ? '…' : '') : 'Sin entrada escrita.')}</p></div>` : ''}
    ${listo ? `<div class="aviso">✨ Los Fragmentos de Alba están reunidos. La Cumbre del Alba te espera.</div>
      <button class="btn grande" data-act="subirCumbre">Subir a la Cumbre del Alba</button>` : ''}
    <button class="btn ${listo ? 'sec' : 'grande'}" data-act="comenzarCap">${S.cap === 0 ? 'Comenzar el capítulo 1' : `Comenzar el capítulo ${S.cap + 1}`}</button>
    <p class="nota">Robarás ${S.e} carta${S.e === 1 ? '' : 's'} de exploración (tu puntuación de Exploración).</p>
  </section>`;
}

function expScreen() {
  const E = S.exp;
  return `
  <section class="capitulo">
    <h2>Capítulo ${S.cap}</h2>
    <p class="nota">Cada carta es una escena. Enlázalas en una historia y escríbela en tu diario.</p>
  </section>
  ${E.cards.map((c, ci) => expCard(c, ci)).join('')}
  <section class="panel">
    <h3>Herramientas</h3>
    <div class="fila">
      <button class="btn sec" data-act="sacarObjeto">🎒 Sacar Objeto</button>
      <button class="btn sec" data-act="sacarEvento">⚡ Sacar Evento</button>
      <button class="btn sec" data-act="sacarClima">🌫️ Tirar clima</button>
    </div>
  </section>
  ${E.log.length ? `<section class="panel"><h3>Registro del capítulo</h3><ul class="log">${E.log.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
  <section class="panel">
    <h3>Tu diario de este capítulo</h3>
    <textarea class="area" id="diario-txt" placeholder="Escribe aquí lo que ocurrió, como si lo contara tu personaje…">${esc(E.texto)}</textarea>
  </section>
  <div class="fila"><button class="btn" data-act="terminar">Terminar capítulo</button></div>`;
}

function expCard(c, ci) {
  const rj = rojo(c.s);
  return `
  <article class="esc ${rj ? 'r' : 'n'}">
    <div class="esc-h">${cartaH(c)}<div><b>${esc(c.t)}</b><small>${rj ? 'Seres y gente' : 'Lugares y cosas'}${c.l ? ' · ' + esc(c.l) : ''}</small></div></div>
    <p>${esc(c.d)}</p>
    ${c.x ? `<p class="var">${esc(c.x)}</p>` : ''}
    ${c.dup ? `<div class="aviso peq">Esta carta repite un número ya salido. Puedes aceptarla o <button class="link" data-act="repetir" data-ci="${ci}">robar otra</button>.</div>` : ''}
    ${c.acts.length ? `<div class="acc">${c.acts.map((a, ai) => `<button class="btn peq ${c.used.includes(ai) ? 'hecho' : ''}" ${c.used.includes(ai) ? 'disabled' : ''} data-act="accion" data-ci="${ci}" data-ai="${ai}">${esc(a[1])}</button>`).join('')}</div>` : ''}
  </article>`;
}

/* ---------- exploración ---------- */
function mkExpCard(c) {
  let info, v;
  if (c.r >= 11) { info = FIGURA[c.r]; return { r: c.r, s: c.s, t: info.t, d: info.d, l: '', x: '', acts: info.a.map(a => a.slice()), used: [], dup: false }; }
  info = (rojo(c.s) ? EXP_ROJO : EXP_NEGRO)[c.r];
  v = info[c.s];
  return { r: c.r, s: c.s, t: info.t, d: info.d, l: v.l, x: v.x, acts: v.a.map(a => a.slice()), used: [], dup: false };
}
function marcarDup() {
  const vistos = {};
  S.exp.cards.forEach(c => { c.dup = !!vistos[c.r]; vistos[c.r] = true; });
}
function comenzarCap() {
  S.cap++;
  const cards = [];
  for (let i = 0; i < S.e; i++) cards.push(mkExpCard(draw()));
  S.exp = { cards, log: [], texto: '' };
  marcarDup();
  S.fase = 'explore';
  commit();
  window.scrollTo(0, 0);
}
function terminar() {
  const E = S.exp;
  S.diario.push({ cap: S.cap, cartas: E.cards.map(c => lab(c)).join(' '), registro: E.log.slice(), texto: E.texto.trim() });
  S.exp = null; S.fase = 'home';
  commit(); window.scrollTo(0, 0);
}

/* ---------- objetos ---------- */
function itemByName(n) {
  const f = ITEMS.find(i => i && i.n === n);
  if (f) return f;
  if (n === 'Animal manso') return { n, k: 'compañero', d: 'Te sigue y no muerde.' };
  if (n === 'Provisiones') return { n, k: 'misc', d: 'Alivian el hambre.' };
  return { n, k: 'misc', d: '' };
}
function addItem(it) {
  if (it.k === 'tesoro') { S.tesoros += it.v; logr(`Obtienes ${it.n} (+${it.v} Tesoro${it.v > 1 ? 's' : ''}).`); }
  else { S.inv.push({ n: it.n, k: it.k, d: it.d || '' }); logr(`Obtienes: ${it.n}.`); }
}
function drawItem() { const c = draw(); const it = ITEMS[c.r]; logr(`Objeto (${lab(c)}): ${it.n}.`); if (it.k === 'tesoro') { S.tesoros += it.v; } else S.inv.push({ n: it.n, k: it.k, d: it.d || '' }); return it; }
function drawEvent() { const c = draw(); logr(`Evento (${lab(c)}): ${EVENTOS[c.r]}`); }
function drawWeather() { const c = draw(); logr(`Clima (${lab(c)}): ${CLIMA[c.r]}`); }
function addFragment() {
  S.fragmentos++; logr(`✨ Ganas 1 Fragmento de Alba (${Math.min(S.fragmentos, S.meta)}/${S.meta}).`);
  if (S.fragmentos === S.meta) logr('Todos los Fragmentos están reunidos: la Cumbre del Alba te espera.');
}
function addPista() {
  S.pistas++; logr('Anotas una pista en tu diario.');
  if (S.pistas % 2 === 0) { logr('Dos pistas encajan entre sí y revelan dónde ocultaba el alba una de sus esquirlas.'); addFragment(); }
}

/* ---------- preguntas (modal) ---------- */
function ask(titulo, opts, cb, extra) { UI.modal = { t: 'ask', titulo, opts, extra: extra || '' }; UI.cb = cb; commit(); }

function lose(i) {
  if (i === 0) { S.e--; S.perdE++; } else { S.c--; S.perdC++; }
  if (S.e <= 0 || S.c <= 0) morir();
}
function askWounds(n, after) {
  if (n <= 0) { after && after(); return; }
  ask(`Sufres una herida${n > 1 ? ` (${n} por asignar)` : ''}`, [`−1 Exploración (ahora ${S.e})`, `−1 Combate (ahora ${S.c})`], i => {
    lose(i);
    if (S.fase === 'dead') return;
    askWounds(n - 1, after);
  }, 'Cada herida baja una de tus puntuaciones. Piensa qué forma tiene: una cojera, una mano dañada, una cicatriz…');
}
function gainPoint(after) {
  if (S.e >= 5 && S.c >= 5) { logr('Tus puntuaciones ya están al máximo.'); after && after(); return; }
  const o = [`+1 Exploración (ahora ${S.e})`, `+1 Combate (ahora ${S.c})`];
  ask('Ganas 1 punto', o, i => {
    if (i === 0) { if (S.e < 5) S.e++; else toast('Exploración ya está al máximo.'); }
    else { if (S.c < 5) S.c++; else toast('Combate ya está al máximo.'); }
    after && after();
  }, 'Las puntuaciones nunca pasan de 5.');
}
function curar(after) {
  if (S.perdE + S.perdC <= 0) { toast('No tienes heridas que curar.'); return false; }
  const o = [], m = [];
  if (S.perdE > 0 && S.e < 5) { o.push('Recuperar Exploración'); m.push(0); }
  if (S.perdC > 0 && S.c < 5) { o.push('Recuperar Combate'); m.push(1); }
  if (!o.length) { toast('No tienes heridas que curar.'); return false; }
  ask('¿Qué herida se cura?', o, i => {
    if (m[i] === 0) { S.e++; S.perdE--; } else { S.c++; S.perdC--; }
    after && after();
  });
  return true;
}
function morir() {
  S.fase = 'dead'; S.cmb = null; UI.cb = null; UI.modal = null;
  try {
    const g = JSON.parse(localStorage.getItem(KEY_G) || '[]');
    g.push({ nombre: S.nombre, clase: S.claseN, cap: S.cap, fecha: Date.now() });
    localStorage.setItem(KEY_G, JSON.stringify(g));
  } catch (e) { }
}

/* ---------- acciones de carta ---------- */
function accion(ci, ai) {
  const c = S.exp.cards[ci]; if (!c || c.used.includes(ai)) return;
  const a = c.acts[ai], tipo = a[0];
  const marca = () => { if (!c.used.includes(ai)) c.used.push(ai); };
  switch (tipo) {
    case 'giveItem': addItem(itemByName(a[2])); marca(); break;
    case 'item': drawItem(); marca(); break;
    case 'event': drawEvent(); marca(); break;
    case 'weather': drawWeather(); marca(); break;
    case 'avoid': logr(`Evitas el encuentro (${c.t}).`); marca(); break;
    case 'pista': addPista(); marca(); break;
    case 'fragment': addFragment(); marca(); break;
    case 'score': marca(); gainPoint(); return;
    case 'faroRepair': {
      const k = S.inv.findIndex(i => i.k === 'pieza'), l = S.inv.findIndex(i => i.k === 'llave');
      const j = k >= 0 ? k : l;
      if (j < 0) return toast('No tienes una Llave ni una Pieza de mecanismo.');
      const gastado = S.inv.splice(j, 1)[0];
      logr(`Usas ${gastado.n} para reparar el Faro.`); addFragment(); marca(); break;
    }
    case 'loseItem': {
      if (!S.inv.length) { logr('No tienes nada que perder: sales ileso.'); marca(); break; }
      marca();
      ask('¿Qué objeto pierdes?', S.inv.map(i => i.n), i => { const x = S.inv.splice(i, 1)[0]; logr(`Pierdes: ${x.n}.`); });
      return;
    }
    case 'wound1': marca(); logr('Sufres 1 herida.'); S.exp && commitSilent(); askWounds(1); return;
    case 'city': marca(); S.city = { nombre: CITY_NAMES[rnd(CITY_NAMES.length)], archivo: 0 }; S.fase = 'city'; logr(`Entras en ${S.city.nombre}.`); break;
    case 'fight': marca(); startCombat(a[2]); return;
  }
  commit();
}
function commitSilent() { save(); }

/* ---------- combate ---------- */
function buildOpp(tipo) {
  if (tipo === 'person') {
    const a = draw(), b = draw();
    return { tipo, nombre: 'Una persona', ataques: 1, intencion: INTENCION[a.s], armaT: b.r <= 6 ? 'a distancia (arco, lanza, honda…)' : 'cuerpo a cuerpo (espada, hacha, puños…)', cartas: [lab(a), lab(b)], don: null, rec: null };
  }
  if (tipo === 'fiera') {
    const a = draw();
    return { tipo, nombre: 'Una fiera', ataques: 2, intencion: INTENCION[a.s], armaT: 'garras, colmillos o cuernos', cartas: [lab(a)], don: null, rec: null };
  }
  const m = draw(), b = draw(), w = draw(), r = draw(), f = draw();
  const med = tipo === 'medium';
  return {
    tipo, nombre: med ? 'Centinela de Ceniza' : 'Coloso de Ceniza', ataques: med ? 3 : 5,
    forma: FORMA[f.r - 1], don: DON[m.s],
    cuerpo: b.r <= 7 ? 'Ofensivo: golpea de cerca y rápido, o dispara a distancia.' : 'Defensivo: se cubre con su piedra y bloquea.',
    armaT: w.r <= 6 ? 'a distancia (ballestas, cañones, lanzas arrojadizas)' : 'cuerpo a cuerpo (espadas, mazas, puños de piedra)',
    rec: RECOMPENSA[r.s], cartas: [lab(m), lab(b), lab(w), lab(r), lab(f)]
  };
}
function startCombat(tipo) {
  let o;
  if (tipo === 'final') { o = buildOpp('massive'); o.nombre = NOCHE.t; o.final = true; o.rec = null; o.forma = 'una oscuridad con la forma de lo que más temes'; }
  else o = buildOpp(tipo);
  S.cmb = Object.assign(o, { opciones: [], actual: null, resueltos: 0, victorias: 0, empates: 0, heridas: 0, criticos: 0, hist: [], etapa: 'setup', porAsignar: 0, reclamado: false });
  S.fase = 'combat';
  commit(); window.scrollTo(0, 0);
}
function empezarLucha() {
  const k = S.cmb;
  for (let i = 0; i < S.c; i++) k.opciones.push(Object.assign(draw(), { usada: false }));
  k.etapa = 'fight';
  siguienteAtaque();
  commit();
}
function siguienteAtaque() {
  const k = S.cmb;
  if (k.resueltos >= k.ataques) { terminarLucha(); return; }
  k.actual = draw();
}
function resolver(o) {
  const k = S.cmb, a = k.actual; let res, txt;
  if (o && o.r > a.r) {
    k.victorias++;
    const quedan = k.ataques - k.resueltos - 1;
    if (o.s === a.s && quedan > 0) { k.ataques--; k.criticos++; res = 'crit'; txt = `¡Golpe crítico! Tu ${ATAQUE_JUGADOR[o.s].toLowerCase()} deja a tu rival tambaleando: le quedan menos ataques. Describe cómo lo incapacitas.`; }
    else { res = 'gana'; txt = `Ganas el intercambio con un ${ATAQUE_JUGADOR[o.s].toLowerCase()}. Cuenta cómo esquivas y respondes.`; }
  } else if (o && o.r === a.r) { k.empates++; res = 'choque'; txt = 'Choque: las fuerzas se igualan y nadie cede. Sin herida.'; }
  else { k.heridas++; res = 'herida'; txt = o ? 'Tu carta no alcanza: recibes una herida.' : 'Sin cartas que oponer: recibes una herida.'; }
  k.resueltos++;
  k.hist.push({ a: lab(a), at: ATAQUE_ENEMIGO[a.s], o: o ? lab(o) : '—', res, txt });
  k.actual = null;
  siguienteAtaque();
}
function terminarLucha() {
  const k = S.cmb;
  k.etapa = 'fin';
  k.victoria = k.victorias > k.resueltos / 2;
  let w = k.heridas;
  const cor = S.inv.findIndex(i => i.k === 'armor');
  k.coraza = false;
  if (cor >= 0 && w > 0) { w--; k.coraza = true; }
  k.porAsignar = w;
  logr(`Combate contra ${k.nombre}: ${k.victoria ? 'victoria' : 'derrota'} (${k.heridas} herida${k.heridas === 1 ? '' : 's'}).`);
}
function reclamar() {
  const k = S.cmb; k.reclamado = true;
  if (!k.victoria) { logr('Tu rival logra su intención. No hay recompensa.'); commit(); return; }
  if (k.final) { S.ganada = true; S.cmb = null; S.fase = 'won'; commit(); return; }
  if (k.tipo === 'person') { S.tesoros++; logr('Obtienes 1 Tesoro de tu rival.'); commit(); return; }
  if (k.tipo === 'fiera') { addItem(itemByName('Provisiones')); commit(); return; }
  S.inv.push({ n: `${k.rec.n} (${k.don.n})`, k: 'recompensa', d: k.rec.t });
  logr(`Recompensa: ${k.rec.n}. ${k.rec.t}`);
  if (k.tipo === 'massive') { logr('De su núcleo se desprende una esquirla de luz.'); addFragment(); }
  gainPoint(() => commit());
}
function cerrarCombate() {
  const k = S.cmb;
  S.cmb = null;
  if (k && k.final) { S.fase = 'home'; toast('Retrocedes herida. Descansa y vuelve a intentarlo.'); }
  else S.fase = S.exp ? 'explore' : 'home';
  commit(); window.scrollTo(0, 0);
}

function combatScreen() {
  const k = S.cmb;
  const cab = `<section class="panel enemigo"><h2>${esc(k.nombre)}</h2>
    ${k.forma ? `<p class="desc">Tiene la forma de ${esc(k.forma)}.</p>` : ''}
    <ul class="datos">
      ${k.intencion ? `<li><b>Intención:</b> ${esc(k.intencion)}</li>` : ''}
      ${k.cuerpo ? `<li><b>Cuerpo:</b> ${esc(k.cuerpo)}</li>` : ''}
      ${k.don ? `<li><b>Don:</b> ${esc(k.don.n)} — ${esc(k.don.t)}</li>` : ''}
      <li><b>Arma:</b> ${esc(k.armaT)}</li>
      ${k.rec ? `<li><b>Recompensa si lo derrotas:</b> ${esc(k.rec.n)}</li>` : ''}
      <li><b>Ataques:</b> ${k.ataques}</li>
    </ul></section>`;
  if (k.etapa === 'setup') return cab + `<section class="panel"><p class="desc">Robarás ${S.c} carta${S.c === 1 ? '' : 's'} como tus Opciones. Tu rival atacará ${k.ataques} ${k.ataques === 1 ? 'vez' : 'veces'}. Para cada ataque, elige una de tus cartas: la más alta gana, y del mismo palo es un golpe crítico.</p>
    <button class="btn grande" data-act="empezarLucha">Entrar en combate</button></section>`;
  const hist = k.hist.map(h => `<li class="${h.res}"><b>${h.a}</b> vs <b>${h.o}</b> — ${esc(h.txt)}</li>`).join('');
  if (k.etapa === 'fight') {
    const sinOpc = k.opciones.every(o => o.usada);
    return cab + `<section class="panel">
      <h3>Ataque ${k.resueltos + 1} de ${k.ataques}</h3>
      <div class="ataque">${cartaH(k.actual, 'grande')}<p>Tu rival lanza <b>${esc(ATAQUE_ENEMIGO[k.actual.s])}</b>.</p></div>
      <h3>Tus opciones</h3>
      <p class="nota">Elige con qué carta contraatacas. Si ninguna supera su número, igual debes gastar una (y recibirás herida).</p>
      <div class="opciones">${k.opciones.map((o, i) => `<button class="opc ${o.usada ? 'usada' : ''}" ${o.usada ? 'disabled' : ''} data-act="contra" data-i="${i}">${cartaH(o)}<small>${({ S: 'Cuerpo', C: 'Arma', H: 'Don', D: 'Ingenio' })[o.s]}</small></button>`).join('')}</div>
      ${sinOpc ? `<button class="btn" data-act="sinCartas">Sin cartas: recibes la herida</button>` : ''}
    </section>
    ${hist ? `<section class="panel"><h3>Lo que va del combate</h3><ul class="log">${hist}</ul></section>` : ''}
    <section class="panel"><p class="nota">Heridas por ahora: ${k.heridas} · Ataques ganados: ${k.victorias}</p></section>`;
  }
  /* fin */
  let fin = `<section class="panel resultado ${k.victoria ? 'ok' : 'mal'}"><h2>${k.victoria ? 'Victoria' : 'Derrota'}</h2>
    <p class="desc">${k.victoria ? 'Ganaste la mayoría de los intercambios. Describe cómo cae tu rival.' : 'No ganaste la mayoría de los intercambios. Tu rival se sale con la suya: describe qué ocurre.'}</p>
    <p class="nota">Ataques ganados: ${k.victorias} · Choques: ${k.empates} · Heridas: ${k.heridas}${k.coraza ? ' (tu coraza bloquea 1)' : ''}${k.criticos ? ` · Críticos: ${k.criticos}` : ''}</p></section>
    ${hist ? `<section class="panel"><h3>Resumen</h3><ul class="log">${hist}</ul></section>` : ''}`;
  if (k.porAsignar > 0) {
    fin += `<section class="panel"><h3>Asigna tus heridas</h3><p class="desc">Tienes ${k.porAsignar} herida${k.porAsignar > 1 ? 's' : ''} por asignar. Cada una baja una de tus puntuaciones.</p>
      <button class="btn" data-act="asignar">Asignar heridas</button></section>`;
  } else if (!k.reclamado) {
    fin += `<section class="panel"><button class="btn grande" data-act="reclamar">${k.victoria ? (k.final ? 'Ver el final' : 'Reclamar la recompensa') : 'Continuar'}</button></section>`;
  } else {
    fin += `<section class="panel"><button class="btn grande" data-act="cerrarCombate">Seguir adelante</button></section>`;
  }
  return fin;
}

/* ---------- ciudad ---------- */
function cityScreen() {
  const C = S.city;
  const hay = S.perdE + S.perdC > 0;
  return `
  <section class="panel"><h2>${esc(C.nombre)}</h2>
    <p class="desc">Puentes de madera, farolillos de colores y gente que se apura. Aquí puedes comerciar, descansar y buscar noticias. Tienes <b>${S.tesoros}</b> Tesoro${S.tesoros === 1 ? '' : 's'}.</p></section>
  <section class="panel"><h3>🛒 Mercado</h3>
    ${SHOP.map(it => `<div class="tienda"><div><b>${esc(it.n)}</b><small>${esc(it.d)}</small></div><button class="btn peq" ${S.tesoros < it.p ? 'disabled' : ''} data-act="comprar" data-id="${it.id}">${it.p} ⛁</button></div>`).join('')}
    ${S.inv.length ? `<h4>Vender (1 Tesoro cada objeto)</h4>${S.inv.map((it, i) => `<div class="tienda"><div><b>${esc(it.n)}</b></div><button class="btn peq sec" data-act="vender" data-i="${i}">Vender</button></div>`).join('')}` : ''}
  </section>
  <section class="panel"><h3>🛏️ Posada</h3><p class="nota">Una noche de descanso cura 1 herida. Cuesta 1 Tesoro.</p>
    <button class="btn" ${(!hay || S.tesoros < 1) ? 'disabled' : ''} data-act="posada">Descansar (1 ⛁)</button></section>
  <section class="panel"><h3>📚 Archivo</h3><p class="nota">Pregunta por tu Llamado. Cuesta 1 Tesoro y te da una pista; dos pistas juntas revelan un Fragmento de Alba.</p>
    <button class="btn" ${S.tesoros < 1 ? 'disabled' : ''} data-act="archivo">Consultar (1 ⛁)</button></section>
  <section class="panel"><h3>⚒️ Taller</h3><p class="nota">Un herrero mejora tu equipo: +1 a Exploración o Combate. Cuesta 4 Tesoros.</p>
    <button class="btn" ${(S.tesoros < 4 || (S.e >= 5 && S.c >= 5)) ? 'disabled' : ''} data-act="taller">Mejorar (4 ⛁)</button></section>
  <div class="fila"><button class="btn sec" data-act="salirCiudad">Salir de la ciudad</button></div>`;
}

/* ---------- fin de partida ---------- */
function deadScreen() {
  return `<section class="panel central"><h2>Tu luz se apaga</h2>
    <p class="desc">${esc(S.nombre)} cae. Escribe su última entrada: ¿se despide, o todo termina de golpe?</p>
    <textarea class="area" id="epitafio" placeholder="Las últimas palabras…">${esc(S.epitafio || '')}</textarea>
    <div class="fila"><button class="btn" data-act="exportar">Guardar el diario</button><button class="btn sec" data-act="diario">Leer el diario</button></div>
    <p class="nota">Puedes crear una nueva aventurera. Quizá encuentre el diario de ${esc(S.nombre)}…</p>
    <button class="btn grande" data-act="nuevaTrasMuerte">Nueva aventurera</button></section>`;
}
function wonScreen() {
  return `<section class="panel central"><h2>El alba vuelve</h2>
    <p class="desc">${esc(END_TXT)}</p>
    <textarea class="area" id="epitafio" placeholder="La última página de tu diario…">${esc(S.epitafio || '')}</textarea>
    <div class="fila"><button class="btn" data-act="exportar">Guardar la partida</button><button class="btn sec" data-act="diario">Leer el diario</button></div>
    <button class="btn grande" data-act="seguir">Seguir explorando</button>
    <button class="btn sec" data-act="nuevaTrasMuerte">Nueva aventura</button></section>`;
}

/* ---------- modales ---------- */
function diarioTxt() {
  let t = `ALBA DE CENIZA — Diario de ${S.nombre} (${S.claseN})\nLlamado: ${S.llamado.t}\n${S.llamado.x}\nNaturaleza: ${S.naturaleza}\n\n`;
  S.diario.forEach(e => {
    t += `== Capítulo ${e.cap} == Cartas: ${e.cartas}\n`;
    e.registro.forEach(r => t += `  · ${r}\n`);
    if (e.texto) t += `\n${e.texto}\n`;
    t += '\n';
  });
  if (S.exp && S.exp.texto) t += `== Capítulo ${S.cap} (en curso) ==\n${S.exp.texto}\n`;
  if (S.epitafio) t += `\n== Final ==\n${S.epitafio}\n`;
  return t;
}
function modalHTML() {
  const m = UI.modal; if (!m) return '';
  let body = '';
  if (m.t === 'ask') {
    body = `<h3>${esc(m.titulo)}</h3>${m.extra ? `<p class="nota">${esc(m.extra)}</p>` : ''}
      <div class="col">${m.opts.map((o, i) => `<button class="btn" data-act="askPick" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
    return `<div class="velo"><div class="modal">${body}</div></div>`;
  }
  if (m.t === 'ficha' && S) {
    body = `<h3>${esc(S.nombre)} · ${esc(S.claseN)}</h3>
      ${S.look ? `<p class="desc">${esc(S.look)}</p>` : ''}
      <ul class="datos"><li><b>Arma:</b> ${esc(S.arma)}</li>
      ${S.companero ? `<li><b>Compañero:</b> ${esc(S.companero)}</li>` : ''}
      <li><b>Naturaleza:</b> ${esc(S.naturaleza)}</li>
      <li><b>Llamado:</b> ${esc(S.llamado.t)}</li>
      <li><b>Pistas anotadas:</b> ${S.pistas}</li>
      <li><b>Tesoros:</b> ${S.tesoros}</li>
      <li><b>Fragmentos de Alba:</b> ${S.fragmentos}/${S.meta}</li></ul>
      <p class="desc">${esc(S.llamado.x)}</p>
      <h4>Inventario</h4>
      ${S.inv.length ? S.inv.map((it, i) => `<div class="tienda"><div><b>${esc(it.n)}</b>${it.d ? `<small>${esc(it.d)}</small>` : ''}</div>
        <span>${it.k === 'cura' ? `<button class="btn peq" data-act="usarCura" data-i="${i}">Usar</button>` : ''}<button class="btn peq sec" data-act="tirar" data-i="${i}">Tirar</button></span></div>`).join('') : '<p class="nota">Tu mochila está vacía.</p>'}
      <h4>Notas de la aventura</h4>
      <textarea class="area" id="notas" placeholder="Nombres, lugares, pistas…">${esc(S.notas)}</textarea>
      <button class="btn sec" data-act="cerrar">Cerrar</button>`;
  } else if (m.t === 'diario' && S) {
    const txt = diarioTxt();
    body = `<h3>Diario de ${esc(S.nombre)}</h3>
      <div class="diario">${S.diario.length ? S.diario.slice().reverse().map(e => `<article><h4>Capítulo ${e.cap} <small>${esc(e.cartas)}</small></h4>
        ${e.registro.length ? `<ul class="log">${e.registro.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        <p>${e.texto ? esc(e.texto).replace(/\n/g, '<br>') : '<i>Sin entrada escrita.</i>'}</p></article>`).join('') : '<p class="nota">Aún no has terminado ningún capítulo.</p>'}</div>
      <div class="fila"><button class="btn" data-act="copiarDiario">Copiar diario</button><button class="btn sec" data-act="exportarTxt">Descargar .txt</button><button class="btn sec" data-act="cerrar">Cerrar</button></div>`;
  } else if (m.t === 'menu') {
    body = `<h3>Menú</h3><div class="col">
      ${S ? `<button class="btn" data-act="exportar">💾 Guardar copia de la partida (.json)</button>` : ''}
      <button class="btn sec" data-act="importar">📂 Importar partida</button>
      <button class="btn sec" data-act="reglas">📖 Cómo se juega</button>
      ${S ? `<button class="btn sec" data-act="titulo">🏠 Pantalla de inicio</button><button class="btn peligro" data-act="nuevaConfirm">🗑️ Borrar y empezar de nuevo</button>` : ''}
      <button class="btn sec" data-act="cerrar">Cerrar</button></div>
      <p class="nota">Tu partida se guarda sola en este dispositivo. Haz copias de vez en cuando por si borras los datos del navegador.</p>`;
  } else if (m.t === 'reglas') {
    body = `<h3>Cómo se juega</h3><div class="reglas">
      <p>Necesitas solo este juego y ganas de contar historias. La app lleva la baraja por ti.</p>
      <h4>Tu personaje</h4><p>Tiene dos puntuaciones, de 1 a 5: <b>Exploración</b> (cuántas cartas robas al explorar) y <b>Combate</b> (cuántas opciones tienes al pelear). También tiene un Llamado (por qué sale al camino) y una Naturaleza (cómo reacciona).</p>
      <h4>Capítulos</h4><p>Cada capítulo empieza robando cartas de exploración. Las <b>rojas</b> son seres y gente; las <b>negras</b>, lugares y cosas. El palo cambia la versión de la escena. J, Q y K son un hallazgo, un Centinela y un Coloso. Enlaza las cartas en una historia y escríbela en tu diario.</p>
      <h4>Combate</h4><p>Robas tantas cartas como tu Combate: son tus Opciones. El rival ataca una vez por cada ataque que tenga (persona 1, fiera 2, Centinela 3, Coloso 5). Contra cada ataque elige una carta: <b>la más alta gana</b>, la igual es un choque, la más baja es una herida para ti. Si tu carta gana y es del <b>mismo palo</b>, es un crítico y a tu rival le queda un ataque menos. Ganas el combate si superas la mayoría de los intercambios.</p>
      <h4>Heridas</h4><p>Cada herida resta 1 a Exploración o a Combate. Si cualquiera llega a 0, tu aventurera cae. Las hierbas y la posada curan heridas.</p>
      <h4>Recompensas</h4><p>Un Centinela o Coloso derrotado te da una recompensa y +1 punto. Una persona, 1 Tesoro. Los Tesoros se gastan en las ciudades.</p>
      <h4>La meta</h4><p>Reúne los Fragmentos de Alba (Faros, pistas, Colosos) y sube a la Cumbre para enfrentar a la Noche Larga.</p>
      <p class="nota">Inspirado en el sistema de cartas de <i>Colostle</i>, de Nich Angell. El mundo y los textos de este juego son originales.</p></div>
      <button class="btn sec" data-act="cerrar">Cerrar</button>`;
  }
  return `<div class="velo"><div class="modal ancho">${body}</div></div>`;
}

/* ---------- render principal ---------- */
function render() {
  let h = '';
  if (!S) h = DRAFT ? createScreen() : titleScreen();
  else {
    h = hud();
    h += `<main>`;
    if (S.fase === 'home') h += homeScreen();
    else if (S.fase === 'explore') h += expScreen();
    else if (S.fase === 'combat') h += combatScreen();
    else if (S.fase === 'city') h += cityScreen();
    else if (S.fase === 'dead') h += deadScreen();
    else if (S.fase === 'won') h += wonScreen();
    h += `</main>`;
  }
  h += modalHTML();
  const y = window.scrollY;
  $('#app').innerHTML = h;
  window.scrollTo(0, y);
}

/* ---------- exportar / importar ---------- */
function descargar(nombre, contenido, tipo) {
  const b = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function exportar() {
  if (!S) return;
  const n = S.nombre.replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, '_') || 'partida';
  descargar(`alba-de-ceniza-${n}.json`, JSON.stringify(S, null, 1), 'application/json');
  toast('Copia guardada.');
}
function importarArchivo(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || o.v !== 1 || !o.nombre || !Array.isArray(o.deck)) throw 0;
      S = o; UI.modal = null; DRAFT = null; commit(); toast('Partida importada.');
    } catch (e) { toast('Ese archivo no es una partida válida.'); }
  };
  r.readAsText(file);
}

/* ---------- eventos ---------- */
const ACT = {
  nuevo() { DRAFT = newDraft(); S = null; render(); window.scrollTo(0, 0); },
  atras() { DRAFT = null; render(); },
  continuar() { S = loadSave(); render(); },
  importar() { $('#file').click(); },
  reglas() { UI.modal = { t: 'reglas' }; render(); },
  cerrar() { UI.modal = null; UI.cb = null; commit(); },
  menu() { UI.modal = { t: 'menu' }; render(); },
  ficha() { UI.modal = { t: 'ficha' }; render(); },
  diario() { UI.modal = { t: 'diario' }; render(); },
  titulo() { save(); S = null; UI.modal = null; render(); },
  exportar() { exportar(); },
  exportarTxt() { descargar(`diario-${S.nombre}.txt`, diarioTxt(), 'text/plain'); },
  copiarDiario() { try { navigator.clipboard.writeText(diarioTxt()); toast('Diario copiado.'); } catch (e) { toast('No se pudo copiar.'); } },
  nuevaConfirm() { ask('¿Borrar esta partida y empezar de nuevo?', ['Sí, borrar todo', 'No, volver'], i => { if (i === 0) { try { localStorage.removeItem(KEY); } catch (e) { } S = null; DRAFT = newDraft(); } }, 'Haz antes una copia si quieres conservarla.'); },
  nuevaTrasMuerte() { try { localStorage.removeItem(KEY); } catch (e) { } S = null; DRAFT = newDraft(); render(); window.scrollTo(0, 0); },
  seguir() { S.fase = 'home'; commit(); },
  askPick(d) { const cb = UI.cb; UI.modal = null; UI.cb = null; if (cb) cb(+d.i); commit(); },
  /* creación */
  setClase(d) { DRAFT.clase = +d.i; if (CLASES[DRAFT.clase].id === 'guia' && !DRAFT.compa) DRAFT.compa = COMPANEROS[rnd(COMPANEROS.length)]; render(); },
  sortCompa() { DRAFT.compa = COMPANEROS[rnd(COMPANEROS.length)]; render(); },
  sortLlamado() { const c = tmpCard(); DRAFT.llamado = idxRango(c.r); DRAFT.llamC = RANGOS[c.r] + PALOS[c.s]; render(); },
  sortNat() { const c = tmpCard(); DRAFT.nat = idxRango(c.r); DRAFT.natC = RANGOS[c.r] + PALOS[c.s]; render(); },
  comenzar() { comenzar(); },
  /* capítulo */
  comenzarCap() { comenzarCap(); },
  terminar() { terminar(); },
  accion(d) { accion(+d.ci, +d.ai); },
  repetir(d) { S.exp.cards[+d.ci] = mkExpCard(draw()); marcarDup(); commit(); },
  sacarObjeto() { const it = drawItem(); toast(`Objeto: ${it.n}`); commit(); },
  sacarEvento() { drawEvent(); toast('Evento anotado en el registro.'); commit(); },
  sacarClima() { drawWeather(); toast('Clima anotado en el registro.'); commit(); },
  subirCumbre() { startCombat('final'); },
  /* combate */
  empezarLucha() { empezarLucha(); },
  contra(d) { const k = S.cmb, o = k.opciones[+d.i]; if (!o || o.usada || !k.actual) return; o.usada = true; resolver(o); commit(); },
  sinCartas() { resolver(null); commit(); },
  asignar() {
    const k = S.cmb;
    askWounds(k.porAsignar, () => { k.porAsignar = 0; });
  },
  reclamar() { reclamar(); },
  cerrarCombate() { cerrarCombate(); },
  /* ciudad */
  comprar(d) {
    const it = SHOP.find(x => x.id === d.id); if (!it || S.tesoros < it.p) return;
    S.tesoros -= it.p; S.inv.push({ n: it.n, k: it.k, d: it.d }); logr(`Compras: ${it.n}.`); toast(`Compraste ${it.n}.`); commit();
  },
  vender(d) { const it = S.inv.splice(+d.i, 1)[0]; if (it) { S.tesoros++; logr(`Vendes: ${it.n}.`); } commit(); },
  posada() {
    if (S.tesoros < 1) return;
    curar(() => { S.tesoros--; logr('Descansas en una posada.'); });
  },
  archivo() {
    if (S.tesoros < 1) return;
    S.tesoros--; logr(`Archivo: ${BIBLIO[rnd(BIBLIO.length)]}`); addPista(); toast('Pista anotada.'); commit();
  },
  taller() {
    if (S.tesoros < 4) return;
    gainPoint(() => { S.tesoros -= 4; logr('El herrero mejora tu equipo.'); });
  },
  salirCiudad() { S.city = null; S.fase = 'explore'; commit(); },
  /* ficha */
  usarCura(d) {
    const i = +d.i;
    UI.modal = null;
    const ok = curar(() => { S.inv.splice(i, 1); logr('Usas hierbas curativas.'); });
    if (!ok) { UI.modal = { t: 'ficha' }; render(); }
  },
  tirar(d) { S.inv.splice(+d.i, 1); commit(); }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const f = ACT[b.dataset.act];
  if (f) { e.preventDefault(); f(b.dataset); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.draft && DRAFT) { DRAFT[t.dataset.draft] = t.value; return; }
  if (t.id === 'diario-txt' && S && S.exp) { S.exp.texto = t.value; save(); }
  else if (t.id === 'notas' && S) { S.notas = t.value; save(); }
  else if (t.id === 'epitafio' && S) { S.epitafio = t.value; save(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.draftsel && DRAFT) {
    const f = t.dataset.draftsel;
    DRAFT[f] = t.value === '' ? null : +t.value;
    if (f === 'llamado') DRAFT.llamC = '';
    if (f === 'nat') DRAFT.natC = '';
    render();
  }
  if (t.id === 'file' && t.files[0]) { importarArchivo(t.files[0]); t.value = ''; }
});
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

/* ---------- arranque ---------- */
S = null;
render();
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
