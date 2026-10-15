import { z } from 'zod';

// ---------------------------------------------------------------------------
// Learn content model (docs/06). UI imports only these typed records.
// Rules: accurate science; Dresden figures are rounded, clearly labelled
// typical ranges — never invented precision. Kids text targets reading age 8:
// short sentences (under 15 words), no jargon.
// ---------------------------------------------------------------------------

export const CONCEPT_IDS = [
  'temperature',
  'feels-like',
  'humidity',
  'dew-point',
  'wind-speed',
  'wind-gust',
  'wind-direction',
  'rain',
  'pressure',
  'uv-index',
  'solar',
  'measurement-uncertainty',
] as const;

export type ConceptId = (typeof CONCEPT_IDS)[number];

export const DATA_METRIC_KEYS = [
  'temperature',
  'wind',
  'rain',
  'pressure',
  'humidity',
  'sun',
] as const;

export type DataMetricKey = (typeof DATA_METRIC_KEYS)[number];

// Lucide icon names used by the learn cards. The ExplainerCard maps each
// name to a real Lucide component (never emoji); the schema below rejects
// any name missing from that map.
export const CONCEPT_ICONS = [
  'thermometer',
  'thermometer-sun',
  'droplets',
  'droplet',
  'wind',
  'zap',
  'compass',
  'cloud-rain',
  'gauge',
  'sun',
  'sunrise',
  'ruler',
] as const;

export type ConceptIcon = (typeof CONCEPT_ICONS)[number];

export const KidsContentSchema = z.object({
  summary: z.string().min(1),
  example: z.string().min(1),
});

export const TypicalRangeSchema = z.object({
  winter: z.string().min(1),
  summer: z.string().min(1),
});

export const StudentsContentSchema = z.object({
  summary: z.string().min(1),
  howMeasured: z.string().min(1),
  formula: z.string().optional(),
  unit: z.string().min(1),
  typicalDresden: TypicalRangeSchema,
});

export const ConceptSchema = z.object({
  id: z.enum(CONCEPT_IDS),
  title: z.string().min(1),
  icon: z.enum(CONCEPT_ICONS),
  kids: KidsContentSchema,
  students: StudentsContentSchema,
  tryThis: z.string().min(1),
  relatedMetricKey: z.enum(DATA_METRIC_KEYS).optional(),
  accuracyNote: z.string().optional(),
});

export type KidsContent = z.infer<typeof KidsContentSchema>;
export type StudentsContent = z.infer<typeof StudentsContentSchema>;
export type Concept = z.infer<typeof ConceptSchema>;

function concept(c: Concept): Concept {
  return ConceptSchema.parse(c);
}

