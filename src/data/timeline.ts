/**
 * UNICA fonte dei dati di "Terra 4,6": eoni, ere, periodi, eventi e tracce dei parametri evolutivi.
 *
 * Convenzioni
 *  - Le date sono in milioni di anni fa (Ma), numeri POSITIVI (4540 = 4,54 miliardi di anni fa).
 *    Il tempo dell'interfaccia va da 4540 a 0; non esistono date negative.
 *  - Ogni valore numerico è accompagnato dalla fonte oppure dalla dicitura "valore approssimato".
 *    "Valore approssimato" = scelta di divulgazione coerente con la letteratura, non una misura.
 *  - Dove la scienza è incerta lo diciamo: `confidenza` per gli eventi, intervalli [min, max] per i parametri.
 *  - Le tracce sono liste ordinate dal più antico al più recente (ma decrescente). Tra due punti si
 *    interpola linearmente (vedi state/stato.ts). La validità dei dati è controllata da data/validazione.ts.
 *
 * Fonti citate in forma breve (autore anno): l'elenco completo è nel README.
 */

export type Colore = [number, number, number];

// ───────────────────────────── Costanti generali ─────────────────────────────

/** Età della Terra, Ma fa. Fonte: Dalrymple 2001 (4,54 ± 0,05 Ga). */
export const ETA_TERRA_MA = 4540;

/** Età del Sistema Solare (inclusioni refrattarie CAI), Ga. Fonte: Bouvier & Wadhwa 2010 (4,568 Ga), arrotondato. */
export const ETA_SISTEMA_SOLARE_GA = 4.57;

/** Raggio equatoriale terrestre, km. Fonte: IAU/WGS84 (6378,137 km). */
export const RAGGIO_TERRA_KM = 6378;

/** Giorni solari medi in un anno, oggi. Fonte: valore astronomico (365,2422 giorni). */
export const GIORNI_ANNO_OGGI = 365.2422;

// ───────────────────────────── Intervalli ICS ─────────────────────────────

export interface Intervallo {
  id: string;
  nome: string;
  /** Inizio (più antico), Ma fa */
  daMa: number;
  /** Fine (più recente), Ma fa */
  aMa: number;
  /** Colore standard ICS (International Chronostratigraphic Chart) */
  colore: string;
}

// Limiti e colori: tavola cronostratigrafica internazionale ICS v2023 (stratigraphy.org).
// I colori dei periodi del Fanerozoico sono quelli ICS. I colori dei periodi del Proterozoico e dell'Adeano
// sono riportati dalla tavola a memoria / approssimati: verificare con i file cromatici ufficiali ICS.
// L'Adeano è un eone informale (non ufficiale ICS); il suo limite superiore a 4000 Ma è convenzionale.

export const EONI: Intervallo[] = [
  { id: 'adeano', nome: 'Adeano', daMa: 4540, aMa: 4000, colore: '#AE027E' },
  { id: 'archeano', nome: 'Archeano', daMa: 4000, aMa: 2500, colore: '#F0047F' },
  { id: 'proterozoico', nome: 'Proterozoico', daMa: 2500, aMa: 538.8, colore: '#F74370' },
  { id: 'fanerozoico', nome: 'Fanerozoico', daMa: 538.8, aMa: 0, colore: '#9AD9DD' },
];

export const ERE: Intervallo[] = [
  { id: 'adeano-era', nome: 'Adeano', daMa: 4540, aMa: 4000, colore: '#AE027E' },
  { id: 'eoarcheano', nome: 'Eoarcheano', daMa: 4000, aMa: 3600, colore: '#DA037F' },
  { id: 'paleoarcheano', nome: 'Paleoarcheano', daMa: 3600, aMa: 3200, colore: '#F4449F' },
  { id: 'mesoarcheano', nome: 'Mesoarcheano', daMa: 3200, aMa: 2800, colore: '#F768A9' },
  { id: 'neoarcheano', nome: 'Neoarcheano', daMa: 2800, aMa: 2500, colore: '#F99BC1' },
  { id: 'paleoproterozoico', nome: 'Paleoproterozoico', daMa: 2500, aMa: 1600, colore: '#F73563' },
  { id: 'mesoproterozoico', nome: 'Mesoproterozoico', daMa: 1600, aMa: 1000, colore: '#FDB462' },
  { id: 'neoproterozoico', nome: 'Neoproterozoico', daMa: 1000, aMa: 538.8, colore: '#FEB342' },
  { id: 'paleozoico', nome: 'Paleozoico', daMa: 538.8, aMa: 251.9, colore: '#99C08D' },
  { id: 'mesozoico', nome: 'Mesozoico', daMa: 251.9, aMa: 66, colore: '#67C5CA' },
  { id: 'cenozoico', nome: 'Cenozoico', daMa: 66, aMa: 0, colore: '#F2F91D' },
];

/** Periodi (l'Archeano e l'Adeano non hanno periodi formali: sono divisi in ere). Limiti: ICS v2023. */
export const PERIODI: Intervallo[] = [
  { id: 'siderico', nome: 'Sideriano', daMa: 2500, aMa: 2300, colore: '#F74F7C' },
  { id: 'rhyaciano', nome: 'Rhyaciano', daMa: 2300, aMa: 2050, colore: '#F768A1' },
  { id: 'orosiriano', nome: 'Orosiriano', daMa: 2050, aMa: 1800, colore: '#F875A7' },
  { id: 'statheriano', nome: 'Statheriano', daMa: 1800, aMa: 1600, colore: '#F989B3' },
  { id: 'calymmiano', nome: 'Calymmiano', daMa: 1600, aMa: 1400, colore: '#FDC07A' },
  { id: 'ectasiano', nome: 'Ectasiano', daMa: 1400, aMa: 1200, colore: '#FDCC8A' },
  { id: 'steniano', nome: 'Steniano', daMa: 1200, aMa: 1000, colore: '#FED99A' },
  { id: 'toniano', nome: 'Toniano', daMa: 1000, aMa: 720, colore: '#FEBF4E' },
  { id: 'criogeniano', nome: 'Criogeniano', daMa: 720, aMa: 635, colore: '#FECC5C' },
  { id: 'ediacarano', nome: 'Ediacarano', daMa: 635, aMa: 538.8, colore: '#FED96A' },
  { id: 'cambriano', nome: 'Cambriano', daMa: 538.8, aMa: 486.85, colore: '#7FA056' },
  { id: 'ordoviciano', nome: 'Ordoviciano', daMa: 486.85, aMa: 443.1, colore: '#009270' },
  { id: 'siluriano', nome: 'Siluriano', daMa: 443.1, aMa: 419.62, colore: '#B3E1B6' },
  { id: 'devoniano', nome: 'Devoniano', daMa: 419.62, aMa: 358.86, colore: '#CB8C37' },
  { id: 'carbonifero', nome: 'Carbonifero', daMa: 358.86, aMa: 298.9, colore: '#67A599' },
  { id: 'permiano', nome: 'Permiano', daMa: 298.9, aMa: 251.9, colore: '#F04028' },
  { id: 'triassico', nome: 'Triassico', daMa: 251.9, aMa: 201.4, colore: '#812B92' },
  { id: 'giurassico', nome: 'Giurassico', daMa: 201.4, aMa: 143.1, colore: '#34B2C9' },
  { id: 'cretaceo', nome: 'Cretaceo', daMa: 143.1, aMa: 66, colore: '#7FC64E' },
  { id: 'paleogene', nome: 'Paleogene', daMa: 66, aMa: 23.03, colore: '#FD9A52' },
  { id: 'neogene', nome: 'Neogene', daMa: 23.03, aMa: 2.58, colore: '#FFE619' },
  { id: 'quaternario', nome: 'Quaternario', daMa: 2.58, aMa: 0, colore: '#F9F97F' },
];

