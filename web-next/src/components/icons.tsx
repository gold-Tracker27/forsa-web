type IconProps = { size?: number };

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const iconStyle = (size: number): React.CSSProperties => ({
  display: "inline-block",
  verticalAlign: "-2px",
  marginInlineEnd: 3,
  flexShrink: 0,
});

export function TagIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={iconStyle(size)} {...base}>
      <path d="M12.59 2.59 21 11l-9.41 9.41a2 2 0 0 1-2.83 0L3 14.65a2 2 0 0 1 0-2.83L12.41 2H12.59Z" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={iconStyle(size)} {...base}>
      <path d="M12 21c-4-4.2-7-7.9-7-11.5a7 7 0 0 1 14 0C19 13.1 16 16.8 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function BriefcaseIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={iconStyle(size)} {...base}>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M2.5 12.5h19" />
    </svg>
  );
}

export function ShieldIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={iconStyle(size)} {...base}>
      <path d="M12 2.5 4.5 5.5v5.8c0 5 3.2 8.7 7.5 10.2 4.3-1.5 7.5-5.2 7.5-10.2V5.5L12 2.5Z" />
    </svg>
  );
}

export function DocumentIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={iconStyle(size)} {...base}>
      <path d="M6 2.5h8.5L19 7v14a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 21V2.5Z" />
      <path d="M14 2.5V7h5" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  );
}
