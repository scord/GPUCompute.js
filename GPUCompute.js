var GPUCompute = function( renderer, size ) {

  computeCamera = new THREE.OrthographicCamera( - 0.5, 0.5, 0.5, - 0.5, 0, 1 );
	computeScene = new THREE.Scene();
	computeMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ) );
	computeScene.add( computeMesh );

  this.size = size;
  defaultVertexShader = "varying vec2 vUv; varying vec3 vPos; void main()	{ vUv = vec2( uv.x, uv.y); vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}";

  var modules = [];
  var outputTexture;

  this.createTexture = function() {
    var a = new Float32Array( size * size * 4 );
		var texture = new THREE.DataTexture( a, size, size, THREE.RGBAFormat, THREE.FloatType );
		texture.needsUpdate = true;
    return texture;
  }

  this.compute = function() {
    for (var i = 0; i < modules.length; i++) {
      modules[i].compute();
    }
  }

  this.dispose = function() {
    for (var i = 0; i < modules.length; i++) {
      modules[i].dispose();
    }
  }

  this.addToComputeQueue = function(module) {
    modules.push(module);
  }

  this.Visualisation = function(module, vertexShader, fragmentShader) {

    var geometry = new THREE.BufferGeometry();
  	var positions = new Float32Array(size*size * 3)	;

  	for (x = 0; x < size; x++) {
  		for (y = 0; y < size; y++) {
  			offset = 3*(x+size*y);
  			positions[offset] = x/(size);
  			positions[offset+1] = y/(size);
  			positions[offset+2] = 0;
  		}
  	}

  	geometry.addAttribute('position', new THREE.BufferAttribute( positions, 3));

  	var material = new THREE.ShaderMaterial( {
  		uniforms: {
  			positionTexture: { type: "t", value: module.outputRenderTarget.texture }
  		},
  		vertexShader: vertexShader,
  		fragmentShader: fragmentShader,
  		blending: THREE.AdditiveBlending,
  		transparent: true,
  		depthTest: false
  	});

    this.dispose = function() {
      positions = undefined;
      material.dispose();
      geometry.dispose();
      this.particles = undefined;
    }

    this.particles = new THREE.Points( geometry, material );

    this.setInput = function(name, value) {
      material.uniforms[name] = { value: value };
    }
  }

  this.Module = function( name, computeShader,initialData ) {
    this.name = "in_"+name;
    this.material = new THREE.ShaderMaterial({
                      uniforms: {},
                      vertexShader: defaultVertexShader,
                      fragmentShader: computeShader
                    });



    this.outputRenderTarget = new THREE.WebGLRenderTarget( size, size, {
  		minFilter: THREE.NearestFilter,
  		magFilter: THREE.NearestFilter,
  		format: THREE.RGBAFormat,
  		type: THREE.FloatType,
  		depthBuffer: false,
  		stencilBuffer: false
  	});
    var swapRenderTarget = this.outputRenderTarget.clone();

    if (initialData !== null) {
      this.outputRenderTarget.texture = initialData;
    }

    this.inputModules = {};

    this.setInputModule = function(inputModule) {
      this.material.uniforms[inputModule.name] = {type:"t", value: null};
      //inputModule.outputRenderTarget.texture = value;
      this.inputModules[inputModule.name] = inputModule;
    }

    this.setInput = function(name, value) {
      this.material.uniforms[name] = { value: value };
    }

    this.dispose = function() {
      swapRenderTarget.dispose();
      this.outputRenderTarget.dispose();
      this.material.dispose();
    }

    this.compute = function() {

      for (var i in this.inputModules) {
        this.material.uniforms[this.inputModules[i].name].value = this.inputModules[i].outputRenderTarget.texture; // result from last iteration;
      }

      this.outputRenderTarget = [swapRenderTarget, swapRenderTarget = this.outputRenderTarget][0]; // swap render targets
      computeMesh.material = this.material;
  		renderer.render(computeScene, computeCamera, this.outputRenderTarget, true);
    //  computeMesh.material = defaultShader;
    }
  }

}
