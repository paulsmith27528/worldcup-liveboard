import GroupTable from "../components/GroupTable";
import MatchCard from "../components/MatchCard";
import Panel from "../components/Panel";

const leftGroups = [
  { title: "GROUP A", teams: [{ name: "MEX", points: 6, flag: "🇲🇽" }, { name: "CAN", points: 5, flag: "🇨🇦" }, { name: "KOR", points: 4, flag: "🇰🇷" }, { name: "SWE", points: 3, flag: "🇸🇪" }] },
  { title: "GROUP B", teams: [{ name: "CAN", points: 4, flag: "🇨🇦" }, { name: "ITA", points: 3, flag: "🇮🇹" }, { name: "ECU", points: 3, flag: "🇪🇨" }, { name: "CRO", points: 1, flag: "🇭🇷" }] },
  { title: "GROUP C", teams: [{ name: "BRA", points: 6, flag: "🇧🇷" }, { name: "MAR", points: 3, flag: "🇲🇦" }, { name: "SCO", points: 1, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name: "HAI", points: 1, flag: "🇭🇹" }] },
  { title: "GROUP D", teams: [{ name: "USA", points: 6, flag: "🇺🇸" }, { name: "NED", points: 3, flag: "🇳🇱" }, { name: "JPN", points: 3, flag: "🇯🇵" }, { name: "GAM", points: 0, flag: "🇬🇲" }] },
  { title: "GROUP E", teams: [{ name: "GER", points: 6, flag: "🇩🇪" }, { name: "ESP", points: 3, flag: "🇪🇸" }, { name: "URU", points: 3, flag: "🇺🇾" }, { name: "TUN", points: 0, flag: "🇹🇳" }] },
  { title: "GROUP F", teams: [{ name: "COL", points: 4, flag: "🇨🇴" }, { name: "POR", points: 4, flag: "🇵🇹" }, { name: "CIV", points: 1, flag: "🇨🇮" }, { name: "KSA", points: 0, flag: "🇸🇦" }] },
];

const rightGroups = [
  { title: "GROUP G", teams: [{ name: "BEL", points: 4, flag: "🇧🇪" }, { name: "IRN", points: 4, flag: "🇮🇷" }, { name: "EGY", points: 3, flag: "🇪🇬" }, { name: "NZL", points: 0, flag: "🇳🇿" }] },
  { title: "GROUP H", teams: [{ name: "FRA", points: 6, flag: "🇫🇷" }, { name: "AUT", points: 3, flag: "🇦🇹" }, { name: "SEN", points: 3, flag: "🇸🇳" }, { name: "QAT", points: 0, flag: "🇶🇦" }] },
  { title: "GROUP I", teams: [{ name: "ARG", points: 6, flag: "🇦🇷" }, { name: "PER", points: 3, flag: "🇵🇪" }, { name: "NGA", points: 1, flag: "🇳🇬" }, { name: "ISR", points: 1, flag: "🇮🇱" }] },
  { title: "GROUP J", teams: [{ name: "ENG", points: 6, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name: "DEN", points: 3, flag: "🇩🇰" }, { name: "SRB", points: 1, flag: "🇷🇸" }, { name: "PAN", points: 1, flag: "🇵🇦" }] },
  { title: "GROUP K", teams: [{ name: "POR", points: 4, flag: "🇵🇹" }, { name: "UZB", points: 4, flag: "🇺🇿" }, { name: "CHI", points: 3, flag: "🇨🇱" }, { name: "GHA", points: 1, flag: "🇬🇭" }] },
  { title: "GROUP L", teams: [{ name: "CRO", points: 4, flag: "🇭🇷" }, { name: "BLR", points: 4, flag: "🇧🇾" }, { name: "ALG", points: 3, flag: "🇩🇿" }, { name: "SHN", points: 0, flag: "🇨🇳" }] },
];

