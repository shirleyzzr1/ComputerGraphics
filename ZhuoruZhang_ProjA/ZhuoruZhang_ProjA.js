
// start01.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

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

//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var current_angle = 0;
var ANGLE_STEP = 45.0;  // -- Rotation angle rate (degrees/second)

var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
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

var gold_posx = 0.0;
var gold_posxRate = 0.1;           // rotation speed, in degrees/second

var gold_posy = 0.7;


//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits
								 
//line split needed to draw a ball
var line_num = 30;

//------------For change of color---------------------------------------
var newblue = 0.5;
var tree_pos = 0;
function main() {
//==============================================================================

  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("mousedown", myMouseDown); 
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	


  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    animate();   // Update the rotation angle
    drawAll();   // Draw all parts
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

    var NumSides = 5;
    var x,z;
    var angle = 0;
    var radius = 0.02;
    alt_colors = [[1.0, 0.5, 0.5], [0.5, 1.0, 0.5], [0.5, newblue, 1.0]];
    cylVertstop = new Array(NumSides*4);
    cylVertsbottom = new Array(NumSides*4);
    cylVert = [];

    //draw the cylinders
    for(var i_side = 0;i_side<NumSides;i_side++){
        x = radius*Math.cos(angle);
        z = radius*Math.sin(angle);
        cylVertstop[i_side*4] = x;
        cylVertstop[i_side*4+1] = 0.4;
        cylVertstop[i_side*4+2] = z;
        cylVertstop[i_side*4+3] = 1.0;
        angle+=(Math.PI*2/NumSides);
    }
    angle = 0;
    for(var i_side = 0;i_side<NumSides;i_side++){
        x = radius*Math.cos(angle);
        z = radius*Math.sin(angle);
        cylVertsbottom[i_side*4] = x;
        cylVertsbottom[i_side*4+1] = 0;
        cylVertsbottom[i_side*4+2] = z;
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
 
    // draw a ball 
    var R = 0.05;
    var x,y,theta,phi;
    cylVertex = new Array(line_num*line_num*4);

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
            cylVert = cylVert.concat(cylVertex.slice(i*4*line_num+j*4,i*4*line_num+j*4+4));
            cylVert = cylVert.concat(alt_colors[0]);
            cylVert = cylVert.concat(cylVertex.slice((i+1)*4*line_num+j*4,(i+1)*4*line_num+j*4+4));
            cylVert = cylVert.concat(alt_colors[1]);
            cylVert = cylVert.concat(cylVertex.slice((i+1)*4*line_num+((j+1)%line_num)*4,(i+1)*4*line_num+((j+1)%line_num)*4+4));
            cylVert = cylVert.concat(alt_colors[2]);
        }
    }

  var oval_split_num = 10;
  var ovalVertex = new Array(oval_split_num*4);
  var ovalButtom = new Array(oval_split_num*4);

  var a = 0.7;
  var b = 0.2;
  //draw the wings by oval function
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
    cylVert = cylVert.concat(ovalVertex.slice(i*4,i*4+4));
    cylVert = cylVert.concat(alt_colors[0]);
    cylVert = cylVert.concat(ovalButtom.slice(i*4,i*4+4));
    cylVert = cylVert.concat(alt_colors[1]);
    cylVert = cylVert.concat(ovalButtom.slice(((i+1)%NumSides)*4,((i+1)%NumSides)*4+4));
    cylVert = cylVert.concat(alt_colors[2]);
  }



  cylVertnew = Float32Array.from(cylVert);
  g_vertsMax = NumSides*3*2+line_num*(line_num-1)*3;		// 12 tetrahedron vertices.
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, cylVertnew, gl.STATIC_DRAW);

  var FSIZE = cylVertnew.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
