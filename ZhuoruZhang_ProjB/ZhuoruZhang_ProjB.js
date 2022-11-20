		//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// BasicShapes.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--extend to other attributes: color, surface normal, etc.
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//		--create several canonical 3D shapes borrowed from 'GLUT' library:
//		--Demonstrate how to make a 'stepped spiral' tri-strip,  and use it
//			to build a cylinder, sphere, and torus.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.

// look at position
// var g_EyeX = 0.8, g_EyeY = 0, g_EyeZ = 1; 
// var lookX = 2, lookY = 3, lookZ = -1;
var znear = 1, zfar = 30;
var g_EyeX = 0, g_EyeY = 5, g_EyeZ = 1; 
var lookX = 0, lookY = -2, lookZ = 1;
var rx = lookX-g_EyeX;
var ry = lookY-g_EyeY;
var rxy= Math.sqrt(rx*rx + ry * ry);
var gtheta = Math.atan2(ry,rx);
// var theta2 = Math.atan2(rx,ry);
var theta2 = Math.PI/2 - gtheta
// tree angle
var current_angle = 0;

var g_angle01 = 20;                  // initial rotation angle
var g_angle01Rate = 2.0;           // rotation speed, in degrees/second 
var g_angle01min = 20;              // the min angle of the tree branch
var g_angle01max = 30;              // the min angle of the tree branch
var g_angle01brake = 1;              //control of the moving angle

var g_angle02 = 20;                  // initial rotation angle
var g_angle02Rate = 3.0;           // rotation speed, in degrees/second
var g_angle02min = 20;              // the min angle of the tree branch
var g_angle02max = 30;              // the min angle of the tree branch 
var g_angle02brake = 1;              //control of the moving angle

var g_angle03 = 10;                  // initial rotation angle
var g_angle03Rate = 5.0;           // rotation speed, in degrees/second
var g_angle03min = 10;              // the min angle of the tree branch
var g_angle03max = 20;              // the min angle of the tree branch 
var g_angle03brake = 1;              //control of the moving angle

var g_angle04 = 10;                  // initial rotation angle
var g_angle04Rate = 40.0;           // rotation speed, in degrees/second
var g_angle04min = 10;              // the min angle of the tree branch
var g_angle04max = 50;              // the min angle of the tree branch 
var g_angle04brake = 1;              //control of the moving angle

var fly_theta = 0;
var fly_r = 1.4;
var fly_thetaRate = -0.3;           // rotation speed, in degrees/second
var fly_thetabrake = 1.0;

var gold_posx = 0.0;
var gold_posxRate = 0;           // rotation speed, in degrees/second
var gold_posy = 0.7;


// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot

  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
