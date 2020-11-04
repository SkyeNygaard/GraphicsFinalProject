const up = [0, 1, 0]
let target = [0, 0, 0]
let lookAt = true
let fieldOfViewRadians = m4.degToRad(60)

let gl;
let attributeCoords;
let uniformMatrix;
let uniformColor;
let bufferCoords;
let attributeNormals
let uniformWorldViewProjection
let uniformWorldInverseTranspose
let uniformReverseLightDirectionLocation
let normalBuffer

let selectedShapeIndex = 0

const updateTranslation = (event, axis) => {
  const value = event.target.value
  shapes[selectedShapeIndex].translation[axis] = value
  render()
}

const updateScale = (event, axis) => {
  const value = event.target.value
  shapes[selectedShapeIndex].scale[axis] = value
  render()
}

const updateRotation = (event, axis) => {
  shapes[selectedShapeIndex].rotation[axis] = event.target.value
  render();
}

const updateColor = (event, axis) => {
  const value = event.target.value
  shapes[selectedShapeIndex].color = webglUtils.hexToRgb(value);
  render()
}

const init = () => {
  // get a reference to the canvas and WebGL context
  const canvas = document.querySelector("#canvas");

  document.getElementById("tx").onchange = event => updateTranslation(event,
      "x")
  document.getElementById("ty").onchange = event => updateTranslation(event,
      "y")
  document.getElementById("tz").onchange = event => updateTranslation(event,
      "z")

  document.getElementById("sx").onchange = event => updateScale(event, "x")
  document.getElementById("sy").onchange = event => updateScale(event, "y")
  document.getElementById("sz").onchange = event => updateScale(event, "z")

  document.getElementById("rx").onchange = event => updateRotation(event, "x")
  document.getElementById("ry").onchange = event => updateRotation(event, "y")
  document.getElementById("rz").onchange = event => updateRotation(event, "z")

  document.getElementById("fv").onchange = event => updateFieldOfView(event)

  document.getElementById("color").onchange = event => updateColor(event)

  document.getElementById("lookAt").onchange = event => webglUtils.updateLookAt(
      event)
  document.getElementById(
      "ctx").onchange = event => webglUtils.updateCameraTranslation(event, "x")
  document.getElementById(
      "cty").onchange = event => webglUtils.updateCameraTranslation(event, "y")
  document.getElementById(
      "ctz").onchange = event => webglUtils.updateCameraTranslation(event, "z")
  document.getElementById(
      "crx").onchange = event => webglUtils.updateCameraRotation(event, "x")
  document.getElementById(
      "cry").onchange = event => webglUtils.updateCameraRotation(event, "y")
  document.getElementById(
      "crz").onchange = event => webglUtils.updateCameraRotation(event, "z")
  document.getElementById(
      "ltx").onchange = event => webglUtils.updateLookAtTranslation(event, 0)
  document.getElementById(
      "lty").onchange = event => webglUtils.updateLookAtTranslation(event, 1)
  document.getElementById(
      "ltz").onchange = event => webglUtils.updateLookAtTranslation(event, 2)

  document.getElementById("lookAt").checked = lookAt
  document.getElementById("ctx").value = camera.translation.x
  document.getElementById("cty").value = camera.translation.y
  document.getElementById("ctz").value = camera.translation.z
  document.getElementById("crx").value = camera.rotation.x
  document.getElementById("cry").value = camera.rotation.y
  document.getElementById("crz").value = camera.rotation.z


  document.getElementById("dlrx").value = lightSource[0]
  document.getElementById("dlry").value = lightSource[1]
  document.getElementById("dlrz").value = lightSource[2]

  document.getElementById("dlrx").onchange
      = event => webglUtils.updateLightDirection(event, 0)
  document.getElementById("dlry").onchange
      = event => webglUtils.updateLightDirection(event, 1)
  document.getElementById("dlrz").onchange
      = event => webglUtils.updateLightDirection(event, 2)

  // First person
  document.getElementById("turn-left").onclick = event => webglUtils.moveCamera(
      event,
      "turn-left")
  document.getElementById(
      "turn-right").onclick = event => webglUtils.moveCamera(event,
      "turn-right")
  document.getElementById("move-left").onclick = event => webglUtils.moveCamera(
      event,
      "move-left")
  document.getElementById(
      "move-right").onclick = event => webglUtils.moveCamera(event,
      "move-right")
  document.getElementById(
      "move-forward").onclick = event => webglUtils.moveCamera(event,
      "move-forward")
  document.getElementById(
      "move-backward").onclick = event => webglUtils.moveCamera(event,
      "move-backward")

  canvas.addEventListener(
      "mousedown",
      webglUtils.doMouseDown,
      false);
  document.addEventListener(
      'keydown',
      webglUtils.moveCamera,
      false
  )

  gl = canvas.getContext("webgl");

  // create and use a GLSL program
  const program = webglUtils.createProgramFromScripts(gl, "#vertex-shader-3d",
      "#fragment-shader-3d");
  gl.useProgram(program);

  // get reference to GLSL attributes and uniforms
  attributeCoords = gl.getAttribLocation(program, "a_coords");
  uniformMatrix = gl.getUniformLocation(program, "u_matrix");
  const uniformResolution = gl.getUniformLocation(program, "u_resolution");
  uniformColor = gl.getUniformLocation(program, "u_color");

  // Lighting from GLSL
  attributeNormals = gl.getAttribLocation(program, "a_normals");
  gl.enableVertexAttribArray(attributeNormals);
  normalBuffer = gl.createBuffer();

  uniformWorldViewProjection
      = gl.getUniformLocation(program, "u_worldViewProjection");
  uniformWorldInverseTranspose
      = gl.getUniformLocation(program, "u_worldInverseTranspose");
  uniformReverseLightDirectionLocation
      = gl.getUniformLocation(program, "u_reverseLightDirection");

  // initialize coordinate attribute to send each vertex to GLSL program
  gl.enableVertexAttribArray(attributeCoords);

  // initialize coordinate buffer to send array of vertices to GPU
  bufferCoords = gl.createBuffer();

  // configure canvas resolution and clear the canvas
  gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  webglUtils.selectShape(0);
}

