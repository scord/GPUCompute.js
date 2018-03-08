var params = {
	gravityPositionX: 0.0,
	gravityPositionY: 0.0,
	pointSize: 20.0,
	cameraPositionZ: 10.0,
	pointBrightness: 1.0,
	pointIntensity: 1.0,
	followMouse: false,
	size: 1024,
	pointColour: { h: 350, s: 0.9, v: 0.3 }
};

var camera, count = 0, scene, renderer, clock = new THREE.Clock(), container;
var frameCounter = 0;
var shaders = {};
var shaderFilenames = ['acceleration.frag', 'position.frag', 'points.vert', 'points.frag'];
var gravityPos = new THREE.Vector3(0.0,0.0,0.0);

$.when.apply($, loadFiles(shaders, shaderFilenames)).then(function() {
	init();
	animate();
});

// initialise graphics
function init() {
  // Get the DOM element to attach to
  container = document.querySelector('#container');

	initGUI();

  const WIDTH = container.clientWidth;
  const HEIGHT = container.clientHeight;

  // camera settings
  const VIEW_ANGLE = 50;
  const ASPECT = WIDTH / HEIGHT;
  const NEAR = 0.1;
  const FAR = 10000;

	// square root of number of particles
	const SIZE = 1024;

	clock.start();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
  scene = new THREE.Scene();

	initGPUCompute(SIZE);

  scene.add(camera);

  renderer.setSize(WIDTH, HEIGHT);

	// set up events
	document.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);

  container.appendChild(renderer.domElement);
}

function initGPUCompute(size) {

	gpuCompute = new GPUCompute( renderer, size );

	// set initial data ----------------------------------------------------------


	var initialisePosition = function(data, size) {
		var scale = 10.0;

		for (var x = 0; x < size; x++) {
			for (var y = 0; y < size; y++) {
				offset = 4*(x+size*y);
				data[offset]=(((x/(size-1)) - 0.5)*scale) + 0.005*(Math.random() - 0.5);
				data[offset+1]=(((y/(size-1)) - 0.5)*scale) + 0.005*(Math.random() - 0.5);
				data[offset+2]=(0.1*snoise2d(x/100, y/100)*scale) + 0.005*(Math.random() - 0.5);
				data[offset+3]=(0.0);
			}
		}
	}

	// ---------------------------------------------------------------------------

	// create compute modules
	accelerationComputeModule = new gpuCompute.Module('acceleration', shaders['acceleration.frag'], function() {});
	positionComputeModule = new gpuCompute.Module('position', shaders['position.frag'], initialisePosition);
	//contrainComputeModule = new gpuCompute.Module('constrain', shaders['constrain.frag'], initialisePosition);

	// flag the modules for computation
	gpuCompute.addToComputeQueue(accelerationComputeModule);
	gpuCompute.addToComputeQueue(positionComputeModule);
	//gpuCompute.addToComputeQueue(constrainComputeModule);

	// define how the modules are linked

	positionComputeModule.setInputModule(accelerationComputeModule);
	positionComputeModule.setInputModule(positionComputeModule);

	accelerationComputeModule.setInputModule(accelerationComputeModule);
	accelerationComputeModule.setInputModule(positionComputeModule);

	positionVisualisation = new gpuCompute.Visualisation(positionComputeModule, shaders['points.vert'], shaders['points.frag']);
	scene.add(positionVisualisation.particles);
}

// render loop
function animate() {

	requestAnimationFrame( animate );
	camera.position.z = params['cameraPositionZ'];

	positionVisualisation.setInput('in_pointSize', params['pointSize']);
	positionVisualisation.setInput('in_pointBrightness', params['pointBrightness']);
	positionVisualisation.setInput('in_pointIntensity', params['pointIntensity']);

	positionVisualisation.setInput('in_hue', params['pointColour'].h)
	positionVisualisation.setInput('in_saturation', params['pointColour'].s)
	positionVisualisation.setInput('in_lightness', params['pointColour'].v)

	if (!params['followMouse']) {
		gravityPos = new THREE.Vector3(1.0*snoise2d(clock.getElapsedTime()/5.0, 0.0),1.0*snoise2d(0.0, clock.getElapsedTime()/5.0),0);
	}

	accelerationComputeModule.setInput('gravityPosition', gravityPos);

	positionComputeModule.setInput('delta', 1/60);
	//positionVisualisation.particles.rotation.x += 0.002;
	//positionVisualisation.particles.rotation.y += 0.002;

	gpuCompute.compute();
	positionVisualisation.update();

	renderer.render( scene, camera );
}

// helper functions ------------------------------------------------------------

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
		gravityPos = camera.position.clone().add( dir.multiplyScalar( distance ) );
	} else {
		gravityPos = new THREE.Vector3(0,0,0);
	}
};

function onWindowResize( event ) {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
}

// for loading shaders
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

// setup dat.gui for interactive parameters
function initGUI() {
	var gui = new dat.gui.GUI({
		height: 5*32-1
	})

	gui.remember(params);
	gui.add(params, 'pointSize').min(0.0).max(100.0).step(0.01);
	gui.add(params, 'pointBrightness').min(0.0).max(2.0).step(0.01);
	gui.add(params, 'cameraPositionZ').min(0.0).max(20.0).step(0.1);
	gui.add(params, 'followMouse');
	gui.addColor(params, 'pointColour');
}
