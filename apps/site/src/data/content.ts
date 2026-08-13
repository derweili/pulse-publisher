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

export const articles: Article[] = [
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
