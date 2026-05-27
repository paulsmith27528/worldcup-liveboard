type Team = {
  name: string
  points: number
  flag: string
}

type Props = {
  title: string
  teams: Team[]
}

export default function GroupTable({ title, teams }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#071427,#081a31)",
        border: "1px solid rgba(0,180,255,.25)",
        borderRadius: 24,
        padding: 18,
        marginBottom: 20,
        boxShadow: "0 0 25px rgba(0,140,255,.08)"
      }}
    >
      <h3
        style={{
          color: "#3fe0ff",
          marginTop: 0,
          marginBottom: 16,
          fontSize: 22
        }}
      >
        {title}
      </h3>

      {teams.map((team, index) => (
        <div
          key={team.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom:
              index !== teams.length - 1
                ? "1px solid rgba(255,255,255,.08)"
                : "none"
          }}
        >
          <span>
            {index + 1}. {team.flag} {team.name}
          </span>

          <strong>{team.points} pts</strong>
        </div>
      ))}
    </div>
  )
}
