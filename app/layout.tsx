import "./globals.css";

export const metadata = {
  title: "World Cup LiveBoard 2026",
  description: "Turn your TV into a live World Cup command centre.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
