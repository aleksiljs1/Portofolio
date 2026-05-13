import { PrismaClient, TechCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Admin user
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'changeme', 12)
  await db.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'aleksanderiljas@gmail.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? 'aleksanderiljas@gmail.com',
      passwordHash: hash,
    },
  })

  // Tech items
  const tech = [
    { name: 'Next.js',    category: TechCategory.FRAMEWORK },
    { name: 'React',      category: TechCategory.FRAMEWORK },
    { name: 'Node.js',    category: TechCategory.FRAMEWORK },
    { name: 'Flask',      category: TechCategory.FRAMEWORK },
    { name: 'TypeScript', category: TechCategory.LANGUAGE },
    { name: 'JavaScript', category: TechCategory.LANGUAGE },
    { name: 'Python',     category: TechCategory.LANGUAGE },
    { name: 'Java',       category: TechCategory.LANGUAGE },
    { name: 'SQL',        category: TechCategory.LANGUAGE },
    { name: 'Docker',     category: TechCategory.SKILL },
    { name: 'Redis',      category: TechCategory.SKILL },
    { name: 'PostgreSQL', category: TechCategory.SKILL },
    { name: 'MongoDB',    category: TechCategory.SKILL },
    { name: 'BullMQ',     category: TechCategory.SKILL },
    { name: 'Socket.io',  category: TechCategory.SKILL },
    { name: 'Prisma',     category: TechCategory.SKILL },
    { name: 'Selenium',   category: TechCategory.SKILL },
    { name: 'Microservices', category: TechCategory.SKILL },
  ]

  for (const t of tech) {
    await db.techItem.upsert({ where: { name: t.name }, update: {}, create: t })
  }

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
    await db.experience.upsert({
      where: { id: exp.company.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: { id: exp.company.toLowerCase().replace(/\s/g, '-'), ...exp },
    })
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
