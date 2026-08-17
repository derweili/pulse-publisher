export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  twitter?: string;
}

export interface Section {
  slug: string;
  name: string;
  tagline: string;
  accent: string;
}

export interface ArticleBlock {
  type: "paragraph" | "heading" | "image" | "quote" | "list" | "video";
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  items?: string[];
  embedUrl?: string;
}

export interface Article {
  slug: string;
  title: string;
  dek: string;
  section: string;
  authors: string[];
  date: string;
  readTime: number;
  hero: string;
  heroAlt: string;
  tags: string[];
  premium?: boolean;
  featured?: boolean;
  blocks: ArticleBlock[];
}

export const sections: Section[] = [
  {
    slug: "tech",
    name: "Tech",
    tagline: "The machines are getting smarter. So should you.",
    accent: "#2563eb",
  },
  {
    slug: "culture",
    name: "Culture",
    tagline: "What the world is watching, hearing and arguing about.",
    accent: "#e10600",
  },
  {
    slug: "science",
    name: "Science",
    tagline: "Breakthroughs, bold questions and the occasional planet.",
    accent: "#1f9d55",
  },
  {
    slug: "sports",
    name: "Sports",
    tagline: "The glory, the stats, the chaos in between.",
    accent: "#f59e0b",
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Money moves, markets and the people pulling the strings.",
    accent: "#7c3aed",
  },
];

export const authors: Author[] = [
  {
    slug: "mara-okafor",
    name: "Mara Okafor",
    role: "Senior Tech Reporter",
    bio: "Mara covers AI, chips and the platforms reshaping everyday life. Previously at The Verge and Wired.",
    avatar:
      "https://images.pexels.com/photos/24017554/pexels-photo-24017554.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "maraokafor",
  },
  {
    slug: "dani-rovira",
    name: "Dani Rovira",
    role: "Culture Editor",
    bio: "Dani writes about music, film, internet culture and the strange overlap between all three.",
    avatar:
      "https://images.pexels.com/photos/749091/pexels-photo-749091.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "danirovira",
  },
  {
    slug: "priya-nair",
    name: "Priya Nair",
    role: "Science Correspondent",
    bio: "Priya reports on space, climate and the biology that will define the next decade.",
    avatar:
      "https://images.pexels.com/photos/693429/pexels-photo-693429.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "priyanair",
  },
  {
    slug: "jude-halloran",
    name: "Jude Halloran",
    role: "Sports Writer",
    bio: "Jude lives and breathes the beautiful game, the ugly game, and everything in between.",
    avatar:
      "https://images.pexels.com/photos/8727669/pexels-photo-8727669.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "judehalloran",
  },
  {
    slug: "sasha-lindqvist",
    name: "Sasha Lindqvist",
    role: "Business Columnist",
    bio: "Sasha decodes markets, startups and the money that quietly runs the world.",
    avatar:
      "https://images.pexels.com/photos/34673103/pexels-photo-34673103.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "sashalindq",
  },
  {
    slug: "noah-benamran",
    name: "Noah Benamran",
    role: "Contributing Writer",
    bio: "Noah floats between culture, tech and whatever keeps them up at night.",
    avatar:
      "https://images.pexels.com/photos/33136738/pexels-photo-33136738.jpeg?auto=compress&cs=tinysrgb&h=200&w=200",
    twitter: "noahben",
  },
];