// ───────────────────────────── Eventi ─────────────────────────────

export type TipoEvento =
  | 'formazione' | 'impatto' | 'vita' | 'atmosfera' | 'clima'
  | 'estinzione' | 'tettonica' | 'vulcanismo' | 'umanita';

/** Quanto è solida la datazione/interpretazione dell'evento. Mostrata nell'interfaccia. */
export type Confidenza = 'alta' | 'media' | 'bassa';

/** Effetto visivo da lanciare sulla scena (fase 4). Le coordinate, se presenti, sono quelle attuali. */
export interface EffettoEvento {
  tipo: 'impatto' | 'vulcanismo';
  /** Solo per gli impatti: dimensione relativa del corpo (default 'asteroide') */
  corpo?: 'asteroide' | 'protopianeta';
  /** Quanti impatti/eruzioni ravvicinati (default 1) */
  quantita?: number;
  /** Gradi; se omesse l'effetto compare in un punto della terraferma scelto dalla scena */
  latitudine?: number;
  longitudine?: number;
  /** 0–1, scala visiva (non fisica) */
  intensita: number;
}

export interface Evento {
  id: string;
  nome: string;
  /** Data centrale, Ma fa */
  ma: number;
  /** Incertezza ± in Ma. Se assente: ≲1% della data (valore approssimato) */
  incertezzaMa?: number;
  tipo: TipoEvento;
  confidenza: Confidenza;
  /** Compare nel tour guidato */
  tour?: boolean;
  effetto?: EffettoEvento;
  testo: string;
  fonte: string;
}

