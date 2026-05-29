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
    <div>
      <strong>
        {homeFlag} {home} {homeScore} - {awayScore} {awayFlag} {away}
      </strong>
      <div>LIVE 78&apos;</div>
    </div>
  );
}
