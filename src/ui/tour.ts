import { EVENTI, type Evento } from '../data/timeline';
import type { Tempo } from '../state/tempo';
import { formattaMa } from './formato';

const ETICHETTA_CONF = { alta: 'datazione solida', media: 'datazione incerta', bassa: 'ipotesi dibattuta' } as const;

/**
 * Tour guidato: attraversa gli eventi principali (quelli con `tour: true` in data/timeline.ts), con un viaggio
 * fluido tra uno e l'altro, una scheda esplicativa e avanzamento automatico (pausabile).
 */
export class Tour {
  private passi: Evento[];
  private indice = -1;
  private attivo = false;
  private inPausa = false;
  private timer = 0;           // secondi trascorsi sul passo corrente
  private durata = 10;
  private atterrato = false;

  constructor(private el: HTMLElement, private tempo: Tempo, private alCambioStato: (attivo: boolean) => void) {
    // Dal più antico al più recente
    this.passi = EVENTI.filter((e) => e.tour).sort((a, b) => b.ma - a.ma);
    this.el.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-az]');
      if (!b) return;
      const az = b.dataset.az;
      if (az === 'prec') this.vai(this.indice - 1);
      else if (az === 'succ') this.vai(this.indice + 1);
      else if (az === 'pausa') { this.inPausa = !this.inPausa; this.disegna(); }
      else if (az === 'esci') this.ferma();
    });
  }

  get inCorso(): boolean { return this.attivo; }

  avvia(): void {
    this.attivo = true;
    this.inPausa = false;
    this.alCambioStato(true);
    this.vai(0);
  }

  ferma(): void {
    this.attivo = false;
    this.el.hidden = true;
    this.tempo.annullaVolo();
    this.alCambioStato(false);
  }

  alterna(): void { if (this.attivo) this.ferma(); else this.avvia(); }

  private vai(i: number): void {
    if (i < 0) i = 0;
    if (i >= this.passi.length) { this.ferma(); return; }
    this.indice = i;
    const e = this.passi[i]!;
    this.timer = 0;
    this.atterrato = false;
    // Tempo di lettura: base + ~45 ms per carattere; più lungo se l'evento ha un effetto da guardare
    this.durata = 7 + e.testo.length * 0.045 + (e.effetto ? 4 : 0);
    this.tempo.viaggia(e.ma, 1.6);
    this.disegna();
  }

  private disegna(): void {
    const e = this.passi[this.indice]!;
    this.el.hidden = false;
    const inc = e.incertezzaMa !== undefined ? ` (± ${e.incertezzaMa.toLocaleString('it-IT', { maximumFractionDigits: e.incertezzaMa < 1 ? 3 : 0 })} Ma)` : '';
    this.el.innerHTML = `
      <div class="tour-testa">
        <span class="tour-passo">Tappa ${this.indice + 1} di ${this.passi.length}</span>
        <span class="badge c-${e.confidenza}">${ETICHETTA_CONF[e.confidenza]}</span>
      </div>
      <h2>${e.nome}</h2>
      <div class="tour-data">${formattaMa(e.ma)}${inc}</div>
      <p>${e.testo}</p>
      <small>Fonti: ${e.fonte}</small>
      <div class="tour-barra"><i style="width:${(this.indice / (this.passi.length - 1)) * 100}%"></i></div>
      <div class="tour-bottoni">
        <button data-az="prec" aria-label="Tappa precedente" ${this.indice === 0 ? 'disabled' : ''}>◀</button>
        <button data-az="pausa" aria-label="${this.inPausa ? 'Riprendi' : 'Pausa'}">${this.inPausa ? '▶' : '⏸'}</button>
        <button data-az="succ" aria-label="Tappa successiva">▶▶</button>
        <button data-az="esci" class="esci">Esci dal tour</button>
      </div>`;
  }

  /** Da chiamare a ogni frame con il tempo reale trascorso. */
  aggiorna(dt: number): void {
    if (!this.attivo || this.inPausa) return;
    if (!this.atterrato) {
      if (!this.tempo.inVolo) this.atterrato = true;   // il tempo conta dalla fine del viaggio
      return;
    }
    this.timer += dt;
    const barra = this.el.querySelector<HTMLElement>('.tour-barra i');
    if (barra) {
      const base = (this.indice / (this.passi.length - 1)) * 100;
      const passo = (1 / (this.passi.length - 1)) * 100;
      barra.style.width = `${base + passo * Math.min(this.timer / this.durata, 1)}%`;
    }
    if (this.timer >= this.durata) this.vai(this.indice + 1);
  }
}
