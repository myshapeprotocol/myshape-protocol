interface Props {
  label: string;
}

export default function SectionHeader({ label }: Props) {
  return (
    <div className="il-section-header">
      <span className="il-section-label">{label}</span>
      <div className="il-section-line" />
    </div>
  );
}
