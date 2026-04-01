export default function CustomComplexItemRenderer({ sectionId, item, store, disabled, ComplexItemComponent }) {
    return <ComplexItemComponent sectionId={sectionId} item={item} store={store} editable={!disabled} />;
}
