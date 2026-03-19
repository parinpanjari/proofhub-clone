import { PrismaClient, UserRole, ProjectStatus, TaskPriority, WorkflowStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const org = await prisma.organization.create({
    data: {
      name: 'My Organization',
      primaryColor: '#6366f1',
      maxUsers: 50,
    },
  });

  console.log(`Created organization: ${org.name}`);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@proofhub.local',
      passwordHash,
      role: UserRole.OWNER,
      organizationId: org.id,
      timezone: 'America/New_York',
      isActive: true,
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  const memberUser = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@proofhub.local',
      passwordHash,
      role: UserRole.MEMBER,
      organizationId: org.id,
      timezone: 'America/New_York',
      isActive: true,
    },
  });

  console.log(`Created member user: ${memberUser.email}`);

  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design and improved UX.',
      color: '#6366f1',
      status: ProjectStatus.ACTIVE,
      createdBy: adminUser.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created project: ${project.name}`);

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: adminUser.id, role: 'MANAGER' },
      { projectId: project.id, userId: memberUser.id, role: 'MEMBER' },
    ],
  });

  const todoList = await prisma.taskList.create({
    data: {
      projectId: project.id,
      name: 'To Do',
      color: '#94a3b8',
      order: 0,
      isDefault: true,
      workflowStatus: WorkflowStatus.TODO,
    },
  });

  const inProgressList = await prisma.taskList.create({
    data: {
      projectId: project.id,
      name: 'In Progress',
      color: '#3b82f6',
      order: 1,
      workflowStatus: WorkflowStatus.IN_PROGRESS,
    },
  });

  const doneList = await prisma.taskList.create({
    data: {
      projectId: project.id,
      name: 'Done',
      color: '#22c55e',
      order: 2,
      workflowStatus: WorkflowStatus.DONE,
    },
  });

  const tasks = [
    { title: 'Create wireframes', listId: todoList.id, priority: TaskPriority.HIGH, taskNumber: 1 },
    { title: 'Design homepage mockup', listId: todoList.id, priority: TaskPriority.MEDIUM, taskNumber: 2 },
    { title: 'Set up project repository', listId: inProgressList.id, priority: TaskPriority.HIGH, taskNumber: 3 },
    { title: 'Define color palette', listId: doneList.id, priority: TaskPriority.LOW, taskNumber: 4 },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        projectId: project.id,
        listId: task.listId,
        title: task.title,
        priority: task.priority,
        createdBy: adminUser.id,
        taskNumber: task.taskNumber,
      },
    });
  }

  console.log(`Created ${tasks.length} sample tasks`);

  const labels = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#3b82f6' },
    { name: 'Improvement', color: '#8b5cf6' },
    { name: 'Design', color: '#f59e0b' },
    { name: 'Documentation', color: '#6b7280' },
  ];

  await prisma.label.createMany({
    data: labels.map((label) => ({ ...label, orgId: org.id })),
  });

  console.log(`Created ${labels.length} labels`);

  const team = await prisma.team.create({
    data: {
      orgId: org.id,
      name: 'Engineering',
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, userId: adminUser.id },
      { teamId: team.id, userId: memberUser.id },
    ],
  });

  console.log('Created team: Engineering');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
