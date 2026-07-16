import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SystemRole, ProjectRole, ProjectStatus, BugStatus, BugPriority, BugSeverity, ActivityType, NotificationType } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required to seed");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const demoUsers = [
  ["admin@bugflow.dev", "admin", "Admin User", SystemRole.ADMIN],
  ["manager@bugflow.dev", "manager", "Project Manager", SystemRole.PROJECT_MANAGER],
  ["tester@bugflow.dev", "tester", "QA Tester", SystemRole.TESTER],
  ["developer1@bugflow.dev", "developer1", "Developer One", SystemRole.DEVELOPER],
  ["developer2@bugflow.dev", "developer2", "Developer Two", SystemRole.DEVELOPER],
] as const;

async function main() {
  const passwordHash = await hash("Password@123", 12);
  const users = new Map<string, string>();

  for (const [email, username, fullName, systemRole] of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { username, fullName, systemRole },
      create: { email, username, fullName, systemRole, passwordHash },
    });
    users.set(email, user.id);
  }

  const managerId = users.get("manager@bugflow.dev")!;
  const testerId = users.get("tester@bugflow.dev")!;
  const developer1Id = users.get("developer1@bugflow.dev")!;
  const developer2Id = users.get("developer2@bugflow.dev")!;

  const projects = await Promise.all([
    prisma.project.upsert({ where: { code: "SHOP" }, update: {}, create: { code: "SHOP", name: "Commerce Platform", description: "Customer storefront and checkout", status: ProjectStatus.ACTIVE, nextBugNumber: 13, createdById: managerId } }),
    prisma.project.upsert({ where: { code: "MOBILE" }, update: {}, create: { code: "MOBILE", name: "Mobile Application", description: "Cross-platform customer app", status: ProjectStatus.ACTIVE, nextBugNumber: 7, createdById: managerId } }),
  ]);

  for (const project of projects) {
    for (const [userId, role] of [[managerId, ProjectRole.MANAGER], [testerId, ProjectRole.TESTER], [developer1Id, ProjectRole.DEVELOPER], [developer2Id, ProjectRole.DEVELOPER]] as const) {
      await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId } }, update: { role }, create: { projectId: project.id, userId, role } });
    }
  }

  const statuses = [BugStatus.NEW, BugStatus.ASSIGNED, BugStatus.IN_PROGRESS, BugStatus.RESOLVED, BugStatus.READY_FOR_TEST, BugStatus.REOPENED, BugStatus.CLOSED];
  const resolvedStatuses = new Set<BugStatus>([BugStatus.RESOLVED, BugStatus.READY_FOR_TEST, BugStatus.CLOSED]);
  let firstBugId = "";
  for (const project of projects) {
    const count = project.code === "SHOP" ? 12 : 6;
    for (let sequenceNumber = 1; sequenceNumber <= count; sequenceNumber++) {
      const status = statuses[(sequenceNumber - 1) % statuses.length];
      const bugCode = `${project.code}-${String(sequenceNumber).padStart(3, "0")}`;
      const bug = await prisma.bug.upsert({
        where: { bugCode },
        update: {},
        create: {
          bugCode, sequenceNumber, projectId: project.id,
          title: `Demo issue ${sequenceNumber} in ${project.name}`,
          description: "Seeded issue demonstrating BugFlow workflow and filtering.",
          status,
          priority: [BugPriority.LOW, BugPriority.MEDIUM, BugPriority.HIGH, BugPriority.URGENT][sequenceNumber % 4],
          severity: [BugSeverity.MINOR, BugSeverity.MAJOR, BugSeverity.CRITICAL, BugSeverity.BLOCKER][sequenceNumber % 4],
          reporterId: testerId,
          assigneeId: status === BugStatus.NEW ? null : sequenceNumber % 2 ? developer1Id : developer2Id,
          testerId,
          dueDate: new Date(Date.now() + (sequenceNumber - 5) * 86_400_000),
          resolvedAt: resolvedStatuses.has(status) ? new Date() : null,
          closedAt: status === BugStatus.CLOSED ? new Date() : null,
        },
      });
      if (!firstBugId) firstBugId = bug.id;
    }
  }

  await prisma.comment.upsert({ where: { id: "seed-comment-1" }, update: {}, create: { id: "seed-comment-1", bugId: firstBugId, authorId: developer1Id, content: "I can reproduce this issue and am investigating it." } });
  await prisma.activityLog.upsert({ where: { id: "seed-activity-1" }, update: {}, create: { id: "seed-activity-1", projectId: projects[0].id, bugId: firstBugId, actorId: testerId, actionType: ActivityType.BUG_CREATED, description: "Created the demo bug" } });
  await prisma.notification.upsert({ where: { id: "seed-notification-1" }, update: {}, create: { id: "seed-notification-1", recipientId: developer1Id, actorId: managerId, bugId: firstBugId, type: NotificationType.BUG_ASSIGNED, title: "Bug assigned", message: "A demo bug was assigned to you." } });
}

main().finally(async () => prisma.$disconnect());
