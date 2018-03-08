uniform float time;
uniform vec2 resolution;
uniform float size;
uniform sampler2D in_position;
uniform sampler2D in_position_old;
uniform sampler2D in_acceleration;
uniform float timeScale;
uniform float delta;
varying vec2 vUv;
varying vec3 vPos;

void main()	{

	vec3 pos = texture2D( in_position, vUv ).xyz;

	if (vUv.x > 0) {
		vec3 link = texture2D( in_position, vUv + vec2(1.0/size, 0.0)).xyz;
		float constraint = link - pos;
		float dist = length(constraint);
		vec3 correction = constraint*(1.0 - 0.1/dist)*0.5;
		pos += correction;
	}

	if (vUv.y > 0) {
		vec3 link = texture2D( in_position, vUv + vec2(0.0, 1.0/size)).xyz;
		float constraint = link - pos;
		float dist = length(constraint);
		vec3 correction = constraint*(1.0 - 0.1/dist)*0.5;
		pos += correction;
	}


	gl_FragColor = vec4(pos, 1);
}
