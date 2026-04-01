export default function ReorderDropOverlay({
  active = false,
  onClick,
  className = 'tap-reorder-overlay',
  label = '여기로 이동',
}) {
  if (!active) return null;

  return (
    <button type="button" className={`${className} active`.trim()} onClick={onClick}>
      {label}
    </button>
  );
}
