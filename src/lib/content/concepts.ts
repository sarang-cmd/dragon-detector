export type ConceptKind = 'kids' | 'students';

export interface ConceptCard {
  id: string;
  icon: string; // currently a label; replace with Lucide component later
  title: string;
  kids: string;
  students: string;
  measured: string;
  units: string;
  typicalDresden: string;
  tryThis: string;
}

export const conceptCards: ConceptCard[] = [
  {
    id: 'temperature',
    icon: 'thermometer',
    title: 'Temperature',
    kids: 'How hot or cold the air is.',
    students: 'Average kinetic energy of air molecules, in °C, measured in a shaded sensor.',
    measured: 'Thermometer inside a shaded radiation shield on the outdoor sensor.',
    units: '°C',
    typicalDresden: 'Winters near 0°C, summers often 20–30°C; can drop below -10°C in cold spells.',
    tryThis: 'Why is the sensor shaded?',
  },
  {
    id: 'feels-like',
    icon: 'wind',
    title: 'Feels like',
    kids: 'How warm it feels to your body.',
    students: 'Combines temperature with wind (wind chill) or humidity (heat index).',
    measured: 'Computed from temperature, wind and humidity on the console.',
    units: '°C',
    typicalDresden: 'In winter wind can make it feel several degrees colder than the real temperature.',
    tryThis: 'When is feels-like lower than the real temperature?',
  },
  {
    id: 'humidity',
    icon: 'droplets',
    title: 'Humidity',
    kids: 'How much water is hiding in the air.',
    students: 'Relative humidity = vapour pressure vs maximum at that temperature.',
    measured: 'Thermo-hygrometer on the outdoor sensor.',
    units: '%',
    typicalDresden: 'Humidity rises at night and after rain; summer afternoons can feel muggy.',
    tryThis: 'Why does humidity rise at night?',
  },
  {
    id: 'dew-point',
    icon: 'trending-down',
    title: 'Dew point',
    kids: 'The temperature where dew forms.',
    students: 'Temperature at which air saturates; better comfort measure than relative humidity.',
    measured: 'Computed from temperature and humidity.',
    units: '°C',
    typicalDresden: 'Fog is likely when temperature and dew point are close together.',
    tryThis: 'Predict fog when temp and dew point are within 2 degrees.',
  },
  {
    id: 'wind-speed',
    icon: 'gauge',
    title: 'Wind speed',
    kids: 'How fast the air moves.',
    students: 'Anemometer average; Beaufort scale 0–12.',
    measured: 'Cup anemometer on the outdoor array.',
    units: 'km/h; Beaufort 0–12',
    typicalDresden: 'Light breezes are common; storms come from the west.',
    tryThis: 'Compare morning and afternoon.',
  },
  {
    id: 'wind-gust',
    icon: 'zap',
    title: 'Wind gust',
    kids: 'A short strong burst.',
    students: 'Peak wind over the interval.',
    measured: 'Peak reading from the anemometer over the update interval.',
    units: 'km/h',
    typicalDresden: 'Gusts can be much higher than the average, especially in storms.',
    tryThis: 'Compute gust factor (gust ÷ average).',
  },
  {
    id: 'wind-direction',
    icon: 'compass',
    title: 'Wind direction',
    kids: 'Where the wind comes from.',
    students: 'Degrees from north, direction wind blows FROM.',
    measured: 'Wind vane on the outdoor array.',
    units: 'degrees from N; compass label',
    typicalDresden: 'A westerly wind often brings Atlantic weather; an easterly can be cold and dry.',
    tryThis: 'Which direction brings warm air?',
  },
  {
    id: 'rain',
    icon: 'umbrella',
    title: 'Rain',
    kids: 'How much water fell.',
    students: 'Tipping bucket; 1 mm = 1 litre per m².',
    measured: 'Tipping-bucket rain gauge; 1 tip = 0.1 mm in this model of gauge.',
    units: 'mm; mm/h',
    typicalDresden: 'Rain events can be short showers or longer drizzle.',
    tryThis: '5 mm on the school roof = how many litres?',
  },
  {
    id: 'pressure',
    icon: 'bar-chart-2',
    title: 'Pressure',
    kids: 'The weight of the air above us.',
    students: 'Relative (sea-level corrected) vs absolute, in hPa.',
    measured: 'Barometer in the console; relative is sea-level corrected using the elevation you set.',
    units: 'hPa',
    typicalDresden: 'Around 1013 hPa at sea level; falling pressure often means weather is on the way.',
    tryThis: 'Plot pressure and rain for a week.',
  },
  {
    id: 'uv-index',
    icon: 'sun',
    title: 'UV index',
    kids: 'How strongly the sun can burn skin.',
    students: 'Weighted UV irradiance, scale 0–11+.',
    measured: 'UV sensor on the outdoor array.',
    units: 'index',
    typicalDresden: 'UV is strongest in summer around midday and lower in winter.',
    tryThis: 'At what UV does sunscreen matter?',
  },
  {
    id: 'solar',
    icon: 'sunrise',
    title: 'Light / solar',
    kids: 'How bright the sun is.',
    students: 'Irradiance in W/m², relevant for solar panels.',
    measured: 'Light/solar sensor on the outdoor array.',
    units: 'W/m²',
    typicalDresden: 'A bright summer day near noon is several hundred W/m²; clear nights are near 0.',
    tryThis: 'Output of 1 m² panel at 15% efficiency?',
  },
  {
    id: 'measurement-uncertainty',
    icon: 'clipboard-check',
    title: 'Measurement uncertainty',
    kids: 'Our station is not perfect.',
    students: 'WS3500: temp ±1°C, humidity ±5%, rain ±10%.',
    measured: 'Sensor accuracy from the WS3500 manual; small errors and siting matter.',
    units: '± °C, ± %, ± mm',
    typicalDresden: 'Official DWD stations use professional instruments and can differ from ours.',
    tryThis: 'Compare with DWD Dresden; why do they differ?',
  },
];

export function conceptById(id: string): ConceptCard | undefined {
  return conceptCards.find((c) => c.id === id);
}
