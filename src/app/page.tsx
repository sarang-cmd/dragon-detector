'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWeather } from '@/hooks/useWeather';
import { useUnitSystem } from '@/context/unit-context';
import { HeroReading } from '@/components/weather/HeroReading';
import { WindCompass } from '@/components/weather/WindCompass';
import { RainGauge } from '@/components/weather/RainGauge';
import { HumidityTile } from '@/components/weather/HumidityTile';
import { PressureTile, calculatePressureTrend } from '@/components/weather/PressureTile';
import { UVTile } from '@/components/weather/UVTile';
import { SolarTile } from '@/components/weather/SolarTile';
import { MoonSunTile } from '@/components/weather/MoonSunTile';
import { LearnHintStrip } from '@/components/weather/LearnHintStrip';
import { HeroSkeleton, SkeletonTile } from '@/components/weather/SkeletonTile';

export default function HomePage() {
  const { reading, history, isLoading, isOffline } = useWeather();
  const { unitSystem } = useUnitSystem();

  // History series for 24-hour inline sparklines
  const h24Points = history?.h24 ?? [];
  const historyWind = h24Points.map((p) => p.windSpeedKmh);
  const historyRain = h24Points.map((p) => p.rainRateMmH);
  const historyHumidity = h24Points.map((p) => p.humidityPct);

  // Derive barometric trend for Hero summary sentence & Pressure tile
  const pressureTrendInfo = calculatePressureTrend(
    reading?.pressureHpa,
    h24Points
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <h1 className="sr-only">
          DIS Weather Station &mdash; Dresden International School Live Meteorological Dashboard
        </h1>

        {/* Core Bento Grid: 12 columns desktop, 2 columns tablet, 1 column mobile */}
        {isLoading || !reading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
            <HeroSkeleton className="col-span-1 md:col-span-2 lg:col-span-6 lg:row-span-2" />
            <SkeletonTile
              className="col-span-1 sm:col-span-1 lg:col-span-3 lg:row-span-2"
              minHeightClass="min-h-[380px] lg:min-h-[460px]"
            />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
            <SkeletonTile className="col-span-1 sm:col-span-1 lg:col-span-3" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
            {/* 1. Hero Instrument Reading (2x2 bento: 6 cols x 2 rows on desktop) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-6 lg:row-span-2 flex flex-col">
              <HeroReading
                reading={reading}
                unitSystem={unitSystem}
                history={h24Points}
                pressureTrend={pressureTrendInfo.trend}
                isOffline={isOffline}
              />
            </div>

            {/* 2. Wind Tile (1x2 bento: 3 cols x 2 rows on desktop) */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 lg:row-span-2 flex flex-col">
              <WindCompass
                speedKmh={reading.windSpeedKmh}
                gustKmh={reading.windGustKmh}
                directionDeg={reading.windDirectionDeg}
                unitSystem={unitSystem}
                historySpeedKmh={historyWind}
                isOffline={isOffline}
              />
            </div>

            {/* 3. Rain Tile (1x1 bento: 3 cols x 1 row on desktop) */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
              <RainGauge
                rateMmH={reading.rainRateMmH}
                todayMm={reading.rainTodayMm}
                hourMm={reading.rainHourMm}
                weekMm={reading.rainWeekMm}
                unitSystem={unitSystem}
                historyRainMmH={historyRain}
                isOffline={isOffline}
              />
            </div>

            {/* 4. Humidity Tile (1x1 bento: 3 cols x 1 row on desktop) */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
              <HumidityTile
                humidityPct={reading.humidityPct}
                dewPointC={reading.dewPointC}
                unitSystem={unitSystem}
                historyHumidityPct={historyHumidity}
                isOffline={isOffline}
              />
            </div>

            {/* 5. Barometric Pressure Tile (3 cols on desktop) */}
            {reading.pressureHpa != null && (
              <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
                <PressureTile
                  pressureHpa={reading.pressureHpa}
                  unitSystem={unitSystem}
                  history={h24Points}
                  isOffline={isOffline}
                />
              </div>
            )}

            {/* 6. UV Index Tile (3 cols on desktop) */}
            {reading.uvIndex != null && (
              <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
                <UVTile
                  uvIndex={reading.uvIndex}
                  isOffline={isOffline}
                />
              </div>
            )}

            {/* 7. Solar Radiation Tile (3 cols on desktop, hidden if absent) */}
            {reading.solarWm2 != null && (
              <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
                <SolarTile
                  solarWm2={reading.solarWm2}
                  isOffline={isOffline}
                />
              </div>
            )}

            {/* 8. Moon Phase & Sun Ephemeris Tile (3 cols on desktop) */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col">
              <MoonSunTile isOffline={isOffline} />
            </div>
          </div>
        )}

        {/* Educational Hint Strip */}
        <LearnHintStrip />
      </main>

      <Footer />
    </div>
  );
}
