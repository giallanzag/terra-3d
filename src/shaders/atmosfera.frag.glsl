// Scattering semplificato: alone di Fresnel, schiarito sul lato illuminato (Rayleigh/Mie approssimati).
uniform vec3 uDirSole;
uniform vec3 uColore;
uniform float uDensita;
varying vec3 vNormaleMondo;
varying vec3 vPosMondo;

void main() {
  vec3 n = normalize(vNormaleMondo);
  vec3 v = normalize(cameraPosition - vPosMondo);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float sole = dot(n, normalize(uDirSole));
  float giorno = smoothstep(-0.25, 0.6, sole);
  // Al tramonto/alba lo spessore maggiore di aria arrossa la luce
  float tramonto = exp(-pow(sole * 4.0, 2.0));
  vec3 col = mix(uColore, vec3(1.0, 0.5, 0.25), tramonto * 0.6);
  float a = fresnel * giorno * uDensita * 2.4;
  gl_FragColor = vec4(col * a, a);
}
