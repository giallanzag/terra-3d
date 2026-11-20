import { ETA_TERRA_MA } from '../data/timeline';

/**
 * Conversione tra posizione dello slider (0 = formazione, 1 = oggi) e tempo in Ma fa.
 *
 * - Lineare: la barra è proporzionale al tempo.
 * - Compressa: scala a tratti. Gli ultimi 540 Ma (Fanerozoico, quando c'è la vita complessa)
 *   occupano il 40% della barra invece del ~12%; il resto occupa il 60%.
 */
export type ModoScala = 'lineare' | 'compressa';

const LIMITE_MA = 540; // valore approssimato (inizio Fanerozoico ≈ 538,8 Ma)
const QUOTA_RECENTE = 0.4; // frazione di barra dedicata agli ultimi LIMITE_MA

/** Ma fa (0…4540) → posizione 0…1 */
export function maAPosizione(ma: number, modo: ModoScala): number {
  const m = Math.min(Math.max(ma, 0), ETA_TERRA_MA);
  if (modo === 'lineare') return 1 - m / ETA_TERRA_MA;
  if (m <= LIMITE_MA) return 1 - (m / LIMITE_MA) * QUOTA_RECENTE;
  return (1 - QUOTA_RECENTE) * (1 - (m - LIMITE_MA) / (ETA_TERRA_MA - LIMITE_MA));
}

/** Posizione 0…1 → Ma fa (inversa della precedente) */
export function posizioneAMa(pos: number, modo: ModoScala): number {
  const p = Math.min(Math.max(pos, 0), 1);
  if (modo === 'lineare') return (1 - p) * ETA_TERRA_MA;
  const sogliaRecente = 1 - QUOTA_RECENTE;
  if (p >= sogliaRecente) return ((1 - p) / QUOTA_RECENTE) * LIMITE_MA;
  return LIMITE_MA + (1 - p / sogliaRecente) * (ETA_TERRA_MA - LIMITE_MA);
}
