import { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import PageManagerDialog from './PageManagerDialog';
import MergePreviewDialog from './MergePreviewDialog';
import {
  FileUp,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
  Download,
  FilePlus,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Merge,
  X,
  FileText,
  ScanSearch,
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Decrypt a password-protected PDF using PDF.js, then re-serialize
 * it with pdf-lib so we get an unencrypted PDFDocument we can merge.
 */
async function decryptPdf(arrayBuffer, password) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password });
  const pdfDoc = await loadingTask.promise;

  // Create a new pdf-lib document and copy pages rendered from PDF.js
  // We'll re-import pages by extracting each page to a new PDF via PDF.js
  const pageCount = pdfDoc.numPages;

  // Export each page from PDF.js back to a clean PDF
  // PDF.js can give us the raw page data - we'll use a canvas approach
  // Actually, the better approach: use pdf.js to decrypt, then get the raw data stream
  // and feed it into pdf-lib. But pdf.js doesn't easily export raw PDF.

  // Best approach: render each page to canvas, then create a new PDF from images.
  // However this loses text selectability. Alternative: use pdf-lib to try to
  // copy pages from the decrypted stream.

  // Let's try: pdf.js getData() returns the decrypted stream data
  const data = await pdfDoc.getData();
  await pdfDoc.destroy();

  // Now load this decrypted data with pdf-lib
  const pdfLibDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  return pdfLibDoc;
}

/**
 * Load a PDF, handling both encrypted and unencrypted files.
 */
async function loadPdfDocument(arrayBuffer, password) {
  try {
    // First try loading directly with pdf-lib (works for unencrypted PDFs)
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return doc;
  } catch {
    // If that fails and we have a password, try decrypting with PDF.js
    if (password) {
      return decryptPdf(arrayBuffer, password);
    }
    throw new Error('This PDF appears to be encrypted. Please provide a password.');
  }
}

/**
 * Try to detect if a PDF is encrypted by attempting to load it with PDF.js
 */
async function checkIfEncrypted(arrayBuffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const doc = await loadingTask.promise;
    await doc.destroy();
    return false;
  } catch (err) {
    if (err?.name === 'PasswordException') {
      return true;
    }
    return false;
  }
}

// Unique ID counter
let fileIdCounter = 0;

