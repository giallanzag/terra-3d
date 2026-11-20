import type { Impostazioni } from './impostazioni';

type Chiave = keyof Impostazioni;

const VOCI: { chiave: Exclude<Chiave, 'qualita'>; etichetta: string }[] = [
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
      <label class="voce qualita">Qualità grafica
        <select data-k="qualita">
          <option value="auto">Automatica</option><option value="alta">Alta</option><option value="bassa">Bassa (più veloce)</option>
        </select>
      </label>`;
    this.el.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => {
      const k = c.dataset.k as Exclude<Chiave, 'qualita'>;
      c.checked = this.imp[k];
      c.addEventListener('change', () => { this.imp[k] = c.checked; this.alCambio(k); });
    });
    const sel = this.el.querySelector<HTMLSelectElement>('select')!;
    sel.value = this.imp.qualita;
    sel.addEventListener('change', () => { this.imp.qualita = sel.value as Impostazioni['qualita']; this.alCambio('qualita'); });
  }

  /** Aggiorna lo stato di un interruttore dall'esterno (es. il tour accende la rotazione) */
  sincronizza(): void {
    this.el.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => {
      c.checked = this.imp[c.dataset.k as Exclude<Chiave, 'qualita'>];
    });
  }
}
