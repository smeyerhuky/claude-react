import { useRef, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Hook that caches parsed PDF.js document instances keyed by a stable identifier.
 *
 * Instead of every PageThumbnail calling `getDocument()` for the same file,
 * this hook loads each PDF once and hands out the same `pdfDocument` reference
 * to every consumer.
 *
 * Usage:
 *   const { getDocument, releaseAll } = usePdfDocumentCache();
 *   const doc = await getDocument(cacheKey, fileData, password);
 *   // doc is a pdfjs PDFDocumentProxy — call doc.getPage(n)
 *
 * Inspired by the EnhancedTextBufferProcessor pipeline pattern:
 * the cache acts as the first stage in a render pipeline
 * (parse → getPage → viewport → render → cache bitmap).
 */
export function usePdfDocumentCache() {
  // Map<string, { doc: PDFDocumentProxy | null, promise: Promise, refCount: number }>
  const cacheRef = useRef(new Map());

  const getDocument = useCallback(async (cacheKey, fileData, password) => {
    const cache = cacheRef.current;

    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      entry.refCount++;
      // Wait for the existing load to finish (or return already-resolved)
      return entry.promise;
    }

    // Create a loading promise
    const loadPromise = (async () => {
      const loadOpts = { data: fileData.slice(0) };
      if (password) loadOpts.password = password;
      const loadingTask = pdfjsLib.getDocument(loadOpts);
      const doc = await loadingTask.promise;
      // Store the resolved doc back into the entry
      const entry = cache.get(cacheKey);
      if (entry) entry.doc = doc;
      return doc;
    })();

    cache.set(cacheKey, { doc: null, promise: loadPromise, refCount: 1 });
    return loadPromise;
  }, []);

  const releaseDocument = useCallback(async (cacheKey) => {
    const cache = cacheRef.current;
    const entry = cache.get(cacheKey);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      cache.delete(cacheKey);
      try {
        const doc = entry.doc || (await entry.promise);
        await doc.destroy();
      } catch {
        // Document may have already been destroyed or failed to load
      }
    }
  }, []);

  const releaseAll = useCallback(async () => {
    const cache = cacheRef.current;
    const entries = [...cache.values()];
    cache.clear();
    for (const entry of entries) {
      try {
        const doc = entry.doc || (await entry.promise);
        await doc.destroy();
      } catch {
        // ignore
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const cache = cacheRef.current;
      for (const entry of cache.values()) {
        (async () => {
          try {
            const doc = entry.doc || (await entry.promise);
            await doc.destroy();
          } catch {
            // ignore
          }
        })();
      }
      cache.clear();
    };
  }, []);

  return { getDocument, releaseDocument, releaseAll };
}
