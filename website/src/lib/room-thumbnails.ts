import homeSmall from "@/assets/thumbnails/full-home-160.webp";
import homeLarge from "@/assets/thumbnails/full-home-320.webp";
import kitchenSmall from "@/assets/thumbnails/kitchen-160.webp";
import kitchenLarge from "@/assets/thumbnails/kitchen-320.webp";
import wardrobeSmall from "@/assets/thumbnails/wardrobe-160.webp";
import wardrobeLarge from "@/assets/thumbnails/wardrobe-320.webp";
import bedroomSmall from "@/assets/thumbnails/bedroom-160.webp";
import bedroomLarge from "@/assets/thumbnails/bedroom-320.webp";
import livingSmall from "@/assets/thumbnails/living-160.webp";
import livingLarge from "@/assets/thumbnails/living-320.webp";
import kidsSmall from "@/assets/thumbnails/kids-160.webp";
import kidsLarge from "@/assets/thumbnails/kids-320.webp";
import poojaSmall from "@/assets/thumbnails/pooja-160.webp";
import poojaLarge from "@/assets/thumbnails/pooja-320.webp";
import officeSmall from "@/assets/thumbnails/office-160.webp";
import officeLarge from "@/assets/thumbnails/office-320.webp";

const pairs: Record<string, [string, string]> = {
  "full-home": [homeSmall, homeLarge],
  kitchen: [kitchenSmall, kitchenLarge],
  wardrobe: [wardrobeSmall, wardrobeLarge],
  bedroom: [bedroomSmall, bedroomLarge],
  living: [livingSmall, livingLarge],
  kids: [kidsSmall, kidsLarge],
  pooja: [poojaSmall, poojaLarge],
  office: [officeSmall, officeLarge],
};

export function roomThumbnail(slug: string) {
  const pair = pairs[slug];
  return pair ? { src: pair[0], srcSet: `${pair[0]} 160w, ${pair[1]} 320w` } : undefined;
}
