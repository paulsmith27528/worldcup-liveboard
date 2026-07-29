import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Generic share image for any Last Man Standing pool — no league name, so it
// works across Premier League, Championship, Champions League, and anything
// added later without needing a per-league version.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A1122',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(243,210,122,0.20), rgba(243,210,122,0) 60%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#ef4444',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '6px',
            marginBottom: '36px',
          }}
        >
          <span style={{ fontSize: '40px' }}>☠️</span>
          <span>LAST MAN STANDING</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '96px',
            fontWeight: 900,
            lineHeight: 1.05,
            textAlign: 'center',
            backgroundImage: 'linear-gradient(135deg, #F3D27A, #C9A24B)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '28px',
          }}
        >
          <span>One wrong pick.</span>
          <span>You are out.</span>
        </div>

        <div
          style={{
            display: 'flex',
            color: '#94a3b8',
            fontSize: '30px',
            fontWeight: 600,
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          Free to play - pick a team every week, never repeat one
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '56px' }}>
          {[false, false, true, false, true, false, true, false].map((isOut, i) => (
            <div
              key={i}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                backgroundColor: isOut ? 'rgba(148,163,184,0.25)' : '#F3D27A',
                backgroundImage: isOut
                  ? undefined
                  : 'linear-gradient(135deg, #F3D27A, #C9A24B)',
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#5b6b85',
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          <span>myofficesweepstake.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
