'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useAmbientEffect, useEffects } from '@/context/effects-context';
import { EffectBoundary } from './EffectBoundary';

const Clouds = dynamic(
  () => import('@/components/canvasui/Clouds').then((module) => module.Clouds),
  { ssr: false }
);
const Droplets = dynamic(
  () => import('@/components/canvasui/Droplets').then((module) => module.Droplets),
  { ssr: false }
);
const Frost = dynamic(
  () => import('@/components/canvasui/Frost').then((module) => module.Frost),
  { ssr: false }
);
const VHS = dynamic(
  () => import('@/components/canvasui/VHS').then((module) => module.VHS),
  { ssr: false }
);

function WeatherCanvasLayer({
  children,
  label,
  className = '',
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div
      className={`weather-effect-layer ${className}`}
      aria-hidden="true"
      data-effect={label}
    >
      {children}
    </div>
  );
}

export function HeroWeatherEffects({
  temperatureC,
  humidityPct,
  isStale,
}: {
  temperatureC: number;
  humidityPct: number;
  isStale: boolean;
}) {
  const { tier } = useEffects();
  const isFreezing = temperatureC < 0;
  const showClouds = useAmbientEffect(!isFreezing && !isStale);
  const showFrost = useAmbientEffect(isFreezing && !isStale);
  const isLite = tier === 'lite';
  const cloudOpacity = Math.min(0.12, Math.max(0.035, humidityPct * 0.0012));

  return (
    <>
      {showClouds && (
        <EffectBoundary fallback={null}>
          <WeatherCanvasLayer label="clouds" className="hero-effect-layer">
            <Clouds
              className="h-full w-full"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              scale={1.2}
              speed={isLite ? 0 : 0.12}
              cover={0.08}
              density={2.5}
              shading={0.05}
              opacity={cloudOpacity}
              shadow={0}
              wind={isLite ? 0 : 0.16}
              windRadius={220}
              refraction={0}
              fogBlur={0}
              quality={isLite ? 0.3 : 0.55}
              color="auto"
            >
              <div className="h-full w-full bg-transparent" />
            </Clouds>
          </WeatherCanvasLayer>
        </EffectBoundary>
      )}
      {showFrost && (
        <EffectBoundary fallback={null}>
          <WeatherCanvasLayer label="frost" className="hero-effect-layer">
            <Frost
              className="h-full w-full"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: isLite ? 'none' : 'auto',
              }}
              frost={0.03}
              strength={0.16}
              contrast={1.5}
              crispness={1}
              highlight={0}
              haze={0.02}
              tintStrength={0.04}
              refraction={0.05}
              detail={0.2}
              textureScale={2}
              meltStrength={0.35}
              refreeze={1.5}
              introDuration={isLite ? 0 : 0.4}
              opacity={0.07}
              shimmer={0}
              quality={isLite ? 0.3 : 0.5}
            >
              <div className="h-full w-full bg-transparent" />
            </Frost>
          </WeatherCanvasLayer>
        </EffectBoundary>
      )}
    </>
  );
}

export function RainWeatherEffect({
  rateMmH,
  isStale,
}: {
  rateMmH: number;
  isStale: boolean;
}) {
  const { tier } = useEffects();
  const enabled = useAmbientEffect(rateMmH > 0 && !isStale && tier === 'full');
  if (!enabled) return null;

  const intensity = Math.min(0.24, 0.06 + Math.max(0, rateMmH) * 0.035);
  return (
    <EffectBoundary fallback={null}>
      <WeatherCanvasLayer label="droplets">
        <Droplets
          className="h-full w-full"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          intensity={intensity}
          speed={0.35}
          scale={0.5}
          dropWidth={0.55}
          dropLength={0.65}
          refraction={0.04}
          blur={0}
          vignette={0}
          fallSpeed={0.45}
          wiggle={0.15}
          staticDrops={0.1}
          interactive={false}
          tintStrength={0}
        >
          <div className="h-full w-full bg-transparent" />
        </Droplets>
      </WeatherCanvasLayer>
    </EffectBoundary>
  );
}

export function StaleWeatherEffect({ visible }: { visible: boolean }) {
  const { tier } = useEffects();
  const enabled = useAmbientEffect(visible && tier === 'full');
  if (!enabled) return null;

  return (
    <EffectBoundary fallback={null}>
      <WeatherCanvasLayer label="vhs-signal">
        <VHS
          className="h-full w-full"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          speed={0.18}
          wave={0.08}
          jitter={0.03}
          crease={0}
          switching={0}
          bloom={0}
          aberration={0}
          acBeat={0}
          grain={0.025}
          scanlines={0.035}
          vignette={0}
          barrel={0}
          saturation={0}
          exposure={1}
        >
          <div className="h-full w-full bg-transparent" />
        </VHS>
      </WeatherCanvasLayer>
    </EffectBoundary>
  );
}