export default function PdfMerger() {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Page manager dialog state
  const [pageManagerFile, setPageManagerFile] = useState(null);
  const [pageManagerOpen, setPageManagerOpen] = useState(false);

  // Merge preview dialog state
  const [mergePreviewOpen, setMergePreviewOpen] = useState(false);

  const addFiles = useCallback(async (fileList) => {
    setError('');
    const newFiles = [];

    for (const file of fileList) {
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" is not a PDF file. Skipped.`);
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const isEncrypted = await checkIfEncrypted(arrayBuffer);

      newFiles.push({
        id: ++fileIdCounter,
        name: file.name,
        size: file.size,
        data: arrayBuffer,
        isEncrypted,
        password: '',
        showPassword: false,
        status: isEncrypted ? 'needs-password' : 'ready',
        pageCount: null,
        selectedPages: null, // null = all pages, otherwise ordered array of 0-based indices
      });
    }

    // For non-encrypted files, get page count
    for (const f of newFiles) {
      if (!f.isEncrypted) {
        try {
          const doc = await PDFDocument.load(f.data, { ignoreEncryption: true });
          f.pageCount = doc.getPageCount();
        } catch {
          f.status = 'error';
          f.errorMessage = 'Failed to read PDF.';
        }
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) addFiles(droppedFiles);
    },
    [addFiles]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) addFiles(selected);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updatePassword = (id, password) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, password } : f))
    );
  };

  const toggleShowPassword = (id) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, showPassword: !f.showPassword } : f))
    );
  };

  const verifyPassword = async (id) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'verifying' } : f))
    );

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: file.data.slice(0),
        password: file.password,
      });
      const doc = await loadingTask.promise;
      const pageCount = doc.numPages;
      await doc.destroy();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'ready', pageCount, errorMessage: undefined, selectedPages: null } : f
        )
      );
    } catch (err) {
      const msg =
        err?.name === 'PasswordException'
          ? 'Incorrect password. Please try again.'
          : 'Failed to verify password.';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'needs-password', errorMessage: msg } : f
        )
      );
    }
  };

  const moveFile = (index, direction) => {
    setFiles((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  // Drag reorder handlers
  const handleReorderDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleReorderDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleReorderDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReorderDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Page manager handlers
  const openPageManager = (file) => {
    setPageManagerFile(file);
    setPageManagerOpen(true);
  };

  const savePageSelection = (fileId, selectedPages) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, selectedPages: selectedPages.length === f.pageCount ? null : selectedPages }
          : f
      )
    );
  };

  // Get effective selected page count for a file
  const getSelectedPageCount = (file) => {
    if (!file.selectedPages) return file.pageCount || 0;
    return file.selectedPages.length;
  };

  const allReady =
    files.length > 0 && files.every((f) => f.status === 'ready');

  const totalPages = files.reduce(
    (sum, f) => sum + getSelectedPageCount(f),
    0
  );

  const mergePdfs = async () => {
    if (!allReady) return;
    setMerging(true);
    setProgress(0);
    setError('');
    setStatusMessage('Starting merge…');

    try {
      const mergedPdf = await PDFDocument.create();
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];
        setStatusMessage(`Processing "${file.name}" (${i + 1}/${total})…`);
        setProgress(Math.round(((i) / total) * 100));

        let sourcePdf;
        if (file.isEncrypted) {
          sourcePdf = await decryptPdf(file.data.slice(0), file.password);
        } else {
          sourcePdf = await PDFDocument.load(file.data.slice(0), {
            ignoreEncryption: true,
          });
        }

        // Use selectedPages if set, otherwise all pages
        const pageIndices = file.selectedPages
          ? file.selectedPages
          : sourcePdf.getPageIndices();

        if (pageIndices.length > 0) {
          const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }

      setStatusMessage('Generating output PDF…');
      setProgress(90);

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatusMessage('Merge complete! Your download should start automatically.');
    } catch (err) {
      console.error('Merge error:', err);
      setError(`Merge failed: ${err.message}`);
      setStatusMessage('');
    } finally {
      setMerging(false);
    }
  };

  /**
   * Merge with a custom page order from the MergePreviewDialog.
   * mergePages: array of { fileId, pageIndex }
   */
  const mergeWithCustomOrder = async (mergePages) => {
    setMerging(true);
    setProgress(0);
    setError('');
    setStatusMessage('Starting merge with custom page order…');

    try {
      const mergedPdf = await PDFDocument.create();
      const total = mergePages.length;

      // Cache loaded PDFs to avoid reloading the same file multiple times
      const pdfCache = {};

      for (let i = 0; i < total; i++) {
        const { fileId, pageIndex } = mergePages[i];
        setStatusMessage(`Processing page ${i + 1} of ${total}…`);
        setProgress(Math.round((i / total) * 90));

        const file = files.find((f) => f.id === fileId);
        if (!file) continue;

        if (!pdfCache[fileId]) {
          if (file.isEncrypted) {
            pdfCache[fileId] = await decryptPdf(file.data.slice(0), file.password);
          } else {
            pdfCache[fileId] = await PDFDocument.load(file.data.slice(0), {
              ignoreEncryption: true,
            });
          }
        }

        const sourcePdf = pdfCache[fileId];
        const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageIndex]);
        mergedPdf.addPage(copiedPage);
      }

      setStatusMessage('Generating output PDF…');
      setProgress(90);

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatusMessage('Merge complete! Your download should start automatically.');
    } catch (err) {
      console.error('Merge error:', err);
      setError(`Merge failed: ${err.message}`);
      setStatusMessage('');
    } finally {
      setMerging(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'needs-password':
        return <Lock className="h-5 w-5 text-amber-500" />;
      case 'verifying':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Merge className="h-6 w-6" />
            PDF Merger
          </CardTitle>
          <CardDescription>
            Upload multiple PDFs, manage individual pages, reorder them,
            provide passwords for encrypted files, and merge them into a
            single PDF. Preview the merge result before downloading.
            Everything happens in your browser — no files are uploaded to
            any server.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-10 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/50"
          >
            <FileUp className="h-10 w-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drag &amp; drop PDF files here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-auto flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Files ({files.length})
                  {totalPages > 0 && (
                    <span className="font-normal text-gray-500">
                      {' '}
                      — {totalPages} total pages
                    </span>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <FilePlus className="h-3 w-3 mr-1" />
                  Add more
                </Button>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleReorderDragStart(e, index)}
                    onDragOver={(e) => handleReorderDragOver(e, index)}
                    onDrop={(e) => handleReorderDrop(e, index)}
                    onDragEnd={handleReorderDragEnd}
                    className={`rounded-lg border bg-white p-3 transition-all ${
                      dragOverIndex === index && draggedIndex !== index
                        ? 'border-blue-400 shadow-md'
                        : 'border-gray-200'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Order number */}
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {index + 1}
                      </span>

                      {/* Status icon */}
                      {getStatusIcon(file.status)}

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {formatSize(file.size)}
                          </span>
                          {file.pageCount != null && (
                            <Badge variant="secondary" className="text-xs py-0">
                              {file.selectedPages
                                ? `${file.selectedPages.length}/${file.pageCount}`
                                : file.pageCount}{' '}
                              page{(file.selectedPages ? file.selectedPages.length : file.pageCount) !== 1 ? 's' : ''}
                              {file.selectedPages && (
                                <span className="ml-1 text-blue-600">✎</span>
                              )}
                            </Badge>
                          )}
                          {file.isEncrypted && (
                            <Badge
                              variant={
                                file.status === 'ready' ? 'default' : 'outline'
                              }
                              className="text-xs py-0"
                            >
                              {file.status === 'ready' ? (
                                <Unlock className="h-3 w-3 mr-1" />
                              ) : (
                                <Lock className="h-3 w-3 mr-1" />
                              )}
                              {file.status === 'ready'
                                ? 'Unlocked'
                                : 'Encrypted'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Manage pages button */}
                      {file.status === 'ready' && file.pageCount != null && (
                        <button
                          onClick={() => openPageManager(file)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Manage pages"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}

                      {/* Move buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => moveFile(index, 1)}
                          disabled={index === files.length - 1}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Password input for encrypted files */}
                    {file.isEncrypted && file.status !== 'ready' && (
                      <div className="mt-3 ml-[4.25rem] space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={file.showPassword ? 'text' : 'password'}
                              placeholder="Enter PDF password"
                              value={file.password}
                              onChange={(e) =>
                                updatePassword(file.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && file.password)
                                  verifyPassword(file.id);
                              }}
                              className="pr-9 text-sm"
                              disabled={file.status === 'verifying'}
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(file.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {file.showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => verifyPassword(file.id)}
                            disabled={
                              !file.password || file.status === 'verifying'
                            }
                          >
                            {file.status === 'verifying' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Unlock'
                            )}
                          </Button>
                        </div>
                        {file.errorMessage && (
                          <p className="text-xs text-red-600">
                            {file.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merge progress */}
          {merging && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusMessage}
              </p>
            </div>
          )}

          {/* Success message */}
          {!merging && statusMessage && progress === 100 && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Merge button */}
          {files.length > 0 && (
            <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setProgress(0);
                  setStatusMessage('');
                  setError('');
                }}
              >
                Clear all
              </Button>
              <div className="flex items-center gap-2">
                {allReady && files.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={merging}
                    onClick={() => setMergePreviewOpen(true)}
                    className="gap-2"
                  >
                    <ScanSearch className="h-5 w-5" />
                    Preview Merge
                  </Button>
                )}
                <Button
                  size="lg"
                  disabled={!allReady || merging}
                  onClick={mergePdfs}
                  className="gap-2"
                >
                  {merging ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Merging…
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Merge &amp; Download
                      {totalPages > 0 && ` (${totalPages} pg)`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {files.length === 0 && !merging && (
            <div className="text-center py-4 text-sm text-gray-500">
              No PDF files added yet. Drop files above or click to browse.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Manager Dialog — per-file page management */}
      <PageManagerDialog
        open={pageManagerOpen}
        onOpenChange={setPageManagerOpen}
        file={pageManagerFile}
        onSave={savePageSelection}
      />

      {/* Merge Preview Dialog — preview & reorder all pages before merge */}
      <MergePreviewDialog
        open={mergePreviewOpen}
        onOpenChange={setMergePreviewOpen}
        files={files.filter((f) => f.status === 'ready')}
        onMerge={mergeWithCustomOrder}
      />
    </div>
  );
}
