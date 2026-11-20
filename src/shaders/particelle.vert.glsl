attribute float aDim;
attribute float aAlpha;
attribute vec3 aColore;
uniform float uK;   // altezza viewport (px) / (2·tan(fov/2)): converte una dimensione in unità di scena in pixel
varying float vAlpha;
varying vec3 vColore;
void main() {
  vAlpha = aAlpha;
  vColore = aColore;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(aDim * uK / max(-mv.z, 0.1), 0.0);
  gl_Position = projectionMatrix * mv;
}
