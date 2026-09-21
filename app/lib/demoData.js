/**
 * Sample content for signed-out visitors.
 *
 * Every screen behind a login renders its real UI against this data so people
 * can see what the feature does before making an account. It is deliberately
 * obvious that it is not real: names are generic and ids are prefixed "demo-".
 *
 * Note the `kind` on each entry. Demo listings carry the same OFFICIAL/HIVE
 * split as real ones so previews show the same badges — a preview that hid the
 * distinction would teach people the wrong model of the app.
 */

export const DEMO_CLUBS = [
  {
    kind: "OFFICIAL",
    id: "demo-club-1",
    name: "Sac State Robotics",
    description:
      "We build competition robots and run open workshops on microcontrollers, CAD and machining. No experience needed — most members joined knowing nothing.",
    categories: ["Technology", "Competition"],
    fieldsOfStudy: ["Computer Science", "Mechanical Engineering"],
    points: 320,
    clubUrl: "https://example.edu/robotics",
  },
  {
    kind: "OFFICIAL",
    id: "demo-club-2",
    name: "Hornet Hiking Collective",
    description:
      "Weekend hiking trips most weekends during term. Carpools arranged in the group chat.",
    categories: ["Outdoors", "Social"],
    fieldsOfStudy: ["Open to all majors"],
    points: 275,
    clubUrl: "https://example.edu/hiking",
  },
  {
    kind: "OFFICIAL",
    id: "demo-club-3",
    name: "Capitol Debate Society",
    description:
      "Parliamentary and policy debate, plus mock legislative sessions each spring.",
    categories: ["Academic", "Public Speaking"],
    fieldsOfStudy: ["Political Science", "Communications", "Law"],
    points: 240,
    clubUrl: "https://example.edu/debate",
  },
  {
    kind: "OFFICIAL",
    id: "demo-club-4",
    name: "Delta Film Society",
    description:
      "Weekly screenings and a student short-film festival every April. Equipment lending library for members.",
    categories: ["Arts", "Media"],
    fieldsOfStudy: ["Film", "Design"],
    points: 180,
    clubUrl: "https://example.edu/film",
  },
  {
    kind: "OFFICIAL",
    id: "demo-club-5",
    name: "Hornet Community Garden",
    description:
      "Members get a raised bed, shared tools and far too much zucchini in August.",
    categories: ["Outdoors", "Service"],
    fieldsOfStudy: ["Biology", "Environmental Studies"],
    points: 155,
    clubUrl: null,
  },
  {
    kind: "OFFICIAL",
    id: "demo-club-6",
    name: "Sac State Game Dev",
    description:
      "Game jams once a month, plus an ongoing team project. Artists and writers as welcome as programmers.",
    categories: ["Technology", "Arts"],
    fieldsOfStudy: ["Computer Science", "Art"],
    points: 210,
    clubUrl: "https://example.edu/gamedev",
  },
];

/**
 * Student-made groups shown in previews.
 *
 * These are intentionally small and informal — that is what distinguishes a
 * hive from a recognized club in a student's mind.
 */
export const DEMO_HIVES = [
  {
    kind: "HIVE",
    id: "demo-hive-1",
    name: "Tuesday Night Bouldering",
    description:
      "Six of us climb together most Tuesday evenings. Beginners very welcome, we will teach you.",
    categories: ["Outdoors", "Social"],
    fieldsOfStudy: ["Open to all majors"],
    points: null,
    clubUrl: null,
  },
  {
    kind: "HIVE",
    id: "demo-hive-2",
    name: "CSC 131 Study Crew",
    description:
      "Weekly problem sessions before each exam. Shared notes, no lectures.",
    categories: ["Academic"],
    fieldsOfStudy: ["Computer Science"],
    points: null,
    clubUrl: null,
  },
  {
    kind: "HIVE",
    id: "demo-hive-3",
    name: "Sunrise Run Club",
    description:
      "Early morning runs three times a week. We stop for coffee after, which is honestly the real draw.",
    categories: ["Fitness", "Outdoors"],
    fieldsOfStudy: ["Open to all majors"],
    points: null,
    clubUrl: null,
  },
];

/** Prefilled values for the create-hive form in demo mode. */
export const DEMO_HIVE_DRAFT = {
  name: "Thursday Board Game Night",
  description:
    "We play most Thursday evenings. Bring a game or just show up.",
  categories: "Social, Games",
  fields: "Open to all majors",
  clubUrl: "",
  // Used by the hive editor on /modifyClub.
  email: "boardgames@example.edu",
  tags: ["Board Games", "Social", "Weekly"],
};

