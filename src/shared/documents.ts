import type { DocumentItem } from "./types"

export const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: "webgpu",
    title: "WebGPU arrives",
    content:
      "WebGPU now ships across Chromium, Firefox Windows, and Safari 26. It unlocks compute shaders, storage buffers, and real GPU acceleration in the browser.",
  },
  {
    id: "transformers",
    title: "Transformers.js pipelines",
    content:
      "Transformers.js provides ready-to-use pipelines for image classification, embeddings, and speech recognition with a single device flag.",
  },
  {
    id: "onnx",
    title: "ONNX Runtime Web",
    content:
      "ONNX Runtime Web offers a WebGPU execution provider complete with graph capture and IO binding to keep tensors on the GPU.",
  },
  {
    id: "webllm",
    title: "Chat with WebLLM",
    content:
      "WebLLM runs quantized LLMs entirely in the browser with an OpenAI-compatible interface and streaming responses.",
  },
  {
    id: "isolation",
    title: "Cross-origin isolation",
    content:
      "When you need WASM threads as a fallback, enable COOP/COEP headers and ensure third-party assets are CORP-compliant to unlock SharedArrayBuffer.",
  },
]
