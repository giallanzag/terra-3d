import * as THREE from 'three';
import vert from '../shaders/nuvole.vert.glsl?raw';
import frag from '../shaders/nuvole.frag.glsl?raw';
import { conRumore } from './shader';
import type { StatoTerra } from '../state/stato';

/** Guscio di nuvole procedurali appena sopra la superficie. */
export class Nuvole {
  readonly mesh: THREE.Mesh;
  private materiale: THREE.ShaderMaterial;

  constructor(dirSole: THREE.Vector3) {
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: conRumore(frag),
      uniforms: {
        uDirSole: { value: dirSole },
        uCopertura: { value: 0.67 },
        uTempo: { value: 0 },
        uLuce: { value: 1 },
        uMagma: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    // Raggio 1,012: quota delle nuvole ingrandita (reale ~10 km su 6371 km = 0,15%) per vedere il parallasse
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1.012, 128, 64), this.materiale);
  }

  aggiorna(stato: StatoTerra, tempoS: number, attenuazione = 1): void {
    const u = this.materiale.uniforms;
    u.uCopertura!.value = stato.coperturaNuvole;
    u.uTempo!.value = tempoS;
    u.uLuce!.value = (0.55 + 0.45 * stato.luminositaSole) * attenuazione;
    u.uMagma!.value = stato.coperturaMagma;
  }
}
