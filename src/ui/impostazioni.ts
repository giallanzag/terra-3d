/** Impostazioni dell'interfaccia, salvate nel browser (se disponibile). */
export interface Impostazioni {
  nuvole: boolean;
  atmosfera: boolean;
  ghiacci: boolean;
  luna: boolean;
  etichette: boolean;
  rotazioneCamera: boolean;
  rotazionePianeta: boolean;
  qualita: 'auto' | 'alta' | 'bassa';
}

const CHIAVE = 'terra46-impostazioni';

const riduceMovimento = (): boolean => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export function impostazioniDefault(): Impostazioni {
  return {
    nuvole: true, atmosfera: true, ghiacci: true, luna: true, etichette: true,
    rotazioneCamera: false,
    // Chi chiede meno animazioni parte con il pianeta fermo
    rotazionePianeta: !riduceMovimento(),
    qualita: 'auto',
  };
}

export function caricaImpostazioni(): Impostazioni {
  const base = impostazioniDefault();
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    if (grezzo) return { ...base, ...(JSON.parse(grezzo) as Partial<Impostazioni>) };
  } catch { /* storage non disponibile o dati corrotti: si usano i valori di default */ }
  return base;
}

export function salvaImpostazioni(i: Impostazioni): void {
  try { localStorage.setItem(CHIAVE, JSON.stringify(i)); } catch { /* ignorato */ }
}
