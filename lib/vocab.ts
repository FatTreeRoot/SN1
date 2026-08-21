import vocabJson from "@/config/vocabularies.json";

/**
 * Controlled vocabularies: seeded from config/vocabularies.json, editable by
 * PS-Admins (admin overrides land in AppConfig and are merged here at
 * checkpoint 7). Every value carries a stable id alongside its display name.
 */

export type Area = { id: string; name: string };
export type Category = { id: string; name: string };
export type Location = { id: string; name: string; areaId: string };
export type Vehicle = { id: string; name: string };
export type RecordType = {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  surface: string[];
  routing: string;
  sensitivityDefault: "standard" | "confidential" | "restricted";
  retentionClass: string;
};

export type Vocabularies = {
  provisional: boolean;
  areas: Area[];
  recordTypes: RecordType[];
  categories: Category[];
  locations: Location[];
  vehicles: Vehicle[];
};

export function getVocabularies(): Vocabularies {
  const v = vocabJson as unknown as Vocabularies;
  return v;
}

export function getRecordType(id: string): RecordType | undefined {
  return getVocabularies().recordTypes.find((rt) => rt.id === id && rt.enabled);
}

export function getCategory(id: string): Category | undefined {
  return getVocabularies().categories.find((c) => c.id === id);
}

export function getLocation(id: string): Location | undefined {
  return getVocabularies().locations.find((l) => l.id === id);
}

export function getArea(id: string): Area | undefined {
  return getVocabularies().areas.find((a) => a.id === id);
}

export function getVehicle(id: string): Vehicle | undefined {
  return getVocabularies().vehicles.find((v) => v.id === id);
}
