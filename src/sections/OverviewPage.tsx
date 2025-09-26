import { Link } from "react-router-dom"
import styles from "./OverviewPage.module.css"

const demoTiles = [
  {
    title: "Transformers.js Pipelines",
    description:
      "Use ready-to-ship image and audio pipelines with a single `device: \"webgpu\"` flag. Demonstrates the fastest path from idea to demo with automatic WASM fallback.",
    to: "/image-classifier",
  },
  {
    title: "Embeddings & Search",
    description:
      "Generate embeddings in the browser, keep vectors on the GPU, and run semantic search locally—ideal for highlighting latency wins with WebGPU.",
    to: "/embeddings",
  },
  {
    title: "WebLLM Chat",
    description:
      "Run a quantized small language model in-browser with streaming output. Perfect for showing OpenAI-style workflows without a server.",
    to: "/webllm",
  },
  {
    title: "ONNX Runtime Control",
    description:
      "Inspect graph capture and IO binding to understand how to chain GPU tensors without readbacks.",
    to: "/onnx",
  },
  {
    title: "Capability Playground",
    description:
      "Quickly inspect adapter features (shader-f16, limits) and confirm cross-origin isolation requirements in one place. Handy when testing Safari 26+, Firefox 141+, or mid-tier laptops and phones.",
    to: "/capabilities",
  },
]

export function OverviewPage() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <h1>WebGPU ML Demo Suite</h1>
        <p>
          Explore production-ready browser AI building blocks: image classification, embeddings, on-device chat, ONNX Runtime IO binding, and a WebGPU capability playground. Built to accompany
          <a
            href="https://medium.com/@kulhari.anshul/webgpu-in-2025-in-browser-ai-thats-actually-useful-281bbaadaf6f"
            target="_blank"
            rel="noreferrer"
            className={styles.heroLink}
          >
            “WebGPU in 2025: In-Browser AI That’s Actually Useful.”
          </a>
        </p>
      </header>

      <section className={styles.grid}>
        {demoTiles.map((tile) => (
          <Link key={tile.to} to={tile.to} className={styles.card}>
            <h2>{tile.title}</h2>
            <p>{tile.description}</p>
            <span className={styles.cardCta}>Explore demo →</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
