import * as THREE from 'three';
import vert from '../shaders/bagliore.vert.glsl?raw';
import frag from '../shaders/bagliore.frag.glsl?raw';
import { coloreSole } from './orbite';
import type { StatoTerra } from '../state/stato';

const DISTANZA = 70;
/** Diametro angolare visivo del disco solare (gradi). Reale: 0,53°; ingrandito per leggibilità. */
const DIAMETRO_VISIVO_GRADI = 3.2;

/** Sole: disco con alone, dimensione e colore dipendenti da raggio e temperatura (Sole giovane più piccolo e più arancione). */
export class Sole {
  readonly mesh: THREE.Mesh;
  private materiale: THREE.ShaderMaterial;

  constructor(dirSole: THREE.Vector3) {
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uColore: { value: new THREE.Color(1, 0.95, 0.85) },
        uAlpha: { value: 1 },
        uDisco: { value: 0.16 },
        uNucleo: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.materiale);
    this.mesh.position.copy(dirSole).multiplyScalar(DISTANZA);
    this.mesh.renderOrder = 5;
  }

  aggiorna(stato: StatoTerra, camera: THREE.Camera): void {
    // L'alone occupa 6× il disco: dimensione totale in unità di scena
    const dischi = 2 * DISTANZA * Math.tan((DIAMETRO_VISIVO_GRADI * Math.PI) / 360) * stato.raggioSole;
    this.mesh.scale.setScalar(dischi * 6);
    this.mesh.quaternion.copy(camera.quaternion);      // billboard
    (this.materiale.uniforms.uColore!.value as THREE.Color).setRGB(...coloreSole(stato.temperaturaSoleK));
  }
}
