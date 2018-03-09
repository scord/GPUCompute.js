var GravityParticles = function( renderer, scene, size ) {
  var gpuCompute;
  var positionComputeModule, accelerationComputeModule;
  var positionVisualisation;

  this.pointSize = 0;
  this.pointBrightness = 0;
  this.pointColour = {};
  this.pointLightness = 0;
  this.mousePos = new THREE.Vector3(0,0,0);
  this.followMouse = false;

  var initialised = false;

  var shaders = {};
  var shaderFilenames = ['acceleration.frag', 'position.frag', 'points.vert', 'points.frag'];

  this.initialise = function() {

    $.when.apply($, loadFiles(shaders, shaderFilenames)).then(function() {
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
    	accelerationComputeModule = new gpuCompute.Module('calculateAcceleration', shaders['acceleration.frag'], function() {});
    	positionComputeModule = new gpuCompute.Module('calculatePosition', shaders['position.frag'], initialisePosition);
    	//contrainComputeModule = new gpuCompute.Module('constrain', shaders['constrain.frag'], initialisePosition);

    	// flag the modules for computation
    	gpuCompute.addToComputeQueue(accelerationComputeModule);
    	gpuCompute.addToComputeQueue(positionComputeModule);
    	//gpuCompute.addToComputeQueue(constrainComputeModule);

    	// define how the modules are linked

    	positionComputeModule.setInputModule('in_acceleration', accelerationComputeModule);
    	positionComputeModule.setInputModule('in_position', positionComputeModule, true);

    	accelerationComputeModule.setInputModule('in_acceleration', accelerationComputeModule);
    	accelerationComputeModule.setInputModule('in_position', positionComputeModule);

    	positionVisualisation = new gpuCompute.Visualisation(positionComputeModule, shaders['points.vert'], shaders['points.frag']);
    	scene.add(positionVisualisation.particles);

      initialised = true;
    });
  }



  this.render = function() {
    if (!initialised) { return; }

    positionVisualisation.setInput('in_pointSize', this.pointSize);
  	positionVisualisation.setInput('in_pointBrightness', this.pointBrightness);
  	positionVisualisation.setInput('in_pointIntensity', this.pointIntensity);

  	positionVisualisation.setInput('in_hue', this.pointColour.h)
  	positionVisualisation.setInput('in_saturation', this.pointColour.s)
  	positionVisualisation.setInput('in_lightness', this.pointColour.v)

  	if (!this.followMouse) {
  		this.mousePos = new THREE.Vector3(1.0*snoise2d(clock.getElapsedTime()/5.0, 0.0),1.0*snoise2d(0.0, clock.getElapsedTime()/5.0),0);
  	}

  	accelerationComputeModule.setInput('gravityPosition', this.mousePos);

  	positionComputeModule.setInput('delta', 1/60);
  	//positionVisualisation.particles.rotation.x += 0.002;
  	//positionVisualisation.particles.rotation.y += 0.002;

  	gpuCompute.compute();
  	positionVisualisation.update();
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
}