/** Listings the demo visitor "belongs to" on /myClubs. */
export const DEMO_MEMBERSHIPS = [
  { id: "demo-mem-1", role: "MEMBER", club: DEMO_CLUBS[0], joinedAt: "2026-01-14T00:00:00.000Z" },
  { id: "demo-mem-2", role: "MEMBER", club: DEMO_CLUBS[1], joinedAt: "2026-02-02T00:00:00.000Z" },
  { id: "demo-mem-3", role: "MEMBER", club: DEMO_CLUBS[4], joinedAt: "2026-03-21T00:00:00.000Z" },
  { id: "demo-mem-4", role: "OFFICER", club: DEMO_HIVES[0], joinedAt: "2026-04-08T00:00:00.000Z" },
  { id: "demo-mem-5", role: "MEMBER", club: DEMO_HIVES[1], joinedAt: "2026-04-30T00:00:00.000Z" },
];

/** Profile shown on /account in demo mode. */
export const DEMO_PROFILE = {
  id: "demo-self",
  username: "demo_hornet",
  firstName: "Sam",
  lastName: "Rivera",
  about:
    "Third-year student. Into hiking, board games and anything with a soldering iron involved. Looking for people to carpool to trailheads with.",
  interests: [
    "Hiking",
    "Board Games",
    "Robotics",
    "Photography",
    "Cooking",
    "Rock Climbing",
    "Video Games",
    "Gardening",
  ],
  memberships: [
    { club: "Sac State Robotics" },
    { club: "Hornet Hiking Collective" },
    { club: "Hornet Community Garden" },
  ],
};

/** Other students shown on /friendFinder in demo mode. */
export const DEMO_FRIENDS = [
  {
    id: "demo-user-1",
    username: "priya_k",
    interests: ["Hiking", "Photography", "Rock Climbing", "Birdwatching", "Yoga"],
    memberships: [
      { club: "Hornet Hiking Collective" },
      { club: "Delta Film Society" },
    ],
  },
  {
    id: "demo-user-2",
    username: "marcus_t",
    interests: ["Robotics", "Video Games", "Board Games", "3D Printing"],
    memberships: [
      { club: "Sac State Robotics" },
      { club: "Sac State Game Dev" },
    ],
  },
  {
    id: "demo-user-3",
    username: "jordan_lee",
    interests: ["Gardening", "Cooking", "Hiking", "Pottery", "Beekeeping"],
    memberships: [
      { club: "Hornet Community Garden" },
      { club: "Hornet Hiking Collective" },
    ],
  },
  {
    id: "demo-user-4",
    username: "alexis_n",
    interests: ["Board Games", "Video Games", "Anime", "Cooking"],
    memberships: [{ club: "Sac State Game Dev" }],
  },
  {
    id: "demo-user-5",
    username: "devon_w",
    interests: ["Robotics", "Photography", "Cycling", "Electronics"],
    memberships: [
      { club: "Sac State Robotics" },
      { club: "Capitol Debate Society" },
    ],
  },
  {
    id: "demo-user-6",
    username: "hana_s",
    interests: ["Rock Climbing", "Hiking", "Cooking", "Language Exchange"],
    memberships: [{ club: "Hornet Hiking Collective" }],
  },
];

/** Rows shown on /clubAdmin in demo mode. */
export const DEMO_ADMIN_CLUBS = [...DEMO_CLUBS, ...DEMO_HIVES];

/** Prefilled values for the create/modify club forms in demo mode. */
export const DEMO_CLUB_DRAFT = {
  name: "Hornet Astronomy Club",
  description:
    "Monthly dark-sky trips to the Sierra foothills and telescope nights on the library roof.",
  categories: "Science, Outdoors",
  fields: "Physics, Astronomy",
  points: "120",
  clubUrl: "https://example.edu/astronomy",
  email: "astronomy@example.edu",
  tags: ["Stargazing", "Camping", "Photography"],
};

/** Prefilled values for the create-event form in demo mode. */
export const DEMO_EVENT_DRAFT = {
  title: "Perseid Meteor Watch",
  description:
    "Carpool out for the peak of the Perseids. Bring a sleeping bag and something warm.",
  // datetime-local format, which is what the create-event form binds to.
  startsAt: "2026-08-12T21:00",
  endsAt: "2026-08-13T01:00",
  location: "Shared with people who mark interest",
  tags: ["Stargazing", "Camping", "Road Trip"],
};

/**
 * Hives the demo visitor is an "officer" of, for the create-event preview.
 * Hives only: official club events are posted on CampusGroups, so they can
 * never appear in this picker.
 */
export const DEMO_OFFICER_HIVES = [DEMO_HIVES[0], DEMO_HIVES[2]];

