import Link from "next/link";
import { slugify } from "@/lib/constants";
import { tagStyle } from "@/lib/jobCardStyles";
import type { JobCombo } from "@/lib/publicJobsQuery";

type Props = {
  combos: JobCombo[];
  variant?: "inline" | "list";
};

export default function BrowseByCombos({ combos, variant = "inline" }: Props) {
  if (combos.length === 0) return null;

  if (variant === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {combos.map((c) => (
          <Link
            key={`${c.governorate}-${c.specialization}`}
            href={`/jobs/${slugify(c.governorate)}/${slugify(c.specialization)}`}
            style={{ fontSize: 13.5, color: "#14213D", textDecoration: "none", padding: "7px 4px", borderBottom: "1px solid #14213D14" }}
          >
            وظائف {c.specialization} في {c.governorate}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {combos.map((c) => (
        <Link
          key={`${c.governorate}-${c.specialization}`}
          href={`/jobs/${slugify(c.governorate)}/${slugify(c.specialization)}`}
          style={{ ...tagStyle, textDecoration: "none", color: "#14213D", padding: "8px 14px", fontSize: 13.5 }}
        >
          وظائف {c.specialization} في {c.governorate}
        </Link>
      ))}
    </div>
  );
}
