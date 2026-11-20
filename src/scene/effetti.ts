import * as THREE from 'three';
import vertP from '../shaders/particelle.vert.glsl?raw';
import fragP from '../shaders/particelle.frag.glsl?raw';
import vertB from '../shaders/bagliore.vert.glsl?raw';
import fragB from '../shaders/bagliore.frag.glsl?raw';
import fragA from '../shaders/anello.frag.glsl?raw';
import type { Evento, EffettoEvento } from '../data/timeline';

/**
 * Effetti degli eventi: impatti (bolide, lampo, onda d'urto, materiale espulso) ed eruzioni (fontane di lava, colonna di
 * ceneri). Sono ANIMAZIONI IN TEMPO REALE di pochi secondi, indipendenti dalla scala geologica: scattano quando il
 * tempo attraversa la data dell'evento o vi atterra (salto, tour). Non hanno alcuna pretesa di scala fisica.
 *
 * Gli effetti vivono nel sistema di riferimento del pianeta (ruotano con la superficie). Mentre sono attivi la rotazione
 * del pianeta rallenta (vedi `fattoreRotazione`), così restano sotto gli occhi di chi guarda.
 */

const MAX_PARTICELLE = 900;

interface Particella {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  eta: number;
  durata: number;
  dim: number;
  col: THREE.Color;
  /** Accelerazione verso il centro del pianeta (unità di scena/s² a distanza 1) */
  grav: number;
  /** Fattore sul quale l'alpha decade: 1 = lineare */
  alpha: number;
}

/** Insieme di particelle disegnate come un unico THREE.Points. */
class SistemaParticelle {
  readonly punti: THREE.Points;
  private lista: Particella[] = [];
  private pos = new Float32Array(MAX_PARTICELLE * 3);
  private dim = new Float32Array(MAX_PARTICELLE);
  private alpha = new Float32Array(MAX_PARTICELLE);
  private col = new Float32Array(MAX_PARTICELLE * 3);
  private geom = new THREE.BufferGeometry();
  readonly materiale: THREE.ShaderMaterial;

  constructor(additivo: boolean) {
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aDim', new THREE.BufferAttribute(this.dim, 1).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aColore', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vertP, fragmentShader: fragP,
      uniforms: { uK: { value: 600 } },
      transparent: true, depthWrite: false,
      blending: additivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.punti = new THREE.Points(this.geom, this.materiale);
    this.punti.frustumCulled = false;
    this.geom.setDrawRange(0, 0);
  }

  get numero(): number { return this.lista.length; }

  aggiungi(p: Particella): void {
    if (this.lista.length < MAX_PARTICELLE) this.lista.push(p);
  }

  aggiorna(dt: number): void {
    const v = new THREE.Vector3();
    for (let i = this.lista.length - 1; i >= 0; i--) {
      const p = this.lista[i]!;
      p.eta += dt;
      if (p.eta >= p.durata) { this.lista.splice(i, 1); continue; }
      const r2 = Math.max(p.pos.lengthSq(), 0.5);
      v.copy(p.pos).normalize().multiplyScalar(-p.grav / r2 * dt);
      p.vel.add(v);
      p.pos.addScaledVector(p.vel, dt);
      // Le particelle che cadono sulla superficie si fermano (sepolte)
      if (p.pos.length() < 1.0) { p.pos.setLength(1.0); p.vel.multiplyScalar(0.0); }
    }
    this.lista.forEach((p, i) => {
      const t = p.eta / p.durata;
      this.pos.set([p.pos.x, p.pos.y, p.pos.z], i * 3);
      this.dim[i] = p.dim * (0.6 + 0.8 * t) ;
      this.alpha[i] = Math.pow(1 - t, p.alpha) * Math.min(p.eta * 8, 1);
      this.col.set([p.col.r, p.col.g, p.col.b], i * 3);
    });
    const n = this.lista.length;
    this.geom.setDrawRange(0, n);
    for (const nome of ['position', 'aDim', 'aAlpha', 'aColore']) (this.geom.getAttribute(nome) as THREE.BufferAttribute).needsUpdate = true;
  }
}

type Fase = (t: number, dt: number) => boolean;   // restituisce false quando l'effetto è finito

