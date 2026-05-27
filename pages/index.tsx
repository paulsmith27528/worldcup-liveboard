export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0ea5e9 0%, #020617 40%, #000000 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "30px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div>
          <p
            style={{
              color: "#67e8f9",
              letterSpacing: "0.4em",
              fontSize: "12px",
              marginBottom: "10px",
            }}
          >
            FIFA WORLD CUP 2026
          </p>

          <h1
            style={{
              fontSize: "56px",
              margin: 0,
              fontWeight: 900,
            }}
          >
            LiveBoard
          </h1>
        </div>

        <a
          href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00"
          target="_blank"
          style={{
            background: "#22d3ee",
            color: "black",
            padding: "16px 28px",
            borderRadius: "999px",
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: "0 0 30px rgba(34,211,238,.6)",
          }}
        >
          Get Access — £4.99
        </a>
      </div>

      {/* Hero Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          padding: "40px",
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(34,211,238,0.2)",
            borderRadius: "30px",
            padding: "30px",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#ef4444",
              padding: "6px 14px",
              borderRadius: "999px",
              fontWeight: "bold",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            LIVE
          </div>

          <h2
            style={{
              fontSize: "42px",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Premium World Cup Dashboard
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              lineHeight: 1.8,
              fontSize: "18px",
            }}
          >
            Real-time fixtures, live scores, knockout brackets,
            standings, statistics and futuristic football visuals.
          </p>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "15px",
              marginTop: "30px",
            }}
          >
            {[
              ["Matches", "104"],
              ["Teams", "48"],
              ["Live", "12"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "rgba(34,211,238,0.08)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: "20px",
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    color: "#a5f3fc",
                    marginBottom: "10px",
                  }}
                >
                  {label}
                </p>

                <h3
                  style={{
                    fontSize: "36px",
                    margin: 0,
                  }}
                >
                  {value}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            background:
              "linear-gradient(to bottom right, rgba(250,204,21,.12), rgba(34,211,238,.12))",
            border: "1px solid rgba(250,204,21,0.2)",
            borderRadius: "30px",
            padding: "30px",
            backdropFilter: "blur(20px)",
          }}
        >
          <p
            style={{
              color: "#fde047",
              letterSpacing: "0.3em",
              fontSize: "12px",
            }}
          >
            WORLD CUP FINAL
          </p>

          <h2
            style={{
              fontSize: "52px",
              lineHeight: 1.1,
              marginTop: "20px",
            }}
          >
            Brazil 2 — 1 Argentina
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              marginTop: "20px",
              fontSize: "18px",
            }}
          >
            MetLife Stadium • New Jersey
          </p>

          {/* Match Status */}
          <div
            style={{
              marginTop: "40px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ color: "#94a3b8" }}>Minute</p>

              <h3
                style={{
                  fontSize: "54px",
                  color: "#f87171",
                  margin: 0,
                }}
              >
                78’
              </h3>
            </div>

            <div
              style={{
                width: "1px",
                height: "70px",
                background: "rgba(255,255,255,0.1)",
              }}
            />

            <div>
              <p style={{ color: "#94a3b8" }}>Status</p>

              <h3
                style={{
                  fontSize: "54px",
                  color: "#67e8f9",
                  margin: 0,
                }}
              >
                LIVE
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "20px",
          padding: "0 40px 40px",
        }}
      >
        {[
          "Group Stage",
          "Knockout Bracket",
          "Live Standings",
        ].map((item) => (
          <div
            key={item}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "30px",
              minHeight: "180px",
            }}
          >
            <h3
              style={{
                fontSize: "28px",
                marginBottom: "20px",
              }}
            >
              {item}
            </h3>

            <p
              style={{
                color: "#94a3b8",
                lineHeight: 1.7,
              }}
            >
              Advanced World Cup tournament visualisation system
              coming next.
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
