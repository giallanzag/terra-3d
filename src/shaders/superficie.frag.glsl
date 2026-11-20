// "Bake" della superficie su una texture equirettangolare (due target):
//   oAlbedo = colore della superficie (terre, oceani, ghiacci, crosta)
//   oDati   = (quota, maschera speculare oceano, emissione lavica, maschera terra)
// Viene rieseguito solo quando cambia il tempo; il globo si limita a campionare le texture e a illuminarle.
precision highp float;
precision highp sampler2D;

uniform vec3 uCentri[8];        // centri delle placche (modello procedurale)
uniform float uRaggi[8];        // raggi angolari (rad), già scalati sulla frazione di terre emerse
uniform sampler2D uMappaA;      // mappe terra/mare reali (R nitida, G sfocata, B molto sfocata)
uniform sampler2D uMappaB;
uniform float uMix;             // 0 = A, 1 = B
uniform float uPesoMappe;       // 0 = continenti procedurali, 1 = mappe reali
uniform float uLivelloMare;     // m rispetto ad oggi
uniform float uLatGhiaccio;     // gradi: ghiaccio oltre questa latitudine (≥ 89 = nessuno)
uniform float uMagma;           // 0–1
uniform float uVegetazione;     // 0–1
uniform vec3 uColoreOceano;
uniform vec3 uColoreTerre;

in vec2 vUv;
layout(location = 0) out vec4 oAlbedo;
layout(location = 1) out vec4 oDati;

const float PI = 3.14159265359;

// Stessa convenzione di THREE.SphereGeometry (vedi scene/continenti.ts)
vec3 dirDaUv(vec2 uv) {
  float phi = uv.x * 2.0 * PI;
  float theta = (1.0 - uv.y) * PI;
  return vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
}

// Campo procedurale: 1 al centro di una placca, 0,5 al suo bordo nominale; deformato da rumore per forme irregolari.
float campoProcedurale(vec3 p) {
  vec3 w = vec3(fbm(p * 1.6 + 1.3), fbm(p * 1.6 + 7.1), fbm(p * 1.6 + 13.7)) - 0.5;
  vec3 q = normalize(p + 0.55 * w);
  float f = -1.0;
  for (int i = 0; i < 8; i++) {
    float a = acos(clamp(dot(q, uCentri[i]), -1.0, 1.0));
    f = max(f, 1.0 - 0.5 * a / max(uRaggi[i] * 1.18, 1e-3));   // 1,18: calibrazione sulla copertura attuale (≈29%)
  }
  return f + 0.28 * (fbm(p * 5.0 + 3.0) - 0.5);
}

