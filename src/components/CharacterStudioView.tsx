import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  Check,
  X,
  Info,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { Article, World } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

interface CharacterStudioViewProps {
  activeWorld: World;
  articles: Article[];
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onSaveCharacter: (charArticle: Article) => void;
  onCreateStubTagArticle: (stub: {
    title: string;
    category: string;
    templateType: string;
    tagTypeLabel: string;
  }) => Article;
  onDeleteCharacter: (id: string) => void;
  onJumpToTagArticle: (articleId: string, category: string) => void;
  initialFullscreen?: boolean;
  onFullscreenConsumed?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  inPageSearchNode?: React.ReactNode;
  returnToUniverseLine?: {
    label: string;
    iconSrc?: string;
    onReturn: () => void;
  } | null;
  historyRevision?: number;
}

type TooltipFieldId = 'kondisi' | 'mata' | 'rambut' | 'kulit' | null;

const FIELD_TOOLTIPS: Record<Exclude<TooltipFieldId, null>, { title: string; info: string }> = {
  kondisi: {
    title: 'Kondisi',
    info: 'Mutasi, penyakit, atau kondisi lain apa yang mereka miliki?'
  },
  mata: {
    title: 'Mata',
    info: 'Warna, ukuran, bentuk, keterbukaan'
  },
  rambut: {
    title: 'Rambut',
    info: 'Warna, panjang, gaya, kualitas, tekstur'
  },
  kulit: {
    title: 'Kulit',
    info: 'Warna, ukuran, tekstur, noda'
  }
};

