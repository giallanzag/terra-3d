import { EONI, ERE, PERIODI, EVENTI, type Intervallo, type Confidenza } from '../data/timeline';
import { calcolaStato, type Stima, type StatoTerra } from '../state/stato';
import { maAPosizione, posizioneAMa, type ModoScala } from '../state/scala';
import type { Tempo } from '../state/tempo';
import { formattaMa } from './formato';

const NS = 'http://www.w3.org/2000/svg';
const LARGH = 280;
const ALT = 64;
const CAMPIONI = 160;

const fmt = (x: number, d = 1) => x.toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** Formatta una stima con il suo intervallo, se significativo. */
function conIntervallo(s: Stima, d: number, unita: string): string {
  const largo = (s.max - s.min) > Math.max(Math.abs(s.v) * 0.04, 10 ** -d);
  return largo
    ? `${fmt(s.v, d)} ${unita} <span class="inc">(${fmt(s.min, d)}–${fmt(s.max, d)})</span>`
    : `${fmt(s.v, d)} ${unita}`;
}

/** Valutazione qualitativa dell'incertezza relativa di una stima. */
function badgeIncertezza(s: Stima): string {
  const rel = (s.max - s.min) / Math.max(Math.abs(s.v), 1e-9);
  if (rel > 0.5) return '<span class="badge molto">stima molto incerta</span>';
  if (rel > 0.12) return '<span class="badge">stima incerta</span>';
  return '';
}

const ETICHETTA_CONF: Record<Confidenza, string> = { alta: 'datazione solida', media: 'datazione incerta', bassa: 'ipotesi dibattuta' };

/** Pannello informativo: periodo, data, parametri del pianeta, mini grafico di O₂ e CO₂ e descrizione dell'evento più vicino. */
export class Pannello {
  private campi = new Map<string, HTMLElement>();
  private cursori: SVGLineElement[] = [];
  private modoGrafici: ModoScala | null = null;
  private grafici!: HTMLElement;

  constructor(private el: HTMLElement, private tempo: Tempo) {
    this.costruisci();
  }

  private costruisci(): void {
    this.el.innerHTML = `
      <button class="comprimi" aria-label="Comprimi il pannello" aria-expanded="true" title="Comprimi / espandi">▾</button>
      <div class="data" data-k="data"></div>
      <div class="unita" data-k="eone"></div>
      <div class="unita" data-k="era"></div>
      <div class="unita" data-k="periodo"></div>
      <div class="corpo">
      <div class="continenti" data-k="continenti"></div>
      <h2 data-k="evento"></h2>
      <p data-k="testo"></p>
      <small data-k="fonte"></small>
      <dl class="dati">
        <dt>Durata del giorno</dt><dd data-k="giorno"></dd>
        <dt>Giorni per anno</dt><dd data-k="anno"></dd>
        <dt>Sole (luminosità)</dt><dd data-k="sole"></dd>
        <dt>Distanza della Luna</dt><dd data-k="luna"></dd>
        <dt>Mese lunare</dt><dd data-k="mese"></dd>
        <dt>Livello del mare</dt><dd data-k="mare"></dd>
        <dt>Pressione atmosferica</dt><dd data-k="pressione"></dd>
        <dt>Ghiacci oltre</dt><dd data-k="ghiaccio"></dd>
      </dl>
      <div class="grafici" data-k="grafici"></div>
      </div>`;
    this.el.querySelectorAll<HTMLElement>('[data-k]').forEach((n) => this.campi.set(n.dataset.k!, n));
    this.grafici = this.campi.get('grafici')!;
    const btn = this.el.querySelector<HTMLButtonElement>('.comprimi')!;
    // Su schermi stretti parte compresso: il globo resta in primo piano
    if (window.innerWidth < 900) this.imposta_compresso(true);
    btn.addEventListener('click', () => this.imposta_compresso(!this.el.classList.contains('compresso')));
  }

  imposta_compresso(c: boolean): void {
    this.el.classList.toggle('compresso', c);
    const b = this.el.querySelector<HTMLButtonElement>('.comprimi');
    if (b) { b.setAttribute('aria-expanded', String(!c)); b.textContent = c ? '▸' : '▾'; }
  }

  private imposta(k: string, html: string): void {
    const n = this.campi.get(k);
    if (n && n.innerHTML !== html) n.innerHTML = html;
  }

  private unita(i: Intervallo | undefined, etichetta: string): string {
    return i ? `<i style="background:${i.colore}"></i>${etichetta}: <b>${i.nome}</b>` : '';
  }

