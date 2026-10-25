export type PortfolioCategory = "Bedrooms" | "Living spaces" | "Kitchens" | "Walkthroughs";
export type PortfolioMedia = {
  id: string;
  kind: "photo" | "video";
  category: PortfolioCategory;
  title: string;
  description: string;
  src: string;
  thumbnail?: string;
  width: number;
  height: number;
  duration?: string;
  clientId?: string;
  location?: string;
};

// Owner-supplied portfolio views. Photo-to-client mapping is still unconfirmed.
const photoData = [
  [
    "bedroom-seating",
    "Bedrooms",
    "A bedroom with room to unwind",
    "Bedroom seating with a green sofa, a curved headboard and illuminated wall panels.",
    960,
    1280,
  ],
  [
    "curved-headboard",
    "Bedrooms",
    "The headboard as a focal point",
    "A curved green headboard, upholstered bed and patterned feature wall.",
    720,
    1280,
  ],
  [
    "green-seating",
    "Living spaces",
    "A quiet seating corner",
    "Green upholstered seating, nesting tables and vertical lighting beside a bedroom.",
    720,
    1280,
  ],
  [
    "blush-kitchen",
    "Kitchens",
    "A softer palette for the kitchen",
    "Blush-coloured kitchen cabinetry, glazed upper cupboards and a lit worktop.",
    720,
    1280,
  ],
  [
    "warm-bedroom",
    "Bedrooms",
    "Warm light, restful tones",
    "An upholstered bed, bedside lighting and full-height curtains in a warm bedroom.",
    720,
    1280,
  ],
  [
    "kitchen-wide-view",
    "Kitchens",
    "Storage along the whole wall",
    "A wider view of blush kitchen cabinets and the continuous illuminated counter.",
    720,
    1280,
  ],
  [
    "living-corner",
    "Living spaces",
    "A place to sit together",
    "A compact living area with upholstered seating, a coffee table and a pendant light.",
    720,
    1280,
  ],
  [
    "living-pendant",
    "Living spaces",
    "Small space, considered details",
    "A front view of the living seating, pendant light and a light-coloured coffee table.",
    720,
    1280,
  ],
  [
    "bedroom-lighting",
    "Bedrooms",
    "An everyday retreat",
    "A bedroom with a padded headboard, grey bedding, warm bedside lighting and curtains.",
    720,
    1280,
  ],
  [
    "kitchen-storage-detail",
    "Kitchens",
    "Making storage work harder",
    "Open upper kitchen cupboards showing a dish rack and cookware storage.",
    1280,
    720,
  ],
  [
    "kitchen-worktop-detail",
    "Kitchens",
    "The details at worktop level",
    "Kitchen worktop and sink details with a dark veined splashback and open storage.",
    720,
    1280,
  ],
] as const;

export const portfolioMedia: PortfolioMedia[] = [
  ...photoData.map(([id, category, title, description, width, height]) => ({
    id,
    kind: "photo" as const,
    category,
    title,
    description,
    src: `/projects/${id}.webp`,
    thumbnail: `/projects/${id}-small.webp`,
    width,
    height,
  })),
  {
    id: "harsh-pal-walkthrough",
    kind: "video",
    category: "Walkthroughs",
    title: "Harsh Pal · A look inside",
    clientId: "harsh-pal",
    location: "Gomti Nagar, Lucknow",
    description:
      "Project film shared by LuxeInfra for Harsh Pal, Gomti Nagar, Lucknow. Use the controls to play the film.",
    src: "/projects/harsh-pal-walkthrough.mp4",
    width: 1024,
    height: 576,
    duration: "7 sec",
  },
  {
    id: "dharmendra-singh-walkthrough",
    kind: "video",
    category: "Walkthroughs",
    title: "Dharmendra Singh · A look inside",
    clientId: "dharmendra-singh",
    location: "Jubilee, Gorakhpur",
    description:
      "Project film shared by LuxeInfra for Dharmendra Singh, Jubilee, Gorakhpur. Sound is initially off; enable it using the controls.",
    src: "/projects/dharmendra-singh-walkthrough.mp4",
    width: 464,
    height: 832,
    duration: "12 sec",
  },
];

export const portfolioHighlights = ["bedroom-seating", "blush-kitchen", "living-corner"];
export const portfolioClientFilms = portfolioMedia.filter((item) => item.clientId);
