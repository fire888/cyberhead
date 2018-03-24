
"use strict";
 
 
 
/**************************************************;
 * Params
 **************************************************/
 
var sc3d = {
	/** blur */
	blurEffect: {
		amount: 0.2,	
		on: false,		
	}, 
	
	/** for preloader */	
	file:{
		total: 11,
		current: 0,
	},
	/** delay face start glitch */ 
	startDelay: 1000	
};
 


 
/**************************************************;
 * LOAD SCENE
 **************************************************/

const loadManager = new THREE.LoadingManager();

loadManager.onProgress = ( item, loaded, total ) => {
  sc3d.file.current = loaded;
};	
 
const listenerWindowOnload = () => {
  return new Promise((resolve) => {
    window.onload = () => {
		sc.mapEye = new THREE.TextureLoader( loadManager )
			.load( "jsScene/map-eye.jpg",
				() => { 
				initScene();					
				resolve();
			});									
    };
  });
};

const loadMapGlitch = () => {
  return new Promise((resolve) => {	
	sc.mapGlith = new THREE.TextureLoader( loadManager )
		.load( "jsScene/map_glitch.jpg",
			() => { 
				setTimeout( ()=> { animate(); }, sc3d.startDelay );				
				resolve();
			});
  });		
};

const loadShaders = () => {
  return new Promise((resolve) => {
    loadFiles([
      'jsScene/shader_matrix.vs',
      'jsScene/shader_matrix.fs',					
    ], loadGeomShaders, ()=>{resolve();});
  });
};

const loadGeomShaders = ( err, files, on ) => {
    if (err) {
      throw err;
    }
	sc.shaders = files;
	on();	
};

const loadMapBump = () => {
  return new Promise((resolve) => {
	sc.mapBump = new THREE.TextureLoader( loadManager )
		.load( "jsScene/map_faceBump.jpg",
			() => { 
				sc.mapBump.wrapS = THREE.RepeatWrapping;
				sc.mapBump.wrapT = THREE.RepeatWrapping;
				sc.mapBump.repeat.set( 4, 4 );
				resolve();
			});	
	});
};

const loadEnviromentMaps = () => {
	return new Promise((resolve) => { 
		sc.textureCube = new THREE.CubeTextureLoader( loadManager )
			.setPath( 'jsScene/')
			.load([ 
				'negx.jpg',
				'negz.jpg', 
				'negy.jpg', 
				'posz.jpg', 
				'posx.jpg', 
				'posy.jpg' 
			],()=> {
				sc.scene.background = sc.textureCube;
				resolve();				
			});	
	});	
};
	
const initMats = () => {
  return new Promise((resolve) => {
  
	sc.matIron = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		emissive: 0x7795d3,
		specular: 0xffffff,
		shininess: 60,
		bumpMap: sc.mapBump,
		bumpScale: 0.4,						
		envMap: sc.textureCube,
		reflectivity: 0.8,
		transparent: true 		
	});
	
	sc.matMirrorBlack = new THREE.MeshPhongMaterial({
		emissive: 0x222222,
		map: sc.mapEye,
		envMap: sc.textureCube,
		reflectivity: 0.4					
	});	
	
	sc.matSkin = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		bumpMap: sc.mapBump,
		bumpScale: 2.5,					
	});
	

	sc.matGlitchUniforms = { 				
		iTime:{ 
			type: "f", 
			value: null
		},
		resolution:{
			type:'v2',
			value: new THREE.Vector2( window.innerWidth, window.innerHeight )
		},								 
		tExplosion:{
			type: "t", 
			value: sc.mapGlith
		}				
	};
	
	sc.matGlitch = new THREE.ShaderMaterial( {
		uniforms: sc.matGlitchUniforms,
		vertexShader: sc.shaders['jsScene/shader_matrix.vs'],
		fragmentShader: sc.shaders['jsScene/shader_matrix.fs'],
		transparent: true						
	});	
	
	resolve();
	
  });
};
		
const loadFaceGeometry = () => {
  return new Promise((resolve) => {
	
	sc.loader = new THREE.OBJLoader( loadManager );	
	sc.loader.load( 'jsScene/head.obj', function ( object ) {	
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh != true){
				return;
			}	
			if( typeof child.geometry.attributes.position.array != "object" ){ 
				return;
			}	
			sc.faceGeometry = child.geometry;
			
			resolve();	
		});	
	}); 	
  });
};

const loadHeadGeom = () => {
  return new Promise((resolve) => {
	sc.loader.load( 'jsScene/head2.obj', function ( object ) {	
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh != true){
				return;
			}	
			if( typeof child.geometry.attributes.position.array != "object" ){ 
				return;
			}	
			sc.headGeometry = child.geometry;
			
			resolve();	
		});	
	}); 	
  });
};	

