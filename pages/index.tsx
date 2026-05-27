export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "black",
      color: "white",
      padding: "40px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: "48px", color: "#22d3ee" }}>
        World Cup LiveBoard 2026
      </h1>

      <p style={{ fontSize: "20px" }}>
        Premium live dashboard is working.
      </p>

      <a
        href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00"
        style={{
          display: "inline-block",
          marginTop: "30px",
          padding: "16px 28px",
          background: "#22d3ee",
          color: "black",
          borderRadius: "999px",
          fontWeight: "bold",
          textDecoration: "none"
        }}
      >
        Get Access — £4.99
      </a>
    </main>
  );
}