function drawAll(){
  drawTree();
  drawgoldsnitch();
  // drawCircle();
  // drawWings();
}
function drawgoldsnitch(){
  //draw the body
  g_modelMatrix.setIdentity();
  g_modelMatrix.rotate(50,0,0,1);  
  g_modelMatrix.translate(gold_posx,gold_posy, 0.0);  
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 30, line_num*(line_num-1)*3);
  //draw the wings
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0.73,0.0, 0.0); 
  g_modelMatrix.rotate(g_angle04,1,0,0);  
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, line_num*(line_num-1)*3+30, 30);
  g_modelMatrix = popMatrix();
  g_modelMatrix.rotate(-180,0,1,0); 
  g_modelMatrix.translate(0.73,0.0, 0.0); 
  g_modelMatrix.rotate(g_angle04,1,0,0);  
  
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, line_num*(line_num-1)*3+30, 30);

}
function drawWings(){
  g_modelMatrix.setIdentity();
  g_modelMatrix.translate(0.3,0.3, 0.0);  
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  // gl.drawArrays(gl.LINE_STRIP, line_num*(line_num-1)*3+30, 20);
  gl.drawArrays(gl.TRIANGLES, line_num*(line_num-1)*3+30, 30);

}
function drawCircle(){
  g_modelMatrix.setIdentity();
  g_modelMatrix.translate(0.0,0.3, 0.0);  
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 30, line_num*(line_num-1)*3);
}
function drawTree() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_modelMatrix.setIdentity();
  //-------Draw the tree root
  g_modelMatrix.translate(tree_pos,-1.0, 0.0);  
  var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
  // why add 0.001? avoids divide-by-zero in next statement
  // in cases where user didn't drag the mouse.)
  g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 30);
  g_modelMatrix.translate(0.0,0.4, 0.0);

  pushMatrix(g_modelMatrix);
  g_modelMatrix.rotate(g_angle01,0,0,1);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 30);
        g_modelMatrix.translate(0.0,0.4, 0.0);
        pushMatrix(g_modelMatrix);
        g_modelMatrix.rotate(g_angle02,0,0,1);
        gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix.translate(0.0,0.4, 0.0);
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(current_angle+100,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          g_modelMatrix.rotate(current_angle+200,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

        g_modelMatrix = popMatrix();
        pushMatrix(g_modelMatrix);
        g_modelMatrix.rotate(current_angle+100,0,1,0);
        g_modelMatrix.rotate(g_angle02,0,0,1);
        gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, 30);
          g_modelMatrix.translate(0.0,0.4, 0.0);
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(current_angle+100,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          g_modelMatrix.rotate(current_angle+200,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);


        g_modelMatrix = popMatrix();
        g_modelMatrix.rotate(current_angle+200,0,1,0);
        g_modelMatrix.rotate(g_angle02,0,0,1);
        gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix.translate(0.0,0.4, 0.0);
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          pushMatrix(g_modelMatrix);
          g_modelMatrix.rotate(current_angle+100,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

          g_modelMatrix = popMatrix();
          g_modelMatrix.rotate(current_angle+200,0,1,0);
          g_modelMatrix.rotate(g_angle03,0,0,1);
          gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
          gl.drawArrays(gl.TRIANGLES, 0, 30);

  g_modelMatrix = popMatrix();
  pushMatrix(g_modelMatrix);

  g_modelMatrix.rotate(current_angle+100,0,1,0);
  g_modelMatrix.rotate(g_angle01,0,0,1);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 30);

    g_modelMatrix.translate(0.0,0.4, 0.0);
    pushMatrix(g_modelMatrix);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
    g_modelMatrix.rotate(current_angle+100,0,1,0);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

    g_modelMatrix = popMatrix();
    g_modelMatrix.rotate(current_angle+200,0,1,0);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30); 

  g_modelMatrix = popMatrix();
  g_modelMatrix.rotate(current_angle+200,0,1,0);
  g_modelMatrix.rotate(g_angle01,0,0,1);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 30);
  
    g_modelMatrix.translate(0.0,0.4, 0.0);
    pushMatrix(g_modelMatrix);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
    g_modelMatrix.rotate(current_angle+100,0,1,0);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

    g_modelMatrix = popMatrix();
    g_modelMatrix.rotate(current_angle+200,0,1,0);
    g_modelMatrix.rotate(g_angle02,0,0,1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix.translate(0.0,0.4, 0.0);
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      pushMatrix(g_modelMatrix);
      g_modelMatrix.rotate(current_angle+100,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30);

      g_modelMatrix = popMatrix();
      g_modelMatrix.rotate(current_angle+200,0,1,0);
      g_modelMatrix.rotate(g_angle03,0,0,1);
      gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, 0, 30); 
  
}
// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // console.log("angle_step",g_angle01);
  // current_angle = current_angle + (ANGLE_STEP * elapsed) / 1000.0;
  // current_angle %= 360;
  if(g_angle04max<20 || g_angle04max>80){
    g_angle04max = 80;
   console.log("out of bonds of end angle");
  }

  g_angle01 += g_angle01Rate * g_angle01brake * (elapsed * 0.001);
  g_angle02 += g_angle02Rate * g_angle02brake * (elapsed * 0.001);
  g_angle03 += g_angle03Rate * g_angle03brake * (elapsed * 0.001);
  g_angle04 += g_angle04Rate * g_angle04brake * (elapsed * 0.001);
  if (gold_posxRate>0)  gold_posxRate = g_angle04max/20*0.05;
  else gold_posxRate = -(g_angle04max/20)*0.05;
  if(g_angle01>g_angle01max|| g_angle01<g_angle01min){g_angle01Rate*=-1;}
  if(g_angle02>g_angle02max|| g_angle02<g_angle02min){g_angle02Rate*=-1};
  if(g_angle03>g_angle03max|| g_angle03<g_angle03min){g_angle03Rate*=-1};
  if(g_angle04>g_angle04max|| g_angle04<g_angle04min){g_angle04Rate*=-1};

  gold_posx += gold_posxRate* (elapsed * 0.001);
  if(gold_posx>0.9|| gold_posx<-0.9){
    gold_posxRate*=-1};


  if (gold_posx<=-0.9)gold_posx = -0.9;
  if (gold_posy<=-0.9)gold_posy = -0.9;
  if (gold_posx>=0.9)gold_posx = 0.9;
  if (gold_posy>=0.9)gold_posy = 0.9;

  var slider = document.getElementById("myRange");
  tree_pos = 0.02*slider.value-1;
  console.log("newblue",tree_pos);
  
  


}



