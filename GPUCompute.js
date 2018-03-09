var GPUCompute = function( renderer, size ) {

  computeCamera = new THREE.OrthographicCamera( - 0.5, 0.5, 0.5, - 0.5, 0, 1 );
	computeScene = new THREE.Scene();
	computeMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ) );
	computeScene.add( computeMesh );

  this.size = size;
  defaultVertexShader = "varying vec2 vUv; varying vec3 vPos; void main()	{ vUv = vec2( uv.x, uv.y); vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}";

  var modules = [];
  var outputTexture;

  this.compute = function() {
    for (var i = 0; i < modules.length; i++) {
      modules[i].computed = false;
    }
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

    // align particles in grid so that each can be accessed by UV coordinates
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

    this.update = function() {
      material.uniforms.positionTexture.value = module.outputRenderTarget.texture;
    }

    this.particles = new THREE.Points( geometry, material );

    this.setInput = function(name, value) {
      material.uniforms[name] = { value: value };
    }
  }

  this.Module = function( name, computeShader, initialiseFunction ) {
    this.name = name;
    this.material = new THREE.ShaderMaterial({
                      uniforms: { size: {value: 0.0}},
                      vertexShader: defaultVertexShader,
                      fragmentShader: computeShader
                    });

    this.initialiseTextures = function(initialiseFunction) {
      var a = new Float32Array( size * size * 4 );

      initialiseFunction(a, size);

  		this.inputRenderTarget.texture = new THREE.DataTexture( a, size, size, THREE.RGBAFormat, THREE.FloatType);
  		this.inputRenderTarget.texture.needsUpdate = true;

      this.outputRenderTarget.texture = new THREE.DataTexture( a, size, size, THREE.RGBAFormat, THREE.FloatType);
  		this.outputRenderTarget.texture.needsUpdate = true;

    }

    this.outputRenderTarget = new THREE.WebGLRenderTarget( size, size, {
  		minFilter: THREE.NearestFilter,
  		magFilter: THREE.NearestFilter,
  		format: THREE.RGBAFormat,
  		type: THREE.FloatType,
  		depthBuffer: false,
  		stencilBuffer: false
  	});
    this.inputRenderTarget = this.outputRenderTarget.clone();
    this.historyRenderTarget = this.outputRenderTarget.clone();

    if (initialiseFunction != null) {
      this.initialiseTextures(initialiseFunction);
    }

    this.inputModules = {};
    this.historyModules = {};

    this.setInputModule = function(inputName, inputModule, memory) {

      this.material.uniforms[inputName] = {type:"t", value: null};

      if (memory) {
        this.material.uniforms[inputName + "_old"] = {type:"t", value: null};
        this.historyModules[inputName] = inputModule;
      } else {
        this.inputModules[inputName] = inputModule;
      }

      //inputModule.outputRenderTarget.texture = value;

    }

    this.setInput = function(name, value) {
      this.material.uniforms[name] = { value: value };
    }

    this.computed = false;

    this.compute = function() {

      // swap render targets
      var tmp = this.inputRenderTarget;
      var tmp2 = this.historyRenderTarget;
      this.inputRenderTarget = this.outputRenderTarget;
      this.historyRenderTarget = tmp;
      this.outputRenderTarget = tmp2;

      // assign input module outputs to textures
      for (var i in this.inputModules) {
        if (this.inputModules[i].name == this.name || this.inputModules[i].computed) {
          this.material.uniforms[i].value = this.inputModules[i].inputRenderTarget.texture;
        } else {
          this.material.uniforms[i].value = this.inputModules[i].outputRenderTarget.texture;
        }
      }

      // same as above loop but also sets _old inputs from previous iteration
      for (var i in this.historyModules) {
        if (this.historyModules[i].name == this.name || this.historyModules[i].computed) {
          this.material.uniforms[i].value = this.historyModules[i].inputRenderTarget.texture;
          this.material.uniforms[i + "_old"].value = this.historyModules[i].historyRenderTarget.texture;
        } else {
          this.material.uniforms[i].value = this.historyModules[i].outputRenderTarget.texture;
          this.material.uniforms[i + "_old"].value = this.inputRenderTarget.texture;
        }
      }

      computeMesh.material = this.material;
  		renderer.render(computeScene, computeCamera, this.outputRenderTarget, true);

      this.computed = true;
    }
  }

}
