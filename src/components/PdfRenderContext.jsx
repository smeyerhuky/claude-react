import { createContext, useContext, useMemo } from 'react';
import { usePdfDocumentCache } from './usePdfDocumentCache';
import { useThumbnailRenderQueue } from './useThumbnailRenderQueue';

/**
 * Context that provides shared PDF document cache and thumbnail render queue
 * to all child components (PageThumbnail, PageManagerDialog, MergePreviewDialog).
 *
 * This follows the pipeline architecture from EnhancedTextBufferProcessor:
 *   parse document (cache) → get page → compute viewport → render to canvas → cache result
 *
 * Each stage is independently optimized:
 *   - Stage 1 (parse): usePdfDocumentCache — load each PDF once
 *   - Stage 2-4 (render): useThumbnailRenderQueue — batched with yielding
 *   - Stage 5 (cache): thumbnail bitmap caching in the render queue
 */
const PdfRenderContext = createContext(null);

export function PdfRenderProvider({ children }) {
  const documentCache = usePdfDocumentCache();
  const renderQueue = useThumbnailRenderQueue({ concurrency: 3, yieldInterval: 4 });

  const value = useMemo(
    () => ({ documentCache, renderQueue }),
    [documentCache, renderQueue]
  );

  return (
    <PdfRenderContext.Provider value={value}>
      {children}
    </PdfRenderContext.Provider>
  );
}

export function usePdfRenderContext() {
  const ctx = useContext(PdfRenderContext);
  if (!ctx) {
    throw new Error('usePdfRenderContext must be used within a PdfRenderProvider');
  }
  return ctx;
}