function main() {
//==============================================================================

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  canvas.width = innerWidth;
  canvas.height = innerHeight*2/3
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 	 
	 

  // Get handle to graphics system's storage location of u_ModelMatrix

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("mousedown", myMouseDown);
  window.addEventListener("mousemove", myMouseMove);
  window.addEventListener("mouseup", myMouseUp);


//-----------------  
  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
	drawResize(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
    
}

function drawResize(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
    canvas.width = innerWidth ;
    canvas.height = (innerHeight * 3 / 4) ;
    // IMPORTANT!  Need a fresh drawing in the re-sized viewports.
    drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
}
function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
 	// Make each 3D shape in its own array of vertices:
	makeCylinder();					// create, fill the cylVerts array
	makeSphere();						// create, fill the sphVerts array
	makeTorus();						// create, fill the torVerts array
	makeGroundGrid();					// create, fill the gndVerts array
	makeAxis();						//fill the axis array
	makeTriangle();					//create triangle		
	makeWings();						//create wings of the wingVerts array
  // how many floats total needed to store all shapes?
	var mySiz = (cylVerts.length + sphVerts.length + torVerts.length + gndVerts.length + 
				AxisVerts.length+TriangleVerts.length+wingsVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
	var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
	for(i=0,j=0; j< cylVerts.length; i++,j++) {
		colorShapes[i] = cylVerts[j];
	}
	sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
	}
	torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		colorShapes[i] = torVerts[j];
	}
	gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
	}
	axisStart = i;
	for(j=0; j< AxisVerts.length; i++, j++) {
		colorShapes[i] = AxisVerts[j];
	}
	triangleStart = i;
	for(j=0; j< TriangleVerts.length; i++, j++) {
		colorShapes[i] = TriangleVerts[j];
	}
	wingsStart = i;
	for(j=0; j< wingsVerts.length;i++,j++){
		colorShapes[i] = wingsVerts[j];
	}
	// Create a buffer object on the graphics hardware:
	var shapeBufferHandle = gl.createBuffer();  
	if (!shapeBufferHandle) {
		console.log('Failed to create the shape buffer object');
		return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
	// Transfer data from Javascript array colorShapes to Graphics system VBO
	// (Use sparingly--may be slow if you transfer large shapes stored in files)
	gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
		
	//Get graphics system's handle for our Vertex Shader's position-input variable: 
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}

	var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

	// Use handle to specify how to retrieve **POSITION** data from our VBO:
	gl.vertexAttribPointer(
			a_Position, 				// choose Vertex Shader attribute to fill with data
			4, 							// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
			gl.FLOAT, 					// data type for each value: usually gl.FLOAT
			false, 						// did we supply fixed-point data AND it needs normalizing?
			FSIZE * floatsPerVertex, 	// Stride -- how many bytes used to store each vertex?
										// (x,y,z,w, r,g,b) * bytes/value
			0);							// Offset -- now many bytes from START of buffer to the
										// value we will actually use?
	gl.enableVertexAttribArray(a_Position);  
										// Enable assignment of vertex buffer object's position data

	// Get graphics system's handle for our Vertex Shader's color-input variable;
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if(a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	// Use handle to specify how to retrieve **COLOR** data from our VBO:
	gl.vertexAttribPointer(
		a_Color, 						// choose Vertex Shader attribute to fill with data
		3, 								// how many values? 1,2,3 or 4. (we're using R,G,B)
		gl.FLOAT, 						// data type for each value: usually gl.FLOAT
		false, 							// did we supply fixed-point data AND it needs normalizing?
		FSIZE * 7, 						// Stride -- how many bytes used to store each vertex?
										// (x,y,z,w, r,g,b) * bytes/value
		FSIZE * 4);						// Offset -- how many bytes from START of buffer to the
										// value we will actually use?  Need to skip over x,y,z,w
										
	gl.enableVertexAttribArray(a_Color);  	// Enable assignment of vertex buffer object's position data

		//--------------------------------DONE!
	// Unbind the buffer object 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return nn;
}
function makeAxis(){
	AxisVerts = new Float32Array([
		0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// X axis line (origin: gray)
		1.0,  0.0,  0.0, 1.0,		1.0,  0.3,  0.3,	// (endpoint: red)

		0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,	// Y axis line (origin: white)
		0.0,  1.0,  0.0, 1.0,		0.3,  1.0,  0.3,	//	(endpoint: green)

		0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// Z axis line (origin:white)
		0.0,  0.0,  1.0, 1.0,		0.3,  0.3,  1.0,	//	(endpoint: blue)
	]);
}
function makeTriangle(){
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  TriangleVerts = new Float32Array([
			// Face 0: (right side)  
     0.0,	 0.0, sq2, 1.0,		0.0, 	0.0,	1.0,	// Node 0 (apex, +z axis;  blue)
     c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  0.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	// Node 2 (base: +y axis;  grn)
			// Face 1: (left side)
		 0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,	// Node 0 (apex, +z axis;  blue)
     0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3 (base:lower lft; white)
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,	// Node 0 (apex, +z axis;  blue) 
    -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3 (base:lower lft; white)
     c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  0.0, 	// Node 1 (base: lower rt; red) 
     	// Face 3: (base side)  
    -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3 (base:lower lft; white)
     0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	// Node 2 (base: +y axis;  grn)
     c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  0.0, 	// Node 1 (base: lower rt; red)
     
  ]);
}

