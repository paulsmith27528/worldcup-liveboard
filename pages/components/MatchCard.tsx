type Props = {
  home: string
  away: string
  homeFlag: string
  awayFlag: string
  homeScore: number
  awayScore: number
}

export default function MatchCard({
  home,
  away,
  homeFlag,
  awayFlag,
  homeScore,
  awayScore
}: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#071427,#081a31)",
        border: "1px solid rgba(0,180,255,.25)",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 0 20px rgba(0,140,255,.08)"
      }}
    >
      <div
        style={{
          color: "#3fe0ff",
          fontWeight: "bold",
          marginBottom: 16
        }}
      >
        LIVE MATCH
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 24,
          fontWeight: "bold"
        }}
      >
        <div>
          {homeFlag} {home}
        </div>

        <div>
          {homeScore} - {awayScore}
        </div>

        <div>
          {awayFlag} {away}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          color: "#ff4d4d",
          fontWeight: "bold"
        }}
      >
        LIVE 78'
      </div>
    </div>
  )
}
