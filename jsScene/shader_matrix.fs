
uniform float iTime;
uniform int status;
uniform sampler2D tExplosion;
uniform vec2 resolution;

#ifdef GL_ES
precision mediump float;
#endif


uniform vec3 diffuse;
varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;

/** voronoi */ 
vec2 hash2( vec2 p )
{
    // procedural white noise
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 voronoi( in vec2 x )
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    //----------------------------------
    // first pass: regular voronoi
    //----------------------------------
  vec2 mg, mr;

    float md = 8.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = vec2(float(i),float(j));
        vec2 o = hash2( n + g );
        vec2 r = g + o - f;
        float d = dot(r,r);

        if( d<md )
        {
            md = d;
            mr = r;
            mg = g;
        }
    }

    //----------------------------------
    // second pass: distance to borders
    //----------------------------------
    md = 8.0;
    for( int j=-2; j<=2; j++ )
    for( int i=-2; i<=2; i++ )
    {
        vec2 g = mg + vec2(float(i),float(j));
        vec2 o = hash2( n + g );
        vec2 r = g + o - f;

        if( dot(mr-r,mr-r)>0.00001 )
        md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
    }

    return vec3( md, mr );
}

/** GLITCH */
#define PI 3.141592

float random(vec2 p){
    float q = dot(p,vec2(127.1,311.7));
    return fract(sin(q)*437.53);
}
vec4 glitch(vec2 p){
    float b=0.5;
    vec4 c=texture2D(tExplosion,p);
   float t=iTime-mod(iTime,0.7);//iTime-mod(iTime,0.3);
    vec2 q=p-mod(p,b);
    for(float i=0.0;i<15.0;i++){
       if(random(q)>0.3){
           q=p-mod(p,b);
       }else{
           break;
       }
        b*=random(vec2(mod(iTime,1.5)))<0.3?1.0:clamp(sin(t/10.0-5.5),0.65-random(vec2(t/10.0-5.5)),0.65+random(vec2(t/10.0-5.5)));
      // b*=0.65;
    }
    
    c.a-=0.0;//random(vec2(mod(iTime,1.5)))<0.3?0.0:0.3*random(q);
    c.rgb+=random(vec2(mod(iTime,1.5)))<0.3?vec3(0.0):vec3(random(q)*2.0,0.2,random(vec2(q.y,q.x))*2.0-1.0);
    c.rgb-=random(vec2(mod(iTime,1.5)))<0.3 && random(q)<0.01 ? vec3(0.0):texture2D(tExplosion,p+vec2(random(q)*2.0-1.0,0.0)).rgb;
    c.xyz-=random(vec2(mod(iTime,1.5)))<0.3?vec3(0.0):vec3(0.3*random(vec2(0.0,p.y+iTime/10.0)));
    c.xyz-=random(vec2(0.0,p.y-iTime/5.0-mod(p.y-iTime/5.0,0.02)))>0.9?texture2D(tExplosion,p+vec2(0.0,random(q))).rgb:vec3(0.0);
    c.rgb*=texture2D(tExplosion,p-vec2(sin(p.y*50.0)/5.0*sin(iTime*3.0*p.y),-iTime/10.0)).rgb;
    return c;
}

void main(){

	/** voronoi */ 
	vec3 borderColor = vec3(0.5, 0.0, 0.0);
	vec3 color = vec3(0.8, 0.7, 0.7);	
	float borderWidth = 30.0;	
	float blur = 3.0;
	float amount = 3.7;
	
	vec3 c = voronoi( 8.0*(vUv*vec2(amount)) );
	// borders
	vec3 col = mix( borderColor, color, smoothstep( borderWidth/100.0, (borderWidth/100.0)+(blur/100.0), c.x ) );
	
	
	
	
	
	/** light */
	vec3 light = vec3(-400.0, 0.0, 400.0);//it needs to be a uniform
	light = normalize(light);//you can normalize it outside of the shader, since it's a directional light

	// calculate the dot product of
	// the light to the vertex normal
	float dProd = max(0.0, dot(vNormal, light));

 
	/** tectures */
	vec4 pictureBack = texture2D(tExplosion, gl_FragCoord.xy/resolution.xy);	
		
	/** glitch */
    vec2 p = vec2(gl_FragCoord.x/resolution.x,-gl_FragCoord.y/resolution.y);	
    vec4 colorGlitch=glitch(p);	
	float opasity = 1.0;//0.5-dProd *5.0 ;
	
	vec3 outPut =  vec3(vNormal.xxy)*vec3(dProd, dProd, dProd) + vec3(colorGlitch.xyz)*0.9+vec3(dProd, dProd, dProd)*0.7; 
	gl_FragColor = vec4 (outPut, 1.0)*vec4 (1.05, 0.7, 0.95, 1.0) +0.3;
	
}