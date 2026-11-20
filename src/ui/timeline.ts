import { ERE, EONI, PERIODI, EVENTI, type Intervallo } from '../data/timeline';
import { maAPosizione } from '../state/scala';
import type { Tempo } from '../state/tempo';
import { formattaMa } from './formato';

const VELOCITA = [0.25, 0.5, 1, 2, 4, 8];

/** Barra del tempo: slider, bande ICS, marcatori degli eventi, controlli di riproduzione. */
export class BarraTempo {
  private slider!: HTMLInputElement;
  private bande!: HTMLDivElement;
  private marcatori!: HTMLDivElement;
  private etichetta!: HTMLSpanElement;
  private btnPlay!: HTMLButtonElement;
  private btnModo!: HTMLButtonElement;

  constructor(private radice: HTMLElement, private tempo: Tempo) {
    this.costruisci();
    this.ridisegnaBande();
    tempo.iscrivi(() => this.sincronizza());
    window.addEventListener('resize', () => this.adattaEtichette());
    this.sincronizza();
  }

  private costruisci(): void {
    this.radice.innerHTML = `
      <div class="controlli">
        <button id="btn-prec" title="Evento precedente" aria-label="Evento precedente">⏮</button>
        <button id="btn-play" title="Riproduci / pausa" aria-label="Riproduci">▶</button>
        <button id="btn-succ" title="Evento successivo" aria-label="Evento successivo">⏭</button>
        <label class="vel">Velocità
          <select id="sel-vel">${VELOCITA.map((v) => `<option value="${v}"${v === 1 ? ' selected' : ''}>${v}×</option>`).join('')}</select>
        </label>
        <span id="etichetta-tempo" class="etichetta-tempo"></span>
        <button id="btn-modo" class="modo" title="Cambia scala della barra"></button>
      </div>
      <div class="contenitore-barra">
        <div class="marcatori" id="marcatori"></div>
        <input id="slider" type="range" min="0" max="10000" step="1" value="0" aria-label="Tempo geologico" />
        <div class="bande" id="bande"></div>
      </div>`;
    this.slider = this.radice.querySelector('#slider')!;
    this.bande = this.radice.querySelector('#bande')!;
    this.marcatori = this.radice.querySelector('#marcatori')!;
    this.etichetta = this.radice.querySelector('#etichetta-tempo')!;
    this.btnPlay = this.radice.querySelector('#btn-play')!;
    this.btnModo = this.radice.querySelector('#btn-modo')!;

    this.slider.addEventListener('input', () => {
      // Leggo il valore PRIMA di fermare la riproduzione: imposta() notifica e risincronizza lo slider
      const pos = Number(this.slider.value) / 10000;
      this.tempo.imposta(false);
      this.tempo.impostaPosizione(pos);
    });
    this.btnPlay.addEventListener('click', () => this.tempo.imposta(!this.tempo.inRiproduzione));
    this.btnModo.addEventListener('click', () => {
      this.tempo.impostaModo(this.tempo.modo === 'lineare' ? 'compressa' : 'lineare');
      this.ridisegnaBande();
    });
    this.radice.querySelector<HTMLSelectElement>('#sel-vel')!.addEventListener('change', (e) => {
      this.tempo.velocita = Number((e.target as HTMLSelectElement).value);
    });
    this.radice.querySelector('#btn-prec')!.addEventListener('click', () => this.saltaEvento(-1));
    this.radice.querySelector('#btn-succ')!.addEventListener('click', () => this.saltaEvento(1));
  }

  /** Salta all'evento successivo (+1, verso il presente) o precedente (−1). */
  saltaEvento(verso: 1 | -1): void {
    this.tempo.imposta(false);
    const eps = 0.01;
    const ordinati = [...EVENTI].sort((a, b) => b.ma - a.ma); // dal più antico al più recente
    const cur = this.tempo.ma;
    const prossimo = verso === 1
      ? ordinati.find((e) => e.ma < cur - eps)
      : [...ordinati].reverse().find((e) => e.ma > cur + eps);
    if (prossimo) this.tempo.impostaMa(prossimo.ma);
  }

  private banda(i: Intervallo, classe: string): string {
    const a = maAPosizione(i.daMa, this.tempo.modo) * 100;
    const b = maAPosizione(i.aMa, this.tempo.modo) * 100;
    return `<div class="banda ${classe}" style="left:${a}%;width:${b - a}%;background:${i.colore}" title="${i.nome}: ${i.daMa} – ${i.aMa} Ma"><span>${i.nome}</span></div>`;
  }

  /** Va richiamata quando cambia la scala, perché le posizioni delle bande cambiano. */
  private ridisegnaBande(): void {
    this.bande.innerHTML =
      `<div class="riga">${EONI.map((e) => this.banda(e, 'eone')).join('')}</div>` +
      `<div class="riga">${ERE.map((e) => this.banda(e, 'era')).join('')}</div>` +
      `<div class="riga">${PERIODI.map((e) => this.banda(e, 'periodo')).join('')}</div>`;
    this.marcatori.innerHTML = EVENTI.map((e) => {
      const x = maAPosizione(e.ma, this.tempo.modo) * 100;
      return `<button class="marcatore t-${e.tipo}" style="left:${x}%" data-ma="${e.ma}" title="${e.nome} (${formattaMa(e.ma)})" aria-label="${e.nome}"></button>`;
    }).join('');
    // Nasconde le etichette troppo larghe per la propria banda (altrimenti si sovrappongono)
    requestAnimationFrame(() => this.adattaEtichette());
    this.marcatori.querySelectorAll<HTMLButtonElement>('.marcatore').forEach((b) =>
      b.addEventListener('click', () => { this.tempo.imposta(false); this.tempo.impostaMa(Number(b.dataset.ma)); }));
  }

  private adattaEtichette(): void {
    this.bande.querySelectorAll<HTMLElement>('.banda').forEach((b) => {
      const span = b.firstElementChild as HTMLElement | null;
      if (span) span.style.visibility = span.scrollWidth > b.clientWidth - 6 ? 'hidden' : 'visible';
    });
  }

  private sincronizza(): void {
    this.slider.value = String(Math.round(this.tempo.posizione * 10000));
    this.etichetta.textContent = formattaMa(this.tempo.ma);
    this.btnPlay.textContent = this.tempo.inRiproduzione ? '⏸' : '▶';
    this.btnPlay.setAttribute('aria-label', this.tempo.inRiproduzione ? 'Pausa' : 'Riproduci');
    this.btnModo.textContent = this.tempo.modo === 'compressa' ? 'Scala: compressa' : 'Scala: lineare';
  }
}
