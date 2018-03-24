BlurShader = {
	uniforms: {
		"tDiffuse": { value: null },
		"currentAmount": { type: "f", value: 0.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform float currentAmount;",

		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		
		"vec4 lerp(vec4 bl, vec4 img, float amount ){",
			"return bl * amount  + img * ( 1.0 - amount );",
		"}",

		"void main(  )",
		"{",

			// Normalized pixel coordinates (from 0 to 1)
			"vec2 uv = vUv;",
			
		
			'vec4 sum = vec4(0);',
			'for( int i=-4; i < 4; i++) {',
				'for( int j=-4; j < 4; j++) {',
					//'float coorX = j-0.01;', 
					'sum += texture2D(tDiffuse, (uv+vec2(j, i)*currentAmount* 0.01) )*0.015625;',
				'}',
			'}',			
			'gl_FragColor = vec4( sum.rgb, 1.0 );',
		"}"
	].join( "\n" )
}
