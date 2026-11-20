import * as THREE from 'three';
import vert from '../shaders/superficie.vert.glsl?raw';
import frag from '../shaders/superficie.frag.glsl?raw';
import { conRumore } from './shader';
import { configurazionePlacche, N_PLACCHE } from './continenti';
import type { GestoreMappeTerre } from './mappeTerre';
import type { StatoTerra } from '../state/stato';

/** Livelli di qualità del bake: durante la riproduzione si usa la risoluzione bassa (adattiva). */
export const RISOLUZIONE = { bassa: [1024, 512], alta: [2048, 1024] } as const;
export type Qualita = keyof typeof RISOLUZIONE;

/**
 * Calcola la superficie del pianeta (continenti, oceani, ghiacci, magma, vegetazione) su due texture equirettangolari.
 * Si rigenera solo quando cambia il tempo: i frame successivi costano solo il campionamento nello shader del globo.
 */
export class Superficie {
  private rt: THREE.WebGLRenderTarget;
  private materiale: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private scenaBake = new THREE.Scene();
  qualita: Qualita = 'alta';
  /** Se false il ghiaccio non viene disegnato (interruttore dei layer) */
  ghiacciVisibili = true;

  constructor(private renderer: THREE.WebGLRenderer, private mappe: GestoreMappeTerre) {
    const [w, h] = RISOLUZIONE.alta;
    this.rt = new THREE.WebGLRenderTarget(w, h, {
      count: 2,
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    });
    for (const t of this.rt.textures) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.NoColorSpace;
    }
    this.materiale = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: vert,
      fragmentShader: conRumore(frag),
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCentri: { value: Array.from({ length: N_PLACCHE }, () => new THREE.Vector3()) },
        uRaggi: { value: new Array(N_PLACCHE).fill(0) },
        uMappaA: { value: null }, uMappaB: { value: null },
        uMix: { value: 0 }, uPesoMappe: { value: 0 },
        uLivelloMare: { value: 0 }, uLatGhiaccio: { value: 90 },
        uMagma: { value: 1 }, uVegetazione: { value: 0 },
        uColoreOceano: { value: new THREE.Color() }, uColoreTerre: { value: new THREE.Color() },
      },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.materiale);
    this.quad.frustumCulled = false;
    this.scenaBake.add(this.quad);
  }

  get albedo(): THREE.Texture { return this.rt.textures[0]!; }
  get dati(): THREE.Texture { return this.rt.textures[1]!; }
  get dimensioni(): [number, number] { return [this.rt.width, this.rt.height]; }

  imposta(qualita: Qualita): void {
    if (qualita === this.qualita) return;
    this.qualita = qualita;
    const [w, h] = RISOLUZIONE[qualita];
    this.rt.setSize(w, h);
  }

  /** Ricalcola le texture per lo stato dato. */
  aggiorna(stato: StatoTerra): void {
    const u = this.materiale.uniforms;
    const cfg = configurazionePlacche(stato.ma, stato.frazioneTerre);
    (u.uCentri!.value as THREE.Vector3[]).forEach((v, i) => v.copy(cfg.centri[i]!));
    u.uRaggi!.value = cfg.raggi;
    const sel = this.mappe.seleziona(stato.ma);
    u.uMappaA!.value = sel.a;
    u.uMappaB!.value = sel.b;
    u.uMix!.value = sel.mix;
    u.uPesoMappe!.value = sel.pesoMappe;
    u.uLivelloMare!.value = stato.livelloMareM.v;
    u.uLatGhiaccio!.value = this.ghiacciVisibili ? stato.latitudineGhiaccio : 90;
    u.uMagma!.value = stato.coperturaMagma;
    u.uVegetazione!.value = stato.vegetazione;
    (u.uColoreOceano!.value as THREE.Color).setRGB(...stato.coloreOceano);
    (u.uColoreTerre!.value as THREE.Color).setRGB(...stato.coloreTerre);

    const precedente = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scenaBake, this.camera);
    this.renderer.setRenderTarget(precedente);
  }

  /**
   * `true` se la direzione locale (vettore unitario nel sistema del globo) cade su terra emersa nella superficie
   * calcolata. Legge un solo pixel dalla GPU: serve a scegliere il punto di eruzioni e impatti, non va chiamata a ogni frame.
   */
  terraInPunto(dir: THREE.Vector3): boolean {
    const [w, h] = this.dimensioni;
    // Inversa di dirDaUv dello shader: phi = atan2(z, −x), theta = acos(y)
    const phi = Math.atan2(dir.z, -dir.x);
    const u = (phi < 0 ? phi + 2 * Math.PI : phi) / (2 * Math.PI);
    const v = 1 - Math.acos(Math.min(Math.max(dir.y, -1), 1)) / Math.PI;
    const buf = new Uint8Array(4);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.renderer as any).readRenderTargetPixels(this.rt, Math.min(Math.floor(u * w), w - 1), Math.min(Math.floor(v * h), h - 1), 1, 1, buf, undefined, 1);
    return buf[3]! > 127;
  }

  /** Copertura di terre emerse (0–1, pesata per area) letta dalla GPU: serve solo per test e calibrazione. */
  leggiCopertura(): number {
    const [w, h] = this.dimensioni;
    const buf = new Uint8Array(w * h * 4);
    // Il secondo target (dati) ha la maschera terra nel canale alfa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.renderer as any).readRenderTargetPixels(this.rt, 0, 0, w, h, buf, undefined, 1);
    let somma = 0;
    let peso = 0;
    for (let y = 0; y < h; y++) {
      const lat = ((y + 0.5) / h - 0.5) * Math.PI;
      const c = Math.cos(lat);
      for (let x = 0; x < w; x++) { somma += (buf[(y * w + x) * 4 + 3]! / 255) * c; peso += c; }
    }
    return somma / peso;
  }
}
