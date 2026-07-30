import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// TEMPORARY route — generates a realistic render of the Arena page (using
// its actual colour tokens and layout) for the landing page carousel, since
// no real pool has a graded mid-season history yet and the page is Pro-gated.
// Delete this route once the image has been captured and saved.

const NAVY_DEEP = '#081120';
const NAVY = '#0E1B33';
const NAVY_ELEVATED = '#152341';
const NAVY_LINE = '#25365C';
const GOLD = '#D8B24C';
const GOLD_BRIGHT = '#F3D27A';
const TEXT = '#EEF1F8';
const MUTED = '#7186AC';
const ELIMINATED = '#26314A';
const ELIMINATED_TEXT = '#4B5A7A';

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// [name, alive, jokerUsed]
const rungs: [string, boolean, boolean][][] = [
  [['Jamie', true, false], ['Priya', true, false], ['Sam', true, false], ['Alex', true, false], ['Chloe', true, false], ['Dan', true, false], ['Meg', true, false], ['Ollie', true, false], ['Rhys', true, false], ['Nadia', true, false], ['Tom', true, false], ['Bea', true, false]],
  [['Jamie', true, false], ['Priya', true, false], ['Sam', true, false], ['Alex', false, false], ['Chloe', true, false], ['Dan', true, false], ['Meg', true, false], ['Ollie', true, false], ['Rhys', true, false], ['Nadia', true, false], ['Tom', true, false], ['Bea', false, false]],
  [['Jamie', true, false], ['Priya', true, true], ['Sam', false, false], ['Chloe', true, false], ['Dan', true, false], ['Meg', false, false], ['Ollie', true, false], ['Rhys', true, false], ['Nadia', true, false], ['Tom', false, false]],
  [['Jamie', true, false], ['Priya', true, true], ['Chloe', true, false], ['Dan', false, false], ['Ollie', true, false], ['Rhys', true, false], ['Nadia', false, false]],
  [['Jamie', true, false], ['Priya', true, true], ['Chloe', true, false], ['Ollie', false, false], ['Rhys', true, false]],
];

function Avatar({ name, alive, jokerUsed, you }: { name: string; alive: boolean; jokerUsed: boolean; you?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        fontWeight: 700,
        fontSize: '16px',
        backgroundColor: alive ? NAVY_ELEVATED : ELIMINATED,
        color: alive ? GOLD_BRIGHT : ELIMINATED_TEXT,
        border: you ? `3px solid ${GOLD_BRIGHT}` : `2px solid ${alive ? GOLD : 'transparent'}`,
        opacity: alive ? 1 : 0.55,
      }}
    >
      {initials(name)}
    </div>
  );
}

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '960px',
          height: '1120px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: NAVY_DEEP,
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(216,178,76,0.14), rgba(216,178,76,0) 55%)`,
          fontFamily: 'Arial',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '34px 40px 24px',
            borderBottom: `1px solid ${NAVY_LINE}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: '26px', fontWeight: 800, letterSpacing: '2px', color: GOLD_BRIGHT }}>THE ARENA</div>
            <div style={{ display: 'flex', fontSize: '17px', color: MUTED, fontWeight: 600, marginTop: '4px' }}>Premier League · LMS</div>
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: NAVY_DEEP, backgroundColor: GOLD, padding: '10px 20px', borderRadius: '30px', fontWeight: 800 }}>
            GW 6
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px 14px' }}>
          <div style={{ display: 'flex', fontSize: '88px', fontWeight: 900, lineHeight: 1, color: GOLD_BRIGHT }}>5</div>
          <div style={{ display: 'flex', fontSize: '17px', letterSpacing: '3px', color: MUTED, fontWeight: 700, marginTop: '10px' }}>STILL STANDING</div>
          <div style={{ display: 'flex', fontSize: '18px', color: TEXT, marginTop: '14px' }}>of 12 started</div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '20px 40px',
            fontSize: '15px',
            color: MUTED,
            borderBottom: `1px solid ${NAVY_LINE}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: NAVY_ELEVATED, border: `2px solid ${GOLD}` }} />
            <span>Alive</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: ELIMINATED, opacity: 0.6 }} />
            <span>Eliminated</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '26px', padding: '30px 40px', flex: 1 }}>
          {rungs.map((rung, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', fontSize: '14px', color: i === rungs.length - 1 ? GOLD : MUTED, fontWeight: 700, letterSpacing: '1px' }}>
                GAMEWEEK {i + 1}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '10px',
                  maxWidth: '820px',
                  padding: i === rungs.length - 1 ? '16px' : '0px',
                  backgroundColor: i === rungs.length - 1 ? 'rgba(216,178,76,0.08)' : 'transparent',
                  border: i === rungs.length - 1 ? `1px solid rgba(216,178,76,0.3)` : 'none',
                  borderRadius: '20px',
                }}
              >
                {rung.map(([name, alive, jokerUsed], j) => (
                  <Avatar key={j} name={name} alive={alive} jokerUsed={jokerUsed} you={i === rungs.length - 1 && j === 0} />
                ))}
              </div>
            </div>
          ))}
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
