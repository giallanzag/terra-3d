import * as THREE from 'three';
import manifest from '../mappe/manifest.json';
import type { GestoreMappeTerre } from './mappeTerre';

/**
 * Carica le mappe paleogeografiche dichiarate in src/mappe/manifest.json.
 * I file immagine stanno in src/mappe/ e sono inclusi nella build da Vite (nessuna richiesta di rete extra se la
 * cartella è vuota, quindi nessun errore in console).
 *
 * SICUREZZA SULLE LICENZE: una voce viene caricata SOLO se ha `licenza` (testo) e `licenzaVerificata: true`.
 * Il progetto non include né scarica dati di cui non si conosca la licenza: la verifica spetta a chi aggiunge i file.
 */

export interface VoceManifest {
  /** Nome del file in src/mappe/ (png/jpg/webp), formato descritto in scene/mappeTerre.ts */
  file: string;
  /** Epoca rappresentata, Ma fa */
  ma: number;
  /** Fonte e citazione (es. "PALEOMAP, C. R. Scotese, 2016") */
  fonte: string;
  /** Licenza in forma testuale (es. "CC BY 4.0") e dove l'hai verificata */
  licenza?: string;
  licenzaUrl?: string;
  /** Va messo a true solo dopo aver letto la licenza dell'autore e averne rispettato le condizioni */
  licenzaVerificata?: boolean;
}

// Vite risolve i file di src/mappe/ al momento della build
const file = import.meta.glob('../mappe/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Voci effettivamente caricate (per i crediti nell'interfaccia) */
export const MAPPE_CARICATE: VoceManifest[] = [];

/** Restituisce quante mappe sono state caricate. */
export async function caricaMappeDaManifest(gestore: GestoreMappeTerre): Promise<number> {
  const voci = (manifest as { mappe: VoceManifest[] }).mappe;
  const loader = new THREE.TextureLoader();
  let n = 0;
  for (const v of voci) {
    if (!v.licenza || v.licenzaVerificata !== true) {
      console.warn(`[mappe] "${v.file}" ignorata: licenza non dichiarata o non verificata (vedi README).`);
      continue;
    }
    const url = file[`../mappe/${v.file}`];
    if (!url) { console.warn(`[mappe] file "${v.file}" non trovato in src/mappe/.`); continue; }
    try {
      const texture = await loader.loadAsync(url);
      gestore.aggiungi({ ma: v.ma, texture, fonte: `${v.fonte} — ${v.licenza}` });
      MAPPE_CARICATE.push(v);
      n++;
    } catch {
      console.warn(`[mappe] impossibile caricare "${v.file}".`);
    }
  }
  return n;
}