function makeCylinder(){
	var NumSides = 5;
	var radius = 0.02;
	var angle = 0;
    alt_colors = [[1.0, 0.5, 0.5], [0.5, 1.0, 0.5], [0.5, 0.5, 1.0]];
	// alt_colors = [[0.2, 0.2, 0.2],[0.4, 0.7, 0.4],[0.5, 0.5, 1.0]]
    cylVertstop = new Array(NumSides*4);
    cylVertsbottom = new Array(NumSides*4);
	cylVerts = new Float32Array(6*NumSides*floatsPerVertex);
	cylVert = [];

	    //draw the cylinders
		for(var i_side = 0;i_side<NumSides;i_side++){
			x = radius*Math.cos(angle);
			y = radius*Math.sin(angle);
			cylVertstop[i_side*4] = x;
			cylVertstop[i_side*4+1] = y;
			cylVertstop[i_side*4+2] = 0.4;
			cylVertstop[i_side*4+3] = 1.0;
			angle+=(Math.PI*2/NumSides);
		}
		angle = 0;
		for(var i_side = 0;i_side<NumSides;i_side++){
			x = radius*Math.cos(angle);
			y = radius*Math.sin(angle);
			cylVertsbottom[i_side*4] = x;
			cylVertsbottom[i_side*4+1] = y;
			cylVertsbottom[i_side*4+2] = 0;
			cylVertsbottom[i_side*4+3] = 1.0;
			angle+=(Math.PI*2/NumSides);
		}
		for(var i = 0;i<NumSides;i++){
			cylVert = cylVert.concat(cylVertstop.slice(i*4,i*4+4));
			cylVert = cylVert.concat(alt_colors[0]);
			cylVert = cylVert.concat(cylVertsbottom.slice(i*4,i*4+4));
			cylVert = cylVert.concat(alt_colors[1]);
			cylVert = cylVert.concat(cylVertsbottom.slice(((i+1)%NumSides)*4,((i+1)%NumSides)*4+4));
			cylVert = cylVert.concat(alt_colors[2]);
	
			cylVert = cylVert.concat(cylVertsbottom.slice(((i+1)%NumSides)*4,((i+1)%NumSides)*4+4));
			cylVert = cylVert.concat(alt_colors[0]);
			cylVert = cylVert.concat(cylVertstop.slice(i*4,i*4+4));
			cylVert = cylVert.concat(alt_colors[1]);
			cylVert = cylVert.concat(cylVertstop.slice(((i+1)%NumSides)*4,((i+1)%NumSides)*4+4));
			cylVert = cylVert.concat(alt_colors[2]);
	} 
	cylVerts = Float32Array.from(cylVert);

}
function makeWings(){
	var NumSides = 5;
	wingsVerts = new Float32Array(6*oval_split_num*floatsPerVertex);
	wingsVert = [];
	var oval_split_num = 10;
	var ovalVertex = new Array(oval_split_num*4);
	var ovalButtom = new Array(oval_split_num*4);
  
	var a = 0.7;
	var b = 0.2;
	for(var i = 0;i<oval_split_num;i++){
		theta = i*Math.PI/(3*oval_split_num)+90;
		x = a*Math.cos(theta);
		y = b*Math.sin(theta);
		ovalVertex[i*4] = x;
		ovalVertex[i*4+1] = y;
		ovalVertex[i*4+2] = 0.0;
		ovalVertex[i*4+3] = 1.0;
	}
	y = b;
	for(var i = 0;i<oval_split_num;i++){
		if(i<oval_split_num/2){
			theta = i*Math.PI/(3*oval_split_num)+90;
			x = a*Math.cos(theta);
			ovalButtom[i*4] = x;
			ovalButtom[i*4+1] = y;
			ovalButtom[i*4+2] = 0.0;
			ovalButtom[i*4+3] = 1.0;
			y-=0.05;
		}
		else{
			theta = i*Math.PI/(3*oval_split_num)+90;
			x = a*Math.cos(theta);
			ovalButtom[i*4] = x;
			ovalButtom[i*4+1] = 0;
			ovalButtom[i*4+2] = 0.0;
			ovalButtom[i*4+3] = 1.0;
		}
	}
	for(var i = oval_split_num-1;i>=0;i--){
		wingsVert = wingsVert.concat(ovalVertex.slice(i*4,i*4+4));
		wingsVert = wingsVert.concat(alt_colors[0]);
		wingsVert = wingsVert.concat(ovalButtom.slice(i*4,i*4+4));
		wingsVert = wingsVert.concat(alt_colors[1]);
		wingsVert = wingsVert.concat(ovalButtom.slice(((i+1)%NumSides)*4,((i+1)%NumSides)*4+4));
		wingsVert = wingsVert.concat(alt_colors[2]);
	}
	wingsVerts = Float32Array.from(wingsVert);

}
function makeSphere(){
	// draw a ball 
	var line_num = 30;
	var R = 0.05;
	var x,y,theta,phi;
	cylVertex = new Array(line_num*line_num*4);
	sphVerts = new Float32Array(line_num*line_num*4 * floatsPerVertex);
	sphVert = [];

	for(var i = 0;i<line_num;i++){
		theta = i*2*Math.PI/line_num;
		var sintheta = Math.sin(theta);
		var costheta = Math.cos(theta);
		for(var j=0;j<line_num;j++){
			phi = j*2*Math.PI/line_num; 
			var cosphi = Math.cos(phi);
			var sinphi = Math.sin(phi);
			x = R*sintheta*cosphi;
			y = R*costheta;
			z = R*sintheta*sinphi;
			cylVertex[line_num*i*4+j*4]=x;
			cylVertex[line_num*i*4+j*4+1]=y;
			cylVertex[line_num*i*4+j*4+2]=z;
			cylVertex[line_num*i*4+j*4+3]=1.0;
		}
	}
	for(var i = 0;i<line_num-1;i++){
		for(var j = 0;j<line_num;j++){
			sphVert = sphVert.concat(cylVertex.slice(i*4*line_num+j*4,i*4*line_num+j*4+4));
			sphVert = sphVert.concat(alt_colors[0]);
			sphVert = sphVert.concat(cylVertex.slice((i+1)*4*line_num+j*4,(i+1)*4*line_num+j*4+4));
			sphVert = sphVert.concat(alt_colors[1]);
			sphVert = sphVert.concat(cylVertex.slice((i+1)*4*line_num+((j+1)%line_num)*4,(i+1)*4*line_num+((j+1)%line_num)*4+4));
			sphVert = sphVert.concat(alt_colors[2]);
		}
	}
	sphVerts = Float32Array.from(sphVert);
}
function makeTorus() {

	var rbend = 1.0;										// Radius of circle formed by torus' bent bar
	var rbar = 0.5;											// radius of the bar we bent to form torus
	var barSlices = 23;										// # of bar-segments in the torus: >=3 req'd;
															// more segments for more-circular torus
	var barSides = 13;										// # of sides of the bar (and thus the 


	// Create a (global) array to hold this torus's vertices:
 	torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
	//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
	// triangle and last slice will skip its last triangle. To 'close' the torus,
	// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

	var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
	var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * Math.cos((s)*thetaStep);
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * Math.sin((s)*thetaStep);
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * Math.cos((s+1)*thetaStep);
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *Math.sin((s+1)*thetaStep);
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([0.8, 0.8, 0.8]);	// bright yellow
 	var yColr = new Float32Array([0.1, 0.4, 0.1]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}
function drawTree(gl,g_modelMatrix, g_modelMatLoc) {
	//-------Draw the tree root
	g_modelMatrix.translate(0,-1.0, 0.0);  
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	g_modelMatrix.translate(0.0,0.0, 0.4);

	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01,1,0,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
		g_modelMatrix.translate(0.0,0.0, 0.4);
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);	

	  
		g_modelMatrix = popMatrix();
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(current_angle+100,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	  
	  
		g_modelMatrix = popMatrix();
		g_modelMatrix.rotate(current_angle+200,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	  
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(current_angle+100,0,0,1);
	g_modelMatrix.rotate(g_angle01,1,0,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
		g_modelMatrix.translate(0.0,0.0, 0.4);
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

		g_modelMatrix = popMatrix();
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(current_angle+100,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
		g_modelMatrix = popMatrix();
		g_modelMatrix.rotate(current_angle+200,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
		
			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
		
			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
	g_modelMatrix = popMatrix();
	g_modelMatrix.rotate(current_angle+200,0,0,1);
	g_modelMatrix.rotate(g_angle01,1,0,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	  
		g_modelMatrix.translate(0.0,0.0, 0.4);
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
		g_modelMatrix = popMatrix();
		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(current_angle+100,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

		g_modelMatrix = popMatrix();
		g_modelMatrix.rotate(current_angle+200,0,0,1);
		g_modelMatrix.rotate(g_angle02,1,0,0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
	
			g_modelMatrix.translate(0.0,0.0, 0.4);
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(current_angle+100,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

			g_modelMatrix = popMatrix();
			g_modelMatrix.rotate(current_angle+200,0,0,1);
			g_modelMatrix.rotate(g_angle03,1,0,0);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

}
function drawgoldsnitch(gl,modelMatrix, u_ModelMatrix){
	//draw the body
	// modelMatrix.rotate(50,0,0,1);  

	modelMatrix.translate(gold_posx, gold_posy,1.0);  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);
	//draw the wings
	pushMatrix(modelMatrix)
	modelMatrix.translate(0.73,-0.1,0.0); 
	modelMatrix.rotate(g_angle04,1,0,0);  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, wingsStart/floatsPerVertex, wingsVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();
	modelMatrix.rotate(-180,0,0,1); 
	modelMatrix.translate(0.73,0.0, 0.0); 
	modelMatrix.rotate(g_angle04,1,0,0);  
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, wingsStart/floatsPerVertex, wingsVerts.length/floatsPerVertex);

  
}
function drawTorus(gl,currentAngle,modelMatrix, u_ModelMatrix){
  	//--------Draw Spinning torus
	modelMatrix.translate(-0.4, 0.4, 0.0);	// 'set' means DISCARD old matrix,
	modelMatrix.scale(0.3, 0.3, 0.3);// Make it smaller:
	modelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
			// Draw just the torus's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							torStart/floatsPerVertex,	// start at this vertex number, and
							torVerts.length/floatsPerVertex);	// draw this many vertices.

}
function drawSphere(gl,currentAngle,modelMatrix, u_ModelMatrix){
    //--------Draw Spinning Sphere
	modelMatrix.translate(0.4,0,0)
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);
    modelMatrix.translate( 0, 0, 0.4); 
    modelMatrix.scale(3, 3, 3);// Make it smaller:
    modelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    		// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
    							sphVerts.length/floatsPerVertex);	// draw this many vertices.
								
}
function drawGround(gl,modelMatrix, u_ModelMatrix){
  	//---------Draw Ground Plane, without spinning.
	// position it.
	modelMatrix.translate( 0.4, -0.4, 0.0);	
	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:

	// Drawing:
	// Pass our current matrix to the vertex shaders:
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// Draw just the ground-plane's vertices
	gl.drawArrays(gl.LINES, gndStart/floatsPerVertex,gndVerts.length/floatsPerVertex);	// draw this many vertices.
}
function drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  	// Clear <canvas>  colors AND the depth buffer
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  	modelMatrix.setIdentity();    // DEFINE 'world-space' coords.
	gl.viewport(0, 0, canvas.width/2, canvas.height);

	//fovy, aspect, near, far
	modelMatrix.perspective(35,(canvas.width/2)/canvas.height,znear,zfar);								

	modelMatrix.lookAt(g_EyeX,g_EyeY,g_EyeZ, //The position of the eye point
						lookX,lookY,lookZ, //The position of the reference point
						0,0,1); //The direction of the up vector

  	pushMatrix(modelMatrix);  // SAVE world drawing coords.
		// modelMatrix.translate(0,0,0.4)
		drawSphere(gl,currentAngle,modelMatrix, u_ModelMatrix);	    //--------Draw Spinning Sphere
  	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  
  	// pushMatrix(modelMatrix);  // SAVE world drawing coords.
	// 	drawTorus(gl,currentAngle,modelMatrix, u_ModelMatrix)
  	// modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

  	pushMatrix(modelMatrix);  // SAVE world drawing coords.
	  drawGround(gl,modelMatrix, u_ModelMatrix)
  	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  	//===========================================================
	//draw the axis
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);
			
	//draw the golden snitch
	pushMatrix(modelMatrix);
	drawgoldsnitch(gl,modelMatrix, u_ModelMatrix);
	modelMatrix = popMatrix(); 

	//draw the triangle pyramid
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.0,-0.4, 0.0);
	modelMatrix.scale(0.3, 0.3, 0.3);
	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	modelMatrix.concat(quatMatrix);	// apply that matrix.
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// Draw just the sphere's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP,triangleStart/floatsPerVertex,TriangleVerts.length/floatsPerVertex);	// draw this many vertices.
	modelMatrix.scale(2, 2, 2);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);
	modelMatrix.translate(0, 0, 0.8);	// 'set' means DISCARD old matrix,
	modelMatrix.scale(0.3, 0.3, 0.3);// Make it smaller:
	modelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
			// Draw just the torus's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							torStart/floatsPerVertex,	// start at this vertex number, and
							torVerts.length/floatsPerVertex);	// draw this many vertices.
	modelMatrix = popMatrix(); 


	//draw the tree
	pushMatrix(modelMatrix);
	drawTree(gl,modelMatrix, u_ModelMatrix);
	modelMatrix.translate(0.0,0.0, 0.4);
	var newMatrix = new Matrix4();
	newMatrix.setIdentity();
	newMatrix.perspective(35,(canvas.width/2)/canvas.height,znear,zfar);								

	newMatrix.lookAt(g_EyeX,g_EyeY,g_EyeZ, //The position of the eye point
						lookX,lookY,lookZ, //The position of the reference point
						0,0,1); //The direction of the up vector
	newMatrix.invert();
	newMatrix = newMatrix.concat(modelMatrix);
	var eye = new Vector3([0, 0, 0]);
	var neweye = newMatrix.multiplyVector3(eye);
	modelMatrix = popMatrix(); 
	// //================================================
	// modelMatrix.setIdentity();
	// drawTree(gl,modelMatrix, u_ModelMatrix);
	// var tt = new Vector3([0, 0, 0]);
	// var test = newMatrix.multiplyVector3(tt);
	// //==================================================
	// modelMatrix.setIdentity();

	// gl.viewport(canvas.width*1/ 3, 0, canvas.width/3, canvas.height);
	// //fovy, aspect, near, far
	// modelMatrix.perspective(35,(canvas.width/2)/canvas.height,znear,zfar);								
	// modelMatrix.lookAt(
	// 	neweye[0],neweye[1],neweye[2], //The position of the eye point
	// 					2,3,-1, //The position of the reference point
	// 					0,0,1); //The direction of the up vector

	// pushMatrix(modelMatrix);  // SAVE world drawing coords.
	// drawSphere(gl,currentAngle,modelMatrix, u_ModelMatrix);	    //--------Draw Spinning Sphere
	// modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	// pushMatrix(modelMatrix);  // SAVE world drawing coords.
	// drawTorus(gl,currentAngle,modelMatrix, u_ModelMatrix)
	// modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	// pushMatrix(modelMatrix);  // SAVE world drawing coords.
	// drawGround(gl,modelMatrix, u_ModelMatrix)
	// modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
	// //===========================================================
	// //draw the axis
	// gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);

	// //draw the tree
	// pushMatrix(modelMatrix);
	// drawTree(gl,modelMatrix, u_ModelMatrix);
	// modelMatrix = popMatrix(); 
		
	// //draw the golden snitch
	// pushMatrix(modelMatrix);
	// drawgoldsnitch(gl,modelMatrix, u_ModelMatrix);
	// modelMatrix = popMatrix(); 

	// //draw the triangle pyramid
	// modelMatrix.translate(1.0,-0.4, 0.0);
	// modelMatrix.scale(0.5, 0.5, 0.5);
	// quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	// modelMatrix.concat(quatMatrix);	// apply that matrix.
	// gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// // Draw just the sphere's vertices
	// gl.drawArrays(gl.TRIANGLE_STRIP,triangleStart/floatsPerVertex,TriangleVerts.length/floatsPerVertex);	// draw this many vertices.
	// modelMatrix.scale(2, 2, 2);
	// gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);



  	//===========================================================
  	modelMatrix.setIdentity();
  	gl.viewport(canvas.width/ 2, 0, canvas.width / 2, canvas.height);
	//left, right, bottom, top, near, far
	var height = Math.tan(35*Math.PI/180/2)*(zfar-znear)/3;
	var width = height*(canvas.width/2)/canvas.height;
	modelMatrix.setOrtho(-height,height,-width,width,znear,zfar);

	modelMatrix.lookAt(g_EyeX,g_EyeY,g_EyeZ, //The position of the eye point
		lookX,lookY,lookZ, //The position of the reference point
		0,0,1); //The direction of the up vector
	//===========================================================

	pushMatrix(modelMatrix);  // SAVE world drawing coords.
	drawSphere(gl,currentAngle,modelMatrix, u_ModelMatrix);	    //--------Draw Spinning Sphere
	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	// pushMatrix(modelMatrix);  // SAVE world drawing coords.
	// drawTorus(gl,currentAngle,modelMatrix, u_ModelMatrix)
	// modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	pushMatrix(modelMatrix);  // SAVE world drawing coords.
	drawGround(gl,modelMatrix, u_ModelMatrix)
	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
	//===========================================================
	//draw the axis
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);

	//draw the tree
	pushMatrix(modelMatrix);
	drawTree(gl,modelMatrix, u_ModelMatrix);
	modelMatrix = popMatrix(); 
		
	//draw the golden snitch
	pushMatrix(modelMatrix);
	drawgoldsnitch(gl,modelMatrix, u_ModelMatrix);
	modelMatrix = popMatrix(); 

	//draw the triangle pyramid
	modelMatrix.translate(1.0,-0.4, 0.0);
	modelMatrix.scale(0.3, 0.3, 0.3);
	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	modelMatrix.concat(quatMatrix);	// apply that matrix.
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// Draw just the sphere's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP,triangleStart/floatsPerVertex,TriangleVerts.length/floatsPerVertex);	// draw this many vertices.
	modelMatrix.scale(2, 2, 2);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES,axisStart/floatsPerVertex,AxisVerts.length/floatsPerVertex);
	modelMatrix.translate(0, 0, 0.8);	// 'set' means DISCARD old matrix,
	modelMatrix.scale(0.3, 0.3, 0.3);// Make it smaller:
	modelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
			// Draw just the torus's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							torStart/floatsPerVertex,	// start at this vertex number, and
							torVerts.length/floatsPerVertex);	// draw this many vertices.

}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;    
	// Update the current rotation angle (adjusted by the elapsed time)
	//  limit the angle to move smoothly between +20 and -85 degrees:
	//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
	//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
	g_angle01 += g_angle01Rate * g_angle01brake * (elapsed * 0.001);
	g_angle02 += g_angle02Rate * g_angle02brake * (elapsed * 0.001);
	g_angle03 += g_angle03Rate * g_angle03brake * (elapsed * 0.001);
	g_angle04 += g_angle04Rate * g_angle04brake * (elapsed * 0.001);
	fly_theta += fly_thetaRate * fly_thetabrake * (elapsed * 0.001);
	if(g_angle01>g_angle01max|| g_angle01<g_angle01min){g_angle01Rate*=-1;}
	if(g_angle02>g_angle02max|| g_angle02<g_angle02min){g_angle02Rate*=-1};
	if(g_angle03>g_angle03max|| g_angle03<g_angle03min){g_angle03Rate*=-1};
	if(g_angle04>g_angle04max|| g_angle04<g_angle04min){g_angle04Rate*=-1};

	g_angle04 += g_angle04Rate * g_angle04brake * (elapsed * 0.001);
	gold_posx = fly_r*Math.cos(fly_theta);
	gold_posy = fly_r*Math.sin(fly_theta);

	var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
	return newAngle %= 360;
}

