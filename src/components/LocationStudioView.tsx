import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { Article, World } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

interface LocationStudioViewProps {
  activeWorld: World;
  articles: Article[];
  selectedLocationId: string;
  initialFullscreen?: boolean;
  onFullscreenConsumed?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  inPageSearchNode?: React.ReactNode;
  returnToUniverseLine?: {
    label: string;
    iconSrc?: string;
    onReturn: () => void;
  } | null;
  onSelectLocation: (id: string) => void;
  onSaveLocation: (locArticle: Article) => void;
  onCreateStubTagArticle: (stub: {
    title: string;
    category: string;
    templateType: string;
    tagTypeLabel: string;
  }) => Article;
  onDeleteLocation: (id: string) => void;
  onJumpToTagArticle: (articleId: string, category: string) => void;
  historyRevision?: number;
}

export const LocationStudioView: React.FC<LocationStudioViewProps> = ({
  activeWorld,
  articles,
  selectedLocationId,
  initialFullscreen = false,
  onFullscreenConsumed,
  onFullscreenChange,
  inPageSearchNode,
  returnToUniverseLine,
  onSelectLocation,
  onSaveLocation,
  onCreateStubTagArticle,
  onDeleteLocation,
  onJumpToTagArticle,
  historyRevision = 0
}) => {
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
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

  // All Location articles in the current world
  const locationList = useMemo(
    () =>
      articles.filter(
        (a) =>
          (a.worldId === activeWorld.id || activeWorld.id === 'world-empty') &&
          (a.category === 'Locations' || a.templateType.startsWith('Location'))
      ),
    [articles, activeWorld.id]
  );

  // Existing Cosmic, Species, and Organization articles
  const cosmicArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.category === 'Cosmics' ||
          a.templateType === 'Cosmology / Plane' ||
          a.tags.includes('Kosmis')
      ),
    [articles]
  );

  const speciesArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.category === 'Species' ||
          a.templateType === 'Species / Race' ||
          a.tags.includes('Spesies')
      ),
    [articles]
  );

  const organizationArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.category === 'Organizations' ||
          a.templateType.startsWith('Organization') ||
          a.tags.includes('Organisasi')
      ),
    [articles]
  );

  // Form State matching 6_e265ce0a.png
  const [editingId, setEditingId] = useState<string>('');
  const [locName, setLocName] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [customIcon, setCustomIcon] = useState<string>('');
  const [articleDesc, setArticleDesc] = useState<string>('');
  const [secretDesc, setSecretDesc] = useState<string>('');

  const [cosmicClassification, setCosmicClassification] = useState<string>('');
  const [cosmicDropdownOpen, setCosmicDropdownOpen] = useState<boolean>(false);

  const [regionStatus, setRegionStatus] = useState<string>('');
  const [floraFauna, setFloraFauna] = useState<string>('');
  const [resourcesLivelihood, setResourcesLivelihood] = useState<string>('');

  const [inhabitants, setInhabitants] = useState<string[]>([]);
  const [inhabitantInput, setInhabitantInput] = useState<string>('');
  const [inhabitantDropdownOpen, setInhabitantDropdownOpen] = useState<boolean>(false);

  const [organization, setOrganization] = useState<string>('');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState<boolean>(false);

  const [savedBanner, setSavedBanner] = useState<string>('');

  const sanitizeImageSrc = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'None' || trimmed === 'Attached') return '';
    if (trimmed.startsWith('data:image/')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx === -1 || trimmed.length - commaIdx < 32) return '';
      return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return '';
  };

  const isCreatingNewRef = useRef<boolean>(false);
  const lastSyncedSigRef = useRef<string>('');
  const hydrateTimerRef = useRef<number | null>(null);

  const buildLocationSignature = (
    id: string,
    titleVal: string,
    contentVal: string,
    secretVal: string,
    thumbVal: string,
    bgVal: string,
    iconVal: string,
    cosmicVal: string,
    statusVal: string,
    floraVal: string,
    resVal: string,
    inhabVal: string[],
    orgVal: string
  ) =>
    JSON.stringify({
      id,
      title: titleVal,
      content: contentVal,
      secret: secretVal,
      thumb: thumbVal,
      bg: bgVal,
      icon: iconVal,
      cosmic: cosmicVal.trim(),
      status: statusVal.trim(),
      flora: floraVal.trim(),
      res: resVal.trim(),
      inhab: inhabVal,
      org: orgVal.trim()
    });

  useEffect(() => {
    if (isCreatingNewRef.current) return;
    const targetId =
      (selectedLocationId && locationList.some((l) => l.id === selectedLocationId)
        ? selectedLocationId
        : '') ||
      (editingId && locationList.some((l) => l.id === editingId) ? editingId : '') ||
      locationList[0]?.id ||
      '';
    if (!targetId) return;
    const found = locationList.find((l) => l.id === targetId);
    if (!found) return;

    const rawInhab = found.templateValues?.Penghuni;
    const resolvedInhab: string[] = Array.isArray(rawInhab)
      ? rawInhab
      : typeof rawInhab === 'string' && rawInhab.trim()
      ? rawInhab
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const nextThumb = sanitizeImageSrc(found.templateValues?.ThumbnailUrl);
    const nextBg = sanitizeImageSrc(found.templateValues?.BackgroundUrl);
    const nextIcon = sanitizeImageSrc(found.templateValues?.CustomIconUrl);
    const nextCosmic = String(found.templateValues?.KlasifikasiKosmis || '');
    const nextStatus = String(found.templateValues?.StatusWilayah || '');
    const nextFlora = String(found.templateValues?.FloraFaunaKhas || '');
    const nextRes = String(found.templateValues?.SumberDaya || '');
    const nextOrg = String(found.templateValues?.Organisasi || '');

    const remoteSig = buildLocationSignature(
      found.id,
      found.title,
      found.content || '',
      found.secretNotes || '',
      nextThumb,
      nextBg,
      nextIcon,
      nextCosmic,
      nextStatus,
      nextFlora,
      nextRes,
      resolvedInhab,
      nextOrg
    );

    const syncKey = `${targetId}:${historyRevision}`;
    if (lastSyncedSigRef.current === remoteSig && lastLoadedKeyRef.current === syncKey) {
      return;
    }

    isHydratingRef.current = true;
    lastLoadedKeyRef.current = syncKey;
    lastSyncedSigRef.current = remoteSig;
    setEditingId(found.id);
    setLocName(found.title);
    setArticleDesc(found.content || '');
    setSecretDesc(found.secretNotes || '');
    setThumbnail(nextThumb);
    setBackgroundUrl(nextBg);
    setCustomIcon(nextIcon);
    setCosmicClassification(nextCosmic);
    setRegionStatus(nextStatus);
    setFloraFauna(nextFlora);
    setResourcesLivelihood(nextRes);
    setInhabitants(resolvedInhab);
    setOrganization(nextOrg);

    if (hydrateTimerRef.current) {
      window.clearTimeout(hydrateTimerRef.current);
    }
    hydrateTimerRef.current = window.setTimeout(() => {
      isHydratingRef.current = false;
      hydrateTimerRef.current = null;
    }, 180);
  }, [selectedLocationId, editingId, locationList, historyRevision]);

  const handleResetNewLocation = () => {
    isCreatingNewRef.current = true;
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = `new:${historyRevision}`;
    lastSyncedSigRef.current = '';
    setEditingId('');
    onSelectLocation('');
    setLocName('');
    setThumbnail('');
    setBackgroundUrl('');
    setCustomIcon('');
    setArticleDesc('');
    setSecretDesc('');
    setCosmicClassification('');
    setRegionStatus('');
    setFloraFauna('');
    setResourcesLivelihood('');
    setInhabitants([]);
    setInhabitantInput('');
    setOrganization('');
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 80);
  };

  // Standardize & compress Location Thumbnail to 9:16 Portrait (720x1280 WebP @ 0.80, preserving transparency)
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const targetW = 720;
          const targetH = 1280;
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setThumbnail(rawDataUrl);
            return;
          }
          ctx.clearRect(0, 0, targetW, targetH);
          const scale = Math.min(targetW / img.width, targetH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (targetW - drawW) / 2;
          const drawY = (targetH - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          const webpUrl = canvas.toDataURL('image/webp', 0.8);
          setThumbnail(
            webpUrl.startsWith('data:image/webp')
              ? webpUrl
              : canvas.toDataURL('image/jpeg', 0.8)
          );
        };
        img.onerror = () => setThumbnail('');
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const targetW = 1280;
          const targetH = 720;
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setBackgroundUrl(rawDataUrl);
            return;
          }
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(img, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
          setBackgroundUrl(canvas.toDataURL('image/jpeg', 0.76));
        };
        img.onerror = () => setBackgroundUrl('');
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
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setCustomIcon(rawDataUrl);
            return;
          }
          const scale = Math.max(128 / img.width, 128 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
          setCustomIcon(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => setCustomIcon('');
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const ensureTagStubExists = (
    rawTitle: string,
    category: string,
    templateType: string,
    tagTypeLabel: string
  ) => {
    const clean = rawTitle.trim();
    if (!clean) return;
    const exists = articles.some((a) => a.title.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      onCreateStubTagArticle({
        title: clean,
        category,
        templateType,
        tagTypeLabel
      });
    }
  };

  const handleAddInhabitantTag = (rawTag: string) => {
    const clean = rawTag.trim();
    if (!clean) return;
    if (!inhabitants.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setInhabitants((prev) => [...prev, clean]);
    }
    ensureTagStubExists(clean, 'Species', 'Species / Race', 'Spesies');
    setInhabitantInput('');
    setInhabitantDropdownOpen(false);
  };

  const handleRemoveInhabitantTag = (tagToRemove: string) => {
    setInhabitants((prev) => prev.filter((i) => i !== tagToRemove));
  };

  const handleSaveLocationSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = locName.trim() || `Location ${locationList.length + 1}`;
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    if (cosmicClassification.trim()) {
      ensureTagStubExists(
        cosmicClassification.trim(),
        'Cosmics',
        'Cosmology / Plane',
        'Kosmis'
      );
    }
    inhabitants.forEach((sp) => {
      ensureTagStubExists(sp, 'Species', 'Species / Race', 'Spesies');
    });
    if (organization.trim()) {
      ensureTagStubExists(
        organization.trim(),
        'Organizations',
        'Organization / Faction',
        'Organisasi'
      );
    }

    const idToUse = editingId || `loc-${Date.now()}`;
    const locArticle: Article = {
      id: idToUse,
      worldId: activeWorld.id,
      title: finalName,
      aliases: [],
      templateType: 'Location - Settlement',
      category: 'Locations',
      tags: [
        'Location',
        ...(cosmicClassification.trim() ? [cosmicClassification.trim()] : []),
        ...inhabitants,
        ...(organization.trim() ? [organization.trim()] : [])
      ],
      summary:
        articleDesc.trim().slice(0, 140) ||
        `${finalName} — ${regionStatus.trim() || 'Location'}`,
      content: articleDesc,
      secretNotes: secretDesc,
      spoilerWarning: '',
      templateValues: {
        ThumbnailUrl: thumbnail,
        BackgroundUrl: backgroundUrl,
        CustomIconUrl: customIcon,
        KlasifikasiKosmis: cosmicClassification.trim(),
        StatusWilayah: regionStatus.trim(),
        FloraFaunaKhas: floraFauna.trim(),
        SumberDaya: resourcesLivelihood.trim(),
        Penghuni: inhabitants,
        Organisasi: organization.trim()
      },
      status: 'published',
      visibility: 'private',
      linkedEntityIds: [],
      galleryCaptions: thumbnail ? [finalName] : [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: nowStamp,
          author: 'Creator',
          note: 'Saved from Location Studio',
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

    isCreatingNewRef.current = false;
    lastSyncedSigRef.current = buildLocationSignature(
      idToUse,
      finalName,
      articleDesc,
      secretDesc,
      thumbnail,
      backgroundUrl,
      customIcon,
      cosmicClassification,
      regionStatus,
      floraFauna,
      resourcesLivelihood,
      inhabitants,
      organization
    );
    onSaveLocation(locArticle);
    lastLoadedKeyRef.current = `${idToUse}:${historyRevision}`;
    setEditingId(idToUse);
    onSelectLocation(idToUse);
    setSavedBanner(`Lokasi "${finalName}" tersimpan otomatis (Auto-Saved)`);
  };

  // Automatic real-time save on any Location field change (triggers ONLY on local form edits)
  useEffect(() => {
    if (isHydratingRef.current) return;
    const hasAnyContent = Boolean(
      locName.trim() ||
        thumbnail ||
        backgroundUrl ||
        customIcon ||
        articleDesc.trim() ||
        secretDesc.trim() ||
        cosmicClassification.trim() ||
        regionStatus.trim() ||
        floraFauna.trim() ||
        resourcesLivelihood.trim() ||
        inhabitants.length > 0 ||
        organization.trim()
    );
    if (!editingId && !hasAnyContent) return;

    const existing = editingId ? locationList.find((l) => l.id === editingId) : null;
    const effectiveTitle =
      locName.trim() || existing?.title || `Location ${locationList.length + 1}`;
    const localSig = buildLocationSignature(
      editingId || '',
      effectiveTitle,
      articleDesc,
      secretDesc,
      thumbnail,
      backgroundUrl,
      customIcon,
      cosmicClassification,
      regionStatus,
      floraFauna,
      resourcesLivelihood,
      inhabitants,
      organization
    );

    if (editingId && localSig === lastSyncedSigRef.current) {
      return;
    }

    if (
      existing &&
      existing.title === effectiveTitle &&
      (existing.content || '') === articleDesc &&
      (existing.secretNotes || '') === secretDesc &&
      String(existing.templateValues?.ThumbnailUrl || '') === thumbnail &&
      String(existing.templateValues?.BackgroundUrl || '') === backgroundUrl &&
      String(existing.templateValues?.CustomIconUrl || '') === customIcon &&
      String(existing.templateValues?.KlasifikasiKosmis || '') === cosmicClassification.trim() &&
      String(existing.templateValues?.StatusWilayah || '') === regionStatus.trim() &&
      String(existing.templateValues?.FloraFaunaKhas || '') === floraFauna.trim() &&
      String(existing.templateValues?.SumberDaya || '') === resourcesLivelihood.trim() &&
      JSON.stringify(existing.templateValues?.Penghuni || []) === JSON.stringify(inhabitants) &&
      String(existing.templateValues?.Organisasi || '') === organization.trim()
    ) {
      lastSyncedSigRef.current = localSig;
      return;
    }

    const timer = window.setTimeout(() => {
      if (isHydratingRef.current) return;
      const idToUse = editingId || `loc-${Date.now()}`;
      const finalName =
        locName.trim() || existing?.title || `Location ${locationList.length + 1}`;
      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

      const locArticle: Article = {
        id: idToUse,
        worldId: activeWorld.id,
        title: finalName,
        aliases: [],
        templateType: 'Location - Settlement',
        category: 'Locations',
        tags: [
          'Location',
          ...(cosmicClassification.trim() ? [cosmicClassification.trim()] : []),
          ...inhabitants,
          ...(organization.trim() ? [organization.trim()] : [])
        ],
        summary:
          articleDesc.trim().slice(0, 140) ||
          `${finalName} — ${regionStatus.trim() || 'Location'}`,
        content: articleDesc,
        secretNotes: secretDesc,
        spoilerWarning: '',
        templateValues: {
          ThumbnailUrl: thumbnail,
          BackgroundUrl: backgroundUrl,
          CustomIconUrl: customIcon,
          KlasifikasiKosmis: cosmicClassification.trim(),
          StatusWilayah: regionStatus.trim(),
          FloraFaunaKhas: floraFauna.trim(),
          SumberDaya: resourcesLivelihood.trim(),
          Penghuni: inhabitants,
          Organisasi: organization.trim()
        },
        status: 'published',
        visibility: 'private',
        linkedEntityIds: [],
        galleryCaptions: thumbnail ? [finalName] : [],
        versions: [
          {
            id: `v-${Date.now()}`,
            timestamp: nowStamp,
            author: 'Creator',
            note: 'Auto-saved from Location Studio',
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

      isCreatingNewRef.current = false;
      lastSyncedSigRef.current = buildLocationSignature(
        idToUse,
        finalName,
        articleDesc,
        secretDesc,
        thumbnail,
        backgroundUrl,
        customIcon,
        cosmicClassification,
        regionStatus,
        floraFauna,
        resourcesLivelihood,
        inhabitants,
        organization
      );
      lastLoadedKeyRef.current = `${idToUse}:${historyRevision}`;
      onSaveLocation(locArticle);
      if (!editingId) {
        setEditingId(idToUse);
        onSelectLocation(idToUse);
      }
      setSavedBanner('Auto-Saved · Ctrl+Z Undo · Ctrl+Shift+Z Redo');
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    locName,
    thumbnail,
    backgroundUrl,
    customIcon,
    articleDesc,
    secretDesc,
    cosmicClassification,
    regionStatus,
    floraFauna,
    resourcesLivelihood,
    inhabitants,
    organization,
    editingId
  ]);

  return (
    <div
      style={
        zoomResidueActive
          ? {
              filter: 'url(#location-arrival-depth-blur)',
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
        filterId="location-arrival-depth-blur"
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
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />

      {/* ================================================================== */}
      {/* AUTOMATIC 50% OPACITY BACKGROUND IMAGE LAYER                       */}
      {/* Only visible when Fullscreen is active, with smooth fade transition*/}
      {/* ================================================================== */}
      {backgroundUrl && (
        <div
          className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-in-out ${
            isFullscreen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={backgroundUrl}
            alt="Location Background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f2f4f9]/85 via-transparent to-[#f2f4f9]/45" />
        </div>
      )}

      {/* ================================================================== */}
      {/* LEFT PANEL: LOCATION LIST                                          */}
      {/* Keeps w-72 space so thumbnail never shifts; animates list sliding  */}
      {/* left when Fullscreen is active (read-only spacer in Fullscreen)    */}
      {/* ================================================================== */}
      <div className="relative z-10 w-full lg:w-72 shrink-0 h-full min-h-0 overflow-hidden">
        {/* Sliding Location List Panel */}
        <div
          className={`w-full h-full bg-gradient-to-b from-[#879fd0] via-[#7b93c4] to-[#6e84b5] border-r border-[#cbd3e6] lg:rounded-r-[34px] p-5 flex flex-col justify-between shadow-[0_12px_32px_rgba(115,139,189,0.25)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isFullscreen
              ? '-translate-x-[110%] opacity-0 pointer-events-none'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="flex-1 min-h-0 flex flex-col space-y-4">
            <div className="shrink-0 flex items-center justify-between gap-2 px-1">
              <h2 className="text-xl font-bold text-white tracking-wide drop-shadow-sm">
                Location List
              </h2>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-white/60 text-white transition shadow-sm"
                title="Aktifkan Mode Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* "+ New Location" Active Pill Button */}
            <button
              type="button"
              onClick={handleResetNewLocation}
              className={`shrink-0 w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-left transition-all ${
                !editingId
                  ? 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_16px_rgba(73,74,82,0.28)]'
                  : 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] shadow-sm'
              }`}
            >
              <span
                onClick={(ev) => {
                  ev.stopPropagation();
                  customIconInputRef.current?.click();
                }}
                className={`w-6 h-8 rounded-full border border-dashed flex flex-col items-center justify-center shrink-0 overflow-hidden ${
                  !editingId
                    ? 'border-white/90 hover:bg-white/10 text-white'
                    : 'border-[#6d7696] hover:bg-[#edf1fa] text-[#181b26]'
                }`}
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
              <span className="text-base font-medium truncate">New Location</span>
            </button>

            {/* Created Locations List */}
            <div className="flex-1 min-h-0 space-y-2 pt-2 overflow-y-auto pr-1">
              {locationList.map((loc) => {
                const isSelected = editingId === loc.id;
                const locIcon = String(
                  loc.templateValues?.CustomIconUrl || loc.templateValues?.ThumbnailUrl || ''
                );
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      isCreatingNewRef.current = false;
                      lastSyncedSigRef.current = '';
                      setEditingId(loc.id);
                      onSelectLocation(loc.id);
                    }}
                    className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6d7696] text-white font-semibold border border-white/75 shadow-[0_6px_16px_rgba(73,74,82,0.28)]'
                        : 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {locIcon && locIcon.startsWith('data:image') ? (
                        <img
                          src={locIcon}
                          alt={loc.title}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#8da7db]"
                        />
                      ) : (
                        <img
                          src="/assets/icons/location.png"
                          alt=""
                          className="w-6 h-6 object-contain shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm truncate">{loc.title}</div>
                        {loc.templateValues?.KlasifikasiKosmis && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-white/85' : 'text-[#52586e]'
                            }`}
                          >
                            {String(loc.templateValues.KlasifikasiKosmis)}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDeleteLocation(loc.id);
                        if (editingId === loc.id) handleResetNewLocation();
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity ${
                        isSelected
                          ? 'hover:bg-rose-500/30 text-white'
                          : 'hover:bg-rose-100 text-rose-600'
                      }`}
                      title="Hapus Lokasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 pt-4 border-t border-white/35 text-[11px] text-white/90 px-1">
            Total Lokasi: <strong className="text-white">{locationList.length}</strong>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT AREA (Normal Mode vs Fullscreen Mode)                 */}
      {/* Fitted to visible frame; only Article / Paragraph column scrolls   */}
      {/* ================================================================== */}
      <div className="relative z-10 flex-1 h-full min-h-0 px-6 sm:px-8 py-4 sm:py-5 flex flex-col overflow-hidden">
        {/* Top Action Bar: Return to Universe Line, In-Page Search in Fullscreen, Background Controls only in Edit Mode */}
        <div className="shrink-0 w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5 mb-2">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[220px]">
            {returnToUniverseLine && (
              <button
                type="button"
                onClick={returnToUniverseLine.onReturn}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#edf1fa] text-[#181b26] border border-[#cbd3e6] text-xs font-semibold transition shadow-sm shrink-0 cursor-pointer group"
                title={`Kembali ke halaman ${returnToUniverseLine.label}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#5b74a8] group-hover:-translate-x-0.5 transition-transform" />
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

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* Background controls are ONLY accessible in Normal (Edit) Mode; nothing is editable in Fullscreen */}
            {!isFullscreen && (
              <div className="flex flex-wrap items-center gap-2">
                {backgroundUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => bgInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#edf1fa] border border-[#cbd3e6] text-xs font-medium text-[#181b26] transition shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#5b74a8]" />
                      <span>Ganti Background (Fullscreen 50%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackgroundUrl('')}
                      className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs text-rose-700 font-medium transition"
                    >
                      Hapus Background
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#edf1fa] border border-dashed border-[#8da7db] text-xs font-medium text-[#181b26] transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#5b74a8]" />
                    <span>Add Background (Opsional)</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition shadow-sm ${
                isFullscreen
                  ? 'bg-[#6d7696] text-white border-[#6d7696] shadow-[0_4px_14px_rgba(109,118,150,0.35)]'
                  : 'bg-white hover:bg-[#edf1fa] text-[#181b26] border-[#cbd3e6]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Keluar Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#5b74a8]" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Row: Fixed Top Anchor & Fitted to Frame so Thumbnail NEVER moves or scrolls */}
        <div
          style={{ borderStyle: 'none' }}
          className="flex-1 min-h-0 flex flex-col xl:flex-row items-center xl:items-stretch justify-center gap-8 max-w-6xl mx-auto w-full pt-1 border-none overflow-hidden"
        >
          {/* CENTER COLUMN: 1080x1920 px (9:16 Portrait) Thumbnail (Fitted to available frame; never scrolls; read-only in Fullscreen) */}
          <div className="w-full max-w-[300px] shrink-0 h-full min-h-0 flex flex-col justify-start gap-3 mt-0.5 z-20">
            <div
              onClick={() => {
                if (!isFullscreen) thumbInputRef.current?.click();
              }}
              className={`h-[calc(100%-3.25rem)] ${
                isFullscreen ? 'max-h-[520px]' : 'max-h-[480px]'
              } min-h-[240px] aspect-[9/16] mx-auto rounded-[26px] transition-all duration-500 flex flex-col items-center justify-center relative group ${
                isFullscreen ? 'cursor-default' : 'cursor-pointer'
              } ${
                thumbnail
                  ? 'bg-transparent border-0 overflow-visible'
                  : isFullscreen
                  ? 'bg-gradient-to-br from-[#879fd0] via-[#7b93c4] to-[#738bbd] border border-white/60 pointer-events-none overflow-hidden shadow-md'
                  : 'bg-gradient-to-br from-[#879fd0] via-[#7b93c4] to-[#738bbd] border border-dashed border-white/75 hover:border-white shadow-[0_12px_30px_rgba(115,139,189,0.28)] overflow-hidden'
              }`}
            >
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt={locName || 'Location Thumbnail (1080x1920)'}
                    className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(73,74,82,0.35)] transition-transform duration-500 scale-100"
                    onError={() => {
                      setThumbnail('');
                    }}
                  />
                  {!isFullscreen && (
                    <div className="absolute inset-0 bg-[#181b26]/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-30 rounded-[26px]">
                      <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#cbd3e6] text-xs font-semibold text-[#181b26] shadow">
                        Ganti Thumbnail (1080×1920 px)
                      </span>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setThumbnail('');
                        }}
                        className="px-3 py-1 rounded-full bg-rose-600 text-xs text-white font-medium shadow"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </>
              ) : !isFullscreen ? (
                <div className="text-center space-y-2.5 select-none px-4">
                  <Plus className="w-12 h-12 text-white mx-auto stroke-[2.5] group-hover:scale-105 transition-transform drop-shadow-sm" />
                  <div className="text-sm sm:text-base font-semibold text-white tracking-wide drop-shadow-sm">
                    Add Thumbnail (Opsional)
                  </div>
                  <div className="text-[11px] font-mono text-white/90">
                    1080 × 1920 px
                  </div>
                </div>
              ) : (
                <img
                  src={customIcon || '/assets/icons/location.png'}
                  alt={locName || 'Location'}
                  className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(73,74,82,0.35)]"
                />
              )}
            </div>

            <div
              className={`shrink-0 rounded-2xl border border-[#dce3f2] bg-white px-4 py-2.5 shadow-sm transition-all duration-500 ${
                isFullscreen
                  ? 'opacity-0 translate-y-2 pointer-events-none select-none'
                  : 'opacity-100 translate-y-0'
              }`}
            >
              <input
                type="text"
                disabled={isFullscreen}
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="Nama Lokasi"
                className="w-full bg-transparent text-xs font-bold text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT AREA (Overlapping Grid Cell for Smooth Choreography):      */}
          {/* - Article Form slides out to the right (`translate-x-[115%]`)    */}
          {/* - Converted Paragraphs slowly fade in after delay (`delay-300`)  */}
          {/* - Independently scrollable inside the frame                      */}
          {/* ================================================================ */}
          <div className="w-full max-w-xl flex-1 h-full min-h-0 grid grid-cols-1 grid-rows-1 items-stretch relative overflow-hidden">
            {/* 1. FULLSCREEN CONVERTED PARAGRAPHS (No column/box; fades in slowly after Article column slides right) */}
            <div
              className={`col-start-1 row-start-1 w-full h-full max-h-full overflow-y-auto xl:pl-12 pr-2 pt-2 pb-6 space-y-4 text-[#181b26] font-serif drop-shadow-[0_1px_6px_rgba(255,255,255,0.85)] transition-all ease-out ${
                isFullscreen
                  ? 'opacity-100 translate-y-0 duration-700 delay-300 pointer-events-auto'
                  : 'opacity-0 translate-y-4 duration-200 delay-0 pointer-events-none select-none'
              }`}
            >
              {locName.trim() && (
                <h1 className="text-2xl sm:text-3xl font-bold text-[#181b26] tracking-wide">
                  {locName.trim()}
                </h1>
              )}

              {articleDesc.trim() && (
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {articleDesc}
                </p>
              )}

              {secretDesc.trim() && (
                <p className="text-sm sm:text-base text-[#5b6485] italic leading-relaxed whitespace-pre-line">
                  {secretDesc}
                </p>
              )}

              {(regionStatus.trim() ||
                cosmicClassification.trim() ||
                organization.trim()) && (
                <p className="text-sm sm:text-base leading-relaxed">
                  {locName.trim() ? <strong>{locName.trim()}</strong> : 'Lokasi ini'}
                  {regionStatus.trim() ? ` berstatus sebagai ${regionStatus.trim()}` : ''}
                  {cosmicClassification.trim() ? (
                    <>
                      {' '}dalam klasifikasi kosmis{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const found = cosmicArticles.find(
                            (a) =>
                              a.title.toLowerCase() === cosmicClassification.trim().toLowerCase()
                          );
                          if (found) onJumpToTagArticle(found.id, 'Cosmics');
                        }}
                        className="text-[#4b67a1] font-semibold hover:underline"
                      >
                        {cosmicClassification.trim()}
                      </button>
                    </>
                  ) : null}
                  {organization.trim() ? (
                    <>
                      {' '}dan berafiliasi dengan organisasi{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const found = organizationArticles.find(
                            (a) => a.title.toLowerCase() === organization.trim().toLowerCase()
                          );
                          if (found) onJumpToTagArticle(found.id, 'Organizations');
                        }}
                        className="text-[#4b67a1] font-semibold hover:underline"
                      >
                        {organization.trim()}
                      </button>
                    </>
                  ) : null}
                  .
                </p>
              )}

              {(floraFauna.trim() || resourcesLivelihood.trim()) && (
                <p className="text-sm sm:text-base leading-relaxed">
                  {floraFauna.trim()
                    ? `Wilayah ini dikenal dengan flora dan fauna khas berupa ${floraFauna.trim()}. `
                    : ''}
                  {resourcesLivelihood.trim()
                    ? `Sumber daya serta mata pencaharian utamanya meliputi ${resourcesLivelihood.trim()}.`
                    : ''}
                </p>
              )}

              {inhabitants.length > 0 && (
                <p className="text-sm sm:text-base leading-relaxed">
                  Penghuni yang mendiami wilayah ini antara lain{' '}
                  {inhabitants.map((sp, idx) => {
                    const linkedArt = speciesArticles.find(
                      (a) => a.title.toLowerCase() === sp.toLowerCase()
                    );
                    return (
                      <React.Fragment key={sp}>
                        {idx > 0 && ', '}
                        <button
                          type="button"
                          onClick={() => {
                            if (linkedArt) onJumpToTagArticle(linkedArt.id, 'Species');
                          }}
                          className="text-[#4b67a1] font-semibold hover:underline"
                        >
                          {sp}
                        </button>
                      </React.Fragment>
                    );
                  })}
                  .
                </p>
              )}
            </div>

            {/* 2. NORMAL MODE: Rounded White Form Container (Slides out to the right when entering Fullscreen; scrolls internally) */}
            <form
              onSubmit={handleSaveLocationSubmit}
              className={`col-start-1 row-start-1 w-full h-full max-h-full overflow-y-auto rounded-[28px] bg-white/95 backdrop-blur-md border border-[#dce3f2] px-6 sm:px-8 py-5 space-y-4 shadow-[0_14px_36px_rgba(115,139,189,0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isFullscreen
                  ? 'translate-x-[115%] opacity-0 pointer-events-none'
                  : 'translate-x-0 opacity-100 delay-100 pointer-events-auto'
              }`}
            >
              {/* 1. Article & Secret */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#181b26]">Article &amp; Secret</div>
                <textarea
                  rows={2}
                  value={articleDesc}
                  onChange={(e) => setArticleDesc(e.target.value)}
                  placeholder="(deskripsi)"
                  className="w-full bg-transparent text-xs text-[#252a3a] placeholder:text-[#7c849b] focus:outline-none resize-none leading-relaxed"
                />
                <div className="text-xs font-bold text-[#181b26] pt-0.5">Secret</div>
                <textarea
                  rows={2}
                  value={secretDesc}
                  onChange={(e) => setSecretDesc(e.target.value)}
                  placeholder="(hanya yang diizinkan oleh admin dunia ini untuk mengakses rahasia)"
                  className="w-full bg-transparent text-xs text-[#252a3a] placeholder:text-[#7c849b] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* 2. Klasifikasi Kosmis */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-[#181b26]">
                  Klasifikasi Kosmis
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={cosmicClassification}
                    onFocus={() => setCosmicDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCosmicDropdownOpen(false), 180)}
                    onChange={(e) => setCosmicClassification(e.target.value)}
                    placeholder="(Link ke kosmis yang sudah dibuat, atau buat kosmis baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCosmicDropdownOpen((o) => !o)}
                    className="text-[#52586e] hover:text-[#181b26] text-xs shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {cosmicDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-44 overflow-y-auto space-y-1">
                    {cosmicArticles.map((cos) => (
                      <div
                        key={cos.id}
                        onMouseDown={() => {
                          setCosmicClassification(cos.title);
                          setCosmicDropdownOpen(false);
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                      >
                        <span>{cos.title}</span>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            onJumpToTagArticle(cos.id, 'Cosmics');
                          }}
                          className="text-[10px] text-[#5b74a8] font-medium hover:underline flex items-center gap-1"
                        >
                          <span>Lengkapi di Cosmics</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {cosmicClassification.trim() &&
                      !cosmicArticles.some(
                        (c) =>
                          c.title.toLowerCase() === cosmicClassification.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onMouseDown={() => {
                            ensureTagStubExists(
                              cosmicClassification.trim(),
                              'Cosmics',
                              'Cosmology / Plane',
                              'Kosmis'
                            );
                            setCosmicDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                        >
                          + Buat judul kosmis baru: &ldquo;{cosmicClassification.trim()}&rdquo; (Lengkapi di menu Cosmics)
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* 3. Status Wilayah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#181b26]">Status Wllayah</label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5">
                  <input
                    type="text"
                    value={regionStatus}
                    onChange={(e) => setRegionStatus(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Flora & fauna khas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#181b26]">
                  Flora &amp; fauna khas
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5">
                  <input
                    type="text"
                    value={floraFauna}
                    onChange={(e) => setFloraFauna(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. Sumber Daya & Mata Pencaharian */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#181b26]">
                  Sumber Daya &amp; Mata Pencaharian
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5">
                  <input
                    type="text"
                    value={resourcesLivelihood}
                    onChange={(e) => setResourcesLivelihood(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Penghuni */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-[#181b26]">Penghuni</label>

                {inhabitants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {inhabitants.map((sp) => {
                      const linkedArt = speciesArticles.find(
                        (a) => a.title.toLowerCase() === sp.toLowerCase()
                      );
                      return (
                        <span
                          key={sp}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#edf1fa] border border-[#cbd3e6] text-[11px] text-[#181b26] font-medium"
                        >
                          <span>{sp}</span>
                          {linkedArt && (
                            <button
                              type="button"
                              onClick={() => onJumpToTagArticle(linkedArt.id, 'Species')}
                              className="text-[#5b74a8] hover:underline"
                              title="Lengkapi di Species"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveInhabitantTag(sp)}
                            className="text-[#52586e] hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={inhabitantInput}
                    onFocus={() => setInhabitantDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setInhabitantDropdownOpen(false), 180)}
                    onChange={(e) => setInhabitantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInhabitantTag(inhabitantInput);
                      }
                    }}
                    placeholder="(Link ke daftar spesies yang sudah dibuat, atau buat spesies baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                  {inhabitantInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddInhabitantTag(inhabitantInput)}
                      className="text-[11px] text-[#5b74a8] font-semibold shrink-0"
                    >
                      + Tag
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-[#52586e]">
                  Dapat mengisi tag flora &amp; fauna lebih dari satu
                </div>

                {inhabitantDropdownOpen && (speciesArticles.length > 0 || inhabitantInput.trim()) && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-40 overflow-y-auto space-y-1">
                    {speciesArticles.map((sp) => (
                      <div
                        key={sp.id}
                        onMouseDown={() => handleAddInhabitantTag(sp.title)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                      >
                        <span>{sp.title}</span>
                        <span className="text-[10px] text-[#5b74a8] font-medium">+ Pilih Spesies</span>
                      </div>
                    ))}
                    {inhabitantInput.trim() && (
                      <button
                        type="button"
                        onMouseDown={() => handleAddInhabitantTag(inhabitantInput)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                      >
                        + Buat judul spesies baru: &ldquo;{inhabitantInput.trim()}&rdquo; (Lengkapi di menu Species)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 7. Organisasi afiliasi */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-[#181b26]">
                  Organisasi afiliasi
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={organization}
                    onFocus={() => setOrgDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setOrgDropdownOpen(false), 180)}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="(Link ke daftar organisasi yang sudah dibuat, atau buat organisasi baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>

                {orgDropdownOpen && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-40 overflow-y-auto space-y-1">
                    {organizationArticles.map((org) => (
                      <div
                        key={org.id}
                        onMouseDown={() => {
                          setOrganization(org.title);
                          setOrgDropdownOpen(false);
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                      >
                        <span>{org.title}</span>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            onJumpToTagArticle(org.id, 'Organizations');
                          }}
                          className="text-[10px] text-[#5b74a8] font-medium hover:underline flex items-center gap-1"
                        >
                          <span>Lengkapi di Organization</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {organization.trim() &&
                      !organizationArticles.some(
                        (o) => o.title.toLowerCase() === organization.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onMouseDown={() => {
                            ensureTagStubExists(
                              organization.trim(),
                              'Organizations',
                              'Organization / Faction',
                              'Organisasi'
                            );
                            setOrgDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                        >
                          + Buat judul organisasi baru: &ldquo;{organization.trim()}&rdquo; (Lengkapi di menu Organization)
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* Submit Bar */}
              <div className="pt-3 border-t border-[#e4e9f5] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-[#52586e]">
                  {savedBanner ? (
                    <span className="text-[#5b74a8] font-semibold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {savedBanner}
                    </span>
                  ) : (
                    <span>Tag baru otomatis dibuat sebagai judul di menu masing-masing.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#6d7696] hover:bg-[#5d6685] text-white border border-[#6d7696] font-semibold text-xs transition-all shadow-[0_4px_14px_rgba(109,118,150,0.35)] cursor-pointer"
                >
                  Simpan Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
