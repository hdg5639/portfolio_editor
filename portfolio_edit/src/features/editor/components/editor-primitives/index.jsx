export function SelectionBadge({ label, tone = 'block' }) {
  return <span className={`selection-badge selection-badge-${tone}`}>{label}</span>;
}

function selectKey(store, key, label) {
  store.actions.select({ key, label });
}

export function selectableInputProps(store, key, label) {
  return {
    style: store.actions.styleFor(key),
    onClick: (event) => {
      event.stopPropagation();
      selectKey(store, key, label);
    },
  };
}

export const selectableViewProps = selectableInputProps;

export function inlineEditableProps(store, key, label) {
  return {
    editable: store.mode === 'edit',
    selected: store.selected?.key === key,
    onSelect: () => selectKey(store, key, label),
    style: store.actions.styleFor(key),
  };
}
