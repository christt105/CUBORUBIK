varying vec2 vUv;
uniform vec3 faceColor;

void main() {
    vec3 border = vec3(0.133);

    vec3 c = faceColor;
    float margin = 0.04;
    if(vUv.x < margin || vUv.x > 1.0 - margin || vUv.y < margin || vUv.y > 1.0 - margin)
        c = border;

    gl_FragColor = vec4(c, 1.0);
}