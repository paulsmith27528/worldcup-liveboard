import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function Panel({ title, children }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
