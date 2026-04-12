import { layoutTriple, pickLayoutForBreakpoint } from "../layout-helpers"
import type { CanvasNode, NavItem, TemplateDraft } from "../types"
import type { TemplateKey } from "./presets-constants"

export type { TemplateKey } from "./presets-constants"
export { TEMPLATE_KEYS } from "./presets-constants"

/** Default navbar for new templates and blank sites. `blog` resolves to `/site/{subdomain}/blog`. */
export const STANDARD_NAV: NavItem[] = [
  { label: "Home", path: "" },
  { label: "About", path: "about" },
  { label: "Programs", path: "programs" },
  { label: "Fees", path: "fees" },
  { label: "Gallery", path: "gallery" },
  { label: "Blog", path: "blog" },
  { label: "Contact", path: "contact" },
]

/** Must match `next/font` variables in app/layout.tsx */
export const FONT_STACKS: Record<
  TemplateKey,
  { heading: string; body: string }
> = {
  montessori: {
    heading: 'var(--font-cormorant), "Georgia", serif',
    body: 'var(--font-source-sans), system-ui, sans-serif',
  },
  premium: {
    heading: 'var(--font-playfair), "Georgia", serif',
    body: 'var(--font-lato), system-ui, sans-serif',
  },
  community: {
    heading: 'var(--font-nunito), system-ui, sans-serif',
    body: 'var(--font-nunito), system-ui, sans-serif',
  },
  sports: {
    heading: 'var(--font-oswald), system-ui, sans-serif',
    body: 'var(--font-open-sans), system-ui, sans-serif',
  },
}

interface ThemePack {
  key: string
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  muted: string
  accent: string
  heroTitle: string
  heroSub: string
  footerBlurb: string
  /** Compact navbar title when no logo */
  navBrandLabel: string
}

const THEMES: Record<TemplateKey, ThemePack> = {
  montessori: {
    key: "montessori",
    primary: "#2f7d5a",
    secondary: "#1f4f3c",
    background: "#f6f4ed",
    surface: "#e9f7f0",
    text: "#1f4f3c",
    muted: "#4e7a6a",
    accent: "#4ea97a",
    heroTitle: "Calm starts, confident little learners",
    heroSub: "A nurturing Montessori-inspired environment where independence, care, and curiosity grow every day.",
    footerBlurb: "© Your nursery name · Montessori-inspired early years",
    navBrandLabel: "Little Roots Montessori",
  },
  premium: {
    key: "premium",
    primary: "#d4a93d",
    secondary: "#0f1f3a",
    background: "#f9f8f4",
    surface: "#f7f1e8",
    text: "#0f172a",
    muted: "#475569",
    accent: "#c56b26",
    heroTitle: "Boutique care with exceptional family support",
    heroSub: "Small group sizes, thoughtful learning plans, and warm daily communication parents can rely on.",
    footerBlurb: "© Your nursery name · Premium early learning",
    navBrandLabel: "Little Scholars House",
  },
  community: {
    key: "community",
    primary: "#ea7a62",
    secondary: "#3f466b",
    background: "#fff8e7",
    surface: "#fbeed1",
    text: "#3f466b",
    muted: "#61688c",
    accent: "#7fb7a0",
    heroTitle: "A welcoming place where every family belongs",
    heroSub: "Community-led early learning with inclusive values, playful discovery, and strong parent partnerships.",
    footerBlurb: "© Your nursery name · Community-led childcare",
    navBrandLabel: "Sunflower Community Preschool",
  },
  sports: {
    key: "sports",
    primary: "#1f4d82",
    secondary: "#1e3a8a",
    background: "#eef6ff",
    surface: "#d8eafe",
    text: "#1c3f76",
    muted: "#2358a5",
    accent: "#f5822a",
    heroTitle: "Big energy, kind routines, happy progress",
    heroSub: "Movement-rich days, outdoor adventures, and confidence-building learning for active children.",
    footerBlurb: "© Your nursery name · Active play and learning",
    navBrandLabel: "Move & Grow Kids",
  },
}

function navBar(
  id: string,
  z: number,
  bg: string,
  color: string,
  font: string,
  opts?: {
    height?: number
    fontSize?: number
    textAlign?: "left" | "center" | "right"
    /** Shown in compact nav when no logo is uploaded */
    brandLabel?: string
  },
): CanvasNode {
  const h = opts?.height ?? 64
  return {
    id,
    type: "navbar",
    parentId: null,
    zIndex: z,
    props: {
      navItems: STANDARD_NAV,
      backgroundColor: bg,
      color,
      fontFamily: font,
      fontSize: opts?.fontSize ?? 15,
      textAlign: opts?.textAlign ?? "center",
      brandLabel: opts?.brandLabel ?? "Your nursery",
    },
    layout: layoutTriple(0, 0, 1200, h),
  }
}

function footerNode(
  id: string,
  z: number,
  y: number,
  bg: string,
  color: string,
  text: string,
  font: string,
): CanvasNode {
  return {
    id,
    type: "footer",
    parentId: null,
    zIndex: z,
    props: {
      text,
      backgroundColor: bg,
      color,
      fontSize: 14,
      textAlign: "center",
      fontFamily: font,
    },
    layout: layoutTriple(0, y, 1200, 80),
  }
}

function contactFormBlock(
  nid: () => string,
  x: number,
  y: number,
  w: number,
  h: number,
  introHint: string,
): CanvasNode {
  const resolvedIntroHint =
    introHint.trim() ||
    "Share a few details and our team will reply within two working days to help you plan next steps."
  return {
    id: nid(),
    type: "contactForm",
    parentId: null,
    zIndex: 25,
    props: {
      introHint: resolvedIntroHint,
      showProgramInterest: true,
      textAlign: "center",
    },
    layout: layoutTriple(x, y, w, h),
  }
}

