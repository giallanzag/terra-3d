import * as THREE from 'three';

/**
 * Gestione delle mappe terra/mare per singoli istanti, con dissolvenza tra una e l'altra.
 *
 * Formato di una mappa: texture equirettangolare (u = longitudine −180…+180°, v = latitudine +90…−90°) con
 *   R = maschera terra (1) / mare (0) nitida
 *   G = maschera sfocata (σ ≈ 1,4°), usata per piattaforme continentali e variazioni del livello del mare
 *   B = maschera molto sfocata (σ ≈ 7°), usata come "continentalità" (interno dei continenti)
 * Il file fornito per l'oggi (src/assets/terre_oggi.png) è generato da Natural Earth (pubblico dominio).
 * Le mappe paleogeografiche (es. PALEOMAP di C. R. Scotese, GPlates) si aggiungono con `aggiungi()` dopo averne
 * verificata la licenza e averle convertite in questo formato: vedi README.
 *
 * Fuori dall'intervallo coperto dalle mappe disponibili, l'aspetto sfuma gradualmente nei continenti procedurali
 * (vedi scene/continenti.ts) lungo `FINESTRA_DISSOLVENZA_MA`.
 */

export const FINESTRA_DISSOLVENZA_MA = 60; // valore approssimato: scelta di resa visiva

export interface VoceMappa {
  /** Epoca rappresentata, Ma fa */
  ma: number;
  texture: THREE.Texture;
  /** Etichetta e fonte, mostrabili nell'interfaccia */
  fonte: string;
}

export interface SelezioneMappe {
  a: THREE.Texture;
  b: THREE.Texture;
  /** 0 = solo A, 1 = solo B */
  mix: number;
  /** 0 = solo procedurale, 1 = solo mappe reali */
  pesoMappe: number;
}

export class GestoreMappeTerre {
  private voci: VoceMappa[] = [];
  private vuota: THREE.DataTexture;

  constructor() {
    this.vuota = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
    this.vuota.needsUpdate = true;
  }

  /** Aggiunge (o sostituisce) la mappa di un istante. */
  aggiungi(voce: VoceMappa): void {
    voce.texture.wrapS = THREE.RepeatWrapping;
    voce.texture.wrapT = THREE.ClampToEdgeWrapping;
    voce.texture.minFilter = THREE.LinearFilter;
    voce.texture.magFilter = THREE.LinearFilter;
    voce.texture.generateMipmaps = false;
    voce.texture.colorSpace = THREE.NoColorSpace; // sono dati, non colori
    this.voci = this.voci.filter((v) => v.ma !== voce.ma);
    this.voci.push(voce);
    this.voci.sort((x, y) => y.ma - x.ma); // dal più antico al più recente
  }

  get numero(): number { return this.voci.length; }

  /** Quali mappe usare a `ma` e con quali pesi. */
  seleziona(ma: number): SelezioneMappe {
    if (this.voci.length === 0) return { a: this.vuota, b: this.vuota, mix: 0, pesoMappe: 0 };
    const primo = this.voci[0]!;
    const ultimo = this.voci[this.voci.length - 1]!;
    // Dissolvenza verso il procedurale fuori dall'intervallo coperto
    const fuori = ma > primo.ma ? ma - primo.ma : ma < ultimo.ma ? ultimo.ma - ma : 0;
    const x = Math.min(fuori / FINESTRA_DISSOLVENZA_MA, 1);
    const pesoMappe = 1 - x * x * (3 - 2 * x);
    if (ma >= primo.ma) return { a: primo.texture, b: primo.texture, mix: 0, pesoMappe };
    if (ma <= ultimo.ma) return { a: ultimo.texture, b: ultimo.texture, mix: 0, pesoMappe };
    for (let i = 0; i < this.voci.length - 1; i++) {
      const a = this.voci[i]!;
      const b = this.voci[i + 1]!;
      if (ma <= a.ma && ma >= b.ma) {
        const t = (a.ma - ma) / (a.ma - b.ma);
        return { a: a.texture, b: b.texture, mix: t * t * (3 - 2 * t), pesoMappe: 1 };
      }
    }
    return { a: ultimo.texture, b: ultimo.texture, mix: 0, pesoMappe };
  }
}