//==================HTML Button Callbacks
function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}
function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
	g_angle01brake = 0;
	g_angle02brake = 0;
	g_angle03brake = 0;
	g_angle04brake = 0;
	fly_thetabrake = 0;

  }
  else {
  	ANGLE_STEP = myTmp;
	g_angle01brake = 1;
	g_angle02brake = 1;
	g_angle03brake = 1;
	g_angle04brake = 1;
	fly_thetabrake = 1;
  }
}
function myKeyDown(kev) {
	var xlen = lookX - g_EyeX;
	var ylen = lookY - g_EyeY;
	var zlen = lookZ - g_EyeZ;
	switch(kev.code) {
	  //----------------Arrow keys------------------------
	  case "ArrowLeft": 	
		console.log(' left-arrow.');
		gtheta+=0.05;
		lookX = g_EyeX + rxy*Math.cos(gtheta);
		lookY = g_EyeY + rxy*Math.sin(gtheta);
		break;
	  case "ArrowRight":
		gtheta-=0.05;
		console.log('right-arrow.');
		lookX = g_EyeX + rxy*Math.cos(gtheta);
		lookY = g_EyeY + rxy*Math.sin(gtheta);
		break;
	  case "ArrowUp":		
		console.log('   up-arrow.');
		lookZ+=0.1;
		break;
	  case "ArrowDown":
		console.log(' down-arrow.');
		lookZ-=0.1;
		break;
	  case "KeyW":
		console.log("w pressed");
		g_EyeX += 0.1*xlen;
		g_EyeY += 0.1*ylen;
		g_EyeZ += 0.1*zlen;
		lookX += 0.1* xlen;
		lookY += 0.1*ylen;
		lookZ += 0.1*zlen;
		break
	  case "KeyS":
		console.log("s pressed");
		g_EyeX -= 0.1*xlen;
		g_EyeY -= 0.1*ylen;
		g_EyeZ -= 0.1*zlen;
		lookX -= 0.1*xlen;
		lookY -= 0.1*ylen;
		lookZ -= 0.1*zlen;
		break
	  case "KeyD":
		console.log("a pressed");
		theta2 = Math.PI/2 - gtheta
		g_EyeX +=0.1*Math.cos(theta2);
		g_EyeY -=0.1*Math.sin(theta2);
		lookX += 0.1*Math.cos(theta2);
		lookY -= 0.1*Math.sin(theta2);
		break
	  case "KeyA":
		console.log("d pressed");
		theta2 = Math.PI/2 - gtheta
		g_EyeX -=0.1*Math.cos(theta2);
		g_EyeY +=0.1*Math.sin(theta2);
		lookX -= 0.1*Math.cos(theta2);
		lookY += 0.1*Math.sin(theta2);
		break
	  default:
		console.log("UNUSED!");

		break;
	}
  }
