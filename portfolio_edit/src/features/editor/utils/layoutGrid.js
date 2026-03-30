export const GRID_COLUMN_COUNT = 12;
export const GRID_MIN_ROWS = 4;
export const GRID_ROW_HEIGHT = 40;
export const GRID_GAP = 10;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getItemId = (item) => item?.id ?? item?.key;
const isVisibleItem = (item) => item?.visible !== false;

function sanitizeSpan(value, fallback, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), 1, max);
}

function sanitizeStart(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.round(numeric));
}

function resolveCenteredStart(anchor, span, fallback = 1, maxStart = null) {
  const safeAnchor = sanitizeStart(anchor, fallback);
  const safeSpan = Math.max(1, sanitizeSpan(span, 1, 999));
  const centered = Math.round(safeAnchor - safeSpan / 2 + 0.5);
  const normalized = Math.max(1, centered);
  if (Number.isFinite(maxStart)) {
    return clamp(normalized, 1, Math.max(1, maxStart));
  }
  return normalized;
}

function normalizeItemShape(item, columns = GRID_COLUMN_COUNT) {
  const colSpan = sanitizeSpan(item.colSpan, Math.min(12, columns), columns);
  const rowSpan = sanitizeSpan(item.rowSpan, 1, 48);

  return {
    ...item,
    colSpan,
    rowSpan,
    gridX: sanitizeStart(item.gridX, 1),
    gridY: sanitizeStart(item.gridY, 1),
  };
}

function overlaps(a, b) {
  const aEndX = a.gridX + a.colSpan;
  const aEndY = a.gridY + a.rowSpan;
  const bEndX = b.gridX + b.colSpan;
  const bEndY = b.gridY + b.rowSpan;

  return a.gridX < bEndX && aEndX > b.gridX && a.gridY < bEndY && aEndY > b.gridY;
}

function splitGridItems(items, columns = GRID_COLUMN_COUNT) {
  const normalized = (items || []).map((item) => normalizeItemShape(item, columns));
  return {
    active: normalized.filter(isVisibleItem),
    inactive: normalized.filter((item) => !isVisibleItem(item)),
  };
}

function stripTransientGridState(item) {
  if (!item || typeof item !== 'object') return item;
  const { minRowSpan, ...rest } = item;
  return rest;
}

function mergePlacedItems(items, placedItems) {
  const placedById = new Map(placedItems.map((item) => [String(getItemId(item)), item]));
  return (items || []).map((item) => placedById.get(String(getItemId(item))) || item);
}

export function mergeGridDraftIntoSource(sourceItems, draftItems, { copySpans = false, copySpanIds = [] } = {}) {
  const source = sourceItems || [];
  const draft = draftItems || [];
  const copySpanIdSet = new Set((copySpanIds || []).map((value) => String(value)));
  const sourceById = new Map(source.map((item) => [String(getItemId(item)), stripTransientGridState(item)]));
  const used = new Set();
  const merged = [];

  draft.forEach((draftItem) => {
    const id = String(getItemId(draftItem));
    const sourceItem = sourceById.get(id) || stripTransientGridState(draftItem);
    const cleanDraftItem = stripTransientGridState(draftItem);
    used.add(id);
    merged.push({
      ...sourceItem,
      gridX: cleanDraftItem.gridX,
      gridY: cleanDraftItem.gridY,
      visible: cleanDraftItem.visible,
      ...((copySpans || copySpanIdSet.has(id))
        ? {
            colSpan: cleanDraftItem.colSpan,
            rowSpan: cleanDraftItem.rowSpan,
          }
        : null),
    });
  });

  source.forEach((sourceItem) => {
    const id = String(getItemId(sourceItem));
    if (!used.has(id)) merged.push(stripTransientGridState(sourceItem));
  });

  return merged;
}

export function canPlaceGridItem(items, candidate, ignoreId = null, columns = GRID_COLUMN_COUNT) {
  const normalized = normalizeItemShape(candidate, columns);
  const maxStartX = Math.max(1, columns - normalized.colSpan + 1);
  if (normalized.gridX > maxStartX) return false;

  return (items || [])
    .filter((item) => isVisibleItem(item) && String(getItemId(item)) !== String(ignoreId))
    .map((item) => normalizeItemShape(item, columns))
    .every((item) => !overlaps(item, normalized));
}