const updateFieldOfView = (event) => {
  fieldOfViewRadians = m4.degToRad(event.target.value);
  render();
}

const computeModelViewMatrix = (shape, viewProjectionMatrix) => {
  M = m4.translate(viewProjectionMatrix,
      shape.translation.x,
      shape.translation.y,
      shape.translation.z)
  M = m4.xRotate(M, m4.degToRad(shape.rotation.x))
  M = m4.yRotate(M, m4.degToRad(shape.rotation.y))
  M = m4.zRotate(M, m4.degToRad(shape.rotation.z))
  M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z)
  return M
}

const render = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
  gl.vertexAttribPointer(
      attributeCoords,
      3,
      gl.FLOAT,
      false,
      0,
      0);

  // Normals
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(attributeNormals, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;
  let cameraMatrix = m4.identity()

  if (lookAt) {
    cameraMatrix = m4.translate(
        cameraMatrix,
        camera.translation.x,
        camera.translation.y,
        camera.translation.z)
    const cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14]]
    cameraMatrix = m4.lookAt(
        cameraPosition,
        target,
        up)

  } else {
    cameraMatrix = m4.zRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.z));
    cameraMatrix = m4.xRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.x));
    cameraMatrix = m4.yRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.y));
    cameraMatrix = m4.translate(
        cameraMatrix,
        camera.translation.x,
        camera.translation.y,
        camera.translation.z);
  }
  cameraMatrix = m4.inverse(cameraMatrix)
  const projectionMatrix = m4.perspective(
      fieldOfViewRadians, aspect, zNear, zFar);
  const viewProjectionMatrix = m4.multiply(
      projectionMatrix, cameraMatrix);


  let worldMatrix = m4.identity()
  const worldViewProjectionMatrix
      = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix
      = m4.inverse(worldMatrix);
  const worldInverseTransposeMatrix
      = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(uniformWorldViewProjection, false,
      worldViewProjectionMatrix);
  gl.uniformMatrix4fv(uniformWorldInverseTranspose, false,
      worldInverseTransposeMatrix);

  gl.uniform3fv(uniformReverseLightDirectionLocation,
      m4.normalize(lightSource));

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);

  shapes.forEach((shape, index) => {
    gl.uniform4f(uniformColor,
        shape.color.red,
        shape.color.green,
        shape.color.blue, 1);

    // compute transformation matrix
    let matrix = computeModelViewMatrix(shape, worldViewProjectionMatrix)

    // apply transformation matrix.
    gl.uniformMatrix4fv(uniformWorldViewProjection, false, matrix);

    const $shapeList = $("#object-list")
    $shapeList.empty()
    shapes.forEach((shape, index) => {

      const $li = $(`
     <li>
             <button onclick="webglUtils.deleteShape(${index})">
          Delete
        </button>
       <label>
           <input
     type="radio"
     id="${shape.type}-${index}"
     name="shape-index"
     ${index === selectedShapeIndex ? "checked" : ""}
     onclick="webglUtils.selectShape(${index})"
     value="${index}"/>
         ${shape.type};
         X: ${shape.translation.x};
         Y: ${shape.translation.y}
       </label>
     </li>
   `)
      $shapeList.append($li);
    });

    if (shape.type === RECTANGLE) {
      webglUtils.renderRectangle(shape)
    } else if (shape.type === TRIANGLE) {
      webglUtils.renderTriangle(shape)
    } else if (shape.type === CIRCLE) {
      webglUtils.renderCircle(shape);
    } else if (shape.type == STAR) {
      webglUtils.renderStar(shape);
    } else if (shape.type == CUBE) {
      webglUtils.renderCubeLighting(shape);
    }
  })
}

