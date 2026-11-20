import * as THREE from 'three';
import { ETICHETTE_CONTINENTI } from '../data/timeline';
import { supercontinenteAttivo } from '../scene/continenti';
import type { Scena } from '../scene/scena';

/**
 * Etichette HTML sovrapposte al globo: continenti attuali (solo quando la geografia è quella reale),
 * supercontinenti (quando il modello ne rileva uno), Luna e Sole.
 */
export class Etichette {
  private voci = new Map<string, HTMLDivElement>();
  visibili = true;

  constructor(private contenitore: HTMLElement, private scena: Scena) {}

  private elemento(chiave: string, testo: string, classe: string): HTMLDivElement {
    let e = this.voci.get(chiave);
    if (!e) {
      e = document.createElement('div');
      e.className = `etichetta ${classe}`;
      this.contenitore.append(e);
      this.voci.set(chiave, e);
    }
    if (e.textContent !== testo) e.textContent = testo;
    return e;
  }

  private mostra(chiave: string, testo: string, classe: string, x: number, y: number, opacita: number): void {
    const e = this.elemento(chiave, testo, classe);
    e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    e.style.opacity = String(Math.max(0, Math.min(1, opacita)));
    e.style.display = 'block';
  }

  private nascondiTutte(): void { this.voci.forEach((e) => { e.style.display = 'none'; }); }

  aggiorna(ma: number, lunaPresente: boolean): void {
    if (!this.visibili) { this.nascondiTutte(); return; }
    const usate = new Set<string>();
    const mostraSe = (chiave: string, testo: string, classe: string, p: { x: number; y: number }, opacita = 1) => {
      usate.add(chiave);
      this.mostra(chiave, testo, classe, p.x, p.y, opacita);
    };

    // Continenti attuali: solo se la mappa mostrata è quella reale E l'epoca è l'attuale (la geografia cambia in pochi Ma:
    // 5 Ma è un limite approssimato, scelta di resa). Con mappe paleogeografiche i nomi odierni sarebbero fuorvianti.
    const peso = this.scena.pesoMappeReali(ma) * (ma < 5 ? 1 : 0);
    if (peso > 0.85) {
      for (const c of ETICHETTE_CONTINENTI) {
        const phi = (c.lon + 180) * Math.PI / 180, lat = c.lat * Math.PI / 180;
        const dir = new THREE.Vector3(-Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
        const p = this.scena.proiettaPianeta(dir);
        if (p.fronte > 0.25) mostraSe(`c-${c.nome}`, c.nome, 'continente', p, Math.min((p.fronte - 0.25) * 3, 1) * (peso - 0.85) / 0.15);
      }
    }
    // Supercontinente
    const sc = supercontinenteAttivo(ma);
    if (sc) {
      const p = this.scena.proiettaPianeta(sc.centro);
      if (p.fronte > 0.2) mostraSe(`s-${sc.nome}`, sc.ipotesi ? `${sc.nome} (ipotesi)` : sc.nome, 'super', p, Math.min((p.fronte - 0.2) * 3, 1));
    }
    // Luna e Sole
    if (lunaPresente) {
      const l = this.scena.proiettaLuna();
      if (l) mostraSe('luna', 'Luna', 'corpo', { x: l.x, y: l.y - 34 });
    }
    const s = this.scena.proiettaSole();
    if (s) mostraSe('sole', 'Sole', 'corpo', { x: s.x, y: s.y + 42 });

    this.voci.forEach((e, k) => { if (!usate.has(k)) e.style.display = 'none'; });
  }
}
