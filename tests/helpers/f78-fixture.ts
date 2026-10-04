import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";

export async function createFixture(reportCount = 400) {
  const prefix = `f78-${randomUUID()}`;
  const owner = await prisma.user.create({ data: { name: "F78 citizen", email: `${prefix}@example.test` } });
  const other = await prisma.user.create({ data: { email: `${prefix}-other@example.test` } });
  const service = await prisma.municipalService.create({
    data: { slug: prefix, name: "F78 test service", description: "Integration test only" },
  });
  const consultation = await prisma.consultation.create({
    data: { slug: prefix, title: "F78 test consultation", description: "Integration test only" },
  });
  await prisma.report.createMany({
    data: Array.from({ length: reportCount }, (_, i) => ({
      id: `${prefix}-report-${i}`, reference: `${prefix}-ref-${i}`,
      type: ["SECURITY", "MEDICAL", "MAINTENANCE", "CLEANLINESS"][i % 4],
      title: `F78 report ${i}`, description: "Long stored description. ".repeat(150),
      authorId: owner.id,
    })),
  });
  return { prefix, owner, other, service, consultation };
}

export async function cleanFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  // Delete only this run's synthetic entities. Cascades clean related test rows.
  await prisma.user.deleteMany({ where: { id: { in: [fixture.owner.id, fixture.other.id] } } });
  await prisma.consultation.delete({ where: { id: fixture.consultation.id } });
  await prisma.municipalService.delete({ where: { id: fixture.service.id } });
}

export function queryLog(): Array<{ query: string; duration: number }> {
  return (globalThis as unknown as { f78Queries: Array<{ query: string; duration: number }> }).f78Queries;
}
