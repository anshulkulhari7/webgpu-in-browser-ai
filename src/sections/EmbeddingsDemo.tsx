import { useEffect, useMemo, useState } from "react"
import styles from "./EmbeddingsDemo.module.css"
import { useBackendChoice } from "../shared/useBackendChoice"
import { SAMPLE_DOCUMENTS } from "../shared/documents"
import type { SimilarityHit } from "../shared/types"

interface EmbeddingPipeline {
  (inputs: string[], options?: Record<string, unknown>): Promise<unknown>
}

function toFloat32Array(value: unknown): Float32Array {
  if (value instanceof Float32Array) return value
  if (ArrayBuffer.isView(value)) return new Float32Array((value as ArrayBufferView).buffer.slice(0))
  if (Array.isArray(value)) return new Float32Array(value as number[])
  if (value && typeof value === "object") {
    const maybeData = (value as { data?: unknown }).data
    if (maybeData instanceof Float32Array) return maybeData
    if (ArrayBuffer.isView(maybeData)) return new Float32Array((maybeData as ArrayBufferView).buffer.slice(0))
    if (Array.isArray(maybeData)) return new Float32Array(maybeData as number[])
  }
  return new Float32Array([])
}

function normalizeVectors(value: unknown, total: number): number[][] {
  const vectors: number[][] = []
  const candidate = Array.isArray(value) ? value : value ? [value] : []
  for (const entry of candidate.slice(0, total)) {
    const vector = Array.from(toFloat32Array(entry))
    if (vector.length > 0) {
      vectors.push(vector)
    }
  }
  return vectors
}

function isSimilarityHit(value: SimilarityHit | null): value is SimilarityHit {
  return value !== null
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let aNorm = 0
  let bNorm = 0

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    aNorm += a[i] ** 2
    bNorm += b[i] ** 2
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm))
}

export function EmbeddingsDemo() {
  const { backend, backendOptions, setBackend } = useBackendChoice()
  const [embedder, setEmbedder] = useState<(EmbeddingPipeline & { dispose?: () => void }) | null>(null)
  const [embeddings, setEmbeddings] = useState<number[][]>([])
  const [query, setQuery] = useState("webgpu demos")
  const [results, setResults] = useState<SimilarityHit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let activePipeline: { dispose?: () => void } | null = null

    async function loadEmbedder() {
      setIsLoading(true)
      setError(null)

      try {
        const { pipeline } = await import("@huggingface/transformers")
        const embeddingPipeline = (await pipeline(
          "feature-extraction",
          "mixedbread-ai/mxbai-embed-xsmall-v1",
          {
            device: backend,
          },
        )) as unknown as EmbeddingPipeline & { dispose?: () => void }

        if (!cancelled) {
          activePipeline = embeddingPipeline
          setEmbedder(() => embeddingPipeline)
          const docs = SAMPLE_DOCUMENTS.map((doc) => `${doc.title}. ${doc.content}`)
          const rawVectors = await embeddingPipeline(docs, { pooling: "mean", normalize: true })
          if (!cancelled) {
            const normalizedVectors = normalizeVectors(rawVectors, SAMPLE_DOCUMENTS.length)
            setEmbeddings(normalizedVectors)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadEmbedder()

    return () => {
      cancelled = true
      activePipeline?.dispose?.()
      setEmbedder(null)
      setEmbeddings([])
    }
  }, [backend])

  const backendLabel = useMemo(() => (backend === "webgpu" ? "WebGPU" : "WASM"), [backend])

  async function handleSearch() {
    if (!embedder || embeddings.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const vec = await embedder([query], { pooling: "mean", normalize: true })
      const queryVector = normalizeVectors(vec, 1)[0] ?? []

      const hits = embeddings
        .map((docVec, index) => {
          const docMeta = SAMPLE_DOCUMENTS[index]
          if (!docMeta || docVec.length === 0 || queryVector.length === 0) {
            return null
          }
          return {
            id: docMeta.id,
            score: cosineSimilarity(queryVector, docVec),
          }
        })
        .filter(isSimilarityHit)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      setResults(hits)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const topDocuments = useMemo(() => {
    return results
      .map((hit) => ({ hit, doc: SAMPLE_DOCUMENTS.find((doc) => doc.id === hit.id) }))
      .filter(({ doc }) => Boolean(doc))
  }, [results])

  return (
    <div className={styles.container}>
      <header>
        <h1>Embeddings & Semantic Search</h1>
        <p>
          Generates embeddings for a small corpus entirely in the browser. Compare WebGPU against WASM, and see how
          normalized cosine similarity ranks documents.
        </p>
      </header>

      <section className={styles.controls}>
        <label>
          Backend
          <select value={backend} onChange={(event) => setBackend(event.target.value as "webgpu" | "wasm")} disabled={isLoading}>
            {backendOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Query text
          <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <button type="button" onClick={() => void handleSearch()} disabled={isLoading || !embedder}>
          {isLoading ? "Computing..." : `Search with ${backendLabel}`}
        </button>
      </section>

      {error && <p className={styles.error}>Error: {error}</p>}

      <section className={styles.results}>
        <h2>Results</h2>
        {topDocuments.length === 0 ? (
          <p>Run a query to see matching documents.</p>
        ) : (
          <ul>
            {topDocuments.map(({ hit, doc }) => (
              <li key={hit.id}>
                <div>
                  <h3>{doc?.title}</h3>
                  <p>{doc?.content}</p>
                </div>
                <span>{hit.score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
