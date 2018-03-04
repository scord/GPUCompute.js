uniform float time;
uniform vec2 resolution;

uniform sampler2D in_position;
uniform sampler2D in_velocity;
uniform vec3 gravityPosition;

varying vec2 vUv;
varying vec3 vPos;

void main()	{
	vec4 data = texture2D( in_position, vUv );
	vec3 pos = data.xyz;

	vec4 data2 = texture2D( in_velocity, vUv );
	vec3 vel = data2.xyz;

	float dist = clamp(distance(gravityPosition, pos), 1.0, 5.0);


	vec3 toOrigin = normalize(gravityPosition - pos)/(dist*dist);

	vel += toOrigin*0.001;
	gl_FragColor = vec4(vel, 1);
}
