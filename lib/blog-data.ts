export type Blog = {
  slug: string
  title: string
  excerpt: string
  content: string[]
  publishedAt: string
  readingTime: string
  image: string
  tags: string[]
}

const blogPosts: Blog[] = [
  {
    slug: "choosing-the-right-daycare-for-your-child",
    title: "Choosing the Right Daycare for Your Child",
    excerpt:
      "From safety checks to classroom feel, here’s a simple framework to help you compare daycare options with confidence.",
    content: [
      "Finding the right daycare can feel overwhelming, especially if this is your first time searching for childcare. The good news is that you don’t have to rely on instinct alone. A simple checklist can help you compare options side by side and feel confident in your decision.",
      "Start by clarifying your non‑negotiables: location, budget, hours, and any specific needs your child has. Narrowing the list before you tour saves you time and helps you focus on quality instead of logistics.",
      "During tours, pay close attention to how teachers interact with children. Are they at eye level? Do they use warm, responsive language? The emotional climate of the classroom is one of the strongest predictors of a great experience.",
      "Finally, trust both data and your gut. Licensing status, safety procedures, and reviews from other parents matter,but so does how you feel when you walk in the door. The right program should leave you feeling welcomed, informed, and reassured."
    ],
    publishedAt: "2025-12-10",
    readingTime: "6 min read",
    image: "/images/blogs/choosing-daycare.svg",
    tags: ["Daycare", "For Parents", "Getting Started"]
  },
  {
    slug: "questions-to-ask-on-your-childcare-tour",
    title: "15 Questions to Ask on Your Childcare Tour",
    excerpt:
      "Touring a center soon? Use these questions to move beyond the brochure and understand what daily life is really like.",
    content: [
      "A great childcare tour is your chance to move beyond marketing language and see how a program actually runs. Coming prepared with thoughtful questions will help you uncover whether the center’s routines and values line up with your family’s priorities.",
      "Ask about daily schedules, outdoor time, and how teachers support children during transitions like drop‑off and nap. These small moments add up to the rhythm of your child’s day.",
      "It’s also important to understand how the center communicates with families. Do they share photos, daily reports, or learning updates? Clear communication builds trust, especially during the first few weeks of care.",
      "Most of all, remember that no question is too small. Providers are your partners,they should welcome curiosity and be happy to explain how and why they do things the way they do."
    ],
    publishedAt: "2026-01-15",
    readingTime: "5 min read",
    image: "/images/blogs/childcare-tour-questions.svg",
    tags: ["Tours", "For Parents", "Checklist"]
  },
  {
    slug: "supporting-your-childs-first-week-in-care",
    title: "Supporting Your Child’s First Week in Care",
    excerpt:
      "Practical tips to ease separation anxiety,for both children and parents,during the transition into a new program.",
    content: [
      "The first week in a new childcare program is a big transition. It’s completely normal for children,and parents,to feel a mix of excitement and nerves. A little planning can make these first days much smoother.",
      "If possible, start with shorter days and build up. This gives your child time to get to know teachers, explore the classroom, and learn new routines without becoming overwhelmed.",
      "Create a simple goodbye ritual you use every day: a hug, a phrase, or a special handshake. Consistency sends the message that you always come back.",
      "Stay in close communication with teachers during the first week. They can share how your child is adjusting, what comforts them, and which parts of the day they enjoy most. Together, you can build a transition plan that feels good for everyone."
    ],
    publishedAt: "2026-02-02",
    readingTime: "7 min read",
    image: "/images/blogs/first-week-in-care.svg",
    tags: ["Transitions", "Emotions", "For Parents"]
  },
  {
    slug: "what-quality-early-learning-really-looks-like",
    title: "What Quality Early Learning Really Looks Like",
    excerpt:
      "Beyond buzzwords,here’s how to recognize developmentally rich classrooms where children are truly engaged.",
    content: [
      "Quality early learning is about much more than pretty classrooms or trendy toys. At its core, it’s about meaningful interactions between children and the adults who care for them every day.",
      "Look for classrooms where children are deeply engaged,building, pretending, talking with one another, and exploring materials in open‑ended ways. Worksheets and rigid drills are less important than rich play and conversation.",
      "Strong programs also connect play to learning goals. Teachers intentionally set up activities that build language, problem‑solving, and social skills, then join children at just the right moments to extend their thinking.",
      "When you see joyful noise, curious questions, and adults who truly know each child, you’re likely looking at a high‑quality early learning environment."
    ],
    publishedAt: "2026-03-01",
    readingTime: "8 min read",
    image: "/images/blogs/quality-early-learning.svg",
    tags: ["Early Learning", "Classroom Quality", "For Parents"]
  }
]

export function getAllBlogs(): Blog[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getBlogBySlug(slug: string): Blog | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

