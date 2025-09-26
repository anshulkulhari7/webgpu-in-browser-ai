import { useEffect, useMemo, useRef, useState } from "react"
import styles from "./WebLLMDemo.module.css"
import type { MLCEngine, ChatCompletionChunk } from "@mlc-ai/web-llm"
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm"

const DEFAULT_MODEL = "SmolLM2-1.7B-Instruct-q4f16_1-MLC"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function WebLLMDemo() {
  const [logs, setLogs] = useState<string[]>([])
  const [input, setInput] = useState("Explain WebGPU in two sentences.")
  const [messages, setMessages] = useState<Message[]>([])
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const logsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadEngine() {
      setIsLoading(true)
      try {
        const instance = await CreateMLCEngine(DEFAULT_MODEL, {
          appConfig: {
            ...prebuiltAppConfig,
            model_list: prebuiltAppConfig.model_list.filter((model) => model.model_id === DEFAULT_MODEL),
          },
          initProgressCallback(report) {
            setLogs((prev) => [...prev, `${Math.round(report.progress * 100)}% • ${report.text}`])
          },
        })

        setEngine(instance)
        setLogs((prev) => [...prev, `Loaded model ${DEFAULT_MODEL}`])
      } catch (err) {
        setLogs((prev) => [...prev, `Error loading model: ${err instanceof Error ? err.message : String(err)}`])
      } finally {
        setIsLoading(false)
      }
    }

    void loadEngine()

    return () => {
      void engine?.unload()
      setEngine(null)
    }
  }, [])

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight })
  }, [logs, isStreaming])

  const hasEngine = useMemo(() => engine !== null, [engine])

  async function runChat() {
    if (!engine) return
    setIsStreaming(true)
    const userMessage: Message = { id: uid(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])

    try {
      const completion = await engine.chat.completions.create({
        messages: [{ role: "user", content: input }],
        stream: true,
      })

      const responseChunks: string[] = []

      for await (const chunk of completion as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices?.[0]?.delta?.content ?? ""
        if (!delta) continue

        responseChunks.push(delta)
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (!last || last.role !== "assistant" || last.id.endsWith("-final")) {
            next.push({ id: uid(), role: "assistant", content: delta })
          } else {
            next[next.length - 1] = { ...last, content: last.content + delta }
          }
          return next
        })
      }

      const fullReply = responseChunks.join("")
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.role === "assistant" && !last.id.endsWith("-final")) {
          next[next.length - 1] = { ...last, id: `${last.id}-final`, content: fullReply }
        }
        return next
      })
      setLogs((prev) => [...prev, `Response tokens: ${fullReply.length}`])
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : String(err)}`])
    } finally {
      setIsStreaming(false)
    }
  }

  function resetConversation() {
    setMessages([])
    setLogs([
      `Reset conversation. Model ${DEFAULT_MODEL} stays in memory.`,
      ...logs.filter((line) => line.startsWith("Loaded")),
    ])
  }

  return (
    <div className={styles.wrapper}>
      <header>
        <h1>WebLLM Chat Demo</h1>
        <p>
          Loads a quantized model and runs chat completions entirely in-browser. This demo streams tokens as they arrive to highlight how WebGPU keeps the loop on-device.
        </p>
      </header>

      <section className={styles.controls}>
        <div>
          <label>Prompt</label>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={4} />
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => void runChat()} disabled={!hasEngine || isLoading || isStreaming}>
            {isStreaming ? "Streaming..." : "Send"}
          </button>
          <button type="button" onClick={resetConversation} disabled={isStreaming}>
            Reset
          </button>
        </div>
      </section>

      <section className={styles.chatPane}>
        <h2>Conversation</h2>
        <div className={styles.messages}>
          {messages.map((message) => (
            <article key={message.id} data-role={message.role}>
              <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
              <p>{message.content}</p>
            </article>
          ))}
          {!messages.length && <p className={styles.placeholder}>Send a prompt to start the conversation.</p>}
        </div>
      </section>

      <section className={styles.logPane}>
        <h2>Load & runtime logs</h2>
        <div className={styles.logStream} ref={logsRef}>
          {logs.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </section>
    </div>
  )
}