// Ordine: dal più antico al più recente. Le date sono la migliore stima centrale in letteratura al 2024–2025.
export const EVENTI: Evento[] = [
  {
    id: 'formazione', nome: 'Formazione della Terra', ma: 4540, incertezzaMa: 50, tipo: 'formazione', confidenza: 'alta', tour: true,
    testo: 'Nel disco di gas e polveri attorno al giovane Sole i planetesimi si fondono e danno origine alla Terra. Il calore dell\'accrescimento e dei decadimenti radioattivi fonde gran parte del pianeta: la superficie è un oceano di magma.',
    fonte: 'Patterson 1956; Dalrymple 2001 (4,54 ± 0,05 Ga)',
  },
  {
    id: 'theia', nome: 'Impatto di Theia e nascita della Luna', ma: 4500, incertezzaMa: 70, tipo: 'impatto', confidenza: 'media', tour: true,
    effetto: { tipo: 'impatto', corpo: 'protopianeta', intensita: 1 },
    testo: 'Un corpo grande più o meno come Marte colpisce la proto-Terra. I detriti in orbita si riuniscono nella Luna, molto più vicina di oggi. La data è incerta di decine di milioni di anni: le stime vanno da ~4,35 a ~4,51 miliardi di anni fa.',
    fonte: 'Canup & Asphaug 2001; Barboni et al. 2017; Thiemens et al. 2019',
  },
  {
    id: 'zirconi', nome: 'Zirconi di Jack Hills: forse i primi oceani', ma: 4404, incertezzaMa: 8, tipo: 'formazione', confidenza: 'media', tour: true,
    testo: 'Il più antico minerale terrestre noto è uno zircone australiano di ~4,4 miliardi di anni. Il suo ossigeno suggerisce che esistessero acqua liquida e crosta continentale già allora: è un\'inferenza indiretta, ancora discussa.',
    fonte: 'Wilde et al. 2001; Valley et al. 2014',
  },
  {
    id: 'bombardamento', nome: 'Intenso bombardamento tardivo (ipotesi)', ma: 3900, incertezzaMa: 200, tipo: 'impatto', confidenza: 'bassa', tour: true,
    effetto: { tipo: 'impatto', quantita: 5, intensita: 0.5 },
    testo: 'Dai crateri lunari si è ipotizzato un picco di impatti attorno a 3,9 miliardi di anni fa. Oggi molti studiosi pensano a un declino graduale dei bombardamenti più che a un cataclisma improvviso: l\'ipotesi è contestata.',
    fonte: 'Gomes et al. 2005 (ipotesi); Bottke & Norman 2017 (rassegna critica)',
  },
  {
    id: 'vita', nome: 'Prime tracce di vita: stromatoliti', ma: 3500, incertezzaMa: 100, tipo: 'vita', confidenza: 'media', tour: true,
    testo: 'Nelle rocce di ~3,48 miliardi di anni della Pilbara (Australia) compaiono stromatoliti: strutture create da comunità microbiche. Esistono indizi ancora più antichi (~3,7 Ga in Groenlandia) ma sono contestati.',
    fonte: 'Walter et al. 1980; Allwood et al. 2006; Nutman et al. 2016 (contestato da Allwood et al. 2018)',
  },
  {
    id: 'fotosintesi', nome: 'Origine della fotosintesi ossigenica', ma: 2900, incertezzaMa: 400, tipo: 'vita', confidenza: 'bassa',
    testo: 'I cianobatteri imparano a produrre ossigeno dall\'acqua. Quando sia avvenuto è molto dibattuto: tra ~3,5 e ~2,7 miliardi di anni fa. Per centinaia di milioni di anni l\'ossigeno viene consumato dalle rocce e dai gas vulcanici.',
    fonte: 'Planavsky et al. 2014; Fournier et al. 2021 (stime molecolari)',
  },
  {
    id: 'ossidazione', nome: 'Grande Evento di Ossidazione', ma: 2400, incertezzaMa: 100, tipo: 'atmosfera', confidenza: 'alta', tour: true,
    testo: 'L\'ossigeno cessa di essere interamente assorbito e comincia ad accumularsi nell\'atmosfera. Il metano, potente gas serra, si ossida e il cielo perde la foschia arancione. Per molti organismi anaerobi l\'ossigeno è un veleno.',
    fonte: 'Lyons et al. 2014; Luo et al. 2016; Gumsley et al. 2017',
  },
  {
    id: 'huroniana', nome: 'Glaciazione Huroniana', ma: 2300, incertezzaMa: 120, tipo: 'clima', confidenza: 'alta',
    testo: 'Tra circa 2,45 e 2,22 miliardi di anni fa si susseguono più glaciazioni, probabilmente innescate dal crollo del metano. I depositi glaciali si trovano in Canada e Sudafrica; l\'estensione globale è dibattuta.',
    fonte: 'Evans et al. 1997; Kopp et al. 2005',
  },
  {
    id: 'columbia', nome: 'Supercontinente Columbia/Nuna (ipotesi)', ma: 1700, incertezzaMa: 150, tipo: 'tettonica', confidenza: 'media',
    testo: 'Tra ~1,8 e ~1,3 miliardi di anni fa le masse continentali sarebbero state riunite in un unico blocco. La sua esistenza è ben supportata, la sua forma esatta molto meno.',
    fonte: 'Rogers & Santosh 2002; Zhao et al. 2002; Meert 2012',
  },
  {
    id: 'bangiomorpha', nome: 'Alghe rosse pluricellulari', ma: 1047, incertezzaMa: 13, tipo: 'vita', confidenza: 'media',
    testo: 'I fossili di Bangiomorpha sono tra i primi organismi pluricellulari complessi con differenziazione dei tessuti e riproduzione sessuale. L\'età è stata rivista di recente a ~1,05 miliardi di anni.',
    fonte: 'Butterfield 2000; Gibson et al. 2018',
  },
  {
    id: 'rodinia', nome: 'Supercontinente Rodinia', ma: 900, incertezzaMa: 150, tipo: 'tettonica', confidenza: 'media', tour: true,
    testo: 'Dopo la collisione globale (orogenesi grenvilliana) i continenti si riuniscono in Rodinia, circa 1,1 miliardi di anni fa. Si frammenta a partire da ~750 milioni di anni fa. La disposizione precisa è tuttora ricostruita con grandi incertezze.',
    fonte: 'Li et al. 2008; Merdith et al. 2017',
  },
  {
    id: 'sturtiana', nome: 'Terra a palla di neve: glaciazione Sturtiana', ma: 717, incertezzaMa: 1, tipo: 'clima', confidenza: 'alta', tour: true,
    testo: 'Attorno a 717 milioni di anni fa i ghiacci avanzano fino a latitudini tropicali e durano circa 55 milioni di anni. Tra "palla di neve" completa e "palla di fanghiglia" con acqua libera all\'equatore il dibattito è aperto.',
    fonte: 'Hoffman et al. 1998; Macdonald et al. 2010 (716,5 Ma); Hoffman et al. 2017',
  },
  {
    id: 'marinoana', nome: 'Glaciazione Marinoana', ma: 650, incertezzaMa: 10, tipo: 'clima', confidenza: 'alta',
    testo: 'Una seconda glaciazione globale, più breve (~15 milioni di anni), si conclude attorno a 635 milioni di anni fa con un enorme effetto serra vulcanico e depositi di carbonati "di copertura".',
    fonte: 'Rooney et al. 2015; Hoffman et al. 2017',
  },
  {
    id: 'pannotia', nome: 'Supercontinente Pannotia (ipotesi)', ma: 580, incertezzaMa: 40, tipo: 'tettonica', confidenza: 'bassa',
    testo: 'Alla fine del Proterozoico i continenti potrebbero essersi riuniti brevemente in Pannotia. Alcune ricostruzioni recenti negano che sia mai esistito come supercontinente coerente.',
    fonte: 'Dalziel 1997; Merdith et al. 2017 (ricostruzione alternativa)',
  },
  {
    id: 'ediacara', nome: 'Biota di Ediacara', ma: 571, incertezzaMa: 5, tipo: 'vita', confidenza: 'alta', tour: true,
    testo: 'Compaiono i primi grandi organismi pluricellulari complessi, dalle forme a fronda e a disco. Non è chiaro quanti siano antenati di animali moderni. Scompaiono attorno al limite con il Cambriano.',
    fonte: 'Narbonne 2005; Matthews et al. 2020 (valore approssimato)',
  },
  {
    id: 'cambriano', nome: 'Esplosione del Cambriano', ma: 538.8, incertezzaMa: 0.6, tipo: 'vita', confidenza: 'alta', tour: true,
    testo: 'In circa 20 milioni di anni compaiono nel registro fossile quasi tutti i grandi piani corporei animali, spesso con gusci e scheletri. L\'"esplosione" è in parte un effetto della fossilizzazione, non solo evolutivo.',
    fonte: 'ICS v2023; Linnemann et al. 2019',
  },
  {
    id: 'piante-terra', nome: 'Le piante colonizzano le terre emerse', ma: 470, incertezzaMa: 10, tipo: 'vita', confidenza: 'media', tour: true,
    testo: 'Gli antenati delle piante terrestri, simili a muschi e epatiche, lasciano l\'acqua. Le prove sono spore fossili dell\'Ordoviciano; le prime piante vascolari (Cooksonia) compaiono circa 430 milioni di anni fa.',
    fonte: 'Wellman et al. 2003; Rubinstein et al. 2010',
  },
  {
    id: 'ext-ordoviciano', nome: 'Estinzione di massa di fine Ordoviciano', ma: 445, incertezzaMa: 1.5, tipo: 'estinzione', confidenza: 'alta', tour: true,
    testo: 'Una breve glaciazione fa scendere il livello del mare e raffredda gli oceani: in due ondate scompare circa l\'85% delle specie, quasi tutte marine. È la prima delle "cinque grandi".',
    fonte: 'Sheehan 2001; Bond & Grasby 2017; Barnosky et al. 2011',
  },
  {
    id: 'foreste', nome: 'Le prime foreste', ma: 385, incertezzaMa: 5, tipo: 'vita', confidenza: 'alta',
    testo: 'Con Archaeopteris e altre piante arboree le foreste coprono la terraferma. Le radici profonde cambiano i suoli, assorbono CO₂ e raffreddano il clima.',
    fonte: 'Stein et al. 2007; Berner 1997',
  },
  {
    id: 'ext-devoniano', nome: 'Estinzione di massa del tardo Devoniano', ma: 372, incertezzaMa: 2, tipo: 'estinzione', confidenza: 'alta', tour: true,
    testo: 'Un\'estinzione prolungata, con crisi anossiche negli oceani, colpisce soprattutto gli ambienti marini poco profondi: scompare circa il 70–75% delle specie. Le scogliere a coralli e stromatopori non si riprendono per milioni di anni.',
    fonte: 'McGhee 2013; Percival et al. 2018 (limite Frasniano/Famenniano 372,2 Ma)',
  },
  {
    id: 'pangea', nome: 'Pangea', ma: 300, incertezzaMa: 25, tipo: 'tettonica', confidenza: 'alta', tour: true,
    testo: 'La collisione tra Laurussia e Gondwana forma il supercontinente Pangea, circondato dall\'oceano Panthalassa. La sua massima compattezza si colloca tra ~300 e ~250 milioni di anni fa.',
    fonte: 'Scotese 2021; Domeier & Torsvik 2014',
  },
  {
    id: 'ext-permiano', nome: 'La "Grande Moria": estinzione Permiano–Triassico', ma: 251.9, incertezzaMa: 0.03, tipo: 'estinzione', confidenza: 'alta', tour: true,
    effetto: { tipo: 'vulcanismo', quantita: 4, intensita: 1 },
    testo: 'Le eruzioni delle Trappe Siberiane rilasciano enormi quantità di CO₂ e altri gas: oceani caldi e privi di ossigeno, acidificazione. Scompare oltre l\'80% delle specie marine, la più grave estinzione conosciuta.',
    fonte: 'Burgess et al. 2014 (251,902 ± 0,024 Ma); Stanley 2016',
  },
  {
    id: 'dinosauri', nome: 'Primi dinosauri', ma: 231, incertezzaMa: 2, tipo: 'vita', confidenza: 'media',
    testo: 'I primi dinosauri conosciuti, piccoli e bipedi, compaiono nel Triassico in Sud America. Diventeranno dominanti solo dopo l\'estinzione di fine Triassico.',
    fonte: 'Martínez et al. 2011; Marsicano et al. 2016',
  },
  {
    id: 'ext-triassico', nome: 'Estinzione di massa di fine Triassico', ma: 201.4, incertezzaMa: 0.2, tipo: 'estinzione', confidenza: 'alta', tour: true,
    effetto: { tipo: 'vulcanismo', quantita: 3, intensita: 0.8 },
    testo: 'Il vulcanismo della Provincia Magmatica dell\'Atlantico Centrale accompagna l\'apertura dell\'Atlantico: circa tre quarti delle specie scompaiono. Il percorso è aperto ai dinosauri.',
    fonte: 'Blackburn et al. 2013 (201,56 Ma); ICS v2023',
  },
  {
    id: 'frammentazione-pangea', nome: 'Frammentazione di Pangea', ma: 180, incertezzaMa: 20, tipo: 'tettonica', confidenza: 'alta', tour: true,
    testo: 'Si aprono l\'Atlantico centrale e, poco dopo, l\'oceano Indiano. Pangea si divide in Laurasia a nord e Gondwana a sud, che a sua volta si frantuma nel Cretaceo.',
    fonte: 'Scotese 2021; Seton et al. 2012',
  },
  {
    id: 'chicxulub', nome: 'Impatto di Chicxulub e fine dei dinosauri', ma: 66.0, incertezzaMa: 0.05, tipo: 'estinzione', confidenza: 'alta', tour: true,
    effetto: { tipo: 'impatto', latitudine: 21.4, longitudine: -89.5, intensita: 0.9 },
    testo: 'Un asteroide di circa 10 km cade nell\'attuale Yucatán, in concomitanza con il vulcanismo dei Trappi del Deccan. Scompare circa il 75% delle specie, dinosauri non aviani compresi. È la quinta estinzione di massa.',
    fonte: 'Alvarez et al. 1980; Renne et al. 2013 (66,043 Ma); Hull et al. 2020; Schoene et al. 2019',
  },
  {
    id: 'antartide', nome: 'Nascita della calotta antartica', ma: 34, incertezzaMa: 0.3, tipo: 'clima', confidenza: 'alta',
    testo: 'Al passaggio Eocene–Oligocene la CO₂ scende e la calotta dell\'Antartide si forma: la Terra passa dalla "serra" a un clima con ghiacci polari permanenti.',
    fonte: 'Zachos et al. 2001; Coxall et al. 2005',
  },
  {
    id: 'quaternario', nome: 'Inizio delle glaciazioni del Quaternario', ma: 2.58, incertezzaMa: 0.05, tipo: 'clima', confidenza: 'alta', tour: true,
    testo: 'Le calotte dell\'emisfero Nord iniziano a crescere e fondere con ciclicità di 41.000 anni, poi di ~100.000 anni da circa 1 milione di anni fa. Il quadro è guidato dalle variazioni orbitali (cicli di Milanković).',
    fonte: 'Gibbard et al. 2010; Lisiecki & Raymo 2005; Clark et al. 2006',
  },
  {
    id: 'sapiens', nome: 'Compare Homo sapiens', ma: 0.3, incertezzaMa: 0.03, tipo: 'umanita', confidenza: 'media', tour: true,
    testo: 'I più antichi fossili attribuiti a Homo sapiens, a Jebel Irhoud (Marocco), hanno circa 300.000 anni. L\'origine della specie è probabilmente un processo diffuso in tutta l\'Africa.',
    fonte: 'Hublin et al. 2017; Richter et al. 2017; Scerri et al. 2018',
  },
  {
    id: 'lgm', nome: 'Ultimo massimo glaciale', ma: 0.021, incertezzaMa: 0.004, tipo: 'clima', confidenza: 'alta',
    testo: 'Enormi calotte coprono Nord America ed Europa settentrionale; il mare è circa 120–130 metri più basso di oggi e molte aree oggi sommerse sono terraferma.',
    fonte: 'Clark et al. 2009; Lambeck et al. 2014',
  },
  {
    id: 'olocene', nome: 'Olocene', ma: 0.0117, incertezzaMa: 0.001, tipo: 'clima', confidenza: 'alta', tour: true,
    testo: 'Termina l\'ultima glaciazione e inizia l\'attuale periodo interglaciale. Agricoltura, città e scrittura nascono in questo clima eccezionalmente stabile.',
    fonte: 'Walker et al. 2009 (11.700 anni fa); ICS',
  },
  {
    id: 'oggi', nome: 'Oggi', ma: 0, tipo: 'umanita', confidenza: 'alta', tour: true,
    testo: 'Una Terra con ~29% di terre emerse, calotte polari, CO₂ a ~420 ppm in aumento per le attività umane. Molti propongono di chiamare questa fase "Antropocene"; l\'ICS non lo ha adottato come unità formale.',
    fonte: 'NOAA/Mauna Loa 2024; Subcommission on Quaternary Stratigraphy 2024',
  },
];

