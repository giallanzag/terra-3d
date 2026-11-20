// Bagliore radiale con (opzionale) disco pieno: usato per il Sole, i lampi degli impatti e il magma.
uniform vec3 uColore;
uniform float uAlpha;
uniform float uDisco;      // raggio relativo del disco pieno (0 = solo alone)
uniform float uNucleo;     // intensità del nucleo molto luminoso
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  if (r > 1.0) discard;
  float alone = pow(1.0 - r, 2.5);
  float disco = uDisco > 0.0 ? smoothstep(uDisco, uDisco * 0.9, r) : 0.0;
  float nucleo = uNucleo * exp(-r * r * 40.0);
  float a = clamp(alone * 0.8 + disco + nucleo, 0.0, 1.0) * uAlpha;
  gl_FragColor = vec4(mix(uColore, vec3(1.0), clamp(disco + nucleo, 0.0, 1.0) * 0.7), a);
}
