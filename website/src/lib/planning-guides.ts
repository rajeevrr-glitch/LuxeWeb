import living from "@/assets/living.jpg";
import dining from "@/assets/dining.jpg";
import kitchen from "@/assets/kitchen.jpg";
import bedroom from "@/assets/bedroom.jpg";

export type PlanningGuide = {
  slug: string;
  category: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  intro: string;
  takeaway: string;
  sections: { id: string; title: string; text: string; points: string[] }[];
  checklist: string[];
  quoteScope: "Need guidance" | "Kitchen" | "Renovation";
  nextStep: string;
};

export const planningGuides: PlanningGuide[] = [
  {
    slug: "first-design-conversation",
    category: "Getting started",
    title: "A better first design conversation.",
    description:
      "Bring a few useful details. Leave room for the questions you haven’t answered yet.",
    image: living,
    imageAlt: "Living room inspiration with seating and storage",
    intro:
      "You don’t need a finished moodboard to speak to a designer. Start with how you live, what is getting in the way and what you would like to change.",
    takeaway:
      "A useful first brief fits on one page: your space, your priorities and your questions.",
    sections: [
      {
        id: "your-space",
        title: "Give the room some context.",
        text: "A layout and a few everyday observations are more useful than a perfect presentation.",
        points: [
          "Note the city, property type and whether the space is new, occupied or being renovated.",
          "Bring an available floor plan, or rough room dimensions with doors and windows marked. Exact dimensions still need checking.",
          "Take a wide photograph and a closer view of anything you want to retain, such as furniture or existing storage.",
        ],
      },
      {
        id: "your-priorities",
        title: "Separate the essential from the lovely-to-have.",
        text: "Describe the problem before choosing its solution. “We need a place for school bags” is a useful design starting point.",
        points: [
          "List the three changes that would make the biggest difference to daily life.",
          "Identify furniture, appliances and finishes you intend to keep.",
          "Choose a few reference images and add what you like about each: the layout, colour, storage or atmosphere.",
        ],
      },
      {
        id: "your-questions",
        title: "Make the next step explicit.",
        text: "Finish the conversation with a shared understanding of what needs to happen before you decide.",
        points: [
          "Share a comfortable budget range, a preferred completion date and any hard constraints. Ask what can be assessed at this stage.",
          "Ask what the next consultation covers and whether any design, visit or measurement charges apply.",
          "Confirm who will provide the next information and what decisions remain open.",
        ],
      },
    ],
    checklist: [
      "My three priorities",
      "A plan, rough measurements or room photos",
      "What I want to keep",
      "Questions about scope, charges and next steps",
    ],
    quoteScope: "Need guidance",
    nextStep: "Bring your priorities to the studio.",
  },
  {
    slug: "compare-interior-quotes",
    category: "Making a decision",
    title: "Compare the scope. Then the price.",
    description:
      "A practical way to put two interior quotations side by side without missing the small print.",
    image: dining,
    imageAlt: "Dining room inspiration with a table and fitted display storage",
    intro:
      "Two totals can look comparable while describing different work. First align the rooms, quantities and specifications. Then look at the commercial terms.",
    takeaway: "If a line is missing, mark it “to be confirmed”. A blank is not an inclusion.",
    sections: [
      {
        id: "same-scope",
        title: "Start with the same list of work.",
        text: "Use one room-by-room list for every quote. Keep additions and alternatives separate from the agreed base scope.",
        points: [
          "Match units, quantities and measurements for each item. Check how each vendor measures the work.",
          "Ask whether design, delivery, installation, removal of existing work and site preparation are included.",
          "Write down exclusions, work by other contractors and items you are supplying yourself.",
        ],
      },
      {
        id: "same-detail",
        title: "Replace broad labels with named details.",
        text: "Words such as premium or standard are difficult to compare on their own. Request a written specification for the selected option.",
        points: [
          "Compare board, finish and hardware product names, models and relevant dimensions rather than package names alone.",
          "Check visible and internal finishes, accessories, handles and installation details separately.",
          "Ask to review relevant samples, drawings and product information before approving the specification.",
        ],
      },
      {
        id: "commercial-terms",
        title: "Read the amount together with the terms.",
        text: "A lower headline figure does not answer how changes, payments or aftercare will work.",
        points: [
          "Check taxes, optional items, quote validity and any conditions attached to an offer.",
          "Request payment milestones, change approval rules and the basis for any revised price in writing.",
          "Compare the actual warranty and support terms, including exclusions and the contact process.",
        ],
      },
    ],
    checklist: [
      "Matching rooms, items and quantities",
      "Named materials, finishes and hardware",
      "Inclusions, exclusions and taxes",
      "Payment, changes and support terms",
    ],
    quoteScope: "Need guidance",
    nextStep: "Discuss the scope you want priced.",
  },
  {
    slug: "plan-your-kitchen",
    category: "Room by room",
    title: "Plan the kitchen around your day.",
    description:
      "Think through cooking, appliances and storage before deciding on doors and finishes.",
    image: kitchen,
    imageAlt: "Kitchen inspiration showing cabinets, counter space and an island",
    intro:
      "The right starting point is an ordinary day: who cooks, how groceries arrive, where preparation happens and what needs to be easy to reach.",
    takeaway:
      "Keep appliance details and existing service points with the layout. They influence more than the cabinet colour.",
    sections: [
      {
        id: "daily-routine",
        title: "Describe how the kitchen is used.",
        text: "A kitchen for two occasional cooks may need a different conversation from one used by a busy household throughout the day.",
        points: [
          "Note who cooks, how often, and whether more than one person works in the kitchen together.",
          "List daily appliances and what currently takes over the counter.",
          "Identify the awkward moments: unloading groceries, preparing meals, washing up or finding the right utensils.",
        ],
      },
      {
        id: "layout-information",
        title: "Collect the details that affect the layout.",
        text: "Record what is there before assuming it can move. Proposed changes to services need a professional review.",
        points: [
          "Mark doors, windows, columns and existing water, drainage, electrical, gas and ventilation points on the available plan.",
          "List appliance models you own or intend to buy, including dimensions and manufacturer installation information.",
          "Discuss appliance access, door movement, working space and maintenance access before finalising drawings.",
        ],
      },
      {
        id: "storage-and-scope",
        title: "Give every storage choice a purpose.",
        text: "Build the storage list from your belongings and habits. Discuss accessories after deciding what each cabinet needs to hold.",
        points: [
          "Group what you store: provisions, utensils, cookware, small appliances and cleaning supplies.",
          "Bring photographs of items that need particular space or access.",
          "Ask for a clear list of cabinets, internal fittings, worktop, backsplash, appliances and site work included in the quotation.",
        ],
      },
    ],
    checklist: [
      "My cooking and storage priorities",
      "Available layout and existing service points",
      "Appliance models and installation information",
      "Items and site work to include in the quote",
    ],
    quoteScope: "Kitchen",
    nextStep: "Start with your kitchen priorities.",
  },
  {
    slug: "renovation-priorities",
    category: "Renovating",
    title: "A renovation with clearer priorities.",
    description: "Decide what to retain, what to review and what can wait before work starts.",
    image: bedroom,
    imageAlt: "Bedroom inspiration with a bed, wardrobe and soft furnishings",
    intro:
      "A renovation begins with the existing space. Document its condition, separate urgent concerns from visual changes and discuss dependencies before agreeing the work.",
    takeaway:
      "Decide the order of decisions before the order of finishes. Some changes affect several trades at once.",
    sections: [
      {
        id: "condition-and-retain",
        title: "Take stock before making a wishlist.",
        text: "Use photographs and a room list to explain what you have noticed. Ask qualified professionals to assess concerns that need investigation.",
        points: [
          "Record visible damage, leaks or recurring problems and ask what checks are needed before a proposed finish or cabinet goes over them.",
          "Separate items to retain, repair, replace or decide later.",
          "Identify furnishings and personal belongings that need protection or temporary storage during work.",
        ],
      },
      {
        id: "scope-and-dependencies",
        title: "Map the work that connects.",
        text: "A cabinet change may involve more than carpentry. Review the whole scope together so each contractor knows where their work starts and ends.",
        points: [
          "Discuss connections between removal, repairs, service changes, flooring, paint and new installations.",
          "Confirm who handles site permissions, access, debris removal and coordination with the building or society.",
          "Ask which decisions and checks must be completed before work is scheduled.",
        ],
      },
      {
        id: "phasing-and-changes",
        title: "Make a plan for the unknowns.",
        text: "Existing conditions may become clearer during a review or after opening up work. Agree how new findings will be discussed before extra work proceeds.",
        points: [
          "Separate essential work from upgrades you could do later and ask about the effect of splitting the work into phases.",
          "Discuss occupancy, access hours and which everyday facilities must remain available.",
          "Confirm how discoveries, revised scope, additional costs and schedule changes require your approval.",
        ],
      },
    ],
    checklist: [
      "Photos and a retain / repair / replace list",
      "Concerns for a professional review",
      "Access, occupancy and building requirements",
      "How changes will be priced and approved",
    ],
    quoteScope: "Renovation",
    nextStep: "Talk through your renovation scope.",
  },
];

export const planningGuideSummaries = planningGuides.map(
  ({ slug, category, title, description, image, imageAlt }) => ({
    slug,
    category,
    title,
    description,
    image,
    imageAlt,
  }),
);

export function planningGuideText(guide: PlanningGuide, checked: readonly number[]) {
  const checkedItems = new Set(checked);
  return [
    `LuxeInfra planning guide: ${guide.title}`,
    `https://luxeinfra.in/guides/${guide.slug}`,
    "",
    guide.intro,
    "",
    ...guide.sections.flatMap((section) => [
      section.title,
      section.text,
      ...section.points.map((point) => `- ${point}`),
      "",
    ]),
    "MY PREPARATION CHECKLIST",
    ...guide.checklist.map((item, index) => `${checkedItems.has(index) ? "[x]" : "[ ]"} ${item}`),
    "",
    "These are general planning prompts. The scope, suitability, price and terms of your project need a separate review.",
  ].join("\n");
}
