export type MaterialBrandCategory =
  | "Boards & panels"
  | "Hardware"
  | "Paint & bath"
  | "Appliances & cooling";

// Logos sourced from the manufacturers' public websites on 24–25 October 2026.
// These identify specification options; they do not establish a dealership or partnership.
export const materialBrands: {
  id: string;
  name: string;
  category: MaterialBrandCategory;
  image: string;
  detail: string;
  question: string;
  website: string;
  logoSource: string;
}[] = [
  {
    id: "greenply",
    name: "Greenply",
    category: "Boards & panels",
    image: "/brands/greenply.webp",
    detail: "Plywood and board options for cabinetry, furniture and interior construction.",
    question: "Ask us to name the product, grade and thickness for each cabinet.",
    website: "https://www.greenply.com/",
    logoSource: "https://www.greenply.com/assets/images/logo.svg",
  },
  {
    id: "greenpanel",
    name: "Greenpanel",
    category: "Boards & panels",
    image: "/brands/greenpanel.webp",
    detail: "MDF, pre-laminated boards and wood-panel options for your specification.",
    question: "Compare the exact board grade with the room and its intended application.",
    website: "https://www.greenpanel.com/",
    logoSource: "https://www.greenpanel.com/images/logo-Greenpanel.png",
  },
  {
    id: "centuryply",
    name: "CenturyPly",
    category: "Boards & panels",
    image: "/brands/centuryply.webp",
    detail: "Plywood, laminates and panel products to consider for furniture and finishes.",
    question: "Choose the board and finish together, with product codes in your quote.",
    website: "https://www.centuryply.com/",
    logoSource: "https://www.centuryply.com/img/logo-new.png",
  },
  {
    id: "hettich",
    name: "Hettich",
    category: "Hardware",
    image: "/brands/hettich.webp",
    detail: "Furniture fittings, drawer systems and storage hardware for everyday use.",
    question: "Ask for hinge and runner models, quantities and the accessories included.",
    website: "https://www.hettich.com/en-in/",
    logoSource:
      "https://web.hettich.com/typo3conf/ext/hettich/Resources/Public/Images/Hettich_logo_sw.svg",
  },
  {
    id: "asian-paints",
    name: "Asian Paints",
    category: "Paint & bath",
    image: "/brands/asian-paints.webp",
    detail: "Wall paints, colours and surface finishes to bring the palette together.",
    question: "Review a physical colour sample, finish and the surface preparation included.",
    website: "https://www.asianpaints.com/",
    logoSource:
      "https://www.asianpaints.com/etc.clientlibs/apcolourcatalogue/clientlibs/clientlib-global-unification/resources/images/header/asian-paints-logo.webp",
  },
  {
    id: "jaquar",
    name: "Jaquar",
    category: "Paint & bath",
    image: "/brands/jaquar.webp",
    detail: "Bathroom fittings and fixtures to discuss alongside the plumbing layout.",
    question: "Confirm the fixture models, finish, installation needs and inclusions.",
    website: "https://www.jaquar.com/",
    logoSource: "https://www.jaquar.com/Themes/Jaquar2025_V1/Content/images/logo.svg",
  },
  {
    id: "hitachi",
    name: "Hitachi",
    category: "Appliances & cooling",
    image: "/brands/hitachi.webp",
    detail: "Air-conditioning options to coordinate with your room and electrical planning.",
    question: "Discuss the required capacity, unit locations and installation scope first.",
    website: "https://www.hitachiaircon.com/in/",
    logoSource: "https://www.hitachi.com/content/dam/hitachi/common/image/hitachi-logo.png",
  },
  {
    id: "samsung",
    name: "Samsung",
    category: "Appliances & cooling",
    image: "/brands/samsung.webp",
    detail: "Home appliances and display options to plan into cabinetry and living spaces.",
    question: "Confirm appliance dimensions, ventilation and the exact model before fabrication.",
    website: "https://www.samsung.com/in/",
    logoSource: "https://www.samsung.com/in/ (inline header SVG wordmark)",
  },
  {
    id: "godrej",
    name: "Godrej",
    category: "Hardware",
    image: "/brands/godrej.webp",
    detail: "Furniture fittings, locks and storage options to discuss for your home or workspace.",
    question:
      "Confirm the exact product, finish, installation scope and manufacturer terms in your quote.",
    website: "https://www.godrejenterprises.com/furniture",
    logoSource: "https://www.godrejenterprises.com/ (inline header SVG wordmark)",
  },
  {
    id: "bosch",
    name: "Bosch",
    category: "Appliances & cooling",
    image: "/brands/bosch.webp",
    detail: "Kitchen and home-appliance options to coordinate with the way you use your space.",
    question: "Check cut-outs, clearances, service access and what the quotation covers.",
    website: "https://www.bosch-home.in/",
    logoSource: "https://www.bosch-home.in/marketing-app/_next/static/media/bosch.777c3df3.svg",
  },
];
