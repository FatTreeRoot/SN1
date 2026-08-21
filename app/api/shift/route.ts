import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { getActiveShift, startShift } from "@/lib/shift";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const shift = await getActiveShift(user.oid);
  return NextResponse.json({ shift });
}

/** Start a shift. Multipart so the optional walkaround photo streams
 *  through; the photo and damage note go to storage as the fleet check. */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("submit");
  if (error) return error;

  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) {
    return NextResponse.json({ error: "That photo is too large to file." }, { status: 413 });
  }

  const form = await request.formData();
  const vehicleId = String(form.get("vehicleId") ?? "");
  const areaId = String(form.get("areaId") ?? "");
  const partnerOid = form.get("partnerOid") ? String(form.get("partnerOid")) : undefined;
  const partnerName = form.get("partnerName") ? String(form.get("partnerName")) : undefined;
  const damageNote = form.get("damageNote") ? String(form.get("damageNote")) : undefined;
  const photo = form.get("photo");

  let walkaround;
  if (damageNote || (photo instanceof File && photo.size > 0)) {
    walkaround = {
      damageNote,
      photo:
        photo instanceof File && photo.size > 0
          ? {
              buffer: Buffer.from(await photo.arrayBuffer()),
              contentType: photo.type || "image/jpeg",
            }
          : undefined,
    };
  }

  try {
    const result = await startShift({
      user,
      vehicleId,
      areaId,
      partnerOid,
      partnerName,
      walkaround,
    });
    return NextResponse.json({
      shift: result.shift,
      fleetCheckOccurrence: result.fleetCheckOccurrence,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The shift did not start." },
      { status: 400 },
    );
  }
}
