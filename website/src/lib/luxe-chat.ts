import { business, serviceAreaSummary } from "./business.ts";
import { materialBrands } from "./material-brands.ts";
import { publishedProjects, publishedReviews } from "./owner-content.ts";
import { pricingIsReady, renovationPricingIsReady } from "./journey.ts";
import { buildLuxeChatKnowledge } from "./luxe-knowledge.ts";
import { luxeChatCopy } from "./luxe-chat-copy.ts";
import { portfolioMedia } from "./portfolio.ts";
import { businessProof } from "./business-proof.ts";

export type LuxeChatAction = {
  label: string;
  to:
    | "/callback"
    | "/estimate"
    | "/materials"
    | "/reimagine"
    | "/contact"
    | "/design-ideas"
    | "/find-your-style"
    | "/my-inspiration"
    | "/how-it-works"
    | "/guides"
    | "/partner-with-us"
    | "/privacy"
    | "/projects"
    | "/testimonials"
    | "/services";
  // Campaign links remain on-site.
  commercial?: boolean;
  commercialType?: "Office" | "Shop / showroom" | "Hospitality";
};
export type LuxeChatReply = { text: string; actions: LuxeChatAction[] };
type ChatLanguage = "en" | "hi" | "hinglish";
type Topic = keyof typeof luxeChatCopy;

export const luxeSuggestions = [
  "Plan my home",
  "A commercial space",
  "What will it cost?",
  "Find my style",
];
const quote: LuxeChatAction = { label: "Get a personal quote", to: "/callback" };
const browse: LuxeChatAction = { label: "Explore room ideas", to: "/design-ideas" };
const planner: LuxeChatAction = { label: "Plan my interiors", to: "/estimate" };

export function looksSensitiveChatInput(text: string) {
  return /api.?key|secret|password|token|otp|पासवर्ड|ओटीपी|\bAIza[A-Za-z0-9_-]{20,}|\bAQ\.[A-Za-z0-9._-]{20,}|\bsk-[A-Za-z0-9_-]{12,}|\b(?:hf_|gsk_)[A-Za-z0-9_-]{16,}/i.test(
    text,
  );
}
export function chatLanguage(text: string): ChatLanguage {
  if (/[\u0900-\u097f]/.test(text)) return "hi";
  return /\b(mujhe|mujhko|mera|meri|mere|aap|aapka|aapke|kaise|kitna|kitne|kitni|chahiye|karna|karwana|batao|bataiye|hai|hain|hoga|hogi|kya|ghar|sajawat|kharcha|daam|mein|nahi|nahin|hamara)\b/i.test(
    text,
  )
    ? "hinglish"
    : "en";
}
export function chatRequestsOverride(text: string) {
  return /ignore.{0,30}(instructions?|rules?|previous)|(?:system|developer)\s*(?:prompt|instructions?)|reveal.{0,20}(?:prompt|instructions?)|pretend.{0,30}(?:employee|owner|human)|jailbreak|नियम.{0,12}(?:भूल|हट)|निर्देश.{0,12}(?:भूल|अनदेखा)/i.test(
    text,
  );
}

