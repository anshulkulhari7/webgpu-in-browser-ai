import { type PropsWithChildren } from "react"
import { NavLink } from "react-router-dom"
import styles from "./Layout.module.css"

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/image-classifier", label: "Image Classifier" },
  { to: "/embeddings", label: "Embeddings Search" },
  { to: "/webllm", label: "WebLLM Chat" },
  { to: "/onnx", label: "ONNX Runtime" },
  { to: "/capabilities", label: "Capabilities" },
]

export function Layout({ children }: PropsWithChildren<unknown>) {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <span className={styles.logo}>WebGPU Labs</span>
          <p className={styles.tagline}>Browser-native ML demos for 2025</p>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.activeNavItem}` : styles.navItem
              }
              end
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <footer className={styles.footer}>
          <span>Built with React + WebGPU</span>
          <span>
            Article: <a href="https://medium.com" target="_blank" rel="noreferrer">WebGPU in 2025</a>
          </span>
        </footer>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