function angleSubmit() {
  var UsrTxt = document.getElementById('usrEndAngle').value;	
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle04max = parseFloat(UsrTxt);     // convert string to float number 
  };
function runStop() {
    if(g_angle01brake == 1) {
      g_angle01brake = 0;
      g_angle02brake = 0;
      g_angle03brake = 0;

    }
    else {
      g_angle01brake = 1;
      g_angle02brake = 1;
      g_angle03brake = 1;

    }
  }
function myKeyDown(kev) {    
      switch(kev.code) {
        //----------------Arrow keys------------------------
        case "ArrowLeft": 	
          console.log(' left-arrow.');
          gold_posx = gold_posx - 0.1;
          break;
        case "ArrowRight":
          console.log('right-arrow.');
          gold_posx = gold_posx + 0.1;

          break;
        case "ArrowUp":		
          console.log('   up-arrow.');
          gold_posy = gold_posy + 0.1;

          break;
        case "ArrowDown":
          console.log(' down-arrow.');
          gold_posy = gold_posy - 0.1;

          break;	
        default:
          console.log("UNUSED!");
          
          break;
      }
    }
function myMouseDown(ev) {
  //==============================================================================
  // Called when user PRESSES down any mouse button;
  // 									(Which button?    console.log('ev.button='+ev.button);   )
  // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
  //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
  
  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                  (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                  (g_canvas.height/2);
  //	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
    
    g_isDrag = true;											// set our mouse-dragging flag
    g_xMclik = x;													// record where mouse-dragging began
    g_yMclik = y;
  };
      
      
function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
                (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
  g_yMdragTot += (y - g_yMclik);

  g_xMclik = x;											// Make next drag-measurement from here.
  g_yMclik = y;
};
      
function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
              (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
              (g_canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
  
  g_isDrag = false;											// CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  g_xMdragTot += (x - g_xMclik);
  g_yMdragTot += (y - g_yMclik);
};    
