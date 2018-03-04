uniform float time;
uniform vec2 resolution;

varying float pointSize;

uniform float in_pointBrightness;

void main()	{
	vec2 pPos = 2.0 * gl_PointCoord - 1.0;
	float val = in_pointBrightness - dot(pPos,pPos);
	gl_FragColor = vec4(1.0,0.3,0.9,1.0*pointSize)*val;
}
