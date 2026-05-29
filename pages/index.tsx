import GroupTable from "../components/GroupTable";
import MatchCard from "../components/MatchCard";
import Panel from "../components/Panel";

const leftGroups = [
  { title: "GROUP A", teams: [{ name: "MEX", points: 6, flag: "🇲🇽" }, { name: "CAN", points: 5, flag: "🇨🇦" }, { name: "KOR", points: 4, flag: "🇰🇷" }, { name: "SWE", points: 3, flag: "🇸🇪" }] },
  { title: "GROUP B", teams: [{ name: "ENG", points: 6, flag: "🏴" }, { name: "USA", points: 5, flag: "🇺🇸" }, { name: "MAR", points: 4, flag: "🇲🇦" }, { name: "JPN", points: 3, flag: "🇯🇵" }] },
  { title: "GROUP C", teams: [{ name: "BRA", points: 6, flag: "🇧🇷" }, { name: "GER", points: 5, flag: "🇩🇪" }, { name: "SEN", points: 4, flag: "🇸🇳" }, { name: "PER", points: 3, flag: "🇵🇪" }] },
  { title: "GROUP D", teams: [{ name: "ARG", points: 6, flag: "🇦🇷" }, { name: "FRA", points: 5, flag: "🇫🇷" }, { name: "NED", points: 4, flag: "🇳🇱" }, { name: "AUS", points: 3, flag: "🇦🇺" }] },
  { title: "GROUP E", teams: [{ name: "ESP", points: 6, flag: "🇪🇸" }, { name: "POR", points: 5, flag: "🇵🇹" }, { name: "URU", points: 4, flag: "🇺🇾" }, { name: "TUN", points: 3, flag: "🇹🇳" }] },
  { title: "GROUP F", teams: [{ name: "COL", points: 6, flag: "🇨🇴" }, { name: "ITA", points: 5, flag: "🇮🇹" }, { name: "CIV", points: 4, flag: "🇨🇮" }, { name: "KSA", points: 3, flag: "🇸🇦" }] },
];

const rightGroups = [
  { title: "GROUP G", teams: [{ name: "BEL", points: 6, flag: "🇧🇪" }, { name: "IRN", points: 5, flag: "🇮🇷" }, { name: "EGY", points: 4, flag: "🇪🇬" }, { name: "NZL", points: 3, flag: "🇳🇿" }] },
  { title: "GROUP H", teams: [{ name: "FRA", points: 6, flag: "🇫🇷" }, { name: "AUT", points: 5, flag: "🇦🇹" }, { name: "QAT", points: 4, flag: "🇶🇦" }, { name: "CHI", points: 3, flag: "🇨🇱" }] },
  { title: "GROUP I", teams: [{ name: "ARG", points: 6, flag: "🇦🇷" }, { name: "PER", points: 5, flag: "🇵🇪" }, { name: "NGA", points: 4, flag: "🇳🇬" }, { name: "ISL", points: 3, flag: "🇮🇸" }] },
  { title: "GROUP J", teams: [{ name: "ENG", points: 6, flag: "🏴" }, { name: "DEN", points: 5, flag: "🇩🇰" }, { name: "SRB", points: 4, flag: "🇷🇸" }, { name: "PAN", points: 3, flag: "🇵🇦" }] },
  { title: "GROUP K", teams: [{ name: "POR", points: 6, flag: "🇵🇹" }, { name: "UZB", points: 5, flag: "🇺🇿" }, { name: "GHA", points: 4, flag: "🇬🇭" }, { name: "SUI", points: 3, flag: "🇨🇭" }] },
  { title: "GROUP L", teams: [{ name: "CRO", points: 6, flag: "🇭🇷" }, { name: "BLR", points: 5, flag: "🇧🇾" }, { name: "ALG", points: 4, flag: "🇩🇿" }, { name: "CHN", points: 3, flag: "🇨🇳" }] },
];

