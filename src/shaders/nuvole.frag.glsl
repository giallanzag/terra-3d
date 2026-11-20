// Strato di nuvole procedurale. La copertura media arriva dallo stato; la distribuzione in latitudine imita
// la circolazione atmosferica (ITCZ ed aree di tempesta alle medie latitudini, subtropici più sereni).
uniform vec3 uDirSole;
uniform float uCopertura;     // 0–1
uniform float uTempo;         // secondi, per la deriva
uniform float uLuce;
uniform float uMagma;         // 0–1: nuvole di vapore illuminate dal basso
varying vec3 vPosOggetto;
varying vec3 vNormaleMondo;
varying vec3 vPosMondo;

void main() {
  vec3 p = normalize(vPosOggetto);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float al = abs(lat);
  // Fasce zonali (valori approssimati): + ITCZ, + medie latitudini, − subtropici
  float bande = 0.55 + 0.25 * exp(-pow(al / 0.14, 2.0))
                     + 0.20 * exp(-pow((al - 0.85) / 0.22, 2.0))
                     - 0.28 * exp(-pow((al - 0.42) / 0.14, 2.0));
  // Deriva: rotazione lenta attorno all'asse polare
  float ang = uTempo * 0.012;
  float cs = cos(ang), sn = sin(ang);
  vec3 q = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);
  vec3 w = vec3(fbm(q * 2.0 + 3.0), fbm(q * 2.0 + 9.0), fbm(q * 2.0 + 17.0)) - 0.5;
  float dens = fbm((q + 0.35 * w) * vec3(3.0, 4.2, 3.0) + 5.0);   // allungate lungo i paralleli

  float C = clamp(uCopertura * mix(1.0, bande * 1.45, 0.75), 0.0, 1.0);
  // L'fbm ha media ~0,5 e deviazione ~0,1: la soglia è scelta perché la frazione coperta sia ≈ C (valore approssimato)
  float soglia = 0.5 - (C - 0.5) * 0.6;
  float nube = smoothstep(soglia - 0.03, soglia + 0.1, dens);

  vec3 n = normalize(vNormaleMondo);
  float luce = max(dot(n, normalize(uDirSole)), 0.0);
  float term = smoothstep(-0.05, 0.3, dot(n, normalize(uDirSole)));
  vec3 bianco = vec3(0.97, 0.98, 1.0);
  vec3 vapore = vec3(1.0, 0.78, 0.6);                // nuvole di vapore dell'Adeano
  vec3 base = mix(bianco, vapore, uMagma);
  vec3 col = base * (0.04 + 1.05 * luce * term) * uLuce * (0.8 + 0.3 * fbm(q * 12.0));
  col += vec3(1.0, 0.4, 0.1) * uMagma * 0.32;       // riflesso del magma sul lato in ombra

  gl_FragColor = vec4(col, nube * mix(0.8, 0.9, uMagma));
}