const loadEyesGeom = () => {
  return new Promise((resolve) => {
	sc.loader.load( 'jsScene/headEye.obj', ( object ) => {	
		object.traverse( ( child ) => {
			if ( child instanceof THREE.Mesh != true){
				return;
			}	
			if( typeof child.geometry.attributes.position.array != "object" ){ 
				return;
			}	
			
			sc.eyesGeometry = child.geometry;
			
			resolve();	
		});	
	}); 	
  });
};



const initLoadedGeom = () => {
	return new Promise( (resolve)=>{
		
		sc.matIron.opacity = 0;
		
		sc.maskNormal = new Mask( sc.matIron );	
		sc.maskNormal.obj.position.set( 60, -30, 0.1);
		sc.scene.add(sc.maskNormal.obj);
		
		sc.maskGlitch = new Mask( sc.matGlitch );
		sc.maskGlitch.obj.position.set( 60, -30, 0);
		sc.scene.add(sc.maskGlitch.obj);
		showMask();
		
		sc.partHead = new THREE.Mesh( sc.headGeometry, sc.matSkin );
		sc.partHead.position.set( 60, -30, 0);			
		sc.scene.add(sc.partHead);		
		
		sc.headEyeL = new THREE.Mesh( sc.eyesGeometry, sc.matMirrorBlack );
		sc.headEyeL.position.set( 19.4, 50, 35);
		sc.partHead.add(sc.headEyeL);
		
		sc.headEyeR = sc.headEyeL.clone();
		
		sc.headEyeL.rotation.y -= 0.02;	
		
		sc.headEyeR.position.set( -19.4, 50, 35);
		sc.headEyeR.scale.x *= -1;	
		sc.headEyeR.rotation.y += 0.08;		
		sc.partHead.add(sc.headEyeR);
			
		
		resolve();
	});
};

const loaderScene = () => {
  return listenerWindowOnload()
    .then(() => {
       return loadMapGlitch();
    })  
    .then(() => {
       return loadShaders();
    })
    .then(() => {
       return loadMapBump();
    })		
    .then(() => {
       return loadEnviromentMaps();
    })	
    .then(() => {
       return initMats();
    })		
    .then(() => {
       return loadFaceGeometry(); 
    })
	.then(() => {
       return loadHeadGeom(); 
    })
	.then(() => {
       return loadEyesGeom(); 
    })	
    .then(() => {
       return initLoadedGeom();
    })
    .then(() => {
    });			
};


loaderScene();




/**************************************************;
 * Masks
 **************************************************/
 
class Mask{
	
	constructor(mat){
		
		this.countOpasity = 300;
		this.onScene = true; 
		this.obj = new THREE.Mesh(
			sc.faceGeometry,
			mat
		)
	}	
}


 
 
/**************************************************;
 * SCENE
 **************************************************/

const sc = {
	isRotate: true,
	mask:{ isGlitchDelay: true } 
}; 
 
