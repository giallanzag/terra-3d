import * as THREE from 'three';
import vert from '../shaders/globo.vert.glsl?raw';
import frag from '../shaders/globo.frag.glsl?raw';
import type { Superficie } from './superficie';
import type { StatoTerra } from '../state/stato';

/** Globo: campiona la superficie precalcolata e la illumina. */
export class Globo {
  readonly mesh: THREE.Mesh;
  private materiale: THREE.ShaderMaterial;

  constructor(private superficie: Superficie, dirSole: THREE.Vector3) {
    this.materiale = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        tAlbedo: { value: superficie.albedo },
        tDati: { value: superficie.dati },
        uTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) },
        uDirSole: { value: dirSole },
        uLuce: { value: 1 },
        uRilievo: { value: 6 },
        uColoreVelo: { value: new THREE.Color() },
        uVelo: { value: 0 },
      },
    });
    // 160×80 segmenti: sfera liscia anche da vicino
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 80), this.materiale);
  }

  aggiorna(stato: StatoTerra, attenuazione = 1): void {
    const u = this.materiale.uniforms;
    const [w, h] = this.superficie.dimensioni;
    (u.uTexel!.value as THREE.Vector2).set(1 / w, 1 / h);
    u.tAlbedo!.value = this.superficie.albedo;
    u.tDati!.value = this.superficie.dati;
    // Il Sole giovane è più debole (≈ 72%): illuminazione scalata leggermente (effetto attenuato per la leggibilità)
    (u.uColoreVelo!.value as THREE.Color).setRGB(...stato.coloreAtmosfera);
    u.uVelo!.value = stato.veloAtmosferico;
    u.uLuce!.value = (0.55 + 0.45 * stato.luminositaSole) * attenuazione;
  }
}
