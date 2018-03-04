uniform float time;
uniform vec2 resolution;

uniform sampler2D in_position;
uniform sampler2D in_velocity;
uniform float timeScale;
varying vec2 vUv;
varying vec3 vPos;

void main()	{
	vec4 data = texture2D( in_velocity, vUv );
	vec3 vel = data.xyz;

	vec4 data2 = texture2D( in_position, vUv );
	vec3 pos = data2.xyz;

	pos = pos + vel*timeScale;

	gl_FragColor = vec4(pos, 1);
}