void main() {
  vec3 p = dirDaUv(vUv);
  float lat = degrees(asin(clamp(p.y, -1.0, 1.0)));
  float al = abs(lat);

  // ── terra / mare ───────────────────────────────────────────────────────
  float fP = campoProcedurale(p);
  float sogliaP = 0.5 + 0.00012 * uLivelloMare;           // livello del mare: variazione contenuta, il grosso è in frazioneTerre
  float terraP = smoothstep(sogliaP - 0.03, sogliaP + 0.03, fP);
  float contP = clamp((fP - 0.5) * 2.0, 0.0, 1.0);
  float profP = clamp((sogliaP - fP) * 1.5, 0.0, 1.0);

  float terraM = 0.0, contM = 0.0, profM = 1.0;
  if (uPesoMappe > 0.001) {
    vec3 m = mix(texture(uMappaA, vUv).rgb, texture(uMappaB, vUv).rgb, uMix);
    float fM = m.g + 0.12 * (m.r - 0.5);
    float sogliaM = 0.5 + 0.0020 * uLivelloMare;         // piattaforme continentali: ±130 m spostano la costa di ~1–2°
    terraM = smoothstep(sogliaM - 0.04, sogliaM + 0.04, fM);
    contM = m.b;
    profM = clamp((sogliaM - fM) * 1.5, 0.0, 1.0);
  }
  float terra = mix(terraP, terraM, uPesoMappe);
  float cont = mix(contP, contM, uPesoMappe);
  float prof = mix(profP, profM, uPesoMappe);

  // ── quota ──────────────────────────────────────────────────────────────
  float cat = pow(1.0 - abs(2.0 * fbm(p * 3.5 + 21.0) - 1.0), 2.0);   // catene montuose (rumore "ridged")
  float quota = clamp(0.25 * cont + 0.25 * (fbm(p * 9.0) - 0.4) + 0.55 * cat * smoothstep(0.15, 0.55, cont), 0.0, 1.0);
  float h = terra > 0.5 ? 0.5 + 0.5 * quota : 0.5 - 0.5 * prof;

  // ── clima: biomi in funzione di latitudine e continentalità ───────────
  float zona = fbm(p * 2.5 + 40.0);
  float arido = smoothstep(7.0, 16.0, al) * (1.0 - smoothstep(28.0, 40.0, al))
              * smoothstep(0.25, 0.65, cont + 0.25 * (zona - 0.5));
  vec3 tropicale = vec3(0.05, 0.27, 0.07);
  vec3 temperato = vec3(0.17, 0.36, 0.11);
  vec3 boreale   = vec3(0.07, 0.2, 0.12);
  vec3 tundra    = vec3(0.45, 0.45, 0.36);
  vec3 verde = mix(tropicale, temperato, smoothstep(12.0, 32.0, al));
  verde = mix(verde, boreale, smoothstep(48.0, 58.0, al));
  verde = mix(verde, tundra, smoothstep(62.0, 72.0, al));
  verde *= 0.85 + 0.3 * fbm(p * 14.0);
  vec3 sabbia = vec3(0.72, 0.58, 0.36) * (0.9 + 0.2 * fbm(p * 11.0));
  vec3 biomi = mix(verde, sabbia, arido);

  vec3 nuda = uColoreTerre * (0.85 + 0.3 * fbm(p * 12.0));
  vec3 roccia = vec3(0.42, 0.39, 0.37);
  vec3 colTerra = mix(nuda, biomi, uVegetazione * (1.0 - 0.6 * arido));
  colTerra = mix(colTerra, mix(roccia, colTerra, 0.35), smoothstep(0.6, 0.85, quota));   // alte quote: roccia

  // ── oceano: più chiaro e turchese vicino alla costa ────────────────────
  vec3 colOceano = uColoreOceano * mix(1.0, 0.55, smoothstep(0.0, 0.8, prof));
  colOceano += vec3(0.02, 0.16, 0.17) * pow(1.0 - prof, 6.0);

  vec3 alb = mix(colOceano, colTerra, terra);
  float speculare = 1.0 - terra;

  // ── ghiaccio ───────────────────────────────────────────────────────────
  float ghiaccio = 0.0;
  if (uLatGhiaccio < 89.0) {
    // Bordo irregolare: ampiezza ridotta quando il limite è vicino all'equatore (palla di neve → fascia equatoriale stretta)
    float limite = uLatGhiaccio + (fbm(p * 3.0 + 5.0) - 0.5) * mix(4.0, 14.0, smoothstep(5.0, 45.0, uLatGhiaccio));
    float g = smoothstep(-3.0, 3.0, al - limite);
    float sulla_terra = smoothstep(0.2, 0.6, cont + (al - limite) / 25.0);   // le grandi masse continentali gelano per prime
    ghiaccio = g * mix(1.0, sulla_terra, terra);
    vec3 neve = vec3(0.93, 0.96, 1.0);
    vec3 mare_ghiacciato = mix(vec3(0.74, 0.86, 0.94), neve, smoothstep(0.3, 0.7, fbm(p * 18.0)));
    // crepe scure nella banchisa
    float crepe = 1.0 - smoothstep(0.0, 0.08, abs(fbm(p * 25.0) - 0.5));
    mare_ghiacciato *= 1.0 - 0.05 * crepe;
    alb = mix(alb, mix(mare_ghiacciato, neve, terra), ghiaccio);
    speculare *= 1.0 - ghiaccio;
    h = mix(h, max(h, 0.52), ghiaccio * (1.0 - terra));  // la banchisa appiattisce i fondali
  }

  // ── magma ──────────────────────────────────────────────────────────────
  float lava = 0.0;
  if (uMagma > 0.001) {
    float pozze = smoothstep(1.0 - 1.05 * uMagma, 1.0 - 1.05 * uMagma + 0.1, fbm(p * 2.2) + 0.1 * fbm(p * 7.0));
    float fratt = (1.0 - smoothstep(0.0, 0.1, abs(fbm(p * 3.2 + 9.0) - 0.5))) * smoothstep(0.0, 0.5, uMagma);
    lava = clamp(max(pozze, fratt), 0.0, 1.0);
    vec3 crosta = vec3(0.1, 0.085, 0.075) * (0.7 + 0.6 * fbm(p * 10.0));
    float k = smoothstep(0.0, 0.1, uMagma);       // con poco magma torna la superficie normale
    alb = mix(alb, mix(crosta, vec3(0.5, 0.1, 0.02), lava), k);
    speculare *= 1.0 - k;
    lava *= k;
  }

  oAlbedo = vec4(alb, 1.0);
  oDati = vec4(h, speculare, lava, terra);
}
