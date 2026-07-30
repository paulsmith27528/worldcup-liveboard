import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// TEMPORARY route — generates a render of the pick screen for the landing
// page carousel, matching the real page's actual colours/layout, since
// Browser-pane screenshots can't be exported as files in this environment.
// Delete this route once the image has been captured and saved.

const BG = '#020810';
const GOLD = '#ffd54a';
const RED = '#ef4444';
const LINE = 'rgba(255,255,255,.10)';
const DIM = '#5b6b85';

const teams: [string, string][] = [
  ['Man Utd', '#DA291C'],
  ['Newcastle', '#241F20'],
  ['Bournemouth', '#B50E12'],
  ['Fulham', '#000000'],
  ['Liverpool', '#C8102E'],
  ['Arsenal', '#EF0107'],
  ['Everton', '#003399'],
  ['Spurs', '#132257'],
  ['Chelsea', '#034694'],
  ['Man City', '#6CABDD'],
  ['Brighton', '#0057B8'],
  ['Palace', '#1B458F'],
];

const selectedIndex = 5; // Arsenal

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '960px',
          height: '1120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: BG,
          fontFamily: 'Arial',
          padding: '44px 46px',
        }}
      >
        <div style={{ display: 'flex', fontSize: '17px', fontWeight: 800, letterSpacing: '3px', color: RED }}>
          ☠ LAST MAN STANDING · PREMIER LEAGUE
        </div>
        <div style={{ display: 'flex', fontSize: '34px', fontWeight: 900, color: '#fff', marginTop: '10px' }}>Office Last Man Standing</div>
        <div style={{ display: 'flex', fontSize: '19px', color: DIM, marginTop: '8px', marginBottom: '30px' }}>Gameweek 6 — make your pick</div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            borderRadius: '18px',
            padding: '22px 24px',
            marginBottom: '28px',
            backgroundColor: '#04101f',
            border: `1px solid rgba(239,68,68,.35)`,
          }}
        >
          <div style={{ display: 'flex', fontSize: '15px', fontWeight: 800, letterSpacing: '2px', color: RED, marginBottom: '8px' }}>
            ⏱ PICKS LOCK AT FIRST KICKOFF
          </div>
          <div style={{ display: 'flex', fontSize: '24px', fontWeight: 900, color: '#fff' }}>Sat 4 Oct · 15:00</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', width: '100%', marginBottom: '26px' }}>
          {teams.map(([name, color], i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '208px',
                height: '128px',
                borderRadius: '16px',
                gap: '10px',
                backgroundColor: i === selectedIndex ? 'rgba(255,213,74,.12)' : 'rgba(255,255,255,.03)',
                border: i === selectedIndex ? `2px solid ${GOLD}` : `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                }}
              >
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', fontSize: '15px', fontWeight: 700, color: i === selectedIndex ? GOLD : '#fff' }}>{name}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            width: '100%',
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255,213,74,.05)',
            border: `1px solid rgba(255,213,74,.25)`,
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: `2px solid ${GOLD}`,
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', fontSize: '17px', fontWeight: 800, color: GOLD }}>🛡️ Play my joker on this pick</div>
            <div style={{ display: 'flex', fontSize: '14px', color: DIM, lineHeight: 1.5, maxWidth: '760px' }}>
              No confidence in this one? Play your joker as insurance — used up the moment you play it, win or lose.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            padding: '22px',
            borderRadius: '14px',
            backgroundColor: GOLD,
            color: '#1a1200',
            fontSize: '20px',
            fontWeight: 900,
            justifyContent: 'center',
          }}
        >
          Confirm Pick — Arsenal
        </div>
      </div>
    ),
    {
      width: 960,
      height: 1120,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
