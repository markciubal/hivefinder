export const friendFinderSampleSelf = {
  id: "guest-demo",
  username: "Guest Explorer",
  about: "Exploring clubs and new connections.",
  interests: ["Photography", "Board games", "Art", "Baking", "Basketball"],
  memberships: [
    { club: "Photography Club" },
    { club: "Data Science Club" },
    { club: "American Society of Mechanical Engineers" },
  ],
  contactMethods: [
    { type: "EMAIL", value: "guest@example.com", preferred: true, visible: true },
  ],
};

export const friendFinderSampleFriends = [
  {
    id: "demo-1",
    username: "Avery",
    about: "Film enthusiast and weekend hiker.",
    interests: ["Photography", "Hiking", "Books"],
    memberships: [{ club: "Photography Club" }],
    contactMethods: [
      { type: "DISCORD", value: "@avery", preferred: true, visible: true },
    ],
  },
  {
    id: "demo-2",
    username: "Jordan",
    about: "Building things with code and circuits.",
    interests: ["Basketball", "Board games", "3D printing"],
    memberships: [{ club: "Data Science Club" }],
    contactMethods: [
      { type: "EMAIL", value: "jordan@example.com", preferred: true, visible: true },
    ],
  },
  {
    id: "demo-3",
    username: "Priya",
    about: "Calligraphy and baking make the best weekends.",
    interests: ["Art", "Baking", "Calligraphy"],
    memberships: [{ club: "The French Connections" }],
    contactMethods: [
      { type: "OTHER", label: "Telegram", value: "@priya", preferred: true, visible: true },
    ],
  },
  {
    id: "demo-4",
    username: "Mateo",
    about: "Jazz fan with a soft spot for board games.",
    interests: ["Photography", "Board games", "Books"],
    memberships: [{ club: "Jazz Club" }],
    contactMethods: [
      { type: "PHONE", value: "+1 555 555 1122", preferred: true, visible: true },
    ],
  },
  {
    id: "demo-5",
    username: "Sam",
    about: "Mechanical engineering and hiking are my jam.",
    interests: ["Basketball", "Hiking", "Board games"],
    memberships: [{ club: "American Society of Mechanical Engineers" }],
    contactMethods: [],
  },
  {
    id: "demo-6",
    username: "Riley",
    about: "Books, art, and making things.",
    interests: ["Art", "Books", "Photography"],
    memberships: [{ club: "Girls Who Code" }],
    contactMethods: [
      { type: "DISCORD", value: "@riley", preferred: true, visible: true },
    ],
  },
  {
    id: "demo-7",
    username: "Chen",
    about: "Coffee, baking, and data science.",
    interests: ["Baking", "Board games", "Photography"],
    memberships: [{ club: "Data Science Club" }],
    contactMethods: [
      { type: "EMAIL", value: "chen@example.com", preferred: true, visible: true },
    ],
  },
];