const initScene = () => { 
	
	/** SCENE */	
	const canvas = document.getElementById('canvas-webgl');
	sc.renderer = new THREE.WebGLRenderer({ canvas: canvas} );
	sc.renderer.setClearColor(0xffffffff);	
	sc.renderer.setPixelRatio( window.devicePixelRatio );
	sc.renderer.setSize(window.innerWidth, window.innerHeight);
	sc.renderer.gammaInput = true;
	sc.renderer.gammaOutput = true;

    sc.scene = new THREE.Scene();
	sc.camera = new THREE.PerspectiveCamera( 10,
			window.innerWidth/window.innerHeight, 
            3.5, 
            3000 
        );

	sc.camera.position.set( 0, -10, 900 );
	
	sc.clock = new THREE.Clock();
			
	/** WALLS */
	let geometryWalls = new THREE.SphereGeometry( 1000, 32, 32 );
	let materialWalls = new THREE.MeshStandardMaterial({
		metalness: 0, 
		roughness: 0.5, 
		side: THREE.DoubleSide 
	})
	sc.walls = new THREE.Mesh( geometryWalls, materialWalls );
	sc.walls.position.set(30,-100,0);
	sc.scene.add( sc.walls );
	
	
	/** TRIANGLES */
	let materialTr = new THREE.MeshStandardMaterial({
		metalness: 0, 
		roughness: 0.5,
		opacity: 0.4,	
		transparent: true,
		side: THREE.DoubleSide 
	})	
	
	sc.arrTr = [];	
	sc.trianglesObjFront = new THREE.Object3D();
	sc.trianglesObjFront.position.y = 0;
	sc.trianglesObjFront.position.x = 40;
	sc.trianglesObjFront.position.z = -20;	
	sc.trianglesObjFront.rotation.x = Math.PI/2;	
	sc.scene.add(sc.trianglesObjFront);	
	for ( let i=0; i<800; i++ ){
		let geom = new THREE.Geometry();
		let v1 = new THREE.Vector3( Math.random(), Math.random(), Math.random() );
		let v2 = new THREE.Vector3( Math.random(), Math.random(), Math.random() );
		let v3 = new THREE.Vector3( Math.random(), Math.random(), Math.random() );

		geom.vertices.push(v1);
		geom.vertices.push(v2);
		geom.vertices.push(v3);

		geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
		geom.computeFaceNormals();

		let mesh= new THREE.Mesh( geom, materialTr );
		
		//let rad = () => { if (Math.random()<0.5) {return (40);} else {return (-40);} }; 		
		let radius = 90;
		let angle = Math.random()*Math.PI*2;	
		
		mesh.scale.set( Math.random()*8+8, Math.random()*8+8, Math.random()*8+8 );
		mesh.position.set( radius * Math.sin(angle)+ Math.random()*20-10 , Math.random()*10-40, radius * Math.cos(angle) + Math.random()*20-10 );		
		sc.trianglesObjFront.add( mesh );
		sc.arrTr.push( {
			rotXSpd: Math.random()*0.015-0.007,			
			rotYSpd: Math.random()*0.015-0.007,
			rotZSpd: Math.random()*0.015-0.007,	
			posXSpd: Math.random()*0.001-0.0005,
			posYSpd: Math.random()*0.001-0.0005, 
			posZSpd: Math.random()*0.001-0.0005,
			
			posXBase: mesh.position.x,
			posYBase: mesh.position.y,	
			posZBase: mesh.position.z,	
			
			rotXSpdBase: Math.random()*0.015-0.007,			
			
			obj: mesh 	
		} );
	}	
	sc.movingTriangles = [];		
	
	/** LIGHTS */
	let light = new THREE.AmbientLight(0x8f98e6, 0.7 );
	light.position.set(0, 100, 350);
	sc.scene.add(light);	
	
	sc.spotLight = new THREE.SpotLight( 0x00ccff, 0.8 );
	sc.spotLight.castShadow = true;
	sc.spotLight.angle = 0.33;
	sc.spotLight.penumbra = 0.99;
	sc.spotLight.decay = 0;
	sc.spotLight.distance = 2000;
	sc.spotLight.position.set(100, 200, 450);
	sc.spotLight.lookAt(sc.walls.position);		
	sc.walls.add(sc.spotLight);
	
	
	/** COMPOSER */	
	sc.composer = new THREE.EffectComposer( sc.renderer );	
	sc.composer.addPass( new THREE.RenderPass( sc.scene, sc.camera ) );
	
    sc.videoPass = new THREE.ShaderPass(videoShader);
    sc.composer.addPass(sc.videoPass);
	
	sc.blurPass = new THREE.ShaderPass(BlurShader);
    sc.composer.addPass(sc.blurPass);
	if (sc3d.blurEffect.on){
		sc3d.blurEffect.currentAmount = sc3d.blurEffect.amount;	
	}else{
		sc3d.blurEffect.currentAmount = 0.0;			
	}				


	sc.blurPass.renderToScreen = true;	

	sc.composer.render();	
	
}





/**************************************************;
 * ANIMATION SCENE
 **************************************************/
  
