import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Plus,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  ArrowLeft
} from 'lucide-react';
import { Article, World } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

export type EntityCategoryMode =
  | 'worlds'
  | 'organizations'
  | 'species'
  | 'conditions'
  | 'cosmics'
  | 'manuscripts'
  | 'events';

interface EntityCategoryStudioViewProps {
  mode: EntityCategoryMode;
  activeWorld: World;
  articles: Article[];
  selectedEntityId: string;
  initialFullscreen?: boolean;
  onFullscreenConsumed?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  inPageSearchNode?: React.ReactNode;
  returnToUniverseLine?: {
    label: string;
    iconSrc?: string;
    onReturn: () => void;
  } | null;
  onSelectEntity: (id: string) => void;
  onSaveEntity: (art: Article) => void;
  onDeleteEntity: (id: string) => void;
  historyRevision?: number;
}

const MODE_CONFIG: Record<
  EntityCategoryMode,
  {
    listTitle: string;
    newButtonLabel: string;
    namePlaceholder: string;
    categoryName: string;
    templateType: string;
    tagMatch: string;
    panelBgClass: string;
    activeBtnClass: string;
    inactiveBtnClass: string;
    defaultIconPath: string;
  }
> = {
  worlds: {
    listTitle: 'World List',
    newButtonLabel: 'New World',
    namePlaceholder: 'Nama Dunia (World)...',
    categoryName: 'Worlds',
    templateType: 'World / Setting',
    tagMatch: 'World',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/world.png'
  },
  organizations: {
    listTitle: 'Organization List',
    newButtonLabel: 'New Organization',
    namePlaceholder: 'Nama Organisasi...',
    categoryName: 'Organizations',
    templateType: 'Organization / Faction',
    tagMatch: 'Organisasi',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/organization.png'
  },
  species: {
    listTitle: 'Species List',
    newButtonLabel: 'New Species',
    namePlaceholder: 'Nama Spesies...',
    categoryName: 'Species',
    templateType: 'Species / Race',
    tagMatch: 'Spesies',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/species.png'
  },
  conditions: {
    listTitle: 'Condition List',
    newButtonLabel: 'New Condition',
    namePlaceholder: 'Nama Kondisi...',
    categoryName: 'Conditions',
    templateType: 'Medical Condition',
    tagMatch: 'Kondisi',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/conditions.png'
  },
  cosmics: {
    listTitle: 'Cosmic List',
    newButtonLabel: 'New Cosmic',
    namePlaceholder: 'Nama Kosmis / Alam Semesta...',
    categoryName: 'Cosmics',
    templateType: 'Cosmology / Plane',
    tagMatch: 'Kosmis',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/cosmics.png'
  },
  manuscripts: {
    listTitle: 'Manuscript List',
    newButtonLabel: 'New Manuscript',
    namePlaceholder: 'Judul Manuskrip / Bab / Catatan...',
    categoryName: 'Manuscripts',
    templateType: 'Manuscript / Lore Document',
    tagMatch: 'Manuskrip',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/manuscripts.png'
  },
  events: {
    listTitle: 'Event List',
    newButtonLabel: 'New Event',
    namePlaceholder: 'Judul Event / Peristiwa...',
    categoryName: 'Events',
    templateType: 'Event / Historical Milestone',
    tagMatch: 'Event',
    panelBgClass: 'bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6]',
    activeBtnClass: 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_18px_rgba(73,74,82,0.28)]',
    inactiveBtnClass: 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] hover:border-[#879fd0] shadow-sm',
    defaultIconPath: '/assets/icons/timeline.png'
  }
};

