var GPUCompute = function( renderer, size ) {

  computeCamera = new THREE.OrthographicCamera( - 0.5, 0.5, 0.5, - 0.5, 0, 1 );
	computeScene = new THREE.Scene();
	computeMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ) );
	computeScene.add( computeMesh );
  this.size = size;
  defaultVertexShader = "varying vec2 vUv; varying vec3 vPos; void main()	{ vUv = vec2( uv.x, uv.y); vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}";
  //defaultShader = new THREE.ShaderMaterial({vertexShader: "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}", fragmentShader: "void main()	{ gl_FragColor = vec4(1,1,1,1); }", uniforms: {}});

  function createMaterial(computeShader) {
    return new THREE.ShaderMaterial({
  		uniforms: {},
  		vertexShader: defaultVertexShader,
  		fragmentShader: computeShader
  	});
  }

  var modules = {};
  var outputTexture;

  this.createTexture = function() {
    var a = new Float32Array( size * size * 4 );
		var texture = new THREE.DataTexture( a, size, size, THREE.RGBAFormat, THREE.FloatType );
		texture.needsUpdate = true;
    return texture;
  }

  this.createModule = function(name, computeShader, initialData, output) {


    var module = new Module(name, computeShader, initialData);
    modules[name] = module;

    if (output) {
      outputTexture = module.outputRenderTarget.texture;
    }
    return module;
  }

  this.compute = function() {

    for (var i in modules) {
      modules[i].compute();
    }

    return outputTexture;
  }

  Module = function( name, computeShader,initialData ) {
    this.name = "in_"+name;
    this.material = createMaterial(computeShader);

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
