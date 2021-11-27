var Shader = {
  fragmentShader:
    "uniform vec3 glowColor; varying float intensity; void main(){ vec3 glow = glowColor * (intensity); gl_FragColor = vec4( glow, 0.3);}",
  // "varying float intensity;",

  // "void main(){",
  // "vec3 glow = glowColor * (intensity);",
  // "gl_FragColor = vec4( glow, 0.9);",
  // "}"
  // ].join("\n"),
  vertexShader: [
    " uniform float p;",
    " varying float intensity;",
    " void main(){",
    " vec3 vNormal = normalize( normalMatrix * normal );",
    "   intensity =pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), p);",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n")

};

export { Shader }