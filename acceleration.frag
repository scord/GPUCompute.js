uniform float time;
uniform vec2 resolution;

uniform sampler2D in_position;
uniform sampler2D in_acceleration;
uniform vec3 gravityPosition;
uniform float timeScale;


varying vec2 vUv;
varying vec3 vPos;

void main()	{
	vec3 pos = texture2D( in_position, vUv ).xyz;

	float dist = clamp(distance(gravityPosition, pos), 3.0, 100.0);

	vec3 acc = normalize(gravityPosition - pos)/(dist*dist);

	gl_FragColor = vec4(acc, 1);
}
