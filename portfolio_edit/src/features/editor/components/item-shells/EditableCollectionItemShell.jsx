export default function EditableCollectionItemShell({
  as = 'div',
  className = '',
  style,
  isDragging = false,
  isDragOver = false,
  selectionState = {},
  dragEvents = {},
  onClick,
  helperSlot = null,
  overlaySlot = null,
  body,
  measureRef,
}) {
  const Tag = as;
  const { selected = false, ancestor = false } = selectionState || {};

  return (
    <Tag
      className={`${className} selection-scope selection-item ${
        isDragging ? 'dragging' : ''
      } ${isDragOver ? 'drag-over' : ''} ${selected ? 'is-selected' : ''} ${ancestor ? 'is-ancestor' : ''}`.trim()}
      style={style}
      onClick={onClick}
      {...dragEvents}
    >
      {helperSlot}
      {overlaySlot}
      {typeof body === 'function' ? body({ measureRef }) : body}
    </Tag>
  );
}