export const concepts: Concept[] = [
  concept({
    id: 'temperature',
    title: 'Temperature',
    icon: 'thermometer',
    kids: {
      summary:
        'Temperature tells how hot or cold the air is. We measure it in degrees Celsius.',
      example:
        'Ice melts at zero degrees. Your skin feels heat above about 30 degrees.',
    },
    students: {
      summary:
        'Air temperature reflects the average kinetic energy of air molecules. Higher energy means faster molecules and a higher reading.',
      howMeasured:
        'A thermometer sits inside a shaded radiation shield on the outdoor array, so sunshine never heats the sensor directly.',
      unit: '°C',
      typicalDresden: {
        winter:
          'Typical winter days stay near 0 to 5 °C, with frosty nights below freezing.',
        summer:
          'Typical summer highs sit near 20 to 25 °C, with hot days above 30 °C.',
      },
    },
    tryThis: 'Why is the sensor shaded? What would a sunny sensor report?',
    relatedMetricKey: 'temperature',
    accuracyNote:
      'WS3500 accuracy: ±1 °C with 0.1 °C resolution (station manual).',
  }),
  concept({
    id: 'feels-like',
    title: 'Feels like',
    icon: 'thermometer-sun',
    kids: {
      summary:
        'Feels-like tells how warm your body feels. Wind can make it feel colder.',
      example: 'A cold windy day feels worse than a calm one.',
    },
    students: {
      summary:
        'Feels-like blends temperature with wind (wind chill) or humidity (heat index). Wind strips body heat away; humidity slows sweat cooling.',
      howMeasured:
        'The console computes it from temperature, wind and humidity — no extra sensor. Wind chill applies below about 10 °C with wind; heat index applies from about 26 °C with humid air.',
      unit: '°C',
      typicalDresden: {
        winter:
          'On windy winter days it can feel several degrees colder than the thermometer shows.',
        summer:
          'On hot humid days it can feel a few degrees warmer than the thermometer shows.',
      },
    },
    tryThis: 'When is feels-like lower than the real temperature — and why?',
    relatedMetricKey: 'temperature',
    accuracyNote:
      'Computed from other sensors, so it inherits their errors — mainly the ±1 °C of temperature.',
  }),
  concept({
    id: 'humidity',
    title: 'Humidity',
    icon: 'droplets',
    kids: {
      summary:
        'Humidity tells how much water hides in the air. High humidity can feel sticky.',
      example: 'Mirrors fog up in a steamy bathroom.',
    },
    students: {
      summary:
        'Relative humidity is the ratio of actual water vapour pressure to the maximum possible at the same temperature, times 100. Warm air can hold more vapour, so the same water content reads lower on a warm afternoon.',
      howMeasured:
        'A capacitive polymer sensor in the thermo-hygrometer changes its electrical signal with moisture in the air.',
      formula: 'RH = 100 × vapour pressure ÷ saturation vapour pressure',
      unit: '% relative humidity',
      typicalDresden: {
        winter: 'Often 80 to 95 % on grey winter days.',
        summer:
          'Often 40 to 60 % on warm afternoons, climbing again at night.',
      },
    },
    tryThis: 'Why does humidity rise at night even when no water is added?',
    relatedMetricKey: 'humidity',
    accuracyNote:
      'WS3500 accuracy: ±5 % over its 10–99 % range (station manual).',
  }),
  concept({
    id: 'dew-point',
    title: 'Dew point',
    icon: 'droplet',
    kids: {
      summary:
        'Dew point is the temperature where dew forms. Near the air temperature, fog is likely.',
      example: 'Grass is wet on cool clear mornings.',
    },
    students: {
      summary:
        'The dew point is the temperature to which air must cool for vapour to condense. It tracks absolute moisture, so it judges mugginess better than relative humidity: a high dew point always means sticky air.',
      howMeasured:
        'Computed from temperature and humidity (Magnus approximation) — no separate sensor.',
      unit: '°C',
      typicalDresden: {
        winter: 'Often near or below 0 °C; frost forms instead of dew.',
        summer:
          'Often 10 to 16 °C; above about 18 °C most people find it muggy.',
      },
    },
    tryThis:
      'Predict fog: watch for evenings when temperature and dew point sit within 2 °C.',
    relatedMetricKey: 'temperature',
    accuracyNote:
      'Computed from other sensors, so it inherits their errors — mainly the ±1 °C of temperature and ±5 % of humidity.',
  }),
  concept({
    id: 'wind-speed',
    title: 'Wind speed',
    icon: 'wind',
    kids: {
      summary:
        'Wind speed tells how fast air moves. We measure it in kilometres per hour.',
      example: 'Leaves dance when the wind is strong.',
    },
    students: {
      summary:
        'Wind speed is the average air motion over an interval, reported in km/h and on the Beaufort scale from 0 (calm) to 12 (hurricane). Averages smooth out the bursts; gusts are reported separately.',
      howMeasured:
        'Cups on the anemometer spin faster in stronger wind; the station averages the spins over its update interval.',
      formula: 'Beaufort thresholds (km/h): 1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118',
      unit: 'km/h, Beaufort 0–12',
      typicalDresden: {
        winter:
          'Typical breezes run 5 to 15 km/h; winter storms bring much more.',
        summer: 'Summer is often calmer, with breezy thunderstorm edges.',
      },
    },
    tryThis: 'Compare morning and afternoon wind. When is it stronger?',
    relatedMetricKey: 'wind',
    accuracyNote:
      'The manual states no accuracy figure for wind; cups and vane need clear, high mounting to read honestly.',
  }),
  concept({
    id: 'wind-gust',
    title: 'Wind gust',
    icon: 'zap',
    kids: {
      summary:
        'A gust is a short strong burst of wind. It lasts only a few seconds.',
      example: 'A gust can slam a door shut.',
    },
    students: {
      summary:
        'A gust is the peak wind over the reporting interval — always at or above the average. The gust factor (gust ÷ average) shows how turbulent the air is: near 1 means steady, near 2 means rough.',
      howMeasured:
        'The same anemometer cups report the fastest spin captured during the interval.',
      formula: 'gust factor = gust speed ÷ mean speed',
      unit: 'km/h',
      typicalDresden: {
        winter: 'Gusts run clearly above the average, most of all in storms.',
        summer:
          'Summer gusts often arrive with passing showers and thunderstorms.',
      },
    },
    tryThis: 'Compute the gust factor for today. Is the wind steady or rough?',
    relatedMetricKey: 'wind',
    accuracyNote:
      'The manual states no accuracy figure for wind; treat single gust peaks as approximate.',
  }),
  concept({
    id: 'wind-direction',
    title: 'Wind direction',
    icon: 'compass',
    kids: {
      summary:
        'Wind direction tells where wind comes from. North wind brings cold air here.',
      example: 'A flag shows which way wind blows.',
    },
    students: {
      summary:
        'Wind direction is where the wind blows FROM, measured clockwise in degrees from north (0° = N, 90° = E, 180° = S, 270° = W). Air flows from high to low pressure, bent by Earth’s rotation, so direction hints at the coming weather.',
      howMeasured:
        'A wind vane on the outdoor array turns into the wind; the station reads its angle.',
      unit: 'degrees from north, compass label',
      typicalDresden: {
        winter:
          'West winds bring mild Atlantic air; east winds bring cold snaps.',
        summer:
          'West winds bring changeable showery weather; long east spells turn hot and dry.',
      },
    },
    tryThis: 'Which wind direction brings the warmest air to Dresden?',
    relatedMetricKey: 'wind',
    accuracyNote:
      'The manual states no accuracy figure for direction; nearby walls and roofs bend the flow.',
  }),
  concept({
    id: 'rain',
    title: 'Rain',
    icon: 'cloud-rain',
    kids: {
      summary:
        'Rain tells how much water fell down. We measure it in millimetres.',
      example: 'Five millimetres fills a puddle.',
    },
    students: {
      summary:
        'Rainfall depth in millimetres converts directly to volume: 1 mm over 1 m² is exactly 1 litre. Rate (mm/h) describes intensity; totals per hour, day and week describe accumulation.',
      howMeasured:
        'A tipping-bucket gauge tips each time 0.1 mm collects, and the station counts the tips.',
      formula: 'litres = area in m² × rain in mm',
      unit: 'mm, mm/h',
      typicalDresden: {
        winter: 'Winter brings lighter rain and sometimes snow.',
        summer:
          'Summer brings heavier showers and thunderstorms; the year totals about 600 mm.',
      },
    },
    tryThis:
      'Five millimetres on the school roof — how many litres is that?',
    relatedMetricKey: 'rain',
    accuracyNote:
      'WS3500 accuracy: ±10 % with 0.1 mm per tip (station manual).',
  }),
  concept({
    id: 'pressure',
    title: 'Pressure',
    icon: 'gauge',
    kids: {
      summary:
        'Air has weight and pushes on us. Pressure tells how strong that push is.',
      example: 'Falling pressure often brings rain soon.',
    },
    students: {
      summary:
        'Air pressure is the weight of the air column above us, in hectopascals. Relative pressure is corrected to sea level using the station elevation, so stations at different heights can be compared. Falling pressure usually means a low-pressure system — and rain — is approaching.',
      howMeasured:
        'A solid-state barometer inside the console measures absolute pressure; the app converts it to relative using the elevation you set.',
      unit: 'hPa (relative, sea-level corrected)',
      typicalDresden: {
        winter: 'Deep winter lows can dip near 980 hPa.',
        summer: 'Calm highs sit near 1020 to 1030 hPa in any season.',
      },
    },
    tryThis: 'Plot pressure and rain for a week. What pattern do you see?',
    relatedMetricKey: 'pressure',
    accuracyNote:
      'The manual gives no accuracy figure; relative pressure is only right if the station elevation is set correctly.',
  }),
  concept({
    id: 'uv-index',
    title: 'UV index',
    icon: 'sun',
    kids: {
      summary:
        'UV tells how strongly the sun burns skin. High UV means use shade and sunscreen.',
      example: 'Midday sun in June burns fast.',
    },
    students: {
      summary:
        'The UV index weights solar ultraviolet by how strongly it burns human skin, on the WHO scale from 0 to 11+. It peaks at midday and in summer, and clouds only partly block it.',
      howMeasured:
        'A UV sensor on the outdoor array reports the index directly to the console.',
      unit: 'UV index (0–11+)',
      typicalDresden: {
        winter: 'Often 0 to 1; the low sun barely burns.',
        summer: 'Midday values of 5 to 7 are normal on clear days.',
      },
    },
    tryThis: 'From which UV value does sunscreen matter? Check the WHO scale.',
    relatedMetricKey: 'sun',
    accuracyNote:
      'The manual states no accuracy figure; keep the sensor clean for honest readings.',
  }),
  concept({
    id: 'solar',
    title: 'Light / solar',
    icon: 'sunrise',
    kids: {
      summary:
        'Solar tells how bright the sunshine is. Strong sun can power solar panels.',
      example: 'Panels on roofs make power from light.',
    },
    students: {
      summary:
        'Solar irradiance is the incoming light power per square metre, in W/m². Summed over time it becomes energy — the number that sizes solar panels and warms the schoolyard.',
      howMeasured:
        'A silicon photodiode sensor on the outdoor array converts light into the reading.',
      formula: 'energy ≈ average W/m² × hours of sun',
      unit: 'W/m²',
      typicalDresden: {
        winter: 'Grey midday values sit near 50 to 150 W/m².',
        summer: 'Clear midday values reach about 700 to 900 W/m².',
      },
    },
    tryThis:
      'What does a 1 m² panel give at 15 % efficiency under 800 W/m²?',
    relatedMetricKey: 'sun',
    accuracyNote:
      'The manual states no accuracy figure; keep the sensor clean for honest readings.',
  }),
  concept({
    id: 'measurement-uncertainty',
    title: 'Measurement uncertainty',
    icon: 'ruler',
    kids: {
      summary:
        'No tool measures the world just right. Small errors are always part of measuring.',
      example: 'Two rulers can show slightly different lengths.',
    },
    students: {
      summary:
        'Every sensor has limits: accuracy (how close to truth), resolution (smallest step shown) and siting error (a wall, roof or tree bending the reading). Honest science reports the value plus its uncertainty — “11.4 °C ± 1 °C” — instead of pretending the digits are perfect.',
      howMeasured:
        'The WS3500 manual states the limits below; calibration against a trusted instrument and good siting shrink the rest.',
      unit: '± °C, ± %, ± mm',
      typicalDresden: {
        winter: 'Cold, damp air pushes cheap sensors to their limits.',
        summer: 'Heat and sun test the radiation shield the most.',
      },
    },
    tryThis:
      'Compare our station with DWD Dresden. Why do the two differ?',
    accuracyNote:
      'WS3500: temperature ±1 °C, humidity ±5 %, rain ±10 % (station manual). Official DWD stations use ventilated, calibrated instruments on open ground at standard heights — a school courtyard with walls and roofs nearby will read differently, and that is expected.',
  }),
];

export function conceptById(id: string): Concept | undefined {
  return concepts.find((c) => c.id === id);
}
