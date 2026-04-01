export function SelectionBadge({ label, tone = 'block' }) {
  return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
}

export function selectEditorKey(store, key, label) {
  store.actions.select({ key, label });
}

export function createSelectHandler(
  store,
  key,
  label,
  {
    stopPropagation = true,
    preventDefault = false,
  } = {},
) {
  return (event) => {
    if (preventDefault) event?.preventDefault?.();
    if (stopPropagation) event?.stopPropagation?.();
    selectEditorKey(store, key, label);
  };
}

export function selectableStyle(store, key) {
  return store.actions.styleFor(key);
}

export function selectableInputProps(store, key, label) {
  return {
    style: selectableStyle(store, key),
    onClick: createSelectHandler(store, key, label),
  };
}

export const selectableViewProps = selectableInputProps;

export function inlineEditableProps(store, key, label) {
  return {
    editable: store.mode === 'edit',
    selected: store.selected?.key === key,
    onSelect: () => selectEditorKey(store, key, label),
    style: selectableStyle(store, key),
  };
}
