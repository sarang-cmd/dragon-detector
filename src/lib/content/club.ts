// ---------------------------------------------------------------------------
// Weather Station Club content (docs/00 lists "club member names for the
// About page" as an open item — this is that content).
//
// Everything here comes from the club itself or from their CAS presentation.
// Nothing is invented: if a detail is not known, it is not written down.
// Edit this one file to update the /about page and the club card on /station.
// ---------------------------------------------------------------------------

export interface ClubMember {
  name: string;
  /** One line, in the club's own words, on what this person does. */
  role: string;
}

export interface ClubPhoto {
  /** Path under /public. */
  src: string;
  /** Described for screen readers, never "photo". */
  alt: string;
  caption: string;
}

export interface ClubMilestone {
  when: string;
  title: string;
  text: string;
}

export interface ClubTask {
  task: string;
  who: string;
}

export const CLUB = {
  /** Label above the heading on /about. */
  label: 'About · CAS Project',
  title: 'The Weather Station Club',
  intro:
    'Six students, one rooftop sensor array and a lot of lunchtimes. We built the weather station on the school roof, and then we built this website on top of it.',

  started: 'September 2026',
  meeting: 'Mondays at lunchtime',
  supervisors: ['Ms Brodengier', 'Ms Rathod'],

  why: 'All six of us take geography, and all six of us are interested in technology. A weather station was the one project that needed both at once.',

  session:
    'We meet every Monday at lunchtime. A normal session starts with diagnostics — is the console still uploading, do the sensors agree with each other, does the data reaching this site look right — and then we work on the CAS presentation.',

  /** Project goals, from the club's CAS presentation. */
  goals: [
    'Build a working weather station.',
    'Create a website with live data from the station, using API protocols.',
    'Provide the DIS community with the live data.',
    'Educate students and teachers in how to use the weather station.',
  ],

  /** Personal goals, from the same presentation. */
  personalGoals: [
    'Public speaking — standing up and explaining it.',
    'Time management',
    'Working with teachers and students to communicate information',
    'Group working',
  ],

  hardest: {
    question: 'The hardest part so far',
    answer:
      'Setting up the station and connecting everything. Getting the console online and the API talking to our own code took the longest.',
  },

  proudest: {
    question: 'What we are most proud of',
    answer: 'Getting the website to work — seeing our own roof as live numbers on a screen.',
  },

  members: [
    {
      name: 'Sarang',
      role: 'Code, APIs and backend: connected the station, built this website, and shoots the photos and video.',
    },
    {
      name: 'Lev',
      role: 'School TV posters and slides, and connecting us to the wider network of stations from the manual.',
    },
    {
      name: 'Alexander',
      role: 'Diagnostics on the station and work on the CAS presentation.',
    },
    {
      name: 'Luke',
      role: 'Writing to the school marketing team about the station.',
    },
    {
      name: 'Yusei',
      role: 'Getting the station linked from the school website.',
    },
    {
      name: 'Elisabeth',
      role: 'Diagnostics, and the reflections for our CAS portfolio.',
    },
  ] satisfies ClubMember[],

  /** What happens next — teaching the school how to use it. */
  next: [
    { task: 'Posters and slides for the school TV screens', who: 'Lev, Yue and Yusei' },
    { task: 'Get the station linked from the school website', who: 'Yusei' },
    { task: 'Photos and a short video for Instagram', who: 'Sarang' },
    { task: 'Email the school marketing team', who: 'Luke' },
    { task: 'Join the wider network of weather stations from the manual', who: 'Lev' },
  ] satisfies ClubTask[],

  milestones: [
    {
      when: 'September 2026',
      title: 'The club starts',
      text: 'Six of us meet for the first time and take the weather station on as our CAS project.',
    },
    {
      when: 'Autumn 2026',
      title: 'The station goes up',
      text: 'The WS3500 is mounted on the roof, levelled, and starts reporting to the console.',
    },
    {
      when: 'Autumn 2026',
      title: 'The data becomes ours',
      text: 'Instead of living only in the Ecowitt app, the readings start flowing through our own API and into this site.',
    },
    {
      when: 'Now',
      title: 'The website is live',
      text: 'Live readings, history and charts, a student guide, and a statistics page — all from the roof.',
    },
  ] satisfies ClubMilestone[],
};

export const CLUB_MEMBERS: ClubMember[] = CLUB.members;

/**
 * Photos of the club and the station. Drop the file in `public/club/` and add
 * a line here — the About page picks it up, no layout code needed.
 */
export const CLUB_PHOTOS: ClubPhoto[] = [
  {
    src: '/club/club-01.jpg',
    alt: 'The weather station club at work',
    caption: 'The club at work on the station.',
  },
  {
    src: '/club/club-03.jpg',
    alt: 'A weather station club session',
    caption: 'A club session during the project.',
  },
];
