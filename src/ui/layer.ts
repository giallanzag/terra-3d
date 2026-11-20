import type { Impostazioni } from './impostazioni';

type Chiave = keyof Impostazioni;
type ChiaveBool = Exclude<Chiave, 'qualita' | 'luminosita'>;

const VOCI: { chiave: ChiaveBool; etichetta: string }[] = [
  { chiave: 'nuvole', etichetta: 'Nuvole' },
  { chiave: 'atmosfera', etichetta: 'Atmosfera' },
  { chiave: 'ghiacci', etichetta: 'Ghiacci' },
  { chiave: 'luna', etichetta: 'Luna' },
  { chiave: 'etichette', etichetta: 'Etichette' },
  { chiave: 'rotazionePianeta', etichetta: 'Rotazione del pianeta (durata del giorno)' },
  { chiave: 'rotazioneCamera', etichetta: 'Rotazione automatica della vista' },
];

/** Pannello degli interruttori dei layer e delle opzioni di visualizzazione. */
export class PannelloLayer {
  constructor(private el: HTMLElement, private imp: Impostazioni, private alCambio: (chiave: Chiave) => void) {
    this.el.innerHTML = `
      <h3>Livelli e opzioni</h3>
      ${VOCI.map((v) => `<label class="voce"><input type="checkbox" data-k="${v.chiave}"> <span>${v.etichetta}</span></label>`).join('')}
      <label class="voce luminosita">Luminosità
        <input type="range" min="0.8" max="2.2" step="0.05" data-k="luminosita" aria-label="Luminosità dell'immagine">
        <output></output>
      </label>
      <label class="voce qualita">Qualità grafica
        <select data-k="qualita">
          <option value="auto">Automatica</option><option value="alta">Alta</option><option value="bassa">Bassa (più veloce)</option>
        </select>
      </label>`;
    this.el.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => {
      const k = c.dataset.k as ChiaveBool;
      c.checked = this.imp[k];
      c.addEventListener('change', () => { this.imp[k] = c.checked; this.alCambio(k); });
    });
    const cur = this.el.querySelector<HTMLInputElement>('input[type=range]')!;
    const val = this.el.querySelector<HTMLOutputElement>('output')!;
    const mostra = () => { val.textContent = `${Math.round(this.imp.luminosita * 100)}%`; };
    cur.value = String(this.imp.luminosita);
    mostra();
    cur.addEventListener('input', () => { this.imp.luminosita = Number(cur.value); mostra(); this.alCambio('luminosita'); });
    const sel = this.el.querySelector<HTMLSelectElement>('select')!;
    sel.value = this.imp.qualita;
    sel.addEventListener('change', () => { this.imp.qualita = sel.value as Impostazioni['qualita']; this.alCambio('qualita'); });
  }

  /** Aggiorna lo stato di un interruttore dall'esterno (es. il tour accende la rotazione) */
  sincronizza(): void {
    this.el.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => {
      c.checked = this.imp[c.dataset.k as ChiaveBool];
    });
  }
}