const leftBracket = [
  ["🇲🇽 MEX", "2", "🇲🇦 MAR", "1"],
  ["🇨🇴 COL", "3", "🇪🇸 ESP", "2"],
  ["🇨🇦 CAN", "1", "🇿🇦 RSA", "0"],
  ["🇳🇱 NED", "2", "🇵🇪 PER", "0"],
  ["🇩🇪 GER", "2", "🇦🇹 AUT", "1"],
  ["🇫🇷 FRA", "3", "🇮🇷 IRN", "1"],
  ["🇧🇷 BRA", "4", "🇯🇵 JPN", "1"],
  ["🇺🇸 USA", "2", "🇧🇾 BLR", "0"],

  ["🇲🇽 MEX", "1", "🇨🇴 COL", "2"],
  ["🇨🇦 CAN", "0", "🇳🇱 NED", "1"],
  ["🇩🇪 GER", "2", "🇫🇷 FRA", "3"],
  ["🇧🇷 BRA", "3", "🇺🇸 USA", "1"],

  ["🇨🇴 COL", "1", "🇳🇱 NED", "2"],
  ["🇫🇷 FRA", "1", "🇧🇷 BRA", "2"],

  ["🇳🇱 NED", "0", "🇧🇷 BRA", "2"],
];

const rightBracket = [
  ["🏴 ENG", "2", "🇵🇹 POR", "1"],
  ["🇦🇷 ARG", "2", "🇩🇰 DEN", "0"],
  ["🇧🇪 BEL", "1", "🇷🇸 SRB", "0"],
  ["🇮🇹 ITA", "2", "🇺🇿 UZB", "1"],
  ["🇭🇷 CRO", "1", "🇮🇹 ITA", "0"],
  ["🇺🇾 URU", "0", "🇵🇹 POR", "1"],
  ["🇵🇹 POR", "3", "🇰🇷 KOR", "1"],
  ["🇪🇬 EGY", "1", "🇸🇳 SEN", "3"],

  ["🏴 ENG", "2", "🇦🇷 ARG", "3"],
  ["🇧🇪 BEL", "1", "🇮🇹 ITA", "2"],
  ["🇵🇹 POR", "2", "🇭🇷 CRO", "1"],
  ["🇸🇳 SEN", "1", "🇵🇹 POR", "2"],

  ["🇦🇷 ARG", "2", "🇮🇹 ITA", "0"],
  ["🇵🇹 POR", "1", "🇵🇹 POR", "0"],

  ["🇦🇷 ARG", "2", "🇵🇹 POR", "1"],
];

