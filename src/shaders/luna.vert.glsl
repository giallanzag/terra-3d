varying vec3 vPosOggetto;
varying vec3 vNormaleMondo;
void main() {
  vPosOggetto = position;
  vNormaleMondo = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