// ───────────────────────────── Etichette ─────────────────────────────

/** Continenti attuali, per le etichette sul globo quando è mostrata la geografia reale. Posizioni: centroidi approssimati (gradi). */
export const ETICHETTE_CONTINENTI: { nome: string; lat: number; lon: number }[] = [
  { nome: 'Nord America', lat: 46, lon: -100 },
  { nome: 'Sud America', lat: -15, lon: -58 },
  { nome: 'Europa', lat: 50, lon: 15 },
  { nome: 'Africa', lat: 5, lon: 20 },
  { nome: 'Asia', lat: 50, lon: 90 },
  { nome: 'Australia', lat: -25, lon: 134 },
  { nome: 'Antartide', lat: -80, lon: 0 },
];

// ───────────────────────────── Tracce dei parametri ─────────────────────────────

/** Punto di una traccia scalare. `min`/`max` = intervallo di incertezza (se assenti coincidono con `v`). */
export interface PuntoScalare {
  ma: number;
  v: number;
  min?: number;
  max?: number;
  fonte: string;
}
export interface PuntoColore {
  ma: number;
  /** RGB 0–1 *di visualizzazione* (non fisici) */
  v: Colore;
  fonte: string;
}

const AP = 'valore approssimato'; // abbreviazione per le note

/**
 * Frazione della superficie coperta da terre emerse (0–1), al livello del mare di riferimento di ciascuna epoca.
 * Oggi: 148,9 milioni di km² su 510 → 29,2% (CIA World Factbook).
 * Prima del Fanerozoico la crescita crostale e il volume d'acqua sono molto incerti: Korenaga 2021, Flament et al. 2008.
 */
export const FRAZIONE_TERRE: PuntoScalare[] = [
  { ma: 4540, v: 0.0, fonte: 'Oceano di magma, nessuna terra emersa' },
  { ma: 4000, v: 0.0, fonte: `${AP}; Korenaga 2021 (superficie in gran parte oceanica)` },
  { ma: 3500, v: 0.03, min: 0.0, max: 0.1, fonte: `${AP}; Flament et al. 2008` },
  { ma: 2700, v: 0.07, min: 0.02, max: 0.15, fonte: `${AP}; Flament et al. 2008; Korenaga 2021` },
  { ma: 2000, v: 0.14, min: 0.07, max: 0.22, fonte: `${AP}; Cawood et al. 2013 (crescita crostale)` },
  { ma: 1000, v: 0.2, min: 0.12, max: 0.28, fonte: `${AP}` },
  { ma: 538.8, v: 0.2, min: 0.12, max: 0.28, fonte: `${AP}; alto livello del mare del Cambriano` },
  { ma: 300, v: 0.31, min: 0.25, max: 0.35, fonte: `${AP}; Pangea, Scotese 2021` },
  { ma: 90, v: 0.2, min: 0.15, max: 0.25, fonte: `${AP}; mari epicontinentali del Cretaceo, Haq 2014` },
  { ma: 30, v: 0.27, fonte: `${AP}` },
  { ma: 0, v: 0.292, fonte: 'CIA World Factbook (148,9 milioni km² su 510)' },
];

/** Copertura dell'oceano di magma sulla superficie (0–1). Valori approssimati: Elkins-Tanton 2012; Canup 2008. */
export const COPERTURA_MAGMA: PuntoScalare[] = [
  { ma: 4540, v: 1.0, fonte: 'Oceano di magma post-accrescimento: Elkins-Tanton 2012' },
  { ma: 4500, v: 1.0, fonte: 'Impatto lunare: fusione globale, Canup 2008' },
  { ma: 4450, v: 0.45, fonte: `${AP}; raffreddamento: Zahnle et al. 2007` },
  { ma: 4400, v: 0.1, fonte: `${AP}; Zahnle et al. 2007` },
  { ma: 4200, v: 0.03, fonte: `${AP}` },
  { ma: 4000, v: 0.0, fonte: `${AP}` },
  { ma: 0, v: 0.0, fonte: 'Nessun oceano di magma (resta il vulcanismo puntuale, gestito dagli effetti)' },
];

