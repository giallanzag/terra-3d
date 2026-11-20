/**
 * Controlli automatici sui dati e sull'interpolazione. Uso: npm run verifica-dati
 * Esce con codice ≠ 0 se trova incongruenze (usato anche dal workflow di GitHub).
 */
import { verificaDati } from '../src/data/validazione';
import { calcolaStato } from '../src/state/stato';
import { maAPosizione, posizioneAMa } from '../src/state/scala';
import { ETA_TERRA_MA } from '../src/data/timeline';

const errori = verificaDati();

// La conversione tra posizione dello slider e tempo deve essere invertibile in entrambe le scale
for (const modo of ['lineare', 'compressa'] as const) {
  for (let ma = 0; ma <= ETA_TERRA_MA; ma += 37.3) {
    const r = posizioneAMa(maAPosizione(ma, modo), modo);
    if (Math.abs(r - ma) > 1e-6) errori.push(`Scala ${modo}: ${ma} Ma → ${r} Ma (non invertibile)`);
  }
}

// Lo stato deve essere finito e nei limiti per tutto l'intervallo
for (let ma = 0; ma <= ETA_TERRA_MA; ma += 7.7) {
  const s = calcolaStato(ma);
  const numeri: [string, number][] = [
    ['frazioneTerre', s.frazioneTerre], ['coperturaMagma', s.coperturaMagma], ['vegetazione', s.vegetazione],
    ['latitudineGhiaccio', s.latitudineGhiaccio], ['coperturaNuvole', s.coperturaNuvole],
    ['luminositaSole', s.luminositaSole], ['durataGiorno', s.durataGiornoOre.v], ['distanzaLuna', s.distanzaLunaRT.v],
    ['O2', s.ossigenoPct.v], ['CO2', s.co2Ppm.v], ['meseLunare', s.meseLunareGiorni],
  ];
  for (const [n, v] of numeri) if (!Number.isFinite(v)) errori.push(`Stato a ${ma} Ma: ${n} non è finito`);
  if (s.luminositaSole < 0.7 || s.luminositaSole > 1.0001) errori.push(`Luminosità del Sole fuori intervallo a ${ma} Ma: ${s.luminositaSole}`);
  if (s.frazioneTerre < 0 || s.frazioneTerre > 0.5) errori.push(`Frazione di terre fuori intervallo a ${ma} Ma`);
}

if (errori.length) {
  console.error('ERRORI NEI DATI:\n' + errori.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('Dati coerenti.');
