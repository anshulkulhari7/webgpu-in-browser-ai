# WebGPU In-Browser ML Demo Suite

This project accompanies the Medium article “WebGPU in 2025: In-Browser AI That’s Actually Useful.” It provides a locally runnable React + Vite app showcasing production-ready WebGPU machine learning workflows:

- Transformers.js image classification with automatic WASM fallback
- Transformers.js embeddings with semantic search on the GPU
- WebLLM streaming chat with a small quantized model
- ONNX Runtime Web demo of graph capture + IO binding on WebGPU
- Capability playground for feature detection, adapter limits, and cross-origin isolation tips

## Prerequisites

- Node.js 20.19+ is recommended (matches Vite/WebGPU tooling requirements).
- Modern browser with WebGPU:
  - Chrome/Edge 113+
  - Firefox 141+ on Windows (enable the WebGPU toggle on other platforms)
  - Safari 26 beta / Technology Preview on macOS, iOS, iPadOS, visionOS
- Stable internet connection (models are streamed from Hugging Face and MLC-CDN).

## Getting started

```bash
npm install
npm run dev
```

The dev server injects `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers so WASM thread fallbacks (Transformers.js/ONNX Runtime) can initialize without additional configuration.

Open http://localhost:5173 and try the demos from the sidebar. Each page explains the scenario and highlights WebGPU-specific behavior or fallbacks.

## Demo guide

| Route | Focus | Key takeaways |
| --- | --- | --- |
| `/image-classifier` | Transformers.js MobileNetV4 | Toggle `device: "webgpu"` vs `"wasm"` and inspect top-5 predictions on sample/user-supplied URLs. Pipelines are disposed of when switching backends. |
| `/embeddings` | Transformers.js embeddings | Generates document embeddings on the selected backend, keeps tensors on GPU, and ranks documents via cosine similarity. |
| `/webllm` | WebLLM chat | Streams tokens from a 1B quantized model entirely in-browser. Logs init progress, supports reset, and keeps the model cached in memory. |
| `/onnx` | ONNX Runtime Web | Requests `shader-f16`, runs MobileNetV4 ONNX with `preferredOutputLocation: "gpu-buffer"`, and records latency samples. Useful for showing IO binding benefits. |
| `/capabilities` | Diagnostics | Displays adapter info, supported features, GPU limits, and cross-origin isolation status. Includes troubleshooting notes for Safari/Firefox/Chromium. |

## Notes & troubleshooting

- Cold loads for models (especially WebLLM) can take 20–40 seconds on slower connections; progress logs stream to the UI.
- If WebGPU initialization fails, the demos report context errors. Check `chrome://gpu`, ensure drivers are current, and verify WebGPU flags on Firefox/Safari.
- Serving the built app elsewhere requires the same COOP/COEP headers when enabling WASM thread fallbacks.
- Large model downloads are fetched from CDN; to pin versions or host privately, adjust the URLs in the respective demo components.

## Build

```bash
npm run build
npm run preview
```

## License

MIT
