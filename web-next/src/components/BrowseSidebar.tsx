import BrowseByCombos from "./BrowseByCombos";
import type { JobCombo } from "@/lib/publicJobsQuery";

export default function BrowseSidebar({ combos }: { combos: JobCombo[] }) {
  if (combos.length === 0) return null;

  return (
    <details className="browse-sidebar" open>
      <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#14213D", marginBottom: 10 }}>
        تصفح حسب المحافظة والتخصص
      </summary>
      <BrowseByCombos combos={combos} variant="list" />
    </details>
  );
}
