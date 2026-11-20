import * as THREE from 'three';
import vert from '../shaders/luna.vert.glsl?raw';
import frag from '../shaders/luna.frag.glsl?raw';
import { conRumore } from './shader';
import { RAGGIO_LUNA_SCENA, distanzaLunaScena, velocitaOrbitaLuna } from './orbite';
import type { StatoTerra } from '../state/stato';

/** Luna: distanza, dimensione apparente, fase orbitale, magma e mari dipendono dallo stato. */
export class Luna {
  readonly mesh: THREE.Mesh;
  private materiale: THREE.ShaderMaterial;
  /** Posizione orbitale (rad). Pubblica per i test. */
  angolo = 0.6;
  private inclinazione = new THREE.Euler(0.25, 0, 0);   // piano orbitale inclinato (≈ valore illustrativo)
  visibile = true;

  constructor(dirSole: THREE.Vector3) {
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: conRumore(frag),
      uniforms: {
        uDirSole: { value: dirSole },
        uLuce: { value: 1 },
        uMari: { value: 1 },
        uMagma: { value: 0 },
        uApparizione: { value: 1 },
      },
      transparent: true,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(RAGGIO_LUNA_SCENA, 64, 32), this.materiale);
  }

  /** `omegaTerra` in rad/s (velocità visiva di rotazione terrestre), `dt` in secondi. */
  aggiorna(stato: StatoTerra, omegaTerra: number, dt: number): void {
    this.mesh.visible = this.visibile && stato.lunaPresente > 0.001;
    if (!this.mesh.visible) return;
    this.angolo += velocitaOrbitaLuna(stato, omegaTerra) * dt;
    const D = distanzaLunaScena(stato.distanzaLunaRT.v);
    const pos = new THREE.Vector3(Math.cos(this.angolo) * D, 0, Math.sin(this.angolo) * D).applyEuler(this.inclinazione);
    this.mesh.position.copy(pos);
    this.mesh.lookAt(0, 0, 0);                         // blocco mareale: sempre la stessa faccia verso la Terra
    // Comparsa: i detriti si riuniscono (la Luna cresce e diventa opaca)
    const a = stato.lunaPresente;
    this.mesh.scale.setScalar(0.35 + 0.65 * a);
    const u = this.materiale.uniforms;
    u.uApparizione!.value = Math.min(a * 2, 1);
    u.uMari!.value = stato.mariLuna;
    u.uMagma!.value = stato.magmaLuna;
    u.uLuce!.value = 0.55 + 0.45 * stato.luminositaSole;
  }
}