const IMG = {
  tech1:
    "https://images.pexels.com/photos/28767589/pexels-photo-28767589.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  tech2:
    "https://images.pexels.com/photos/30547578/pexels-photo-30547578.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  tech3:
    "https://images.pexels.com/photos/30547566/pexels-photo-30547566.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  tech4:
    "https://images.pexels.com/photos/34924856/pexels-photo-34924856.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  culture1:
    "https://images.pexels.com/photos/15893303/pexels-photo-15893303.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  culture2:
    "https://images.pexels.com/photos/13710064/pexels-photo-13710064.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  culture3:
    "https://images.pexels.com/photos/3890028/pexels-photo-3890028.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  culture4:
    "https://images.pexels.com/photos/37266326/pexels-photo-37266326.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  science1:
    "https://images.pexels.com/photos/8533136/pexels-photo-8533136.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  science2:
    "https://images.pexels.com/photos/8851786/pexels-photo-8851786.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  science3:
    "https://images.pexels.com/photos/4233216/pexels-photo-4233216.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  science4:
    "https://images.pexels.com/photos/20881655/pexels-photo-20881655.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  sports1:
    "https://images.pexels.com/photos/1884576/pexels-photo-1884576.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  sports2:
    "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  sports3:
    "https://images.pexels.com/photos/32471037/pexels-photo-32471037.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  sports4:
    "https://images.pexels.com/photos/31847342/pexels-photo-31847342.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  business1:
    "https://images.pexels.com/photos/7433839/pexels-photo-7433839.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  business2:
    "https://images.pexels.com/photos/7698799/pexels-photo-7698799.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  business3:
    "https://images.pexels.com/photos/7691759/pexels-photo-7691759.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  business4:
    "https://images.pexels.com/photos/7433832/pexels-photo-7433832.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  music1:
    "https://images.pexels.com/photos/30215324/pexels-photo-30215324.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
  music2:
    "https://images.pexels.com/photos/4218027/pexels-photo-4218027.jpeg?auto=compress&cs=tinysrgb&h=750&w=1200",
};

const p = (text: string): ArticleBlock => ({ type: "paragraph", text });
const h = (text: string): ArticleBlock => ({ type: "heading", text });
const img = (src: string, alt: string, caption?: string): ArticleBlock => ({
  type: "image",
  src,
  alt,
  caption,
});
const quote = (text: string): ArticleBlock => ({ type: "quote", text });
const list = (items: string[]): ArticleBlock => ({ type: "list", items });
const video = (embedUrl: string): ArticleBlock => ({ type: "video", embedUrl });

const longBody = (imgs: { a: string; b: string }): ArticleBlock[] => [
  p("This is the part of the story where we stop hedging and start saying something. The thing everyone is talking about this week is not, in fact, the thing everyone will be talking about next week — but the shape of the conversation is what matters."),
  p("For the last decade, the dominant metaphor was a stream: endless, algorithmic, personally calibrated. That metaphor is breaking down. What's replacing it is messier, louder, and somehow both more curated and more chaotic at once."),
  h("The shift nobody named"),
  p("Three forces are converging. First, the platforms that once distributed attention for free are now charging for it — in cash, in engagement, in something close to tribute. Second, the audience has learned to route around them. Third, the tools for routing have finally become good enough that the detour is shorter than the highway."),
  quote("“We are not living through a media crisis. We are living through a media settlement — and the settlers are still arguing about the border.”"),
  p("That argument is why this story exists. Because the people building the next layer of how information moves are not, for the most part, the people who built the last one. They are younger, less credentialed, and far more comfortable with the idea that a sentence can be both a product and a protest."),
  img(imgs.a, "A detail from the story", "Photograph: Pexels"),
  h("What comes next"),
  p("The short version: more small things, fewer big ones. The slightly longer version follows, but the shape is already visible if you know where to look — which is, increasingly, not the front page."),
  list([
    "Distribution is fragmenting faster than content is consolidating.",
    "The unit of attention is shrinking; the unit of loyalty is growing.",
    "Premium is back — but it is defined by trust, not by paywall position.",
  ]),
  p("None of this is inevitable. The companies that treat their audience as a resource to be extracted will continue to lose them; the ones that treat them as a relationship to be maintained will, slowly, win. The math is not complicated. The discipline is."),
  img(imgs.b, "Another angle on the same idea", "Photograph: Pexels"),
  h("The bottom line"),
  p("If you remember one thing from this piece, make it this: the interface is the ideology. Whatever you build next, build it knowing that the shape of the thing will teach people how to use it — and how to want it."),
];

