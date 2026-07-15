"use client"

import { useEffect, useRef } from "react"

const VS = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FS = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Grid animation
    vec2 grid = fract(uv * 20.0 + u_time * 0.1);
    float line = smoothstep(0.0, 0.05, grid.x) * smoothstep(1.0, 0.95, grid.x) *
                 smoothstep(0.0, 0.05, grid.y) * smoothstep(1.0, 0.95, grid.y);

    // Glowing blobs
    vec2 p1 = vec2(0.3 + 0.2 * sin(u_time * 0.5), 0.3 + 0.2 * cos(u_time * 0.7));
    vec2 p2 = vec2(0.7 + 0.2 * cos(u_time * 0.4), 0.7 + 0.2 * sin(u_time * 0.6));

    float d1 = length(uv - p1);
    float d2 = length(uv - p2);

    vec3 indigo = vec3(0.388, 0.4, 0.945);
    vec3 bg = vec3(0.02, 0.04, 0.1);

    float blob1 = smoothstep(0.5, 0.0, d1);
    float blob2 = smoothstep(0.5, 0.0, d2);

    vec3 color = mix(bg, indigo * 0.4, line * 0.1);
    color += indigo * blob1 * 0.3;
    color += indigo * blob2 * 0.3;

    gl_FragColor = vec4(color, 1.0);
}`

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function syncSize() {
      const w = canvas!.clientWidth || 1280
      const h = canvas!.clientHeight || 720
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w
        canvas!.height = h
      }
    }

    syncSize()
    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvas)

    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (!gl) return

    const ctx = gl as unknown as WebGLRenderingContext
    const prog = ctx.createProgram()!
    ctx.attachShader(prog, createShader(ctx, ctx.VERTEX_SHADER, VS))
    ctx.attachShader(prog, createShader(ctx, ctx.FRAGMENT_SHADER, FS))
    ctx.linkProgram(prog)
    ctx.useProgram(prog)

    const buf = ctx.createBuffer()!
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
    ctx.bufferData(
      ctx.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      ctx.STATIC_DRAW
    )
    const pos = ctx.getAttribLocation(prog, "a_position")
    ctx.enableVertexAttribArray(pos)
    ctx.vertexAttribPointer(pos, 2, ctx.FLOAT, false, 0, 0)

    const uTime = ctx.getUniformLocation(prog, "u_time")
    const uRes = ctx.getUniformLocation(prog, "u_resolution")

    let animId: number
    function render(t: number) {
      ctx.viewport(0, 0, canvas!.width, canvas!.height)
      if (uTime) ctx.uniform1f(uTime, t * 0.001)
      if (uRes) ctx.uniform2f(uRes, canvas!.width, canvas!.height)
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ display: "block" }}
    />
  )
}
