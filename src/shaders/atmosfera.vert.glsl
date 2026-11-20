varying vec3 vNormaleMondo;
varying vec3 vPosMondo;
void main() {
  vNormaleMondo = normalize(mat3(modelMatrix) * normal);
  vec4 pm = modelMatrix * vec4(position, 1.0);
  vPosMondo = pm.xyz;
  gl_Position = projectionMatrix * viewMatrix * pm;
}
