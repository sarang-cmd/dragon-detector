import { z } from 'zod';

// ---------------------------------------------------------------------------
// Classroom activities (docs/06 §2). Each activity carries the fields the
// task requires: age, minutes, materials, numbered steps, expected result,
// extension and a curriculum link (IB programme + subject).
// ---------------------------------------------------------------------------

export const AGE_BANDS = ['primary', 'lower-secondary', 'upper-secondary'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  primary: 'Primary (about 7–10)',
  'lower-secondary': 'Lower secondary (about 11–14)',
  'upper-secondary': 'Upper secondary (about 14–18)',
};

export const PROGRAMMES = ['PYP', 'MYP', 'DP', 'TOK'] as const;
export type Programme = (typeof PROGRAMMES)[number];

export const ActivitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  ageLabel: z.string().min(1),
  ageBand: z.enum(AGE_BANDS),
  ageMin: z.number().int().min(5).max(19),
  ageMax: z.number().int().min(5).max(19),
  minutes: z.number().int().positive(),
  materials: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).min(3),
  expectedResult: z.string().min(1),
  extension: z.string().min(1),
  curriculum: z.object({
    programme: z.enum(PROGRAMMES),
    subjects: z.array(z.string().min(1)).min(1),
  }),
});

export type Activity = z.infer<typeof ActivitySchema>;

function activity(a: Activity): Activity {
  return ActivitySchema.parse(a);
}

