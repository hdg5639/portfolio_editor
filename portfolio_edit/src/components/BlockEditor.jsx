import ImageInput from './ImageInput';

export default function BlockEditor({ block, onChange, onRemove }) {
  return (
    <div className="editor-card nested-card">
      <div className="row between">
        <strong>{block.type.toUpperCase()} BLOCK</strong>
        <button className="ghost danger" onClick={onRemove}>삭제</button>
      </div>

      <label className="field-row">
        <span>블록 제목</span>
        <input value={block.title || ''} onChange={(e) => onChange('title', e.target.value)} />
      </label>

      {block.type === 'text' && (
        <label className="field-row">
          <span>내용</span>
          <textarea rows="5" value={block.content || ''} onChange={(e) => onChange('content', e.target.value)} />
        </label>
      )}

      {block.type === 'list' && (
        <label className="field-row">
          <span>리스트 항목</span>
          <textarea
            rows="5"
            value={(block.items || []).join('\n')}
            onChange={(e) => onChange('items', e.target.value.split('\n'))}
          />
        </label>
      )}

      {block.type === 'image' && (
        <>
          <label className="field-row">
            <span>캡션</span>
            <input value={block.caption || ''} onChange={(e) => onChange('caption', e.target.value)} />
          </label>
          <div className="field-row">
            <span>이미지 업로드</span>
            <ImageInput multiple onChange={(urls) => onChange('images', [...(block.images || []), ...urls])} />
          </div>
          {!!block.images?.length && (
            <div className="thumb-grid">
              {block.images.map((src, index) => (
                <div key={`${block.id}-${index}`} className="thumb-item">
                  <img src={src} alt="uploaded" />
                  <button
                    className="ghost danger small"
                    onClick={() => onChange('images', block.images.filter((_, i) => i !== index))}
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
