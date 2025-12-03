import { prisma } from '../lib/prisma.js'

async function main() {
  console.log('Seeding tasks...')

  // Clear existing tasks to avoid duplicates during repeated runs
  await prisma.task.deleteMany()

  const tasks = [
    { name: 'Setup project repo', desc: 'Initialize repo and push initial commit', dueDate: new Date('2025-12-05'), priority: 'high', status: 'to-do' },
    { name: 'Design DB schema', desc: 'Finalize Prisma schema for tasks', dueDate: new Date('2025-12-08'), priority: 'medium', status: 'in-progress' },
    { name: 'Implement auth', desc: 'Add JWT authentication and middleware', dueDate: new Date('2025-12-12'), priority: 'high', status: 'to-do' },
    { name: 'Create README', desc: 'Write README with setup instructions', dueDate: null, priority: 'low', status: 'to-do' },
    { name: 'Add CI/CD', desc: 'Configure GitHub Actions for tests', dueDate: new Date('2025-12-20'), priority: 'medium', status: 'to-do' },
    { name: 'Fix bug #42', desc: 'Resolve edge case in payment flow', dueDate: new Date('2025-12-03'), priority: 'high', status: 'in-progress' },
    { name: 'Refactor services', desc: 'Split monolith into services', dueDate: new Date('2026-01-15'), priority: 'medium', status: 'to-do' },
    { name: 'Performance tests', desc: 'Load-test APIs and fix hotspots', dueDate: new Date('2026-01-01'), priority: 'low', status: 'to-do' },
    { name: 'Customer feedback', desc: 'Gather and triage first-week feedback', dueDate: null, priority: 'medium', status: 'to-do' },
    { name: 'Update deps', desc: 'Upgrade node packages to latest stable', dueDate: new Date('2025-12-18'), priority: 'low', status: 'to-do' },
    { name: 'UX polish', desc: 'Improve form validation and UX flows', dueDate: new Date('2025-12-25'), priority: 'medium', status: 'in-progress' },
    { name: 'Write tests', desc: 'Add unit and integration tests', dueDate: new Date('2026-01-10'), priority: 'high', status: 'to-do' },
    { name: 'Onboard team', desc: 'Prepare docs and onboarding checklist', dueDate: new Date('2026-01-05'), priority: 'medium', status: 'to-do' },
    { name: 'Security audit', desc: 'Run automated security scans', dueDate: new Date('2026-02-01'), priority: 'high', status: 'to-do' },
    { name: 'Data migration', desc: 'Migrate legacy data into new DB', dueDate: new Date('2026-02-15'), priority: 'high', status: 'to-do' },
    { name: 'Marketing plan', desc: 'Draft launch marketing campaign', dueDate: null, priority: 'low', status: 'to-do' },
    { name: 'Release v1.0', desc: 'Coordinate final release tasks', dueDate: new Date('2026-03-01'), priority: 'high', status: 'to-do' },
    { name: 'Cleanup', desc: 'Remove deprecated endpoints', dueDate: null, priority: 'low', status: 'to-do' }
  ]

  for (const t of tasks) {
    await prisma.task.create({ data: t })
  }

  const count = await prisma.task.count()
  console.log(`Seed completed. ${count} tasks in DB.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