export function autoPlaceGridItems(items, columns = GRID_COLUMN_COUNT) {
  const { active, inactive } = splitGridItems(items, columns);
  const placed = [];

  active.forEach((item) => {
    const maxStartX = Math.max(1, columns - item.colSpan + 1);

    let placedItem = null;
    let row = 1;

    while (!placedItem && row < 400) {
      for (let col = 1; col <= maxStartX; col += 1) {
        const candidate = { ...item, gridX: col, gridY: row };
        if (canPlaceGridItem(placed, candidate, getItemId(item), columns)) {
          placedItem = candidate;
          break;
        }
      }
      row += 1;
    }

    placed.push(placedItem || { ...item, gridX: 1, gridY: row });
  });

  return mergePlacedItems([...placed, ...inactive], placed);
}

function hasInvalidGrid(items, columns = GRID_COLUMN_COUNT) {
  const active = (items || []).filter(isVisibleItem).map((item) => normalizeItemShape(item, columns));

  return active.some((item, index) => {
    const maxStartX = Math.max(1, columns - item.colSpan + 1);
    if (item.gridX > maxStartX) return true;

    return active.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      return overlaps(item, other);
    });
  });
}

export function normalizeGridItems(items, columns = GRID_COLUMN_COUNT) {
  const normalized = (items || []).map((item) => normalizeItemShape(item, columns));
  if (!normalized.length) return normalized;
  if (hasInvalidGrid(normalized, columns)) {
    return autoPlaceGridItems(normalized, columns);
  }
  return normalized;
}

export function getGridItemPlacementStyle(item, layoutMode = 'packed') {
  const normalized = normalizeItemShape(item);

  if (layoutMode === 'manual') {
    return {
      gridColumn: `${normalized.gridX} / span ${normalized.colSpan}`,
      gridRow: `${normalized.gridY} / span ${normalized.rowSpan}`,
    };
  }

  return {
    gridColumn: `span ${normalized.colSpan}`,
    gridRow: `span ${normalized.rowSpan}`,
  };
}

export function getGridRowExtent(items, preview = null, minimumRows = GRID_MIN_ROWS) {
  const candidates = [...((items || []).filter(isVisibleItem))];
  if (preview) candidates.push(preview);
  if (!candidates.length) return minimumRows;

  const extent = candidates.reduce((max, item) => {
    const normalized = normalizeItemShape(item);
    return Math.max(max, normalized.gridY + normalized.rowSpan - 1);
  }, 0);

  return Math.max(minimumRows, extent + 1);
}

function reorderBefore(items, draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return items;
  const next = [...items];
  const fromIndex = next.findIndex((item) => String(getItemId(item)) === String(draggedId));
  const toIndex = next.findIndex((item) => String(getItemId(item)) === String(targetId));
  if (fromIndex < 0 || toIndex < 0) return items;
  const [dragged] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, dragged);
  return next;
}

function resolveCollisionDirection(dragged, collided) {
  const draggedCenterX = dragged.gridX + dragged.colSpan / 2;
  const collidedCenterX = collided.gridX + collided.colSpan / 2;
  const draggedCenterY = dragged.gridY + dragged.rowSpan / 2;
  const collidedCenterY = collided.gridY + collided.rowSpan / 2;

  return {
    horizontal: draggedCenterX <= collidedCenterX ? 'right' : 'left',
    vertical: draggedCenterY <= collidedCenterY ? 'down' : 'up',
  };
}

function buildRowSearchOrder(baseRow, minRow = 1, range = 3) {
  const rows = [Math.max(minRow, baseRow)];
  for (let offset = 1; offset <= range; offset += 1) {
    if (baseRow - offset >= minRow) rows.push(baseRow - offset);
    rows.push(baseRow + offset);
  }
  return Array.from(new Set(rows.filter((row) => row >= minRow)));
}

function buildColumnSearchOrder(startX, maxStartX, direction) {
  const values = [];
  const safeStart = clamp(startX, 1, maxStartX);

  if (direction === 'left') {
    for (let col = safeStart; col >= 1; col -= 1) values.push(col);
    for (let col = safeStart + 1; col <= maxStartX; col += 1) values.push(col);
    return values;
  }

  for (let col = safeStart; col <= maxStartX; col += 1) values.push(col);
  for (let col = safeStart - 1; col >= 1; col -= 1) values.push(col);
  return values;
}