export const EntityCategoryStudioView: React.FC<EntityCategoryStudioViewProps> = ({
  mode,
  activeWorld,
  articles,
  selectedEntityId,
  initialFullscreen = false,
  onFullscreenConsumed,
  onFullscreenChange,
  inPageSearchNode,
  returnToUniverseLine,
  onSelectEntity,
  onSaveEntity,
  onDeleteEntity,
  historyRevision = 0
}) => {
  const cfg = MODE_CONFIG[mode];
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const customIconInputRef = useRef<HTMLInputElement | null>(null);
  const lastLoadedKeyRef = useRef<string>('');
  const isHydratingRef = useRef<boolean>(false);

  // Fullscreen Mode State & 0.5s Residual Zoom Arrival State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(initialFullscreen));
  const [zoomResidueActive, setZoomResidueActive] = useState<boolean>(Boolean(initialFullscreen));

  useEffect(() => {
    if (initialFullscreen) {
      setIsFullscreen(true);
      setZoomResidueActive(true);
      onFullscreenConsumed?.();
    }
  }, [initialFullscreen, onFullscreenConsumed]);

  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    if (!zoomResidueActive) return;
    const timer = window.setTimeout(() => {
      setZoomResidueActive(false);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [zoomResidueActive]);

  const entityList = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.category === cfg.categoryName ||
          a.templateType === cfg.templateType ||
          a.tags.includes(cfg.tagMatch)
      ),
    [articles, cfg.categoryName, cfg.templateType, cfg.tagMatch]
  );

  const [editingId, setEditingId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [customIcon, setCustomIcon] = useState<string>('');
  const [articleDesc, setArticleDesc] = useState<string>('');
  const [secretDesc, setSecretDesc] = useState<string>('');
  const [savedBanner, setSavedBanner] = useState<string>('');

  // Reset form when switching between Organization / Species / Conditions / Cosmics / Manuscripts
  useEffect(() => {
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = '';
    setEditingId('');
    setTitle('');
    setThumbnail('');
    setCustomIcon('');
    setArticleDesc('');
    setSecretDesc('');
    setSavedBanner('');
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  }, [mode]);

  useEffect(() => {
    const targetId =
      mode === 'worlds'
        ? selectedEntityId || entityList[0]?.id || ''
        : selectedEntityId;
    if (!targetId) return;
    const syncKey = `${mode}:${targetId}:${historyRevision}`;
    if (lastLoadedKeyRef.current === syncKey) return;
    const found =
      entityList.find((item) => item.id === targetId) ||
      (mode === 'worlds' ? entityList[0] : undefined);
    if (!found) return;
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = syncKey;
    setEditingId(found.id);
    setTitle(found.title);
    setArticleDesc(found.content || '');
    setSecretDesc(found.secretNotes || '');
    setThumbnail(String(found.templateValues?.ThumbnailUrl || ''));
    setCustomIcon(String(found.templateValues?.CustomIconUrl || ''));
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  }, [selectedEntityId, entityList, mode, historyRevision]);

  const handleResetNew = () => {
    if (mode === 'worlds' && entityList.length > 0) {
      const primary = entityList[0];
      setEditingId(primary.id);
      onSelectEntity(primary.id);
      return;
    }
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = `${mode}::${historyRevision}`;
    setEditingId('');
    onSelectEntity('');
    setTitle('');
    setThumbnail('');
    setCustomIcon('');
    setArticleDesc('');
    setSecretDesc('');
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  };

  // Standardize Entity Thumbnail to 1920x1080 px Landscape Template (16:9)
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1920;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setThumbnail(rawDataUrl);
            return;
          }
          ctx.clearRect(0, 0, 1920, 1080);
          const scale = Math.max(1920 / img.width, 1080 / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (1920 - drawW) / 2;
          const drawY = (1080 - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => setThumbnail(rawDataUrl);
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCustomIcon(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle =
      title.trim() ||
      (mode === 'worlds'
        ? entityList[0]?.title || 'My World'
        : `${cfg.newButtonLabel.replace('New ', '')} ${entityList.length + 1}`);
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const idToUse =
      mode === 'worlds'
        ? editingId || entityList[0]?.id || `worlds-${Date.now()}`
        : editingId || `${mode}-${Date.now()}`;

    const entityArticle: Article = {
      id: idToUse,
      worldId: activeWorld.id,
      title: finalTitle,
      aliases: [],
      templateType: cfg.templateType,
      category: cfg.categoryName,
      tags: [cfg.tagMatch, cfg.categoryName],
      summary: articleDesc.trim().slice(0, 140) || `${finalTitle} (${cfg.categoryName})`,
      content: articleDesc,
      secretNotes: secretDesc,
      spoilerWarning: '',
      templateValues: {
        ThumbnailUrl: thumbnail,
        CustomIconUrl: customIcon
      },
      status: 'published',
      visibility: 'private',
      linkedEntityIds: [],
      galleryCaptions: thumbnail ? [finalTitle] : [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: nowStamp,
          author: 'Creator',
          note: `Saved in ${cfg.listTitle}`,
          contentSnapshot: articleDesc
        }
      ],
      comments: [],
      wordCount: articleDesc
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
      updatedAt: nowStamp
    };

    onSaveEntity(entityArticle);
    lastLoadedKeyRef.current = `${mode}:${idToUse}:${historyRevision}`;
    setEditingId(idToUse);
    onSelectEntity(idToUse);
    setSavedBanner(`"${finalTitle}" tersimpan otomatis (Auto-Saved)`);
  };

  // Automatic real-time save on any field modification
  useEffect(() => {
    if (isHydratingRef.current) return;
    const hasAnyContent = Boolean(
      title.trim() || articleDesc.trim() || secretDesc.trim() || thumbnail || customIcon
    );
    if (!editingId && !hasAnyContent) return;

    const resolvedId =
      mode === 'worlds'
        ? editingId || entityList[0]?.id || ''
        : editingId;
    const existing = resolvedId ? entityList.find((item) => item.id === resolvedId) : null;
    if (
      existing &&
      existing.title === (title.trim() || existing.title) &&
      (existing.content || '') === articleDesc &&
      (existing.secretNotes || '') === secretDesc &&
      String(existing.templateValues?.ThumbnailUrl || '') === thumbnail &&
      String(existing.templateValues?.CustomIconUrl || '') === customIcon
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const idToUse =
        mode === 'worlds'
          ? editingId || entityList[0]?.id || `worlds-${Date.now()}`
          : editingId || `${mode}-${Date.now()}`;
      const finalTitle =
        title.trim() ||
        existing?.title ||
        (mode === 'worlds'
          ? 'My World'
          : `${cfg.newButtonLabel.replace('New ', '')} ${entityList.length + 1}`);
      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

      const entityArticle: Article = {
        id: idToUse,
        worldId: activeWorld.id,
        title: finalTitle,
        aliases: [],
        templateType: cfg.templateType,
        category: cfg.categoryName,
        tags: [cfg.tagMatch, cfg.categoryName],
        summary: articleDesc.trim().slice(0, 140) || `${finalTitle} (${cfg.categoryName})`,
        content: articleDesc,
        secretNotes: secretDesc,
        spoilerWarning: '',
        templateValues: {
          ThumbnailUrl: thumbnail,
          CustomIconUrl: customIcon
        },
        status: 'published',
        visibility: 'private',
        linkedEntityIds: [],
        galleryCaptions: thumbnail ? [finalTitle] : [],
        versions: [
          {
            id: `v-${Date.now()}`,
            timestamp: nowStamp,
            author: 'Creator',
            note: `Auto-saved in ${cfg.listTitle}`,
            contentSnapshot: articleDesc
          }
        ],
        comments: [],
        wordCount: articleDesc
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
        updatedAt: nowStamp
      };

      lastLoadedKeyRef.current = `${mode}:${idToUse}:${historyRevision}`;
      onSaveEntity(entityArticle);
      if (!editingId) {
        setEditingId(idToUse);
        onSelectEntity(idToUse);
      }
      setSavedBanner('Auto-Saved · Ctrl+Z Undo · Ctrl+Shift+Z Redo');
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    title,
    articleDesc,
    secretDesc,
    thumbnail,
    customIcon,
    editingId,
    entityList,
    mode,
    cfg,
    activeWorld.id,
    historyRevision
  ]);

  return (
    <div
      style={
        zoomResidueActive
          ? {
              filter: 'url(#entity-arrival-depth-blur)',
              transform: 'perspective(900px) translate3d(0, 0, 110px) scale(1.18)'
            }
          : undefined
      }
      className={`relative -mx-6 sm:-mx-8 -my-6 sm:-my-8 ${
        isFullscreen ? 'h-screen max-h-screen' : 'h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]'
      } bg-[#f2f4f9] flex flex-col lg:flex-row items-stretch overflow-hidden transition-[transform,filter,opacity] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        zoomResidueActive
          ? 'opacity-30'
          : 'scale-100 filter-none opacity-100'
      }`}
    >
      <DepthDirectionalBlurSvgFilter
        filterId="entity-arrival-depth-blur"
        depthScale={zoomResidueActive ? 65 : 0}
      />
      <input
        ref={customIconInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomIconUpload}
        className="hidden"
      />
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        className="hidden"
      />

      {/* ================================================================== */}
      {/* LEFT PANEL: LIST (Hidden for Single-World mode, or smoothly slides */}
      {/* left & collapses in Fullscreen)                                    */}
      {/* ================================================================== */}
      <div
        className={`relative z-10 shrink-0 h-full min-h-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isFullscreen || mode === 'worlds'
            ? 'w-0 lg:w-0 h-0 lg:h-full -translate-x-full opacity-0 pointer-events-none'
            : 'w-full lg:w-72 translate-x-0 opacity-100'
        }`}
      >
        <div
          className={`w-full lg:w-72 h-full min-h-0 ${cfg.panelBgClass} lg:rounded-r-[38px] p-5 flex flex-col justify-between shadow-[0_12px_32px_rgba(115,139,189,0.22)] transition-colors overflow-hidden`}
        >
          <div className="flex-1 min-h-0 flex flex-col space-y-4">
            <div className="shrink-0 flex items-center justify-between gap-2 px-1">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {cfg.listTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-xl bg-white/25 hover:bg-white/40 text-white transition"
                title="Aktifkan Mode Fullscreen (Sembunyikan Kolom List)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* "+ New ..." Active Pill Button with Dashed Oval "+ Add Custom Icon" */}
            <button
              type="button"
              onClick={handleResetNew}
              className={`shrink-0 w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-left transition-all ${
                !editingId ? cfg.activeBtnClass : cfg.inactiveBtnClass
              }`}
            >
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  customIconInputRef.current?.click();
                }}
                className={`w-6 h-8 rounded-full border border-dashed ${
                  !editingId ? 'border-white/90 text-white' : 'border-[#6d7696] text-[#494a52]'
                } flex flex-col items-center justify-center shrink-0 overflow-hidden hover:bg-white/15`}
                title="Add Custom Icon"
              >
                {customIcon ? (
                  <img src={customIcon} alt="Icon" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span className="text-[5px] leading-tight text-center px-0.5">
                      Add Custom Icon
                    </span>
                  </>
                )}
              </span>
              <span className="text-base font-medium truncate">{cfg.newButtonLabel}</span>
            </button>

            {/* Created Items List */}
            <div className="flex-1 min-h-0 space-y-2 pt-2 overflow-y-auto pr-1">
              {entityList.map((item) => {
                const isSelected = editingId === item.id;
                const itemIcon = String(
                  item.templateValues?.CustomIconUrl || item.templateValues?.ThumbnailUrl || ''
                );
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setEditingId(item.id);
                      onSelectEntity(item.id);
                    }}
                    className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected ? cfg.activeBtnClass : cfg.inactiveBtnClass
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {itemIcon && itemIcon.startsWith('data:image') ? (
                        <img
                          src={itemIcon}
                          alt={item.title}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#879fd0]/60"
                        />
                      ) : (
                        <img
                          src={cfg.defaultIconPath}
                          alt=""
                          className="w-6 h-6 object-contain shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{item.title}</div>
                        {!item.content && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-white/80' : 'text-[#52586e]'
                            }`}
                          >
                            Tag Judul — Klik untuk melengkapi artikel
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDeleteEntity(item.id);
                        if (editingId === item.id) handleResetNew();
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity ${
                        isSelected
                          ? 'hover:bg-black/25 text-white/80 hover:text-white'
                          : 'hover:bg-[#e5eaf5] text-[#52586e] hover:text-rose-600'
                      }`}
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 pt-4 border-t border-white/30 text-[11px] text-white/95 px-1">
            Total {cfg.categoryName}: <strong className="text-white">{entityList.length}</strong>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT / MAIN AREA: Stationary Thumbnail + Article Column Scrolls   */}
      {/* Upward Over Thumbnail Until Covered                                */}
      {/* ================================================================== */}
      <div
        style={{ borderStyle: 'none' }}
        className="relative z-10 flex-1 h-full min-h-0 flex flex-col overflow-y-auto border-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Sticky Top Action Bar for Return to Universe Line, In-Page Search & Fullscreen Toggle */}
        <div className="sticky top-0 z-30 bg-[#f2f4f9]/95 backdrop-blur-md px-6 sm:px-8 pt-5 sm:pt-6 pb-3">
          <div
            className={`w-full mx-auto flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300 ${
              isFullscreen ? 'max-w-7xl' : 'max-w-5xl'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[220px]">
              {returnToUniverseLine && (
                <button
                  type="button"
                  onClick={returnToUniverseLine.onReturn}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#e6ecf7] text-[#181b26] border border-[#6d7696] text-xs font-semibold transition shadow-sm shrink-0 cursor-pointer group"
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
              {isFullscreen && (
                <div className="flex-1 min-w-[200px] max-w-md">{inPageSearchNode}</div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition shadow-sm ${
                isFullscreen
                  ? 'bg-[#6d7696] text-white border-[#879fd0] shadow-[0_4px_14px_rgba(109,118,150,0.35)]'
                  : 'bg-white hover:bg-[#e8eef9] text-[#181b26] border-[#494a52]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Keluar Fullscreen</span>
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

        {/* Main Workspace Container: Stationary Thumbnail + Scrolling Article Column */}
        <form
          onSubmit={handleSaveSubmit}
          style={{ borderStyle: 'none' }}
          className={`flex-1 px-6 sm:px-8 mx-auto w-full border-none transition-all duration-300 ${
            isFullscreen ? 'max-w-7xl' : 'max-w-5xl'
          }`}
        >
          {/* Stationary (Sticky) Top Wide 1920x1080 px (16:9) Landscape Thumbnail Box */}
          <div className="sticky top-[56px] z-10 pt-1">
            <div
              onClick={() => {
                if (!isFullscreen) thumbInputRef.current?.click();
              }}
              style={thumbnail || isFullscreen ? { borderStyle: 'none' } : undefined}
              className={`w-full aspect-[16/9] mx-auto rounded-[28px] transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group bg-gradient-to-br from-[#879fd0] via-[#7d95c7] to-[#738bbd] shadow-[0_12px_32px_rgba(115,139,189,0.28)] ${
                isFullscreen ? 'cursor-default' : 'cursor-pointer'
              } ${
                thumbnail || isFullscreen
                  ? 'border border-[#cbd3e6]'
                  : 'border-2 border-dashed border-white/80 hover:border-white'
              } ${
                isFullscreen ? 'max-h-[420px] sm:max-h-[480px]' : 'max-h-[340px] sm:max-h-[400px]'
              }`}
            >
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt={title || `${cfg.newButtonLabel} (1920x1080)`}
                    className="w-full h-full object-cover"
                  />
                  {!isFullscreen && (
                    <div className="absolute inset-0 bg-[#181b26]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-[#6d7696] border border-white/80 text-xs font-semibold text-white">
                        Ganti Thumbnail (1920×1080 px)
                      </span>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setThumbnail('');
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#494a52] border border-white/60 text-xs font-semibold text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </>
              ) : !isFullscreen ? (
                <div className="text-center space-y-2.5 select-none">
                  <Plus className="w-14 h-14 text-white mx-auto stroke-[2.5] group-hover:scale-105 transition-transform" />
                  <div className="text-base sm:text-lg font-semibold text-white tracking-wide">
                    Add Thumbnail (Opsional)
                  </div>
                  <div className="text-xs font-mono text-white/90">
                    1920 × 1080 px
                  </div>
                </div>
              ) : (
                <img
                  src={customIcon || '/assets/icons/timeline.png'}
                  alt={title || cfg.listTitle}
                  className="w-24 h-24 object-contain opacity-90"
                />
              )}
            </div>
          </div>

          {/* Scrolling Article Column: Rises Upward Over the Stationary Thumbnail Until Covered */}
          <div className="relative z-20 mt-7 pb-[42vh] bg-[#f2f4f9] rounded-t-[28px]">
            {isFullscreen ? (
              <div className="rounded-[28px] bg-white border border-[#dce3f2] px-7 sm:px-10 py-8 flex flex-col justify-between space-y-6 shadow-[0_-18px_40px_rgba(242,244,249,0.98),0_12px_32px_rgba(115,139,189,0.18)] transition-all duration-300 min-h-[540px] select-text">
                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="border-b border-[#e4eaf6] pb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#181b26] tracking-wide">
                      {title.trim() || cfg.newButtonLabel.replace('New ', '')}
                    </h1>
                  </div>

                  {articleDesc.trim() ? (
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm font-bold text-[#6d7696] uppercase tracking-wider">
                        Article
                      </div>
                      <p className="text-sm sm:text-base text-[#2c3142] leading-relaxed whitespace-pre-line">
                        {articleDesc}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6d7696] italic">
                      Belum ada deskripsi artikel untuk entri ini. Keluar dari mode Fullscreen untuk mengedit.
                    </p>
                  )}

                  {secretDesc.trim() && (
                    <div className="space-y-2 pt-3 border-t border-[#e4eaf6]">
                      <div className="text-xs sm:text-sm font-bold text-[#6d7696] uppercase tracking-wider">
                        Secret
                      </div>
                      <p className="text-sm sm:text-base text-[#52586e] italic leading-relaxed whitespace-pre-line">
                        {secretDesc}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] bg-white border border-[#dce3f2] px-7 sm:px-10 py-8 flex flex-col justify-between space-y-6 shadow-[0_-18px_40px_rgba(242,244,249,0.98),0_12px_32px_rgba(115,139,189,0.18)] transition-all duration-300 min-h-[500px]">
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Entity Title Input */}
                  <div className="border-b border-[#e4eaf6] pb-3 flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={cfg.namePlaceholder}
                      className="w-full bg-transparent text-base sm:text-lg font-bold text-[#181b26] placeholder:text-[#848da8] focus:outline-none"
                    />
                  </div>

                  {/* Article & Secret */}
                  <div className="space-y-2 flex-1 flex flex-col">
                    <div className="text-xs sm:text-sm font-bold text-[#181b26]">
                      Article &amp; Secret
                    </div>
                    <textarea
                      rows={8}
                      value={articleDesc}
                      onChange={(e) => setArticleDesc(e.target.value)}
                      placeholder="(deskripsi)"
                      className="w-full bg-transparent text-xs sm:text-sm text-[#2c3142] placeholder:text-[#848da8] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Secret */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs sm:text-sm font-bold text-[#181b26]">Secret</div>
                    <textarea
                      rows={5}
                      value={secretDesc}
                      onChange={(e) => setSecretDesc(e.target.value)}
                      placeholder="(hanya yang diizinkan oleh admin dunia ini untuk mengakses rahasia)"
                      className="w-full bg-transparent text-xs sm:text-sm text-[#2c3142] placeholder:text-[#848da8] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Save Action Bar */}
                <div className="pt-4 border-t border-[#e4eaf6] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#52586e]">
                    {savedBanner ? (
                      <span className="text-[#6d7696] font-semibold inline-flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        {savedBanner}
                      </span>
                    ) : (
                      <span>
                        Gunakan tombol Fullscreen di kanan atas untuk menyembunyikan kolom list dan memperluas area artikel.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#6d7696] hover:bg-[#5d6685] text-white font-semibold text-xs border border-[#879fd0] shadow-[0_4px_14px_rgba(109,118,150,0.35)] transition-all cursor-pointer"
                  >
                    Simpan {cfg.newButtonLabel.replace('New ', '')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
