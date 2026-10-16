import type { Concept } from '@/lib/content/concepts';

export interface QuizQuestion {
  question: string;
  choices: [string, string, string];
  /** Index of the correct choice (0–2). */
  answer: 0 | 1 | 2;
}

export interface TrackNode {
  /** Matches a concept id in `concepts.ts`, the lesson's reading material. */
  id: Concept['id'];
  unit: string;
  quiz: QuizQuestion[];
}

/**
 * Duolingo-style path: one node per measurement, grouped in units, each with
 * a 3-question check. Questions are written from the concept copy so the
 * answers are always findable in the lesson text.
 */
export const TRACK_NODES: TrackNode[] = [
  {
    id: 'temperature',
    unit: 'Warm and cold',
    quiz: [
      {
        question: 'What does air temperature tell us?',
        choices: ['How hot or cold the air is', 'How fast the wind blows', 'How much it will rain'],
        answer: 0,
      },
      {
        question: 'Where must the thermometer sit?',
        choices: ['In direct sunshine', 'Inside a shaded shield', 'Indoors next to a heater'],
        answer: 1,
      },
      {
        question: 'Which unit does our station use for temperature?',
        choices: ['Millimetres', 'Hectopascal', 'Degrees Celsius'],
        answer: 2,
      },
    ],
  },
  {
    id: 'feels-like',
    unit: 'Warm and cold',
    quiz: [
      {
        question: 'Wind usually makes you feel…',
        choices: ['colder than the thermometer says', 'warmer than the thermometer says', 'exactly what the thermometer says'],
        answer: 0,
      },
      {
        question: 'On a hot, humid day you feel…',
        choices: ['cooler than the thermometer says', 'hotter, because sweat cools you less', 'nothing different'],
        answer: 1,
      },
      {
        question: 'Feels-like is worked out from…',
        choices: ['temperature, wind and humidity together', 'temperature alone', 'a second, warmer thermometer'],
        answer: 0,
      },
    ],
  },
  {
    id: 'humidity',
    unit: 'Air and water',
    quiz: [
      {
        question: 'What does 100% humidity mean?',
        choices: ['The air is full of vapour, fog or mist is likely', 'It is definitely raining', 'The air is completely dry'],
        answer: 0,
      },
      {
        question: 'Humidity is measured in…',
        choices: ['degrees', 'percent', 'millimetres'],
        answer: 1,
      },
      {
        question: 'Warm air compared with cold air…',
        choices: ['holds less water vapour', 'holds more water vapour', 'holds exactly the same'],
        answer: 1,
      },
    ],
  },
  {
    id: 'dew-point',
    unit: 'Air and water',
    quiz: [
      {
        question: 'The dew point is the temperature where…',
        choices: ['water boils', 'vapour condenses into droplets', 'wind starts to blow'],
        answer: 1,
      },
      {
        question: 'If temperature and dew point are very close…',
        choices: ['fog or mist is likely', 'a storm is impossible', 'the air is very dry'],
        answer: 0,
      },
      {
        question: 'A high dew point feels…',
        choices: ['fresh and dry', 'sticky and muggy', 'cold and windy'],
        answer: 1,
      },
    ],
  },
  {
    id: 'rain',
    unit: 'Air and water',
    quiz: [
      {
        question: 'One millimetre of rain means…',
        choices: ['one drop per square metre', 'one litre of water per square metre', 'one centimetre of water everywhere'],
        answer: 1,
      },
      {
        question: 'Our tipping bucket tips over with every…',
        choices: ['0.1 mm of rain', '10 mm of rain', 'hour that passes'],
        answer: 0,
      },
      {
        question: 'What is the difference between rate and today?',
        choices: ['They are the same thing', 'Rate is right now, today is the running total', 'Today is a forecast, rate is measured'],
        answer: 1,
      },
    ],
  },
  {
    id: 'wind-speed',
    unit: 'Wind',
    quiz: [
      {
        question: 'What makes the wind blow?',
        choices: ['Differences in air pressure', 'The sun heating thermometers', 'Rain falling down'],
        answer: 0,
      },
      {
        question: 'Our station measures wind speed in…',
        choices: ['millimetres per hour', 'kilometres per hour', 'hectopascal'],
        answer: 1,
      },
      {
        question: 'A gust compared with the average wind is…',
        choices: ['always exactly equal', 'a short peak above the average', 'measured by a different station'],
        answer: 1,
      },
    ],
  },
  {
    id: 'wind-gust',
    unit: 'Wind',
    quiz: [
      {
        question: 'The gust factor is…',
        choices: ['gust speed divided by average speed', 'average speed minus gust speed', 'wind speed times humidity'],
        answer: 0,
      },
      {
        question: 'Gusts are strongest…',
        choices: ['on calm, still days', 'at exactly noon every day', 'on breezy and stormy days'],
        answer: 2,
      },
      {
        question: 'How does the anemometer feel a gust?',
        choices: ['Its cups spin faster for a moment', 'It tips over like a rain bucket', 'Its vane points north'],
        answer: 0,
      },
    ],
  },
  {
    id: 'wind-direction',
    unit: 'Wind',
    quiz: [
      {
        question: 'A direction of 270° means the wind comes from the…',
        choices: ['north', 'east', 'west'],
        answer: 2,
      },
      {
        question: 'The wind vane points…',
        choices: ['away from the wind', 'into the wind', 'always to the north'],
        answer: 1,
      },
      {
        question: 'Wind direction tells us…',
        choices: ['where the air is going to', 'where the air comes from', 'how fast the air moves'],
        answer: 1,
      },
    ],
  },
  {
    id: 'pressure',
    unit: 'Sky and sun',
    quiz: [
      {
        question: 'Falling pressure usually means…',
        choices: ['worse weather is on the way', 'a heatwave is coming', 'nothing at all'],
        answer: 0,
      },
      {
        question: 'Air pressure is measured in…',
        choices: ['degrees Celsius', 'hectopascal', 'millimetres'],
        answer: 1,
      },
      {
        question: 'Our pressure is corrected to…',
        choices: ['mountain-top level', 'sea level', 'rooftop level'],
        answer: 1,
      },
    ],
  },
  {
    id: 'uv-index',
    unit: 'Sky and sun',
    quiz: [
      {
        question: 'At UV index 6 or more you should…',
        choices: ['stay out as long as you like', 'seek shade and wear a hat', 'look directly at the sun'],
        answer: 1,
      },
      {
        question: 'Do clouds block all UV?',
        choices: ['Yes, completely', 'No, only partly', 'Clouds make UV stronger'],
        answer: 1,
      },
      {
        question: 'The UV scale runs…',
        choices: ['from 0 to 100', 'from 0 to 11 and beyond', 'only from 1 to 5'],
        answer: 1,
      },
    ],
  },
  {
    id: 'solar',
    unit: 'Sky and sun',
    quiz: [
      {
        question: 'W/m² measures…',
        choices: ['sun power per square metre', 'heat in the shade', 'hours of sunshine'],
        answer: 0,
      },
      {
        question: 'Solar power is strongest…',
        choices: ['at midnight', 'around midday on a clear day', 'during a thunderstorm'],
        answer: 1,
      },
      {
        question: 'A solar panel on our roof produces most…',
        choices: ['on bright middays', 'on foggy mornings', 'at night from moonlight'],
        answer: 0,
      },
    ],
  },
  {
    id: 'measurement-uncertainty',
    unit: 'Think like a scientist',
    quiz: [
      {
        question: 'An accuracy of ±1 °C means…',
        choices: ['the sensor is always exactly right', 'the true value is within about one degree', 'the sensor is broken'],
        answer: 1,
      },
      {
        question: 'Why can our courtyard differ from the official DWD station?',
        choices: ['Walls, roofs and shade warm or shelter our sensor', 'Our station is always wrong', 'Dresden has no official stations'],
        answer: 0,
      },
      {
        question: 'Two thermometers side by side show slightly different values. That means…',
        choices: ['one of them must be thrown away', 'both can be honest within their accuracy', 'temperature cannot be measured'],
        answer: 1,
      },
    ],
  },
];

export const TRACK_UNITS: string[] = Array.from(
  new Set(TRACK_NODES.map((n) => n.unit))
);

/** XP: 10 per correct answer, all tracked client-side then persisted. */
export const XP_PER_CORRECT = 10;

export function nodeById(id: string): TrackNode | undefined {
  return TRACK_NODES.find((n) => n.id === id);
}

export function nodeIndex(id: string): number {
  return TRACK_NODES.findIndex((n) => n.id === id);
}
