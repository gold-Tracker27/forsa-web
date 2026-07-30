// بيحوّل رقم موبايل مصري (محلي أو دولي) لصيغة E.164، أو يرجّع null لو الرقم مش صحيح
export function normalizeEgyptianPhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, "");

  const local = digits.match(/^01[0125]\d{8}$/);
  if (local) return "+20" + digits.slice(1);

  const intl = digits.match(/^\+201[0125]\d{8}$/);
  if (intl) return digits;

  return null;
}
