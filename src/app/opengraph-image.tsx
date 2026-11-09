import { ImageResponse } from 'next/og';
import { fetchLivePreview, shortAge, sourceLabel } from '@/lib/embed/live';
import { formatTemp } from '@/lib/units';

export const alt = 'DIS Weather Station — live conditions in Dresden';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';
// Short cache: the card is regenerated as the station reports.
export const revalidate = 120;

const INK = '#F5F5F5';
const MUTED = '#8A8A8A';
const AMBER = '#F6A800';
const GREEN = '#B3D236';
const BLUE = '#00529E';
const SURFACE = '#0A0A0A';
const HAIRLINE = '#1F1F1F';

/**
 * Social/embed preview card rendered from the live reading, so a shared link
 * shows today's actual conditions instead of a static logo. Follows the brand
 * rules in docs/03a: dark surface, amber accent, the three-colour banner
 * strip, flat colour — no gradients or decorative chrome.
 */
export default async function OpengraphImage() {
  const { reading, source } = await fetchLivePreview();
  const temp = reading ? formatTemp(reading.temperatureC, 'metric') : null;
  const feels =
    reading?.feelsLikeC != null ? formatTemp(reading.feelsLikeC, 'metric') : null;
  const age = shortAge(reading?.timestamp);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: SURFACE,
          color: INK,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Three-colour banner strip echoing the school brand (docs/03a §4) */}
        <div style={{ display: 'flex', height: 14 }}>
          <div style={{ flex: 1, background: BLUE }} />
          <div style={{ flex: 1, background: AMBER }} />
          <div style={{ flex: 1, background: GREEN }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '52px 64px',
          }}
        >
          {/* Masthead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: AMBER,
                }}
              >
                DIS WEATHER STATION
              </div>
              <div style={{ fontSize: 24, color: MUTED, marginTop: 12 }}>
                Dresden International School · Dresden, Germany
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: reading ? GREEN : MUTED,
                  marginRight: 14,
                }}
              />
              <div style={{ fontSize: 26, color: reading ? GREEN : MUTED }}>
                {reading ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>

          {/* Headline number */}
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 'auto' }}>
            {temp ? (
              <>
                <div
                  style={{
                    fontSize: 216,
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {temp.value}
                </div>
                <div
                  style={{
                    fontSize: 84,
                    color: MUTED,
                    marginLeft: 12,
                    marginBottom: 26,
                  }}
                >
                  {temp.unit}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 82, fontWeight: 300, color: MUTED }}>
                Live data unavailable
              </div>
            )}
          </div>

          {/* Secondary readings */}
          {reading ? (
            <div
              style={{
                display: 'flex',
                marginTop: 26,
                fontSize: 34,
                color: MUTED,
              }}
            >
              <div style={{ display: 'flex', marginRight: 56 }}>
                <span>Feels like </span>
                <span style={{ color: INK }}>
                  {feels ? `${feels.value} ${feels.unit}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', marginRight: 56 }}>
                <span>Humidity </span>
                <span style={{ color: INK }}>{Math.round(reading.humidityPct)}%</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span>Wind </span>
                <span style={{ color: INK }}>
                  {Math.round(reading.windSpeedKmh)} km/h
                </span>
              </div>
            </div>
          ) : null}

          {/* Footer: honest about the source, per docs/03 and Session 20 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: 30,
              borderTop: `1px solid ${HAIRLINE}`,
              fontSize: 24,
              color: MUTED,
            }}
          >
            <div>{sourceLabel(source)}</div>
            <div>{`Measured ${age}`}</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
