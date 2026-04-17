import { useRef, useCallback, useState } from 'react';

/**
 * Hook that manages a batched render queue for PDF page thumbnails.
 *
 * Modeled after the EnhancedTextBufferProcessor's chunked/buffered processing
 * with `yieldInterval`: instead of rendering all thumbnails synchronously
 * (which freezes the UI), this queue processes them in small batches,
 * yielding to the event loop between batches so the browser can paint
 * and respond to user input.
 *
 * Features:
 * - Batched rendering with configurable concurrency
 * - Yielding between batches (setTimeout(resolve, 0))
 * - Progress tracking via onProgress callback pattern
 * - Cancellation support for pages scrolling out of view
 * - Thumbnail bitmap caching — rendered pages are stored as ImageBitmap
 *   and reused on subsequent mounts
 *
 * Usage:
 *   const { enqueue, cancel, getCachedThumbnail, renderProgress } = useThumbnailRenderQueue();
 */

// Module-level thumbnail cache: Map<string, ImageBitmap | HTMLCanvasElement>
const thumbnailCache = new Map();

/**
 * Get a cache key for a specific page render.
 */
export function getThumbnailCacheKey(cacheKey, pageIndex, width) {
  return `${cacheKey}:${pageIndex}:${width}`;
}

export function useThumbnailRenderQueue({ concurrency = 3, yieldInterval = 4 } = {}) {
  const queueRef = useRef([]);
  const activeRef = useRef(0);
  const processingRef = useRef(false);
  const [renderProgress, setRenderProgress] = useState({ rendered: 0, total: 0 });

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    let processedInBatch = 0;

    while (queueRef.current.length > 0) {
      // Pick up to `concurrency` items
      const batch = [];
      while (batch.length < concurrency && queueRef.current.length > 0) {
        const item = queueRef.current.shift();
        if (item && !item.cancelled) {
          batch.push(item);
        }
      }

      if (batch.length === 0) break;

      activeRef.current += batch.length;

      // Process batch concurrently
      await Promise.all(
        batch.map(async (item) => {
          if (item.cancelled) return;
          try {
            await item.renderFn();
          } catch (err) {
            if (!item.cancelled) {
              console.error('Thumbnail render error:', err);
              item.onError?.(err);
            }
          } finally {
            activeRef.current--;
          }
        })
      );

      processedInBatch += batch.length;

      // Yield to the event loop every yieldInterval batches
      // so the browser can paint & handle user input
      if (processedInBatch % yieldInterval === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setRenderProgress({
        rendered: processedInBatch,
        total: processedInBatch + queueRef.current.length,
      });
    }

    processingRef.current = false;
  }, [concurrency, yieldInterval]);

  /**
   * Enqueue a render job. Returns a cancel handle.
   */
  const enqueue = useCallback(
    (renderFn, onError) => {
      const item = { renderFn, onError, cancelled: false };
      queueRef.current.push(item);
      setRenderProgress((prev) => ({
        rendered: prev.rendered,
        total: prev.total + 1,
      }));
      // Kick off processing if not already running
      processQueue();
      return item;
    },
    [processQueue]
  );

  /**
   * Cancel a queued render job.
   */
  const cancel = useCallback((item) => {
    if (item) item.cancelled = true;
  }, []);

  /**
   * Get a cached thumbnail bitmap for a page.
   */
  const getCachedThumbnail = useCallback((key) => {
    return thumbnailCache.get(key) || null;
  }, []);

  /**
   * Store a rendered thumbnail in the cache.
   */
  const setCachedThumbnail = useCallback((key, imageData) => {
    thumbnailCache.set(key, imageData);
  }, []);

  /**
   * Clear cached thumbnails for a specific file.
   */
  const clearCacheForFile = useCallback((cacheKeyPrefix) => {
    for (const key of thumbnailCache.keys()) {
      if (key.startsWith(cacheKeyPrefix + ':')) {
        thumbnailCache.delete(key);
      }
    }
  }, []);

  return {
    enqueue,
    cancel,
    getCachedThumbnail,
    setCachedThumbnail,
    clearCacheForFile,
    renderProgress,
  };
}