const flagshipArticles: Article[] = [
  {
    slug: "the-new-ai-chips-are-rewriting-the-rules",
    title: "The New AI Chips Are Rewriting the Rules",
    dek: "A quiet generation of silicon is about to make everything you know about compute feel slow. Here's what changed and why it matters now.",
    section: "tech",
    authors: ["mara-okafor"],
    date: "2026-08-11",
    readTime: 8,
    hero: IMG.tech1,
    heroAlt: "Close-up of a glowing microchip",
    tags: ["AI", "Chips", "Hardware", "Deep Dive"],
    premium: true,
    featured: true,
    blocks: longBody({ a: IMG.tech3, b: IMG.tech4 }),
  },
  {
    slug: "neon-cities-and-the-night-economy",
    title: "Neon Cities and the Night Economy",
    dek: "From Taipei to Copenhagen, the streets after dark are becoming a laboratory for how cities actually feel — and how they make money.",
    section: "culture",
    authors: ["dani-rovira", "noah-benamran"],
    date: "2026-08-10",
    readTime: 6,
    hero: IMG.culture1,
    heroAlt: "Scooters and neon lights in a night market",
    tags: ["Cities", "Nightlife", "Photography"],
    featured: true,
    blocks: longBody({ a: IMG.culture3, b: IMG.culture4 }),
  },
  {
    slug: "the-lab-coat-generation",
    title: "The Lab-Coat Generation",
    dek: "A new wave of researchers is rewriting what a lab looks like — and who gets to work in one.",
    section: "science",
    authors: ["priya-nair"],
    date: "2026-08-09",
    readTime: 7,
    hero: IMG.science1,
    heroAlt: "Scientist in a lab under colored lighting",
    tags: ["Research", "Biology", "People"],
    featured: true,
    blocks: longBody({ a: IMG.science2, b: IMG.science4 }),
  },
  {
    slug: "sunset-rugby-and-the-end-of-the-big-broadcast",
    title: "Sunset Rugby and the End of the Big Broadcast",
    dek: "Why the most beautiful game of the year was watched by almost no one — and why that's the story.",
    section: "sports",
    authors: ["jude-halloran"],
    date: "2026-08-08",
    readTime: 5,
    hero: IMG.sports3,
    heroAlt: "Rugby match under a dramatic sunset",
    tags: ["Rugby", "Broadcasting", "Media"],
    featured: true,
    blocks: longBody({ a: IMG.sports1, b: IMG.sports4 }),
  },
  {
    slug: "what-the-founders-wont-tell-you",
    title: "What the Founders Won't Tell You About the Money",
    dek: "Three years of cap-table whispering, distilled into one honest column.",
    section: "business",
    authors: ["sasha-lindqvist"],
    date: "2026-08-07",
    readTime: 9,
    hero: IMG.business1,
    heroAlt: "Professionals reviewing financial charts",
    tags: ["Startups", "Capital", "Opinion"],
    premium: true,
    blocks: longBody({ a: IMG.business2, b: IMG.business4 }),
  },
  {
    slug: "the-grid-is-alive",
    title: "The Grid Is Alive",
    dek: "A 3D rendering trend became a movement. Then it became a protest.",
    section: "tech",
    authors: ["mara-okafor", "noah-benamran"],
    date: "2026-08-06",
    readTime: 6,
    hero: IMG.tech2,
    heroAlt: "3D futuristic digital grid in red and black",
    tags: ["Design", "Web", "Trends"],
    blocks: longBody({ a: IMG.tech1, b: IMG.tech4 }),
  },
  {
    slug: "when-the-crowd-sings-back",
    title: "When the Crowd Sings Back",
    dek: "The concert as a two-way conversation is older than you think — and newly impossible to fake.",
    section: "culture",
    authors: ["dani-rovira"],
    date: "2026-08-05",
    readTime: 5,
    hero: IMG.music1,
    heroAlt: "Crowd at an indoor concert with dramatic lighting",
    tags: ["Music", "Live", "Culture"],
    blocks: longBody({ a: IMG.music2, b: IMG.culture2 }),
  },
  {
    slug: "cosmic-nebula-photo-essay",
    title: "A Photo Essay From the Edge of Everything",
    dek: "Twelve images of nebulae that are doing more than just looking pretty.",
    section: "science",
    authors: ["priya-nair"],
    date: "2026-08-04",
    readTime: 4,
    hero: IMG.science3,
    heroAlt: "Vibrant cosmic nebula with stars",
    tags: ["Space", "Photography", "Essay"],
    blocks: longBody({ a: IMG.science4, b: IMG.science3 }),
  },
  {
    slug: "the-night-the-stadium-went-dark",
    title: "The Night the Stadium Went Dark",
    dek: "A broadcast failure turned into the best fan experience of the season.",
    section: "sports",
    authors: ["jude-halloran"],
    date: "2026-08-03",
    readTime: 5,
    hero: IMG.sports2,
    heroAlt: "Aerial view of a night football match",
    tags: ["Football", "Fans", "Media"],
    blocks: longBody({ a: IMG.sports4, b: IMG.sports1 }),
  },
  {
    slug: "the-quiet-collapse-of-the-mid-market",
    title: "The Quiet Collapse of the Mid-Market",
    dek: "There used to be a middle. Now there's a top, a bottom, and a lot of people in between pretending.",
    section: "business",
    authors: ["sasha-lindqvist"],
    date: "2026-08-02",
    readTime: 7,
    hero: IMG.business3,
    heroAlt: "Professionals discussing stock market trends",
    tags: ["Markets", "Economy", "Opinion"],
    blocks: longBody({ a: IMG.business4, b: IMG.business2 }),
  },
  {
    slug: "circuit-boards-and-the-craft-revival",
    title: "Circuit Boards and the Craft Revival",
    dek: "Why a generation that grew up with glass is suddenly obsessed with what's underneath.",
    section: "tech",
    authors: ["mara-okafor"],
    date: "2026-08-01",
    readTime: 6,
    hero: IMG.tech4,
    heroAlt: "Close-up of a computer circuit board",
    tags: ["Hardware", "Craft", "DIY"],
    blocks: longBody({ a: IMG.tech2, b: IMG.tech1 }),
  },
  {
    slug: "copenhagen-after-midnight",
    title: "Copenhagen After Midnight",
    dek: "A walking essay through a city that decided to stay open — and what it learned about itself.",
    section: "culture",
    authors: ["dani-rovira", "noah-benamran"],
    date: "2026-07-31",
    readTime: 5,
    hero: IMG.culture2,
    heroAlt: "People enjoying Copenhagen's nightlife under purple lights",
    tags: ["Cities", "Nightlife", "Essay"],
    blocks: longBody({ a: IMG.culture1, b: IMG.culture4 }),
  },
  {
    slug: "the-colorful-chemistry-of-attention",
    title: "The Colorful Chemistry of Attention",
    dek: "Inside the lab where researchers are literally mixing colors to study how we focus.",
    section: "science",
    authors: ["priya-nair"],
    date: "2026-07-30",
    readTime: 6,
    hero: IMG.science2,
    heroAlt: "Lab desk with colorful chemicals in glassware",
    tags: ["Research", "Psychology", "Attention"],
    blocks: longBody({ a: IMG.science1, b: IMG.science2 }),
  },
  {
    slug: "the-photographer-on-the-pitch",
    title: "The Photographer on the Pitch",
    dek: "A profile of the person capturing the images the rest of us keep screenshotting.",
    section: "sports",
    authors: ["jude-halloran"],
    date: "2026-07-29",
    readTime: 4,
    hero: IMG.sports4,
    heroAlt: "Photographer capturing a moment in a football stadium",
    tags: ["Profile", "Photography", "Football"],
    blocks: longBody({ a: IMG.sports2, b: IMG.sports3 }),
  },
  {
    slug: "the-calculator-and-the-comeback",
    title: "The Calculator and the Comeback",
    dek: "How a generation of finance workers is rebuilding the industry in their own image.",
    section: "business",
    authors: ["sasha-lindqvist", "noah-benamran"],
    date: "2026-07-28",
    readTime: 7,
    hero: IMG.business2,
    heroAlt: "Team collaborating on financial reports",
    tags: ["Finance", "Work", "Trends"],
    blocks: longBody({ a: IMG.business1, b: IMG.business3 }),
  },
  {
    slug: "the-grid-that-became-a-protest",
    title: "The Grid That Became a Protest",
    dek: "How a visual style turned into a political statement, one pixel at a time.",
    section: "tech",
    authors: ["mara-okafor", "dani-rovira"],
    date: "2026-07-27",
    readTime: 6,
    hero: IMG.tech3,
    heroAlt: "Abstract futuristic digital processor",
    tags: ["Design", "Politics", "Web"],
    premium: true,
    blocks: longBody({ a: IMG.tech2, b: IMG.tech1 }),
  },
  {
    slug: "the-crowd-that-wouldnt-stop-singing",
    title: "The Crowd That Wouldn't Stop Singing",
    dek: "A concert, a power outage, and the best chorus you've never heard.",
    section: "culture",
    authors: ["dani-rovira"],
    date: "2026-07-26",
    readTime: 5,
    hero: IMG.music2,
    heroAlt: "Live music concert with performers on stage",
    tags: ["Music", "Live", "Story"],
    blocks: longBody({ a: IMG.music1, b: IMG.culture2 }),
  },
  {
    slug: "nebulae-and-the-long-now",
    title: "Nebulae and the Long Now",
    dek: "Looking at things that took a million years to form, and trying to think in a million-year mood.",
    section: "science",
    authors: ["priya-nair", "noah-benamran"],
    date: "2026-07-25",
    readTime: 6,
    hero: IMG.science4,
    heroAlt: "Green nebula in outer space",
    tags: ["Space", "Philosophy", "Essay"],
    blocks: longBody({ a: IMG.science3, b: IMG.science1 }),
  },
];

