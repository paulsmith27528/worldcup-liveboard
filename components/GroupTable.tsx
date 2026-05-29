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
    <div>
      <h3>{title}</h3>

      {teams.map((team) => (
        <div key={team.name}>
          {team.flag} {team.name} — {team.points} pts
        </div>
      ))}
    </div>
  );
}
