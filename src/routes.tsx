import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { OverviewPage } from "./sections/OverviewPage"
import { ImageClassifierDemo } from "./sections/ImageClassifierDemo"
import { EmbeddingsDemo } from "./sections/EmbeddingsDemo"
import { WebLLMDemo } from "./sections/WebLLMDemo"
import { OnnxRuntimeDemo } from "./sections/OnnxRuntimeDemo"
import { CapabilityPlayground } from "./sections/CapabilityPlayground"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "image-classifier", element: <ImageClassifierDemo /> },
      { path: "embeddings", element: <EmbeddingsDemo /> },
      { path: "webllm", element: <WebLLMDemo /> },
      { path: "onnx", element: <OnnxRuntimeDemo /> },
      { path: "capabilities", element: <CapabilityPlayground /> },
    ],
  },
])
