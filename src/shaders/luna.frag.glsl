// Luna procedurale: altopiani chiari, "mari" basaltici scuri (soprattutto sulla faccia visibile, +z locale = verso
// la Terra), crateri (rumore cellulare) e, nei primi ~150 milioni di anni, un oceano di magma incandescente.
uniform vec3 uDirSole;
uniform float uLuce;
uniform float uMari;       // 0–1
uniform float uMagma;      // 0–1
uniform float uApparizione;
varying vec3 vPosOggetto;
varying vec3 vNormaleMondo;

// Distanza dal centro del cratere più vicino (rumore cellulare 3D, F1)
float cellulare(vec3 p, out float id) {
  vec3 i = floor(p), f = fract(p);
  float dmin = 8.0; id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 c = vec3(float(x), float(y), float(z));
    float h = hash31(i + c);
    vec3 o = vec3(h, hash31(i + c + 7.3), hash31(i + c + 13.1));
    float d = length(c + o - f);
    if (d < dmin) { dmin = d; id = h; }
  }
  return dmin;
}

void main() {
  vec3 p = normalize(vPosOggetto);
  float id;
  float c1 = cellulare(p * 5.0, id);
  float c2 = cellulare(p * 13.0 + 3.0, id);
  // Crateri: pavimento leggermente più scuro, bordo più chiaro
  float cr = smoothstep(0.35, 0.28, c1) * 0.12 - smoothstep(0.28, 0.38, c1) * smoothstep(0.45, 0.38, c1) * 0.12
           + smoothstep(0.3, 0.22, c2) * 0.08;
  float rug = fbm(p * 9.0);

  vec3 altopiano = vec3(0.62, 0.60, 0.57) * (0.85 + 0.3 * rug);
  vec3 mare = vec3(0.24, 0.24, 0.27);
  float faccia = smoothstep(-0.2, 0.7, p.z);                 // i mari sono concentrati sulla faccia visibile
  float m = smoothstep(0.52, 0.58, fbm(p * 1.7 + 4.0) + 0.12 * faccia - 0.05) * uMari;
  vec3 alb = mix(altopiano, mare, m) + cr;

  vec3 n = normalize(vNormaleMondo);
  float luce = max(dot(n, normalize(uDirSole)), 0.0);
  vec3 col = alb * (0.03 + 1.1 * luce) * uLuce;

  // Magma: crepe luminose e pozze
  if (uMagma > 0.001) {
    float pozze = smoothstep(1.0 - 1.1 * uMagma, 1.1 - 1.1 * uMagma, fbm(p * 2.5 + 1.0));
    vec3 lava = mix(vec3(0.7, 0.12, 0.02), vec3(1.0, 0.65, 0.15), fbm(p * 6.0));
    col = mix(col, lava, pozze * uMagma);
    col += lava * pozze * uMagma * 0.6;
  }
  col = pow(max(col, vec3(0.0)), vec3(0.8));   // stessa curva del globo
  gl_FragColor = vec4(col, uApparizione);
}