export default function Home() {
  return (

      <main style={page}>
        <header style={topHeader}>
          <div style={logoBlock}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>FIFA</div>
            <div style={{ color: "#ffd54a", fontSize: 12 }}>WORLD CUP 2026</div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={title}>FIFA WORLD CUP 2026</h1>
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
          {leftGroups.map((group) => (
            <GroupTable key={group.title} title={group.title} teams={group.teams} />
          ))}
        </aside>

        <section>
          <h2 style={centerTitle}>KNOCKOUT STAGE</h2>

          <div style={bracketShell}>
            <div style={roundLabels}>
              <span>ROUND OF 32</span>
              <span>FINAL</span>
              <span>ROUND OF 32</span>
            </div>

            <div style={bracketGrid}>
  <BracketLines />

  <div style={connectorLeft}></div>
  <div style={connectorRight}></div>

              <div>
                {leftBracket.map((match, index) => (
                  <BracketCard key={index} match={match} />
                ))}
              </div>

              <div style={finalPanel}>
                <img
  src="/world-cup-trophy.png"
  alt="FIFA World Cup Trophy"
  style={{
    width: "360px",
    height: "auto",
    marginBottom: "10px",
    filter: "drop-shadow(0 0 25px rgba(255,215,0,.8))",
  }}
/>
                <h2 style={finalTitle}>FINAL</h2>
                <div style={finalMeta}>JULY 19, 2026 • METLIFE STADIUM • NEW JERSEY</div>

                <div style={finalScoreCard}>
                  <div style={{ ...finalTeam, textAlign: "left" }}>🇧🇷 BRAZIL</div>
                  <div style={finalScore}>2 - 1</div>
                  <div style={{ ...finalTeam, textAlign: "right" }}>ARGENTINA 🇦🇷</div>
                </div>

                <div style={scorers}>⚽ VINI JR. 27&apos; • RAPHINHA 72&apos; • M. ALVAREZ 45+1&apos;</div>

                <div style={thirdPlace}>
                  THIRD PLACE PLAYOFF<br />
                  🇵🇹 PORTUGAL 2 - 1 URUGUAY 🇺🇾
                </div>
              </div>

              <div>
                {rightBracket.map((match, index) => (
                  <BracketCard key={index} match={match} />
                ))}
              </div>
            </div>
          </div>

          <div style={bottomGrid}>
            <MatchCard home="BRAZIL" away="ARGENTINA" homeFlag="🇧🇷" awayFlag="🇦🇷" homeScore={2} awayScore={1} />

            <Panel title="TOP SCORERS">
              <div style={{ lineHeight: 1.8 }}>
                <div>1. 🇫🇷 K. Mbappé — 5</div>
                <div>2. 🇦🇷 L. Messi — 4</div>
                <div>3. 🇧🇷 Vini Jr. — 4</div>
                <div>4. 🏴 H. Kane — 3</div>
                <div>5. 🇦🇷 M. Alvarez — 3</div>
              </div>
            </Panel>

            <Panel title="TOURNAMENT STATS">
              <div style={statsGrid}>
                <strong>48</strong><span>Matches</span>
                <strong>128</strong><span>Goals</span>
                <strong>2.67</strong><span>Avg Goals</span>
              </div>
            </Panel>
          </div>

          <div style={wideBottomGrid}>
            <Panel title="FEATURES">
              <div style={featuresGrid}>
                <span>▣ Live Scores</span>
                <span>▣ Team Stats</span>
                <span>▣ Fixtures</span>
                <span>▣ Standings</span>
                <span>▣ Player Stats</span>
                <span>▣ News</span>
              </div>
            </Panel>

            <Panel title="MOBILE APP PREVIEW">
              <div style={phoneRow}>
                <div style={phone}>Home<br /><b>2 - 1</b></div>
                <div style={phone}>Bracket<br /><b>FINAL</b></div>
                <div style={phone}>Groups<br /><b>A-L</b></div>
                <div style={phone}>Brazil<br /><b>Rank 1</b></div>
              </div>
            </Panel>
          </div>
        </section>

        <aside>
          <h2 style={sideTitle}>GROUP STAGE</h2>
          {rightGroups.map((group) => (
            <GroupTable key={group.title} title={group.title} teams={group.teams} />
          ))}
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

function BracketLines() {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
      viewBox="0 0 1000 620"
      preserveAspectRatio="none"
    >
      <path d="M150 80 H250 V190 H330" style={lineStyle} />
      <path d="M150 190 H250 V190 H330" style={lineStyle} />
      <path d="M150 300 H250 V260 H330" style={lineStyle} />
      <path d="M150 410 H250 V260 H330" style={lineStyle} />

      <path d="M850 80 H750 V190 H670" style={lineStyle} />
      <path d="M850 190 H750 V190 H670" style={lineStyle} />
      <path d="M850 300 H750 V260 H670" style={lineStyle} />
      <path d="M850 410 H750 V260 H670" style={lineStyle} />

      <path d="M330 225 H430" style={goldLineStyle} />
      <path d="M670 225 H570" style={goldLineStyle} />
    </svg>
  );
}
function BracketCard({ match }: { match: string[] }) {
  return (
    <div style={bracketCard}>
      <div style={bracketRow}>
        <span>{match[0]}</span>
        <strong>{match[1]}</strong>
      </div>
      <div style={bracketRow}>
        <span>{match[2]}</span>
        <strong>{match[3]}</strong>
      </div>
      <div style={statusTag}>FT</div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top,#102f56 0%,#061322 42%,#01040a 100%)",
  color: "white",
  padding: 14,
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden" as const,
};

const topHeader = {
  display: "grid",
  gridTemplateColumns: "220px 1fr 220px",
  alignItems: "center",
  border: "1px solid rgba(0,180,255,.28)",
  borderRadius: 18,
  padding: "14px 22px",
  background: "rgba(0,0,0,.52)",
  marginBottom: 14,
  boxShadow: "0 0 35px rgba(34,211,238,.08)",
};

const logoBlock = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const title = {
  fontSize: 42,
  margin: 0,
  fontWeight: 900,
  letterSpacing: 4,
};

const subtitle = {
  color: "#3fe0ff",
  letterSpacing: 6,
  fontSize: 12,
};

const liveBox = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  alignItems: "center",
  fontSize: 13,
};

const liveBadge = {
  background: "#ef4444",
  color: "white",
  borderRadius: 6,
  padding: "6px 10px",
  fontWeight: "bold",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "210px minmax(820px, 1fr) 210px",
  gap: 12,
};

const sideTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 15,
  marginBottom: 10,
};

const centerTitle = {
  color: "#38dfff",
  textAlign: "center" as const,
  letterSpacing: 4,
  fontSize: 15,
  marginBottom: 10,
};

const bracketShell = {
  border: "1px solid rgba(34,211,238,.22)",
  borderRadius: 18,
  padding: 14,
  background: "linear-gradient(180deg,rgba(3,14,27,.82),rgba(1,8,18,.88))",
  boxShadow: "0 0 35px rgba(34,211,238,.1)",
};

