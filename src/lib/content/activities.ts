export interface Activity {
  id: string;
  title: string;
  ages: string;
  time: string;
  materials: string[];
  steps: string[];
  expected: string;
  extension: string;
}

export const activities: Activity[] = [
  {
    id: 'weather-detective',
    title: 'Weather detective',
    ages: '7–10',
    time: '20 min + next day check',
    materials: ['Dashboard access', 'Paper or spreadsheet'],
    steps: [
      'Look at today’s pressure trend.',
      'Predict tomorrow’s weather: rising, falling or steady.',
      'Write down your prediction and why.',
      'Check tomorrow’s actual weather on the dashboard.',
    ],
    expected: 'Students practise using trends, not single readings, to predict weather.',
    extension: 'Keep a week-long prediction ledger and score it.',
  },
  {
    id: 'rain-per-roof',
    title: 'Rain per roof',
    ages: '9–12',
    time: '30 min',
    materials: ['Rain reading from the dashboard', 'Roof area estimate'],
    steps: [
      'Read today’s rain in mm from the dashboard.',
      'Find the roof area in m².',
      'Multiply area × rain in mm to get litres.',
      'Compare with a big bottle, bathtub or swimming pool for scale.',
    ],
    expected: 'Students connect mm rainfall to real volumes (1 mm = 1 litre per m²).',
    extension: 'Estimate how much rain lands on the whole school grounds.',
  },
  {
    id: 'wind-and-gusts',
    title: 'Wind and gusts',
    ages: 'MYP (11–16)',
    time: '40 min',
    materials: ['Wind speed and gust data over several hours', 'Graph paper or spreadsheet'],
    steps: [
      'Collect wind speed and gust at several times of day.',
      'Compute gust factor = gust ÷ average speed.',
      'Plot gust factor against time of day.',
      'Discuss whether gusts are stronger at certain times.',
    ],
    expected: 'Students see that gusts are a peak over an interval, and compute a simple ratio.',
    extension: 'Compare gust factor during calm, breezy and stormy mock scenarios.',
  },
  {
    id: 'dew-point-and-fog',
    title: 'Dew point and fog',
    ages: 'MYP/DP Physics (14–18)',
    time: '45 min',
    materials: ['Temperature, dew point, and humidity readings'],
    steps: [
      'Find times when temperature and dew point are close.',
      'Read the humidity at those times.',
      'Check the forecast for fog or mist.',
      'Explain why close temperature and dew point suggest fog.',
    ],
    expected: 'Students link dew point to condensation and fog formation.',
    extension: 'Track overnight cooling toward the dew point across a week.',
  },
  {
    id: 'urban-heat',
    title: 'Urban heat',
    ages: 'DP Geography / ESS (16–18)',
    time: '1–2 lessons',
    materials: ['DIS readings vs DWD Dresden values', 'Map of the area'],
    steps: [
      'Compare DIS temperature with DWD Dresden over several days.',
      'Note the biggest differences and when they happen.',
      'Discuss siting, urban heat, shade and time of day.',
      'Write a short explanation for the differences.',
    ],
    expected: 'Students learn why a school station can differ from an official one.',
    extension: 'Investigate how roof, wall and pavement effects change readings.',
  },
  {
    id: 'solar-potential',
    title: 'Solar potential',
    ages: 'DP Physics (16–18)',
    time: '50 min',
    materials: ['Solar W/m² readings', 'Panel efficiency assumption'],
    steps: [
      'Read solar irradiance at several times of day.',
      'Pick a panel efficiency, e.g. 15%.',
      'Estimate energy per m² for one hour at each time.',
      'Discuss when solar panels would produce most.',
    ],
    expected: 'Students connect irradiance to electrical output.',
    extension: 'Model a full day’s energy from a 1 m² panel.',
  },
  {
    id: 'data-science',
    title: 'Data science with CSV',
    ages: 'Maths / CS (14–18)',
    time: '1–2 lessons',
    materials: ['CSV export from /data', 'Spreadsheet or code'],
    steps: [
      'Download a 24h or 7-day CSV.',
      'Compute mean, median and range for temperature or humidity.',
      'Plot temperature vs humidity and look for a pattern.',
      'Discuss whether correlation means cause.',
    ],
    expected: 'Students practise summary statistics and basic regression on real data.',
    extension: 'Try a linear regression of temperature on humidity and interpret the slope.',
  },
  {
    id: 'sensor-accuracy',
    title: 'Sensor accuracy debate',
    ages: 'TOK / Physics (16–18)',
    time: '45 min',
    materials: ['Accuracy figures from the station page', 'Two or more sources of weather data'],
    steps: [
      'Read the station’s stated accuracy for temperature, humidity and rain.',
      'Compare DIS readings with another source.',
      'Discuss what “accurate enough” means for different uses.',
      'Debate how we know a measurement is right.',
    ],
    expected: 'Students practise thinking about uncertainty, calibration and truth in measurement.',
    extension: 'Design a simple check using two nearby thermometers.',
  },
];

export function activityById(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}
