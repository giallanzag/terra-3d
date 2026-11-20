import './stile.css';
import { Scena } from './scene/scena';
import { Tempo } from './state/tempo';
import { calcolaStato } from './state/stato';
import { BarraTempo } from './ui/timeline';
import { Pannello } from './ui/pannello';
import { PannelloLayer } from './ui/layer';
import { Etichette } from './ui/etichette';
import { Tour } from './ui/tour';
import { creaBenvenuto, creaInformazioni } from './ui/schede';
import { caricaImpostazioni, salvaImpostazioni } from './ui/impostazioni';
import { verificaDati } from './data/validazione';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// In sviluppo controlliamo la coerenza dei dati (ordine, intervalli, fonti)
if (import.meta.env.DEV) {
  const errori = verificaDati();
  if (errori.length) console.error('Dati non coerenti:\n' + errori.join('\n'));
}

let scena: Scena;
try {
  scena = new Scena($<HTMLCanvasElement>('#scena'));
} catch {
  // WebGL non disponibile: messaggio comprensibile al posto di una pagina nera
  $('#errore').hidden = false;
  throw new Error('WebGL non disponibile');
}

const tempo = new Tempo();
const imp = caricaImpostazioni();
const barra = new BarraTempo($('#barra-tempo'), tempo);
const pannello = new Pannello($('#pannello'), tempo);
const etichette = new Etichette($('#etichette'), scena);

// ── impostazioni e layer ───────────────────────────────────────────────────
const applica = (): void => {
  scena.impostaNuvole(imp.nuvole);
  scena.impostaAtmosfera(imp.atmosfera);
  scena.impostaGhiacci(imp.ghiacci);
  scena.impostaLuna(imp.luna);
  scena.impostaRotazionePianeta(imp.rotazionePianeta);
  scena.impostaRotazioneAutomatica(imp.rotazioneCamera || tour.inCorso);
  scena.impostaQualita(imp.qualita);
  etichette.visibili = imp.etichette;
};
const layer = new PannelloLayer($('#layer'), imp, () => { salvaImpostazioni(imp); applica(); });

// ── tour guidato ───────────────────────────────────────────────────────────
const tour: Tour = new Tour($('#tour'), tempo, (attivo) => {
  document.body.classList.toggle('in-tour', attivo);
  if (attivo) pannello.imposta_compresso(true);
  // La scheda del tour occupa la parte bassa: il globo sale (più su telefono, dove la scheda è più alta)
  scena.impostaSpostamentoVerticale(attivo ? (window.innerWidth < 720 ? 0.2 : 0.14) : 0);
  applica();
});

// ── schede ─────────────────────────────────────────────────────────────────
const info = creaInformazioni($('#info'));
creaBenvenuto($('#benvenuto'), () => tour.avvia(), () => undefined);
// Per test e link diretti: ?senza-intro nasconde il benvenuto
if (new URLSearchParams(location.search).has('senza-intro')) $('#benvenuto').hidden = true;

$('#btn-tour').addEventListener('click', () => tour.alterna());
$('#btn-info').addEventListener('click', () => info.apri());
$('#btn-layer').addEventListener('click', () => {
  const el = $('#layer');
  el.hidden = !el.hidden;
  $('#btn-layer').setAttribute('aria-expanded', String(!el.hidden));
  if (!el.hidden) layer.sincronizza();
});

// ── scorciatoie da tastiera ────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('select, input[type=checkbox]') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!$('#benvenuto').hidden) return;
  if (e.key === 'Escape') {
    if (!$('#info').hidden) $('#info').hidden = true;
    else if (tour.inCorso) tour.ferma();
    return;
  }
  const suBottone = t.tagName === 'BUTTON';
  if (e.key === ' ' && !suBottone) { e.preventDefault(); tour.ferma(); tempo.imposta(!tempo.inRiproduzione); }
  else if (e.key.toLowerCase() === 'n') { tour.ferma(); barra.saltaEvento(1); }
  else if (e.key.toLowerCase() === 'p') { tour.ferma(); barra.saltaEvento(-1); }
  else if (e.key.toLowerCase() === 't') tour.alterna();
});

// Il pannello si aggiorna solo quando il tempo cambia (non a ogni frame)
let sporco = true;
tempo.iscrivi(() => { sporco = true; });

applica();
let ultimo = performance.now();
function ciclo(now: number): void {
  const dtReale = (now - ultimo) / 1000;
  const dt = Math.min(dtReale, 0.1); // limita i salti dopo tab in background
  ultimo = now;
  tempo.aggiorna(dt);
  tour.aggiorna(dt);
  const stato = calcolaStato(tempo.ma);
  if (sporco) { pannello.aggiorna(stato, scena.pesoMappeReali(stato.ma)); sporco = false; }
  scena.disegna(stato, dt, tempo.posizione, tempo.inVolo, dtReale);
  etichette.aggiorna(stato.ma, stato.lunaPresente > 0);
  requestAnimationFrame(ciclo);
}
requestAnimationFrame(ciclo);

// Aggancio per i test automatici (solo in sviluppo)
if (import.meta.env.DEV) (window as unknown as { __terra: unknown }).__terra = { scena, tempo, tour };
