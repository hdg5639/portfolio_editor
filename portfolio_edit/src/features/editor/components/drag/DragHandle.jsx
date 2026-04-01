export default function DragHandle({
  title,
  isArmed = false,
  className = 'drag-handle',
  handleProps = {},
  onClick,
  children = '⋮⋮',
}) {
  return (
    <div
      className={`${className}${isArmed ? ' is-armed' : ''}`}
      title={title}
      {...handleProps}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
