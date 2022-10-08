varying vec2 vUv;
uniform vec3 faceColor;

void main() {
    vec3 border = vec3(0.133);
    // float bl = smoothstep(0.0, 0.03, vUv.x);
    // float br = smoothstep(1.0, 0.97, vUv.x);
    // float bt = smoothstep(0.0, 0.03, vUv.y);
    // float bb = smoothstep(1.0, 0.97, vUv.y);

    // float bl = smoothstep(0.0, 0.23, vUv.x);
    // float br = smoothstep(1.0, 0.77, vUv.x);
    // float bt = smoothstep(0.0, 0.23, vUv.y);
    // float bb = smoothstep(1.0, 0.77, vUv.y);

    float bl = smoothstep(0.0, 0.13, vUv.x);
    float br = smoothstep(1.0, 0.87, vUv.x);
    float bt = smoothstep(0.0, 0.13, vUv.y);
    float bb = smoothstep(1.0, 0.87, vUv.y);
    vec3 c = mix(border, faceColor, bt*br*bb*bl);
    gl_FragColor = vec4(c, 1.0);
}