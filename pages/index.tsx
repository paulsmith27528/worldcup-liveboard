import GroupTable from "../components/GroupTable";
import MatchCard from "../components/MatchCard";
import Panel from "../components/Panel";

const leftGroups = [
  { title: "GROUP A", teams: [{ name: "MEX", points: 6, flag: "🇲🇽" }, { name: "CAN", points: 5, flag: "🇨🇦" }, { name: "KOR", points: 4, flag: "🇰🇷" }, { name: "SWE", points: 3, flag: "🇸🇪" }] },
  { title: "GROUP B", teams: [{ name: "CAN", points: 4, flag: "🇨🇦" }, { name: "ITA", points: 3, flag: "🇮🇹" }, { name: "ECU", points: 3, flag: "🇪🇨" }, { name: "CRO", points: 1, flag: "🇭🇷" }] },
  { title: "GROUP C", teams: [{ name: "BRA", points: 6, flag: "🇧🇷" }, { name: "MAR", points: 3, flag: "🇲🇦" }, { name: "SCO", points: 1, flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }, { name: "HAI", points: 1, flag: "🇭🇹" }] },
  { title: "GROUP D", teams: [{ name: "USA", points: 6, flag: "🇺🇸" }, { name: "NED", points: 3, flag: "🇳🇱" }, { name: "JPN", points: 3, flag: "🇯🇵" }, { name: "GAM", points: 0, flag: "🇬🇲" }] },
  { title: "GROUP E", teams: [{ name: "GER", points: 6, flag: "🇩🇪" }, { name: "ESP", points: 3, flag: "🇪🇸" }, { name: "URU", points: 3, flag: "🇺🇾" }, { name: "TUN", points: 0, flag: "🇹🇳" }] },
  { title: "GROUP F", teams: [{ name: "COL", points: 4, flag: "🇨🇴" }, { name: "POR", points: 4, flag: "🇵🇹" }, { name: "CIV", points: 1, flag: "🇨🇮" }, { name: "KSA", points: 0, flag: "🇸🇦" }] },
];

const rightGroups = [
  { title: "GROUP G", teams: [{ name: "BEL", points: 4, flag: "🇧🇪" }, { name: "IRN", points: 4, flag: "🇮🇷" }, { name: "EGY", points: 3, flag: "🇪🇬" }, { name: "NZL", points: 0, flag: "🇳🇿" }] },
  { title: "GROUP H", teams: [{ name: "FRA", points: 6, flag: "🇫🇷" }, { name: "AUT", points: 3, flag: "🇦🇹" }, { name: "SEN", points: 3, flag: "🇸🇳" }, { name: "QAT", points: 0, flag: "🇶🇦" }] },
  { title: "GROUP I", teams: [{ name: "ARG", points: 6, flag: "🇦🇷" }, { name: "PER", points: 3, flag: "🇵🇪" }, { name: "NGA", points: 1, flag: "🇳🇬" }, { name: "ISR", points: 1, flag: "🇮🇱" }] },
  { title: "GROUP J", teams: [{ name: "ENG", points: 6, flag: "🏴" }, { name: "DEN", points: 3, flag: "🇩🇰" }, { name: "SRB", points: 1, flag: "🇷🇸" }, { name: "PAN", points: 1, flag: "🇵🇦" }] },
  { title: "GROUP K", teams: [{ name: "POR", points: 4, flag: "🇵🇹" }, { name: "UZB", points: 4, flag: "🇺🇿" }, { name: "CHI", points: 3, flag: "🇨🇱" }, { name: "GHA", points: 1, flag: "🇬🇭" }] },
  { title: "GROUP L", teams: [{ name: "CRO", points: 4, flag: "🇭🇷" }, { name: "BLR", points: 4, flag: "🇧🇾" }, { name: "ALG", points: 3, flag: "🇩🇿" }, { name: "SHN", points: 0, flag: "🇨🇳" }] },
];