/** Copertura vegetale delle terre emerse (0–1, rispetto al massimo possibile con il clima dell'epoca). */
export const VEGETAZIONE: PuntoScalare[] = [
  { ma: 4540, v: 0.0, fonte: 'Nessuna vita terrestre' },
  { ma: 480, v: 0.0, fonte: 'Prima delle piante terrestri; tappeti microbici trascurabili alla scala del globo' },
  { ma: 470, v: 0.03, fonte: 'Spore ordoviciane: Wellman et al. 2003; Rubinstein et al. 2010' },
  { ma: 430, v: 0.12, fonte: `${AP}; prime piante vascolari` },
  { ma: 385, v: 0.55, fonte: `${AP}; prime foreste, Stein et al. 2007` },
  { ma: 330, v: 1.0, fonte: `${AP}; foreste del Carbonifero` },
  { ma: 255, v: 0.9, fonte: `${AP}` },
  { ma: 251.9, v: 0.55, fonte: `${AP}; collasso a fine Permiano: Looy et al. 2001` },
  { ma: 240, v: 0.8, fonte: `${AP}` },
  { ma: 130, v: 1.0, fonte: `${AP}` },
  { ma: 66.1, v: 1.0, fonte: `${AP}` },
  { ma: 66, v: 0.75, fonte: `${AP}; "estate d'impatto", Vajda & Raine 2003` },
  { ma: 60, v: 1.0, fonte: `${AP}` },
  { ma: 0, v: 1.0, fonte: `${AP}` },
];

/**
 * Livello del mare relativo ad oggi (m). Prima del Fanerozoico non è vincolato: si assume 0.
 * Fanerozoico: curve di Haq & Schutter 2008 e Miller et al. 2005, molto incerte (± decine di metri).
 */
export const LIVELLO_MARE_M: PuntoScalare[] = [
  { ma: 4540, v: 0, fonte: 'Non vincolato prima del Fanerozoico (si assume 0)' },
  { ma: 540, v: 0, fonte: 'Non vincolato prima del Fanerozoico (si assume 0)' },
  { ma: 535, v: 150, min: 50, max: 250, fonte: `Haq & Schutter 2008; ${AP}` },
  { ma: 470, v: 200, min: 100, max: 250, fonte: 'Haq & Schutter 2008 (massimo ordoviciano)' },
  { ma: 445, v: 100, min: 40, max: 160, fonte: 'Hirnantiano: caduta di ~100 m, Haq & Schutter 2008' },
  { ma: 420, v: 170, min: 100, max: 230, fonte: `Haq & Schutter 2008; ${AP}` },
  { ma: 380, v: 130, min: 60, max: 200, fonte: `Haq & Schutter 2008; ${AP}` },
  { ma: 320, v: 20, min: -30, max: 90, fonte: `${AP}; glaciazione tardo-paleozoica, Isbell et al. 2012` },
  { ma: 270, v: 0, min: -60, max: 60, fonte: `${AP}` },
  { ma: 230, v: 30, min: -20, max: 100, fonte: `${AP}; Haq & Schutter 2008` },
  { ma: 150, v: 100, min: 50, max: 160, fonte: `${AP}; Haq & Schutter 2008` },
  { ma: 90, v: 200, min: 100, max: 250, fonte: 'Miller et al. 2005 (massimo cretaceo)' },
  { ma: 66, v: 150, min: 80, max: 230, fonte: `Miller et al. 2005; ${AP}` },
  { ma: 50, v: 80, min: 30, max: 130, fonte: `${AP}; Miller et al. 2020` },
  { ma: 35, v: 70, min: 30, max: 110, fonte: `${AP}` },
  { ma: 33.5, v: 25, min: 0, max: 50, fonte: 'Calo eustatico all\'inizio dell\'Antartide: Miller et al. 2005' },
  { ma: 14, v: 30, min: 10, max: 50, fonte: 'Miocene medio: Miller et al. 2020' },
  { ma: 3, v: 20, min: 5, max: 35, fonte: 'Pliocene medio: Dumitru et al. 2019 (+16 m)' },
  { ma: 0.13, v: 3, min: 0, max: 10, fonte: 'Ultimo interglaciale: Dutton et al. 2015' },
  { ma: 0.021, v: -130, min: -135, max: -120, fonte: 'Lambeck et al. 2014; Clark et al. 2009' },
  { ma: 0.0117, v: -60, min: -70, max: -50, fonte: `${AP}; deglaciazione, Lambeck et al. 2014` },
  { ma: 0.006, v: 0, fonte: 'Stabilizzazione olocenica: Lambeck et al. 2014' },
  { ma: 0, v: 0, fonte: 'Definizione' },
];

/**
 * Latitudine (in valore assoluto, gradi) oltre la quale c'è ghiaccio permanente: 90 = nessun ghiaccio,
 * ~70 = calotte come oggi, 0 = palla di neve completa. È una sintesi visiva, non una misura.
 */
export const LATITUDINE_GHIACCIO: PuntoScalare[] = [
  { ma: 4540, v: 90, fonte: 'Nessun ghiaccio (superficie calda)' },
  { ma: 2450, v: 90, fonte: 'Prima della Huroniana' },
  { ma: 2420, v: 35, min: 5, max: 60, fonte: 'Huroniana: Evans et al. 1997; Kopp et al. 2005; estensione dibattuta' },
  { ma: 2300, v: 35, min: 5, max: 60, fonte: 'Huroniana: Evans et al. 1997' },
  { ma: 2220, v: 90, fonte: 'Fine della Huroniana: Kopp et al. 2005' },
  { ma: 717.5, v: 90, fonte: 'Prima della Sturtiana' },
  { ma: 716, v: 5, min: 0, max: 25, fonte: 'Sturtiana: Macdonald et al. 2010; Hoffman et al. 2017; palla di neve vs fanghiglia dibattuta' },
  { ma: 661, v: 5, min: 0, max: 25, fonte: 'Fine della Sturtiana (~660 Ma): Rooney et al. 2015' },
  { ma: 658, v: 70, fonte: `Interglaciale tra le due fasi; ${AP}` },
  { ma: 652, v: 70, fonte: `${AP}` },
  { ma: 650, v: 5, min: 0, max: 25, fonte: 'Marinoana: Rooney et al. 2015; Hoffman et al. 2017' },
  { ma: 636, v: 5, min: 0, max: 25, fonte: 'Marinoana: Rooney et al. 2015' },
  { ma: 635, v: 90, fonte: 'Fine della Marinoana: Hoffman et al. 2017' },
  { ma: 582, v: 90, fonte: 'Prima della Gaskiers' },
  { ma: 580, v: 55, min: 40, max: 70, fonte: `Gaskiers: Pu et al. 2016; ${AP}` },
  { ma: 579, v: 55, min: 40, max: 70, fonte: `Gaskiers: Pu et al. 2016; ${AP}` },
  { ma: 578, v: 90, fonte: `${AP}` },
  { ma: 447, v: 90, fonte: 'Prima della glaciazione hirnantiana' },
  { ma: 445, v: 62, min: 50, max: 72, fonte: `Hirnantiano: Finnegan et al. 2011; ${AP}` },
  { ma: 443.5, v: 62, min: 50, max: 72, fonte: `Hirnantiano: Finnegan et al. 2011; ${AP}` },
  { ma: 441, v: 90, fonte: `${AP}` },
  { ma: 335, v: 90, fonte: 'Prima della glaciazione tardo-paleozoica' },
  { ma: 325, v: 70, min: 55, max: 80, fonte: `Isbell et al. 2012; ${AP}` },
  { ma: 300, v: 52, min: 40, max: 65, fonte: `Picco: Montañez & Poulsen 2013; ${AP}` },
  { ma: 290, v: 55, fonte: `Montañez & Poulsen 2013; ${AP}` },
  { ma: 275, v: 68, fonte: `${AP}` },
  { ma: 260, v: 90, fonte: 'Fine: Montañez & Poulsen 2013' },
  { ma: 35, v: 90, fonte: 'Mondo "serra": Zachos et al. 2001' },
  { ma: 33.5, v: 78, fonte: `Antartide: Zachos et al. 2001; ${AP}` },
  { ma: 14, v: 76, fonte: `Transizione del Miocene medio: Zachos et al. 2001; ${AP}` },
  { ma: 3.2, v: 75, fonte: `${AP}` },
  { ma: 2.58, v: 68, fonte: `Inizio della glaciazione nell'emisfero Nord: Gibbard et al. 2010; ${AP}` },
  { ma: 0.14, v: 52, fonte: `Glaciale penultimo (MIS 6): Lisiecki & Raymo 2005; ${AP}` },
  { ma: 0.125, v: 74, fonte: `Ultimo interglaciale: Dutton et al. 2015; ${AP}` },
  { ma: 0.115, v: 70, fonte: `${AP}` },
  { ma: 0.07, v: 58, fonte: `${AP}` },
  { ma: 0.021, v: 48, min: 42, max: 55, fonte: `Ultimo massimo glaciale: Clark et al. 2009; ${AP}` },
  { ma: 0.0117, v: 68, fonte: `${AP}` },
  { ma: 0.008, v: 73, fonte: `${AP}` },
  { ma: 0, v: 72, fonte: `${AP} (calotte polari e banchisa attuali)` },
];

