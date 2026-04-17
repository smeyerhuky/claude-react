import { useState, useCallback, useRef, useMemo } from 'react';
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
import { Checkbox } from './ui/checkbox';
import PageThumbnail from './PageThumbnail';
import {
  GripVertical,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const COLUMNS = { sm: 3, md: 4, lg: 5 };
const ITEM_HEIGHT = 200; // approximate height of one page card in px

/**
 * Dialog for managing individual pages within a single PDF file.
 * Now uses viewport virtualization via @tanstack/react-virtual so only
 * visible rows mount PageThumbnail components.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - file: { id, name, data, pageCount, password, selectedPages }
 *  - onSave: (fileId, selectedPages) => void
 */
export default function PageManagerDialog({ open, onOpenChange, file, onSave }) {
  const [pages, setPages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Use 5 columns (lg default) — a responsive approach would measure width
  const columnCount = COLUMNS.lg;

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (isOpen && file) {
        const initial =
          file.selectedPages && file.selectedPages.length > 0
            ? [...file.selectedPages]
            : Array.from({ length: file.pageCount }, (_, i) => i);
        setPages(initial);
      }
      onOpenChange(isOpen);
    },
    [file, onOpenChange]
  );

  const selectedSet = useMemo(() => new Set(pages), [pages]);

  if (!file) return null;

  const allPageIndices = Array.from({ length: file.pageCount }, (_, i) => i);
  const isSelected = (pageIdx) => selectedSet.has(pageIdx);

  const togglePage = (pageIdx) => {
    setPages((prev) => {
      if (prev.includes(pageIdx)) {
        return prev.filter((p) => p !== pageIdx);
      }
      return [...prev, pageIdx];
    });
  };

  const selectAll = () => setPages([...allPageIndices]);
  const selectNone = () => setPages([]);
  const invertSelection = () => {
    setPages((prev) => {
      const prevSet = new Set(prev);
      return allPageIndices.filter((p) => !prevSet.has(p));
    });
  };

  const movePageInSelection = (currentIdx, direction) => {
    setPages((prev) => {
      const next = [...prev];
      const newIdx = currentIdx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[currentIdx], next[newIdx]] = [next[newIdx], next[currentIdx]];
      return next;
    });
  };

  const removeFromSelection = (pageIdx) => {
    setPages((prev) => prev.filter((p) => p !== pageIdx));
  };

  // Drag reorder within selected pages
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
    setPages((prev) => {
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

  const handleSave = () => {
    onSave(file.id, pages);
    onOpenChange(false);
  };

  // Virtualization: group page indices into rows
  const rowCount = Math.ceil(allPageIndices.length / columnCount);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            Manage Pages — {file.name}
          </DialogTitle>
          <DialogDescription>
            Select, deselect, and reorder pages. Only selected pages will be
            included in the merge. Drag to reorder selected pages.
          </DialogDescription>
        </DialogHeader>

        {/* Controls bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            <Square className="h-3.5 w-3.5 mr-1" />
            Select None
          </Button>
          <Button variant="outline" size="sm" onClick={invertSelection}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Invert
          </Button>
          <div className="ml-auto">
            <Badge variant="secondary">
              {pages.length} of {file.pageCount} pages selected
            </Badge>
          </div>
        </div>

        {/* Virtualized page grid */}
        <VirtualizedPageGrid
          allPageIndices={allPageIndices}
          columnCount={columnCount}
          rowCount={rowCount}
          file={file}
          isSelected={isSelected}
          pages={pages}
          togglePage={togglePage}
        />

        {/* Selected pages order — compact reorder strip */}
        {pages.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Merge Order (drag to reorder)
            </h4>
            <div className="border rounded-lg overflow-x-auto">
              <div className="flex gap-1.5 p-2 min-w-0">
                {pages.map((pageIdx, idx) => (
                  <div
                    key={`order-${pageIdx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex-shrink-0 flex items-center gap-1 rounded border px-2 py-1 text-xs cursor-grab active:cursor-grabbing transition-all ${
                      dragOverIdx === idx && draggedIdx !== idx
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    } ${draggedIdx === idx ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">P{pageIdx + 1}</span>
                    <div className="flex gap-0.5 ml-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); movePageInSelection(idx, -1); }}
                        disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"
                        title="Move left"
                      >
                        <ArrowUp className="h-3 w-3 text-gray-500 rotate-[-90deg]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); movePageInSelection(idx, 1); }}
                        disabled={idx === pages.length - 1}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"
                        title="Move right"
                      >
                        <ArrowDown className="h-3 w-3 text-gray-500 rotate-[-90deg]" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromSelection(pageIdx); }}
                      className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Remove page"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pages.length === 0}>
            Save Selection ({pages.length} page{pages.length !== 1 ? 's' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Virtualized grid of page thumbnails.
 * Only rows visible in the viewport (plus overscan) are rendered.
 */
function VirtualizedPageGrid({
  allPageIndices,
  columnCount,
  rowCount,
  file,
  isSelected,
  pages,
  togglePage,
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
          const rowPageIndices = allPageIndices.slice(
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
              <div
                className="grid gap-3 h-full"
                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
              >
                {rowPageIndices.map((pageIdx) => {
                  const selected = isSelected(pageIdx);
                  const selectionOrder = pages.indexOf(pageIdx);
                  return (
                    <div
                      key={pageIdx}
                      className={`relative group rounded-lg border-2 p-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-blue-400 bg-blue-50/50'
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      }`}
                      onClick={() => togglePage(pageIdx)}
                    >
                      <div
                        className="absolute top-1 left-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => togglePage(pageIdx)}
                        />
                      </div>

                      {selected && (
                        <div className="absolute top-1 right-1 z-10">
                          <Badge className="text-[10px] px-1.5 py-0 h-5">
                            #{selectionOrder + 1}
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-center mt-4 mb-1">
                        <PageThumbnail
                          cacheKey={String(file.id)}
                          fileData={file.data}
                          pageIndex={pageIdx}
                          password={file.password}
                          width={100}
                        />
                      </div>

                      <p className="text-center text-xs text-gray-600 font-medium">
                        Page {pageIdx + 1}
                      </p>
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
