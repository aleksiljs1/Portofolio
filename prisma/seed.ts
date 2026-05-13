import { PrismaClient, TechCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  // Admin user
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'changeme', 12)
  await db.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'aleksanderiljas@gmail.com' },
    update: { passwordHash: hash },
    create: {
      email: process.env.ADMIN_EMAIL ?? 'aleksanderiljas@gmail.com',
      passwordHash: hash,
    },
  })

  // Tech items
  const tech = [
    { name: 'Next.js',       category: TechCategory.FRAMEWORK },
    { name: 'React',         category: TechCategory.FRAMEWORK },
    { name: 'Node.js',       category: TechCategory.FRAMEWORK },
    { name: 'Flask',         category: TechCategory.FRAMEWORK },
    { name: 'TypeScript',    category: TechCategory.LANGUAGE },
    { name: 'JavaScript',    category: TechCategory.LANGUAGE },
    { name: 'Python',        category: TechCategory.LANGUAGE },
    { name: 'Java',          category: TechCategory.LANGUAGE },
    { name: 'SQL',           category: TechCategory.LANGUAGE },
    { name: 'Docker',        category: TechCategory.SKILL },
    { name: 'Redis',         category: TechCategory.SKILL },
    { name: 'PostgreSQL',    category: TechCategory.SKILL },
    { name: 'MongoDB',       category: TechCategory.SKILL },
    { name: 'BullMQ',        category: TechCategory.SKILL },
    { name: 'Socket.io',     category: TechCategory.SKILL },
    { name: 'Prisma',        category: TechCategory.SKILL },
    { name: 'Selenium',      category: TechCategory.SKILL },
    { name: 'Microservices', category: TechCategory.SKILL },
    { name: 'Celery',        category: TechCategory.SKILL },
    { name: 'WebSockets',    category: TechCategory.SKILL },
    { name: 'Twilio',        category: TechCategory.SKILL },
    { name: 'Claude API',    category: TechCategory.SKILL },
    { name: 'Expo',          category: TechCategory.FRAMEWORK },
  ]

  for (const t of tech) {
    await db.techItem.upsert({ where: { name: t.name }, update: {}, create: t })
  }

  // Helper: look up a TechItem id by name
  const techMap: Record<string, string> = {}
  const allTech = await db.techItem.findMany()
  for (const t of allTech) techMap[t.name] = t.id

  // Experiences
  const experiences = [
    {
      title: 'Software Engineer',
      company: 'Square Software',
      location: 'Tirana, Albania',
      startDate: new Date('2025-09-01'),
      endDate: null,
      current: true,
      order: 0,
      description: [
        'Led, co-developed, and optimized seven Next.js/Node.js/React/Python applications.',
        'Designed architecture reducing data transport weight, increasing capacity and reducing cost.',
        'Split monolithic apps into monorepos, cutting redundancy and improving maintainability.',
        'Restructured applications using orchestrator, Redis, virtualisation, and Docker.',
        'Trained and mentored six interns, enabling independent project ownership.',
        'Managed small development teams, coordinating development, testing, and production.',
        'Integrated ChatGPT API and Claude API; set up and used local LLMs.',
      ],
    },
    {
      title: 'Frontend Developer',
      company: 'EverUp Consulting',
      location: 'Tirana, Albania',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-01'),
      current: false,
      order: 1,
      description: [
        'Developed front-end web applications enhancing user engagement.',
        'Designed both web and mobile-friendly front-end applications.',
        'Delivered pixel-perfect copies of client designs integrated into the framework of choice.',
      ],
    },
    {
      title: 'Fullstack Software Engineer Intern',
      company: 'Coders.al',
      location: 'Tirana, Albania',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-06-01'),
      current: false,
      order: 2,
      description: [
        'Developed responsive web applications using HTML, Tailwind CSS, JavaScript, React.js, Next.js, and Express.',
        'Implemented RESTful API endpoints and learned a variety of design patterns.',
        'Implemented a centralised request/response configuration system using axios interceptors.',
        'Developed middleware to guard protected API routes based on user roles.',
      ],
    },
  ]

  for (const exp of experiences) {
    const id = exp.company.toLowerCase().replace(/\s/g, '-')
    await db.experience.upsert({
      where: { id },
      update: {},
      create: { id, ...exp },
    })
  }

  // Projects from CV
  const projects = [
    {
      id: 'social-media-sentiment',
      title: 'Social Media Sentiment Analysis Platform',
      description:
        'Full-stack platform that scrapes posts and comments across Facebook, Twitter/X, TikTok, Instagram, and YouTube and runs AI-powered sentiment analysis to deliver structured insights. Increased the amount of social media data our AI could analyse at once by 5.7× using parallelisation, compression, and structure.',
      featured: true,
      order: 0,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['Next.js', 'Node.js', 'Python', 'Redis', 'BullMQ', 'Socket.io', 'MongoDB', 'Docker', 'Microservices', 'TypeScript', 'Claude API'],
    },
    {
      id: 'survey-market-research',
      title: 'Survey & Market Research Platform',
      description:
        'Full-stack survey platform for targeted market research with demographic analysis. Features a multi-step survey builder with branching logic, a demographic targeting and weighting engine with margin of error calculation, WhatsApp OTP authentication via Twilio, and an analytics pipeline with cross-tab analysis and population-weighted reporting.',
      featured: true,
      order: 1,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis', 'Socket.io', 'Twilio', 'Docker'],
    },
    {
      id: 'whatsapp-instagram-ai',
      title: 'WhatsApp & Instagram AI Assistant',
      description:
        'Multi-tenant platform that automates customer ordering and support via WhatsApp and Instagram using a multi-state conversational AI. Integrates the Claude API for natural language ordering in Albanian and English, with a unified webhook handler, role-based access control, encrypted credential management, and real-time admin dashboards.',
      featured: true,
      order: 2,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['Node.js', 'Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Socket.io', 'Claude API', 'Docker', 'WebSockets'],
    },
    {
      id: 'waiter-app',
      title: 'Waiter App',
      description:
        'Waiter-facing mobile application for a restaurant management SaaS, used by floor staff in real time on iOS and Android. Features full order lifecycle management with multi-wave additions, real-time WebSocket notifications for waiter calls and order-ready alerts, and floor plan features including table combining and transfers.',
      featured: false,
      order: 3,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['React', 'Expo', 'TypeScript', 'Node.js', 'WebSockets', 'Socket.io', 'PostgreSQL'],
    },
    {
      id: 'restaurant-platform',
      title: 'Restaurant Platform',
      description:
        'Restaurant-side web platform consisting of three interconnected applications: the business dashboard, the platform admin panel, and the Kitchen Display System. The KDS features real-time order cards, wave-addition sub-orders, station filtering, and a scheduled-order priority queue. The dashboard covers analytics, staff management, and financial ledger logging.',
      featured: false,
      order: 4,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['Next.js', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Socket.io', 'WebSockets', 'Docker'],
    },
    {
      id: 'facebook-scraper',
      title: 'Facebook Profile Data Scraper',
      description:
        'Full-stack platform that scrapes publicly visible Facebook profile data on demand via a REST API. Uses a pool of 8 parallel browser-based scraper bots (Selenium + Chrome) running as isolated Docker containers with a Celery task queue. Real-time WebSocket updates via Redis pub/sub, smart result caching, and structured location output designed for AI agent integration.',
      featured: false,
      order: 5,
      liveUrl: null,
      githubUrl: null,
      imageUrl: null,
      tech: ['Python', 'Flask', 'Selenium', 'Docker', 'Redis', 'MongoDB', 'Celery', 'WebSockets'],
    },
  ]

  for (const p of projects) {
    const { tech: techNames, ...projectData } = p
    const techIds = techNames.map((name) => techMap[name]).filter(Boolean)

    await db.project.upsert({
      where: { id: p.id },
      update: {
        title: projectData.title,
        description: projectData.description,
        featured: projectData.featured,
        order: projectData.order,
        // Sync tech items
        techItems: {
          deleteMany: {},
          create: techIds.map((techItemId, index) => ({ techItemId, order: index })),
        },
      },
      create: {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        featured: projectData.featured,
        order: projectData.order,
        liveUrl: projectData.liveUrl,
        githubUrl: projectData.githubUrl,
        imageUrl: projectData.imageUrl,
        techItems: {
          create: techIds.map((techItemId, index) => ({ techItemId, order: index })),
        },
      },
    })
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
