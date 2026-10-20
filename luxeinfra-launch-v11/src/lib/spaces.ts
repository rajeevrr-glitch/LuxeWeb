import kitchen from "@/assets/kitchen.jpg";
import bedroom from "@/assets/bedroom.jpg";
import living from "@/assets/living.jpg";
import bathroom from "@/assets/bathroom.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import dining from "@/assets/dining.jpg";
import kids from "@/assets/kids.jpg";
import office from "@/assets/office.jpg";
import pooja from "@/assets/pooja.jpg";
import foyer from "@/assets/foyer.jpg";
import fullHome from "@/assets/full-home.jpg";
export const spaces = [
  {
    slug: "kitchen",
    title: "Kitchens",
    image: kitchen,
    group: "Everyday living",
    room: "Kitchen",
    line: "Made for your everyday rituals.",
    intro:
      "From the first cup of tea to the last conversation of the evening. Start with the way you cook, move, and gather.",
    consider: [
      "Your cooking routine and appliance positions",
      "Storage for the things you reach for most",
      "Lighting, worktops, and finishes to discuss",
    ],
  },
  {
    slug: "living",
    title: "Living rooms",
    image: living,
    group: "Everyday living",
    room: "Living & dining",
    line: "Room to come together.",
    intro:
      "A favourite seat. A place to host. A quieter corner. Bring comfort and your daily routines into one room.",
    consider: [
      "Seating and circulation around the room",
      "TV position, cables, and useful storage",
      "Lighting for gathering, reading, and relaxing",
    ],
  },
  {
    slug: "bedroom",
    title: "Bedrooms",
    image: bedroom,
    group: "Personal spaces",
    room: "Master bedroom",
    line: "A softer end to your day.",
    intro:
      "Consider the room from morning to night: where you dress, what you store, and how you wind down.",
    consider: [
      "Bed position and room to move",
      "Wardrobe access and bedside essentials",
      "Privacy, curtains, and different lighting needs",
    ],
  },
  {
    slug: "wardrobe",
    title: "Wardrobes & storage",
    image: wardrobe,
    group: "Personal spaces",
    room: "Master bedroom",
    line: "A place for everything you keep.",
    intro:
      "Good storage begins with what belongs inside. Think beyond the doors to the everyday routine.",
    consider: [
      "Hanging, folded items, and accessories",
      "Door movement and available clearance",
      "Internal divisions, hardware, and finish options",
    ],
  },
  {
    slug: "dining",
    title: "Dining rooms",
    image: dining,
    group: "Everyday living",
    room: "Living & dining",
    line: "For meals that become moments.",
    intro:
      "Plan for the ordinary weekday and the extra guests. A dining space should make both feel easy.",
    consider: [
      "Daily seating and occasional guests",
      "Movement around the table",
      "Crockery storage and lighting above the table",
    ],
  },
  {
    slug: "bathroom",
    title: "Bathrooms",
    image: bathroom,
    group: "Personal spaces",
    room: "Bathrooms",
    line: "A small space, thoughtfully considered.",
    intro:
      "Start with the practical details of a bathroom: fixtures, storage, ventilation, and maintenance.",
    consider: [
      "Existing plumbing and site conditions",
      "Wet areas, ventilation, and accessible storage",
      "Tile, fitting, and lighting preferences",
    ],
  },
  {
    slug: "kids",
    title: "Children’s rooms",
    image: kids,
    group: "Personal spaces",
    room: "Other bedrooms",
    line: "Space for their next chapter.",
    intro:
      "A room to sleep, play, learn, and grow. Tell us how the space needs to adapt as routines change.",
    consider: [
      "Sleep, study, and play zones",
      "Reachable storage and room to move",
      "Age-appropriate furniture and changing needs",
    ],
  },
  {
    slug: "office",
    title: "Home offices",
    image: office,
    group: "Purposeful corners",
    room: "Home office",
    line: "Make a little room for focus.",
    intro:
      "A dedicated room or a corner of the home. Begin with the equipment, light, and storage your work needs.",
    consider: [
      "Desk position and natural light",
      "Power points, equipment, and cables",
      "Storage and a background for video calls",
    ],
  },
  {
    slug: "pooja",
    title: "Pooja spaces",
    image: pooja,
    group: "Purposeful corners",
    room: "Pooja space",
    line: "A moment of quiet, every day.",
    intro:
      "A personal space shaped around your traditions. Share your preferences for placement and the way you use it.",
    consider: [
      "Your preferred location and daily rituals",
      "Storage, display, and seating needs",
      "Materials, lighting, and ventilation",
    ],
  },
  {
    slug: "foyer",
    title: "Entrances & foyers",
    image: foyer,
    group: "Purposeful corners",
    room: "Other space",
    line: "The first feeling of being home.",
    intro:
      "Make arriving home feel effortless, with somewhere for the things that come through the door with you.",
    consider: [
      "Clear circulation at the entrance",
      "Shoes, keys, bags, and everyday storage",
      "Lighting, mirror placement, and first impressions",
    ],
  },
  {
    slug: "full-home",
    title: "Whole homes",
    image: fullHome,
    group: "Whole home",
    room: "",
    line: "One home. A connected story.",
    intro:
      "Bring the big picture and the small details together. Connect rooms through the way you live and the finishes you love.",
    consider: [
      "How every room works with the next",
      "A shared material and colour direction",
      "Priorities, scope, and the sequence of work",
    ],
  },
];
const images = import.meta.glob("/src/assets/ideas/**/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
export const designsFor = (slug: string) =>
  Object.entries(images)
    .filter(([key]) => key.startsWith(`/src/assets/ideas/${slug}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, image], i) => ({
      id: `${slug}-${i + 1}`,
      title: `${spaces.find((s) => s.slug === slug)?.title || slug} · ${String(i + 1).padStart(2, "0")}`,
      image,
    }));
