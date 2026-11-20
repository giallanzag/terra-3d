import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Globo } from './globo';
import { Atmosfera } from './atmosfera';
import { Nuvole } from './nuvole';
import { Superficie } from './superficie';
import { GestoreMappeTerre } from './mappeTerre';
import { creaStelle } from './stelle';
import { Luna } from './luna';
import { Sole } from './sole';
import { Effetti } from './effetti';
import { velocitaRotazioneTerra } from './orbite';
import { EVENTI } from '../data/timeline';
import { caricaMappeDaManifest } from './caricaMappe';
import urlTerreOggi from '../assets/terre_oggi.png?url';
import type { StatoTerra } from '../state/stato';

/** Dopo quanti secondi senza variazioni del tempo la superficie viene ricalcolata in alta risoluzione. */
const ATTESA_ALTA_RISOLUZIONE_S = 0.35;

/** Orchestra renderer, camera, controlli e oggetti della scena. */
export class Scena {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controlli: OrbitControls;
  readonly mappe = new GestoreMappeTerre();
  readonly superficie: Superficie;
  private scena = new THREE.Scene();
  private dirSole = new THREE.Vector3(1, 0.25, 0.6).normalize();
  /** Gruppo che ruota con la Terra (globo, nuvole, effetti sulla superficie) */
  private pianeta = new THREE.Group();
  private globo: Globo;
  private luna: Luna;
  private sole: Sole;
  private effetti: Effetti;
  private ultimaPosizione = NaN;
  private rotazioneAttiva = true;
  private atmosfera: Atmosfera;
  private nuvole: Nuvole;
  private ultimoMa = NaN;
  private fermoDa = 0;
  private bakeDaFare = true;
  private orologio = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    // Limite a 2× per non sovraccaricare schermi ad altissima densità
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    this.camera.position.set(0, 0.7, 5.2);

    this.controlli = new OrbitControls(this.camera, canvas);
    this.controlli.enablePan = false;
    this.controlli.enableDamping = true;
    this.controlli.minDistance = 1.6;
    this.controlli.maxDistance = 14;
    this.controlli.autoRotateSpeed = 0.6;