/** Copertura nuvolosa media globale (0–1). Oggi ~0,67: Stubenrauch et al. 2013. Per il passato: nessun dato, valori qualitativi. */
export const COPERTURA_NUVOLE: PuntoScalare[] = [
  { ma: 4540, v: 1.0, fonte: 'Atmosfera di vapore denso: Zahnle et al. 2007' },
  { ma: 4450, v: 0.95, fonte: `${AP}` },
  { ma: 4300, v: 0.7, fonte: `${AP}` },
  { ma: 3000, v: 0.55, min: 0.4, max: 0.7, fonte: `${AP}; Charnay et al. 2013 (Archeano)` },
  { ma: 1000, v: 0.6, min: 0.45, max: 0.7, fonte: `${AP}` },
  { ma: 716, v: 0.3, fonte: `${AP}; clima freddo e secco in palla di neve` },
  { ma: 636, v: 0.3, fonte: `${AP}` },
  { ma: 630, v: 0.7, fonte: `${AP}; serra post-glaciale` },
  { ma: 0, v: 0.67, fonte: 'Stubenrauch et al. 2013 (~67%)' },
];

/** Pressione atmosferica totale al suolo (bar). Fonti per l'Archeano: Som et al. 2012, 2016; Marty et al. 2013. */
export const PRESSIONE_BAR: PuntoScalare[] = [
  { ma: 4540, v: 100, min: 30, max: 300, fonte: `Zahnle et al. 2010 (10–100+ bar di CO₂ e vapore); ${AP}` },
  { ma: 4400, v: 20, min: 5, max: 100, fonte: `Zahnle et al. 2010; ${AP}` },
  { ma: 4000, v: 3, min: 1, max: 20, fonte: `${AP}` },
  { ma: 3000, v: 0.8, min: 0.3, max: 1.5, fonte: 'Som et al. 2012 (0,5 ± 0,4 bar a 2,7 Ga); Marty et al. 2013' },
  { ma: 2000, v: 1.0, min: 0.5, max: 1.5, fonte: `${AP}` },
  { ma: 0, v: 1.013, fonte: 'Pressione standard' },
];

/** Luminosità del Sole rispetto ad oggi. Modello solare standard: Gough 1981: L/L₀ = 1 / (1 + 0,4 · (1 − t/t₀)), t₀ = 4,57 Ga. */
export function luminositaSole(ma: number): number {
  const t = Math.min(Math.max(ETA_SISTEMA_SOLARE_GA - ma / 1000, 0), ETA_SISTEMA_SOLARE_GA); // età del Sole in Ga
  return 1 / (1 + 0.4 * (1 - t / ETA_SISTEMA_SOLARE_GA));
}


/**
 * Formazione della Luna, Ma fa. Prima di questa data la Luna non esiste e non viene disegnata; la sua comparsa
 * avviene in `DURATA_FORMAZIONE_LUNA_MA` (i detriti dell'impatto si riaccrescono in tempi di anni–migliaia di anni,
 * in realtà: Kokubo et al. 2000; qui è un'animazione, non una scala fisica). Coerente con l'evento 'theia'.
 */
export const LUNA_FORMAZIONE_MA = 4500;
export const DURATA_FORMAZIONE_LUNA_MA = 15; // valore approssimato (resa visiva)

/** Raggio lunare in raggi terrestri. Fonte: NASA/NSSDC (1737,4 km su 6378,1 km ≈ 0,2724). */
export const RAGGIO_LUNA_RT = 0.2724;

/** Periodo siderale lunare oggi, giorni. Fonte: NASA/NSSDC (27,32 giorni). */
export const MESE_SIDERALE_OGGI_GIORNI = 27.32;

/** Distanza media attuale Terra–Luna in raggi terrestri (384.400 km / 6378 km). Fonte: NASA/LLR. */
export const DISTANZA_LUNA_OGGI_RT = 60.3;

/**
 * Frazione della Luna ricoperta da magma (0–1). L'oceano di magma lunare cristallizza in ~100–200 milioni di anni
 * (Elkins-Tanton et al. 2011; Maurice et al. 2020). Valori approssimati.
 */
export const MAGMA_LUNA: PuntoScalare[] = [
  { ma: 4540, v: 1.0, fonte: `Prima della formazione la Luna non esiste (non disegnata); ${AP}` },
  { ma: 4500, v: 1.0, fonte: 'Luna appena accresciuta: fusa, Elkins-Tanton et al. 2011' },
  { ma: 4460, v: 0.55, fonte: `${AP}; Elkins-Tanton et al. 2011` },
  { ma: 4400, v: 0.1, fonte: `${AP}; Maurice et al. 2020 (cristallizzazione dell'oceano di magma lunare)` },
  { ma: 4350, v: 0.0, fonte: `${AP}; Maurice et al. 2020` },
  { ma: 0, v: 0.0, fonte: 'Luna solida' },
];

/**
 * Copertura dei "mari" basaltici lunari (0–1, rispetto ad oggi). Il vulcanismo basaltico dei mari è datato
 * tra ~3,9 e ~3,1 Ga, con residui fino a ~1,2 Ga (Hiesinger et al. 2011; Qian et al. 2018).
 */
export const MARI_LUNA: PuntoScalare[] = [
  { ma: 4540, v: 0.0, fonte: 'Solo altopiani anortositici' },
  { ma: 3900, v: 0.0, fonte: 'Hiesinger et al. 2011 (inizio, ≈3,9 Ga)' },
  { ma: 3500, v: 0.8, fonte: `Hiesinger et al. 2011; picco di attività, ${AP}` },
  { ma: 3100, v: 1.0, fonte: 'Hiesinger et al. 2011 (≈3,1 Ga: gran parte dei mari già formata)' },
  { ma: 0, v: 1.0, fonte: 'Aspetto attuale' },
];

/**
 * Raggio del Sole rispetto ad oggi. Modello solare standard: all'inizio della sequenza principale R ≈ 0,89 R☉
 * e cresce quasi linearmente (Bahcall et al. 2001; Gough 1981); valore approssimato.
 */
export function raggioSole(ma: number): number {
  const t = Math.min(Math.max(ETA_SISTEMA_SOLARE_GA - ma / 1000, 0), ETA_SISTEMA_SOLARE_GA);
  return 0.89 + 0.11 * (t / ETA_SISTEMA_SOLARE_GA);
}

/** Temperatura efficace del Sole, K. Dalla legge di Stefan–Boltzmann: T = T☉ (L/R²)^¼, con T☉ = 5772 K (IAU 2015). */
export function temperaturaSole(ma: number): number {
  return 5772 * Math.pow(luminositaSole(ma) / raggioSole(ma) ** 2, 0.25);
}

