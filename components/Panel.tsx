import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function Panel({ title, children }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(4,18,35,.95), rgba(3,10,22,.95))",
        border: "1px solid rgba(34,211,238,.25)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 0 35px rgba(34,211,238,.12)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#67e8f9" }}>{title}</h2>
      {children}
    </div>
  );
}
