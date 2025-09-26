import { useEffect, useMemo, useRef, useState } from "react"
import styles from "./OnnxRuntimeDemo.module.css"
import type { InferenceSession, Tensor } from "onnxruntime-web"
import * as ort from "onnxruntime-web"

interface BenchmarkResult {
  backend: string
  timeMs: number
  outputsKeptOnGpu: boolean
}

const MODEL_URL =
  "https://huggingface.co/onnx-community/mobilenetv4_conv_small.e2400_r224_in1k/resolve/main/onnx/model.onnx"
const ORT_CDN_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/"

export function OnnxRuntimeDemo() {
  const [adapterInfo, setAdapterInfo] = useState<GPUAdapterInfo | null>(null)
  const [hasF16, setHasF16] = useState<boolean | null>(null)
  const [deviceLostReason, setDeviceLostReason] = useState<string | null>(null)
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true

    async function prepareWebGPU() {
      if (!("gpu" in navigator)) {
        setError("WebGPU not available. Try enabling chrome://flags/#enable-unsafe-webgpu or updating the browser.")
        return
      }

      try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
          setError("Failed to get GPU adapter.")
          return
        }

        const requestAdapterInfo = (adapter as { requestAdapterInfo?: () => Promise<GPUAdapterInfo> })
          .requestAdapterInfo
        const info = requestAdapterInfo ? await requestAdapterInfo() : undefined
        if (active) {
          setAdapterInfo(info ?? null)
        }

        const supportsF16 = adapter.features.has("shader-f16")
        setHasF16(supportsF16)
        const requiredFeatures: Iterable<GPUFeatureName> = supportsF16 ? ["shader-f16"] : []
        const device = await adapter.requestDevice({ requiredFeatures })
        ort.env.webgpu.device = device
        ort.env.wasm.wasmPaths = ORT_CDN_BASE
        ort.env.wasm.simd = true
        ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4
        device.lost.then((info) => {
          setDeviceLostReason(info.reason)
        })
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    void prepareWebGPU()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!logRef.current) return
    logRef.current.scrollTop = logRef.current.scrollHeight
  }, [benchmarks, error])

  const adapterDescription = useMemo(() => {
    if (!adapterInfo) return "Unknown adapter"
    return `${adapterInfo.vendor ?? ""} ${adapterInfo.architecture ?? ""} ${adapterInfo.description ?? ""}`.trim()
  }, [adapterInfo])

  async function runBenchmark() {
    if (!("gpu" in navigator)) return
    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch(MODEL_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch ONNX model: ${response.status} ${response.statusText}`)
      }
      const modelBuffer = await response.arrayBuffer()

      const session = (await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ["webgpu", "wasm"],
        preferredOutputLocation: "gpu-buffer",
      })) as InferenceSession

      const inputName = session.inputNames?.[0] ?? "pixel_values"
      const inputTensor = new ort.Tensor("float32", new Float32Array(1 * 3 * 224 * 224).fill(0.5), [1, 3, 224, 224]) as Tensor

      const feeds: Record<string, Tensor> = { [inputName]: inputTensor }

      const start = performance.now()
      await session.run(feeds)
      const elapsedMs = performance.now() - start

      const provider = (session as unknown as { executionProvider?: string }).executionProvider ?? (hasF16 ? "webgpu" : "wasm")

      setBenchmarks((prev) => [
        ...prev,
        {
          backend: provider,
          timeMs: elapsedMs,
          outputsKeptOnGpu: provider === "webgpu",
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <header>
        <h1>ONNX Runtime Web: Graph Capture & IO Binding</h1>
        <p>
          Demonstrates how the WebGPU execution provider keeps tensors on the GPU and measures latency. Requires a
          WebGPU-capable browser; falls back to error messaging otherwise.
        </p>
      </header>

      <section className={styles.infoCard}>
        <h2>Adapter info</h2>
        <p>{adapterDescription}</p>
        <p className={styles.meta}>shader-f16: {hasF16 === null ? "loading" : hasF16 ? "yes" : "no"}</p>
        {deviceLostReason && <p className={styles.warning}>Device lost: {deviceLostReason}</p>}
      </section>

      <section className={styles.controls}>
        <button type="button" onClick={() => void runBenchmark()} disabled={isRunning}>
          {isRunning ? "Running..." : "Run benchmark"}
        </button>
      </section>

      {error && <div className={styles.errorBox}>Error: {error}</div>}

      <section className={styles.results}>
        <h2>Benchmark runs</h2>
        {benchmarks.length === 0 ? (
          <p>No runs yet. Trigger the benchmark to collect latency samples.</p>
        ) : (
          <ul>
            {benchmarks.map((item, index) => (
              <li key={index}>
                <strong>{item.backend}</strong>
                <span>{item.timeMs.toFixed(2)} ms</span>
                <span>{item.outputsKeptOnGpu ? "GPU buffers" : "CPU readback"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.logPane}>
        <h2>Notes</h2>
        <div ref={logRef}>
          <p>
            - WebGPU execution provider requires cross-origin isolation for WASM fallbacks.<br />
            - preferredOutputLocation="gpu-buffer" keeps tensors on the GPU between runs.<br />
            - Use <code>navigator.gpu.requestAdapter()</code> to check shader-f16 support.
          </p>
        </div>
      </section>
    </div>
  )
}
