var params = {
	pointSize: 20.0,
	cameraPositionZ: 10.0,
	pointBrightness: 1.0,
	pointIntensity: 1.0,
	followMouse: false,
	size: 1024,
	pointColour: { h: 350, s: 0.9, v: 0.3 }
};

var camera, count = 0, scene, renderer, clock = new THREE.Clock(), container;

var mousePos = new THREE.Vector3(0.0,0.0,0.0);

init();
animate();

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

	gravityParticles = new GravityParticles(renderer,scene,SIZE);
	gravityParticles.initialise();

  scene.add(camera);

  renderer.setSize(WIDTH, HEIGHT);

	// set up events
	document.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);

  container.appendChild(renderer.domElement);
}

// render loop
function animate() {

	requestAnimationFrame( animate );
	camera.position.z = params['cameraPositionZ'];

	gravityParticles.pointSize = params['pointSize'];
	gravityParticles.pointBrightness = params['pointBrightness'];
	gravityParticles.pointIntensity = params['pointIntensity'];

	gravityParticles.pointColour = params['pointColour'];
	gravityParticles.followMouse = params['followMouse'];
	gravityParticles.mousePos = mousePos;

	gravityParticles.render();

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
		mousePos = camera.position.clone().add( dir.multiplyScalar( distance ) );
	} else {
		mousePos = new THREE.Vector3(0,0,0);
	}
};

function onWindowResize( event ) {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
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
