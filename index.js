var params = {
	gravityPositionX: 0.0,
	gravityPositionY: 0.0,
	pointSize: 1.0,
	cameraPositionZ: 10.0,
	pointBrightness: 1.0,
	simulationSpeed: 1.0,
	followMouse: false
};

var camera, count = 0, scene, renderer, clock = new THREE.Clock(), container;

var shaders = {};
var shaderFilenames = ['velocity.frag', 'position.frag', 'points.vert', 'points.frag'];

function loadFiles(files, filenames) {

	var getFile = function(filename) {
		return $.get(filename, function(file) {
			files[filename] = file;
		});
	};

	var d = []
	for (var i in filenames) {
		d.push(getFile(filenames[i]));
	}
	return d;
}

$.when.apply($, loadFiles(shaders, shaderFilenames)).then(function() {
	init();
	animate();
});



function initGUI() {
	var gui = new dat.gui.GUI({
		height: 5*32-1
	})

	gui.remember(params);
	gui.add(params, 'pointSize').min(0.0).max(100.0).step(0.01);
	gui.add(params, 'pointBrightness').min(0.0).max(2.0).step(0.01);
	gui.add(params, 'cameraPositionZ').min(0.0).max(100.0).step(0.1);
	gui.add(params, 'simulationSpeed').min(0.0).max(2.0).step(0.1);
	gui.add(params, 'followMouse');
}

function init() {
  // Get the DOM element to attach to
  container = document.querySelector('#container');

	initGUI();

  // Set the scene size.
  const WIDTH = container.clientWidth;
  const HEIGHT = container.clientHeight;

  // Set some camera attributes.
  const VIEW_ANGLE = 45;
  const ASPECT = WIDTH / HEIGHT;
  const NEAR = 0.1;
  const FAR = 10000;
	const SIZE = 1024;

	clock.start();

  // Create a WebGL renderer, camera
  // and a scene
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);

  scene = new THREE.Scene();
	gpuCompute = new GPUCompute( renderer, SIZE );

	var initialPositionTexture = gpuCompute.createTexture();
	var pixels = initialPositionTexture.image.data;
	var scale = 10.0;

	for (x = 0; x < gpuCompute.size; x++) {
		for (y = 0; y < gpuCompute.size; y++) {
			offset = 4*(x+gpuCompute.size*y);
			pixels[offset] = ((x/(gpuCompute.size-1)) - 0.5)*scale;
			pixels[offset+1] = ((y/(gpuCompute.size-1)) - 0.5)*scale;
			pixels[offset+2] = 0.1*snoise2d(x/100, y/100)*scale;
		}
	}

	var initialVelocityTexture = gpuCompute.createTexture();
	var pixels = initialVelocityTexture.image.data;
	var scale = 0.0001;

	for (x = 0; x < gpuCompute.size; x++) {
		for (y = 0; y < gpuCompute.size; y++) {
			offset = 4*(x+gpuCompute.size*y);
			pixels[offset] = scale*(Math.random()-0.5);
			pixels[offset+1] = scale*(Math.random()-0.5);
			pixels[offset+2] = scale*(Math.random()-0.5);
		}
	}

	velocityComputeModule = new gpuCompute.Module('velocity', shaders['velocity.frag'], initialVelocityTexture);
	positionComputeModule = new gpuCompute.Module('position', shaders['position.frag'], initialPositionTexture);

	gpuCompute.addToComputeQueue(velocityComputeModule);
	gpuCompute.addToComputeQueue(positionComputeModule);

	positionComputeModule.setInputModule(velocityComputeModule);
	positionComputeModule.setInputModule(positionComputeModule);

	velocityComputeModule.setInputModule(velocityComputeModule);
	velocityComputeModule.setInputModule(positionComputeModule);


	positionVisualisation = new gpuCompute.Visualisation(positionComputeModule, shaders['points.vert'], shaders['points.frag']);

	scene.add(positionVisualisation.particles);
  scene.add(camera);

  // Start the renderer.
  renderer.setSize(WIDTH, HEIGHT);
	document.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);
  // Attach the renderer-supplied
  // DOM element.
  container.appendChild(renderer.domElement);
}

var pos = new THREE.Vector3(0.0,0.0,0.0);
function onMouseMove(event) {
	if (params['followMouse']) {
		mouse = new THREE.Vector2()
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
		var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
		vector.unproject( camera );
		var dir = vector.sub( camera.position ).normalize();
		var distance = - camera.position.z / dir.z;
		pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
	} else {
		pos = new THREE.Vector3(0,0,0);
	}

};

function onWindowResize( event ) {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
}

function animate() {

	requestAnimationFrame( animate );
	camera.position.z = params['cameraPositionZ'];

	positionVisualisation.setInput('in_pointSize', params['pointSize']);
	positionVisualisation.setInput('in_pointBrightness', params['pointBrightness']);

	pos = new THREE.Vector3(1.0*snoise2d(clock.getElapsedTime()/5.0, 0.0),1.0*snoise2d(0.0, clock.getElapsedTime()/5.0),0);

	velocityComputeModule.setInput('gravityPosition', pos);
	velocityComputeModule.setInput('timeScale', params['simulationSpeed']);
	positionComputeModule.setInput('timeScale', params['simulationSpeed']);
	//positionVisualisation.particles.rotation.x += 0.002;
	//positionVisualisation.particles.rotation.y += 0.002;

	gpuCompute.compute();

	renderer.render( scene, camera );

}
