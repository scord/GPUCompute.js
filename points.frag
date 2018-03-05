uniform float time;
uniform vec2 resolution;

varying float pointSize;

uniform float in_pointBrightness;
varying float attenuation;
uniform float in_pointIntensity;

uniform float in_hue;
uniform float in_saturation;
uniform float in_lightness;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main()	{
	float dist = length(2.0 * gl_PointCoord - 1.0);
	//float val = 10.0*pow(clamp(dist*pointSize, 0.0, pointSize), 10.0);
	//float val = (1.0/dist - 1.0/pointSize)/(1.0+attenuation);
	float val = clamp(0.5*in_pointBrightness*pow(clamp(1.0 - dist,0.0,1.0), clamp(pointSize,0.0,1.0)), 0.0, 1.0);

	vec3 c = hsv2rgb(vec3(
        in_hue/360.0,
        in_saturation,
        in_lightness*val
    ));

	gl_FragColor = vec4(c,1.0);
}