const leftBracket = [
  "🇲🇽 MEX 2 — 1 MAR 🇲🇦",
  "🇨🇴 COL 3 — 2 ESP 🇪🇸",
  "🇨🇦 CAN 1 — 0 PER 🇵🇪",
  "🇩🇪 GER 2 — 1 AUT 🇦🇹",
];

const rightBracket = [
  "🏴 ENG 2 — 1 POR 🇵🇹",
  "🇦🇷 ARG 2 — 0 DEN 🇩🇰",
  "🇮🇹 ITA 2 — 1 BEL 🇧🇪",
  "🇧🇷 BRA 3 — 1 KOR 🇰🇷",
];

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top,#0d2340 0%,#07111f 45%,#02050a 100%)",
      color: "white",
      padding: 24,
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        border: "1px solid rgba(0,180,255,.2)",
        borderRadius: 28,
        padding: 24,
        background: "rgba(0,0,0,.35)"
      }}>
        <div>
          <div style={{ color: "#ffd54a", letterSpacing: 4, fontSize: 12 }}>
            FIFA WORLD CUP 2026
          </div>
          <h1 style={{ fontSize: 60, margin: 0, fontWeight: 900 }}>
            FIFA WORLD CUP 26
          </h1>
          <div style={{ marginTop: 10, color: "#3fe0ff", letterSpacing: 3 }}>
            UNITED STATES • CANADA • MEXICO
          </div>
        </div>

        <a href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00" target="_blank"
          style={{
            background: "#34dfff",
            color: "black",
            padding: "18px 34px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: 20
          }}>
          GET ACCESS
        </a>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: 24 }}>
        <aside>
          {leftGroups.map(group => (
            <GroupTable key={group.title} title={group.title} teams={group.teams} />
          ))}
        </aside>

        <section>
          <Panel title="KNOCKOUT STAGE">
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr 1fr",
              gap: 20,
              alignItems: "center"
            }}>
              <div>
                {leftBracket.map(match => (
                  <div key={match} style={{
                    background: "rgba(0,0,0,.45)",
                    border: "1px solid rgba(34,211,238,.25)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    fontWeight: "bold"
                  }}>
                    {match}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 90 }}>🏆</div>
                <h2 style={{ fontSize: 50, marginBottom: 10 }}>FINAL</h2>
                <div style={{ color: "#9cc7e8" }}>
                  JULY 19, 2026 • METLIFE STADIUM
                </div>

                <div style={{
                  marginTop: 30,
                  background: "rgba(0,0,0,.55)",
                  borderRadius: 24,
                  padding: 28,
                  boxShadow: "0 0 45px rgba(255,213,74,.15)"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    fontSize: 38,
                    fontWeight: "bold"
                  }}>
                    <div>🇧🇷 BRAZIL</div>
                    <div style={{ color: "#ffd54a" }}>2 - 1</div>
                    <div>ARGENTINA 🇦🇷</div>
                  </div>

                  <div style={{ marginTop: 20, color: "#9cc7e8" }}>
                    ⚽ VINI JR. 27&apos; • RAPHINHA 72&apos;
                  </div>
                </div>
              </div>

              <div>
                {rightBracket.map(match => (
                  <div key={match} style={{
                    background: "rgba(0,0,0,.45)",
                    border: "1px solid rgba(34,211,238,.25)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    fontWeight: "bold"
                  }}>
                    {match}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 24
          }}>
            <MatchCard
              home="BRAZIL"
              away="ARGENTINA"
              homeFlag="🇧🇷"
              awayFlag="🇦🇷"
              homeScore={2}
              awayScore={1}
            />

            <Panel title="TOP SCORERS">
              <div style={{ lineHeight: 2 }}>
                <div>K. Mbappé — 5</div>
                <div>L. Messi — 4</div>
                <div>Vini Jr. — 4</div>
                <div>H. Kane — 3</div>
              </div>
            </Panel>
          </div>
        </section>

        <aside>
          {rightGroups.map(group => (
            <GroupTable key={group.title} title={group.title} teams={group.teams} />
          ))}
        </aside>
      </div>
    </main>
  );
}
