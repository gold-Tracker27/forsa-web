export default function ProfileCompletionBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "#2F6F4E" : percent >= 50 ? "#8A570D" : "#B03A14";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13.5, fontWeight: 700, color: "#14213D" }}>
        <span>اكتمال البروفايل</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#F0EDE3", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}
