import { useEffect, useRef, useState, memo } from 'react';
import { usePdfRenderContext } from './PdfRenderContext';
import { getThumbnailCacheKey } from './useThumbnailRenderQueue';

/**
 * Renders a single PDF page thumbnail.
 *
 * Performance optimizations vs the original:
 * 1. Uses a shared PDF document cache — the PDF is parsed once, not per-thumbnail
 * 2. Rendering is queued through the render queue with batched yielding
 * 3. Rendered thumbnails are cached as ImageData and reused on re-mount
 * 4. Wrapped in React.memo to avoid unnecessary re-renders
 *
 * Props:
 *  - cacheKey: string — stable identifier for the PDF file (e.g. file.id)
 *  - fileData: ArrayBuffer — raw PDF bytes (used only for initial parse)
 *  - pageIndex: number — 0-based page index
 *  - password: string | undefined
 *  - width: number — desired thumbnail width in px (default 120)
 */
function PageThumbnailInner({ cacheKey, fileData, pageIndex, password, width = 120 }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const queueItemRef = useRef(null);
  const { documentCache, renderQueue } = usePdfRenderContext();

  useEffect(() => {
    if (!fileData || !cacheKey) return;

    const thumbKey = getThumbnailCacheKey(cacheKey, pageIndex, width);
    let cancelled = false;

    // Check if we have a cached thumbnail first
    const cached = renderQueue.getCachedThumbnail(thumbKey);
    if (cached && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = cached.width;
      canvas.height = cached.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(cached, 0, 0);
      setLoaded(true);
      return;
    }

    // Enqueue the render job
    queueItemRef.current = renderQueue.enqueue(
      async () => {
        if (cancelled) return;

        try {
          // Stage 1: Get or load the document from cache
          const doc = await documentCache.getDocument(cacheKey, fileData, password);
          if (cancelled) return;

          // Stage 2: Get the specific page
          const page = await doc.getPage(pageIndex + 1); // pdfjs is 1-indexed
          if (cancelled) return;

          // Stage 3: Compute viewport
          const viewport = page.getViewport({ scale: 1 });
          const scale = width / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = canvasRef.current;
          if (!canvas || cancelled) return;

          // Stage 4: Render to canvas
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

          if (cancelled) return;

          // Stage 5: Cache the rendered result
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            renderQueue.setCachedThumbnail(thumbKey, imageData);
          } catch {
            // getImageData can fail in some security contexts; non-critical
          }

          setLoaded(true);
        } catch (err) {
          if (!cancelled) {
            console.error('PageThumbnail render error:', err);
            setError(true);
          }
        }
      },
      (err) => {
        if (!cancelled) {
          console.error('PageThumbnail queue error:', err);
          setError(true);
        }
      }
    );

    return () => {
      cancelled = true;
      if (queueItemRef.current) {
        renderQueue.cancel(queueItemRef.current);
        queueItemRef.current = null;
      }
    };
  }, [cacheKey, fileData, pageIndex, password, width, documentCache, renderQueue]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs"
        style={{ width, height: width * 1.414 }}
      >
        Error
      </div>
    );
  }

  return (
    <div style={{ width, minHeight: loaded ? 'auto' : width * 1.414 }}>
      {!loaded && (
        <div
          className="flex items-center justify-center bg-gray-100 rounded text-gray-300 text-xs animate-pulse"
          style={{ width, height: width * 1.414 }}
        >
          Loading…
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="rounded shadow-sm border border-gray-200"
        style={{
          width,
          height: 'auto',
          display: loaded ? 'block' : 'none',
        }}
      />
    </div>
  );
}

const PageThumbnail = memo(PageThumbnailInner);
export default PageThumbnail;
