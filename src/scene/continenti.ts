import * as THREE from 'three';

/**
 * Modello PROCEDURALE (illustrativo) dei continenti.
 *
 * ATTENZIONE: non è paleogeografia reale. Otto "placche" si muovono attorno a poli di rotazione e, nei periodi
 * dei supercontinenti (Kenorland?, Columbia, Rodinia, Pangea) si riuniscono in un unico blocco. Le date dei
 * supercontinenti vengono dalla letteratura (vedi data/timeline.ts); forme e posizioni NO.
 * Per le epoche con ricostruzioni reali (≲540 Ma) la seconda versione carica mappe PALEOMAP/GPlates
 * (vedi scene/mappeTerre.ts).
 */

export const N_PLACCHE = 8;
const RAD = Math.PI / 180;

interface Placca {
  nome: string;
  /** Posizione attuale (gradi) */
  lat: number;
  lon: number;
  /** Raggio angolare (rad) tale che l'area sia ≈ quella reale: (1 − cos r)/2 della sfera. Valori approssimati. */
  raggio: number;
  /** Polo di rotazione (gradi) e velocità (°/Ma) con cui la placca si sposta andando indietro nel tempo */
  poloLat: number;
  poloLon: number;
  velocita: number;
  /** Posizione (est, nord) in radianti rispetto al centro del supercontinente */
  offset: [number, number];
}

// Velocità: ordine di grandezza 0,2–0,6 °/Ma (≈ 2–7 cm/anno), come le placche reali. Poli: scelte illustrative.
const PLACCHE: Placca[] = [
  { nome: 'Eurasia',       lat: 55,  lon: 70,   raggio: 0.66, poloLat: 20,  poloLon: -40,  velocita: 0.25, offset: [0.55, 0.75] },
  { nome: 'Nord America',  lat: 45,  lon: -100, raggio: 0.44, poloLat: 60,  poloLon: 100,  velocita: 0.30, offset: [-0.55, 0.55] },
  { nome: 'Africa',        lat: 5,   lon: 20,   raggio: 0.49, poloLat: 40,  poloLon: -20,  velocita: 0.20, offset: [0, 0] },
  { nome: 'Sud America',   lat: -15, lon: -60,  raggio: 0.38, poloLat: 50,  poloLon: -30,  velocita: 0.35, offset: [-0.45, -0.35] },
  { nome: 'Antartide',     lat: -85, lon: 0,    raggio: 0.33, poloLat: -60, poloLon: 30,   velocita: 0.15, offset: [0.1, -1.05] },
  { nome: 'Australia',     lat: -25, lon: 135,  raggio: 0.25, poloLat: 30,  poloLon: -50,  velocita: 0.55, offset: [0.75, -0.8] },
  { nome: 'India',         lat: 22,  lon: 78,   raggio: 0.18, poloLat: 30,  poloLon: 20,   velocita: 0.6,  offset: [0.4, -0.55] },
  { nome: 'Groenlandia',   lat: 72,  lon: -40,  raggio: 0.13, poloLat: 70,  poloLon: -150, velocita: 0.3,  offset: [-0.4, 0.95] },
];

/** Frazione di terre emerse attuale, usata per scalare i raggi (area ∝ raggio²). Fonte: CIA World Factbook. */
const FRAZIONE_OGGI = 0.292;

/**
 * Supercontinenti: picchi del "peso di aggregazione" w(ma) ∈ [0,1].
 * Date: Pangea ≈ 250–300 Ma; Rodinia ≈ 1100–750 Ma; Columbia/Nuna ≈ 1800–1500 Ma; Pannotia ≈ 600 Ma (dibattuto, peso minore);
 * Kenorland ≈ 2700 Ma (ipotetico). Larghezze (σ) approssimate.
 */
