import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Check,
  BookOpen,
  FileText,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { Article } from '../types/worldbuilding';

export type ImageWrapLayout = 'center-top' | 'float-left' | 'float-right' | 'center-bottom';

export interface StoryPageImage {
  id: string;
  dataUrl: string;
  widthPercent: number; // 25..100
  layout: ImageWrapLayout;
  caption: string;
}

export interface StoryPageData {
  id: string;
  text: string;
  images: StoryPageImage[];
}

interface PaginatedStoryStudioViewProps {
  storyTitle: string;
  setStoryTitle: (val: string) => void;
  storySynopsis: string;
  setStorySynopsis: (val: string) => void;
  storyText: string;
  setStoryText: (val: string) => void;
  storyPagesJson: string;
  setStoryPagesJson: (val: string) => void;
  activeStoryId: string;
  storySavedToast: boolean;
  isStoryFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSaveStory: (e?: React.FormEvent) => void;
  onStartNewStory: () => void;
  onOpenAdvancedWiki: () => void;
  totalArticlesCount: number;
  savedStoryArticles: Article[];
  onSelectSavedStory: (article: Article) => void;
  inPageSearchNode?: React.ReactNode;
  returnToUniverseLine?: {
    label: string;
    iconSrc: string;
    onReturn: () => void;
  } | null;
}

// Base character/line capacity for a single standard story page before auto-creating the next page
const BASE_CHARS_PER_PAGE = 1450;
const BASE_LINES_PER_PAGE = 20;

function computePageMaxCapacity(page: StoryPageData, isFirstPage: boolean, hasSynopsis: boolean) {
  let maxChars = BASE_CHARS_PER_PAGE;
  let maxLines = BASE_LINES_PER_PAGE;

  if (isFirstPage && hasSynopsis) {
    maxChars -= 220;
    maxLines -= 3;
  }

  for (const img of page.images) {
    const scaleFactor = img.widthPercent / 100;
    if (img.layout === 'center-top' || img.layout === 'center-bottom') {
      maxChars -= Math.round(380 * scaleFactor);
      maxLines -= Math.max(4, Math.round(7 * scaleFactor));
    } else {
      // Float left or float right shares horizontal space
      maxChars -= Math.round(240 * scaleFactor);
      maxLines -= Math.max(2, Math.round(4 * scaleFactor));
    }
  }

  return {
    maxChars: Math.max(320, maxChars),
    maxLines: Math.max(6, maxLines)
  };
}

function doesTextExceedPage(
  text: string,
  page: StoryPageData,
  isFirstPage: boolean,
  hasSynopsis: boolean
): boolean {
  const { maxChars, maxLines } = computePageMaxCapacity(page, isFirstPage, hasSynopsis);
  if (text.length > maxChars) return true;

  // Estimate visual lines (explicit newlines + wrapped lines at ~74 chars per line)
  const paragraphs = text.split('\n');
  let visualLines = 0;
  const charsPerLine = page.images.some(
    (img) => img.layout === 'float-left' || img.layout === 'float-right'
  )
    ? 52
    : 74;

  for (const p of paragraphs) {
    visualLines += Math.max(1, Math.ceil(p.length / charsPerLine));
  }

  return visualLines > maxLines;
}

function splitTextForPage(
  text: string,
  page: StoryPageData,
  isFirstPage: boolean,
  hasSynopsis: boolean
): { fitText: string; overflowText: string } {
  if (!doesTextExceedPage(text, page, isFirstPage, hasSynopsis)) {
    return { fitText: text, overflowText: '' };
  }

  // Binary search the split point at a clean word or line boundary
  let low = 1;
  let high = text.length;
  let bestIndex = Math.min(text.length, 320);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid);
    if (!doesTextExceedPage(candidate, page, isFirstPage, hasSynopsis)) {
      bestIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Snap back to last whitespace/newline so words aren't cut in half unless it's a single giant unbroken string
  let splitAt = bestIndex;
  const lastSpace = text.lastIndexOf(' ', bestIndex);
  const lastNewline = text.lastIndexOf('\n', bestIndex);
  const boundary = Math.max(lastSpace, lastNewline);

  if (boundary > bestIndex * 0.65) {
    splitAt = boundary + 1;
  }

  return {
    fitText: text.slice(0, splitAt).replace(/\s+$/, ''),
    overflowText: text.slice(splitAt).replace(/^\n+/, '')
  };
}

