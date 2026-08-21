import { randomUUID } from "node:crypto";
import { appendAudit } from "@/lib/auth/audit";
import type { AppUser } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { fileRecord } from "@/lib/filing";
import { getArea, getVehicle } from "@/lib/vocab";

/**
 * Shift sign-on: one screen, one tap each — vehicle, area, partner.
 * Completing it satisfies the fleet vehicle check (filed as a record through
 * the normal pipeline; the damage note never touches this database) and
 * sets the context every subsequent submission inherits.
 */

export async function getActiveShift(oid: string) {
  return db.shift.findFirst({
    where: { userOid: oid, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
}

export async function startShift(input: {
  user: AppUser;
  vehicleId: string;
  areaId: string;
  partnerOid?: string;
  partnerName?: string;
  walkaround?: {
    damageNote?: string;
    photo?: { buffer: Buffer; contentType: string };
  };
}) {
  const vehicle = getVehicle(input.vehicleId);
  const area = getArea(input.areaId);
  if (!vehicle || !area) throw new Error("Vehicle and area are required.");

  // One active shift per user: starting a new one ends a stale one
  await db.shift.updateMany({
    where: { userOid: input.user.oid, endedAt: null },
    data: { endedAt: new Date() },
  });

  const shift = await db.shift.create({
    data: {
      userOid: input.user.oid,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      areaId: area.id,
      areaName: area.name,
      partnerOid: input.partnerOid,
      partnerName: input.partnerName,
    },
  });

  await appendAudit({
    actorOid: input.user.oid,
    action: "shift-start",
    surface: "field",
    detail: { shiftId: shift.id, vehicleId: vehicle.id, areaId: area.id },
  });

  // The fleet check files itself as part of the ritual. Structured content
  // (and any photo) streams to storage; nothing lands here.
  const checkContent = input.walkaround?.photo ?? {
    buffer: Buffer.from(
      JSON.stringify(
        {
          kind: "fleet-check",
          vehicle: vehicle.name,
          area: area.name,
          walkaroundCompleted: Boolean(input.walkaround),
          damageNote: input.walkaround?.damageNote ?? "",
          shiftStartedAt: shift.startedAt.toISOString(),
        },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  };

  const fleetCheck = await fileRecord({
    user: input.user,
    recordTypeId: "RT-FLT",
    capturedAt: new Date().toISOString(),
    idempotencyKey: randomUUID(),
    content: checkContent,
    shift: {
      id: shift.id,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      areaId: area.id,
      areaName: area.name,
    },
  });

  return { shift, fleetCheckOccurrence: fleetCheck.occurrenceNumber };
}

export async function endShift(oid: string) {
  const shift = await getActiveShift(oid);
  if (shift) {
    await db.shift.update({ where: { id: shift.id }, data: { endedAt: new Date() } });
    await appendAudit({
      actorOid: oid,
      action: "shift-end",
      surface: "field",
      detail: { shiftId: shift.id },
    });
  }
  return shift;
}