export const CharacterStudioView: React.FC<CharacterStudioViewProps> = ({
  activeWorld,
  articles,
  selectedCharacterId,
  onSelectCharacter,
  onSaveCharacter,
  onCreateStubTagArticle,
  onDeleteCharacter,
  onJumpToTagArticle,
  initialFullscreen = false,
  onFullscreenConsumed,
  onFullscreenChange,
  inPageSearchNode,
  returnToUniverseLine,
  historyRevision = 0
}) => {
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const lastLoadedKeyRef = useRef<string>('');
  const isHydratingRef = useRef<boolean>(false);

  // Fullscreen Mode State & 0.5s Residual Zoom Arrival State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen);
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

  // All Character articles in the current world
  const characterList = useMemo(
    () =>
      articles.filter(
        (a) =>
          (a.worldId === activeWorld.id || activeWorld.id === 'world-empty') &&
          (a.templateType === 'Character' || a.category === 'Characters')
      ),
    [articles, activeWorld.id]
  );

  // Existing Location, Species, Condition, and Organization articles
  const locationArticles = useMemo(
    () =>
      articles.filter(
        (a) => a.category === 'Locations' || a.templateType.startsWith('Location')
      ),
    [articles]
  );

  const speciesArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.templateType === 'Species / Race' ||
          a.category === 'Species' ||
          a.tags.includes('Spesies')
      ),
    [articles]
  );

  const conditionArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.templateType === 'Medical Condition' ||
          a.category === 'Conditions' ||
          a.tags.includes('Kondisi')
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

  // Active Character Form State
  const [editingId, setEditingId] = useState<string>('');
  const [charName, setCharName] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [articleDesc, setArticleDesc] = useState<string>('');
  const [secretDesc, setSecretDesc] = useState<string>('');

  // Linked / Tag Fields
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState<boolean>(false);

  const [species, setSpecies] = useState<string>('');
  const [speciesDropdownOpen, setSpeciesDropdownOpen] = useState<boolean>(false);

  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState<string>('');
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState<boolean>(false);

  const [gender, setGender] = useState<string>('');
  const [eyes, setEyes] = useState<string>('');
  const [hair, setHair] = useState<string>('');
  const [skin, setSkin] = useState<string>('');
  const [heightWeight, setHeightWeight] = useState<string>('');

  const [organization, setOrganization] = useState<string>('');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState<boolean>(false);

  const [activeTooltip, setActiveTooltip] = useState<TooltipFieldId>(null);
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

  // Load selected character when clicked from Character List or restored via Undo/Redo
  useEffect(() => {
    if (!selectedCharacterId) return;
    const syncKey = `${selectedCharacterId}:${historyRevision}`;
    if (lastLoadedKeyRef.current === syncKey) return;
    const found = characterList.find((c) => c.id === selectedCharacterId);
    if (!found) return;
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = syncKey;
    setEditingId(found.id);
    setCharName(found.title);
    setArticleDesc(found.content || '');
    setSecretDesc(found.secretNotes || '');
    setThumbnail(sanitizeImageSrc(found.templateValues?.ThumbnailUrl));
    setBackgroundUrl(sanitizeImageSrc(found.templateValues?.BackgroundUrl));
    setCurrentLocation(
      String(found.templateValues?.['Tempat Tinggal'] || found.templateValues?.LokasiSaatIni || '')
    );
    setSpecies(
      String(found.templateValues?.['Spesies / Ras'] || found.templateValues?.Spesies || '')
    );
    const rawCond = found.templateValues?.Kondisi;
    if (Array.isArray(rawCond)) {
      setConditions(rawCond);
    } else if (typeof rawCond === 'string' && rawCond.trim()) {
      setConditions(
        rawCond
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else {
      setConditions([]);
    }
    setGender(String(found.templateValues?.Gender || ''));
    setEyes(String(found.templateValues?.Mata || ''));
    setHair(String(found.templateValues?.Rambut || ''));
    setSkin(String(found.templateValues?.Kulit || ''));
    setHeightWeight(
      String(found.templateValues?.['Tinggi / Berat'] || found.templateValues?.TinggiBerat || '')
    );
    setOrganization(
      String(
        found.templateValues?.['Afiliasi / Organisasi'] || found.templateValues?.Organisasi || ''
      )
    );
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 150);
  }, [selectedCharacterId, characterList, historyRevision]);

  const handleResetNewCharacter = () => {
    isHydratingRef.current = true;
    lastLoadedKeyRef.current = `new:${historyRevision}`;
    setEditingId('');
    onSelectCharacter('');
    setCharName('');
    setThumbnail('');
    setBackgroundUrl('');
    setArticleDesc('');
    setSecretDesc('');
    setCurrentLocation('');
    setSpecies('');
    setConditions([]);
    setConditionInput('');
    setGender('');
    setEyes('');
    setHair('');
    setSkin('');
    setHeightWeight('');
    setOrganization('');
    setActiveTooltip(null);
    window.setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  };

  // Standardize & compress Character Thumbnail to 9:16 Portrait (720x1280 WebP @ 0.80, preserving transparency)
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

  const handleAddConditionTag = (rawTag: string) => {
    const clean = rawTag.trim();
    if (!clean) return;
    if (!conditions.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      setConditions((prev) => [...prev, clean]);
    }
    ensureTagStubExists(clean, 'Conditions', 'Medical Condition', 'Kondisi');
    setConditionInput('');
    setConditionDropdownOpen(false);
  };

  const handleRemoveConditionTag = (tagToRemove: string) => {
    setConditions((prev) => prev.filter((c) => c !== tagToRemove));
  };

  const handleSaveCharacterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = charName.trim() || `Character ${characterList.length + 1}`;
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    if (currentLocation.trim()) {
      ensureTagStubExists(
        currentLocation.trim(),
        'Locations',
        'Location - Settlement',
        'Lokasi'
      );
    }
    if (species.trim()) {
      ensureTagStubExists(species.trim(), 'Species', 'Species / Race', 'Spesies');
    }
    conditions.forEach((cond) => {
      ensureTagStubExists(cond, 'Conditions', 'Medical Condition', 'Kondisi');
    });
    if (organization.trim()) {
      ensureTagStubExists(
        organization.trim(),
        'Organizations',
        'Organization / Faction',
        'Organisasi'
      );
    }

    const idToUse = editingId || `char-${Date.now()}`;
    const linkedIds = articles
      .filter((a) => {
        const t = a.title.toLowerCase();
        return (
          t === currentLocation.trim().toLowerCase() ||
          t === species.trim().toLowerCase() ||
          t === organization.trim().toLowerCase() ||
          conditions.some((c) => c.toLowerCase() === t)
        );
      })
      .map((a) => a.id);

    const charArticle: Article = {
      id: idToUse,
      worldId: activeWorld.id,
      title: finalName,
      aliases: [],
      templateType: 'Character',
      category: 'Characters',
      tags: [
        'Character',
        ...(species.trim() ? [species.trim()] : []),
        ...conditions,
        ...(organization.trim() ? [organization.trim()] : [])
      ],
      summary:
        articleDesc.trim().slice(0, 140) ||
        `${finalName} — ${species.trim() || 'Character'} (${
          currentLocation.trim() || 'Unknown Location'
        })`,
      content: articleDesc,
      secretNotes: secretDesc,
      spoilerWarning: '',
      templateValues: {
        'Nama Lengkap': finalName,
        ThumbnailUrl: thumbnail,
        BackgroundUrl: backgroundUrl,
        LokasiSaatIni: currentLocation.trim(),
        'Tempat Tinggal': currentLocation.trim(),
        Spesies: species.trim(),
        'Spesies / Ras': species.trim(),
        Kondisi: conditions,
        Gender: gender.trim(),
        Mata: eyes.trim(),
        Rambut: hair.trim(),
        Kulit: skin.trim(),
        TinggiBerat: heightWeight.trim(),
        'Tinggi / Berat': heightWeight.trim(),
        Organisasi: organization.trim(),
        'Afiliasi / Organisasi': organization.trim()
      },
      status: 'published',
      visibility: 'private',
      linkedEntityIds: linkedIds,
      galleryCaptions: thumbnail ? [finalName] : [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: nowStamp,
          author: 'Creator',
          note: 'Saved from Character Studio',
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

    onSaveCharacter(charArticle);
    lastLoadedKeyRef.current = `${idToUse}:${historyRevision}`;
    setEditingId(idToUse);
    onSelectCharacter(idToUse);
    setSavedBanner(`Karakter "${finalName}" tersimpan otomatis (Auto-Saved)`);
  };

  // Automatic real-time save on any Character field change
  useEffect(() => {
    if (isHydratingRef.current) return;
    const hasAnyContent = Boolean(
      charName.trim() ||
        thumbnail ||
        backgroundUrl ||
        articleDesc.trim() ||
        secretDesc.trim() ||
        currentLocation.trim() ||
        species.trim() ||
        conditions.length > 0 ||
        gender.trim() ||
        eyes.trim() ||
        hair.trim() ||
        skin.trim() ||
        heightWeight.trim() ||
        organization.trim()
    );
    if (!editingId && !hasAnyContent) return;

    const existing = editingId ? characterList.find((c) => c.id === editingId) : null;
    if (
      existing &&
      existing.title === (charName.trim() || existing.title) &&
      (existing.content || '') === articleDesc &&
      (existing.secretNotes || '') === secretDesc &&
      String(existing.templateValues?.ThumbnailUrl || '') === thumbnail &&
      String(existing.templateValues?.BackgroundUrl || '') === backgroundUrl &&
      String(existing.templateValues?.LokasiSaatIni || '') === currentLocation.trim() &&
      String(existing.templateValues?.Spesies || '') === species.trim() &&
      JSON.stringify(existing.templateValues?.Kondisi || []) === JSON.stringify(conditions) &&
      String(existing.templateValues?.Gender || '') === gender.trim() &&
      String(existing.templateValues?.Mata || '') === eyes.trim() &&
      String(existing.templateValues?.Rambut || '') === hair.trim() &&
      String(existing.templateValues?.Kulit || '') === skin.trim() &&
      String(existing.templateValues?.TinggiBerat || '') === heightWeight.trim() &&
      String(existing.templateValues?.Organisasi || '') === organization.trim()
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const idToUse = editingId || `char-${Date.now()}`;
      const finalName =
        charName.trim() || existing?.title || `Character ${characterList.length + 1}`;
      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

      const linkedIds = articles
        .filter((a) => {
          const t = a.title.toLowerCase();
          return (
            t === currentLocation.trim().toLowerCase() ||
            t === species.trim().toLowerCase() ||
            t === organization.trim().toLowerCase() ||
            conditions.some((c) => c.toLowerCase() === t)
          );
        })
        .map((a) => a.id);

      const charArticle: Article = {
        id: idToUse,
        worldId: activeWorld.id,
        title: finalName,
        aliases: [],
        templateType: 'Character',
        category: 'Characters',
        tags: [
          'Character',
          ...(species.trim() ? [species.trim()] : []),
          ...conditions,
          ...(organization.trim() ? [organization.trim()] : [])
        ],
        summary:
          articleDesc.trim().slice(0, 140) ||
          `${finalName} — ${species.trim() || 'Character'} (${
            currentLocation.trim() || 'Unknown Location'
          })`,
        content: articleDesc,
        secretNotes: secretDesc,
        spoilerWarning: '',
        templateValues: {
          'Nama Lengkap': finalName,
          ThumbnailUrl: thumbnail,
          BackgroundUrl: backgroundUrl,
          LokasiSaatIni: currentLocation.trim(),
          'Tempat Tinggal': currentLocation.trim(),
          Spesies: species.trim(),
          'Spesies / Ras': species.trim(),
          Kondisi: conditions,
          Gender: gender.trim(),
          Mata: eyes.trim(),
          Rambut: hair.trim(),
          Kulit: skin.trim(),
          TinggiBerat: heightWeight.trim(),
          'Tinggi / Berat': heightWeight.trim(),
          Organisasi: organization.trim(),
          'Afiliasi / Organisasi': organization.trim()
        },
        status: 'published',
        visibility: 'private',
        linkedEntityIds: linkedIds,
        galleryCaptions: thumbnail ? [finalName] : [],
        versions: [
          {
            id: `v-${Date.now()}`,
            timestamp: nowStamp,
            author: 'Creator',
            note: 'Auto-saved from Character Studio',
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

      lastLoadedKeyRef.current = `${idToUse}:${historyRevision}`;
      onSaveCharacter(charArticle);
      if (!editingId) {
        setEditingId(idToUse);
        onSelectCharacter(idToUse);
      }
      setSavedBanner('Auto-Saved · Ctrl+Z Undo · Ctrl+Shift+Z Redo');
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    charName,
    thumbnail,
    backgroundUrl,
    articleDesc,
    secretDesc,
    currentLocation,
    species,
    conditions,
    gender,
    eyes,
    hair,
    skin,
    heightWeight,
    organization,
    editingId,
    characterList,
    articles,
    activeWorld.id,
    historyRevision
  ]);

  return (
    <div
      style={
        zoomResidueActive
          ? {
              filter: 'url(#character-arrival-depth-blur)',
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
        filterId="character-arrival-depth-blur"
        depthScale={zoomResidueActive ? 65 : 0}
      />
      {/* Hidden File Inputs for Thumbnail & Background */}
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
            alt="Character Background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f2f4f9]/85 via-transparent to-[#f2f4f9]/45" />
        </div>
      )}

      {/* ================================================================== */}
      {/* LEFT PANEL: CHARACTER LIST                                         */}
      {/* Keeps w-72 space so thumbnail never shifts; animates list sliding  */}
      {/* left when Fullscreen is active (read-only spacer in Fullscreen)    */}
      {/* ================================================================== */}
      <div className="relative z-10 w-full lg:w-72 shrink-0 h-full min-h-0 overflow-hidden">
        {/* Sliding Character List Panel */}
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
                Character List
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

            {/* "+ New Character" Active Button */}
            <button
              type="button"
              onClick={handleResetNewCharacter}
              className={`shrink-0 w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all ${
                !editingId
                  ? 'bg-[#6d7696] text-white border border-white/75 shadow-[0_6px_16px_rgba(73,74,82,0.28)]'
                  : 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] shadow-sm'
              }`}
            >
              <img
                src="/assets/icons/character.png"
                alt=""
                className="w-6 h-6 object-contain shrink-0"
              />
              <span className="text-base font-medium truncate">New Character</span>
            </button>

            {/* Created Characters List */}
            <div className="flex-1 min-h-0 space-y-2 pt-2 overflow-y-auto pr-1">
              {characterList.map((char) => {
                const isSelected = editingId === char.id;
                const charThumb = String(char.templateValues?.ThumbnailUrl || '');
                return (
                  <div
                    key={char.id}
                    className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6d7696] text-white font-semibold border border-white/75 shadow-[0_6px_16px_rgba(73,74,82,0.28)]'
                        : 'bg-white/92 hover:bg-white text-[#181b26] border border-[#dce3f2] shadow-sm'
                    }`}
                    onClick={() => {
                      setEditingId(char.id);
                      onSelectCharacter(char.id);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {charThumb && charThumb.startsWith('data:image') ? (
                        <img
                          src={charThumb}
                          alt={char.title}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#8da7db]"
                        />
                      ) : (
                        <img
                          src="/assets/icons/character.png"
                          alt=""
                          className="w-6 h-6 object-contain shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm truncate">{char.title}</div>
                        {char.templateValues?.Spesies && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-white/85' : 'text-[#52586e]'
                            }`}
                          >
                            {String(char.templateValues.Spesies)}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDeleteCharacter(char.id);
                        if (editingId === char.id) handleResetNewCharacter();
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity ${
                        isSelected
                          ? 'hover:bg-rose-500/30 text-white'
                          : 'hover:bg-rose-100 text-rose-600'
                      }`}
                      title="Hapus Karakter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 pt-4 border-t border-white/35 text-[11px] text-white/90 px-1">
            Total Karakter: <strong className="text-white">{characterList.length}</strong>
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
          {/* CENTER COLUMN: 1080x1920 px (9:16 Portrait) Thumbnail (Fitted to available frame; never scrolls; scales up 135% in Fullscreen; read-only in Fullscreen) */}
          <div className="w-full max-w-[300px] shrink-0 h-full min-h-0 flex flex-col justify-start gap-2.5 mt-0.5 z-20">
            <div
              onClick={() => {
                if (!isFullscreen) thumbInputRef.current?.click();
              }}
              className={`h-[calc(100%-3.25rem)] max-h-[480px] min-h-[240px] aspect-[9/16] mx-auto rounded-[26px] transition-all duration-500 flex flex-col items-center justify-center relative group ${
                isFullscreen ? 'cursor-default' : 'cursor-pointer'
              } ${
                thumbnail
                  ? 'bg-transparent border-0 overflow-visible'
                  : isFullscreen
                  ? 'bg-transparent border-0 pointer-events-none'
                  : 'bg-gradient-to-br from-[#879fd0] via-[#7b93c4] to-[#738bbd] border border-dashed border-white/75 hover:border-white shadow-[0_12px_30px_rgba(115,139,189,0.28)] overflow-hidden'
              }`}
            >
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt={charName || 'Character Portrait (1080x1920)'}
                    className={`w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(73,74,82,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] origin-top ${
                      isFullscreen ? 'scale-[1.35]' : 'scale-100'
                    }`}
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
              ) : null}
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
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="Nama Karakter"
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
              {charName.trim() && (
                <h1 className="text-2xl sm:text-3xl font-bold text-[#181b26] tracking-wide">
                  {charName.trim()}
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

              {(gender.trim() ||
                species.trim() ||
                currentLocation.trim() ||
                organization.trim()) && (
                <p className="text-sm sm:text-base leading-relaxed">
                  {charName.trim() ? <strong>{charName.trim()}</strong> : 'Karakter ini'}
                  {gender.trim() ? ` adalah seorang ${gender.trim()}` : ''}
                  {species.trim() ? (
                    <>
                      {' '}dari spesies{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const found = speciesArticles.find(
                            (a) => a.title.toLowerCase() === species.trim().toLowerCase()
                          );
                          if (found) onJumpToTagArticle(found.id, 'Species');
                        }}
                        className="text-[#4b67a1] font-semibold hover:underline"
                      >
                        {species.trim()}
                      </button>
                    </>
                  ) : null}
                  {currentLocation.trim() ? (
                    <>
                      {' '}yang saat ini berada di lokasi{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const found = locationArticles.find(
                            (a) => a.title.toLowerCase() === currentLocation.trim().toLowerCase()
                          );
                          if (found) onJumpToTagArticle(found.id, 'Locations');
                        }}
                        className="text-[#4b67a1] font-semibold hover:underline"
                      >
                        {currentLocation.trim()}
                      </button>
                    </>
                  ) : null}
                  {organization.trim() ? (
                    <>
                      {' '}serta berafiliasi dengan organisasi{' '}
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

              {(eyes.trim() || hair.trim() || skin.trim() || heightWeight.trim()) && (
                <p className="text-sm sm:text-base leading-relaxed">
                  Secara fisik, ia memiliki{' '}
                  {[
                    eyes.trim() ? `mata ${eyes.trim()}` : '',
                    hair.trim() ? `rambut ${hair.trim()}` : '',
                    skin.trim() ? `kulit ${skin.trim()}` : '',
                    heightWeight.trim() ? `serta tinggi dan berat badan ${heightWeight.trim()}` : ''
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  .
                </p>
              )}

              {conditions.length > 0 && (
                <p className="text-sm sm:text-base leading-relaxed">
                  Kondisi khusus yang dimiliki meliputi{' '}
                  {conditions.map((cond, idx) => {
                    const linkedArt = conditionArticles.find(
                      (a) => a.title.toLowerCase() === cond.toLowerCase()
                    );
                    return (
                      <React.Fragment key={cond}>
                        {idx > 0 && ', '}
                        <button
                          type="button"
                          onClick={() => {
                            if (linkedArt) onJumpToTagArticle(linkedArt.id, 'Conditions');
                          }}
                          className="text-[#4b67a1] font-semibold hover:underline"
                        >
                          {cond}
                        </button>
                      </React.Fragment>
                    );
                  })}
                  .
                </p>
              )}
            </div>

            {/* 2. NORMAL MODE: Editable Form Container (Slides out to the right when entering Fullscreen; scrolls internally) */}
            <form
              onSubmit={handleSaveCharacterSubmit}
              className={`col-start-1 row-start-1 w-full h-full max-h-full overflow-y-auto rounded-[28px] bg-white/95 backdrop-blur-md border border-[#dce3f2] px-6 sm:px-8 py-5 space-y-3.5 shadow-[0_14px_36px_rgba(115,139,189,0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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

              {/* 2. Lokasi saat ini */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-[#181b26]">Lokasi saat ini</label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={currentLocation}
                    onFocus={() => setLocationDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 180)}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="(Link ke lokasi yang sudah dibuat, atau buat lokasi baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen((o) => !o)}
                    className="text-[#52586e] hover:text-[#181b26] text-xs font-sans shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {locationDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-44 overflow-y-auto space-y-1">
                    {locationArticles.map((loc) => (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                        onMouseDown={() => {
                          setCurrentLocation(loc.title);
                          setLocationDropdownOpen(false);
                        }}
                      >
                        <span>{loc.title}</span>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            onJumpToTagArticle(loc.id, 'Locations');
                          }}
                          className="text-[10px] text-[#5b74a8] font-medium hover:underline flex items-center gap-1"
                        >
                          <span>Lengkapi di Location</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {currentLocation.trim() &&
                      !locationArticles.some(
                        (l) => l.title.toLowerCase() === currentLocation.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onMouseDown={() => {
                            ensureTagStubExists(
                              currentLocation.trim(),
                              'Locations',
                              'Location - Settlement',
                              'Lokasi'
                            );
                            setLocationDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                        >
                          + Buat judul lokasi baru: &ldquo;{currentLocation.trim()}&rdquo; (Lengkapi di menu Location)
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* 3. Spesies */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-[#181b26]">Spesies</label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={species}
                    onFocus={() => setSpeciesDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setSpeciesDropdownOpen(false), 180)}
                    onChange={(e) => setSpecies(e.target.value)}
                    placeholder="(Link ke daftar spesies yang sudah dibuat, atau buat spesies baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>

                {speciesDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-40 overflow-y-auto space-y-1">
                    {speciesArticles.map((sp) => (
                      <div
                        key={sp.id}
                        onMouseDown={() => {
                          setSpecies(sp.title);
                          setSpeciesDropdownOpen(false);
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                      >
                        <span>{sp.title}</span>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            onJumpToTagArticle(sp.id, 'Species');
                          }}
                          className="text-[10px] text-[#5b74a8] font-medium hover:underline flex items-center gap-1"
                        >
                          <span>Lengkapi di Species</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {species.trim() &&
                      !speciesArticles.some(
                        (s) => s.title.toLowerCase() === species.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onMouseDown={() => {
                            ensureTagStubExists(
                              species.trim(),
                              'Species',
                              'Species / Race',
                              'Spesies'
                            );
                            setSpeciesDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                        >
                          + Buat judul spesies baru: &ldquo;{species.trim()}&rdquo; (Hanya memuat judul)
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* 4. Kondisi */}
              <div className="space-y-1 relative" onClick={() => setActiveTooltip('kondisi')}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#181b26] cursor-pointer">
                    Kondisi
                  </label>
                  <span className="text-[10px] text-[#5b74a8] flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Klik kiri untuk info ringkas
                  </span>
                </div>

                {activeTooltip === 'kondisi' && (
                  <div className="px-3 py-2 rounded-xl bg-[#edf1fa] border border-[#8da7db] text-xs text-[#181b26] flex items-center justify-between gap-2">
                    <span>
                      <strong>{FIELD_TOOLTIPS.kondisi.title} :</strong>{' '}
                      {FIELD_TOOLTIPS.kondisi.info}
                    </span>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-[#52586e] hover:text-[#181b26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {conditions.map((cond) => {
                      const linkedArt = conditionArticles.find(
                        (a) => a.title.toLowerCase() === cond.toLowerCase()
                      );
                      return (
                        <span
                          key={cond}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#edf1fa] border border-[#cbd3e6] text-[11px] text-[#181b26] font-medium"
                        >
                          <span>{cond}</span>
                          {linkedArt && (
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                onJumpToTagArticle(linkedArt.id, 'Conditions');
                              }}
                              className="text-[#5b74a8] hover:underline"
                              title="Lengkapi di Conditions"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleRemoveConditionTag(cond);
                            }}
                            className="text-[#52586e] hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={conditionInput}
                    onFocus={() => {
                      setActiveTooltip('kondisi');
                      setConditionDropdownOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setConditionDropdownOpen(false), 180)}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddConditionTag(conditionInput);
                      }
                    }}
                    placeholder="(Link ke daftar kondisi yang sudah dibuat, atau buat kondisi baru disini)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                  {conditionInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddConditionTag(conditionInput)}
                      className="text-[11px] text-[#5b74a8] font-semibold shrink-0"
                    >
                      + Tag
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-[#52586e]">
                  Dapat mengisi tag kondisi lebih dari satu
                </div>

                {conditionDropdownOpen && (conditionArticles.length > 0 || conditionInput.trim()) && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd3e6] rounded-xl shadow-xl p-2 z-30 max-h-40 overflow-y-auto space-y-1">
                    {conditionArticles.map((ca) => (
                      <div
                        key={ca.id}
                        onMouseDown={() => handleAddConditionTag(ca.title)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#edf1fa] text-xs text-[#181b26] cursor-pointer"
                      >
                        <span>{ca.title}</span>
                        <span className="text-[10px] text-[#5b74a8] font-medium">+ Pilih Tag</span>
                      </div>
                    ))}
                    {conditionInput.trim() && (
                      <button
                        type="button"
                        onMouseDown={() => handleAddConditionTag(conditionInput)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#edf1fa] text-[#5b74a8] text-xs font-medium"
                      >
                        + Tambah tag kondisi baru: &ldquo;{conditionInput.trim()}&rdquo; (Hanya memuat judul)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Gender */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181b26]">Gender</label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2">
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Mata */}
              <div className="space-y-1" onClick={() => setActiveTooltip('mata')}>
                <label className="block text-xs font-bold text-[#181b26] cursor-pointer">
                  Mata
                </label>
                {activeTooltip === 'mata' && (
                  <div className="px-3 py-2 rounded-xl bg-[#edf1fa] border border-[#8da7db] text-xs text-[#181b26] flex items-center justify-between gap-2">
                    <span>
                      <strong>{FIELD_TOOLTIPS.mata.title} :</strong> {FIELD_TOOLTIPS.mata.info}
                    </span>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-[#52586e] hover:text-[#181b26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2">
                  <input
                    type="text"
                    value={eyes}
                    onFocus={() => setActiveTooltip('mata')}
                    onChange={(e) => setEyes(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 7. Rambut */}
              <div className="space-y-1" onClick={() => setActiveTooltip('rambut')}>
                <label className="block text-xs font-bold text-[#181b26] cursor-pointer">
                  Rambut
                </label>
                {activeTooltip === 'rambut' && (
                  <div className="px-3 py-2 rounded-xl bg-[#edf1fa] border border-[#8da7db] text-xs text-[#181b26] flex items-center justify-between gap-2">
                    <span>
                      <strong>{FIELD_TOOLTIPS.rambut.title} :</strong>{' '}
                      {FIELD_TOOLTIPS.rambut.info}
                    </span>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-[#52586e] hover:text-[#181b26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2">
                  <input
                    type="text"
                    value={hair}
                    onFocus={() => setActiveTooltip('rambut')}
                    onChange={(e) => setHair(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 8. Kulit */}
              <div className="space-y-1" onClick={() => setActiveTooltip('kulit')}>
                <label className="block text-xs font-bold text-[#181b26] cursor-pointer">
                  Kulit
                </label>
                {activeTooltip === 'kulit' && (
                  <div className="px-3 py-2 rounded-xl bg-[#edf1fa] border border-[#8da7db] text-xs text-[#181b26] flex items-center justify-between gap-2">
                    <span>
                      <strong>{FIELD_TOOLTIPS.kulit.title} :</strong> {FIELD_TOOLTIPS.kulit.info}
                    </span>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-[#52586e] hover:text-[#181b26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2">
                  <input
                    type="text"
                    value={skin}
                    onFocus={() => setActiveTooltip('kulit')}
                    onChange={(e) => setSkin(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 9. Tinggi & berat Badan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181b26]">
                  Tinggi &amp; berat Badan
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2">
                  <input
                    type="text"
                    value={heightWeight}
                    onChange={(e) => setHeightWeight(e.target.value)}
                    placeholder="(Deskripsi)"
                    className="w-full bg-transparent text-xs text-[#181b26] placeholder:text-[#7c849b] focus:outline-none"
                  />
                </div>
              </div>

              {/* 10. Organisasi afiliasi */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-[#181b26]">
                  Organisasi afiliasi
                </label>
                <div className="border border-[#cbd3e6] bg-[#f4f6fb] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
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

              {/* Note & Submit Bar */}
              <div className="pt-3 border-t border-[#e4e9f5] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-[#52586e] max-w-xs">
                  {savedBanner ? (
                    <span className="text-[#5b74a8] font-semibold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {savedBanner}
                    </span>
                  ) : (
                    <span>
                      Tag baru otomatis disimpan sebagai judul &amp; dapat dilihat dalam tampilan Fullscreen.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#6d7696] hover:bg-[#5d6685] text-white border border-[#6d7696] font-semibold text-xs transition-all shadow-[0_4px_14px_rgba(109,118,150,0.35)] cursor-pointer"
                >
                  Simpan Karakter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