/** Gestisce gli effetti attivi. */
export class Effetti {
  /** Contenitore da aggiungere al gruppo del pianeta */
  readonly gruppo = new THREE.Group();
  private caldi = new SistemaParticelle(true);       // lava, scintille, materiale incandescente
  private fumo = new SistemaParticelle(false);       // ceneri e polvere
  private attivi: { t: number; fase: Fase }[] = [];
  private ritardati: { quando: number; avvia: () => void }[] = [];
  private orologio = 0;
  private bagliori: THREE.Mesh[] = [];
  /** Oscuramento atmosferico (0–1) dovuto a ceneri e polveri: l'"inverno" dopo impatti ed eruzioni */
  oscuramento = 0;
  private oscuramentoObiettivo = 0;
  /** Punto (locale al pianeta) che la scena deve portare di fronte alla camera, se l'effetto ha coordinate fisse */
  orientaVerso: THREE.Vector3 | null = null;

  constructor(private camera: THREE.PerspectiveCamera, private terraInPunto: (d: THREE.Vector3) => boolean) {
    this.gruppo.add(this.fumo.punti, this.caldi.punti);
    this.fumo.punti.renderOrder = 3;
    this.caldi.punti.renderOrder = 4;
  }

  /** Va chiamato quando cambiano le dimensioni della finestra */
  impostaViewport(altezzaPx: number, fovDeg: number): void {
    const k = altezzaPx / (2 * Math.tan((fovDeg * Math.PI) / 360));
    this.caldi.materiale.uniforms.uK!.value = k;
    this.fumo.materiale.uniforms.uK!.value = k;
  }

  get inCorso(): boolean { return this.attivi.length > 0 || this.ritardati.length > 0; }

  /** Rallentamento della rotazione del pianeta mentre un effetto è visibile (1 = normale) */
  get fattoreRotazione(): number { return this.inCorso ? 0.12 : 1; }

  /** Annulla tutti gli effetti (es. se l'utente salta altrove nel tempo) */
  azzera(): void {
    this.attivi = []; this.ritardati = [];
    this.bagliori.forEach((b) => { this.gruppo.remove(b); b.geometry.dispose(); (b.material as THREE.Material).dispose(); });
    this.bagliori = [];
    this.oscuramentoObiettivo = 0;
  }

  /** Avvia l'effetto di un evento. */
  avvia(evento: Evento): void {
    const e = evento.effetto;
    if (!e) return;
    const n = Math.max(1, e.quantita ?? 1);
    for (let i = 0; i < n; i++) {
      const ritardo = i * (e.tipo === 'impatto' ? 1.1 : 1.8);
      this.ritardati.push({ quando: this.orologio + ritardo, avvia: () => this.lancia(e, i) });
    }
  }

  // ── scelta del punto ────────────────────────────────────────────────────

  /** Punto (locale al pianeta) rivolto verso la camera, con eventuale preferenza per le terre emerse */
  private puntoVisibile(preferisciTerra: boolean, indice: number): THREE.Vector3 {
    const verso = this.camera.position.clone();
    this.gruppo.worldToLocal(verso);
    verso.normalize();
    const base = new THREE.Vector3(0, 1, 0).cross(verso).normalize();
    const base2 = verso.clone().cross(base).normalize();
    let scelto = verso.clone();
    for (let k = 0; k < 14; k++) {
      // Raggio angolare crescente attorno al centro della vista; l'indice sposta i punti uno dall'altro
      const ang = (indice * 2.4 + k * 1.7);
      const raggio = Math.min(0.12 + 0.05 * k + 0.1 * Math.min(indice, 3), 0.85);
      const cand = verso.clone().addScaledVector(base, Math.cos(ang) * raggio).addScaledVector(base2, Math.sin(ang) * raggio).normalize();
      scelto = cand;
      if (!preferisciTerra || this.terraInPunto(cand)) break;
    }
    return scelto;
  }

