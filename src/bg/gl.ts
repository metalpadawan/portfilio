/** Minimal WebGL2 helpers. All GPU resource creation lives here (ADR-0002). */

export function compile(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown error';
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

export interface Program<U extends string> {
  program: WebGLProgram;
  uniforms: Record<U, WebGLUniformLocation | null>;
}

export function createProgram<U extends string>(
  gl: WebGL2RenderingContext,
  vertexSrc: string,
  fragmentSrc: string,
  uniformNames: readonly U[],
): Program<U> {
  const vs = compile(gl, gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs); // flagged for deletion; freed with the program
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program) ?? 'unknown error'}`);
  }
  const uniforms = {} as Record<U, WebGLUniformLocation | null>;
  for (const name of uniformNames) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

export interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

/** Color-only framebuffer with a linearly filtered texture (for cheap bilinear upscaling). */
export function createTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): RenderTarget {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { framebuffer, texture, width, height };
}

export function deleteTarget(gl: WebGL2RenderingContext, target: RenderTarget | null): void {
  if (!target) return;
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}

/** Seeds for stateless particles: xy start, z depth (biased far), w phase. */
export function createParticleSeeds(
  count: number,
  random: () => number = Math.random,
): Float32Array {
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    data[i * 4] = random();
    data[i * 4 + 1] = random();
    data[i * 4 + 2] = Math.pow(random(), 1.8); // more far particles than near → depth illusion
    data[i * 4 + 3] = random();
  }
  return data;
}