const SUPERCONTINENTI = [
  { nome: 'Pangea', ipotesi: false, ma: 270, sigma: 55, peso: 1.0, centro: [0, 20] as [number, number] },
  { nome: 'Pannotia', ipotesi: true, ma: 600, sigma: 30, peso: 0.45, centro: [-30, -30] as [number, number] },
  { nome: 'Rodinia', ipotesi: false, ma: 950, sigma: 130, peso: 1.0, centro: [5, -80] as [number, number] },
  { nome: 'Columbia/Nuna', ipotesi: true, ma: 1650, sigma: 140, peso: 0.9, centro: [15, 110] as [number, number] },
  { nome: 'Kenorland', ipotesi: true, ma: 2700, sigma: 120, peso: 0.6, centro: [-10, 40] as [number, number] },
];

/** Supercontinente dominante a `ma` (se ce n'è uno abbastanza coeso), con la posizione del suo centro. */
export function supercontinenteAttivo(ma: number): { nome: string; ipotesi: boolean; centro: THREE.Vector3; peso: number } | null {
  let migliore: { nome: string; ipotesi: boolean; centro: THREE.Vector3; peso: number } | null = null;
  for (const s of SUPERCONTINENTI) {
    const g = s.peso * Math.exp(-0.5 * ((ma - s.ma) / s.sigma) ** 2);
    if (g > 0.35 && (!migliore || g > migliore.peso)) {
      // Il centro usato è quello interpolato dal modello, così l'etichetta segue il blocco
      migliore = { nome: s.nome, ipotesi: s.ipotesi, centro: aggregazione(ma).centro, peso: g };
    }
  }
  return migliore;
}

const vettore = (latDeg: number, lonDeg: number): THREE.Vector3 => {
  // Stessa convenzione di THREE.SphereGeometry: phi = (lon + 180)°, y verso il polo nord
  const phi = (lonDeg + 180) * RAD;
  const lat = latDeg * RAD;
  return new THREE.Vector3(-Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
};

/** Peso di aggregazione e centro (vettore unitario) del supercontinente più vicino, interpolati. */
function aggregazione(ma: number): { w: number; centro: THREE.Vector3 } {
  let w = 0;
  const acc = new THREE.Vector3();
  for (const s of SUPERCONTINENTI) {
    const g = s.peso * Math.exp(-0.5 * ((ma - s.ma) / s.sigma) ** 2);
    w += g;
    acc.addScaledVector(vettore(s.centro[0], s.centro[1]), g);
  }
  if (acc.lengthSq() < 1e-9) acc.copy(vettore(0, 0)); else acc.normalize();
  return { w: Math.min(w, 1), centro: acc };
}

export interface ConfigurazionePlacche {
  centri: THREE.Vector3[];
  raggi: number[];
}

/** Posizioni e raggi delle placche a `ma` milioni di anni fa, data la frazione di terre emerse dell'epoca. */
export function configurazionePlacche(ma: number, frazioneTerre: number): ConfigurazionePlacche {
  const { w, centro } = aggregazione(ma);
  const scala = Math.sqrt(Math.max(frazioneTerre, 0) / FRAZIONE_OGGI);
  // Base tangente al centro del supercontinente
  const est = new THREE.Vector3(0, 1, 0).cross(centro);
  if (est.lengthSq() < 1e-6) est.set(1, 0, 0);
  est.normalize();
  const nord = new THREE.Vector3().crossVectors(centro, est).normalize();

  const centri: THREE.Vector3[] = [];
  const raggi: number[] = [];
  for (const p of PLACCHE) {
    // 1) deriva: rotazione rigida attorno al polo della placca, tanto più ampia quanto più si va indietro
    const deriva = vettore(p.lat, p.lon).applyAxisAngle(vettore(p.poloLat, p.poloLon), p.velocita * ma * RAD);
    // 2) posizione nel supercontinente
    const compatto = centro.clone().addScaledVector(est, p.offset[0]).addScaledVector(nord, p.offset[1]).normalize();
    // 3) mescola in base al peso di aggregazione (smoothstep per evitare scatti)
    const t = w * w * (3 - 2 * w);
    const pos = deriva.clone().lerp(compatto, t).normalize();
    centri.push(pos);
    raggi.push(p.raggio * scala);
  }
  return { centri, raggi };
}