  private puntoDa(e: EffettoEvento, indice: number): THREE.Vector3 {
    if (e.latitudine !== undefined && e.longitudine !== undefined && indice === 0) {
      // Stessa convenzione di THREE.SphereGeometry / dello shader della superficie
      const phi = (e.longitudine + 180) * Math.PI / 180;
      const lat = e.latitudine * Math.PI / 180;
      return new THREE.Vector3(-Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
    }
    if (e.tipo === 'vulcanismo') return this.puntoTerra(indice);
    return this.puntoVisibile(false, indice);
  }

  /**
   * Punto su terra emersa, scelto tra 24 campioni uniformi sul globo e ordinato per vicinanza alla vista:
   * le eruzioni (province magmatiche) avvengono sui continenti. Se non c'è terra, ricade sul punto visibile.
   */
  private puntoTerra(indice: number): THREE.Vector3 {
    const verso = this.camera.position.clone();
    this.gruppo.worldToLocal(verso);
    verso.normalize();
    const N = 24;
    const terre: { p: THREE.Vector3; d: number }[] = [];
    for (let i = 0; i < N; i++) {
      // Spirale di Fibonacci: punti quasi equidistribuiti sulla sfera
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.399963;
      const p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      // Scarta i poli: la rotazione attorno all'asse non può portarli di fronte alla camera
      if (Math.abs(p.y) < 0.8 && this.terraInPunto(p)) terre.push({ p, d: p.dot(verso) });
    }
    if (terre.length === 0) return this.puntoVisibile(false, indice);
    terre.sort((a, b) => b.d - a.d);
    return terre[Math.min(indice, terre.length - 1)]!.p.clone();
  }

  private lancia(e: EffettoEvento, indice: number): void {
    const punto = this.puntoDa(e, indice);
    if (indice === 0 && (e.latitudine !== undefined || e.tipo === 'vulcanismo')) this.orientaVerso = punto.clone();
    if (e.tipo === 'impatto') this.impatto(punto, e); else this.eruzione(punto, e);
  }

  // ── elementi visivi ─────────────────────────────────────────────────────

  private nuovoBagliore(colore: THREE.ColorRepresentation, dimensione: number, disco = 0, nucleo = 0): THREE.Mesh {
    const m = new THREE.ShaderMaterial({
      vertexShader: vertB, fragmentShader: fragB,
      uniforms: { uColore: { value: new THREE.Color(colore) }, uAlpha: { value: 1 }, uDisco: { value: disco }, uNucleo: { value: nucleo } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    mesh.scale.setScalar(dimensione);
    mesh.renderOrder = 6;
    this.gruppo.add(mesh);
    this.bagliori.push(mesh);
    return mesh;
  }

  private rimuoviBagliore(m: THREE.Mesh): void {
    this.gruppo.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose();
    this.bagliori = this.bagliori.filter((x) => x !== m);
  }

  /** Orienta un piano verso la camera (billboard) restando nel sistema del pianeta */
  private verso(m: THREE.Mesh): void {
    const q = this.camera.getWorldQuaternion(new THREE.Quaternion());
    const qp = this.gruppo.getWorldQuaternion(new THREE.Quaternion()).invert();
    m.quaternion.copy(qp.multiply(q));
  }

  // ── impatto ─────────────────────────────────────────────────────────────

  private impatto(punto: THREE.Vector3, e: EffettoEvento): void {
    const grande = e.corpo === 'protopianeta';
    const scala = (grande ? 1.0 : 0.65) * (0.6 + 0.6 * e.intensita);
    const durataAvvicinamento = grande ? 2.6 : 1.3;
    const dist0 = grande ? 4.0 : 2.6;
    // direzione di arrivo: obliqua rispetto alla verticale
    const tang = new THREE.Vector3(0, 1, 0).cross(punto);
    if (tang.lengthSq() < 1e-4) tang.set(1, 0, 0);
    tang.normalize();
    const partenza = punto.clone().multiplyScalar(1 + dist0).addScaledVector(tang, dist0 * 0.9);

    const corpo = this.nuovoBagliore(grande ? 0xffb070 : 0xffd9a0, grande ? 0.9 : 0.12, 0.25, 0.8);
    const lampo = this.nuovoBagliore(0xffe2b8, 0.01, 0, 1.0);
    lampo.visible = false;
    const lava = this.nuovoBagliore(0xff6a1a, 0.01);
    lava.visible = false;
    // Onda d'urto: anello sul piano tangente
    const mAnello = new THREE.ShaderMaterial({
      vertexShader: vertB, fragmentShader: fragA,
      uniforms: { uProgresso: { value: 0 }, uColore: { value: new THREE.Color(0xffd0a0) } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const anello = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mAnello);
    anello.position.copy(punto).multiplyScalar(1.004);
    anello.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), punto);
    anello.visible = false;
    anello.renderOrder = 5;
    this.gruppo.add(anello);

    let colpito = false;
    const fase: Fase = (t, dt) => {
      if (t < durataAvvicinamento) {
        const s = t / durataAvvicinamento;
        const pos = partenza.clone().lerp(punto, s * s);          // accelera
        corpo.position.copy(pos);
        this.verso(corpo);
        // scia
        for (let i = 0; i < (grande ? 6 : 3); i++) {
          this.caldi.aggiungi({
            pos: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02)),
            vel: new THREE.Vector3(), eta: 0, durata: 0.6, dim: grande ? 0.1 : 0.02, col: new THREE.Color(1, 0.55, 0.2), grav: 0, alpha: 1,
          });
        }
        return true;
      }
      const ts = t - durataAvvicinamento;
      if (!colpito) {
        colpito = true;
        corpo.visible = false;
        lampo.visible = true; lava.visible = true; anello.visible = true;
        lampo.position.copy(punto).multiplyScalar(1.01);
        lava.position.copy(punto).multiplyScalar(1.003);
        lava.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), punto);
        // Materiale espulso: raggi in tutte le direzioni sopra l'orizzonte locale
        const N = grande ? 380 : 220;
        for (let i = 0; i < N; i++) {
          const dir = punto.clone().add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.8)).normalize();
          if (dir.dot(punto) < 0.2) dir.addScaledVector(punto, 0.6).normalize();
          const vel = (grande ? 0.9 : 0.55) * (0.3 + Math.random() * 0.9) * scala + 0.1;
          this.caldi.aggiungi({
            pos: punto.clone().multiplyScalar(1.01), vel: dir.multiplyScalar(vel), eta: 0, durata: 2.5 + Math.random() * 3,
            dim: (0.035 + Math.random() * 0.05) * (grande ? 2 : 1.2), col: new THREE.Color(1, 0.35 + Math.random() * 0.4, 0.1), grav: 0.7, alpha: 1.2,
          });
        }
        const M = grande ? 140 : 60;
        for (let i = 0; i < M; i++) {
          const dir = punto.clone().add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.4)).normalize();
          this.fumo.aggiungi({
            pos: punto.clone().multiplyScalar(1.01), vel: dir.multiplyScalar(0.12 + Math.random() * 0.2), eta: 0, durata: 5 + Math.random() * 4,
            dim: (0.09 + Math.random() * 0.1) * scala * 2, col: new THREE.Color(0.32, 0.26, 0.23), grav: 0.05, alpha: 0.85,
          });
        }
        this.oscuramentoObiettivo = Math.max(this.oscuramentoObiettivo, grande ? 0.75 : 0.35 + 0.5 * e.intensita);
      }
      // Lampo (0,6 s), onda d'urto (4 s), bagliore della lava (8 s)
      const fl = Math.max(0, 1 - ts / 0.7);
      lampo.scale.setScalar((0.25 + ts * 2.4) * scala * 2);
      this.verso(lampo);
      (lampo.material as THREE.ShaderMaterial).uniforms.uAlpha!.value = fl;
      lampo.visible = fl > 0;
      const sh = Math.min(ts / 4, 1);
      anello.scale.setScalar(Math.max(sh * 1.3 * scala, 0.001) * 2.4);
      mAnello.uniforms.uProgresso!.value = sh;
      anello.visible = sh < 1;
      const lv = Math.max(0, 1 - ts / 8);
      lava.scale.setScalar(0.3 * scala * (0.6 + 0.4 * lv) * 2);
      (lava.material as THREE.ShaderMaterial).uniforms.uAlpha!.value = lv * 0.9;
      void dt;
      if (ts > 8) { this.rimuoviBagliore(corpo); this.rimuoviBagliore(lampo); this.rimuoviBagliore(lava); this.gruppo.remove(anello); anello.geometry.dispose(); mAnello.dispose(); return false; }
      return true;
    };
    this.attivi.push({ t: 0, fase });
  }

  // ── eruzione ────────────────────────────────────────────────────────────

  private eruzione(punto: THREE.Vector3, e: EffettoEvento): void {
    const scala = 0.6 + 0.8 * e.intensita;
    const base = this.nuovoBagliore(0xff5a14, 0.01);
    base.position.copy(punto).multiplyScalar(1.004);
    base.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), punto);
    const tang = new THREE.Vector3(0, 1, 0).cross(punto);
    if (tang.lengthSq() < 1e-4) tang.set(1, 0, 0);
    tang.normalize();
    const tang2 = punto.clone().cross(tang).normalize();
    const durata = 8;
    const fase: Fase = (t, dt) => {
      const intens = t < 1 ? t : Math.max(0, 1 - (t - 3) / (durata - 3));
      // Fontana di lava (particelle incandescenti) e colonna di cenere
      const nL = Math.round(14 * intens * scala * Math.min(dt * 60, 3));
      for (let i = 0; i < nL; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.5;
        const dir = punto.clone().addScaledVector(tang, Math.cos(a) * r).addScaledVector(tang2, Math.sin(a) * r).normalize();
        this.caldi.aggiungi({
          pos: punto.clone().multiplyScalar(1.005), vel: dir.multiplyScalar((0.5 + Math.random() * 0.7) * scala), eta: 0, durata: 1.6 + Math.random(),
          dim: 0.018 + Math.random() * 0.02, col: new THREE.Color(1, 0.3 + Math.random() * 0.35, 0.05), grav: 0.9, alpha: 1,
        });
      }
      const nF = Math.round(5 * intens * scala * Math.min(dt * 60, 3));
      for (let i = 0; i < nF; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.25;
        const dir = punto.clone().addScaledVector(tang, Math.cos(a) * r).addScaledVector(tang2, Math.sin(a) * r).normalize();
        this.fumo.aggiungi({
          pos: punto.clone().multiplyScalar(1.01), vel: dir.multiplyScalar((0.18 + Math.random() * 0.22) * scala), eta: 0, durata: 5 + Math.random() * 4,
          dim: (0.05 + Math.random() * 0.06) * scala, col: new THREE.Color(0.24 + Math.random() * 0.08, 0.2, 0.18), grav: 0.0, alpha: 0.7,
        });
      }
      base.scale.setScalar(0.22 * scala * (0.4 + 0.6 * intens));
      (base.material as THREE.ShaderMaterial).uniforms.uAlpha!.value = Math.min(intens * 1.3, 0.95);
      this.oscuramentoObiettivo = Math.max(this.oscuramentoObiettivo, 0.5 * e.intensita * Math.min(t / 4, 1));
      if (t > durata) { this.rimuoviBagliore(base); return false; }
      return true;
    };
    this.attivi.push({ t: 0, fase });
  }

  // ── ciclo ───────────────────────────────────────────────────────────────

  aggiorna(dt: number): void {
    this.orologio += dt;
    for (let i = this.ritardati.length - 1; i >= 0; i--) {
      if (this.orologio >= this.ritardati[i]!.quando) { this.ritardati[i]!.avvia(); this.ritardati.splice(i, 1); }
    }
    for (let i = this.attivi.length - 1; i >= 0; i--) {
      const a = this.attivi[i]!;
      a.t += dt;
      if (!a.fase(a.t, dt)) this.attivi.splice(i, 1);
    }
    this.caldi.aggiorna(dt);
    this.fumo.aggiorna(dt);
    // L'oscuramento sale in pochi secondi e decade lentamente (~15 s); si azzera quando tutto è finito
    const quieto = !this.inCorso && this.caldi.numero === 0 && this.fumo.numero === 0;
    if (quieto) this.oscuramentoObiettivo = 0;
    const k = this.oscuramentoObiettivo > this.oscuramento ? 0.5 : 0.07;
    this.oscuramento += (this.oscuramentoObiettivo - this.oscuramento) * Math.min(dt * k * 3, 1);
    if (this.oscuramento < 0.002 && this.oscuramentoObiettivo === 0) this.oscuramento = 0;
  }
}