// --- Backdated archive articles ---------------------------------------
//
// Bulks out each section to a proper back-catalog (>10 articles per
// category). These are generated from lightweight specs rather than
// hand-written like the flagship pieces above: dummy body copy via
// `longBody`, and hero/inline images pulled from a free keyword-matched
// photo source so each image actually relates to its headline. All of
// them are dated before the oldest flagship article so they read as the
// older archive.
//
// Note: Unsplash's old keyword-search "Source" endpoint was retired in
// 2023, and its current API needs an access key we don't have here — so
// images are pulled from LoremFlickr instead, a free, keyless,
// keyword-matched photo proxy (real Flickr photos, no signup required)
// that fits the brief's "unsplash or other free sources" allowance.

const demoImage = (keywords: string, seed: number) =>
  `https://loremflickr.com/1200/750/${keywords}?lock=${seed}`;

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

const oldestFlagshipDate = flagshipArticles.reduce(
  (oldest, a) => (a.date < oldest ? a.date : oldest),
  flagshipArticles[0].date
);

let archiveDayOffset = 0;
const nextArchiveDate = () => {
  archiveDayOffset += 1;
  const d = new Date(`${oldestFlagshipDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - archiveDayOffset);
  return d.toISOString().slice(0, 10);
};

let archiveImageSeed = 0;
const nextImageSeed = () => (archiveImageSeed += 1);

interface ArchiveArticleSpec {
  title: string;
  dek: string;
  section: string;
  authors: string[];
  readTime: number;
  tags: string[];
  keywords: string;
  premium?: boolean;
}

const generateArchiveArticle = (spec: ArchiveArticleSpec): Article => ({
  slug: slugify(spec.title),
  title: spec.title,
  dek: spec.dek,
  section: spec.section,
  authors: spec.authors,
  date: nextArchiveDate(),
  readTime: spec.readTime,
  hero: demoImage(spec.keywords, nextImageSeed()),
  heroAlt: spec.title,
  tags: spec.tags,
  premium: spec.premium ?? false,
  blocks: longBody({
    a: demoImage(spec.keywords, nextImageSeed()),
    b: demoImage(spec.keywords, nextImageSeed()),
  }),
});

const archiveArticleSpecs: ArchiveArticleSpec[] = [
  // --- Tech ---
  {
    title: "Inside the Chip Shortage That Never Really Ended",
    dek: "Factories caught up on paper. Lead times tell a different story.",
    section: "tech",
    authors: ["mara-okafor"],
    readTime: 7,
    tags: ["Chips", "Supply Chain", "Hardware"],
    keywords: "semiconductor,factory",
  },
  {
    title: "The Rise of the Solo Founder Coder",
    dek: "No cofounder, no office, no problem — how one-person software companies quietly became normal.",
    section: "tech",
    authors: ["noah-benamran"],
    readTime: 5,
    tags: ["Startups", "Indie", "Work"],
    keywords: "programmer,laptop",
  },
  {
    title: "Why Everyone Is Suddenly Talking About Quantum Again",
    dek: "A string of lab results has the physicists cautiously optimistic and everyone else confused.",
    section: "tech",
    authors: ["mara-okafor"],
    readTime: 8,
    tags: ["Quantum", "Research", "Deep Dive"],
    keywords: "quantum,laboratory",
    premium: true,
  },
  {
    title: "The Browser Wars Are Back, Sort Of",
    dek: "A new crop of AI-native browsers wants to replace the tab. Here's what that actually means.",
    section: "tech",
    authors: ["mara-okafor", "noah-benamran"],
    readTime: 6,
    tags: ["Browsers", "AI", "Web"],
    keywords: "computer,code",
  },
  {
    title: "How a Teenager's Side Project Became a Billion-Dollar App",
    dek: "A bedroom prototype, a viral weekend, and the founder who is still finishing high school.",
    section: "tech",
    authors: ["noah-benamran"],
    readTime: 6,
    tags: ["Startups", "Profile", "Apps"],
    keywords: "startup,office",
  },
  {
    title: "Robots Are Finally Learning to Open Doors",
    dek: "It sounds trivial. In robotics, it's the benchmark that has humbled everyone.",
    section: "tech",
    authors: ["mara-okafor"],
    readTime: 5,
    tags: ["Robotics", "AI", "Hardware"],
    keywords: "robot,technology",
  },
  {
    title: "The Data Centers Quietly Reshaping the Desert",
    dek: "Water, power and land are being spoken for years in advance. Locals are only now noticing.",
    section: "tech",
    authors: ["mara-okafor"],
    readTime: 9,
    tags: ["Infrastructure", "AI", "Environment"],
    keywords: "datacenter,server",
    premium: true,
  },
  {
    title: "Why Your Next Phone Might Not Have a Screen",
    dek: "Wearable displays and ambient audio are further along than the demos suggest.",
    section: "tech",
    authors: ["noah-benamran"],
    readTime: 5,
    tags: ["Hardware", "Wearables", "Trends"],
    keywords: "smartphone,technology",
  },

  // --- Culture ---
  {
    title: "The Return of the Mixtape, Now With Algorithms",
    dek: "Hand-curated playlists are back in fashion — and this time the algorithm is invited.",
    section: "culture",
    authors: ["dani-rovira"],
    readTime: 5,
    tags: ["Music", "Nostalgia", "Trends"],
    keywords: "vinyl,music",
  },
  {
    title: "Inside the Pop-Up Museum Taking Over Instagram",
    dek: "It's not really about the art. Or maybe it is, just not in the way you'd expect.",
    section: "culture",
    authors: ["dani-rovira", "noah-benamran"],
    readTime: 6,
    tags: ["Art", "Exhibits", "Social Media"],
    keywords: "museum,exhibit",
  },
  {
    title: "Why Everyone's Reading Poetry Again",
    dek: "Sales are up, readings are packed, and nobody saw it coming — least of all the poets.",
    section: "culture",
    authors: ["dani-rovira"],
    readTime: 5,
    tags: ["Books", "Poetry", "Trends"],
    keywords: "books,reading",
  },
  {
    title: "The Street Food Scene Rewriting the Rules of Fine Dining",
    dek: "Tasting menus are borrowing from night markets. The chefs behind it explain why.",
    section: "culture",
    authors: ["dani-rovira"],
    readTime: 6,
    tags: ["Food", "Chefs", "Cities"],
    keywords: "streetfood,market",
  },
  {
    title: "How a Small Film Festival Became the Industry's Best-Kept Secret",
    dek: "No red carpet, no press junket — just the best new directors in the world, once a year.",
    section: "culture",
    authors: ["noah-benamran"],
    readTime: 7,
    tags: ["Film", "Festivals", "Profile"],
    keywords: "cinema,filmfestival",
    premium: true,
  },
  {
    title: "The Fashion Trend That Refuses to Die",
    dek: "Designers keep declaring it over. Shoppers keep not listening.",
    section: "culture",
    authors: ["dani-rovira"],
    readTime: 4,
    tags: ["Fashion", "Trends", "Retail"],
    keywords: "fashion,runway",
  },
  {
    title: "Inside the World's Loudest Silent Disco",
    dek: "Three thousand headphones, three DJs, zero noise complaints. A night out gets reinvented.",
    section: "culture",
    authors: ["dani-rovira", "noah-benamran"],
    readTime: 5,
    tags: ["Nightlife", "Music", "Events"],
    keywords: "party,dj",
  },
  {
    title: "The Graffiti Artists Turning Alleyways Into Galleries",
    dek: "Cities used to scrub it off overnight. Now they're commissioning it.",
    section: "culture",
    authors: ["dani-rovira"],
    readTime: 6,
    tags: ["Street Art", "Cities", "Artists"],
    keywords: "graffiti,streetart",
  },

  // --- Science ---
  {
    title: "The Ocean Floor Just Got a Lot More Interesting",
    dek: "New submersible footage is rewriting what we thought lived in total darkness.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 7,
    tags: ["Ocean", "Biology", "Discovery"],
    keywords: "ocean,deepsea",
  },
  {
    title: "Inside the Race to Map the Human Brain",
    dek: "Competing labs, incompatible standards, and one very expensive shared goal.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 8,
    tags: ["Neuroscience", "Research", "Deep Dive"],
    keywords: "brain,neuroscience",
    premium: true,
  },
  {
    title: "Why Glaciers Are Melting Faster Than the Models Predicted",
    dek: "The gap between forecast and reality has scientists revising their assumptions, fast.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 6,
    tags: ["Climate", "Glaciers", "Research"],
    keywords: "glacier,ice",
  },
  {
    title: "The Volcano Scientists Are Watching Most Closely",
    dek: "It hasn't erupted in decades. That's exactly why nobody can look away.",
    section: "science",
    authors: ["priya-nair", "noah-benamran"],
    readTime: 6,
    tags: ["Volcanoes", "Geology", "Research"],
    keywords: "volcano,eruption",
  },
  {
    title: "How Fireflies Are Helping Decode Insect Communication",
    dek: "A summer of blinking lights is teaching researchers to speak a very old language.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 5,
    tags: ["Insects", "Biology", "Nature"],
    keywords: "firefly,forest",
  },
  {
    title: "The Telescope That Rewrote the Timeline of the Universe",
    dek: "A few weeks of new data. A few centuries of assumptions, undone.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 7,
    tags: ["Space", "Astronomy", "Research"],
    keywords: "telescope,space",
  },
  {
    title: "Inside the Vault Built to Outlive Civilization",
    dek: "A tour of the seed bank designed to survive everything, including us.",
    section: "science",
    authors: ["priya-nair"],
    readTime: 6,
    tags: ["Conservation", "Agriculture", "Essay"],
    keywords: "seedvault,arctic",
  },
  {
    title: "Why Mushrooms Might Save the Internet",
    dek: "Mycelium networks are inspiring a new generation of resilient, decentralized systems.",
    section: "science",
    authors: ["priya-nair", "noah-benamran"],
    readTime: 5,
    tags: ["Fungi", "Biology", "Tech Crossover"],
    keywords: "mushroom,forest",
  },

  // --- Sports ---
  {
    title: "The Marathon Runner Who Trains at Midnight",
    dek: "Heat, work, and family leave one window. She's turned it into a career.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 5,
    tags: ["Running", "Profile", "Endurance"],
    keywords: "marathon,night",
  },
  {
    title: "Inside the Locker Room After the Upset of the Decade",
    dek: "What actually gets said in the ninety seconds after nobody expected to win.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 4,
    tags: ["Football", "Story", "Access"],
    keywords: "lockerroom,team",
  },
  {
    title: "The Youth Academy Quietly Producing World Champions",
    dek: "A gravel pitch, a part-time coach, and a conveyor belt of talent nobody can explain.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 7,
    tags: ["Soccer", "Youth", "Profile"],
    keywords: "soccer,training",
  },
  {
    title: "Why Cricket Is Having a Streaming Moment",
    dek: "A sport built for five-day patience just found a home on platforms built for six-second clips.",
    section: "sports",
    authors: ["jude-halloran", "noah-benamran"],
    readTime: 6,
    tags: ["Cricket", "Streaming", "Media"],
    keywords: "cricket,stadium",
  },
  {
    title: "The Comeback Nobody Saw Coming",
    dek: "Down by twenty with six minutes left. Then everything changed.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 4,
    tags: ["Basketball", "Story", "Recap"],
    keywords: "basketball,arena",
  },
  {
    title: "Inside the Strangest Transfer Window in Years",
    dek: "Deals fell apart, then came back together, then fell apart again. Nobody could look away.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 6,
    tags: ["Football", "Transfers", "Business"],
    keywords: "football,stadium",
    premium: true,
  },
  {
    title: "The Swimmer Who Rewrote the Record Books Twice in One Summer",
    dek: "Two records, six weeks apart, and a training method the sport is scrambling to copy.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 5,
    tags: ["Swimming", "Records", "Profile"],
    keywords: "swimming,pool",
  },
  {
    title: "How a Small-Town Team Became a National Obsession",
    dek: "A population of nine thousand. A stadium that seats twelve. Go figure.",
    section: "sports",
    authors: ["jude-halloran"],
    readTime: 6,
    tags: ["Football", "Community", "Story"],
    keywords: "stadium,crowd",
  },
  {
    title: "The Coach Who Talks More About Chess Than Football",
    dek: "His tactics board looks less like a formation and more like an opening theory.",
    section: "sports",
    authors: ["jude-halloran", "noah-benamran"],
    readTime: 7,
    tags: ["Football", "Strategy", "Profile"],
    keywords: "chess,strategy",
  },

  // --- Business ---
  {
    title: "The Small Bank Making a Big Bet on Rural Lending",
    dek: "While the majors retreat from small towns, one lender is doubling down.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 7,
    tags: ["Banking", "Finance", "Communities"],
    keywords: "bank,finance",
  },
  {
    title: "Why Corner Stores Are Suddenly Venture-Backed",
    dek: "The unglamorous convenience store just became one of the hottest categories in retail.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 6,
    tags: ["Retail", "Startups", "Investing"],
    keywords: "storefront,retail",
  },
  {
    title: "Inside the Warehouse That Runs Itself",
    dek: "A tour of the fulfillment center where the humans are mostly there to supervise.",
    section: "business",
    authors: ["sasha-lindqvist", "noah-benamran"],
    readTime: 6,
    tags: ["Logistics", "Automation", "Retail"],
    keywords: "warehouse,logistics",
  },
  {
    title: "The Freight Industry's Quiet Software Problem",
    dek: "Trucks are full. Software is decades old. Somebody is about to make a fortune fixing it.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 8,
    tags: ["Logistics", "Software", "Deep Dive"],
    keywords: "shipping,cargo",
    premium: true,
  },
  {
    title: "How a Failed Startup Became a Thriving Consultancy",
    dek: "The product died. The team, the process and the relationships survived — and thrived.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 5,
    tags: ["Startups", "Pivots", "Profile"],
    keywords: "office,meeting",
  },
  {
    title: "The Real Estate Trend Landlords Don't Want You to Notice",
    dek: "A quiet shift in lease terms is moving more risk onto tenants than anyone's admitting.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 7,
    tags: ["Real Estate", "Housing", "Investigation"],
    keywords: "realestate,building",
  },
  {
    title: "Why Family Businesses Are Buying Back Their Own Stores",
    dek: "After a decade of franchising out, a wave of founders wants control back.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 6,
    tags: ["Small Business", "Franchising", "Trends"],
    keywords: "shop,smallbusiness",
  },
  {
    title: "The Currency Traders Betting on Bad News",
    dek: "For a specific kind of investor, instability isn't a risk. It's the whole strategy.",
    section: "business",
    authors: ["sasha-lindqvist", "noah-benamran"],
    readTime: 7,
    tags: ["Markets", "Currency", "Trading"],
    keywords: "currency,trading",
  },
  {
    title: "Inside the Rise of the Four-Day Work Week Pilot Programs",
    dek: "The results are in from hundreds of companies. They're more interesting than a headline.",
    section: "business",
    authors: ["sasha-lindqvist"],
    readTime: 6,
    tags: ["Work", "Labor", "Trends"],
    keywords: "office,worklife",
  },
];

const archiveArticles = archiveArticleSpecs.map(generateArchiveArticle);

export const articles: Article[] = [...flagshipArticles, ...archiveArticles];

export const getSection = (slug: string) => sections.find((s) => s.slug === slug);
export const getAuthor = (slug: string) => authors.find((a) => a.slug === slug);
export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);
export const articlesInSection = (slug: string) =>
  articles.filter((a) => a.section === slug);
export const articlesByAuthor = (slug: string) =>
  articles.filter((a) => a.authors.includes(slug));
export const premiumArticles = () => articles.filter((a) => a.premium);
export const featuredArticles = () => articles.filter((a) => a.featured);
export const relatedArticles = (article: Article, limit = 4) => {
  const sameSection = articles.filter(
    (a) => a.slug !== article.slug && a.section === article.section
  );
  const sharedTag = articles.filter(
    (a) =>
      a.slug !== article.slug &&
      a.section !== article.section &&
      a.tags.some((t) => article.tags.includes(t))
  );
  return [...sameSection, ...sharedTag].slice(0, limit);
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const sectionPath = (slug: string) => `/sections/${slug}`;
export const articlePath = (slug: string) => `/articles/${slug}`;
export const authorPath = (slug: string) => `/authors/${slug}`;

export const PER_PAGE = 8;

export function paginate<T>(items: T[], page: number, perPage = PER_PAGE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    pages,
    total,
    perPage,
  };
}
