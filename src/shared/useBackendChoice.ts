import { useMemo, useState } from "react"

type BackendOption = {
  value: "webgpu" | "wasm"
  label: string
  disabled?: boolean
}

function detectWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator
}

export function useBackendChoice() {
  const hasWebGPU = useMemo(() => detectWebGPU(), [])
  const [backend, setBackend] = useState<"webgpu" | "wasm">(hasWebGPU ? "webgpu" : "wasm")

  const backendOptions: BackendOption[] = useMemo(
    () => [
      { value: "webgpu", label: hasWebGPU ? "WebGPU" : "WebGPU (unavailable)", disabled: !hasWebGPU },
      { value: "wasm", label: "WASM fallback" },
    ],
    [hasWebGPU],
  )

  return { backend, setBackend, backendOptions, hasWebGPU }
}
