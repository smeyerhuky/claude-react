import { useState, useCallback, useMemo } from 'react';
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
import { ScrollArea } from './ui/scroll-area';
import PageThumbnail from './PageThumbnail';
import {
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
} from 'lucide-react';

/**
 * Dialog that previews the final merge result.
 * Shows all selected pages from all files in merge order.
 * Users can reorder and remove individual pages before merging.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - files: array of file objects (with selectedPages)
 *  - onMerge: (mergePages) => void  — called with final ordered array of { fileId, pageIndex }
 */
export default function MergePreviewDialog({ open, onOpenChange, files, onMerge }) {
  // mergePages: array of { fileId, fileIndex, pageIndex, fileName }
  const [mergePages, setMergePages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Build initial merge pages from files when dialog opens
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

  // Drag reorder
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

  // Group count per file for summary
  const fileSummary = useMemo(() => {
    const counts = {};
    mergePages.forEach((p) => {
      counts[p.fileName] = (counts[p.fileName] || 0) + 1;
    });
    return counts;
  }, [mergePages]);

  // Generate colors per file for visual differentiation
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

        {/* Page grid with thumbnails */}
        <ScrollArea className="flex-1 min-h-0 border rounded-lg p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {mergePages.map((page, idx) => (
              <div
                key={`merge-${idx}-${page.fileId}-${page.pageIndex}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-lg border-2 p-2 transition-all cursor-grab active:cursor-grabbing ${
                  fileColors[page.fileId] || 'bg-gray-50 border-gray-200'
                } ${
                  dragOverIdx === idx && draggedIdx !== idx
                    ? 'ring-2 ring-blue-400 shadow-md'
                    : ''
                } ${draggedIdx === idx ? 'opacity-50' : ''}`}
              >
                {/* Page number in merged result */}
                <div className="absolute top-1 left-1 z-10">
                  <Badge className="text-[10px] px-1.5 py-0 h-5">
                    #{idx + 1}
                  </Badge>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                  className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove page"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* Drag handle indicator */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-3.5 w-3.5 text-gray-500" />
                </div>

                {/* Thumbnail */}
                <div className="flex justify-center mt-5 mb-1">
                  <PageThumbnail
                    fileData={page.fileData}
                    pageIndex={page.pageIndex}
                    password={page.password}
                    width={90}
                  />
                </div>

                {/* Page info */}
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] text-gray-500 truncate" title={page.fileName}>
                    {page.fileName}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    Page {page.pageIndex + 1}
                  </p>
                </div>

                {/* Move buttons */}
                <div className="flex justify-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); movePageItem(idx, -1); }}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-white/60 disabled:opacity-30"
                    title="Move left"
                  >
                    <ArrowUp className="h-3 w-3 text-gray-600 -rotate-90" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); movePageItem(idx, 1); }}
                    disabled={idx === mergePages.length - 1}
                    className="p-0.5 rounded hover:bg-white/60 disabled:opacity-30"
                    title="Move right"
                  >
                    <ArrowDown className="h-3 w-3 text-gray-600 -rotate-90" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {mergePages.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No pages remaining. Add pages back by closing and managing individual files.
            </div>
          )}
        </ScrollArea>

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
