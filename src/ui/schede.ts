import { MAPPE_CARICATE } from '../scene/caricaMappe';

/** Schermata di benvenuto e finestra "Informazioni e crediti". */
export function creaBenvenuto(el: HTMLElement, alTour: () => void, alEsplora: () => void): void {
  el.innerHTML = `
    <div class="scheda-contenuto">
      <h1>Terra <span>4,6</span></h1>
      <p class="lead">Un viaggio di 4,54 miliardi di anni: dal pianeta di magma al mondo di oggi.</p>
      <p>Scorri la linea del tempo, guarda il globo trasformarsi e leggi che cosa accadde. Dove la scienza è incerta lo diciamo:
      i continenti del passato sono una <b>rappresentazione illustrativa</b>, non una ricostruzione paleogeografica.</p>
      <div class="scheda-bottoni">
        <button class="primario" data-az="tour">▶ Tour guidato</button>
        <button data-az="esplora">Esplora liberamente</button>
      </div>
      <small>Suggerimenti: spazio = riproduci/pausa · N/P = evento successivo/precedente · T = tour</small>
    </div>`;
  el.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-az]');
    if (!b) return;
    el.hidden = true;
    if (b.dataset.az === 'tour') alTour(); else alEsplora();
  });
}

function contenutoInformazioni(): string {
  const mappe = MAPPE_CARICATE.length
    ? `<ul>${MAPPE_CARICATE.map((m) => `<li>${m.fonte} (${m.ma} Ma) — ${m.licenza}</li>`).join('')}</ul>`
    : '<p>Nessuna mappa paleogeografica caricata: per le epoche passate i continenti sono procedurali.</p>';
  return `
    <div class="scheda-contenuto info">
      <button class="chiudi-scheda" aria-label="Chiudi">✕</button>
      <h2>Informazioni e crediti</h2>
      <h3>Che cosa è (e che cosa non è)</h3>
      <ul>
        <li><b>Date ed eventi</b>: dalla letteratura scientifica, con fonte e livello di confidenza per ciascuno (vedi <code>src/data/timeline.ts</code>).</li>
        <li><b>Continenti del passato</b>: modello procedurale illustrativo. Solo le date dei supercontinenti vengono dalla letteratura.</li>
        <li><b>Parametri incerti</b> (durata del giorno, distanza della Luna, CO₂ e O₂ prima del Fanerozoico): sono mostrati con l'intervallo di incertezza.</li>
        <li><b>Scale visive</b>: la Luna, il Sole e le nuvole sono ingranditi o avvicinati per leggibilità, non in scala.</li>
        <li><b>Effetti</b> di impatti ed eruzioni: animazioni di pochi secondi, senza valore fisico quantitativo.</li>
      </ul>
      <h3>Crediti</h3>
      <ul>
        <li>Grafica 3D: <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> (licenza MIT).</li>
        <li>Terre emerse di oggi: <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a> (pubblico dominio).</li>
        <li>Intervalli e colori cronostratigrafici: <a href="https://stratigraphy.org" target="_blank" rel="noopener">ICS</a>.</li>
      </ul>
      <h3>Mappe paleogeografiche caricate</h3>
      ${mappe}
    </div>`;
}

export function creaInformazioni(el: HTMLElement): { apri: () => void } {
  const chiudi = () => { el.hidden = true; };
  el.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (t === el || t.closest('.chiudi-scheda')) chiudi();
  });
  // Il contenuto si ricostruisce a ogni apertura: le mappe paleogeografiche si caricano in modo asincrono
  return { apri: () => { el.innerHTML = contenutoInformazioni(); el.hidden = false; el.querySelector<HTMLElement>('.chiudi-scheda')?.focus(); } };
}
