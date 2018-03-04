var camera, count = 0,
			scene, renderer, clock = new THREE.Clock(),
			controls, container,
			options, spawnerOptions, particleSystem;

var computeMesh, computeCamera, computeScene;

var pointsMaterial;
var positionFragmentShader, positionVertexShader;
var position2FragmentShader;
var pointsFragmentShader, pointsVertexShader;


$.get('velocity.frag', function(c) {
$.get('velocity.vert', function(d) {
$.get('points.frag', function(e) {
$.get('points.vert', function(f) {
$.get('position.frag', function(g) {


	velocityFragmentShader = c;
	positionVertexShader = d;
	pointsFragmentShader = e;
	pointsVertexShader = f;
	positionFragmentShader = g;

	init();
	animate();

})})})})});

var params = {
	gravityPositionX: 0.0,
	gravityPositionY: 0.0,
	pointSize: 1.0,
	cameraPositionZ: 10.0,
	pointBrightness: 1.0
};

function init() {
  // Get the DOM element to attach to
  const container =
      document.querySelector('#container');

	var gui = new dat.gui.GUI({
		height: 5*32-1
	})


	gui.remember(params);
	gui.add(params, 'gravityPositionX').min(-1.0).max(1.0).step(0.1);
	gui.add(params, 'gravityPositionY').min(-1.0).max(1.0).step(0.1);
	gui.add(params, 'pointSize').min(0.0).max(100.0).step(0.01);
	gui.add(params, 'pointBrightness').min(0.0).max(2.0).step(0.01);
	gui.add(params, 'cameraPositionZ').min(0.0).max(100.0).step(0.1);

  // Set the scene size.
  const WIDTH = container.clientWidth;
  const HEIGHT = container.clientHeight;

  // Set some camera attributes.
  const VIEW_ANGLE = 45;
  const ASPECT = WIDTH / HEIGHT;
  const NEAR = 0.1;
  const FAR = 10000;
	const PARTICLE_COUNT = 65536;


	clock.start();

  // Create a WebGL renderer, camera
  // and a scene
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  camera =
      new THREE.PerspectiveCamera(
          VIEW_ANGLE,
          ASPECT,
          NEAR,
          FAR
      );

		camera.position.y = 0;
  scene = new THREE.Scene();
		size = Math.sqrt(PARTICLE_COUNT);
		size = 2048;
	gpuCompute = new GPUCompute( renderer,size );

	pointsGeometry = new THREE.BufferGeometry();


	counter = 0;
	positions = new Float32Array(size*size * 3)	;

	for (x = 0; x < size; x++) {
		for (y = 0; y < size; y++) {
			offset = 3*(x+size*y);
			positions[offset] = x/(size);
			positions[offset+1] = y/(size);
			positions[offset+2] = 0;
		}
	}

	pointsGeometry.addAttribute('position', new THREE.BufferAttribute( positions, 3));


	//alert(velocityGeometry.getAttribute('position').array);



	pointsMaterial = new THREE.ShaderMaterial( {
		uniforms: {
			positionTexture: { type: "t", value: null },
			time: { value: 1.0 },
			size: { type: "f", value: size},
			resolution: { value: new THREE.Vector2() }
		},
		vertexShader: pointsVertexShader,
		fragmentShader: pointsFragmentShader,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false
	});


  points = new THREE.Points( pointsGeometry, pointsMaterial );



	var initialPositionTexture = gpuCompute.createTexture();

		var pixels = initialPositionTexture.image.data;
		var scale = 10.0;

		for (x = 0; x < size; x++) {
			for (y = 0; y < size; y++) {
				offset = 4*(x+size*y);
				pixels[offset] = ((x/(size-1)) - 0.5)*scale;
				pixels[offset+1] = ((y/(size-1)) - 0.5)*scale;
				pixels[offset+2] = 0.1*snoise2d(x/100, y/100)*scale;
			}
		}


		var initialVelocityTexture = gpuCompute.createTexture();

			var pixels = initialVelocityTexture.image.data;
			var scale = 0.0001;

			for (x = 0; x < size; x++) {
				for (y = 0; y < size; y++) {
					offset = 4*(x+size*y);
					pixels[offset] = scale*(Math.random()-0.5);
					pixels[offset+1] = scale*(Math.random()-0.5);
					pixels[offset+2] = scale*(Math.random()-0.5);
				}
			}




	velocityComputeModule = gpuCompute.createModule('velocity', velocityFragmentShader, initialVelocityTexture, false);
	positionComputeModule = gpuCompute.createModule('position', positionFragmentShader, initialPositionTexture, true);

	positionComputeModule.setInputModule(velocityComputeModule);
	positionComputeModule.setInputModule(positionComputeModule);

	velocityComputeModule.setInputModule(velocityComputeModule);
	velocityComputeModule.setInputModule(positionComputeModule);

	positionComputeModule.setInput('time', 1.0);
	velocityComputeModule.setInput('time', 1.0);
	velocityComputeModule.setInput('gravityPosition', new THREE.Vector3(1.0,1.0,1.0));



	//positionComputeModule.setInputs([positionComputeModule]);
	//positionComputeModule2.setInputs([positionComputeModule, positionComputeModule2]);
	//positionComputeModule2 = new gpuCompute.Module(positionMaterial2, size);
  //cube = new THREE.Points( velocityGeometry, velocityMaterial );

// Add cube to Scene
	scene.add( points );
  // Add the camera to the scene.
  scene.add(camera);

  // Start the renderer.
  renderer.setSize(WIDTH, HEIGHT);

	//points.rotation.x += 2;
	//points.rotation.y += 2;

	pointsMaterial.uniforms['in_pointSize'] = {value: 1.0};
	pointsMaterial.uniforms['in_pointBrightness'] = {value: 1.0};
  // Attach the renderer-supplied
  // DOM element.
  container.appendChild(renderer.domElement);
}


function animate() {

	requestAnimationFrame( animate );
	camera.position.z = params['cameraPositionZ'];
	//positionComputeModule.setInput('time', clock.getElapsedTime());
	//velocityComputeModule.setInput('time', clock.getElapsedTime());

	//positionComputeModule2.material.uniforms.time.value = clock.getElapsedTime();
	velocityComputeModule.setInput('gravityPosition', new THREE.Vector3(params['gravityPositionX'], params['gravityPositionY'], 0.0));

	//var result2 = positionComputeModule2.compute();
	//positionComputeModule.setInput(result2);

	points.rotation.x += 0.002;
	points.rotation.y += 0.002;

	pointsMaterial.uniforms['in_pointSize'].value = params['pointSize'];
	pointsMaterial.uniforms['in_pointBrightness'].value = params['pointBrightness'];

	pointsMaterial.uniforms.positionTexture.value = gpuCompute.compute();

	renderer.render( scene, camera );

	count++;

}
