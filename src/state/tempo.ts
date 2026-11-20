import { ETA_TERRA_MA } from '../data/timeline';
import { maAPosizione, posizioneAMa, type ModoScala } from './scala';

type Ascoltatore = () => void;

/** Stato del tempo corrente: posizione, modalità di scala, riproduzione. */
export class Tempo {
  /** Ma fa corrente (4540 … 0) */
  ma = ETA_TERRA_MA;
  modo: ModoScala = 'compressa';
  inRiproduzione = false;
  /** Moltiplicatore di velocità. 1× = percorso completo in 60 s sulla barra */
  velocita = 1;
  /** True mentre un "viaggio" animato è in corso: gli effetti degli eventi attraversati non scattano */
  inVolo = false;
  private volo: { da: number; a: number; t: number; durata: number; maFinale: number } | null = null;
  private ascoltatori = new Set<Ascoltatore>();

  iscrivi(f: Ascoltatore): void {
    this.ascoltatori.add(f);
  }

  private notifica(): void {
    this.ascoltatori.forEach((f) => f());
  }

  get posizione(): number {
    return maAPosizione(this.ma, this.modo);
  }

  impostaMa(ma: number): void {
    if (this.volo) this.annullaVolo();   // un intervento manuale interrompe il viaggio
    this.ma = Math.min(Math.max(ma, 0), ETA_TERRA_MA);
    this.notifica();
  }

  impostaPosizione(pos: number): void {
    this.impostaMa(posizioneAMa(pos, this.modo));
  }

  impostaModo(modo: ModoScala): void {
    this.modo = modo; // `ma` resta invariato: cambia solo la mappatura della barra
    this.notifica();
  }

  /** Viaggio animato verso `ma` (scorrimento fluido della barra, con accelerazione e frenata). */
  viaggia(ma: number, durataS = 1.4): void {
    this.inRiproduzione = false;
    const a = maAPosizione(Math.min(Math.max(ma, 0), ETA_TERRA_MA), this.modo);
    if (Math.abs(a - this.posizione) < 1e-6) { this.impostaMa(ma); return; }
    this.volo = { da: this.posizione, a, t: 0, durata: durataS, maFinale: ma };
    this.inVolo = true;
    this.notifica();
  }

  /** Interrompe un eventuale viaggio in corso */
  annullaVolo(): void {
    if (this.volo) { this.volo = null; this.inVolo = false; }
  }

  imposta(inRiproduzione: boolean): void {
    if (inRiproduzione) this.annullaVolo();
    // Se si preme play alla fine, si riparte dall'inizio
    if (inRiproduzione && this.ma <= 0) this.ma = ETA_TERRA_MA;
    this.inRiproduzione = inRiproduzione;
    this.notifica();
  }

  /** Avanza il tempo; `dt` in secondi reali. Va chiamato a ogni frame. */
  aggiorna(dt: number): void {
    if (this.volo) {
      const v = this.volo;
      v.t += dt;
      const x = Math.min(v.t / v.durata, 1);
      const e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; // easeInOutQuad
      if (x >= 1) {
        this.volo = null;
        this.inVolo = false;
        this.impostaMa(v.maFinale);       // atterraggio esatto sulla data dell'evento
      } else {
        this.ma = posizioneAMa(v.da + (v.a - v.da) * e, this.modo);
        this.notifica();
      }
      return;
    }
    if (!this.inRiproduzione) return;
    const pos = this.posizione + (dt * this.velocita) / 60;
    if (pos >= 1) {
      this.ma = 0;
      this.inRiproduzione = false;
    } else {
      this.ma = posizioneAMa(pos, this.modo);
    }
    this.notifica();
  }
}
