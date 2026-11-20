// Onda d'urto: anello che si espande sulla superficie (piano tangente).
uniform float uProgresso;   // 0 → 1
uniform vec3 uColore;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float fronte = uProgresso;
  float spessore = 0.06 + 0.1 * uProgresso;
  float a = smoothstep(spessore, 0.0, abs(r - fronte)) * (1.0 - uProgresso) * step(r, 1.0);
  gl_FragColor = vec4(uColore, a * 0.9);
}
