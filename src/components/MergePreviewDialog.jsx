import { useState, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import PageThumbnail from './PageThumbnail';
import {
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
} from 'lucide-react';

const COLUMNS = 6;
const ITEM_HEIGHT = 210; // approximate height of one merge page card

/**
 * Dialog that previews the final merge result.
 * Now uses viewport virtualization — only visible rows are rendered.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - files: array of file objects (with selectedPages)
 *  - onMerge: (mergePages) => void
 */
export default function MergePreviewDialog({ open, onOpenChange, files, onMerge }) {
  const [mergePages, setMergePages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (isOpen && files.length > 0) {
        const pages = [];
        files.forEach((file, fileIndex) => {
          const selectedPages =
            file.selectedPages && file.selectedPages.length > 0
              ? file.selectedPages
              : Array.from({ length: file.pageCount }, (_, i) => i);
          selectedPages.forEach((pageIdx) => {
            pages.push({
              fileId: file.id,
              fileIndex,
              pageIndex: pageIdx,
              fileName: file.name,
              fileData: file.data,
              password: file.password,
            });
          });
        });
        setMergePages(pages);
      }
      onOpenChange(isOpen);
    },
    [files, onOpenChange]
  );

  const movePageItem = (idx, direction) => {
    setMergePages((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const removePage = (idx) => {
    setMergePages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx.toString());
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIdx === null || draggedIdx === dropIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    setMergePages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIdx, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleMerge = () => {
    onMerge(
      mergePages.map(({ fileId, pageIndex }) => ({ fileId, pageIndex }))
    );
    onOpenChange(false);
  };

  const fileSummary = useMemo(() => {
    const counts = {};
    mergePages.forEach((p) => {
      counts[p.fileName] = (counts[p.fileName] || 0) + 1;
    });
    return counts;
  }, [mergePages]);

  const fileColors = useMemo(() => {
    const colorPalette = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-amber-100 border-amber-300',
      'bg-pink-100 border-pink-300',
      'bg-teal-100 border-teal-300',
      'bg-orange-100 border-orange-300',
      'bg-indigo-100 border-indigo-300',
    ];
    const map = {};
    const uniqueFiles = [...new Set(mergePages.map((p) => p.fileId))];
    uniqueFiles.forEach((fId, i) => {
      map[fId] = colorPalette[i % colorPalette.length];
    });
    return map;
  }, [mergePages]);

  const rowCount = Math.ceil(mergePages.length / COLUMNS);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Merge Result
          </DialogTitle>
          <DialogDescription>
            Review the final page order before merging. Drag to reorder, or remove
            individual pages. Color coding shows which file each page belongs to.
          </DialogDescription>
        </DialogHeader>

        {/* Summary bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {mergePages.length} total pages
          </Badge>
          {Object.entries(fileSummary).map(([name, count]) => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}: {count}p
            </Badge>
          ))}
        </div>

        {/* Virtualized page grid with thumbnails */}
        <VirtualizedMergeGrid
          mergePages={mergePages}
          rowCount={rowCount}
          columnCount={COLUMNS}
          fileColors={fileColors}
          draggedIdx={draggedIdx}
          dragOverIdx={dragOverIdx}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onRemove={removePage}
          onMove={movePageItem}
        />

        {mergePages.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No pages remaining. Add pages back by closing and managing individual files.
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={mergePages.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Merge &amp; Download ({mergePages.length} pages)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Virtualized grid for merge preview pages.
 * Only rows visible in the viewport (plus overscan) are rendered.
 */
function VirtualizedMergeGrid({
  mergePages,
  rowCount,
  columnCount,
  fileColors,
  draggedIdx,
  dragOverIdx,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onMove,
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 min-h-0 border rounded-lg p-3 overflow-auto"
      style={{ maxHeight: '50vh' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowStartIdx = virtualRow.index * columnCount;
          const rowItems = mergePages.slice(
            rowStartIdx,
            rowStartIdx + columnCount
          );

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-6 gap-3 h-full">
                {rowItems.map((page, colIdx) => {
                  const idx = rowStartIdx + colIdx;
                  return (
                    <div
                      key={`merge-${idx}-${page.fileId}-${page.pageIndex}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onDrop={(e) => onDrop(e, idx)}
                      onDragEnd={onDragEnd}
                      className={`relative group rounded-lg border-2 p-2 transition-all cursor-grab active:cursor-grabbing ${
                        fileColors[page.fileId] || 'bg-gray-50 border-gray-200'
                      } ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? 'ring-2 ring-blue-400 shadow-md'
                          : ''
                      } ${draggedIdx === idx ? 'opacity-50' : ''}`}
                    >
                      <div className="absolute top-1 left-1 z-10">
                        <Badge className="text-[10px] px-1.5 py-0 h-5">
                          #{idx + 1}
                        </Badge>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove page"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3.5 w-3.5 text-gray-500" />
                      </div>

                      <div className="flex justify-center mt-5 mb-1">
                        <PageThumbnail
                          cacheKey={String(page.fileId)}
                          fileData={page.fileData}
                          pageIndex={page.pageIndex}
                          password={page.password}
                          width={90}
                        />
                      </div>

                      <div className="text-center space-y-0.5">
                        <p className="text-[10px] text-gray-500 truncate" title={page.fileName}>
                          {page.fileName}
                        </p>
                        <p className="text-xs font-medium text-gray-700">
                          Page {page.pageIndex + 1}
                        </p>
                      </div>

                      <div className="flex justify-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onMove(idx, -1); }}
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-white/60 disabled:opacity-30"
                          title="Move left"
                        >
                          <ArrowUp className="h-3 w-3 text-gray-600 -rotate-90" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onMove(idx, 1); }}
                          disabled={idx === mergePages.length - 1}
                          className="p-0.5 rounded hover:bg-white/60 disabled:opacity-30"
                          title="Move right"
                        >
                          <ArrowDown className="h-3 w-3 text-gray-600 -rotate-90" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
