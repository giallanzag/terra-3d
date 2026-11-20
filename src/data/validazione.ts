import {
  EONI, ERE, PERIODI, EVENTI, TRACCE_SCALARI, TRACCE_COLORE, ETA_TERRA_MA, type Intervallo,
} from './timeline';

/**
 * Controlli di coerenza dei dati. Restituisce l'elenco degli errori (vuoto se tutto va bene).
 * Viene eseguita all'avvio in modalità sviluppo (vedi main.ts) e può essere richiamata nei test.
 */
export function verificaDati(): string[] {
  const err: string[] = [];

  const controllaCopertura = (nome: string, lista: Intervallo[], da: number, a: number) => {
    let atteso = da;
    for (const i of lista) {
      if (Math.abs(i.daMa - atteso) > 1e-9) err.push(`${nome}: "${i.nome}" inizia a ${i.daMa} Ma ma ci si aspettava ${atteso}`);
      if (i.aMa >= i.daMa) err.push(`${nome}: "${i.nome}" ha durata non positiva`);
      atteso = i.aMa;
    }
    if (Math.abs(atteso - a) > 1e-9) err.push(`${nome}: l'ultimo intervallo termina a ${atteso} invece di ${a}`);
  };
  controllaCopertura('Eoni', EONI, ETA_TERRA_MA, 0);
  controllaCopertura('Ere', ERE, ETA_TERRA_MA, 0);
  controllaCopertura('Periodi', PERIODI, 2500, 0);

  // Eventi: ordinati, unici, dentro l'intervallo temporale
  const ids = new Set<string>();
  EVENTI.forEach((e, k) => {
    if (ids.has(e.id)) err.push(`Evento duplicato: ${e.id}`);
    ids.add(e.id);
    if (e.ma < 0 || e.ma > ETA_TERRA_MA) err.push(`Evento "${e.id}" fuori intervallo: ${e.ma}`);
    const prec = EVENTI[k - 1];
    if (prec && prec.ma < e.ma) err.push(`Eventi non ordinati: "${prec.id}" (${prec.ma}) prima di "${e.id}" (${e.ma})`);
    if (!e.fonte.trim()) err.push(`Evento "${e.id}" senza fonte`);
  });

  // Tracce: ordine decrescente, estremi coperti, min ≤ v ≤ max, fonte presente
  interface Punto { ma: number; fonte: string; v: number | readonly number[]; min?: number; max?: number }
  const tracce: Record<string, readonly Punto[]> = { ...TRACCE_SCALARI, ...TRACCE_COLORE };
  for (const [nome, punti] of Object.entries(tracce)) {
    const primo = punti[0];
    const ultimo = punti[punti.length - 1];
    if (!primo || primo.ma !== ETA_TERRA_MA) err.push(`Traccia ${nome}: non inizia a ${ETA_TERRA_MA} Ma`);
    if (!ultimo || ultimo.ma !== 0) err.push(`Traccia ${nome}: non termina a 0 Ma`);
    punti.forEach((p, k) => {
      const prec = punti[k - 1];
      if (prec && prec.ma <= p.ma && !(prec.ma === p.ma)) err.push(`Traccia ${nome}: ordine errato a ${p.ma} Ma`);
      if (prec && prec.ma === p.ma) err.push(`Traccia ${nome}: punto duplicato a ${p.ma} Ma`);
      if (!p.fonte.trim()) err.push(`Traccia ${nome}: punto a ${p.ma} Ma senza fonte`);
      if (typeof p.v === 'number') {
        if (p.min !== undefined && p.min > p.v) err.push(`Traccia ${nome} a ${p.ma} Ma: min > v`);
        if (p.max !== undefined && p.max < p.v) err.push(`Traccia ${nome} a ${p.ma} Ma: max < v`);
      }
    });
  }
  return err;
}