export function parseInitialStoryPages(
  storyPagesJson: string,
  fallbackStoryText: string
): StoryPageData[] {
  if (storyPagesJson && storyPagesJson.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(storyPagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: String(item.id || `page-${idx + 1}`),
          text: String(item.text || ''),
          images: Array.isArray(item.images)
            ? item.images.map((im: StoryPageImage, iIdx: number) => ({
                id: String(im.id || `img-${idx}-${iIdx}`),
                dataUrl: String(im.dataUrl || ''),
                widthPercent: Number(im.widthPercent) || 45,
                layout: (im.layout as ImageWrapLayout) || 'center-top',
                caption: String(im.caption || '')
              }))
            : []
        }));
      }
    } catch {
      // Fallback to plain text pagination
    }
  }

  const raw = fallbackStoryText || '';
  if (!raw.trim()) {
    return [{ id: 'page-1', text: '', images: [] }];
  }

  const pages: StoryPageData[] = [];
  let remaining = raw;
  let pageCounter = 1;

  while (remaining.length > 0) {
    const emptyPage: StoryPageData = {
      id: `page-${pageCounter}`,
      text: '',
      images: []
    };
    const { fitText, overflowText } = splitTextForPage(
      remaining,
      emptyPage,
      pageCounter === 1,
      true
    );
    emptyPage.text = fitText;
    pages.push(emptyPage);
    if (!overflowText || overflowText === remaining) break;
    remaining = overflowText;
    pageCounter += 1;
  }

  return pages.length > 0 ? pages : [{ id: 'page-1', text: '', images: [] }];
}

