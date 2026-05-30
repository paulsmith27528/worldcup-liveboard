type Team = {
  name: string;
  points: number;
  flag: string;
};

type Props = {
  title: string;
  teams: Team[];
};

export default function GroupTable({ title, teams }: Props) {
  return (
    <div style={box}>
      <div style={heading}>{title}</div>

      <div style={tableHead}>
        <span>TEAM</span>
        <span>P</span>
        <span>W</span>
        <span>D</span>
        <span>L</span>
        <span>GD</span>
        <span>PTS</span>
      </div>

      {teams.map((team, index) => (
        <div key={team.name} style={row}>
          <span>{index + 1}. {team.flag} {team.name}</span>
          <span>2</span>
          <span>{index < 2 ? 1 : 0}</span>
          <span>{index === 2 ? 1 : 0}</span>
          <span>{index === 3 ? 2 : 0}</span>
          <span>{index === 0 ? "+3" : index === 3 ? "-3" : "+1"}</span>
          <strong>{team.points}</strong>
        </div>
      ))}
    </div>
  );
}

const box = {
  background: "linear-gradient(180deg,rgba(4,22,43,.95),rgba(2,14,30,.95))",
  border: "1px solid rgba(34,211,238,.35)",
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  boxShadow: "0 0 22px rgba(34,211,238,.08)",
};

const heading = {
  color: "#67e8f9",
  fontWeight: "bold",
  fontSize: 15,
  marginBottom: 8,
};

const tableHead = {
  display: "grid",
  gridTemplateColumns: "1fr 20px 20px 20px 20px 28px 32px",
  gap: 4,
  color: "#7dd3fc",
  fontSize: 9,
  opacity: .8,
  marginBottom: 6,
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 20px 20px 20px 20px 28px 32px",
  gap: 4,
  alignItems: "center",
  borderTop: "1px solid rgba(255,255,255,.08)",
  padding: "7px 0",
  fontSize: 11,
};
