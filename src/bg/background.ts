import compositeFrag from './shaders/composite.frag?raw';
import fullscreenVert from './shaders/fullscreen.vert?raw';
import nebulaFrag from './shaders/nebula.frag?raw';
import particlesFrag from './shaders/particles.frag?raw';
import particlesVert from './shaders/particles.vert?raw';
import {
  createParticleSeeds,
  createProgram,
  createTarget,
  deleteTarget,
  type Program,
  type RenderTarget,
} from './gl';
import {
  createGovernor,
  isSoftwareRenderer,
  nextFrameDue,
  shouldResizeCanvas,
  tierAt,
  updateGovernor,
  type GovernorState,
} from './quality';

const MAX_PARTICLES = 16_000;
const STATIC_TIME = 42; // time used for the single reduced-motion frame

type NebulaU = 'uResolution' | 'uTime' | 'uScroll' | 'uPointer';
type CompositeU = 'uScene' | 'uResolution' | 'uPointer' | 'uTime';
type ParticleU = 'uResolution' | 'uTime' | 'uScroll' | 'uPointer' | 'uPointerActive' | 'uDpr';

interface GpuResources {
  nebula: Program<NebulaU>;
  composite: Program<CompositeU>;
  particles: Program<ParticleU>;
  emptyVao: WebGLVertexArrayObject;
  particleVao: WebGLVertexArrayObject;
  particleBuffer: WebGLBuffer;
  target: RenderTarget | null;
}

/**
 * Starts the animated background (SPEC B1–B8). Returns a stop() for cleanup / HMR.
 * Falls back to the CSS gradient when WebGL2 is unavailable or shaders fail.
 */
