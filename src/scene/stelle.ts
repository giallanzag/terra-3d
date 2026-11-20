import * as THREE from 'three';
import vert from '../shaders/stelle.vert.glsl?raw';
import frag from '../shaders/stelle.frag.glsl?raw';

/** Campo di stelle sulla sfera celeste (posizioni pseudo-casuali ma deterministiche). */
export function creaStelle(n = 2500): THREE.Points {
  let seme = 12345;
  const rnd = () => ((seme = (seme * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pos = new Float32Array(n * 3);
  const dim = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const f = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pos.set([r * Math.cos(f) * 80, u * 80, r * Math.sin(f) * 80], i * 3);
    dim[i] = 1 + rnd() * rnd() * 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aDimensione', new THREE.BufferAttribute(dim, 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.Points(g, m);
}