    this.superficie = new Superficie(this.renderer, this.mappe);
    this.scena.add(creaStelle());
    this.globo = new Globo(this.superficie, this.dirSole);
    this.nuvole = new Nuvole(this.dirSole);
    this.atmosfera = new Atmosfera(this.dirSole);
    this.luna = new Luna(this.dirSole);
    this.sole = new Sole(this.dirSole);
    this.effetti = new Effetti(this.camera, (d) => this.superficie.terraInPunto(d));
    this.pianeta.add(this.globo.mesh, this.nuvole.mesh, this.effetti.gruppo);
    this.scena.add(this.pianeta, this.atmosfera.mesh, this.luna.mesh, this.sole.mesh);
    this.ridimensiona();
    window.addEventListener('resize', () => this.ridimensiona());
    this.caricaMappaOggi();
  }

  /** Maschera terra/mare dell'oggi (Natural Earth, pubblico dominio). Finché non è pronta si usa il procedurale. */
  private caricaMappaOggi(): void {
    new THREE.TextureLoader().load(urlTerreOggi, (texture) => {
      this.mappe.aggiungi({ ma: 0, texture, fonte: 'Natural Earth 1:50m (pubblico dominio)' });
      this.bakeDaFare = true;
    });
    // Mappe paleogeografiche opzionali, dichiarate in src/mappe/manifest.json (vedi README)
    void caricaMappeDaManifest(this.mappe).then((n) => { if (n > 0) this.bakeDaFare = true; });
  }

  impostaRotazioneAutomatica(v: boolean): void { this.controlli.autoRotate = v; }
  impostaAtmosfera(v: boolean): void { this.atmosfera.mesh.visible = v; }
  impostaNuvole(v: boolean): void { this.nuvole.mesh.visible = v; }
  /** Sposta il globo verso l'alto di una frazione dell'altezza dello schermo (0 = centrato) */
  impostaSpostamentoVerticale(frazione: number): void { this.spostamentoY = frazione; this.ridimensiona(); }
  private spostamentoY = 0;
  impostaLuna(v: boolean): void { this.luna.visibile = v; }
  impostaGhiacci(v: boolean): void { this.superficie.ghiacciVisibili = v; this.bakeDaFare = true; }
  /** Peso delle mappe reali (1) rispetto ai continenti procedurali (0) a `ma` */
  pesoMappeReali(ma: number): number { return this.mappe.seleziona(ma).pesoMappe; }
  get luceDelSole(): THREE.Vector3 { return this.dirSole; }

  /** Proietta un punto del pianeta (direzione locale, vettore unitario) sullo schermo. `fronte` > 0 se è sul lato visibile. */
  proiettaPianeta(dirLocale: THREE.Vector3): { x: number; y: number; fronte: number } {
    const pos = this.pianeta.localToWorld(dirLocale.clone());
    const normale = pos.clone().normalize();
    const versoCamera = this.camera.position.clone().sub(pos).normalize();
    return { ...this.aSchermo(pos), fronte: normale.dot(versoCamera) };
  }

  /** Posizione sullo schermo della Luna, se visibile (non nascosta dal pianeta) */
  proiettaLuna(): { x: number; y: number } | null {
    if (!this.luna.mesh.visible) return null;
    const p = this.luna.mesh.position;
    // Test raggio–sfera: la Luna è nascosta se il segmento camera→Luna interseca il pianeta (raggio 1)
    const c = this.camera.position;
    const d = p.clone().sub(c);
    const L = d.length();
    d.normalize();
    const t = -c.dot(d);
    if (t > 0 && t < L && c.clone().addScaledVector(d, t).length() < 1) return null;
    return this.aSchermo(p);
  }

  /** Posizione sullo schermo del Sole, se è davanti alla camera */
  proiettaSole(): { x: number; y: number } | null {
    const v = this.sole.mesh.position.clone().project(this.camera);
    if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return null;
    return this.aSchermo(this.sole.mesh.position);
  }

  private aSchermo(p: THREE.Vector3): { x: number; y: number } {
    const v = p.clone().project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }

  /**
   * Qualità di rendering: 'auto' adatta la risoluzione ai fps misurati, 'alta' usa fino a 2× di pixel ratio,
   * 'bassa' 1× e superficie a bassa risoluzione.
   */
  impostaQualita(q: 'auto' | 'alta' | 'bassa'): void {
    this.qualitaScelta = q;
    this.pixelRatio = q === 'bassa' ? 1 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.ridimensiona();
    this.bakeDaFare = true;
  }
  get pixelRatioCorrente(): number { return this.pixelRatio; }
  private qualitaScelta: 'auto' | 'alta' | 'bassa' = 'auto';
  private pixelRatio = 1;
  private fpsMedi = 60;
  private tAdattamento = 0;

  /** Misura i fps e, in modalità automatica, abbassa/alza il pixel ratio a gradini di 0,25 (min 0,75) */
  private adattaRisoluzione(dtReale: number): void {
    if (dtReale <= 0 || dtReale > 0.5) return;           // ignora i salti (tab in background)
    this.fpsMedi += (1 / dtReale - this.fpsMedi) * 0.05;
    this.tAdattamento += dtReale;
    if (this.qualitaScelta !== 'auto' || this.tAdattamento < 2) return;
    this.tAdattamento = 0;
    const massimo = Math.min(window.devicePixelRatio, 2);
    if (this.fpsMedi < 40 && this.pixelRatio > 0.75) this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.25);
    else if (this.fpsMedi > 57 && this.pixelRatio < massimo) this.pixelRatio = Math.min(massimo, this.pixelRatio + 0.25);
    else return;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.ridimensiona();
  }
  /** Attiva/disattiva la rotazione del pianeta su se stesso (durata del giorno) */
  impostaRotazionePianeta(v: boolean): void { this.rotazioneAttiva = v; }

  private ridimensiona(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Spostamento verticale dell'inquadratura (usato dal tour, che ha una scheda in basso): il globo resta visibile sopra di essa
    if (this.spostamentoY !== 0) this.camera.setViewOffset(w, h, 0, this.spostamentoY * h, w, h); else this.camera.clearViewOffset();
    // Schermi stretti (telefoni in verticale): campo visivo più ampio, così l'orbita lunare resta in vista
    this.camera.fov = Math.min(40 * Math.max(1, 1.25 / (w / h)), 75);
    this.camera.updateProjectionMatrix();
    this.effetti?.impostaViewport(this.renderer.domElement.height, this.camera.fov);
  }

  /**
   * Disegna un frame. La superficie viene ricalcolata solo se il tempo è cambiato: a bassa risoluzione mentre il
   * tempo scorre, in alta risoluzione quando si ferma (risoluzione adattiva).
   */
  disegna(stato: StatoTerra, dt: number, posizione: number, inVolo = false, dtReale = dt): void {
    this.orologio += dt;
    this.adattaRisoluzione(dtReale);
    this.rilevaEventi(stato.ma, posizione, inVolo);
    const cambiato = stato.ma !== this.ultimoMa;
    if (cambiato) {
      this.ultimoMa = stato.ma;
      this.fermoDa = 0;
      this.superficie.imposta('bassa');
      this.bakeDaFare = true;
    } else {
      this.fermoDa += dt;
      if (this.fermoDa > ATTESA_ALTA_RISOLUZIONE_S && this.superficie.qualita === 'bassa' && this.qualitaScelta !== 'bassa') {
        this.superficie.imposta('alta');
        this.bakeDaFare = true;
      }
    }
    if (this.bakeDaFare) {
      this.superficie.aggiorna(stato);
      this.bakeDaFare = false;
    }
    // Rotazione del pianeta: velocità visiva legata alla durata del giorno (più breve = più veloce)
    const omega = velocitaRotazioneTerra(stato.durataGiornoOre.v);
    if (this.effetti.orientaVerso) {
      // Porta il punto dell'evento di fronte alla camera (rotazione guidata, al massimo 5 rad/s)
      const p = this.effetti.orientaVerso;
      const phiP = Math.atan2(p.x, p.z);
      const phiC = Math.atan2(this.camera.position.x, this.camera.position.z);
      let diff = phiC - (phiP + this.pianeta.rotation.y);
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const passo = Math.sign(diff) * Math.min(Math.abs(diff), 5 * dt);
      this.pianeta.rotation.y += passo;
      if (Math.abs(diff) < 0.02) this.effetti.orientaVerso = null;
    } else if (this.rotazioneAttiva) {
      this.pianeta.rotation.y += omega * this.effetti.fattoreRotazione * dt;
    }
    this.effetti.impostaViewport(this.renderer.domElement.height, this.camera.fov);
    this.effetti.aggiorna(dt);
    const att = 1 - 0.4 * this.effetti.oscuramento;      // luce attenuata dalle ceneri
    this.globo.aggiorna(stato, att);
    this.nuvole.aggiorna(stato, this.orologio, att);
    this.atmosfera.aggiorna(stato, this.effetti.oscuramento);
    this.luna.aggiorna(stato, omega, dt);
    this.sole.aggiorna(stato, this.camera);
    this.controlli.update();
    this.renderer.render(this.scena, this.camera);
  }

  /**
   * Avvia gli effetti di un evento quando il tempo vi atterra (salto, tour) oppure lo attraversa con un passo piccolo
   * (riproduzione). Trascinare lo slider su grandi distanze non scatena una raffica di effetti.
   */
  private rilevaEventi(ma: number, posizione: number, inVolo: boolean): void {
    const prec = this.ultimoMaEventi;
    if (inVolo) {   // viaggio animato (tour, salti): gli eventi attraversati non scatenano effetti
      this.ultimoMaEventi = ma; this.ultimaPosizione = posizione; this.effetti.azzera();
      return;
    }
    if (!Number.isNaN(prec) && prec !== ma) {
      const piccolo = Math.abs(posizione - this.ultimaPosizione) < 0.02;
      const salto = Math.abs(posizione - this.ultimaPosizione) >= 0.02;
      if (salto) this.effetti.azzera();
      for (const e of EVENTI) {
        if (!e.effetto) continue;
        const atterra = salto && Math.abs(ma - e.ma) < 1e-9;
        const attraversa = piccolo && ((prec > e.ma && ma <= e.ma) || (prec < e.ma && ma >= e.ma));
        if (atterra || attraversa) this.effetti.avvia(e);
      }
    }
    this.ultimoMaEventi = ma;
    this.ultimaPosizione = posizione;
  }
  private ultimoMaEventi = NaN;
}