export function startBackground(canvas: HTMLCanvasElement): () => void {
  const root = document.documentElement;
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    root.classList.add('no-webgl'); // B7
    return () => undefined;
  }

  // No real GPU → shaders would run on the CPU. Release the context and use the CSS fallback.
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(
    gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '',
  );
  if (isSoftwareRenderer(renderer)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    root.classList.add('no-webgl');
    return () => undefined;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || window.innerWidth < 700;

  let gpu: GpuResources | null = null;
  let governor: GovernorState = createGovernor(lowPower ? 1 : 2);
  let raf = 0;
  let lastFrame = 0;
  let frameDue = 0;
  let elapsed = 0;
  let running = false;

  // Pointer & scroll inputs, smoothed in the loop for an organic feel.
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, targetActive: 0 };
  let scroll = window.scrollY / window.innerHeight;
  let scrollTarget = scroll;

  function init(): boolean {
    if (!gl) return false;
    try {
      const nebula = createProgram<NebulaU>(gl, fullscreenVert, nebulaFrag, [
        'uResolution',
        'uTime',
        'uScroll',
        'uPointer',
      ]);
      const composite = createProgram<CompositeU>(gl, fullscreenVert, compositeFrag, [
        'uScene',
        'uResolution',
        'uPointer',
        'uTime',
      ]);
      const particles = createProgram<ParticleU>(gl, particlesVert, particlesFrag, [
        'uResolution',
        'uTime',
        'uScroll',
        'uPointer',
        'uPointerActive',
        'uDpr',
      ]);

      const emptyVao = gl.createVertexArray();
      const particleVao = gl.createVertexArray();
      const particleBuffer = gl.createBuffer();
      gl.bindVertexArray(particleVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, createParticleSeeds(MAX_PARTICLES), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      gpu = { nebula, composite, particles, emptyVao, particleVao, particleBuffer, target: null };
      resize();
      root.classList.add('has-webgl');
      root.classList.remove('no-webgl');
      return true;
    } catch (err) {
      console.warn('[bg] WebGL init failed, using CSS fallback.', err);
      root.classList.add('no-webgl');
      return false;
    }
  }

  function resize(): void {
    if (!gl || !gpu) return;
    const tier = tierAt(governor.tier);
    const dpr = Math.min(window.devicePixelRatio || 1, tier.dprCap);
    const next = {
      width: Math.max(1, Math.round(window.innerWidth * dpr)),
      height: Math.max(1, Math.round(window.innerHeight * dpr)),
    };
    if (shouldResizeCanvas(canvas, next)) {
      canvas.width = next.width;
      canvas.height = next.height;
    }
    const tw = Math.max(1, Math.round(canvas.width * tier.fboScale));
    const th = Math.max(1, Math.round(canvas.height * tier.fboScale));
    if (!gpu.target || gpu.target.width !== tw || gpu.target.height !== th) {
      deleteTarget(gl, gpu.target);
      gpu.target = createTarget(gl, tw, th);
    }
    if (!running) render(); // keep the static frame correct on resize
  }

  function render(): void {
    if (!gl || !gpu?.target) return;
    const tier = tierAt(governor.tier);
    const time = motionQuery.matches ? STATIC_TIME : elapsed;
    const dpr = canvas.width / window.innerWidth;

    // Pass 1: nebula → low-res framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, gpu.target.framebuffer);
    gl.viewport(0, 0, gpu.target.width, gpu.target.height);
    gl.disable(gl.BLEND);
    gl.useProgram(gpu.nebula.program);
    gl.uniform2f(gpu.nebula.uniforms.uResolution, gpu.target.width, gpu.target.height);
    gl.uniform1f(gpu.nebula.uniforms.uTime, time);
    gl.uniform1f(gpu.nebula.uniforms.uScroll, scroll);
    gl.uniform2f(gpu.nebula.uniforms.uPointer, pointer.x, pointer.y);
    gl.bindVertexArray(gpu.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2: composite → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(gpu.composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.target.texture);
    gl.uniform1i(gpu.composite.uniforms.uScene, 0);
    gl.uniform2f(gpu.composite.uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(gpu.composite.uniforms.uPointer, pointer.x, pointer.y);
    gl.uniform1f(gpu.composite.uniforms.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 3: particles, additive
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(gpu.particles.program);
    gl.uniform2f(gpu.particles.uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform1f(gpu.particles.uniforms.uTime, time);
    gl.uniform1f(gpu.particles.uniforms.uScroll, scroll);
    gl.uniform2f(gpu.particles.uniforms.uPointer, pointer.x, pointer.y);
    gl.uniform1f(gpu.particles.uniforms.uPointerActive, pointer.active);
    gl.uniform1f(gpu.particles.uniforms.uDpr, dpr);
    gl.bindVertexArray(gpu.particleVao);
    gl.drawArrays(gl.POINTS, 0, Math.floor(MAX_PARTICLES * tier.particleFraction));
    gl.bindVertexArray(null);
  }

  function frame(now: number): void {
    if (!running) return;
    // Cap at ~60 fps: high-refresh displays would otherwise render 2–4× more often for no visible gain.
    if (lastFrame && now < frameDue - 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    frameDue = lastFrame ? nextFrameDue(frameDue, now) : now + 1000 / 60;
    const dt = lastFrame ? now - lastFrame : 16.7;
    lastFrame = now;
    elapsed += Math.min(dt, 50) / 1000; // clamp so a stalled frame doesn't jump the animation

    // Exponential smoothing, frame-rate independent.
    const k = 1 - Math.exp(-dt / 140);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    pointer.active += (pointer.targetActive - pointer.active) * k;
    scroll += (scrollTarget - scroll) * (1 - Math.exp(-dt / 90));

    const previousTier = governor.tier;
    governor = updateGovernor(governor, dt);
    if (governor.tier !== previousTier) resize();

    render();
    raf = requestAnimationFrame(frame);
  }

  function play(): void {
    if (running || motionQuery.matches || document.hidden || !gpu) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function pause(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  // --- Event wiring ---
  const onPointerMove = (e: PointerEvent): void => {
    pointer.tx = e.clientX / window.innerWidth;
    pointer.ty = 1 - e.clientY / window.innerHeight;
    pointer.targetActive = e.pointerType === 'mouse' ? 1 : 0.6;
  };
  const onPointerLeave = (): void => {
    pointer.targetActive = 0;
  };
  const onScroll = (): void => {
    scrollTarget = window.scrollY / window.innerHeight;
    if (!running) {
      scroll = scrollTarget;
    }
  };
  const onVisibility = (): void => {
    if (document.hidden) pause();
    else play(); // B5
  };
  const onMotionChange = (): void => {
    if (motionQuery.matches) {
      pause();
      render(); // B6: one static frame
    } else play();
  };
  const onContextLost = (e: Event): void => {
    e.preventDefault(); // B8: allow restoration
    pause();
    gpu = null;
  };
  const onContextRestored = (): void => {
    if (init()) {
      render();
      play();
    }
  };

  let resizeQueued = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeQueued);
    resizeQueued = requestAnimationFrame(resize);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotionChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  if (init()) {
    render();
    play();
  }

  return () => {
    pause();
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    motionQuery.removeEventListener('change', onMotionChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
  };
}