/**
 * Relative dates so the sample board always shows upcoming events, however
 * long after this file was written someone looks at it.
 */
function daysFromNow(days, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Sample board for /events when the API is unreachable. */
export const DEMO_EVENTS = [
  {
    id: "demo-event-1",
    title: "Intro to Soldering Workshop",
    description:
      "Build a blinking badge in an hour. All tools and parts provided — just show up.",
    location: "Shared with people who mark interest",
    startsAt: daysFromNow(3, 17),
    endsAt: null,
    tags: ["Workshop", "Beginner friendly"],
    cancelledAt: null,
    club: { id: "demo-club-1", name: DEMO_CLUBS[0].name, kind: "OFFICIAL" },
    _count: { interests: 24 },
  },
  {
    id: "demo-event-2",
    title: "Weekend Day Hike",
    description:
      "Eight miles, moderate. Early start. Bring lunch and two litres of water.",
    location: "Meeting point shared with attendees",
    startsAt: daysFromNow(6, 6),
    endsAt: null,
    tags: ["Outdoors", "Carpool"],
    cancelledAt: null,
    club: { id: "demo-club-2", name: DEMO_CLUBS[1].name, kind: "OFFICIAL" },
    _count: { interests: 17 },
  },
  {
    id: "demo-event-3",
    title: "Tuesday Bouldering Session",
    description: "Usual time, usual gym. First-timers get a free shoe rental.",
    location: "Shared with people who mark interest",
    startsAt: daysFromNow(2, 19),
    endsAt: null,
    tags: ["Climbing"],
    cancelledAt: null,
    club: { id: "demo-hive-1", name: DEMO_HIVES[0].name, kind: "HIVE" },
    _count: { interests: 6 },
  },
  {
    id: "demo-event-4",
    title: "CSC 131 Midterm Review",
    description: "Working through last year's exam together. Bring questions.",
    location: "Shared with people who mark interest",
    startsAt: daysFromNow(9, 16),
    endsAt: null,
    tags: ["Study"],
    cancelledAt: null,
    club: { id: "demo-hive-2", name: DEMO_HIVES[1].name, kind: "HIVE" },
    _count: { interests: 11 },
  },
];

/** Sample inbox for the /messages preview. */
export const DEMO_THREADS = [
  {
    id: "demo-thread-1",
    other: { id: "demo-user-1", username: "priya_k" },
    lastMessageAt: daysFromNow(0, 9),
    lastMessage: {
      body: "Are you going on the hike this weekend? I can drive.",
    },
    unread: true,
  },
  {
    id: "demo-thread-2",
    other: { id: "demo-user-2", username: "marcus_t" },
    lastMessageAt: daysFromNow(-1, 14),
    lastMessage: { body: "Thanks for the soldering tips! The badge works 🎉" },
    unread: false,
  },
  {
    id: "demo-thread-3",
    other: { id: "demo-user-6", username: "hana_s" },
    lastMessageAt: daysFromNow(-4, 20),
    lastMessage: { body: "See you Tuesday at the gym." },
    unread: false,
  },
];

/**
 * Rows for the chat map in demo mode.
 *
 * The real page hands <EulerMap> two tables out of the database - people, and
 * one row per person-and-interest - so the preview is built from the students
 * already invented for Friend Finder rather than a second cast. Subjects are
 * lower-cased here because that is the shape the server's canonical names
 * arrive in, and the preview should not flatter the real thing.
 */
const DEMO_CHAT_PEOPLE = [DEMO_PROFILE, ...DEMO_FRIENDS];

export const DEMO_CHAT_ROWS = {
  users: DEMO_CHAT_PEOPLE.map((p) => ({ id: p.id, username: p.username })),
  interests: DEMO_CHAT_PEOPLE.flatMap((p) =>
    (p.interests || []).map((interest) => ({
      user_id: p.id,
      interest: String(interest).toLowerCase(),
    }))
  ),
};

/** A sample conversation in the hiking + photography overlap. */
export const DEMO_CHAT_MESSAGES = [
  {
    id: "demo-msg-1",
    author: "priya_k",
    body: "golden hour at the overlook is about 6:40 this week if anyone wants to shoot it",
    at: new Date(daysFromNow(0, 8)).getTime(),
    mine: false,
  },
  {
    id: "demo-msg-2",
    author: "demo_hornet",
    body: "i can carpool, two seats free",
    at: new Date(daysFromNow(0, 9)).getTime(),
    mine: true,
  },
  {
    id: "demo-msg-3",
    author: "devon_w",
    body: "bringing the long lens, there were kestrels last time",
    at: new Date(daysFromNow(0, 10)).getTime(),
    mine: false,
  },
];