const leftBracket = ["🇲🇽 MEX 2 — 1 MAR 🇲🇦", "🇨🇴 COL 3 — 2 ESP 🇪🇸", "🇨🇦 CAN 1 — 0 RSA 🇿🇦", "🇳🇱 NED 2 — 0 PER 🇵🇪", "🇩🇪 GER 2 — 1 AUT 🇦🇹", "🇫🇷 FRA 3 — 1 IRN 🇮🇷", "🇧🇷 BRA 4 — 1 JPN 🇯🇵", "🇺🇸 USA 2 — 0 BLR 🇧🇾"];
const rightBracket = ["🏴 ENG 2 — 1 POR 🇵🇹", "🇦🇷 ARG 2 — 0 DEN 🇩🇰", "🇧🇪 BEL 1 — 0 SRB 🇷🇸", "🇮🇹 ITA 2 — 1 UZB 🇺🇿", "🇭🇷 CRO 1 — 0 ITA 🇮🇹", "🇺🇾 URU 0 — 1 POR 🇵🇹", "🇵🇹 POR 3 — 1 KOR 🇰🇷", "🇪🇬 EGY 1 — 3 SEN 🇸🇳"];

export default function Home() {
  return (
    <main style={page}>
      <header style={topHeader}>
        <div style={logoBlock}>
          <div style={{ fontSize: 38 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 900 }}>FIFA</div>
            <div style={{ color: "#ffd54a", fontSize: 12 }}>WORLD CUP 2026</div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={title}>20 FIFA WORLD CUP 26</h1>
          <div style={subtitle}>UNITED STATES • CANADA • MEXICO</div>
        </div>

        <div style={liveBox}>
          <span style={liveBadge}>LIVE</span>
          <strong>12:45:30</strong>
          <span style={{ color: "#9cc7e8" }}>AUTO • EST</span>
        </div>
      </header>

      <div style={mainGrid}>
        <aside>
          <h2 style={sideTitle}>GROUP STAGE</h2>
          {leftGroups.map(group => <GroupTable key={group.title} title={group.title} teams={group.teams} />)}
        </aside>

        <section>
          <h2 style={centerTitle}>KNOCKOUT STAGE</h2>

          <Panel title="">
            <div style={bracketGrid}>
              <div style={connectorLeft}></div>
              <div style={connectorRight}></div>

              <div>{leftBracket.map(match => <BracketCard key={match} match={match} />)}</div>

              <div style={finalPanel}>
                <div style={{ fontSize: 104 }}>🏆</div>
                <h2 style={finalTitle}>FINAL</h2>
                <div style={{ color: "#9cc7e8", marginBottom: 18 }}>JULY 19, 2026 • METLIFE STADIUM</div>

                <div style={finalScoreCard}>
                  <div style={{ ...finalTeam, textAlign: "left" }}>🇧🇷 BRAZIL</div>
                  <div style={finalScore}>2 - 1</div>
                  <div style={{ ...finalTeam, textAlign: "right" }}>ARGENTINA 🇦🇷</div>
                </div>

                <div style={{ marginTop: 16, color: "#9cc7e8" }}>
                  ⚽ VINI JR. 27&apos; • RAPHINHA 72&apos;
                </div>
              </div>

              <div>{rightBracket.map(match => <BracketCard key={match} match={match} />)}</div>
            </div>
          </Panel>

          <div style={bottomGrid}>
            <MatchCard home="BRAZIL" away="ARGENTINA" homeFlag="🇧🇷" awayFlag="🇦🇷" homeScore={2} awayScore={1} />

            <Panel title="TOP SCORERS">
              <div style={{ lineHeight: 2 }}>
                <div>🇫🇷 K. Mbappé — 5</div>
                <div>🇦🇷 L. Messi — 4</div>
                <div>🇧🇷 Vini Jr. — 4</div>
                <div>🏴 H. Kane — 3</div>
              </div>
            </Panel>

            <Panel title="TOURNAMENT STATS">
              <div style={{ fontSize: 20, lineHeight: 1.8 }}>
                <div>48 Matches</div>
                <div>128 Goals</div>
                <div>2.67 Avg Goals</div>
              </div>
            </Panel>

            <Panel title="FEATURES">
              <div style={{ lineHeight: 2 }}>
                <div>▣ Live Scores</div>
                <div>▣ Team Stats</div>
                <div>▣ Fixtures</div>
                <div>▣ Standings</div>
              </div>
            </Panel>

            <Panel title="MOBILE APP PREVIEW">
              <div style={phoneRow}>
                <div style={phone}>Live<br />2 - 1</div>
                <div style={phone}>Bracket<br />Final</div>
                <div style={phone}>Groups<br />A-L</div>
              </div>
            </Panel>
          </div>
        </section>

        <aside>
          <h2 style={sideTitle}>GROUP STAGE</h2>
          {rightGroups.map(group => <GroupTable key={group.title} title={group.title} teams={group.teams} />)}
        </aside>
      </div>

      <footer style={footer}>
        <strong>DATA SOURCES</strong>
        <span>FIFA API</span>
        <span>Opta</span>
        <span>Sportradar</span>
        <span>API-FOOTBALL</span>
        <span style={sync}>● LIVE SYNC</span>
        <span>Data automatically updates every 20 seconds</span>
      </footer>
    </main>
  );
}

