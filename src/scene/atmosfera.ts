import * as THREE from 'three';
import vert from '../shaders/atmosfera.vert.glsl?raw';
import frag from '../shaders/atmosfera.frag.glsl?raw';
import type { StatoTerra } from '../state/stato';

/** Guscio atmosferico con scattering semplificato (alone di Fresnel). */
export class Atmosfera {
  readonly mesh: THREE.Mesh;
  private materiale: THREE.ShaderMaterial;

  constructor(dirSole: THREE.Vector3) {
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uDirSole: { value: dirSole },
        uColore: { value: new THREE.Color(0.3, 0.55, 1) },
        uDensita: { value: 0.5 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // Raggio 1,06: spessore ingrandito rispetto al reale (~100 km su 6371 km ≈ 1,6%) per leggibilità
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1.06, 96, 48), this.materiale);
  }

  /** `cenere` 0–1: velo di ceneri/polveri (dopo impatti ed eruzioni) che scurisce e arrossa l'alone. */
  aggiorna(stato: StatoTerra, cenere = 0): void {
    const u = this.materiale.uniforms;
    const c = stato.coloreAtmosfera;
    (u.uColore!.value as THREE.Color).setRGB(
      c[0] + (0.5 - c[0]) * cenere * 0.7, c[1] + (0.32 - c[1]) * cenere * 0.7, c[2] + (0.22 - c[2]) * cenere * 0.7);
    u.uDensita!.value = stato.densitaAtmosfera * (1 + 0.35 * cenere);
  }
}
