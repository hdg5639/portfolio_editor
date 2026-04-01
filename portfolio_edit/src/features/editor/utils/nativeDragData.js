const FALLBACK_MIME = 'text/plain';

export function setNativeDragData(dataTransfer, dragType, id) {
  if (!dataTransfer) return;
  const payload = { type: dragType, id: String(id) };
  try {
    dataTransfer.effectAllowed = 'move';
  } catch {
    // ignore
  }
  try {
    dataTransfer.setData(dragType, payload.id);
  } catch {
    // ignore
  }
  try {
    dataTransfer.setData(FALLBACK_MIME, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function hasNativeDragType(event, acceptedDragType) {
  const accepted = Array.isArray(acceptedDragType) ? acceptedDragType : [acceptedDragType];
  const types = Array.from(event?.dataTransfer?.types || []);
  return accepted.some((dragType) => types.includes(dragType));
}

export function getNativeDragId(dataTransfer, acceptedDragType) {
  if (!dataTransfer) return null;

  const accepted = Array.isArray(acceptedDragType) ? acceptedDragType : [acceptedDragType];
  for (const dragType of accepted) {
    try {
      const direct = dataTransfer.getData(dragType);
      if (direct) return direct;
    } catch {
      // ignore
    }
  }

  try {
    const fallback = dataTransfer.getData(FALLBACK_MIME);
    if (!fallback) return null;
    const parsed = JSON.parse(fallback);
    if (parsed && accepted.includes(parsed.type) && parsed.id) {
      return String(parsed.id);
    }
    return fallback;
  } catch {
    return null;
  }
}
