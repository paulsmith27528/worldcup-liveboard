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
        border: "1px solid rgba(34,211,238,.2)",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 0 20px rgba(34,211,238,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: 22,
        }}
      >
        <div>
          {homeFlag} {home}
        </div>

        <div style={{ color: "#ffd54a" }}>
          {homeScore} - {awayScore}
        </div>

        <div>
          {awayFlag} {away}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          color: "#67e8f9",
          fontWeight: "bold",
        }}
      >
        LIVE 78'
      </div>
    </div>
  );
}
