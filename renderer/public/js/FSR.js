/*
  Copyright 2017 Google Inc. All Rights Reserved.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
var BASE_VERTEX_SHADER = "\nattribute vec2 position;\nattribute vec2 uv;\n\nvarying vec2 texCoords;\n\nvoid main() {\n  gl_Position = vec4(position, 0, 1.0);\n  texCoords = uv;\n}";
var BASE_FRAGMENT_SHADERX = "\nprecision highp float;\n\nvarying vec2 texCoords;\n\nuniform sampler2D textureSampler;\n\nvoid main() {\n  gl_FragColor = texture2D(textureSampler, texCoords);\n  gl_FragColor = vec4(1.0 - gl_FragColor.r,1.0 -gl_FragColor.g,1.0 -gl_FragColor.b,1);\n}";
var BASE_FRAGMENT_SHADER = "\nprecision highp float;\nvarying vec2 texCoords;\nuniform vec2 size;\nuniform sampler2D textureSampler;\n#define FSR_RCAS_LIMIT (0.25-(1.0/16.0))\nvec4 FsrRcasLoadF(vec2 p);\nvoid FsrRcasCon(\n    out float con,\n    float sharpness\n){\n    con = exp2(-sharpness);\n}\n\nvec3 FsrRcasF(\n    vec2 ip,\n    float con\n)\n{\n    vec2 sp = vec2(ip);\n    vec3 b = FsrRcasLoadF(sp + vec2( 0,-1)).rgb;\n    vec3 d = FsrRcasLoadF(sp + vec2(-1, 0)).rgb;\n    vec3 e = FsrRcasLoadF(sp).rgb;\n    vec3 f = FsrRcasLoadF(sp+vec2( 1, 0)).rgb;\n    vec3 h = FsrRcasLoadF(sp+vec2( 0, 1)).rgb;\n    float bL = b.g + .5 * (b.b + b.r);\n    float dL = d.g + .5 * (d.b + d.r);\n    float eL = e.g + .5 * (e.b + e.r);\n    float fL = f.g + .5 * (f.b + f.r);\n    float hL = h.g + .5 * (h.b + h.r);\n    float nz = .25 * (bL + dL + fL + hL) - eL;\n    nz=clamp(\n        abs(nz)\n        /(\n            max(max(bL,dL),max(eL,max(fL,hL)))\n            -min(min(bL,dL),min(eL,min(fL,hL)))\n        ),\n        0., 1.\n    );\n    nz=1.-.5*nz;\n    vec3 mn4 = min(b, min(f, h));\n    vec3 mx4 = max(b, max(f, h));\n    vec2 peakC = vec2(1., -4.);\n    vec3 hitMin = mn4 / (4. * mx4);\n    vec3 hitMax = (peakC.x - mx4) / (4.* mn4 + peakC.y);\n    vec3 lobeRGB = max(-hitMin, hitMax);\n    float lobe = max(\n        -FSR_RCAS_LIMIT,\n        min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.)\n    )*con;\n    #ifdef FSR_RCAS_DENOISE\n    lobe *= nz;\n    #endif\n    return (lobe * (b + d + h + f) + e) / (4. * lobe + 1.);\n} \n\n\nvec4 FsrRcasLoadF(vec2 p) {\n    return texture2D(textureSampler, p/size);\n}\n\nvoid main(void)\n{\n    float con;\n    float sharpness = 0.2;\n    FsrRcasCon(con,sharpness);\n    vec3 col = FsrRcasF(texCoords * size, con);\n    gl_FragColor = vec4(col, texture2D(textureSampler, texCoords).a);\n}";
var POSITIONS = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
var UVS = new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]);
var INDEX = new Uint16Array([0, 1, 2, 0, 2, 3]);
var UniformInfo = /** @class */ (function () {
    function UniformInfo() {
    }
    return UniformInfo;
}());
var ImageShader = /** @class */ (function () {
    function ImageShader() {
        this.canvas = document.createElement('canvas');
        var context = this.canvas.getContext('webgl');
        if (context === null) {
            throw new Error("Couldn't get a WebGL context");
        }
        var gl = context;
        this.context = gl;
        var textureId = gl.createTexture();
        if (textureId === null) {
            throw new Error('Error getting texture ID');
        }
        this.textureId = textureId;
        this.programId = 0;
        this.vertShader = BASE_VERTEX_SHADER;
        this.fragShader = BASE_FRAGMENT_SHADER;
        this.uniformLocations = new Map();
        this.bindBuffers(INDEX, POSITIONS, UVS);
        gl.clearColor(1, 1, 1, 1);
        this.dirtyProgram = true;
    }
    ImageShader.prototype.setImage = function (image) {
        var gl = this.context;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        var scale = window.devicePixelRatio;
        var realWidth = 1920 * 2;
        var realHeight = 1080 * 2;
        if (image instanceof HTMLVideoElement) {
            if (image.videoWidth < realWidth || image.videoHeight < realHeight) {
                this.setUniform("size", new Float32Array([realWidth, realHeight]));
            }
            else {
                this.setUniform("size", new Float32Array([image.videoWidth, image.videoHeight]));
            }
        }
        else {
            if (image.width < realWidth || image.height < realHeight) {
                this.setUniform("size", new Float32Array([realWidth, realHeight]));
            }
            else {
                this.setUniform("size", new Float32Array([image.width, image.height]));
            }
        }
        this.canvas.width = realWidth;
        this.canvas.height = realHeight;
    };
    ImageShader.prototype.setVertexShader = function (source) {
        this.vertShader = source;
        this.dirtyProgram = true;
    };
    ImageShader.prototype.setFragmentShader = function (source) {
        this.fragShader = source;
        this.dirtyProgram = true;
    };
    ImageShader.prototype.setUniform = function (name, value) {
        var gl = this.context;
        if (this.dirtyProgram) {
            this.createProgram();
        }
        if (!this.uniformLocations.has(name)) {
            console.warn("Tried to set unknown uniform ".concat(name));
            return;
        }
        var info = this.uniformLocations.get(name);
        switch (info.type) {
            case gl.FLOAT:
                gl.uniform1fv(info.location, [value]);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2fv(info.location, value);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3fv(info.location, value);
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4fv(info.location, value);
                break;
            case gl.BOOL:
            case gl.INT:
                gl.uniform1iv(info.location, [value]);
                break;
            case gl.BOOL_VEC2:
            case gl.INT_VEC2:
                gl.uniform2iv(info.location, value);
                break;
            case gl.BOOL_VEC3:
            case gl.INT_VEC3:
                gl.uniform3iv(info.location, value);
                break;
            case gl.BOOL_VEC4:
            case gl.INT_VEC4:
                gl.uniform4iv(info.location, value);
                break;
            default:
                console.error("Couldn't set uniform, unsupported type");
        }
    };
    ImageShader.prototype.render = function () {
        var gl = this.context;
        if (this.dirtyProgram) {
            this.createProgram();
        }
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.flush();
    };
    ImageShader.prototype.createProgram = function () {
        var gl = this.context;
        var vertexShaderId = this.compileShader(this.vertShader, gl.VERTEX_SHADER);
        var fragmentShaderId = this.compileShader(this.fragShader, gl.FRAGMENT_SHADER);
        var programId = gl.createProgram();
        if (programId === null) {
            throw new Error("Couldn't get a program ID");
        }
        this.programId = programId;
        gl.attachShader(programId, vertexShaderId);
        gl.attachShader(programId, fragmentShaderId);
        gl.linkProgram(programId);
        if (!gl.getProgramParameter(programId, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(programId);
            throw new Error('Could not link shader program. \n\n' + info);
        }
        gl.validateProgram(programId);
        if (!gl.getProgramParameter(programId, gl.VALIDATE_STATUS)) {
            var info = gl.getProgramInfoLog(programId);
            throw new Error('Could not validate shader program. \n\n' + info);
        }
        gl.useProgram(programId);
        this.uniformLocations = new Map();
        this.getUniformLocations();
        this.dirtyProgram = false;
    };
    ImageShader.prototype.compileShader = function (source, type) {
        var gl = this.context;
        var shader = gl.createShader(type);
        if (shader === null) {
            throw new Error('Error creating shader');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Couldn't compiler shader: ".concat(gl.getShaderInfoLog(shader)));
        }
        return shader;
    };
    ImageShader.prototype.getUniformLocations = function () {
        var gl = this.context;
        var numUniforms = gl.getProgramParameter(this.programId, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; i++) {
            var info = gl.getActiveUniform(this.programId, i);
            if (info === null) {
                throw new Error("Couldn't get uniform info");
            }
            var location_1 = gl.getUniformLocation(this.programId, info.name);
            if (location_1) {
                this.uniformLocations.set(info.name, { type: info.type, location: location_1 });
            }
        }
    };
    ImageShader.prototype.bindBuffers = function (index, positions, uvs) {
        var gl = this.context;
        this.bindIndicesBuffer(index);
        this.bindAttributeBuffer(0, 2, positions);
        this.bindAttributeBuffer(1, 2, uvs);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
    };
    ImageShader.prototype.bindAttributeBuffer = function (attributeNumber, size, data) {
        var gl = this.context;
        var id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, id);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(attributeNumber, size, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    ImageShader.prototype.bindIndicesBuffer = function (data) {
        var gl = this.context;
        var id = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };
    ImageShader.prototype.destroy = function () {
        var gl = this.context;
        gl.getExtension("WEBGL_lose_context").loseContext();
    };
    return ImageShader;
}());
