export default function InlineEditable({
  tag = 'div',
  value,
  onChange,
  editable,
  selected,
  onSelect,
  style,
  multiline = false,
  placeholder = '',
  className = '',
}) {
  const handleClick = (e) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.();
  };

  if (!editable) {
    const Tag = tag;
    return <Tag className={className} style={style}>{value || placeholder}</Tag>;
  }

  if (multiline) {
    return (
      <textarea
        className={`inline-editable ${selected ? 'selected' : ''} ${className}`.trim()}
        value={value}
        placeholder={placeholder}
        onClick={handleClick}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        rows={Math.max(2, String(value || '').split('\n').length)}
      />
    );
  }

  return (
    <input
      className={`inline-editable ${selected ? 'selected' : ''} ${className}`.trim()}
      value={value}
      placeholder={placeholder}
      onClick={handleClick}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    />
  );
}
