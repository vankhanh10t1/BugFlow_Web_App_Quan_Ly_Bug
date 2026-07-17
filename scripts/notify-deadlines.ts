import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { createDeadlineNotifications } = await import("../src/features/notifications/deadline-service");
  const { prisma } = await import("../src/lib/prisma");
  try {
    const result = await createDeadlineNotifications();
    console.log(`Deadline notifications: scanned=${result.scannedBugs}, candidates=${result.candidateNotifications}, created=${result.createdNotifications}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error("Unable to create deadline notifications", error instanceof Error ? error.message : error); process.exitCode = 1; });
