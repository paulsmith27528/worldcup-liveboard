import { ReactNode } from "react"

type Props = {
  title: string
  children: ReactNode
}

export default function Panel({ title, children }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#06101f,#08172b)",
        border: "1px solid rgba(0,180,255,.2)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 0 25px rgba(0,140,255,.08)"
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#3fe0ff",
          marginBottom: 20
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  )
}
