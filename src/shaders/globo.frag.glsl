// Illuminazione del globo: campiona la superficie precalcolata (albedo + dati) e applica luce, rilievo,
// riflesso speculare sugli oceani ed emissione del magma.
uniform sampler2D tAlbedo;
uniform sampler2D tDati;        // (quota, speculare oceano, lava, terra)
uniform vec2 uTexel;            // 1 / dimensioni della texture
uniform vec3 uDirSole;
uniform float uLuce;            // luminosità del Sole relativa ad oggi
uniform float uRilievo;
uniform vec3 uColoreVelo;       // colore della foschia atmosferica
uniform float uVelo;            // 0–1 intensità della foschia         // intensità del rilievo (bump)
varying vec2 vUv;
varying vec3 vNormaleMondo;
varying vec3 vPosMondo;

void main() {
  vec3 n = normalize(vNormaleMondo);
  vec3 L = normalize(uDirSole);
  vec3 V = normalize(cameraPosition - vPosMondo);

  vec3 alb = texture2D(tAlbedo, vUv).rgb;
  vec4 d = texture2D(tDati, vUv);
  float terra = d.a;

  // Rilievo: gradiente della quota (4 campioni) proiettato su est/nord
  float hE = texture2D(tDati, vUv + vec2(uTexel.x, 0.0)).r;
  float hW = texture2D(tDati, vUv - vec2(uTexel.x, 0.0)).r;
  float hN = texture2D(tDati, vUv + vec2(0.0, uTexel.y)).r;
  float hS = texture2D(tDati, vUv - vec2(0.0, uTexel.y)).r;
  vec3 est = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
  vec3 nord = cross(n, est);
  float sc = uRilievo * terra;           // solo sulle terre emerse
  vec3 nn = normalize(n - sc * ((hE - hW) * est + (hN - hS) * nord));

  // Luce "avvolgente" (wrap lighting): il buio non arriva di colpo al terminatore, come per la diffusione atmosferica
  float diff = max((dot(nn, L) + 0.2) / 1.2, 0.0);
  float terminatore = smoothstep(-0.2, 0.3, dot(n, L));   // transizione morbida giorno/notte
  vec3 col = alb * (0.09 + 1.15 * diff * terminatore) * uLuce;

  // Oceano: riflesso del Sole + un velo di cielo ai bordi (Fresnel)
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 120.0) * d.g * terminatore;
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0) * d.g;
  col += vec3(1.0, 0.95, 0.85) * spec * 0.9 * uLuce;
  col += vec3(0.25, 0.4, 0.7) * fres * 0.35 * terminatore;

  // Lava: emissione propria, visibile anche di notte
  col += vec3(1.0, 0.42, 0.08) * d.b * 1.5;

  // Foschia atmosferica (es. metano arancione dell'Archeano): più densa verso l'orizzonte
  float spessore = 0.35 + 0.65 * (1.0 - max(dot(n, V), 0.0));
  col = mix(col, uColoreVelo * (0.12 + 0.75 * terminatore) * uLuce, uVelo * spessore);

  // Sollevamento delle ombre (gamma 0,8): schiarisce i toni scuri senza bruciare i chiari
  col = pow(max(col, vec3(0.0)), vec3(0.8));

  // Dithering (rumore a gradiente interlacciato): elimina il banding a 8 bit nelle zone scure
  float ig = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  col += (ig - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