function buildMontessoriPages(nid: () => string, t: ThemePack, f: (typeof FONT_STACKS)["montessori"]): TemplateDraft["pages"] {
  const home: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, height: 68, textAlign: "left" }),
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 5,
      props: { backgroundColor: t.surface, borderRadius: 0 },
      layout: layoutTriple(0, 68, 1200, 460),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 12,
      props: {
        src: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900&q=80",
        alt: "Prepared classroom",
        borderRadius: 16,
      },
      layout: layoutTriple(48, 108, 520, 380),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text: t.heroTitle,
        color: t.text,
        fontSize: 40,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "left",
      },
      layout: layoutTriple(600, 112, 540, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text: t.heroSub,
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "left",
      },
      layout: layoutTriple(600, 232, 520, 100),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 16,
      props: {
        label: "Schedule a tour",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 10,
        fontSize: 16,
      },
      layout: layoutTriple(600, 360, 220, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 20,
      props: {
        text: "The prepared environment",
        color: t.text,
        fontSize: 26,
        fontWeight: 600,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 560, 700, 44),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 21,
      props: {
        text: "Hands-on materials",
        color: t.accent,
        fontSize: 17,
        fontWeight: 700,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 620, 340, 28),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 22,
      props: {
        text: "Beautiful, purposeful tools that invite concentration and self-correction.",
        color: t.muted,
        fontSize: 15,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 652, 340, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 23,
      props: {
        text: "Mixed-age peers",
        color: t.accent,
        fontSize: 17,
        fontWeight: 700,
        fontFamily: f.body,
      },
      layout: layoutTriple(420, 620, 340, 28),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 24,
      props: {
        text: "Younger children learn from older role models; leaders emerge naturally.",
        color: t.muted,
        fontSize: 15,
        fontFamily: f.body,
      },
      layout: layoutTriple(420, 652, 340, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 25,
      props: {
        text: "Respectful routines",
        color: t.accent,
        fontSize: 17,
        fontWeight: 700,
        fontFamily: f.body,
      },
      layout: layoutTriple(792, 620, 360, 28),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 26,
      props: {
        text: "Long uninterrupted work cycles build focus and intrinsic motivation.",
        color: t.muted,
        fontSize: 15,
        fontFamily: f.body,
      },
      layout: layoutTriple(792, 652, 360, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 27,
      props: {
        src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80",
        alt: "Children at work",
        borderRadius: 14,
      },
      layout: layoutTriple(48, 780, 1104, 300),
    },
    footerNode(nid(), 200, 1120, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  const about: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "left" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Our philosophy",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 100, 500, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We follow the child , observing interests and offering just-right challenges. Our guides prepare the environment so children can move freely, choose work, and build confidence through repetition and mastery.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 168, 520, 220),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text:
          "Families partner with us through regular conversations and transparent communication. Together we nurture independence, grace, and curiosity that lasts far beyond the early years.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(600, 168, 540, 200),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Leadership & daily rhythm",
        color: t.text,
        fontSize: 22,
        fontWeight: 600,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 392, 520, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Lead guides hold Montessori credentials; assistants train in observation and grace & courtesy. Each room follows a predictable flow: arrival, uninterrupted work cycle, outdoor time, and community lunch.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 432, 520, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text:
          "Ratios stay within licensing , and often below , so every child receives individual lessons and long stretches of focused work.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(600, 432, 540, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 16,
      props: {
        src: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
        alt: "Guide with children in the classroom",
        borderRadius: 14,
      },
      layout: layoutTriple(48, 572, 520, 260),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 17,
      props: {
        text:
          "We welcome you to observe a full work cycle before enrolling , see concentration, peer learning, and care in action.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(600, 572, 540, 140),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 18,
      props: {
        label: "Schedule a tour",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 10,
        fontSize: 16,
      },
      layout: layoutTriple(600, 730, 220, 48),
    },
    footerNode(nid(), 200, 820, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  const programs: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "left" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Programs",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 100, 400, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "• Nido & toddlers , sensory exploration and language-rich routines\n• Primary , practical life, sensorial, language, and early math\n• Kindergarten , deeper literacy and leadership within the community\n• Extended day , consistency for working families",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 172, 1050, 200),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "By age group",
        color: t.text,
        fontSize: 22,
        fontWeight: 600,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 392, 400, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "Infants & toddlers\nComforting routines, freedom of movement, and rich language. Outdoor time and music daily.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 432, 520, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Preschool & kindergarten\nIndividualized math and literacy, cultural studies, and leadership in the mixed-age community.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
      },
      layout: layoutTriple(600, 432, 540, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text:
          "Summer & enrichment\nOptional camps and specialty weeks keep friendships and routines familiar year-round.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 552, 1092, 72),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 16,
      props: {
        src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80",
        alt: "Children working together",
        borderRadius: 14,
      },
      layout: layoutTriple(48, 648, 1104, 220),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 17,
      props: {
        label: "Ask about placement",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 10,
        fontSize: 16,
      },
      layout: layoutTriple(48, 892, 240, 48),
    },
    footerNode(nid(), 200, 980, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  const fees: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "left" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Tuition & enrollment",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 100, 500, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We offer full- and part-week options with clear, published rates. A deposit secures your place; sibling savings may apply. Ask about employer partnerships and local funding programs.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 172, 1050, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "What tuition includes",
        color: t.text,
        fontSize: 22,
        fontWeight: 600,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 312, 520, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "• Materials, meals or snacks as listed in your handbook\n• Portfolio conferences and progress summaries\n• Family events and parent education evenings\n• Outdoor play and field experiences (age-appropriate)",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 352, 1050, 140),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Registration and annual fees are outlined in your enrollment agreement. Payment plans and employer FSA documentation available on request.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 512, 1050, 80),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Request the fee sheet",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 10,
        fontSize: 16,
      },
      layout: layoutTriple(48, 612, 260, 48),
    },
    footerNode(nid(), 200, 700, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  const gallery: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "left" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "A day in our rooms",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 100, 500, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Prepared spaces for practical life, sensorial exploration, and joyful movement , indoors and out.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 152, 1050, 44),
    },
    {
      id: nid(),
      type: "gallery",
      parentId: null,
      zIndex: 12,
      props: {
        items: [
          { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80", alt: "Outdoors" },
          { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", alt: "Art" },
          { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80", alt: "Learning" },
          { src: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80", alt: "Classroom" },
          { src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80", alt: "Peers" },
          { src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80", alt: "Community" },
        ],
        borderRadius: 12,
      },
      layout: layoutTriple(48, 208, 1100, 360),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Photos represent our environment; schedule a visit to see the work cycle in person.",
        color: t.muted,
        fontSize: 14,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 580, 1050, 40),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=900&q=80",
        alt: "Bright learning space",
        borderRadius: 14,
      },
      layout: layoutTriple(48, 632, 1104, 200),
    },
    footerNode(nid(), 200, 880, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  const contact: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "left" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Visit us",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
      },
      layout: layoutTriple(48, 100, 400, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text: "Book a classroom observation or ask about waitlists. We reply within two business days.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 168, 700, 80),
    },
    contactFormBlock(nid, 48, 248, 1104, 640, ""),
    footerNode(nid(), 200, 888, t.secondary, "#f8fafc", t.footerBlurb, f.body),
  ]

  return pageMeta(home, about, programs, fees, gallery, contact)
}

function buildPremiumPages(nid: () => string, t: ThemePack, f: (typeof FONT_STACKS)["premium"]): TemplateDraft["pages"] {
  const home: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, fontSize: 14, textAlign: "center" }),
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 5,
      props: { backgroundColor: t.secondary },
      layout: layoutTriple(0, 72, 1200, 420),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: t.heroTitle,
        color: "#f8fafc",
        fontSize: 46,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(80, 140, 1040, 110),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: t.heroSub,
        color: t.primary,
        fontSize: 19,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 250, 960, 90),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 14,
      props: {
        label: "Request a private tour",
        href: "/contact",
        backgroundColor: t.primary,
        color: t.secondary,
        borderRadius: 4,
        fontSize: 15,
      },
      layout: layoutTriple(460, 360, 280, 50),
    },
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 6,
      props: { backgroundColor: t.surface },
      layout: layoutTriple(0, 492, 1200, 420),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 20,
      props: {
        text: "Excellence in every detail",
        color: t.text,
        fontSize: 30,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "left",
      },
      layout: layoutTriple(64, 540, 520, 44),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 21,
      props: {
        text:
          "Concierge onboarding, nutritionist-approved menus, and educators with advanced credentials. Your family receives a dedicated liaison from inquiry through enrollment.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "left",
      },
      layout: layoutTriple(64, 596, 520, 140),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 22,
      props: {
        src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=800&q=80",
        alt: "Refined learning space",
        borderRadius: 4,
      },
      layout: layoutTriple(620, 520, 520, 360),
    },
    footerNode(nid(), 200, 1120, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  const about: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Our standard",
        color: t.text,
        fontSize: 40,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(120, 120, 960, 56),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We combine research-backed pedagogy with white-glove service. Every classroom is designed for beauty, order, and deep engagement , so children thrive and parents feel truly supported.",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 200, 960, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "Family partnership",
        color: t.text,
        fontSize: 24,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(120, 340, 960, 40),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "A dedicated family liaison coordinates tours, onboarding, and ongoing communication. Nutrition, wellness, and learning specialists collaborate with classroom teams so every detail feels considered.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 388, 960, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=900&q=80",
        alt: "Refined classroom environment",
        borderRadius: 4,
      },
      layout: layoutTriple(120, 508, 960, 280),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Request a private tour",
        href: "/contact",
        backgroundColor: t.primary,
        color: t.secondary,
        borderRadius: 4,
        fontSize: 15,
      },
      layout: layoutTriple(460, 812, 280, 50),
    },
    footerNode(nid(), 200, 920, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  const programs: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Curated programs",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Infant suite · Toddler atelier · Preschool academy · Kindergarten readiness · Holiday enrichment",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 190, 960, 80),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text:
          "Each program includes low ratios, individualized learning plans, and quarterly progress conferences. Ask about our sibling priority and corporate partner rates.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 290, 960, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Signature experiences",
        color: t.text,
        fontSize: 24,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(120, 410, 960, 40),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Studio art, world languages, and STEAM labs are woven into each week. Outdoor ateliers and guest artists extend the curriculum beyond the classroom walls.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 458, 960, 90),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 15,
      props: {
        src: "https://images.unsplash.com/photo-1580582932707-520eede6517b?w=900&q=80",
        alt: "Children in a bright studio",
        borderRadius: 4,
      },
      layout: layoutTriple(120, 568, 960, 260),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 16,
      props: {
        label: "Speak with admissions",
        href: "/contact",
        backgroundColor: t.primary,
        color: t.secondary,
        borderRadius: 4,
        fontSize: 15,
      },
      layout: layoutTriple(460, 852, 280, 50),
    },
    footerNode(nid(), 200, 960, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  const fees: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Investment & membership",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Tuition reflects our ratios, materials, and family services. Transparent fee schedules are provided at your first consultation. Registration and annual membership are outlined in your agreement.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 190, 960, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "What your investment includes",
        color: t.text,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(120, 310, 960, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "• Chef-prepared meals and allergen-aware menus\n• Atelier materials, technology, and field experiences\n• Parent evenings, conferences, and digital portfolios\n• Priority re-enrollment and alumni sibling pathways",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 354, 960, 140),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Custom payment schedules and employer FSA documentation are available. A non-refundable registration deposit secures your seat for the academic year.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 514, 960, 80),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Book a fee consultation",
        href: "/contact",
        backgroundColor: t.primary,
        color: t.secondary,
        borderRadius: 4,
        fontSize: 15,
      },
      layout: layoutTriple(460, 618, 280, 50),
    },
    footerNode(nid(), 200, 720, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  const gallery: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Spaces & moments",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Architect-designed studios, calm sleep suites, and gardens made for small explorers , every corner invites focus and wonder.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 168, 960, 56),
    },
    {
      id: nid(),
      type: "gallery",
      parentId: null,
      zIndex: 12,
      props: {
        items: [
          { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", alt: "Interior" },
          { src: "https://images.unsplash.com/photo-1580582932707-520eede6517b?w=600&q=80", alt: "Studio" },
          { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", alt: "Activity" },
          { src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=600&q=80", alt: "Atelier" },
          { src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80", alt: "Learning" },
          { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80", alt: "Outdoor" },
        ],
        borderRadius: 4,
      },
      layout: layoutTriple(48, 236, 1100, 380),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Imagery is representative; private tours reveal our standards in real time.",
        color: t.muted,
        fontSize: 14,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 628, 960, 40),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        alt: "Spacious interior corridor",
        borderRadius: 4,
      },
      layout: layoutTriple(120, 684, 960, 200),
    },
    footerNode(nid(), 200, 920, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  const contact: CanvasNode[] = [
    navBar(nid(), 100, t.secondary, "#f8fafc", f.body, { brandLabel: t.navBrandLabel, height: 72, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Concierge contact",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 120, 1100, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text: "Our admissions team responds within one business day to arrange tours and answer questions.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 200, 960, 60),
    },
    contactFormBlock(nid, 48, 280, 1104, 600, ""),
    footerNode(nid(), 200, 880, t.secondary, "#e2e8f0", t.footerBlurb, f.body),
  ]

  return pageMeta(home, about, programs, fees, gallery, contact)
}

function buildCommunityPages(nid: () => string, t: ThemePack, f: (typeof FONT_STACKS)["community"]): TemplateDraft["pages"] {
  const home: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, height: 70, textAlign: "center" }),
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 5,
      props: { backgroundColor: t.surface, borderRadius: 24 },
      layout: layoutTriple(40, 88, 1120, 440),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text: t.heroTitle,
        color: t.text,
        fontSize: 42,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(80, 140, 1040, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text: t.heroSub,
        color: t.muted,
        fontSize: 19,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 240, 1000, 90),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 16,
      props: {
        label: "Join our waitlist",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 999,
        fontSize: 16,
      },
      layout: layoutTriple(470, 360, 260, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 20,
      props: {
        text: "Everyone belongs here",
        color: t.accent,
        fontSize: 28,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 560, 1100, 40),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 21,
      props: {
        text:
          "We celebrate every family. Sliding-scale options, multilingual staff, and neighbourhood partnerships mean more children get a strong start , together.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(120, 620, 960, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 22,
      props: {
        src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900&q=80",
        alt: "Community gathering",
        borderRadius: 20,
      },
      layout: layoutTriple(48, 740, 520, 320),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 23,
      props: {
        src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80",
        alt: "Children together",
        borderRadius: 20,
      },
      layout: layoutTriple(600, 740, 552, 320),
    },
    footerNode(nid(), 200, 1120, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  const about: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Built with neighbours",
        color: t.text,
        fontSize: 38,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We started as a parent co-op and grew into a licensed centre , but we never lost the block-party spirit. Staff live nearby; grandparents volunteer; local businesses sponsor field trips.",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 180, 1000, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "“Every family deserves a soft landing , we share resources, celebrate milestones, and show up for each other.”",
        color: t.accent,
        fontSize: 18,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(100, 320, 1000, 80),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "Partnerships with libraries, farms, and clinics bring the neighbourhood into our rooms. Ask about our family council and volunteer days.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 412, 1000, 80),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900&q=80",
        alt: "Families at a community event",
        borderRadius: 20,
      },
      layout: layoutTriple(100, 508, 1000, 260),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Visit an open house",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 999,
        fontSize: 16,
      },
      layout: layoutTriple(470, 792, 260, 52),
    },
    footerNode(nid(), 200, 900, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  const programs: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Programs for real life",
        color: t.text,
        fontSize: 36,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Flexible hours · After-school club · Summer pop-up camps · Family nights\nWe adapt as your needs change , because it takes a village.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 180, 1000, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "A place for every schedule",
        color: t.accent,
        fontSize: 22,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 320, 1100, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "Early drop-off · Part-week preschool · Full-day care · School-age homework help\nBilingual story times and sensory-friendly afternoons run monthly.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 368, 1000, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80",
        alt: "Children learning together",
        borderRadius: 20,
      },
      layout: layoutTriple(100, 488, 1000, 240),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Tell us what you need",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 999,
        fontSize: 16,
      },
      layout: layoutTriple(470, 752, 260, 52),
    },
    footerNode(nid(), 200, 860, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  const fees: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Fair & flexible fees",
        color: t.text,
        fontSize: 36,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We publish our fee grid at open houses and work with families on payment plans. Subsidies and community fund referrals welcome , ask us how to apply.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 180, 1000, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "What’s included",
        color: t.accent,
        fontSize: 22,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 300, 1100, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "• Snacks & meals aligned with cultural preferences\n• Field trips and guest visitors (transport as listed)\n• Family workshops and resource referrals\n• Sliding-scale options when funding allows",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 344, 1000, 140),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "A modest registration fee holds your spot; monthly invoices match your schedule. We walk families through subsidy paperwork step by step.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 500, 1000, 80),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Ask about subsidies",
        href: "/contact",
        backgroundColor: t.primary,
        color: "#fff",
        borderRadius: 999,
        fontSize: 16,
      },
      layout: layoutTriple(470, 600, 240, 52),
    },
    footerNode(nid(), 200, 700, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  const gallery: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Community snapshots",
        color: t.text,
        fontSize: 36,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Potlucks, parades, planting days , our camera roll is full of real life, not stock perfection.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 168, 1000, 48),
    },
    {
      id: nid(),
      type: "gallery",
      parentId: null,
      zIndex: 12,
      props: {
        items: [
          { src: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80", alt: "Families" },
          { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80", alt: "Play" },
          { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", alt: "Crafts" },
          { src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80", alt: "Together" },
          { src: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80", alt: "Circle time" },
          { src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=600&q=80", alt: "Indoor play" },
        ],
        borderRadius: 16,
      },
      layout: layoutTriple(48, 228, 1100, 360),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Share your own photos after enrollment , we love featuring families who opt in.",
        color: t.muted,
        fontSize: 14,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 604, 1000, 40),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=1100&q=80",
        alt: "Outdoor play day",
        borderRadius: 20,
      },
      layout: layoutTriple(100, 660, 1000, 200),
    },
    footerNode(nid(), 200, 900, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  const contact: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Say hello",
        color: t.text,
        fontSize: 40,
        fontWeight: 800,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 120, 1100, 52),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text: "Pop in, call, or email , we love meeting new neighbours.",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(100, 200, 1000, 60),
    },
    contactFormBlock(nid, 48, 280, 1104, 620, ""),
    footerNode(nid(), 200, 900, t.secondary, "#fef3c7", t.footerBlurb, f.body),
  ]

  return pageMeta(home, about, programs, fees, gallery, contact)
}

function buildSportsPages(nid: () => string, t: ThemePack, f: (typeof FONT_STACKS)["sports"]): TemplateDraft["pages"] {
  const home: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, height: 64, textAlign: "center" }),
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 4,
      props: { backgroundColor: t.primary },
      layout: layoutTriple(0, 64, 1200, 56),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 8,
      props: {
        text: "2 outdoor pitches",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(80, 76, 300, 32),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 9,
      props: {
        text: "Daily PE blocks",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(450, 76, 300, 32),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Team spirit",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(820, 76, 300, 32),
    },
    {
      id: nid(),
      type: "section",
      parentId: null,
      zIndex: 5,
      props: { backgroundColor: t.background },
      layout: layoutTriple(0, 120, 1200, 400),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 12,
      props: {
        src: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&q=80",
        alt: "Kids in motion",
        borderRadius: 8,
      },
      layout: layoutTriple(48, 140, 560, 360),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text: t.heroTitle,
        color: t.text,
        fontSize: 44,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "left",
      },
      layout: layoutTriple(640, 150, 512, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text: t.heroSub,
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "left",
      },
      layout: layoutTriple(640, 280, 512, 100),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 16,
      props: {
        label: "Book a trial day",
        href: "/contact",
        backgroundColor: t.accent,
        color: "#fff",
        borderRadius: 6,
        fontSize: 16,
      },
      layout: layoutTriple(640, 400, 220, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 20,
      props: {
        text: "TRAIN · PLAY · LEARN",
        color: t.accent,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 540, 1100, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 21,
      props: {
        text:
          "Motor skills, teamwork, and resilience , woven into literacy and math. Coaches and teachers collaborate so every child finds their edge.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 592, 1040, 80),
    },
    {
      id: nid(),
      type: "gallery",
      parentId: null,
      zIndex: 22,
      props: {
        items: [
          { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80", alt: "Field" },
          { src: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80", alt: "Gym" },
          { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", alt: "Team" },
        ],
        borderRadius: 8,
      },
      layout: layoutTriple(48, 700, 1100, 320),
    },
    footerNode(nid(), 200, 1060, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  const about: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "OUR COACHING PHILOSOPHY",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "We teach effort, attitude, and respect , on the field and in the classroom. Kids learn to win humbly and bounce back fast.",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 180, 1040, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 12,
      props: {
        src: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80",
        alt: "Coach with children",
        borderRadius: 8,
      },
      layout: layoutTriple(48, 300, 520, 280),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "COACHES + TEACHERS = ONE TEAM",
        color: t.accent,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "left",
      },
      layout: layoutTriple(600, 300, 552, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Certified coaches and early educators co-plan weekly. Character lessons carry from the gym to small group reading , so skills stick where life happens.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "left",
      },
      layout: layoutTriple(600, 352, 552, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 15,
      props: {
        text:
          "Injury prevention, hydration, and recovery are part of every block. Parents get weekly snapshots of growth , not just scores.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "left",
      },
      layout: layoutTriple(600, 488, 552, 100),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 16,
      props: {
        label: "Book a trial day",
        href: "/contact",
        backgroundColor: t.accent,
        color: "#fff",
        borderRadius: 6,
        fontSize: 16,
      },
      layout: layoutTriple(600, 612, 220, 48),
    },
    footerNode(nid(), 200, 720, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  const programs: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "PROGRAM LINEUP",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "• Mini movers (2–3) , fundamentals & fun\n• Skills academy (3–5) , agility, ball sports, balance\n• Game day club , scrimmages and sportsmanship\n• Study & sprint , homework + coached fitness",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
      },
      layout: layoutTriple(48, 180, 1100, 200),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "SKILL PROGRESSIONS",
        color: t.accent,
        fontSize: 28,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 400, 1100, 40),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "Each age band follows a sequenced curriculum: locomotor patterns → cooperative games → sport-specific tactics. Report cards highlight grit, teamwork, and leadership , not just participation.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 452, 1040, 100),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=900&q=80",
        alt: "Kids running outdoors",
        borderRadius: 8,
      },
      layout: layoutTriple(48, 580, 1104, 240),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "See the weekly schedule",
        href: "/contact",
        backgroundColor: t.accent,
        color: "#fff",
        borderRadius: 6,
        fontSize: 16,
      },
      layout: layoutTriple(490, 848, 260, 48),
    },
    footerNode(nid(), 200, 940, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  const fees: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "FEES & GEAR",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "Seasonal registration includes team jersey and facility fees. Sibling and early-bird discounts available. Payment plans on request.",
        color: t.muted,
        fontSize: 17,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 180, 1040, 100),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 12,
      props: {
        text: "WHAT YOU PAY FOR",
        color: t.accent,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 300, 1100, 36),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text:
          "• League and facility fees · Equipment bundles · Travel day meals (when listed)\n• Performance tees and water bottles · End-of-season awards night\n• Optional private skills sessions (discounted for members)",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 348, 1040, 120),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 14,
      props: {
        text:
          "Deposit holds your roster spot; remaining balance can follow a monthly draft. Ask about scholarship funds for athletes in need.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 488, 1040, 80),
    },
    {
      id: nid(),
      type: "button",
      parentId: null,
      zIndex: 15,
      props: {
        label: "Request the fee sheet",
        href: "/contact",
        backgroundColor: t.accent,
        color: "#fff",
        borderRadius: 6,
        fontSize: 16,
      },
      layout: layoutTriple(490, 592, 240, 48),
    },
    footerNode(nid(), 200, 680, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  const gallery: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "ACTION SHOTS",
        color: t.text,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 110, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text:
          "From sunrise drills to Friday scrimmages , we document growth, grit, and good sportsmanship.",
        color: t.muted,
        fontSize: 16,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 168, 1040, 48),
    },
    {
      id: nid(),
      type: "gallery",
      parentId: null,
      zIndex: 12,
      props: {
        items: [
          { src: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=600&q=80", alt: "Run" },
          { src: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80", alt: "Indoor" },
          { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80", alt: "Outside" },
          { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", alt: "Team" },
          { src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80", alt: "Skills" },
          { src: "https://images.unsplash.com/photo-1564429238151-841c5f0d9e02?w=600&q=80", alt: "Play space" },
        ],
        borderRadius: 8,
      },
      layout: layoutTriple(48, 228, 1100, 360),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 13,
      props: {
        text: "Share your own highlights , tag us when you post game day.",
        color: t.muted,
        fontSize: 14,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 604, 1040, 40),
    },
    {
      id: nid(),
      type: "image",
      parentId: null,
      zIndex: 14,
      props: {
        src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1100&q=80",
        alt: "Team celebration",
        borderRadius: 8,
      },
      layout: layoutTriple(48, 660, 1104, 220),
    },
    footerNode(nid(), 200, 920, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  const contact: CanvasNode[] = [
    navBar(nid(), 100, t.surface, t.text, f.body, { brandLabel: t.navBrandLabel, textAlign: "center" }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "GET IN THE GAME",
        color: t.text,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: f.heading,
        textAlign: "center",
      },
      layout: layoutTriple(48, 120, 1100, 48),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text: "Ask about rosters, tryouts, and summer camps.",
        color: t.muted,
        fontSize: 18,
        fontFamily: f.body,
        textAlign: "center",
      },
      layout: layoutTriple(80, 200, 1040, 40),
    },
    contactFormBlock(nid, 48, 260, 1104, 620, ""),
    footerNode(nid(), 200, 880, t.secondary, "#dbeafe", t.footerBlurb, f.body),
  ]

  return pageMeta(home, about, programs, fees, gallery, contact)
}

function pageMeta(
  home: CanvasNode[],
  about: CanvasNode[],
  programs: CanvasNode[],
  fees: CanvasNode[],
  gallery: CanvasNode[],
  contact: CanvasNode[],
): TemplateDraft["pages"] {
  return [
    {
      path_slug: "",
      title: "Home",
      seo_title: "Home",
      meta_description: "Welcome to our early learning setting.",
      is_home: true,
      sort_order: 0,
      canvas_nodes: home,
    },
    {
      path_slug: "about",
      title: "About",
      seo_title: "About us",
      meta_description: "Learn about our nursery and philosophy.",
      is_home: false,
      sort_order: 1,
      canvas_nodes: about,
    },
    {
      path_slug: "programs",
      title: "Programs",
      seo_title: "Programs",
      meta_description: "Our early years programs.",
      is_home: false,
      sort_order: 2,
      canvas_nodes: programs,
    },
    {
      path_slug: "fees",
      title: "Fees",
      seo_title: "Fees",
      meta_description: "Fees and registration information.",
      is_home: false,
      sort_order: 3,
      canvas_nodes: fees,
    },
    {
      path_slug: "gallery",
      title: "Gallery",
      seo_title: "Gallery",
      meta_description: "Photos from our setting.",
      is_home: false,
      sort_order: 4,
      canvas_nodes: gallery,
    },
    {
      path_slug: "contact",
      title: "Contact",
      seo_title: "Contact",
      meta_description: "Get in touch.",
      is_home: false,
      sort_order: 5,
      canvas_nodes: contact,
    },
  ]
}

function buildPagesForTemplate(key: TemplateKey, nid: () => string, t: ThemePack): TemplateDraft["pages"] {
  const f = FONT_STACKS[key]
  switch (key) {
    case "montessori":
      return buildMontessoriPages(nid, t, f)
    case "premium":
      return buildPremiumPages(nid, t, f)
    case "community":
      return buildCommunityPages(nid, t, f)
    case "sports":
      return buildSportsPages(nid, t, f)
    default: {
      const _exhaustive: never = key
      return _exhaustive
    }
  }
}

function shiftNodeLayoutY(node: CanvasNode, desktopDelta: number): CanvasNode {
  const tabletDelta = Math.round(desktopDelta * 0.84)
  const mobileDelta = Math.round(desktopDelta * 0.72)
  const d = node.layout.desktop
  const tb = node.layout.tablet
  const mb = node.layout.mobile
  if (!d || !tb || !mb) return node
  return {
    ...node,
    layout: {
      desktop: { ...d, y: d.y + desktopDelta },
      tablet: { ...tb, y: tb.y + tabletDelta },
      mobile: { ...mb, y: mb.y + mobileDelta },
    },
  }
}

/** Bottom edge of node on desktop artboard (px). */
function desktopNodeBottom(node: CanvasNode): number {
  const r = pickLayoutForBreakpoint(node, "desktop")
  return r.y + r.h
}

/** Title + body + CTA block height from enrichNonContactPageContent (must match layoutTriple y offsets). */
const SUPPLEMENTAL_BLOCK_HEIGHT = 182
const GAP_AFTER_MAIN_CONTENT = 48
const GAP_BEFORE_FOOTER = 24

/** Auto-inserted supplemental title/body/CTA use zIndex 170–172; exclude from maxBottom so footer target y stays correct. */
function isSupplementalCopyBlock(node: CanvasNode): boolean {
  const z = node.zIndex
  return z === 170 || z === 171 || z === 172
}

function maxBottomOfMainContent(nodes: CanvasNode[]): number {
  return nodes
    .filter((n) => n.type !== "footer" && !isSupplementalCopyBlock(n))
    .reduce((max, n) => Math.max(max, desktopNodeBottom(n)), 0)
}

/**
 * Snap footer under the supplemental CTA on published microsites. DB snapshots keep footer y
 * from the editor (often dragged to the canvas bottom); enrich only runs when loading a template.
 */
export function alignFooterForPublishedPageLayout(pathSlug: string, nodes: CanvasNode[]): CanvasNode[] {
  if (pathSlug === "contact") return nodes
  if (!supplementalCopyForPage(pathSlug)) return nodes
  const footerIdx = nodes.findIndex((n) => n.type === "footer")
  if (footerIdx < 0) return nodes
  const footer = nodes[footerIdx]
  const footerDesktop = footer.layout.desktop
  if (!footerDesktop) return nodes

  const maxBottom = maxBottomOfMainContent(nodes)
  const insertY = Math.max(maxBottom + GAP_AFTER_MAIN_CONTENT, 120)
  const footerDesiredY = insertY + SUPPLEMENTAL_BLOCK_HEIGHT + GAP_BEFORE_FOOTER
  const footerShift = footerDesiredY - footerDesktop.y
  if (footerShift === 0) return nodes

  const shiftedFooter = shiftNodeLayoutY(footer, footerShift)
  const next = [...nodes]
  next[footerIdx] = shiftedFooter
  return next
}

function supplementalCopyForPage(pathSlug: string): { title: string; body: string; cta: string } | null {
  if (pathSlug === "") {
    return {
      title: "Everything parents ask before joining",
      body: "We cover daily routines, settling-in support, meals, safeguarding, and how we share updates with families. During your tour, we help you find the best start plan for your child.",
      cta: "Book your family tour",
    }
  }
  if (pathSlug === "about") {
    return {
      title: "Meet your child's future educators",
      body: "Our team blends warm relationships with purposeful teaching. We provide regular family updates, parent meetings, and smooth transition plans so children feel secure at every stage.",
      cta: "Talk with our team",
    }
  }
  if (pathSlug === "programs") {
    return {
      title: "How enrollment works",
      body: "After your visit, we recommend the best-fit program and share easy next steps. We coordinate orientation sessions and classroom introductions to make the transition smooth for both children and parents.",
      cta: "Check current availability",
    }
  }
  if (pathSlug === "fees") {
    return {
      title: "Need a personalized fee plan?",
      body: "We can share options by schedule, age group, and term length. We also explain payment timelines, sibling offers, and any local support your family may be eligible for.",
      cta: "Request fee details",
    }
  }
  if (pathSlug === "gallery") {
    return {
      title: "See daily life in person",
      body: "Photos offer a quick look, but a visit lets you feel the atmosphere and see real child-educator interactions. Join us for a walkthrough and explore your child's future space.",
      cta: "Book a walkthrough",
    }
  }
  return null
}

function enrichNonContactPageContent(
  pages: TemplateDraft["pages"],
  nid: () => string,
  t: ThemePack,
  f: { heading: string; body: string },
): TemplateDraft["pages"] {
  return pages.map((page) => {
    if (page.path_slug === "contact") return page
    const extra = supplementalCopyForPage(page.path_slug)
    if (!extra) return page
    const footerNodeIndex = page.canvas_nodes.findIndex((node) => node.type === "footer")
    if (footerNodeIndex < 0) return page

    const footer = page.canvas_nodes[footerNodeIndex]
    const footerDesktop = footer.layout.desktop
    if (!footerDesktop) return page

    const maxBottom = maxBottomOfMainContent(page.canvas_nodes)

    const insertY = Math.max(maxBottom + GAP_AFTER_MAIN_CONTENT, 120)
    const footerDesiredY = insertY + SUPPLEMENTAL_BLOCK_HEIGHT + GAP_BEFORE_FOOTER
    const footerShift = footerDesiredY - footerDesktop.y

    const supplementalNodes: CanvasNode[] = [
      {
        id: nid(),
        type: "text",
        parentId: null,
        zIndex: 170,
        props: {
          text: extra.title,
          color: t.text,
          fontSize: 24,
          fontWeight: 700,
          fontFamily: f.heading,
          textAlign: "left",
        },
        layout: layoutTriple(64, insertY, 700, 40),
      },
      {
        id: nid(),
        type: "text",
        parentId: null,
        zIndex: 171,
        props: {
          text: extra.body,
          color: t.muted,
          fontSize: 16,
          fontFamily: f.body,
          textAlign: "left",
        },
        layout: layoutTriple(64, insertY + 46, 860, 84),
      },
      {
        id: nid(),
        type: "button",
        parentId: null,
        zIndex: 172,
        props: {
          label: extra.cta,
          href: "/contact",
          backgroundColor: t.primary,
          color: "#fff",
          borderRadius: 10,
          fontSize: 15,
          textAlign: "left",
        },
        layout: layoutTriple(64, insertY + 136, 230, 46),
      },
    ]

    const shiftedFooter = shiftNodeLayoutY(footer, footerShift)
    const nextNodes = [...page.canvas_nodes]
    nextNodes[footerNodeIndex] = shiftedFooter

    return {
      ...page,
      canvas_nodes: [...nextNodes, ...supplementalNodes],
    }
  })
}

export type TemplatePreviewVariant = "montessori" | "premium" | "community" | "sports"

export const TEMPLATE_LANDING: Record<
  TemplateKey,
  {
    title: string
    description: string
    tagline: string
    bestFor: string
    primary: string
    secondary: string
    background: string
    preview: TemplatePreviewVariant
  }
> = {
  montessori: {
    title: "Montessori Calm",
    tagline: "Calm rhythm · natural warmth",
    description: "Peaceful layouts with gentle structure and reassuring copy for families seeking focus and care.",
    bestFor: "settings that emphasize independence, calm routines, and thoughtful guidance",
    primary: THEMES.montessori.primary,
    secondary: THEMES.montessori.secondary,
    background: THEMES.montessori.background,
    preview: "montessori",
  },
  premium: {
    title: "Premium Studio",
    tagline: "Editorial polish · high trust",
    description: "Upscale design language with elegant typography and polished conversion sections for tours.",
    bestFor: "boutique nurseries that want a premium feel and parent confidence",
    primary: THEMES.premium.primary,
    secondary: THEMES.premium.secondary,
    background: THEMES.premium.background,
    preview: "premium",
  },
  community: {
    title: "Community Joy",
    tagline: "Friendly colour · family-first",
    description: "Playful, welcoming sections that highlight belonging, communication, and everyday moments.",
    bestFor: "centres that lead with warmth, inclusion, and local community connection",
    primary: THEMES.community.primary,
    secondary: THEMES.community.secondary,
    background: THEMES.community.background,
    preview: "community",
  },
  sports: {
    title: "Active Explorers",
    tagline: "Energetic flow · strong clarity",
    description: "Bold playful layout focused on movement, confidence-building, and active learning stories.",
    bestFor: "programs with outdoor play, movement-led learning, and energetic branding",
    primary: THEMES.sports.primary,
    secondary: THEMES.sports.secondary,
    background: THEMES.sports.background,
    preview: "sports",
  },
}

export function getTemplateDraft(templateKey: TemplateKey, newId: () => string): TemplateDraft {
  const t = THEMES[templateKey]
  const f = FONT_STACKS[templateKey]
  const pages = enrichNonContactPageContent(buildPagesForTemplate(templateKey, newId, t), newId, t, f)
  return {
    template_key: templateKey,
    theme_tokens: {
      primaryColor: t.primary,
      secondaryColor: t.secondary,
      backgroundColor: t.background,
      fontFamily: f.body,
      headingFontFamily: f.heading,
    },
    nav_items: STANDARD_NAV,
    pages,
  }
}

export function getBlankDraft(newId: () => string): TemplateDraft {
  const nid = newId
  const navId = nid()
  const footId = nid()
  const body = FONT_STACKS.community.body
  const nodes: CanvasNode[] = [
    navBar(navId, 100, "#ffffff", "#0f172a", "var(--font-nunito), system-ui, sans-serif", {
      brandLabel: "Your nursery",
      textAlign: "center",
    }),
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: {
        text: "Your nursery name",
        color: "#0f172a",
        fontSize: 40,
        fontWeight: 700,
        textAlign: "center",
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      },
      layout: layoutTriple(100, 200, 1000, 60),
    },
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 11,
      props: {
        text: "Drag elements from the library, resize, and style your site. Add pages from the left panel.",
        color: "#64748b",
        fontSize: 18,
        textAlign: "center",
        fontFamily: body,
      },
      layout: layoutTriple(120, 280, 960, 80),
    },
    footerNode(footId, 200, 1520, "#0f172a", "#e2e8f0", "© Your nursery · Built with Twooky", body),
  ]
  return {
    template_key: "blank",
    theme_tokens: {
      primaryColor: "#203e68",
      secondaryColor: "#0f172a",
      backgroundColor: "#f8fafc",
      fontFamily: body,
      headingFontFamily: FONT_STACKS.community.heading,
    },
    nav_items: STANDARD_NAV,
    pages: [
      {
        path_slug: "",
        title: "Home",
        seo_title: "Home",
        meta_description: null,
        is_home: true,
        sort_order: 0,
        canvas_nodes: nodes,
      },
    ],
  }
}