/**
 * Distanza Terra–Luna in raggi terrestri (R⊕ = 6378 km). Oggi 60,3 R⊕ (384.400 km).
 * Misurato oggi: recessione di 3,8 cm/anno (laser ranging lunare, Dickey et al. 1994), ma non costante nel tempo:
 * dati geologici (ritmiti di marea, cicli di Milanković) danno medie minori. Prima di 1,4 Ga i valori sono
 * MOLTO incerti e provengono da modelli dinamici: non da misure.
 */
export const DISTANZA_LUNA_RT: PuntoScalare[] = [
  { ma: 4540, v: 4, min: 3, max: 6, fonte: 'Subito dopo l\'impatto la Luna si accresce poco oltre il limite di Roche (~3 R⊕): Canup 2004; Ćuk & Stewart 2012' },
  { ma: 4500, v: 4.5, min: 3, max: 7, fonte: 'Luna appena accresciuta: Canup 2004; Ćuk & Stewart 2012; incertezza elevata' },
  { ma: 4400, v: 18, min: 8, max: 30, fonte: `${AP}; modelli di evoluzione mareale: Touma & Wisdom 1994; Webb 1982` },
  { ma: 4000, v: 32, min: 18, max: 45, fonte: `${AP}; Webb 1982` },
  { ma: 3000, v: 46, min: 35, max: 54, fonte: `${AP}; Webb 1982; Zahnle & Walker 1987` },
  { ma: 2000, v: 52, min: 44, max: 58, fonte: `${AP}` },
  { ma: 1400, v: 56.3, min: 55.5, max: 57.5, fonte: 'Meyers & Malinverno 2018 (ciclo di Milanković, formazione Xiamaling): ~1,82 cm/anno medi' },
  { ma: 620, v: 58.5, min: 58.0, max: 59.0, fonte: 'Williams 2000 (ritmiti di marea di Elatina); valore approssimato' },
  { ma: 0, v: 60.3, fonte: 'NASA/Lunar Laser Ranging (distanza media 384.400 km)' },
];

/**
 * Durata del giorno in ore. Oggi 24 h.
 *  - Ultimi ~620 Ma: dati geologici (coralli, bivalvi, ritmiti di marea): Wells 1963; Scrutton 1978; Williams 2000; Sato et al. 2011.
 *  - ~1,4 Ga: Meyers & Malinverno 2018 (18,68 ± 0,05 h, da cicli di Milanković).
 *  - Oltre: stime da modelli dinamici, MOLTO incerte. Alcuni modelli prevedono un lungo "plateau" a ~21 h (risonanza di
 *    marea atmosferica: Zahnle & Walker 1987; Bartlett & Stevenson 2016), ma il risultato è contestato.
 *  - Subito dopo l'impatto lunare: giorno di ~5 h secondo Canup 2004 (ma 2–3 h in Ćuk & Stewart 2012).
 */
export const DURATA_GIORNO_ORE: PuntoScalare[] = [
  { ma: 4540, v: 5, min: 2.5, max: 7, fonte: 'Canup 2004; Ćuk & Stewart 2012; incertezza elevata' },
  { ma: 4400, v: 7, min: 4, max: 11, fonte: `${AP}; conservazione del momento angolare Terra–Luna` },
  { ma: 4000, v: 10, min: 6, max: 15, fonte: `${AP}; Webb 1982` },
  { ma: 3000, v: 14, min: 10, max: 20, fonte: `${AP}; Webb 1982; Zahnle & Walker 1987` },
  { ma: 2000, v: 19.5, min: 17, max: 21.5, fonte: `${AP}; Zahnle & Walker 1987; Bartlett & Stevenson 2016` },
  { ma: 1400, v: 18.7, min: 18.6, max: 18.8, fonte: 'Meyers & Malinverno 2018 (18,68 ± 0,05 h)' },
  { ma: 1000, v: 20, min: 19, max: 21.5, fonte: `${AP}; interpolazione tra Meyers & Malinverno 2018 e Williams 2000` },
  { ma: 620, v: 21.9, min: 21.5, max: 22.3, fonte: 'Williams 2000 (21,9 ± 0,4 h)' },
  { ma: 400, v: 22.0, min: 21.8, max: 22.2, fonte: 'Wells 1963; Scrutton 1978 (~400 giorni/anno nel Devoniano)' },
  { ma: 66, v: 23.5, min: 23.3, max: 23.7, fonte: 'Sato et al. 2011; Pannella 1972 (rudiste, ~372 giorni/anno); valore approssimato' },
  { ma: 0, v: 24, fonte: 'Definizione' },
];

/**
 * Ossigeno atmosferico in % del volume (oggi 20,95%). Fino al Grande Evento di Ossidazione l'ossigeno libero
 * era praticamente assente. Dopo: stime molto incerte (Lyons et al. 2014). Fanerozoico: modelli GEOCARBSULF
 * (Berner 2009) e carbone fossile (Glasspool & Scott 2010); i valori al picco del Carbonifero (30–35%) sono dibattuti.
 */
export const OSSIGENO_PCT: PuntoScalare[] = [
  { ma: 4540, v: 0, min: 0, max: 0.0001, fonte: 'Praticamente assente: Lyons et al. 2014 (< 10⁻⁵ PAL)' },
  { ma: 2500, v: 0, min: 0, max: 0.0001, fonte: 'Lyons et al. 2014' },
  { ma: 2300, v: 0.4, min: 0.0, max: 2, fonte: `Dopo il GOE; Lyons et al. 2014; ${AP}` },
  { ma: 1800, v: 1.0, min: 0.2, max: 3, fonte: `"Miliardo noioso": Planavsky et al. 2014; Lyons et al. 2014; ${AP}` },
  { ma: 1000, v: 1.5, min: 0.2, max: 4, fonte: `Planavsky et al. 2014; ${AP}` },
  { ma: 800, v: 2, min: 0.5, max: 6, fonte: `${AP}; inizio ossigenazione neoproterozoica` },
  { ma: 540, v: 14, min: 5, max: 20, fonte: `${AP}; Lenton et al. 2014; Sperling et al. 2015` },
  { ma: 420, v: 18, min: 12, max: 25, fonte: `Berner 2009; ${AP}` },
  { ma: 300, v: 31, min: 23, max: 35, fonte: 'Berner 2009; Glasspool & Scott 2010 (picco del Carbonifero)' },
  { ma: 252, v: 16, min: 12, max: 23, fonte: `Berner 2009; ${AP}` },
  { ma: 200, v: 16, min: 12, max: 22, fonte: `Berner 2009; ${AP}` },
  { ma: 100, v: 22, min: 18, max: 26, fonte: `Berner 2009; ${AP}` },
  { ma: 50, v: 22, min: 19, max: 24, fonte: `${AP}` },
  { ma: 0, v: 20.95, fonte: 'Misura diretta' },
];

/**
 * CO₂ atmosferica, ppm. Interpolata in scala logaritmica. Oggi ~420 ppm (NOAA/Mauna Loa 2024); preindustriale 280.
 * Prima del Fanerozoico le stime coprono vari ordini di grandezza (Sheldon 2006; Kanzaki & Murakami 2015).
 * Hadeano: 10–100 bar di CO₂ (Zahnle et al. 2010) → qui limitata al 50% del volume (500.000 ppm) come rappresentazione.
 */