function BracketCard({ match }: { match: string }) {
  const parts = match.split(" — ");
  return (
    <div style={bracketCard}>
      <div>{parts[0]}</div>
      <div>{parts[1]}</div>
      <div style={{ fontSize: 10, color: "#67e8f9", marginTop: 4 }}>FT</div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top,#102f56 0%,#061322 42%,#01040a 100%)",
  color: "white",
  padding: 16,
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden" as const
};

const topHeader = {
  display: "grid",
  gridTemplateColumns: "220px 1fr 220px",
  alignItems: "center",
  border: "1px solid rgba(0,180,255,.25)",
  borderRadius: 18,
  padding: "16px 24px",
  background: "rgba(0,0,0,.45)",
  marginBottom: 16
};

const logoBlock = {
  display: "flex",
  gap: 12,
  alignItems: "center"
};

const title = {
  fontSize: 42,
  margin: 0,
  fontWeight: 900,
  letterSpacing: 3
};

const subtitle = {
  color: "#3fe0ff",
  letterSpacing: 6,
  fontSize: 13
};

const liveBox = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  alignItems: "center",
  fontSize: 13
};

const liveBadge = {
  background: "#ef4444",
  color: "white",
  borderRadius: 6,
  padding: "6px 10px",
  fontWeight: "bold"
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "250px minmax(650px, 1fr) 250px",
  gap: 14
};

const sideTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 16,
  marginBottom: 12
};

const centerTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 16,
  marginBottom: 12
};

const bracketGrid = {
  display: "grid",
  gridTemplateColumns: "115px minmax(360px, 1fr) 115px",
  gap: 14,
  alignItems: "center",
  position: "relative" as const
};

const bracketCard = {
  background: "rgba(0,0,0,.5)",
  border: "1px solid rgba(34,211,238,.28)",
  borderRadius: 12,
  padding: "10px 12px",
  marginBottom: 10,
  fontWeight: "bold",
  fontSize: 13,
  boxShadow: "0 0 18px rgba(34,211,238,.1)",
  position: "relative" as const,
  zIndex: 2
};

const finalPanel = {
  textAlign: "center" as const,
  border: "1px solid rgba(255,213,74,.38)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 0 50px rgba(255,213,74,.18)",
  position: "relative" as const,
  zIndex: 2,
  background: "radial-gradient(circle at top,rgba(255,213,74,.1),rgba(0,0,0,.35))"
};

const finalTitle = {
  fontSize: 42,
  margin: "8px 0",
  color: "#ffd54a"
};

const finalScoreCard = {
  background: "rgba(0,0,0,.65)",
  borderRadius: 20,
  padding: 20,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 14
};

const finalTeam = {
  fontSize: 20,
  fontWeight: "bold",
  whiteSpace: "nowrap" as const
};

const finalScore = {
  fontSize: 32,
  fontWeight: "bold",
  color: "#ffd54a",
  whiteSpace: "nowrap" as const
};

const connectorLeft = {
  position: "absolute" as const,
  left: "108px",
  top: "50%",
  width: "72px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(34,211,238,.15), rgba(255,213,74,.75))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1
};

const connectorRight = {
  position: "absolute" as const,
  right: "108px",
  top: "50%",
  width: "72px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(255,213,74,.75), rgba(34,211,238,.15))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.4fr",
  gap: 12,
  marginTop: 14
};

const phoneRow = {
  display: "flex",
  gap: 10
};

const phone = {
  border: "1px solid rgba(34,211,238,.25)",
  borderRadius: 14,
  padding: 12,
  minHeight: 90,
  flex: 1,
  background: "rgba(0,0,0,.35)",
  fontSize: 12,
  textAlign: "center" as const
};

const footer = {
  marginTop: 18,
  border: "1px solid rgba(0,180,255,.2)",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  gap: 24,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,.45)",
  color: "#cbd5e1"
};

const sync = {
  color: "#22c55e",
  fontWeight: "bold"
};