const animate = () => {
		
	let yRotation = (mouseM.x - window.innerWidth/2)*0.000015;
	let xRotation = (mouseM.y - window.innerHeight/2)*0.000004;
	
	/** walls */
	if (yRotation > 0){
		sc.walls.rotation.y = yRotation*0.1;

	}
	
	/** triangles */	
	for ( let i=0; i< sc.arrTr.length; i++ ){
		sc.arrTr[i].obj.position.x += sc.arrTr[i].posXSpd; 
		sc.arrTr[i].obj.position.y += sc.arrTr[i].posYSpd; 
		sc.arrTr[i].obj.position.z += sc.arrTr[i].posZSpd;
		sc.arrTr[i].obj.rotation.x += sc.arrTr[i].rotXSpd; 
		sc.arrTr[i].obj.rotation.y += sc.arrTr[i].rotYSpd; 
		sc.arrTr[i].obj.rotation.z += sc.arrTr[i].rotZSpd;  		
	}

	if ( Math.random()> 0.7){
		
		let tr = sc.arrTr[ Math.floor(Math.random() * sc.arrTr.length ) ];
		if ( Math.abs(tr.posYSpd) < 5){
			let dir = 1.0
			if ( Math.random()<0.5 ) dir *= -1; 
			tr.posYSpd = 6 * dir;
			tr.rotXSpd = 0.05;			
			sc.movingTriangles.push(tr);
		}	
	}
	
	for (let i = 0; i < sc.movingTriangles.length; i++  ){
		if ( Math.abs(sc.movingTriangles[i].obj.position.y) > 1000 ){
			let tr = sc.movingTriangles[i];
			tr.posYSpd = Math.random()*0.01-0.005;
			tr.obj.position.set( tr.posXBase, tr.posYBase,  tr.posZBase );
			tr.rotXSpd = tr.rotXSpdBase	
			sc.movingTriangles.splice(i, 1);
			i--;
		}
	}	
	
	
	/** head */ 
	if (sc.isRotate == true){
		animateHead( xRotation, yRotation );
	}	
	

	let time = sc.clock.getDelta();	
	
	/** shaderMats */
	if ( sc.matGlitchUniforms ){
		sc.matGlitchUniforms.iTime.value += time* 16.0 ;	
	}

	/** composer */	
	if ( sc.videoPass ){
		sc.videoPass.uniforms.iTime.value += time*2.0;	
	}
	
	if ( sc.blurPass ){
		let ef = sc3d.blurEffect; 
		if (ef.on == true && ef.currentAmount < ef.amount ){	
			ef.currentAmount +=0.005;
			if ( ef.currentAmount > ef.amount) ef.currentAmount = ef.amount;
		} 
		if (ef.on == false && ef.currentAmount > 0 ){	
			ef.currentAmount -=0.005;
			if ( ef.currentAmount < 0 ) {
				ef.currentAmount = 0;
			}		
		}			
		sc.blurPass.uniforms.currentAmount.value = ef.currentAmount; 
	}
	
	
	sc.composer.render();	
	
	/** animate */
	requestAnimationFrame( animate );	
}



const animateHead = (rX, rY) => {
	
	let spdYRot = 0, spdXRot = 0;
	
	
	if (sc.maskNormal){	
		if (sc.maskNormal.obj){
			spdYRot = rY - sc.maskNormal.obj.rotation.y/100.0; 
			spdXRot = rX - sc.maskNormal.obj.rotation.x/100.0 - 0.0012;
			
			if (sc.matIron) {
				if ( Math.abs(spdYRot) < 0.0008 && Math.abs(spdXRot) < 0.0008 && sc.mask.isGlitchDelay === false){
					sc.mask.isGlitchDelay = true;					
					hideMask();
				}	
			}
			
			sc.maskNormal.obj.rotation.y += spdYRot;
			sc.maskNormal.obj.rotation.x += spdXRot;			
		}
	}
	
	if (sc.maskGlitch){	
		if (sc.maskGlitch.obj){
			sc.maskGlitch.obj.rotation.y += spdYRot;
			sc.maskGlitch.obj.rotation.x += spdXRot;			
		}
	}
	
	if (sc.partHead){
			sc.partHead.rotation.y += spdYRot;	
			sc.partHead.rotation.x += spdXRot;				
	}
	
	if (sc.headEyeL){	
			sc.headEyeL.rotation.y += spdYRot*0.25;
			sc.headEyeL.rotation.x += spdXRot*0.25;	
			sc.headEyeR.rotation.y += spdYRot*0.25;
			sc.headEyeR.rotation.x += spdXRot*0.25;		
	}	
	
	/** triangles */	
	sc.trianglesObjFront.rotation.y += spdYRot*0.1; 
	sc.trianglesObjFront.rotation.x -= spdXRot*0.8;
			
}


/**************************************************;
 * check mouse move for opasity mask
 * and rotation head
 **************************************************/
 	  
const mouseM = {
	x:0,
	y:0	
}

const hideMask = () => {
	if ( sc.matIron.opacity > 0.0 ){
		sc.matIron.opacity -= 0.1;
		setTimeout(hideMask, 50);	
	}else{
		sc.matIron.opacity = 0.0;
		setTimeout(showMask, 300);	
	}
}

const showMask = () => {
	if ( sc.matIron.opacity < 1 ){
		sc.matIron.opacity += 0.1;
		setTimeout(showMask, 50);	
	}else{
		sc.matIron.opacity = 1;
		setTimeout(removeDelay, 6000 )		
	}
}

const removeDelay = () => {
	 sc.mask.isGlitchDelay = false;	
}

document.addEventListener("mousemove", (e) => {		
	mouseM.x = e.offsetX;
	mouseM.y = e.offsetY;		
});





/**************************************************;
 * resize scene
 **************************************************/

const handleWindowResize = () => {
	sc.renderer.setSize(window.innerWidth, window.innerHeight);
	sc.camera.aspect = window.innerWidth / window.innerHeight;
	sc.camera.updateProjectionMatrix();
}

window.addEventListener('resize', handleWindowResize, false);