export function luxeLocalReply(question: string): LuxeChatReply {
  const text = question.toLowerCase().trim();
  const language = chatLanguage(question);
  const localeIndex = language === "hi" ? 1 : language === "hinglish" ? 2 : 0;
  const commercial =
    /commercial|showroom|\bshop\b|retail|café|cafe|restaurant|hospitality|hotel|दुकान|शोरूम|कमर्शियल|रेस्टोरेंट|होटल|कार्यालय/.test(
      text,
    ) ||
    (/\boffice\b|ऑफिस/.test(text) && !/home office|घर.{0,10}ऑफिस/.test(text));
  const commercialType = /showroom|\bshop\b|retail|दुकान|शोरूम/.test(text)
    ? "Shop / showroom"
    : /café|cafe|restaurant|hospitality|hotel|रेस्टोरेंट|होटल/.test(text)
      ? "Hospitality"
      : /\boffice\b|ऑफिस|कार्यालय/.test(text)
        ? "Office"
        : undefined;
  const projectQuote: LuxeChatAction = commercial
    ? { label: "Discuss my commercial space", to: "/callback", commercial: true, commercialType }
    : quote;
  const reply = (topic: Topic, actions: LuxeChatAction[] = [], prefix = ""): LuxeChatReply => ({
    text: prefix + luxeChatCopy[topic][localeIndex],
    actions,
  });
  if (looksSensitiveChatInput(question)) return reply("secrets");
  if (chatRequestsOverride(question)) return reply("boundaries", [browse, projectQuote]);
  if (
    /privacy|personal data|save.{0,20}(chat|conversation)|store.{0,20}(chat|conversation)|गोपनीय|प्राइवेसी|डेटा|chat.*save/.test(
      text,
    )
  )
    return reply("privacy", [{ label: "Read our privacy notice", to: "/privacy" }]);
  if (
    /partner|referral|commission|vendor|supplier|career|vacanc|\bjob\b|join.{0,10}(team|us)|पार्टनर|नौकरी|वेंडर|कमीशन|जुड़ना/.test(
      text,
    )
  )
    return reply("partner", [{ label: "Partner with us", to: "/partner-with-us" }]);
  if (/review|testimonial|rating|client stor|customer feedback|रिव्यू|रेटिंग|ग्राहक/.test(text))
    return reply(publishedReviews.length ? "reviews" : "reviewsPending", [
      { label: "Reviews & client stories", to: "/testimonials" },
    ]);
  if (
    /completed.{0,15}(work|project)|portfolio|your projects|project journal|आपके प्रोजेक्ट|पूरा.{0,10}काम/.test(
      text,
    )
  )
    return reply(
      publishedProjects.length || portfolioMedia.length ? "projects" : "projectsPending",
      [{ label: "Project journal", to: "/projects" }, browse],
    );
  if (
    /compar.{0,25}(quote|price)|quotation compar|दो.{0,12}(कोट|कीमत)|quote.{0,10}compare/.test(text)
  )
    return reply("compareQuotes", [{ label: "Read our planning guides", to: "/guides" }]);
  if (
    /\b(pric(?:e|es|ing)|costs?|budgets?|rates?|estimates?|rupees?|lakhs?|kharcha|daam|how much)\b|₹|कीमत|खर्च|बजट|दाम|कितन.{0,8}(?:कीमत|खर्च|पैसे)/.test(
      text,
    )
  )
    return reply(
      commercial
        ? "commercialPrice"
        : renovationPricingIsReady() || pricingIsReady()
          ? "priceReady"
          : "pricePending",
      commercial ? [projectQuote] : [planner, projectQuote],
    );
  if (/warranty|guarantee|वारंटी|गारंटी/.test(text)) return reply("warranty", [projectQuote]);
  if (/experience|years|delivered|how many projects|अनुभव|कितने प्रोजेक्ट/.test(text))
    return {
      text: `LuxeInfra has ${businessProof.experienceYears}+ years of interior experience and ${businessProof.deliveredProjects}+ delivered projects. Explore our work for photographs and project films.`,
      actions: [{ label: "Explore our work", to: "/projects" }],
    };
  if (/discount|offer|festive|sale\b|छूट|ऑफर/.test(text)) return reply("offers", [projectQuote]);
  if (
    /timeline|how long|deadline|delivery|\bdays\b|kab tak|kitne din|समय|कब तक|कितने दिन/.test(text)
  )
    return reply("timeline", [{ label: "See our process", to: "/how-it-works" }, projectQuote]);
  if (
    /payment|milestone|design fee|consultation fee|charges|\bfree\b|advance|पेमेंट|भुगतान|फीस/.test(
      text,
    )
  )
    return reply("fees", [projectQuote]);
  const brand = materialBrands.find((item) => text.includes(item.name.toLowerCase()));
  if (
    brand ||
    /material|plywood|hardware|laminate|finish|brand|\bwood\b|मटेरियल|प्लाई|लकड़ी|हार्डवेयर|ब्रांड/.test(
      text,
    )
  )
    return reply(
      "materials",
      [{ label: "Explore materials", to: "/materials" }, projectQuote],
      `${brand?.name || materialBrands.map((item) => item.name).join(", ")}. `,
    );
  if (
    /saved|shortlist|favourite|favorite|heart|my inspiration|compare.{0,15}(design|idea)|सेव|पसंदीदा/.test(
      text,
    )
  )
    return reply("saved", [{ label: "My inspiration", to: "/my-inspiration" }, browse]);
  if (
    /style|quiz|warm minimal|modern classic|natural.*relax|look.*choose|स्टाइल|शैली|कैसा लुक/.test(
      text,
    )
  )
    return reply("style", [{ label: "Find your style", to: "/find-your-style" }, browse]);
  if (/guide|checklist|first.{0,12}(meeting|conversation)|prepare|गाइड|चेकलिस्ट|तैयारी/.test(text))
    return reply("guides", [{ label: "Explore planning guides", to: "/guides" }]);
  if (
    /process|how.*work|next step|after.{0,12}(quote|enquiry)|प्रक्रिया|कैसे काम|आगे क्या/.test(text)
  )
    return reply("process", [{ label: "See our process", to: "/how-it-works" }, projectQuote]);
  if (
    /\b(photos?|photographs?|images?|ai|reimagine|room studio|dimensions?|fit|layout)\b|visuali[sz]|फोटो|तस्वीर|नाप|माप|लेआउट/.test(
      text,
    )
  )
    return reply("room", [{ label: "Open Room Studio", to: "/reimagine" }]);
  if (
    /\b(where|serve|area|city|location|lucknow|noida|ghaziabad|gorakhpur|varanasi|prayagraj|bengaluru|bangalore|delhi|uttar)\b|कहाँ|कहां|शहर|लखनऊ|नोएडा|गाजियाबाद|गोरखपुर|वाराणसी|प्रयागराज|बेंगलुरु|दिल्ली/.test(
      text,
    )
  )
    return reply(
      "location",
      [projectQuote],
      language === "hi"
        ? `हम ${serviceAreaSummary} में सेवाएँ देते हैं। `
        : language === "hinglish"
          ? `Hum ${serviceAreaSummary} serve karte hain. `
          : `We serve ${serviceAreaSummary}. `,
    );
  if (
    /contact|human|\bcall\b|phone|email|whatsapp|sales|speak|talk|address|opening hours|संपर्क|कॉल|फोन|ईमेल|पता|बात|कब खुल/.test(
      text,
    )
  )
    return reply(
      "contact",
      [{ label: "Contact the studio", to: "/contact" }],
      `${business.phone} / ${business.secondaryPhone}\n${business.email} / ${business.alternateEmail}\n\n`,
    );
  if (commercial) return reply("commercial", [projectQuote]);
  if (/quote|quotation|callback|book.{0,10}(visit|call)|कोट|विजिट|कॉल बैक/.test(text))
    return reply("quote", [projectQuote]);
  if (
    /home|bedroom|kitchen|wardrobe|living|renovat|interior|start|\bplan\b|ghar|घर|बेडरूम|किचन|रसोई|अलमारी|इंटीरियर|शुरू/.test(
      text,
    )
  )
    return reply("home", [planner, browse, projectQuote]);
  return reply("unknown", [browse, projectQuote]);
}

export const luxeChatKnowledge = buildLuxeChatKnowledge();