export const activities: Activity[] = [
  activity({
    id: 'weather-detective',
    title: 'Weather detective',
    ageLabel: 'Ages 7–10',
    ageBand: 'primary',
    ageMin: 7,
    ageMax: 10,
    minutes: 20,
    materials: ['Live dashboard on the projector', 'Paper or a shared sheet'],
    steps: [
      'Look at today’s pressure trend on the dashboard together.',
      'Predict tomorrow: will pressure rise, fall or stay steady?',
      'Write down the prediction and one reason for it.',
      'Check the real weather the next day and score the class.',
    ],
    expectedResult:
      'Pupils practise using a trend, not a single reading, to predict weather.',
    extension: 'Keep a week-long prediction ledger and crown the best forecaster.',
    curriculum: { programme: 'PYP', subjects: ['Science'] },
  }),
  activity({
    id: 'rain-per-roof',
    title: 'Rain per roof',
    ageLabel: 'Ages 9–12',
    ageBand: 'primary',
    ageMin: 9,
    ageMax: 12,
    minutes: 30,
    materials: ['Rain reading from the dashboard', 'Roof area estimate in m²'],
    steps: [
      'Read today’s rain total in millimetres from the dashboard.',
      'Find or estimate the area of the school roof in square metres.',
      'Multiply area × rain in mm to get litres (1 mm = 1 litre per m²).',
      'Compare the total with a bathtub or swimming pool for scale.',
    ],
    expectedResult:
      'Pupils connect millimetres of rain to real volumes of water.',
    extension: 'Estimate how much rain lands on the whole school grounds in a year.',
    curriculum: { programme: 'PYP', subjects: ['Science', 'Maths'] },
  }),
  activity({
    id: 'wind-and-gusts',
    title: 'Wind and gusts',
    ageLabel: 'MYP, ages 11–16',
    ageBand: 'lower-secondary',
    ageMin: 11,
    ageMax: 16,
    minutes: 40,
    materials: [
      'Wind speed and gust readings across one day',
      'Graph paper or a spreadsheet',
    ],
    steps: [
      'Collect wind speed and gust at several times of day.',
      'Compute the gust factor for each time: gust ÷ average speed.',
      'Plot gust factor against time of day.',
      'Discuss whether gusts are stronger at certain times and why.',
    ],
    expectedResult:
      'Students see that a gust is a peak over an interval, and compute a simple ratio from real data.',
    extension:
      'Compare the gust factor on a calm, a breezy and a stormy day.',
    curriculum: { programme: 'MYP', subjects: ['Science', 'Physics'] },
  }),
  activity({
    id: 'dew-point-and-fog',
    title: 'Dew point and fog',
    ageLabel: 'Ages 14–18, Physics',
    ageBand: 'upper-secondary',
    ageMin: 14,
    ageMax: 18,
    minutes: 45,
    materials: ['Temperature, dew point and humidity readings', 'A fog forecast'],
    steps: [
      'Find evenings when temperature and dew point sit close together.',
      'Read the humidity at those times.',
      'Check whether fog or mist was forecast or seen.',
      'Explain why a small gap between the two lines suggests fog.',
    ],
    expectedResult:
      'Students link dew point to condensation and fog formation.',
    extension: 'Track overnight cooling toward the dew point across a full week.',
    curriculum: { programme: 'DP', subjects: ['Physics'] },
  }),
  activity({
    id: 'urban-heat',
    title: 'Urban heat',
    ageLabel: 'DP Geography / ESS, ages 16–18',
    ageBand: 'upper-secondary',
    ageMin: 16,
    ageMax: 18,
    minutes: 90,
    materials: ['DIS readings and DWD Dresden values', 'A map of the school area'],
    steps: [
      'Compare DIS temperature with official DWD Dresden values over several days.',
      'Note the biggest differences and when they happen.',
      'Discuss siting, urban heat, shade and time of day as causes.',
      'Write a short paragraph explaining the differences.',
    ],
    expectedResult:
      'Students learn why a school station can honestly differ from an official one.',
    extension:
      'Investigate how roofs, walls and pavement near the sensor change readings.',
    curriculum: { programme: 'DP', subjects: ['Geography', 'ESS'] },
  }),
  activity({
    id: 'solar-potential',
    title: 'Solar potential',
    ageLabel: 'DP Physics, ages 16–18',
    ageBand: 'upper-secondary',
    ageMin: 16,
    ageMax: 18,
    minutes: 50,
    materials: ['Solar W/m² readings', 'A panel efficiency assumption'],
    steps: [
      'Read solar irradiance at several times of day from /data.',
      'Pick a panel efficiency, for example 15 % (0.15).',
      'Estimate the energy per square metre for one hour at each time.',
      'Discuss when panels would produce most — and when nothing at all.',
    ],
    expectedResult: 'Students connect irradiance readings to electrical output.',
    extension: 'Model a full day’s energy from a 1 m² panel, hour by hour.',
    curriculum: { programme: 'DP', subjects: ['Physics'] },
  }),
  activity({
    id: 'data-science',
    title: 'Data science with CSV',
    ageLabel: 'Maths / CS, ages 14–18',
    ageBand: 'upper-secondary',
    ageMin: 14,
    ageMax: 18,
    minutes: 90,
    materials: ['A CSV export from /data', 'A spreadsheet or code notebook'],
    steps: [
      'Download a 24-hour or 7-day CSV from the data page.',
      'Compute mean, median and range for temperature or humidity.',
      'Plot temperature against humidity and describe the pattern.',
      'Discuss whether the correlation you see means a cause.',
    ],
    expectedResult:
      'Students practise summary statistics and basic regression on real local data.',
    extension:
      'Fit a line to temperature vs humidity and interpret what the slope means.',
    curriculum: { programme: 'MYP', subjects: ['Maths', 'Computer Science'] },
  }),
  activity({
    id: 'sensor-accuracy',
    title: 'Sensor accuracy debate',
    ageLabel: 'TOK / Physics, ages 16–18',
    ageBand: 'upper-secondary',
    ageMin: 16,
    ageMax: 18,
    minutes: 45,
    materials: [
      'Accuracy figures from the station and learn pages',
      'Two or more sources of weather data',
    ],
    steps: [
      'Read the station’s stated accuracy for temperature, humidity and rain.',
      'Compare DIS readings with another source for the same hour.',
      'Discuss what “accurate enough” means for different uses.',
      'Debate in groups: how do we know a measurement is right?',
    ],
    expectedResult:
      'Students practise thinking about uncertainty, calibration and truth in measurement.',
    extension: 'Design a simple check for one sensor using two nearby thermometers.',
    curriculum: { programme: 'TOK', subjects: ['TOK', 'Physics'] },
  }),
];

export function activityById(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}

/** Subjects offered across all activities, for the filter dropdown. */
export function allSubjects(): string[] {
  const set = new Set<string>();
  for (const a of activities) for (const s of a.curriculum.subjects) set.add(s);
  return Array.from(set).sort();
}
