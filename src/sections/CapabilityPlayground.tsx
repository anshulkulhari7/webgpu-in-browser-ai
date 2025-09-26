import { useEffect, useState } from "react"
import styles from "./CapabilityPlayground.module.css"

type AdapterInfoSubset = {
  name?: string
  vendor?: string
  architecture?: string
  description?: string
}

type AdapterDetails = AdapterInfoSubset & {
  limits: GPUSupportedLimits
  features: string[]
}

export function CapabilityPlayground() {
  const [adapterDetails, setAdapterDetails] = useState<AdapterDetails | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isIsolated, setIsIsolated] = useState(false)

  useEffect(() => {
    setIsIsolated(window.crossOriginIsolated === true)

    async function detect() {
      if (!("gpu" in navigator)) {
        setErrors((prev) => [...prev, "navigator.gpu is missing. WebGPU not available in this context."])
        return
      }

      try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
          setErrors((prev) => [...prev, "navigator.gpu.requestAdapter() returned null. Check chrome://flags/#enable-unsafe-webgpu."])
          return
        }

        const requestAdapterInfo = (adapter as { requestAdapterInfo?: () => Promise<GPUAdapterInfo> })
          .requestAdapterInfo
        const info = requestAdapterInfo ? await requestAdapterInfo() : undefined
        const basicInfo: AdapterInfoSubset = {
          name: (info as AdapterInfoSubset | undefined)?.name,
          vendor: (info as AdapterInfoSubset | undefined)?.vendor,
          architecture: (info as AdapterInfoSubset | undefined)?.architecture,
          description: (info as AdapterInfoSubset | undefined)?.description,
        }
        const limits = adapter.limits
        const features = Array.from(adapter.features.values())
        setAdapterDetails({
          ...basicInfo,
          limits,
          features,
        })
      } catch (error) {
        setErrors((prev) => [...prev, error instanceof Error ? error.message : String(error)])
      }
    }

    void detect()
  }, [])

  return (
    <div className={styles.wrapper}>
      <header>
        <h1>WebGPU Capability Playground</h1>
        <p>
          Inspect WebGPU availability, shader-f16 support, adapter limits, and cross-origin isolation status. Use
          this page to debug slow fallbacks or missing GPU acceleration in production builds.
        </p>
      </header>

      <section className={styles.card}>
        <h2>Context status</h2>
        <ul>
          <li>
            navigator.gpu: <strong>{"gpu" in navigator ? "present" : "missing"}</strong>
          </li>
          <li>
            crossOriginIsolated: <strong>{isIsolated ? "true" : "false"}</strong> (required for WASM threads)
          </li>
        </ul>
        {!isIsolated && (
          <p className={styles.tip}>
            Serve with COOP/COEP headers to unlock SharedArrayBuffer and WASM thread backends.
          </p>
        )}
      </section>

      <section className={styles.card}>
        <h2>Adapter features</h2>
        {adapterDetails ? (
          <div>
            <p>
              {adapterDetails.description ?? adapterDetails.name ?? "Unknown adapter"} — vendor {adapterDetails.vendor ?? "N/A"},
              architecture {adapterDetails.architecture ?? "N/A"}
            </p>
            <h3>Supported features</h3>
            <ul className={styles.pillList}>
              {adapterDetails.features.length === 0 ? (
                <li>No optional features reported.</li>
              ) : (
                adapterDetails.features.map((feature) => <li key={feature}>{feature}</li>)
              )}
            </ul>
          </div>
        ) : (
          <p>Waiting for adapter info...</p>
        )}
      </section>

      <section className={styles.card}>
        <h2>Key limits</h2>
        {adapterDetails?.limits ? (
          <table className={styles.limitsTable}>
            <tbody>
              <tr>
                <th>maxComputeWorkgroupSizeX</th>
                <td>{adapterDetails.limits.maxComputeWorkgroupSizeX}</td>
              </tr>
              <tr>
                <th>maxComputeWorkgroupSizeY</th>
                <td>{adapterDetails.limits.maxComputeWorkgroupSizeY}</td>
              </tr>
              <tr>
                <th>maxComputeWorkgroupSizeZ</th>
                <td>{adapterDetails.limits.maxComputeWorkgroupSizeZ}</td>
              </tr>
              <tr>
                <th>maxComputeWorkgroupStorageSize</th>
                <td>{adapterDetails.limits.maxComputeWorkgroupStorageSize}</td>
              </tr>
              <tr>
                <th>maxStorageBufferBindingSize</th>
                <td>{Number(adapterDetails.limits.maxStorageBufferBindingSize).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Limits unavailable.</p>
        )}
      </section>

      <section className={styles.card}>
        <h2>Common troubleshooting tips</h2>
        <ul className={styles.tipList}>
          <li>Use chrome://gpu to confirm WebGPU status and blocked-list entries.</li>
          <li>Safari: ensure you are on Safari 26+ (or Technology Preview with WebGPU enabled).</li>
          <li>Firefox: Windows support ships in 141, enable the WebGPU pref on other platforms.</li>
          <li>
            Asset budgets matter: quantize models and lazy-load weights to stay under browser memory limits.
          </li>
        </ul>
      </section>

      {errors.length > 0 && (
        <section className={styles.errorCard}>
          <h2>Errors</h2>
          <ul>
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}


