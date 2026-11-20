attribute float aDimensione;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aDimensione;
  gl_Position = projectionMatrix * mv;
}
