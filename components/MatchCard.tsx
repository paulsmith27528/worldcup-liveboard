type Props = {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
};

export default function MatchCard({
  home,
  away,
  homeFlag,
  awayFlag,
  homeScore,
  awayScore,
}: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#071427,#081a31)",
        border: "1px solid rgba(34,211,238,.25)",
        borderRadius: 22,
        padding: 24,
        minHeight: 150,
        boxShadow: "0 0 28px rgba(34,211,238,.12)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "#67e8f9",
          fontWeight: "bold",
          marginBottom: 18,
          fontSize: 18,
        }}
      >
        LIVE MATCH CENTER
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
          fontWeight: "bold",
        }}
      >
        <div style={{ fontSize: 22 }}>
          {homeFlag} {home}
        </div>

        <div
          style={{
            fontSize: 34,
            color: "#ffd54a",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {homeScore} - {awayScore}
        </div>

        <div style={{ fontSize: 22, textAlign: "right" }}>
          {awayFlag} {away}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          color: "#ff4d4d",
          fontWeight: "bold",
          fontSize: 18,
        }}
      >
        LIVE 78&apos;
      </div>
    </div>
  );
}