function dragQuat(xdrag, ydrag) {
//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
// We find a rotation axis perpendicular to the drag direction, and convert the 
// drag distance to an angular rotation amount, and use both to set the value of 
// the quaternion qNew.  We then combine this new rotation with the current 
// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
// 'draw()' function converts this current 'qTot' quaternion to a rotation 
// matrix for drawing. 
	var res = 5;
	var qTmp = new Quaternion(0,0,0,1);
	
	var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
	// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
	
	qNew.setFromAxisAngle(-ydrag*Math.sin(gtheta) + 0.0001,ydrag*Math.cos(gtheta) + 0.0001,xdrag + 0.0001,dist*150.0);
	
	// qNew.setFromAxisAngle(ydrag*Math.cos(theta) + 0.0001, xdrag + 0.0001, -ydrag*Math.sin(theta) + 0.0001, dist*150.0);

	// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
							// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
							// -- to rotate around +x axis, drag mouse in -y direction.
							// -- to rotate around +y axis, drag mouse in +x direction.
							
	qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
	qTmp.normalize();	
	qTot.copy(qTmp);
	// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
};
function myMouseDown(ev) {
	//==============================================================================
	// Called when user PRESSES down any mouse button;
	// 									(Which button?    console.log('ev.button='+ev.button);   )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		isDrag = true;											// set our mouse-dragging flag
		xMclik = x;													// record where mouse-dragging began
		yMclik = y;
};
function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
	
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							(canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								(canvas.height/2);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	// AND use any mouse-dragging we found to update quaternions qNew and qTot.
	dragQuat((x - xMclik), (y - yMclik));
	
	xMclik = x;													// Make NEXT drag-measurement from here.
	yMclik = y;
		
};
function myMouseUp(ev) {

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
	
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							(canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								(canvas.height/2);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

	// AND use any mouse-dragging we found to update quaternions qNew and qTot;
	dragQuat((x - xMclik), (y - yMclik));
};