const roundLabels = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  color: "#9cc7e8",
  fontSize: 10,
  letterSpacing: 2,
  marginBottom: 8,
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
};

const bracketGrid = {
  display: "grid",
  gridTemplateColumns: "170px minmax(500px,1fr) 170px",
  gap: 12,
  alignItems: "center",
  position: "relative" as const,
};

const bracketCard = {
  background: "rgba(0,0,0,.55)",
  border: "1px solid rgba(34,211,238,.32)",
  borderRadius: 10,
  padding: "6px 8px",
  marginBottom: 6,
  fontWeight: "bold",
  fontSize: 10,
  boxShadow: "0 0 18px rgba(34,211,238,.12)",
  position: "relative" as const,
  zIndex: 2,
};

const bracketRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const statusTag = {
  color: "#67e8f9",
  fontSize: 9,
  marginTop: 3,
};

const finalPanel = {
  textAlign: "center" as const,
  border: "1px solid rgba(255,213,74,.38)",
  borderRadius: 24,
  padding: 40,
  boxShadow: "0 0 55px rgba(255,213,74,.18)",
  position: "relative" as const,
  zIndex: 2,
  background: "radial-gradient(circle at top,rgba(255,213,74,.12),rgba(0,0,0,.38))",
};

const finalTitle = {
  fontSize: 40,
  margin: "6px 0",
  color: "#ffd54a",
};

const finalMeta = {
  color: "#9cc7e8",
  marginBottom: 16,
  fontSize: 12,
};

const finalScoreCard = {
  background: "rgba(0,0,0,.7)",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 14,
};

const finalTeam = {
  fontSize: 18,
  fontWeight: "bold",
  whiteSpace: "nowrap" as const,
};

const finalScore = {
  fontSize: 32,
  fontWeight: "bold",
  color: "#ffd54a",
  whiteSpace: "nowrap" as const,
};

const scorers = {
  marginTop: 14,
  color: "#9cc7e8",
  fontSize: 12,
};

const thirdPlace = {
  marginTop: 14,
  padding: 10,
  border: "1px solid rgba(255,213,74,.25)",
  borderRadius: 12,
  fontSize: 11,
  color: "#cbd5e1",
};

const connectorLeft = {
  position: "absolute" as const,
  left: "112px",
  top: "50%",
  width: "84px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(34,211,238,.15), rgba(255,213,74,.75))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1,
};

const connectorRight = {
  position: "absolute" as const,
  right: "112px",
  top: "50%",
  width: "84px",
  height: "2px",
  background: "linear-gradient(90deg, rgba(255,213,74,.75), rgba(34,211,238,.15))",
  boxShadow: "0 0 14px rgba(34,211,238,.5)",
  zIndex: 1,
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr",
  gap: 12,
  marginTop: 12,
};

const wideBottomGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1.8fr",
  gap: 12,
  marginTop: 12,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 8,
  fontSize: 16,
};

const featuresGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  lineHeight: 1.4,
};

const phoneRow = {
  display: "flex",
  gap: 10,
};

const phone = {
  border: "1px solid rgba(34,211,238,.25)",
  borderRadius: 14,
  padding: 12,
  minHeight: 90,
  flex: 1,
  background: "rgba(0,0,0,.35)",
  fontSize: 12,
  textAlign: "center" as const,
};

const footer = {
  marginTop: 14,
  border: "1px solid rgba(0,180,255,.2)",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  gap: 24,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,.48)",
  color: "#cbd5e1",
  fontSize: 13,
};

const sync = {
  color: "#22c55e",
  fontWeight: "bold",
};
const lineStyle = {
  fill: "none",
  stroke: "rgba(56,223,255,.55)",
  strokeWidth: 2,
  filter: "drop-shadow(0 0 6px rgba(56,223,255,.8))",
};

const goldLineStyle = {
  fill: "none",
  stroke: "rgba(255,213,74,.8)",
  strokeWidth: 2,
  filter: "drop-shadow(0 0 8px rgba(255,213,74,.8))",
};
const trophyWrap = {
  position: "relative" as const,
  display: "flex",
  justifyContent: "center",
  marginBottom: 4,
};

const trophyGlow = {
  position: "absolute" as const,
  width: 190,
  height: 190,
  borderRadius: "50%",
  background: "radial-gradient(circle,rgba(255,213,74,.42),transparent 65%)",
  filter: "blur(12px)",
};
