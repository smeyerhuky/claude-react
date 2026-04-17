import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Renders a single PDF page thumbnail using pdfjs-dist canvas rendering.
 */
export default function PageThumbnail({ fileData, pageIndex, password, width = 120 }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);
  const renderingRef = useRef(false);

  useEffect(() => {
    if (!fileData || renderingRef.current) return;
    renderingRef.current = true;
    let cancelled = false;
    let pdfDoc = null;

    (async () => {
      try {
        const loadOpts = { data: fileData.slice(0) };
        if (password) loadOpts.password = password;
        const loadingTask = pdfjsLib.getDocument(loadOpts);
        pdfDoc = await loadingTask.promise;
        if (cancelled) { await pdfDoc.destroy(); return; }

        const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs is 1-indexed
        if (cancelled) { await pdfDoc.destroy(); return; }

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) { await pdfDoc.destroy(); return; }

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        await pdfDoc.destroy();
      } catch {
        if (!cancelled) setError(true);
        if (pdfDoc) { try { await pdfDoc.destroy(); } catch {} }
      } finally {
        renderingRef.current = false;
      }
    })();

    return () => { cancelled = true; };
  }, [fileData, pageIndex, password, width]);

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
    <canvas
      ref={canvasRef}
      className="rounded shadow-sm border border-gray-200"
      style={{ width, height: 'auto', display: 'block' }}
    />
  );
}
