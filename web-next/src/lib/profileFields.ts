export type SkillEntry = {
  name: string;
  level: string;
};

// بيقبل الشكل القديم (مصفوفة نصوص) والجديد (مصفوفة {name, level}) ويوحّدهم
export function normalizeEntries(raw: any): SkillEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): SkillEntry | null => {
      if (typeof entry === "string") {
        const name = entry.trim();
        return name ? { name, level: "" } : null;
      }
      if (entry && typeof entry.name === "string" && entry.name.trim()) {
        return { name: entry.name.trim(), level: entry.level || "" };
      }
      return null;
    })
    .filter((entry): entry is SkillEntry => entry !== null);
}

export function formatEntries(entries: SkillEntry[], levelLabels: Record<string, string>): string {
  return entries
    .map((e) => (e.level ? `${e.name} (${levelLabels[e.level] || e.level})` : e.name))
    .join(" • ");
}