export const CO2_PPM: PuntoScalare[] = [
  { ma: 4540, v: 500000, min: 100000, max: 900000, fonte: 'Zahnle et al. 2010; troncato alla frazione volumetrica massima' },
  { ma: 4400, v: 200000, min: 30000, max: 700000, fonte: `${AP}; Zahnle et al. 2010` },
  { ma: 4000, v: 50000, min: 10000, max: 300000, fonte: `${AP}; Sleep & Zahnle 2001` },
  { ma: 3000, v: 10000, min: 1000, max: 100000, fonte: `${AP}; Sheldon 2006; Kanzaki & Murakami 2015` },
  { ma: 2000, v: 3000, min: 500, max: 30000, fonte: `${AP}; Kanzaki & Murakami 2015` },
  { ma: 1200, v: 2000, min: 600, max: 10000, fonte: 'Sheldon 2006 (10–200 × livello preindustriale); valore approssimato' },
  { ma: 720, v: 1500, min: 300, max: 5000, fonte: `${AP}; Neoproterozoico` },
  { ma: 716, v: 300, min: 100, max: 1000, fonte: `${AP}; livelli bassi prima della palla di neve: Hoffman et al. 1998` },
  { ma: 640, v: 120000, min: 30000, max: 300000, fonte: `${AP}; Hoffman et al. 1998 (accumulo vulcanico durante la glaciazione, ordini di grandezza)` },
  { ma: 600, v: 2500, min: 500, max: 10000, fonte: `${AP}` },
  { ma: 540, v: 4500, min: 2000, max: 9000, fonte: 'Foster et al. 2017 (compilazione); Berner 2006 GEOCARBSULF' },
  { ma: 440, v: 4500, min: 2000, max: 9000, fonte: `Foster et al. 2017; ${AP}` },
  { ma: 400, v: 1500, min: 500, max: 4000, fonte: `Foster et al. 2017; ${AP}` },
  { ma: 330, v: 400, min: 200, max: 1000, fonte: 'Foster et al. 2017 (Carbonifero, glaciazione tardo-paleozoica)' },
  { ma: 260, v: 400, min: 200, max: 1000, fonte: `Foster et al. 2017` },
  { ma: 252, v: 3000, min: 1500, max: 8000, fonte: `${AP}; Trappe Siberiane, Foster et al. 2017` },
  { ma: 200, v: 2500, min: 1000, max: 5000, fonte: `${AP}; Foster et al. 2017` },
  { ma: 100, v: 1000, min: 500, max: 2500, fonte: 'Foster et al. 2017 (Cretaceo, ~1000–1500 ppm)' },
  { ma: 52, v: 1200, min: 700, max: 2000, fonte: 'Anagnostou et al. 2016 (Eocene inferiore)' },
  { ma: 34, v: 750, min: 500, max: 1100, fonte: 'Pearson et al. 2009; Anagnostou et al. 2016' },
  { ma: 15, v: 400, min: 300, max: 600, fonte: 'Foster et al. 2012 (Miocene medio)' },
  { ma: 3, v: 380, min: 330, max: 450, fonte: 'Pliocene medio: Bartoli et al. 2011; de la Vega et al. 2020' },
  { ma: 0.14, v: 190, min: 180, max: 200, fonte: 'Carote di ghiaccio EPICA Dome C: Lüthi et al. 2008' },
  { ma: 0.125, v: 280, min: 270, max: 290, fonte: 'Lüthi et al. 2008' },
  { ma: 0.021, v: 185, min: 180, max: 190, fonte: 'Ultimo massimo glaciale: Lüthi et al. 2008' },
  { ma: 0.0117, v: 260, min: 255, max: 270, fonte: 'Lüthi et al. 2008' },
  { ma: 0.001, v: 280, min: 275, max: 285, fonte: 'Preindustriale: Etheridge et al. 1996' },
  { ma: 0, v: 420, fonte: 'NOAA/Mauna Loa 2024 (~422 ppm)' },
];

// Colori di visualizzazione: scelte artistiche coerenti con la letteratura (non misure).

/** Colore del cielo / alone dell'atmosfera. Archeano: foschia arancione da metano organico (Trainer et al. 2006; Arney et al. 2016). */
export const COLORE_ATMOSFERA: PuntoColore[] = [
  { ma: 4540, v: [1.0, 0.55, 0.25], fonte: `Atmosfera di vapore incandescente: Zahnle et al. 2007; ${AP}` },
  { ma: 4450, v: [0.95, 0.6, 0.4], fonte: `${AP}` },
  { ma: 4400, v: [0.75, 0.62, 0.5], fonte: `CO₂ densa dopo la condensazione degli oceani; ${AP}` },
  { ma: 4000, v: [0.7, 0.6, 0.5], fonte: `${AP}` },
  { ma: 3500, v: [0.9, 0.55, 0.25], fonte: 'Foschia organica da metano (periodi di "Pale Orange Dot"): Trainer et al. 2006; Arney et al. 2016' },
  { ma: 2500, v: [0.9, 0.55, 0.3], fonte: `Arney et al. 2016; ${AP}` },
  { ma: 2300, v: [0.65, 0.58, 0.55], fonte: `Collasso della foschia di metano dopo il GOE: Zerkle et al. 2012; ${AP}` },
  { ma: 2000, v: [0.5, 0.58, 0.75], fonte: `${AP}` },
  { ma: 1000, v: [0.38, 0.56, 0.9], fonte: `${AP}` },
  { ma: 0, v: [0.3, 0.55, 1.0], fonte: 'Cielo attuale (diffusione di Rayleigh)' },
];

/** Colore dell'oceano. Archeano: ipotesi di mari verdastri ricchi di ferro disciolto (Ozaki et al. 2019). */
export const COLORE_OCEANO: PuntoColore[] = [
  { ma: 4540, v: [0.05, 0.03, 0.03], fonte: `Nessun oceano liquido stabile; ${AP}` },
  { ma: 4400, v: [0.03, 0.1, 0.15], fonte: `${AP}` },
  { ma: 3500, v: [0.04, 0.22, 0.17], fonte: 'Ipotesi "Terra verde": Ozaki et al. 2019; oceano ferruginoso' },
  { ma: 2400, v: [0.05, 0.22, 0.22], fonte: `${AP}` },
  { ma: 1800, v: [0.04, 0.2, 0.28], fonte: `Oceano euxinico/solfidico del Proterozoico: Canfield 1998; ${AP}` },
  { ma: 700, v: [0.03, 0.2, 0.38], fonte: `${AP}` },
  { ma: 0, v: [0.03, 0.2, 0.42], fonte: `Oceano attuale; ${AP}` },
];

/** Colore delle terre emerse nude (roccia/suolo). Rosso ferro dopo l'ossidazione ("red beds" da ~2,2 Ga: Rye & Holland 1998). */
export const COLORE_TERRE: PuntoColore[] = [
  { ma: 4540, v: [0.15, 0.12, 0.1], fonte: `Basalti scuri; ${AP}` },
  { ma: 2400, v: [0.22, 0.19, 0.17], fonte: `${AP}` },
  { ma: 2000, v: [0.32, 0.21, 0.16], fonte: `Primi strati rossi continentali: Rye & Holland 1998; ${AP}` },
  { ma: 540, v: [0.38, 0.27, 0.2], fonte: `${AP}` },
  { ma: 0, v: [0.4, 0.34, 0.24], fonte: `${AP}` },
];

/** Nomi delle tracce scalari, per la validazione e per la costruzione dello stato. */
export const TRACCE_SCALARI = {
  frazioneTerre: FRAZIONE_TERRE,
  coperturaMagma: COPERTURA_MAGMA,
  vegetazione: VEGETAZIONE,
  livelloMareM: LIVELLO_MARE_M,
  latitudineGhiaccio: LATITUDINE_GHIACCIO,
  coperturaNuvole: COPERTURA_NUVOLE,
  pressioneBar: PRESSIONE_BAR,
  distanzaLunaRT: DISTANZA_LUNA_RT,
  durataGiornoOre: DURATA_GIORNO_ORE,
  ossigenoPct: OSSIGENO_PCT,
  co2Ppm: CO2_PPM,
  magmaLuna: MAGMA_LUNA,
  mariLuna: MARI_LUNA,
} as const;

export const TRACCE_COLORE = {
  coloreAtmosfera: COLORE_ATMOSFERA,
  coloreOceano: COLORE_OCEANO,
  coloreTerre: COLORE_TERRE,
} as const;
