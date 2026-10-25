// Publish only approved, attributable content with permission to use the words/images.
// Keep these arrays empty until the owner supplies verified content.
export type ProjectStory = {
  id: string;
  approved: boolean;
  imagePermission: boolean;
  title: string;
  city: string;
  image: string;
  imageAlt: string;
  scope: string;
  story: string;
};
export type ClientReview = {
  id: string;
  approved: boolean;
  publicationConsent: boolean;
  name: string;
  city: string;
  quote: string;
  scope: string;
};
export const projectStories: ProjectStory[] = [];
export const clientReviews: ClientReview[] = [];
export const clientReferences = [
  {
    id: "harsh-pal",
    name: "Harsh Pal",
    city: "Gomti Nagar, Lucknow",
  },
  {
    id: "tanishq-yadav",
    name: "Tanishq Yadav",
    city: "Hazratganj, Lucknow",
  },
  {
    id: "dharmendra-singh",
    name: "Dharmendra Singh",
    city: "Jubilee, Gorakhpur",
  },
  {
    id: "gyanendra-rai",
    name: "Gyanendra Rai",
    city: "Palm Paradise, Gorakhpur",
  },
  {
    id: "rajnikant-rai",
    name: "Rajnikant Rai",
    city: "Omaxe, Prayagraj",
  },
] as const;
export const publishedProjects = projectStories.filter(
  (p) => p.approved && p.imagePermission && p.title && p.image && p.story,
);
export const publishedReviews = clientReviews.filter(
  (r) => r.approved && r.publicationConsent && r.name && r.quote,
);
