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

const leftBracket = ["🇲🇽 MEX 2 — 1 MAR 🇲🇦", "🇨🇴 COL 3 — 2 ESP 🇪🇸", "🇨🇦 CAN 1 — 0 PER 🇵🇪", "🇩🇪 GER 2 — 1 AUT 🇦🇹", "🇫🇷 FRA 3 — 1 IRN 🇮🇷", "🇧🇷 BRA 4 — 1 JPN 🇯🇵"];
const rightBracket = ["🏴 ENG 2 — 1 POR 🇵🇹", "🇦🇷 ARG 2 — 0 DEN 🇩🇰", "🇮🇹 ITA 2 — 1 BEL 🇧🇪", "🇺🇾 URU 0 — 1 POR 🇵🇹", "🇵🇹 POR 2 — 0 SEN 🇸🇳", "🇰🇷 KOR 1 — 3 BRA 🇧🇷"];

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top,#0d2340 0%,#07111f 45%,#02050a 100%)",
      color: "white",
      padding: 24,
      fontFamily: "Arial, sans-serif",
      overflowX: "hidden"
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
          <div style={{ color: "#ffd54a", letterSpacing: 4, fontSize: 12 }}>FIFA WORLD CUP 2026</div>
          <h1 style={{ fontSize: 52, margin: 0, fontWeight: 900 }}>FIFA WORLD CUP 26</h1>
          <div style={{ marginTop: 10, color: "#3fe0ff", letterSpacing: 3 }}>UNITED STATES • CANADA • MEXICO</div>
        </div>

        <a href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00" target="_blank" style={{
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

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(560px, 1fr) 260px", gap: 20 }}>
        <aside>
          <h2 style={sideTitle}>GROUP STAGE</h2>
          {leftGroups.map(group => <GroupTable key={group.title} title={group.title} teams={group.teams} />)}
        </aside>

        <section>
          <h2 style={centerTitle}>KNOCKOUT STAGE</h2>

          <Panel title="">
            <div style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(300px, 1fr) 120px",
              gap: 18,
              alignItems: "center",
              position: "relative"
            }}>
              <div style={connectorLeft}></div>
              <div style={connectorRight}></div>

              <div>{leftBracket.map(match => <BracketCard key={match} match={match} />)}</div>

              <div style={{
                textAlign: "center",
                border: "1px solid rgba(255,213,74,.35)",
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 0 45px rgba(255,213,74,.15)",
                position: "relative",
                zIndex: 2
              }}>
                <div style={{ fontSize: 84 }}>🏆</div>
                <h2 style={{ fontSize: 48, margin: "10px 0", color: "#ffd54a" }}>FINAL</h2>
                <div style={{ color: "#9cc7e8", marginBottom: 22 }}>JULY 19, 2026 • METLIFE STADIUM</div>

                <div style={{
                  background: "rgba(0,0,0,.6)",
                  borderRadius: 24,
                  padding: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 18
                }}>
                  <div style={{ ...finalTeam, textAlign: "left" }}>🇧🇷 BRAZIL</div>
                  <div style={finalScore}>2 - 1</div>
                  <div style={{ ...finalTeam, textAlign: "right" }}>ARGENTINA 🇦🇷</div>
                </div>

                <div style={{ marginTop: 20, color: "#9cc7e8" }}>
                  ⚽ VINI JR. 27&apos; • RAPHINHA 72&apos;
                </div>
              </div>

              <div>{rightBracket.map(match => <BracketCard key={match} match={match} />)}</div>
            </div>
          </Panel>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 18,
            marginTop: 24
          }}>
            <MatchCard home="BRAZIL" away="ARGENTINA" homeFlag="🇧🇷" awayFlag="🇦🇷" homeScore={2} awayScore={1} />

            <Panel title="TOP SCORERS">
              <div style={{ lineHeight: 2 }}>
                <div>K. Mbappé — 5</div>
                <div>L. Messi — 4</div>
                <div>Vini Jr. — 4</div>
                <div>H. Kane — 3</div>
              </div>
            </Panel>

            <Panel title="TOURNAMENT STATS">
              <div style={{ fontSize: 20, lineHeight: 1.8 }}>
                <div>48 Matches</div>
                <div>128 Goals</div>
                <div>2.67 Avg Goals</div>
              </div>
            </Panel>
          </div>
        </section>

        <aside>
          <h2 style={sideTitle}>GROUP STAGE</h2>
          {rightGroups.map(group => <GroupTable key={group.title} title={group.title} teams={group.teams} />)}
        </aside>
      </div>
    </main>
  );
}

function BracketCard({ match }: { match: string }) {
  const parts = match.split(" — ");

  return (
    <div
      style={{
        background: "rgba(0,0,0,.45)",
        border: "1px solid rgba(34,211,238,.25)",
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 14,
        fontWeight: "bold",
        minWidth: 100,
        boxShadow: "0 0 20px rgba(34,211,238,.08)",
        position: "relative",
        zIndex: 2
      }}
    >
      <div style={{ fontSize: 15, marginBottom: 6 }}>{parts[0]}</div>
      <div style={{ fontSize: 15 }}>{parts[1]}</div>
    </div>
  );
}

const sideTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 18,
  marginBottom: 24
};

const centerTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 18,
  marginBottom: 24
};

const finalTeam = {
  fontSize: 24,
  fontWeight: "bold",
  whiteSpace: "nowrap" as const
};

const finalScore = {
  fontSize: 34,
  fontWeight: "bold",
  color: "#ffd54a",
  whiteSpace: "nowrap" as const
};

const connectorLeft = {
  position: "absolute" as const,
  left: "112px",
  top: "50%",
  width: "80px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(34,211,238,.15), rgba(255,213,74,.75))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1
};

const connectorRight = {
  position: "absolute" as const,
  right: "112px",
  top: "50%",
  width: "80px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(255,213,74,.75), rgba(34,211,238,.15))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1
};
