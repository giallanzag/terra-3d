import { DISTANZA_LUNA_OGGI_RT } from '../data/timeline';
import type { StatoTerra } from '../state/stato';

/**
 * Relazioni tra i parametri fisici dello stato e la loro resa visiva. Tutto qui è SCELTA DI RAPPRESENTAZIONE:
 * le proporzioni reali (Luna a 60 raggi terrestri, piccolissima) renderebbero la Luna invisibile.
 */

/** Raggio visivo della Luna nella scena (la Terra ha raggio 1). Reale: 0,27 (ma a 60 R⊕ sarebbe un puntino). */
export const RAGGIO_LUNA_SCENA = 0.16;

/**
 * Distanza della Luna dal centro della Terra, nella scena. Compressa: 4,5 R⊕ → ~1,77; 60 R⊕ → 2,3: l'orbita resta quasi sempre nell'inquadratura (camera a 5,2, semi-campo ≈ 2,7).
 * Monotòna crescente: la Luna più vicina appare davvero più vicina (e quindi più grande).
 */
export function distanzaLunaScena(distanzaRT: number): number {
  const x = Math.min(Math.max((distanzaRT - 3) / (DISTANZA_LUNA_OGGI_RT - 3), 0), 1.2);
  return 1.7 + 0.6 * Math.pow(x, 0.6);
}

/**
 * Velocità angolare visiva (rad/s) della rotazione terrestre. 1 giorno = 24 h ↔ ~25 s per giro; i giorni più brevi
 * girano più veloci ma con esponente 0,6 per non rendere l'immagine un lampeggio (5 h → ~10 s per giro).
 */
export function velocitaRotazioneTerra(durataGiornoOre: number): number {
  const base = 0.25;
  return base * Math.pow(24 / Math.max(durataGiornoOre, 1), 0.6);
}

/**
 * Velocità angolare visiva (rad/s) dell'orbita lunare, coerente con la velocità di rotazione:
 * n/ω = (durata del giorno)/(mese lunare), cioè quanti giri compie la Luna per ogni rotazione della Terra.
 */
export function velocitaOrbitaLuna(stato: StatoTerra, omegaTerra: number): number {
  return omegaTerra * stato.durataGiornoOre.v / (24 * stato.meseLunareGiorni);
}

/** Colore (RGB 0–1) del Sole dalla temperatura: sole giovane (~5630 K) leggermente più arancione. Scelta estetica. */
export function coloreSole(temperaturaK: number): [number, number, number] {
  const t = Math.min(Math.max((temperaturaK - 5400) / (5772 - 5400), 0), 1);
  return [1.0, 0.78 + 0.17 * t, 0.55 + 0.31 * t];
}