function findRelocationSpot(placedItems, item, preferred, columns = GRID_COLUMN_COUNT) {
  const normalized = normalizeItemShape(item, columns);
  const maxStartX = Math.max(1, columns - normalized.colSpan + 1);
  const others = placedItems.filter((entry) => String(getItemId(entry)) !== String(getItemId(normalized)));
  const rowCandidates = buildRowSearchOrder(normalized.gridY, 1, 2);

  for (const row of rowCandidates) {
    const columnsToCheck = buildColumnSearchOrder(normalized.gridX, maxStartX, preferred.horizontal);
    for (const gridX of columnsToCheck) {
      const candidate = { ...normalized, gridX, gridY: row };
      if (canPlaceGridItem(others, candidate, getItemId(normalized), columns)) return candidate;
    }
  }

  if (preferred.vertical === 'up') {
    for (let row = normalized.gridY - 1; row >= 1; row -= 1) {
      const columnsToCheck = buildColumnSearchOrder(normalized.gridX, maxStartX, preferred.horizontal);
      for (const gridX of columnsToCheck) {
        const candidate = { ...normalized, gridX, gridY: row };
        if (canPlaceGridItem(others, candidate, getItemId(normalized), columns)) return candidate;
      }
    }
  }

  const startDown = preferred.vertical === 'down' ? normalized.gridY : normalized.gridY + 1;
  for (let row = Math.max(1, startDown); row < normalized.gridY + 80; row += 1) {
    const columnsToCheck = buildColumnSearchOrder(normalized.gridX, maxStartX, preferred.horizontal);
    for (const gridX of columnsToCheck) {
      const candidate = { ...normalized, gridX, gridY: row };
      if (canPlaceGridItem(others, candidate, getItemId(normalized), columns)) return candidate;
    }
  }

  return { ...normalized, gridX: 1, gridY: Math.max(1, normalized.gridY + normalized.rowSpan) };
}

export function resolveManualPlacement(items, draggedId, x, y, columns = GRID_COLUMN_COUNT) {
  if (!draggedId) return null;
  const { active, inactive } = splitGridItems(items, columns);
  const dragged = active.find((item) => String(getItemId(item)) === String(draggedId));
  if (!dragged) return null;

  const maxStartX = Math.max(1, columns - dragged.colSpan + 1);
  const preview = {
    ...dragged,
    gridX: resolveCenteredStart(x, dragged.colSpan, dragged.gridX, maxStartX),
    gridY: resolveCenteredStart(y, dragged.rowSpan, dragged.gridY),
  };

  let placed = active
    .filter((item) => String(getItemId(item)) !== String(draggedId))
    .map((item) => ({ ...item }));

  const queue = placed.filter((item) => overlaps(item, preview)).map((item) => String(getItemId(item)));
  const moved = new Set();

  while (queue.length) {
    const currentId = queue.shift();
    if (moved.has(currentId)) continue;
    const currentIndex = placed.findIndex((item) => String(getItemId(item)) === currentId);
    if (currentIndex < 0) continue;

    const current = placed[currentIndex];
    const preferred = resolveCollisionDirection(preview, current);
    const relocated = findRelocationSpot([...placed.slice(0, currentIndex), ...placed.slice(currentIndex + 1), preview], current, preferred, columns);
    placed[currentIndex] = relocated;
    moved.add(currentId);

    placed.forEach((item) => {
      if (String(getItemId(item)) === currentId) return;
      if (moved.has(String(getItemId(item)))) return;
      if (overlaps(item, relocated)) queue.push(String(getItemId(item)));
    });
  }

  const placedWithDragged = normalizeGridItems([...placed, preview, ...inactive], columns);
  const placedPreview = placedWithDragged.find((item) => String(getItemId(item)) === String(draggedId)) || preview;

  return {
    preview: placedPreview,
    placed: placedWithDragged,
    valid: true,
  };
}

export function getPackedPlacementPreview(items, draggedId, targetId, columns = GRID_COLUMN_COUNT) {
  if (!draggedId || !targetId || draggedId === targetId) return null;
  const reordered = reorderBefore(items, draggedId, targetId);
  const placed = autoPlaceGridItems(reordered, columns);
  const previewItem = placed.find((item) => String(getItemId(item)) === String(draggedId));

  if (!previewItem) return null;

  return {
    preview: previewItem,
    placed,
    valid: true,
  };
}

export function getManualPlacementPreview(items, draggedId, x, y, columns = GRID_COLUMN_COUNT) {
  return resolveManualPlacement(items, draggedId, x, y, columns);
}

export function placeManualGridItem(items, draggedId, x, y, columns = GRID_COLUMN_COUNT) {
  const result = resolveManualPlacement(items, draggedId, x, y, columns);
  if (!result?.placed) return items;
  return result.placed;
}

export function sortGridItemsByPosition(items, columns = GRID_COLUMN_COUNT) {
  const { active, inactive } = splitGridItems(items, columns);
  return [
    ...normalizeGridItems(active, columns)
      .slice()
      .sort((a, b) => {
        if (a.gridY !== b.gridY) return a.gridY - b.gridY;
        if (a.gridX !== b.gridX) return a.gridX - b.gridX;
        return 0;
      }),
    ...inactive,
  ];
}
