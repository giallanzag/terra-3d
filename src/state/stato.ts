import {
  TRACCE_SCALARI, TRACCE_COLORE, GIORNI_ANNO_OGGI, RAGGIO_TERRA_KM, luminositaSole, raggioSole, temperaturaSole,
  LUNA_FORMAZIONE_MA, DURATA_FORMAZIONE_LUNA_MA, MESE_SIDERALE_OGGI_GIORNI, DISTANZA_LUNA_OGGI_RT,
  type PuntoScalare, type PuntoColore, type Colore,
} from '../data/timeline';

/** Valore con intervallo di incertezza. */
export interface Stima {
  v: number;
  min: number;
  max: number;
}

/**
 * Stato interpolato della Terra a un dato istante.
 * Il rendering e l'interfaccia leggono SOLO questo oggetto: nessuna data hardcoded nelle scene o negli shader.
 */
export interface StatoTerra {
  /** Ma fa */
  ma: number;
  // ── superficie
  coperturaMagma: number;
  /** Terre emerse (0–1) al livello del mare di riferimento dell'epoca */
  frazioneTerre: number;
  vegetazione: number;
  /** Livello del mare rispetto ad oggi, in metri */
  livelloMareM: Stima;
  /** Gradi di latitudine (assoluta) oltre cui c'è ghiaccio: 90 = nessuno, 0 = palla di neve */
  latitudineGhiaccio: number;
  coloreOceano: Colore;
  coloreTerre: Colore;
  // ── atmosfera
  coloreAtmosfera: Colore;
  /** 0–1: quanto la foschia calda (metano organico, polveri) tinge la superficie vista dall'alto. Derivato dal colore. */
  veloAtmosferico: number;
  /** 0–1, scala visiva ricavata dalla pressione (log) */
  densitaAtmosfera: number;
  pressioneBar: number;
  coperturaNuvole: number;
  ossigenoPct: Stima;
  co2Ppm: Stima;
  // ── astronomia
  /** Rispetto ad oggi (1 = attuale) */
  luminositaSole: number;
  raggioSole: number;
  temperaturaSoleK: number;
  distanzaLunaRT: Stima;
  distanzaLunaKm: number;
  /** 0 = Luna non ancora formata, 1 = formata (animazione della comparsa) */
  lunaPresente: number;
  magmaLuna: number;
  mariLuna: number;
  /** Periodo orbitale lunare, giorni (3ª legge di Keplero: P ∝ a^1,5; massa del sistema considerata costante) */
  meseLunareGiorni: number;
  durataGiornoOre: Stima;
  giorniPerAnno: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Trova il segmento [i, i+1] che contiene `ma` in una lista ordinata per ma decrescente. */
function segmento<T extends { ma: number }>(punti: readonly T[], ma: number): { a: T; b: T; t: number } {
  const primo = punti[0]!;
  const ultimo = punti[punti.length - 1]!;
  if (ma >= primo.ma) return { a: primo, b: primo, t: 0 };
  if (ma <= ultimo.ma) return { a: ultimo, b: ultimo, t: 0 };
  // Ricerca binaria: la lista è ordinata dal più antico al più recente
  let lo = 0;
  let hi = punti.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (punti[mid]!.ma >= ma) lo = mid; else hi = mid;
  }
  const a = punti[lo]!;
  const b = punti[hi]!;
  return { a, b, t: (a.ma - ma) / (a.ma - b.ma) };
}

function scalare(punti: readonly PuntoScalare[], ma: number, logaritmico = false): Stima {
  const { a, b, t } = segmento(punti, ma);
  const f = logaritmico
    ? (x: number, y: number) => Math.exp(lerp(Math.log(Math.max(x, 1e-9)), Math.log(Math.max(y, 1e-9)), t))
    : (x: number, y: number) => lerp(x, y, t);
  return {
    v: f(a.v, b.v),
    min: f(a.min ?? a.v, b.min ?? b.v),
    max: f(a.max ?? a.v, b.max ?? b.v),
  };
}

function colore(punti: readonly PuntoColore[], ma: number): Colore {
  const { a, b, t } = segmento(punti, ma);
  return [lerp(a.v[0], b.v[0], t), lerp(a.v[1], b.v[1], t), lerp(a.v[2], b.v[2], t)];
}

/** Densità visiva dell'atmosfera (scelta estetica): 0,4 a 1 bar, 0,95 a 100 bar (scala log); sotto 1 bar scende linearmente. */
const densitaDaPressione = (bar: number) =>
  bar >= 1 ? 0.4 + 0.55 * Math.min(Math.log10(bar) / 2, 1) : 0.4 * bar;

/** Calcola lo stato interpolato a `ma` milioni di anni fa. */
export function calcolaStato(ma: number): StatoTerra {
  const T = TRACCE_SCALARI;
  const C = TRACCE_COLORE;
  const giorno = scalare(T.durataGiornoOre, ma);
  const luna = scalare(T.distanzaLunaRT, ma);
  const pressione = scalare(T.pressioneBar, ma).v;
  const colAtm = colore(C.coloreAtmosfera, ma);
  return {
    ma,
    coperturaMagma: scalare(T.coperturaMagma, ma).v,
    frazioneTerre: scalare(T.frazioneTerre, ma).v,
    vegetazione: scalare(T.vegetazione, ma).v,
    livelloMareM: scalare(T.livelloMareM, ma),
    latitudineGhiaccio: scalare(T.latitudineGhiaccio, ma).v,
    coloreOceano: colore(C.coloreOceano, ma),
    coloreTerre: colore(C.coloreTerre, ma),
    coloreAtmosfera: colAtm,
    // Più il cielo è rosso rispetto al blu, più il velo è marcato (massimo 0,35: la superficie resta riconoscibile)
    veloAtmosferico: Math.min(Math.max((colAtm[0] - colAtm[2]) * 0.5, 0), 0.35),
    densitaAtmosfera: densitaDaPressione(pressione),
    pressioneBar: pressione,
    coperturaNuvole: scalare(T.coperturaNuvole, ma).v,
    ossigenoPct: scalare(T.ossigenoPct, ma),
    co2Ppm: scalare(T.co2Ppm, ma, true),
    luminositaSole: luminositaSole(ma),
    raggioSole: raggioSole(ma),
    temperaturaSoleK: temperaturaSole(ma),
    distanzaLunaRT: luna,
    distanzaLunaKm: luna.v * RAGGIO_TERRA_KM,
    lunaPresente: Math.min(Math.max((LUNA_FORMAZIONE_MA - ma) / DURATA_FORMAZIONE_LUNA_MA, 0), 1),
    magmaLuna: scalare(T.magmaLuna, ma).v,
    mariLuna: scalare(T.mariLuna, ma).v,
    meseLunareGiorni: MESE_SIDERALE_OGGI_GIORNI * Math.pow(luna.v / DISTANZA_LUNA_OGGI_RT, 1.5),
    durataGiornoOre: giorno,
    // L'anno ha durata (quasi) costante: i giorni per anno crescono andando indietro nel tempo
    giorniPerAnno: (GIORNI_ANNO_OGGI * 24) / giorno.v,
  };
}
