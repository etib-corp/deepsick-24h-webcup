"use server";

import { revalidatePath } from "next/cache";

import { verifyBackup } from "@/lib/backup";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { auditActor, recordSecurityEvent } from "@/lib/security";

/** Bounds the drill size so a verification never hammers the database. */
const ROW_CAP = 5000;

/**
 * F87 — runs a backup verification drill over the critical datasets: each
 * dataset is exported to a canonical JSON snapshot and verified by
 * re-reading its own serialisation. The report (rows, bytes, checksum,
 * per-dataset verdict) is stored and shown in the Council console.
 */
export async function runBackupVerificationAction() {
  const session = await requirePageRole(["COUNCIL"]);
  const startedAt = Date.now();

  try {
    const [users, requests, reports, orders, appointments, contactMessages, notifications, transactions] =
      await Promise.all([
        prisma.user.findMany({
          select: { id: true, email: true, username: true, role: true, createdAt: true },
          take: ROW_CAP,
        }),
        prisma.serviceRequest.findMany({
          select: {
            id: true,
            reference: true,
            subject: true,
            status: true,
            priority: true,
            authorId: true,
            createdAt: true,
          },
          take: ROW_CAP,
        }),
        prisma.report.findMany({
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            sector: true,
            authorId: true,
            createdAt: true,
          },
          take: ROW_CAP,
        }),
        prisma.order.findMany({
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            total: true,
            customerId: true,
            createdAt: true,
          },
          take: ROW_CAP,
        }),
        prisma.appointment.findMany({
          select: {
            id: true,
            reference: true,
            serviceId: true,
            citizenId: true,
            date: true,
            status: true,
          },
          take: ROW_CAP,
        }),
        prisma.contactMessage.findMany({
          select: { id: true, reference: true, subject: true, status: true, createdAt: true },
          take: ROW_CAP,
        }),
        prisma.notification.findMany({
          select: { id: true, userId: true, title: true, read: true, createdAt: true },
          take: ROW_CAP,
        }),
        prisma.walletTransaction.findMany({
          select: { id: true, userId: true, label: true, amount: true, createdAt: true },
          take: ROW_CAP,
        }),
      ]);

    const result = verifyBackup([
      { key: "users", rows: users },
      { key: "requests", rows: requests },
      { key: "reports", rows: reports },
      { key: "orders", rows: orders },
      { key: "appointments", rows: appointments },
      { key: "contactMessages", rows: contactMessages },
      { key: "notifications", rows: notifications },
      { key: "transactions", rows: transactions },
    ]);

    await prisma.backupCheck.create({
      data: {
        actorId: session.user.id,
        status: result.ok ? "VERIFIED" : "FAILED",
        durationMs: Date.now() - startedAt,
        totalRows: result.totalRows,
        totalSize: result.totalBytes,
        datasets: JSON.stringify(result.datasets),
      },
    });

    await recordSecurityEvent({
      type: "BACKUP_VERIFIED",
      outcome: result.ok ? "SUCCESS" : "FLAGGED",
      ...auditActor(session),
      targetType: "backup",
      detail: `Vérification de sauvegarde ${result.ok ? "réussie" : "en échec"} · ${result.totalRows} lignes`,
    });
  } catch {
    await recordSecurityEvent({
      type: "BACKUP_VERIFIED",
      outcome: "FLAGGED",
      ...auditActor(session),
      targetType: "backup",
      detail: "Vérification de sauvegarde interrompue",
    });
  }

  revalidatePath("/council/backups");
}