  /** `pesoMappe`: 1 = geografia reale, 0 = continenti procedurali (illustrativi) */
  aggiorna(s: StatoTerra, pesoMappe = 0): void {
    const trova = (lista: Intervallo[]) => lista.find((i) => s.ma <= i.daMa && s.ma > i.aMa) ?? lista[lista.length - 1]!;
    this.imposta('data', formattaMa(s.ma));
    this.imposta('eone', this.unita(trova(EONI), 'Eone'));
    this.imposta('era', this.unita(trova(ERE), 'Era'));
    this.imposta('periodo', s.ma <= 2500 ? this.unita(trova(PERIODI), 'Periodo') : '');

    this.imposta('giorno', `${conIntervallo(s.durataGiornoOre, 1, 'ore')} ${badgeIncertezza(s.durataGiornoOre)}`);
    this.imposta('anno', `${fmt(s.giorniPerAnno, 0)}`);
    this.imposta('sole', `${fmt(s.luminositaSole * 100, 0)}% di quella attuale`);
    this.imposta('mese', s.lunaPresente <= 0 ? '—' : `${fmt(s.meseLunareGiorni, 1)} giorni`);
    this.imposta('luna', s.lunaPresente <= 0 ? 'non ancora formata' : `${fmt(s.distanzaLunaRT.v, 1)} raggi terrestri <span class="inc">(${fmt(s.distanzaLunaKm / 1000, 0)}×10³ km)</span> ${badgeIncertezza(s.distanzaLunaRT)}`);
    this.imposta('mare', s.ma > 540 ? 'non vincolato' : `${s.livelloMareM.v >= 0 ? '+' : ''}${fmt(s.livelloMareM.v, 0)} m`);
    this.imposta('pressione', `${fmt(s.pressioneBar, s.pressioneBar < 10 ? 2 : 0)} bar`);
    this.imposta('ghiaccio', s.latitudineGhiaccio >= 89 ? 'nessun ghiaccio permanente' : `${fmt(s.latitudineGhiaccio, 0)}° di latitudine`);

    this.imposta('continenti', pesoMappe > 0.95
      ? '<span class="badge c-alta">continenti: geografia reale</span>'
      : pesoMappe > 0.05 ? '<span class="badge">continenti: transizione tra dati reali e modello</span>'
      : '<span class="badge molto">continenti: modello illustrativo</span>');
    this.aggiornaGrafici(s);

    // Evento più vicino nella barra, non solo in Ma: coerente con ciò che l'utente vede sullo slider
    const pos = maAPosizione(s.ma, this.tempo.modo);
    const e = EVENTI.reduce((a, b) =>
      Math.abs(maAPosizione(b.ma, this.tempo.modo) - pos) < Math.abs(maAPosizione(a.ma, this.tempo.modo) - pos) ? b : a);
    this.imposta('evento', `${e.nome} <span class="badge c-${e.confidenza}">${ETICHETTA_CONF[e.confidenza]}</span>`);
    this.imposta('testo', e.testo);
    const inc = e.incertezzaMa !== undefined ? ` (± ${fmt(e.incertezzaMa, e.incertezzaMa < 1 ? 3 : 0)} Ma)` : '';
    this.imposta('fonte', `${formattaMa(e.ma)}${inc} · Fonti: ${e.fonte}`);
  }

  // ── mini grafici O₂ e CO₂ ───────────────────────────────────────────────

  private aggiornaGrafici(s: StatoTerra): void {
    if (this.modoGrafici !== this.tempo.modo) this.costruisciGrafici(this.tempo.modo);
    const x = maAPosizione(s.ma, this.tempo.modo) * LARGH;
    for (const c of this.cursori) { c.setAttribute('x1', String(x)); c.setAttribute('x2', String(x)); }
    this.grafici.querySelector('[data-v="o2"]')!.textContent = `${fmt(s.ossigenoPct.v, s.ossigenoPct.v < 1 ? 2 : 0)}%`;
    this.grafici.querySelector('[data-v="co2"]')!.textContent = `${fmt(s.co2Ppm.v, 0)} ppm`;
  }

  private costruisciGrafici(modo: ScalaModo): void {
    this.modoGrafici = modo;
    this.cursori = [];
    this.grafici.innerHTML = '';
    // Campioniamo lo stato lungo la barra, così i grafici hanno la stessa scala della timeline
    const campioni = Array.from({ length: CAMPIONI }, (_, i) => calcolaStato(posizioneAMa(i / (CAMPIONI - 1), modo)));
    this.grafici.append(
      this.grafico('o2', 'Ossigeno (O₂)', campioni, (s) => s.ossigenoPct, (v) => v / 35, '#7fd1ae'),
      // CO₂ in scala logaritmica: da 100 ppm a 10⁶ ppm
      this.grafico('co2', 'Anidride carbonica (CO₂, scala log.)', campioni, (s) => s.co2Ppm, (v) => (Math.log10(Math.max(v, 100)) - 2) / 4, '#e6a65c'),
    );
  }

  private grafico(id: string, titolo: string, campioni: StatoTerra[], g: (s: StatoTerra) => Stima, norm: (v: number) => number, colore: string): HTMLElement {
    const box = document.createElement('div');
    const y = (v: number) => ALT - 2 - Math.min(Math.max(norm(v), 0), 1) * (ALT - 6);
    const pt = (i: number, v: number) => `${((i / (CAMPIONI - 1)) * LARGH).toFixed(1)},${y(v).toFixed(1)}`;
    const alto = campioni.map((c, i) => pt(i, g(c).max));
    const basso = campioni.map((c, i) => pt(i, g(c).min)).reverse();
    const linea = campioni.map((c, i) => pt(i, g(c).v));
    box.innerHTML = `<div class="gtit"><span>${titolo}</span><b data-v="${id}"></b></div>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${LARGH} ${ALT}`);
    svg.setAttribute('class', 'grafico');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Andamento di ${titolo} nel tempo`);
    const fascia = document.createElementNS(NS, 'polygon');
    fascia.setAttribute('points', [...alto, ...basso].join(' '));
    fascia.setAttribute('fill', colore);
    fascia.setAttribute('opacity', '0.25'); // la fascia rappresenta l'incertezza
    const l = document.createElementNS(NS, 'polyline');
    l.setAttribute('points', linea.join(' '));
    l.setAttribute('fill', 'none');
    l.setAttribute('stroke', colore);
    l.setAttribute('stroke-width', '1.6');
    const cur = document.createElementNS(NS, 'line');
    cur.setAttribute('y1', '0'); cur.setAttribute('y2', String(ALT));
    cur.setAttribute('stroke', '#fff'); cur.setAttribute('stroke-width', '1');
    this.cursori.push(cur);
    svg.append(fascia, l, cur);
    box.append(svg);
    return box;
  }
}

type ScalaModo = ModoScala;