export const PaginatedStoryStudioView: React.FC<PaginatedStoryStudioViewProps> = ({
  storyTitle,
  setStoryTitle,
  storySynopsis,
  setStorySynopsis,
  storyText,
  setStoryText,
  storyPagesJson,
  setStoryPagesJson,
  activeStoryId,
  storySavedToast,
  isStoryFullscreen,
  onToggleFullscreen,
  onSaveStory,
  onStartNewStory,
  onOpenAdvancedWiki,
  totalArticlesCount,
  savedStoryArticles,
  onSelectSavedStory,
  inPageSearchNode,
  returnToUniverseLine
}) => {
  const [pages, setPages] = useState<StoryPageData[]>(() =>
    parseInitialStoryPages(storyPagesJson, storyText)
  );
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showSynopsisHeader, setShowSynopsisHeader] = useState<boolean>(true);
  const [autoPageNotice, setAutoPageNotice] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFocusNewPageRef = useRef<boolean>(false);
  const resizingImageRef = useRef<{
    imageId: string;
    startX: number;
    startWidthPercent: number;
  } | null>(null);

  // Sync when switching stories or undo/redo restores storyPagesJson / storyText
  const lastSyncedJsonRef = useRef<string>(storyPagesJson);
  const lastSyncedStoryIdRef = useRef<string>(activeStoryId);

  useEffect(() => {
    if (
      activeStoryId !== lastSyncedStoryIdRef.current ||
      (storyPagesJson !== lastSyncedJsonRef.current && storyPagesJson !== JSON.stringify(pages))
    ) {
      const nextPages = parseInitialStoryPages(storyPagesJson, storyText);
      setPages(nextPages);
      lastSyncedJsonRef.current = storyPagesJson;
      if (activeStoryId !== lastSyncedStoryIdRef.current) {
        setCurrentPageIndex(0);
        setSelectedImageId(null);
        lastSyncedStoryIdRef.current = activeStoryId;
      } else {
        setCurrentPageIndex((prev) => Math.min(prev, Math.max(0, nextPages.length - 1)));
      }
    }
  }, [activeStoryId, storyPagesJson, storyText]);

  // Commit pages state upward to App.tsx for Auto-Save & Global Undo/Redo
  const commitPagesUpdate = (nextPages: StoryPageData[]) => {
    const normalized =
      nextPages.length > 0 ? nextPages : [{ id: 'page-1', text: '', images: [] }];
    setPages(normalized);
    const serialized = JSON.stringify(normalized);
    lastSyncedJsonRef.current = serialized;
    setStoryPagesJson(serialized);
    const combinedText = normalized
      .map((p) => p.text.trim())
      .filter(Boolean)
      .join('\n\n');
    setStoryText(combinedText);
  };

  // Focus textarea when auto-paginating to a newly created page
  useEffect(() => {
    if (pendingFocusNewPageRef.current && textareaRef.current) {
      pendingFocusNewPageRef.current = false;
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [currentPageIndex, pages.length]);

  // Handle mouse drag for MS Word-style corner image resize handle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const activeResize = resizingImageRef.current;
      if (!activeResize) return;
      const deltaX = e.clientX - activeResize.startX;
      // ~600px page content width -> 1% per 6px
      const deltaPercent = Math.round(deltaX / 5.5);
      const nextWidth = Math.max(
        20,
        Math.min(100, activeResize.startWidthPercent + deltaPercent)
      );

      setPages((prev) => {
        const updated = prev.map((p, idx) =>
          idx === currentPageIndex
            ? {
                ...p,
                images: p.images.map((im) =>
                  im.id === activeResize.imageId ? { ...im, widthPercent: nextWidth } : im
                )
              }
            : p
        );
        return updated;
      });
    };

    const handleMouseUp = () => {
      if (resizingImageRef.current) {
        resizingImageRef.current = null;
        setPages((latest) => {
          const serialized = JSON.stringify(latest);
          lastSyncedJsonRef.current = serialized;
          setStoryPagesJson(serialized);
          return latest;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentPageIndex]);

  const safePageIndex = Math.min(currentPageIndex, Math.max(0, pages.length - 1));
  const currentPage = pages[safePageIndex] || { id: 'page-1', text: '', images: [] };

  const navigateToPage = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= pages.length || targetIdx === safePageIndex) return;
    setSlideDirection(targetIdx > safePageIndex ? 'right' : 'left');
    setSelectedImageId(null);
    setCurrentPageIndex(targetIdx);
    window.setTimeout(() => setSlideDirection(null), 260);
  };

  // Handle text editing on the current page with automatic 1-page limit & overflow cascade
  const handlePageTextChange = (rawNewText: string) => {
    const isFirst = safePageIndex === 0;
    const hasSyn = showSynopsisHeader && Boolean(storySynopsis.trim());

    if (!doesTextExceedPage(rawNewText, currentPage, isFirst, hasSyn)) {
      const nextPages = pages.map((p, idx) =>
        idx === safePageIndex ? { ...p, text: rawNewText } : p
      );
      commitPagesUpdate(nextPages);
      return;
    }

    // Current page reached its 1-page limit! Cascade overflow into subsequent pages automatically
    const updatedPages = [...pages];
    let cursorPageIdx = safePageIndex;
    let textToPlace = rawNewText;

    while (textToPlace.length > 0) {
      const targetPage = updatedPages[cursorPageIdx] || {
        id: `page-${Date.now()}-${cursorPageIdx}`,
        text: '',
        images: []
      };
      const isPageZero = cursorPageIdx === 0;
      const { fitText, overflowText } = splitTextForPage(
        textToPlace,
        targetPage,
        isPageZero,
        hasSyn
      );

      updatedPages[cursorPageIdx] = {
        ...targetPage,
        text: fitText
      };

      if (!overflowText) {
        break;
      }

      cursorPageIdx += 1;
      if (cursorPageIdx < updatedPages.length) {
        // Prepend overflow to the next existing page
        const existingNextText = updatedPages[cursorPageIdx].text;
        textToPlace = existingNextText
          ? `${overflowText}${existingNextText.startsWith(' ') ? '' : ' '}${existingNextText}`
          : overflowText;
      } else {
        // Create a brand new page for the overflow
        updatedPages.push({
          id: `page-${Date.now()}-${cursorPageIdx}`,
          text: overflowText,
          images: []
        });
        // Check if the overflow itself exceeds 1 page (e.g., large paste)
        textToPlace = overflowText;
        if (
          !doesTextExceedPage(
            textToPlace,
            updatedPages[cursorPageIdx],
            false,
            false
          )
        ) {
          break;
        }
      }
    }

    commitPagesUpdate(updatedPages);

    // Automatically slide to the next page so the user continues typing seamlessly
    const nextFocusPageIdx = Math.min(safePageIndex + 1, updatedPages.length - 1);
    if (nextFocusPageIdx > safePageIndex) {
      setSlideDirection('right');
      pendingFocusNewPageRef.current = true;
      setCurrentPageIndex(nextFocusPageIdx);
      setAutoPageNotice(`Halaman ${safePageIndex + 1} penuh — otomatis pindah ke Halaman ${nextFocusPageIdx + 1}`);
      window.setTimeout(() => setSlideDirection(null), 260);
      window.setTimeout(() => setAutoPageNotice(''), 3200);
    }
  };

  const handleAddBlankPage = () => {
    const newPage: StoryPageData = {
      id: `page-${Date.now()}`,
      text: '',
      images: []
    };
    const insertAt = safePageIndex + 1;
    const nextPages = [
      ...pages.slice(0, insertAt),
      newPage,
      ...pages.slice(insertAt)
    ];
    commitPagesUpdate(nextPages);
    setSlideDirection('right');
    pendingFocusNewPageRef.current = true;
    setCurrentPageIndex(insertAt);
    window.setTimeout(() => setSlideDirection(null), 260);
  };

  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      // Clear page 1 if it's the only page
      commitPagesUpdate([{ id: 'page-1', text: '', images: [] }]);
      return;
    }
    const nextPages = pages.filter((_, idx) => idx !== safePageIndex);
    const nextIndex = Math.max(0, safePageIndex - 1);
    commitPagesUpdate(nextPages);
    setCurrentPageIndex(nextIndex);
  };

  // Insert Image into the current Story page (MS Word-style)
  const insertImageFileIntoPage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const rawDataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        // Compress reasonably so localStorage stays fast
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        const finalDataUrl = ctx
          ? (ctx.drawImage(img, 0, 0, canvas.width, canvas.height),
            canvas.toDataURL('image/jpeg', 0.88))
          : rawDataUrl;

        const newImage: StoryPageImage = {
          id: `story-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: finalDataUrl,
          widthPercent: 45,
          layout: 'float-left',
          caption: ''
        };

        const updatedPage: StoryPageData = {
          ...currentPage,
          images: [...currentPage.images, newImage]
        };

        // Re-check if adding the image causes text on this page to overflow to the next page
        const nextPages = pages.map((p, idx) =>
          idx === safePageIndex ? updatedPage : p
        );
        commitPagesUpdate(nextPages);
        setSelectedImageId(newImage.id);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      insertImageFileIntoPage(file);
    }
    e.target.value = '';
  };

  const handlePasteOnPage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          insertImageFileIntoPage(file);
          return;
        }
      }
    }
  };

  const handleUpdateImage = (imageId: string, patch: Partial<StoryPageImage>) => {
    const nextPages = pages.map((p, idx) =>
      idx === safePageIndex
        ? {
            ...p,
            images: p.images.map((im) => (im.id === imageId ? { ...im, ...patch } : im))
          }
        : p
    );
    commitPagesUpdate(nextPages);
  };

  const handleDeleteImage = (imageId: string) => {
    const nextPages = pages.map((p, idx) =>
      idx === safePageIndex
        ? {
            ...p,
            images: p.images.filter((im) => im.id !== imageId)
          }
        : p
    );
    commitPagesUpdate(nextPages);
    if (selectedImageId === imageId) setSelectedImageId(null);
  };

  const totalWordsCount = useMemo(() => {
    const allText = `${storySynopsis} ${pages.map((p) => p.text).join(' ')}`.trim();
    return allText ? allText.split(/\s+/).filter(Boolean).length : 0;
  }, [storySynopsis, pages]);

  const currentPageWordsCount = useMemo(() => {
    const t = currentPage.text.trim();
    return t ? t.split(/\s+/).filter(Boolean).length : 0;
  }, [currentPage.text]);

  const pageCapacityInfo = useMemo(() => {
    const { maxChars } = computePageMaxCapacity(
      currentPage,
      safePageIndex === 0,
      showSynopsisHeader && Boolean(storySynopsis.trim())
    );
    const usedPercent = Math.min(100, Math.round((currentPage.text.length / maxChars) * 100));
    return { maxChars, usedPercent };
  }, [currentPage, safePageIndex, showSynopsisHeader, storySynopsis]);

  const topImages = currentPage.images.filter((im) => im.layout === 'center-top');
  const floatedImages = currentPage.images.filter(
    (im) => im.layout === 'float-left' || im.layout === 'float-right'
  );
  const bottomImages = currentPage.images.filter((im) => im.layout === 'center-bottom');

  const renderImageCard = (img: StoryPageImage) => {
    const isSelected = selectedImageId === img.id && !isStoryFullscreen;
    const floatClass =
      img.layout === 'float-left'
        ? 'float-left mr-5 mb-3'
        : img.layout === 'float-right'
        ? 'float-right ml-5 mb-3'
        : 'mx-auto my-3';

    return (
      <div
        key={img.id}
        style={{ width: `${img.widthPercent}%` }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isStoryFullscreen) setSelectedImageId(img.id);
        }}
        className={`relative group rounded-2xl transition-all select-none ${floatClass} ${
          isSelected
            ? 'ring-2 ring-[#6d7696] shadow-[0_8px_24px_rgba(109,118,150,0.3)]'
            : 'hover:ring-1 hover:ring-[#879fd0]'
        }`}
      >
        {/* MS Word-Style Floating Picture Format Toolbar when Selected */}
        {isSelected && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-white border border-[#cbd3e6] rounded-full px-2.5 py-1 shadow-xl whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => handleUpdateImage(img.id, { layout: 'float-left' })}
              className={`p-1.5 rounded-full text-xs transition ${
                img.layout === 'float-left'
                  ? 'bg-[#6d7696] text-white'
                  : 'text-[#52586e] hover:bg-[#e6ecf7]'
              }`}
              title="Bungkus Kiri (Wrap Text Kanan seperti MS Word)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdateImage(img.id, { layout: 'center-top' })}
              className={`p-1.5 rounded-full text-xs transition ${
                img.layout === 'center-top'
                  ? 'bg-[#6d7696] text-white'
                  : 'text-[#52586e] hover:bg-[#e6ecf7]'
              }`}
              title="Tengah Atas (In Line Top)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdateImage(img.id, { layout: 'center-bottom' })}
              className={`p-1.5 rounded-full text-xs transition ${
                img.layout === 'center-bottom'
                  ? 'bg-[#6d7696] text-white'
                  : 'text-[#52586e] hover:bg-[#e6ecf7]'
              }`}
              title="Tengah Bawah (In Line Bottom)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdateImage(img.id, { layout: 'float-right' })}
              className={`p-1.5 rounded-full text-xs transition ${
                img.layout === 'float-right'
                  ? 'bg-[#6d7696] text-white'
                  : 'text-[#52586e] hover:bg-[#e6ecf7]'
              }`}
              title="Bungkus Kanan (Wrap Text Kiri seperti MS Word)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <span className="h-4 w-px bg-[#dce3f2] mx-0.5" />

            {[30, 50, 75, 100].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => handleUpdateImage(img.id, { widthPercent: sz })}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition ${
                  Math.abs(img.widthPercent - sz) <= 5
                    ? 'bg-[#879fd0] text-white'
                    : 'text-[#52586e] hover:bg-[#e6ecf7]'
                }`}
                title={`Ukuran Gambar ${sz}%`}
              >
                {sz}%
              </button>
            ))}

            <span className="h-4 w-px bg-[#dce3f2] mx-0.5" />

            <button
              type="button"
              onClick={() => handleDeleteImage(img.id)}
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition"
              title="Hapus Gambar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden border border-[#dce3f2] bg-[#f4f6fb]">
          <img
            src={img.dataUrl}
            alt={img.caption || 'Ilustrasi Cerita'}
            className="w-full h-auto max-h-[260px] object-contain block mx-auto"
          />

          {/* MS Word-Style Bottom-Right Corner Resize Drag Handle */}
          {!isStoryFullscreen && (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSelectedImageId(img.id);
                resizingImageRef.current = {
                  imageId: img.id,
                  startX: e.clientX,
                  startWidthPercent: img.widthPercent
                };
              }}
              className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-sm bg-[#6d7696] border-2 border-white cursor-nwse-resize shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              title="Tarik untuk mengubah ukuran gambar"
            />
          )}
        </div>

        {/* Optional Caption like MS Word Insert Caption */}
        {(!isStoryFullscreen && isSelected) || img.caption ? (
          <input
            type="text"
            value={img.caption}
            readOnly={isStoryFullscreen}
            onChange={(e) => handleUpdateImage(img.id, { caption: e.target.value })}
            placeholder="Tambahkan keterangan gambar (opsional)..."
            className="w-full mt-1.5 text-center text-xs italic text-[#52586e] bg-transparent focus:outline-none border-b border-transparent focus:border-[#879fd0]"
          />
        ) : null}
      </div>
    );
  };

  return (
    <div
      onClick={() => setSelectedImageId(null)}
      className={`relative -mx-6 sm:-mx-8 -my-6 sm:-my-8 bg-[#f2f4f9] flex flex-col overflow-y-auto ${
        isStoryFullscreen
          ? 'h-screen max-h-screen'
          : 'h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]'
      }`}
    >
      {/* Hidden File Input for Insert Image (MS Word Style) */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageInputChange}
        className="hidden"
      />

      {/* Top Sticky Document Ribbon / Action Bar */}
      <div className="sticky top-0 z-30 bg-[#f2f4f9]/95 backdrop-blur-md border-b border-[#dce3f2] px-6 sm:px-10 py-3">
        <div
          className={`mx-auto flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ${
            isStoryFullscreen ? 'max-w-6xl' : 'max-w-5xl'
          }`}
        >
          {/* Left: Return to Universe Line OR Document Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {returnToUniverseLine && (
              <button
                type="button"
                onClick={returnToUniverseLine.onReturn}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#e6ecf7] text-[#181b26] border border-[#6d7696] text-xs font-serif font-semibold transition shadow-xs shrink-0 cursor-pointer group"
                title={`Kembali ke halaman ${returnToUniverseLine.label}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#6d7696] group-hover:-translate-x-0.5 transition-transform" />
                {returnToUniverseLine.iconSrc && (
                  <img
                    src={returnToUniverseLine.iconSrc}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                  />
                )}
                <span>Kembali ke {returnToUniverseLine.label}</span>
              </button>
            )}

            {isStoryFullscreen && inPageSearchNode && (
              <div className="min-w-[200px] max-w-xs">{inPageSearchNode}</div>
            )}

            {/* MS Word-Style Insert Image & Page Controls Ribbon */}
            {!isStoryFullscreen && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white border border-[#cbd3e6] rounded-full px-2.5 py-1 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    imageInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7792c4] hover:bg-[#6d7696] text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                  title="Sisipkan Gambar ke Halaman Ini (seperti Insert Picture di MS Word)"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Insert Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddBlankPage}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#e6ecf7] text-[#181b26] text-xs font-medium transition cursor-pointer"
                  title="Tambah Halaman Baru"
                >
                  <Plus className="w-3.5 h-3.5 text-[#5b74a8]" />
                  <span>Halaman Baru</span>
                </button>

                {safePageIndex === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSynopsisHeader((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                      showSynopsisHeader
                        ? 'bg-[#eef2fa] text-[#5b74a8] font-semibold'
                        : 'text-[#52586e] hover:bg-[#e6ecf7]'
                    }`}
                    title="Tampilkan / Sembunyikan Kolom Sinopsis di Halaman 1"
                  >
                    Sinopsis
                  </button>
                )}

                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentPage}
                    className="p-1.5 rounded-full text-[#52586e] hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                    title={`Hapus Halaman ${safePageIndex + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Center: Page Slider Indicator (Geser Halaman) */}
          <div className="flex items-center gap-1.5 bg-white border border-[#cbd3e6] rounded-full px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={() => navigateToPage(safePageIndex - 1)}
              disabled={safePageIndex === 0}
              className={`p-1 rounded-full transition ${
                safePageIndex > 0
                  ? 'text-[#181b26] hover:bg-[#e6ecf7] cursor-pointer'
                  : 'text-[#b5bfd6] cursor-not-allowed'
              }`}
              title="Geser ke Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1 max-w-[200px] overflow-x-auto">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigateToPage(idx)}
                  className={`min-w-[26px] h-6 px-2 rounded-full text-xs font-mono font-bold transition ${
                    idx === safePageIndex
                      ? 'bg-[#6d7696] text-white shadow-2xs'
                      : 'text-[#52586e] hover:bg-[#e6ecf7]'
                  }`}
                  title={`Buka Halaman ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigateToPage(safePageIndex + 1)}
              disabled={safePageIndex >= pages.length - 1}
              className={`p-1 rounded-full transition ${
                safePageIndex < pages.length - 1
                  ? 'text-[#181b26] hover:bg-[#e6ecf7] cursor-pointer'
                  : 'text-[#b5bfd6] cursor-not-allowed'
              }`}
              title="Geser ke Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Mode Baca / Fullscreen Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-serif font-semibold transition shadow-xs ${
                isStoryFullscreen
                  ? 'bg-[#6d7696] text-white border-[#879fd0] shadow-[0_4px_14px_rgba(109,118,150,0.35)]'
                  : 'bg-white hover:bg-[#e8eef9] text-[#181b26] border-[#494a52]'
              }`}
            >
              {isStoryFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Keluar Mode Baca</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#6d7696]" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Pagination Toast Notification when a page fills up and creates the next page */}
      {autoPageNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#6d7696] text-white text-xs font-semibold shadow-lg border border-white/60 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{autoPageNotice}</span>
        </div>
      )}

      {/* Main Centered Paginated Sheet Stage with Left/Right Page Slide Buttons */}
      <form
        onSubmit={onSaveStory}
        className={`flex-1 w-full mx-auto px-4 sm:px-10 py-6 flex flex-col justify-between gap-6 ${
          isStoryFullscreen ? 'max-w-5xl' : 'max-w-4xl'
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Left Floating Slide Page Button */}
          <button
            type="button"
            onClick={() => navigateToPage(safePageIndex - 1)}
            disabled={safePageIndex === 0}
            className={`hidden sm:flex items-center justify-center w-11 h-11 rounded-full border shadow-md transition-all shrink-0 mr-4 ${
              safePageIndex > 0
                ? 'bg-white hover:bg-[#6d7696] text-[#181b26] hover:text-white border-[#cbd3e6] cursor-pointer hover:scale-105'
                : 'bg-white/50 text-[#b5bfd6] border-[#dce3f2] opacity-40 cursor-not-allowed'
            }`}
            title="Geser ke Halaman Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* THE BOUNDED 1-PAGE STORY SHEET (Lembar Cerita 1 Halaman) */}
          <div
            onPaste={handlePasteOnPage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer?.files?.[0];
              if (file && file.type.startsWith('image/')) {
                insertImageFileIntoPage(file);
              }
            }}
            className={`w-full rounded-[26px] bg-white border border-[#dce3f2] shadow-[0_20px_50px_rgba(115,139,189,0.2)] px-7 sm:px-14 py-7 sm:py-10 flex flex-col justify-between transition-all duration-250 ${
              isStoryFullscreen ? 'h-[78vh] min-h-[620px]' : 'h-[640px] sm:h-[680px]'
            } ${
              slideDirection === 'right'
                ? 'translate-x-2 opacity-95'
                : slideDirection === 'left'
                ? '-translate-x-2 opacity-95'
                : 'translate-x-0 opacity-100'
            }`}
          >
            {/* Sheet Header: Story Title & Page Number Badge */}
            <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-[#e8edf7] shrink-0">
              {isStoryFullscreen ? (
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#181b26] truncate">
                  {storyTitle.trim() || 'Lembar Cerita Tanpa Judul'}
                </h1>
              ) : (
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Judul Cerita..."
                  className="flex-1 bg-transparent font-serif text-lg sm:text-xl font-bold text-[#181b26] placeholder:text-[#8b95b0] focus:outline-none border-b border-transparent focus:border-[#879fd0]"
                />
              )}

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-[#f4f6fb] border border-[#dce3f2] text-[11px] font-mono font-semibold text-[#5b74a8]">
                  Halaman {safePageIndex + 1} / {pages.length}
                </span>
              </div>
            </div>

            {/* Optional Compact Synopsis Box on Page 1 Only */}
            {safePageIndex === 0 && showSynopsisHeader && (
              <div className="mt-3 mb-2 p-3.5 rounded-2xl bg-[#f4f6fb] border border-[#dce3f2] shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#5b74a8]">
                    Sinopsis Cerita
                  </span>
                  {!isStoryFullscreen && (
                    <button
                      type="button"
                      onClick={() => setShowSynopsisHeader(false)}
                      className="text-[10px] text-[#6d7696] hover:text-[#181b26]"
                    >
                      Sembunyikan
                    </button>
                  )}
                </div>
                {isStoryFullscreen ? (
                  <p className="text-xs sm:text-sm font-serif text-[#2c3142] leading-relaxed line-clamp-2">
                    {storySynopsis.trim() || 'Belum ada sinopsis cerita.'}
                  </p>
                ) : (
                  <textarea
                    rows={2}
                    value={storySynopsis}
                    onChange={(e) => setStorySynopsis(e.target.value)}
                    placeholder="Tulis ringkasan atau sinopsis singkat cerita di sini..."
                    className="w-full bg-transparent font-serif text-xs sm:text-sm text-[#181b26] placeholder:text-[#8b95b0] leading-relaxed resize-none focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* Main Bounded 1-Page Story Body (Supports Inline & Wrapped Images + Bounded Text) */}
            <div className="flex-1 min-h-0 py-3 flex flex-col justify-between overflow-hidden">
              {/* Top Centered Images */}
              {topImages.length > 0 && (
                <div className="shrink-0 mb-2">{topImages.map(renderImageCard)}</div>
              )}

              {/* Middle Writing Area with Left/Right Floated Images (MS Word Style) */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {floatedImages.length > 0 && (
                  <div className="contents">{floatedImages.map(renderImageCard)}</div>
                )}

                {isStoryFullscreen ? (
                  <div className="font-serif text-base sm:text-lg text-[#181b26] leading-relaxed whitespace-pre-line select-text">
                    {currentPage.text || (
                      <span className="italic text-[#8b95b0]">
                        Halaman ini masih kosong.
                      </span>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={currentPage.text}
                    onChange={(e) => handlePageTextChange(e.target.value)}
                    placeholder={`Mulai menulis cerita di Halaman ${safePageIndex + 1}... (Saat halaman ini penuh, halaman baru akan dibuat secara otomatis. Kamu juga bisa klik "Insert Image" atau tempel gambar langsung ke lembar ini)`}
                    className="w-full h-full bg-transparent font-serif text-base sm:text-lg text-[#181b26] placeholder:text-[#8b95b0] leading-[1.75] resize-none focus:outline-none overflow-hidden"
                  />
                )}
              </div>

              {/* Bottom Centered Images */}
              {bottomImages.length > 0 && (
                <div className="shrink-0 mt-2">{bottomImages.map(renderImageCard)}</div>
              )}
            </div>

            {/* Sheet Footer: Page Capacity Progress Bar & Quick Prev/Next Page Links */}
            <div className="pt-3 border-t border-[#e8edf7] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#52586e] shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums">
                  {currentPageWordsCount} kata di halaman ini
                </span>
                {!isStoryFullscreen && (
                  <div
                    className="hidden sm:flex items-center gap-2"
                    title="Kapasitas lembar halaman saat ini (otomatis membuat halaman baru saat mencapai 100%)"
                  >
                    <div className="w-24 h-1.5 rounded-full bg-[#e6ecf7] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pageCapacityInfo.usedPercent > 88
                            ? 'bg-amber-500'
                            : 'bg-[#7792c4]'
                        }`}
                        style={{ width: `${pageCapacityInfo.usedPercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#6d7696]">
                      {pageCapacityInfo.usedPercent}% halaman
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateToPage(safePageIndex - 1)}
                  disabled={safePageIndex === 0}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition ${
                    safePageIndex > 0
                      ? 'bg-[#f4f6fb] hover:bg-[#e6ecf7] text-[#181b26] border-[#cbd3e6] cursor-pointer'
                      : 'opacity-40 cursor-not-allowed border-transparent text-[#8b95b0]'
                  }`}
                >
                  ← Hal. Sebelumnya
                </button>

                {safePageIndex < pages.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => navigateToPage(safePageIndex + 1)}
                    className="px-2.5 py-1 rounded-full bg-[#f4f6fb] hover:bg-[#e6ecf7] text-[#181b26] border border-[#cbd3e6] text-xs font-medium transition cursor-pointer"
                  >
                    Hal. Selanjutnya →
                  </button>
                ) : (
                  !isStoryFullscreen && (
                    <button
                      type="button"
                      onClick={handleAddBlankPage}
                      className="px-2.5 py-1 rounded-full bg-[#eef2fa] hover:bg-[#dce4f5] text-[#5b74a8] border border-[#cbd3e6] text-xs font-semibold transition cursor-pointer"
                    >
                      + Lembar Berikutnya
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Floating Slide Page Button */}
          <button
            type="button"
            onClick={() =>
              safePageIndex < pages.length - 1
                ? navigateToPage(safePageIndex + 1)
                : handleAddBlankPage()
            }
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full border bg-white hover:bg-[#6d7696] text-[#181b26] hover:text-white border-[#cbd3e6] shadow-md transition-all shrink-0 ml-4 cursor-pointer hover:scale-105"
            title={
              safePageIndex < pages.length - 1
                ? 'Geser ke Halaman Selanjutnya'
                : 'Buat & Geser ke Halaman Baru'
            }
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Workspace Action Bar & Saved Stories List */}
        {!isStoryFullscreen && (
          <div className="space-y-5 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#52586e]">
                <span className="font-mono tabular-nums">
                  Total: {totalWordsCount} kata · {pages.length} halaman
                </span>
                {storySavedToast && (
                  <span className="inline-flex items-center gap-1 text-[#6d7696] font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    Story tersimpan otomatis
                  </span>
                )}
                <button
                  type="button"
                  onClick={onOpenAdvancedWiki}
                  className="text-[#6d7696] hover:text-[#181b26] underline ml-1 font-semibold"
                >
                  Buka Daftar Artikel &amp; Tag ({totalArticlesCount})
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {(storySynopsis || storyText || storyTitle || activeStoryId) && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartNewStory();
                      setPages([{ id: 'page-1', text: '', images: [] }]);
                      setCurrentPageIndex(0);
                      setSelectedImageId(null);
                    }}
                    className="px-4 py-2 rounded-full border border-[#494a52] bg-white text-xs font-semibold text-[#181b26] hover:bg-[#e8eef9] transition-colors"
                  >
                    + Cerita Baru
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#6d7696] hover:bg-[#5d6685] text-white font-serif font-semibold text-xs border border-[#879fd0] shadow-[0_4px_14px_rgba(109,118,150,0.35)] transition-all"
                >
                  Simpan Story
                </button>
              </div>
            </div>

            {savedStoryArticles.length > 0 && (
              <div className="pt-4 border-t border-[#d5dced] space-y-3">
                <div className="text-xs font-bold text-[#181b26]">
                  Daftar Lembar Cerita Tersimpan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {savedStoryArticles.map((st) => {
                    let pageCountBadge = 1;
                    const rawPages = st.templateValues?.StoryPagesJson;
                    if (typeof rawPages === 'string' && rawPages.startsWith('[')) {
                      try {
                        const parsed = JSON.parse(rawPages);
                        if (Array.isArray(parsed)) pageCountBadge = Math.max(1, parsed.length);
                      } catch {
                        // ignore
                      }
                    }
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSelectSavedStory(st)}
                        className={`text-left p-3.5 rounded-[22px] border transition-all flex items-center gap-3 ${
                          activeStoryId === st.id
                            ? 'bg-[#6d7696] text-white border-[#879fd0] shadow-md'
                            : 'bg-white text-[#181b26] border-[#dce3f2] hover:border-[#879fd0] shadow-xs'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#879fd0] border border-[#7792c4] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-xs font-bold truncate ${
                              activeStoryId === st.id ? 'text-white' : 'text-[#181b26]'
                            }`}
                          >
                            {st.title}
                          </div>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              activeStoryId === st.id ? 'text-white/85' : 'text-[#52586e]'
                            }`}
                          >
                            {pageCountBadge} halaman · {st.wordCount} kata
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
