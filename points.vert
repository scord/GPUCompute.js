uniform float time;
uniform vec2 resolution;
uniform sampler2D positionTexture;
uniform float size;
uniform float in_pointSize;
varying vec3 vPos;
varying float pointSize;
uniform float in_pointBrightness;

varying float attenuation;
void main()	{


	vec2 uv = position.xy ;
	vec4 data = texture2D( positionTexture, uv );

	vPos = data.xyz;

	vec4 p = projectionMatrix * modelViewMatrix * vec4( vPos, 1.0 );
	attenuation = p.w;
	pointSize = in_pointSize;
	gl_PointSize = pointSize/attenuation;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( vPos, 1.0 );
}
