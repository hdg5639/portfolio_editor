import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_GAP, GRID_ROW_HEIGHT } from '../utils/layoutGrid.js';

const GRID_MEASURE_EPSILON = 8;

function resolveMeasureBias(nodeOrValue) {
  if (nodeOrValue == null) return 0;
  if (typeof nodeOrValue === 'number') return Number.isFinite(nodeOrValue) ? nodeOrValue : 0;
  const raw = nodeOrValue?.dataset?.layoutMeasureBias;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toRequiredRowSpan(height, minimumRowSpan = 1) {
  const safeHeight = Math.max(0, Number(height) || 0);
  const adjustedHeight = Math.max(0, safeHeight - GRID_MEASURE_EPSILON);
  const required = Math.ceil((adjustedHeight + GRID_GAP) / (GRID_ROW_HEIGHT + GRID_GAP));
  return Math.max(minimumRowSpan, required || 1);
}

export default function useMeasuredGridItems(
  items,
  getId = (item) => item?.id ?? item?.key,
  options = {},
) {
  const { lockAutoRowSpan = false } = options;
  const observerRef = useRef(null);
  const nodeMapRef = useRef(new Map());
  const refCallbackMapRef = useRef(new Map());
  const heightsRef = useRef({});
  const rafMapRef = useRef(new Map());
  const [heightsById, setHeightsById] = useState({});
  const [stickyRowSpanById, setStickyRowSpanById] = useState({});

  const commitHeight = useCallback((key, nextHeight, measureBias = 0) => {
    const normalizedHeight = Math.max(0, Math.round((Number(nextHeight) || 0) - resolveMeasureBias(measureBias)));
    if (heightsRef.current[key] === normalizedHeight) return;

    heightsRef.current = {
      ...heightsRef.current,
      [key]: normalizedHeight,
    };

    setHeightsById((prev) => {
      if (prev[key] === normalizedHeight) return prev;
      return {
        ...prev,
        [key]: normalizedHeight,
      };
    });
  }, []);

  const scheduleMeasure = useCallback((key, node) => {
    if (!node) return;

    const pending = rafMapRef.current.get(key);
    if (pending) {
      cancelAnimationFrame(pending);
    }

    const frameId = requestAnimationFrame(() => {
      rafMapRef.current.delete(key);
      commitHeight(key, node.getBoundingClientRect().height, node);
    });

    rafMapRef.current.set(key, frameId);
  }, [commitHeight]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;

    observerRef.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.dataset.layoutMeasureId;
        if (!id) return;
        commitHeight(id, entry.contentRect.height, entry.target);
      });
    });

    nodeMapRef.current.forEach((node, key) => {
      node.dataset.layoutMeasureId = key;
      observerRef.current?.observe(node);
      scheduleMeasure(key, node);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      rafMapRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
      rafMapRef.current.clear();
    };
  }, [commitHeight, scheduleMeasure]);

  useEffect(() => {
    const activeKeys = new Set((items || []).map((item) => {
      const id = getId(item);
      return id == null ? null : String(id);
    }).filter(Boolean));

    nodeMapRef.current.forEach((node, key) => {
      if (activeKeys.has(key)) return;
      observerRef.current?.unobserve(node);
      nodeMapRef.current.delete(key);
      refCallbackMapRef.current.delete(key);
      const frameId = rafMapRef.current.get(key);
      if (frameId) {
        cancelAnimationFrame(frameId);
        rafMapRef.current.delete(key);
      }
    });

    if (Object.keys(heightsRef.current).every((key) => activeKeys.has(key))) return;

    const nextHeights = {};
    Object.entries(heightsRef.current).forEach(([key, value]) => {
      if (activeKeys.has(key)) nextHeights[key] = value;
    });
    heightsRef.current = nextHeights;
    setHeightsById((prev) => {
      const filtered = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (activeKeys.has(key)) filtered[key] = value;
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(filtered);
      if (prevKeys.length === nextKeys.length && prevKeys.every((key) => filtered[key] === prev[key])) {
        return prev;
      }
      return filtered;
    });
  }, [getId, items]);

  const registerMeasureRef = useCallback((id) => {
    const key = String(id);
    const existing = refCallbackMapRef.current.get(key);
    if (existing) return existing;

    const callback = (node) => {
      const previousNode = nodeMapRef.current.get(key);
      if (previousNode && previousNode !== node) {
        observerRef.current?.unobserve(previousNode);
      }

      if (!node) {
        nodeMapRef.current.delete(key);
        return;
      }

      node.dataset.layoutMeasureId = key;
      nodeMapRef.current.set(key, node);
      observerRef.current?.observe(node);
      scheduleMeasure(key, node);
    };

    refCallbackMapRef.current.set(key, callback);
    return callback;
  }, [scheduleMeasure]);

  const minRowSpanById = useMemo(() => {
    const next = {};

    (items || []).forEach((item) => {
      const id = getId(item);
      if (id == null) return;
      const key = String(id);
      const measuredHeight = heightsById[key];
      const minimumRowSpan = Math.max(1, Number(item?.minRowSpan) || 1);
      next[key] = toRequiredRowSpan(measuredHeight, minimumRowSpan);
    });

    return next;
  }, [getId, heightsById, items]);

  useEffect(() => {
    setStickyRowSpanById((prev) => {
      const next = {};

      (items || []).forEach((item) => {
        const id = getId(item);
        if (id == null) return;

        const key = String(id);
        const requestedRowSpan = Math.max(1, Number(item?.rowSpan) || 1);
        const measuredMinimum = Math.max(1, Number(minRowSpanById[key]) || 1);
        const previousSticky = Math.max(1, Number(prev[key]) || 1);

        next[key] = lockAutoRowSpan
          ? Math.max(previousSticky, requestedRowSpan, measuredMinimum)
          : Math.max(requestedRowSpan, measuredMinimum);
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === next[key])) {
        return prev;
      }

      return next;
    });
  }, [getId, items, lockAutoRowSpan, minRowSpanById]);

  const resolvedItems = useMemo(
    () =>
      (items || []).map((item) => {
        const id = getId(item);
        const key = String(id);
        const minimumRowSpan = minRowSpanById[key] || Math.max(1, Number(item?.minRowSpan) || 1);
        const requestedRowSpan = Math.max(1, Number(item?.rowSpan) || 1);
        const stickyRowSpan = stickyRowSpanById[key] || Math.max(requestedRowSpan, minimumRowSpan);
        const resolvedRowSpan = lockAutoRowSpan
          ? Math.max(requestedRowSpan, stickyRowSpan)
          : Math.max(requestedRowSpan, minimumRowSpan);

        return {
          ...item,
          minRowSpan: minimumRowSpan,
          rowSpan: resolvedRowSpan,
        };
      }),
    [getId, items, minRowSpanById, stickyRowSpanById, lockAutoRowSpan]
  );

  return {
    registerMeasureRef,
    minRowSpanById,
    resolvedItems,
  };
}
