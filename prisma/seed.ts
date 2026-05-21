import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding DevSphere database...')

  // ── 1. Create test user ──
  const hashed = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where:  { email: 'test@devsphere.com' },
    update: {},
    create: {
      email:    'test@devsphere.com',
      username: 'devshishanki',
      password: hashed,
      name:     'Shishanki Dev',
      headline: 'Full Stack Developer | React · Node · TypeScript',
      skills:   ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    }
  })
  console.log(`✓ User created: ${user.email}`)

  // ── 2. Create communities ──
  const comms = [
    { name: 'TypeScript', slug: 'typescript',  description: 'All things TypeScript — tips, patterns, releases' },
    { name: 'ReactDevs',  slug: 'react-devs',  description: 'React hooks, components, and best practices' },
    { name: 'AILab',      slug: 'ai-lab',      description: 'LLMs, RAG, agents, and AI engineering' },
    { name: 'OpenSource', slug: 'open-source', description: 'Open source projects, contributions, tools' },
    { name: 'DevOps',     slug: 'devops',      description: 'Docker, K8s, CI/CD, and cloud infrastructure' },
  ]
  const created: any[] = []
  for (const c of comms) {
    const comm = await prisma.community.upsert({
      where: { slug: c.slug }, update: {}, create: c
    })
    created.push(comm)
    console.log(`✓ Community: c/${comm.name}`)
  }

  // ── 3. Create sample posts ──
  const posts = [
    {
      title:   'Advanced TypeScript patterns every dev should know',
      content: 'Utility types, conditional types, and mapped types are the secret weapons of senior TypeScript developers. Let me walk you through each one with real examples...',
      type: 'text', tags: ['TypeScript', 'Patterns', 'Tips'],
      communityId: created[0].id,
    },
    {
      title:   'Building RAG pipelines with LangChain and pgvector',
      content: 'RAG (Retrieval Augmented Generation) allows your LLM to answer questions using your own data. Here is how I built a production RAG pipeline...',
      type: 'text', tags: ['AI', 'LLMs', 'Python'],
      communityId: created[2].id,
    },
    {
      title:   'React 19 features that change everything',
      content: 'React 19 introduces Server Actions, the use() hook, and massive improvements to the compiler. Here is what you need to know...',
      type: 'text', tags: ['React', 'React19', 'Frontend'],
      communityId: created[1].id,
    },
  ]
  for (const p of posts) {
    await prisma.post.create({
      data: { ...p, authorId: user.id }
    })
    console.log(`✓ Post: "${p.title.substring(0,40)}..."`)
  }

  console.log('\n✅ Seed complete! Login with:')
  console.log('📧 Email:    test@devsphere.com')
  console.log('🔑 Password: password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())