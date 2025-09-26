import { useEffect, useMemo, useState } from "react"
import styles from "./ImageClassifierDemo.module.css"
import { useBackendChoice } from "../shared/useBackendChoice"

interface ClassificationResult {
  label: string
  score: number
}

type ImagePipeline = ((input: string | URL | File | Blob) => Promise<ClassificationResult[]>) & {
  dispose?: () => void
}

const SAMPLE_IMAGE =
  "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg"

export function ImageClassifierDemo() {
  const { backend, backendOptions, setBackend } = useBackendChoice()
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE)
  const [results, setResults] = useState<ClassificationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pipeline, setPipeline] = useState<ImagePipeline | null>(null)

  useEffect(() => {
    let isMounted = true
    let activePipeline: { dispose?: () => void } | null = null

    async function loadPipeline() {
      setIsLoading(true)
      setError(null)

      try {
        const transformers = await import("@huggingface/transformers")
        const pipelineFactory = transformers.pipeline as (
          task: string,
          model: string,
          options?: Record<string, unknown>,
        ) => Promise<unknown>

        const instance = (await pipelineFactory(
          "image-classification",
          "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
          {
            device: backend,
            revision: "main",
          },
        )) as ImagePipeline

        if (isMounted) {
          activePipeline = instance
          setPipeline(() => instance)
        } else {
          instance.dispose?.()
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPipeline()

    return () => {
      isMounted = false
      activePipeline?.dispose?.()
      setPipeline(null)
    }
  }, [backend])

  async function handleClassify(url: string) {
    if (!pipeline) return
    setIsLoading(true)
    setError(null)

    try {
      const output = await pipeline(url)
      setResults(output.slice(0, 5))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (/Failed to fetch/i.test(message) || /fetch/i.test(message)) {
        setError(
          "Could not fetch the image. This may be due to CORS restrictions on the host. Try another URL or host the image on a domain that allows cross-origin requests.",
        )
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const backendLabel = useMemo(() => (backend === "webgpu" ? "WebGPU" : "WASM"), [backend])

  return (
    <div className={styles.container}>
      <header>
        <h1>Transformers.js Image Classification</h1>
        <p>
          Loads MobileNetV4 via Transformers.js and runs inference on the GPU when available. Switch the
          backend to compare WebGPU vs WASM (fallback).
        </p>
      </header>

      <section className={styles.controls}>
        <label className={styles.backendSelect}>
          Backend
          <select
            value={backend}
            onChange={(event) => setBackend(event.target.value as "webgpu" | "wasm")}
            disabled={isLoading}
          >
            {backendOptions.map(({ value, label, disabled }) => (
              <option key={value} value={value} disabled={disabled}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.imageUrl}>
          Image URL
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className={styles.actions}>
          <button type="button" onClick={() => void handleClassify(imageUrl)} disabled={isLoading || !pipeline}>
            {isLoading ? "Classifying..." : `Run on ${backendLabel}`}
          </button>
          <button type="button" onClick={() => void handleClassify(SAMPLE_IMAGE)} disabled={isLoading || !pipeline}>
            Use sample tiger
          </button>
        </div>
      </section>

      {error && <p className={styles.error}>Error: {error}</p>}

      <section className={styles.results}>
        <h2>Top predictions</h2>
        {results.length === 0 ? (
          <p>No predictions yet. Run a classification to see results.</p>
        ) : (
          <ul>
            {results.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <span>{(item.score * 100).toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
