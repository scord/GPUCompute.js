uniform float time;
uniform vec2 resolution;

uniform sampler2D in_position;
uniform sampler2D in_position_old;
uniform sampler2D in_acceleration;
uniform float timeScale;
uniform float delta;
varying vec2 vUv;
varying vec3 vPos;

void main()	{
	vec3 acc = texture2D( in_acceleration, vUv ).xyz;
	vec3 pos = texture2D( in_position, vUv ).xyz;;
	vec3 pos_old = texture2D( in_position_old, vUv ).xyz;

	vec3 vel = (pos-pos_old) + acc*delta;
	pos += vel;

	gl_FragColor = vec4(pos, 1);
}
