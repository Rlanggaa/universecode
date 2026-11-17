import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Upload,
  Plus,
  Trash2,
  MapPin,
  MousePointer,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  ExternalLink,
  Paintbrush,
  Eraser,
  Route as RouteIcon,
  Type,
  Trees,
  Mountain,
  Waves,
  Undo2,
  Redo2,
  Map as MapIcon,
  Check,
  Compass
} from 'lucide-react';
import { Article, World, WorldMap, MapMarker } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

export interface CartographySymbolItem {
  id: string;
  typeId: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  scale: number; // 0.4 - 2.5
  color?: string;
  label?: string;
}

export interface CartographyPathItem {
  id: string;
  style: 'dotted' | 'solid' | 'river';
  color: string;
  width: number;
  points: { x: number; y: number }[]; // 0-100 percentage
}

export interface CartographyLabelItem {
  id: string;
  text: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  scale: number;
  color: string;
  curved?: boolean;
}

interface CartographyMapSaveData {
  mapId: string;
  landDataUrl?: string; // PNG data URL of multi-color painted landmass layer
  waterDataUrl?: string; // PNG data URL of painted river/lake/sea layer
  regionDataUrl?: string; // PNG data URL of tinted region/biome layer
  uploadedBgUrl?: string; // Uploaded map image URL if user chose Upload
  symbols: CartographySymbolItem[];
  paths: CartographyPathItem[];
  labels: CartographyLabelItem[];
  layerVisibility: {
    Land: boolean;
    Water: boolean;
    Paths: boolean;
    Symbols: boolean;
    Regions: boolean;
    Labels: boolean;
    Overlay: boolean;
    Locations: boolean;
  };
}

interface HistorySnapshot {
  landDataUrl: string;
  waterDataUrl: string;
  regionDataUrl: string;
  symbols: CartographySymbolItem[];
  paths: CartographyPathItem[];
  labels: CartographyLabelItem[];
  markers: MapMarker[];
}

interface SymbolDefinition {
  id: string;
  name: string;
  set: 'Trees & Nature' | 'Mountains' | 'Bridges & Structures' | 'Ships & Creatures';
  renderSvg: (scale?: number, customColor?: string) => React.ReactNode;
}

// Rich multi-color palette for Land Brush & Regions
const LAND_AND_CUSTOM_COLORS = [
  { hex: '#ebd5b3', label: 'Parchment Land (Klasik)' },
  { hex: '#d9b98b', label: 'Savanna / Padang Rumput Kering' },
  { hex: '#7a9152', label: 'Grassland / Dataran Hijau' },
  { hex: '#4f6b38', label: 'Deep Jungle / Hutan Lebat' },
  { hex: '#e0c078', label: 'Desert Sand / Gurun Pasir' },
  { hex: '#b56c43', label: 'Red Canyon / Tanah Merah' },
  { hex: '#8c7a6b', label: 'Highland Rock / Dataran Batu' },
  { hex: '#e8eff5', label: 'Snow & Tundra / Salju Abadi' },
  { hex: '#54494b', label: 'Volcanic Ash / Tanah Vulkanik' },
  { hex: '#9e8bb8', label: 'Mystic Lands / Wilayah Magis' },
  { hex: '#6b3026', label: 'Crimson / Merah Tua' },
  { hex: '#4a3b28', label: 'Umber / Cokelat Tanah' }
];

// Dedicated Water / River / Lake / Ocean color presets
const WATER_COLORS = [
  { hex: '#4f8699', label: 'Sungai (River Stream)' },
  { hex: '#3b6e8c', label: 'Danau (Inland Lake)' },
  { hex: '#73a6b8', label: 'Perairan Dangkal (Shallow Coast)' },
  { hex: '#284b63', label: 'Laut Dalam (Deep Ocean)' },
  { hex: '#5a8f76', label: 'Rawa / Delta (Swamp Water)' },
  { hex: '#cfc8b8', label: 'Laut Perkamen Klasik (Vintage Sea)' }
];

const SYMBOL_LIBRARY: SymbolDefinition[] = [
  {
    id: 'pine-cluster',
    name: 'Pine Forest Cluster',
    set: 'Trees & Nature',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <line x1="18" y1="42" x2="18" y2="50" stroke="#4a3520" strokeWidth="2.5" />
        <polygon points="18,12 8,30 28,30" fill="#3b5228" stroke="#1e2914" strokeWidth="1.4" />
        <polygon points="18,22 6,42 30,42" fill="#2f4220" stroke="#1e2914" strokeWidth="1.4" />
        <line x1="46" y1="44" x2="46" y2="52" stroke="#4a3520" strokeWidth="2.5" />
        <polygon points="46,14 36,32 56,32" fill="#465e30" stroke="#1e2914" strokeWidth="1.4" />
        <polygon points="46,24 34,44 58,44" fill="#384d26" stroke="#1e2914" strokeWidth="1.4" />
        <line x1="32" y1="48" x2="32" y2="58" stroke="#4a3520" strokeWidth="3" />
        <polygon points="32,16 20,36 44,36" fill="#526e38" stroke="#1e2914" strokeWidth="1.5" />
        <polygon points="32,28 18,50 46,50" fill="#3f572a" stroke="#1e2914" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'deciduous-woods',
    name: 'Lush Deciduous Woods',
    set: 'Trees & Nature',
    renderSvg: () => (
      <svg viewBox="0 0 64 60" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <line x1="22" y1="38" x2="22" y2="50" stroke="#4a3520" strokeWidth="2.8" />
        <line x1="42" y1="40" x2="42" y2="52" stroke="#4a3520" strokeWidth="2.8" />
        <circle cx="22" cy="28" r="12" fill="#688038" stroke="#232e14" strokeWidth="1.5" />
        <circle cx="15" cy="32" r="8" fill="#556b2d" stroke="#232e14" strokeWidth="1.4" />
        <circle cx="42" cy="30" r="11" fill="#5c7330" stroke="#232e14" strokeWidth="1.5" />
        <circle cx="32" cy="24" r="11" fill="#789142" stroke="#232e14" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'palm-oasis',
    name: 'Oasis & Palm Trees',
    set: 'Trees & Nature',
    renderSvg: () => (
      <svg viewBox="0 0 64 60" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <ellipse cx="34" cy="48" rx="18" ry="6" fill="#4f8699" stroke="#294854" strokeWidth="1.4" />
        <path d="M24,48 Q20,30 14,20" fill="none" stroke="#6e4b2a" strokeWidth="2.8" />
        <path d="M14,20 Q6,18 4,24 M14,20 Q10,12 18,12 M14,20 Q22,16 24,22" fill="none" stroke="#4f7835" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M40,46 Q43,28 48,18" fill="none" stroke="#6e4b2a" strokeWidth="2.6" />
        <path d="M48,18 Q40,14 38,20 M48,18 Q48,10 55,13 M48,18 Q56,16 58,23" fill="none" stroke="#5d873e" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'mountain-range',
    name: 'Jagged Mountain Range',
    set: 'Mountains',
    renderSvg: () => (
      <svg viewBox="0 0 100 65" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
        <polygon points="6,56 28,18 50,56" fill="#8c6d4e" stroke="#291f16" strokeWidth="2" />
        <polygon points="28,18 50,56 35,56 28,32" fill="#5e4732" />
        <polygon points="28,18 21,30 26,28 28,33 33,27 35,30" fill="#f5efe6" />
        <polygon points="48,56 72,20 94,56" fill="#8c6d4e" stroke="#291f16" strokeWidth="2" />
        <polygon points="72,20 94,56 78,56 72,34" fill="#5e4732" />
        <polygon points="72,20 65,31 70,29 72,34 77,29" fill="#f5efe6" />
        <polygon points="24,58 50,8 76,58" fill="#9e7b58" stroke="#291f16" strokeWidth="2.2" />
        <polygon points="50,8 76,58 56,58 50,26" fill="#634b34" />
        <polygon points="50,8 41,25 47,22 50,28 55,21 59,25" fill="#fcfaf5" stroke="#291f16" strokeWidth="0.8" />
      </svg>
    )
  },
  {
    id: 'single-peak',
    name: 'Alpine Peak',
    set: 'Mountains',
    renderSvg: () => (
      <svg viewBox="0 0 70 60" className="w-full h-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
        <polygon points="8,52 35,10 62,52" fill="#997754" stroke="#291f16" strokeWidth="2" />
        <polygon points="35,10 62,52 40,52 35,26" fill="#5c4630" />
        <polygon points="35,10 26,24 32,21 35,27 40,21 44,24" fill="#faf6f0" />
      </svg>
    )
  },
  {
    id: 'volcano-peak',
    name: 'Active Volcano',
    set: 'Mountains',
    renderSvg: () => (
      <svg viewBox="0 0 75 65" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
        <circle cx="38" cy="12" r="7" fill="#5c5552" opacity="0.8" />
        <circle cx="46" cy="9" r="5" fill="#736b68" opacity="0.7" />
        <polygon points="8,56 29,20 45,20 66,56" fill="#594639" stroke="#241a14" strokeWidth="2" />
        <path d="M29,20 Q37,24 45,20 L41,34 L36,28 L33,36 Z" fill="#e04f26" />
      </svg>
    )
  },
  {
    id: 'wooden-bridge',
    name: 'Wooden River Bridge',
    set: 'Bridges & Structures',
    renderSvg: () => (
      <svg viewBox="0 0 70 45" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
        <path d="M8,32 Q35,12 62,32 L62,38 Q35,18 8,38 Z" fill="#7a5230" stroke="#291b0e" strokeWidth="1.8" />
        <path d="M12,26 Q35,6 58,26" fill="none" stroke="#4d321c" strokeWidth="2" />
        <line x1="16" y1="24" x2="16" y2="34" stroke="#291b0e" strokeWidth="1.6" />
        <line x1="28" y1="18" x2="28" y2="28" stroke="#291b0e" strokeWidth="1.6" />
        <line x1="42" y1="18" x2="42" y2="28" stroke="#291b0e" strokeWidth="1.6" />
        <line x1="54" y1="24" x2="54" y2="34" stroke="#291b0e" strokeWidth="1.6" />
      </svg>
    )
  },
  {
    id: 'stone-bridge',
    name: 'Stone Arch Bridge',
    set: 'Bridges & Structures',
    renderSvg: () => (
      <svg viewBox="0 0 70 45" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
        <path d="M6,28 Q35,14 64,28 L64,38 L50,38 A15,10 0 0,0 20,38 L6,38 Z" fill="#a39e93" stroke="#2b2620" strokeWidth="1.8" />
        <path d="M6,24 Q35,10 64,24" fill="none" stroke="#cfcac0" strokeWidth="2.2" />
      </svg>
    )
  },
  {
    id: 'village-hamlet',
    name: 'Settlement Houses',
    set: 'Bridges & Structures',
    renderSvg: () => (
      <svg viewBox="0 0 70 50" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <rect x="8" y="24" width="16" height="12" fill="#d8cbb8" stroke="#2b241d" strokeWidth="1.5" />
        <polygon points="6,24 16,14 26,24" fill="#9e3b2e" stroke="#2b241d" strokeWidth="1.5" />
        <rect x="28" y="18" width="18" height="14" fill="#d8cbb8" stroke="#2b241d" strokeWidth="1.5" />
        <polygon points="26,18 37,8 48,18" fill="#8c3227" stroke="#2b241d" strokeWidth="1.5" />
        <rect x="44" y="27" width="16" height="12" fill="#cfc1ae" stroke="#2b241d" strokeWidth="1.5" />
        <polygon points="42,27 52,17 62,27" fill="#a84232" stroke="#2b241d" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'sailing-ship',
    name: 'Merchant Galleon',
    set: 'Ships & Creatures',
    renderSvg: () => (
      <svg viewBox="0 0 70 70" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
        <path d="M12,56 Q24,52 36,56 T58,56" fill="none" stroke="#5b7a8c" strokeWidth="2" />
        <path d="M16,44 L54,44 L46,55 L22,55 Z" fill="#7d4e2d" stroke="#2b1b0e" strokeWidth="1.8" />
        <line x1="35" y1="12" x2="35" y2="44" stroke="#3b2412" strokeWidth="2.2" />
        <path d="M24,18 Q38,22 35,38 L22,36 Q26,26 24,18 Z" fill="#f2e8cf" stroke="#3b2412" strokeWidth="1.5" />
        <path d="M36,14 Q48,18 46,34 L36,32 Z" fill="#e6dabf" stroke="#3b2412" strokeWidth="1.5" />
        <polygon points="35,12 45,14 35,17" fill="#b83b2b" />
      </svg>
    )
  },
  {
    id: 'sea-monster',
    name: 'Crimson Leviathan',
    set: 'Ships & Creatures',
    renderSvg: () => (
      <svg viewBox="0 0 85 55" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
        <path d="M14,38 Q28,10 52,24 Q64,30 70,38 Z" fill="#c93b2b" stroke="#2b1410" strokeWidth="1.8" />
        <path d="M18,28 Q32,8 50,20 Q36,20 22,32 Z" fill="#e0a82e" stroke="#2b1410" strokeWidth="1.2" />
        <circle cx="22" cy="30" r="2" fill="#fff" />
        <path d="M6,40 Q18,35 30,40 T54,40 T78,40" fill="none" stroke="#f0f4f8" strokeWidth="3" />
        <path d="M10,44 Q25,40 40,44 T72,44" fill="none" stroke="#4f6d7a" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    id: 'red-dragon',
    name: 'Red Wyrm Dragon',
    set: 'Ships & Creatures',
    renderSvg: () => (
      <svg viewBox="0 0 75 65" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
        <path d="M36,36 L12,14 L22,34 L10,38 L32,42 Z" fill="#b82921" stroke="#2b110e" strokeWidth="1.5" />
        <path d="M40,36 L64,14 L54,34 L66,38 L44,42 Z" fill="#d1342a" stroke="#2b110e" strokeWidth="1.5" />
        <path d="M35,20 Q38,35 34,52 Q42,58 48,50" fill="none" stroke="#8f1d16" strokeWidth="4" strokeLinecap="round" />
        <circle cx="38" cy="18" r="4" fill="#d1342a" stroke="#2b110e" strokeWidth="1.4" />
      </svg>
    )
  }
];

interface CartographyMapStudioProps {
  activeWorld: World;
  maps: WorldMap[];
  articles: Article[];
  onUpdateMap: (updatedMap: WorldMap) => void;
  onCreateMap: (newMap: WorldMap) => void;
  onDeleteMap: (mapId: string) => void;
  onNavigateToLocation: (locationArticleId: string) => void;
  onCreateLocationStub: (locationTitle: string) => Article;
  onStartZoomTransition?: () => void;
  historyRevision?: number;
}

export const CartographyMapStudio: React.FC<CartographyMapStudioProps> = ({
  activeWorld,
  maps,
  articles,
  onUpdateMap,
  onCreateMap,
  onDeleteMap,
  onNavigateToLocation,
  onCreateLocationStub,
  onStartZoomTransition,
  historyRevision = 0
}) => {
  const worldMaps = useMemo(
    () => maps.filter((m) => m.worldId === activeWorld.id),
    [maps, activeWorld.id]
  );

  const [selectedMapId, setSelectedMapId] = useState<string>(() => {
    try {
      const savedMapId = localStorage.getItem('alt_universe_cartography_last_map_id');
      if (savedMapId && worldMaps.some((m) => m.id === savedMapId)) {
        return savedMapId;
      }
    } catch {
      // ignore
    }
    return worldMaps[0]?.id || '';
  });

  useEffect(() => {
    if (worldMaps.length > 0 && !worldMaps.some((m) => m.id === selectedMapId)) {
      setSelectedMapId(worldMaps[0].id);
    } else if (worldMaps.length === 0) {
      setSelectedMapId('');
    }
  }, [worldMaps, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId) return;
    try {
      localStorage.setItem('alt_universe_cartography_last_map_id', selectedMapId);
    } catch {
      // ignore
    }
  }, [selectedMapId]);

  const activeMap = useMemo(
    () => worldMaps.find((m) => m.id === selectedMapId) || null,
    [worldMaps, selectedMapId]
  );

  const locationArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          (a.worldId === activeWorld.id || activeWorld.id === 'world-empty') &&
          (a.category === 'Locations' || String(a.templateType).startsWith('Location'))
      ),
    [articles, activeWorld.id]
  );

  // ============================================================================
  // 2 MODES OF MAPS:
  // 1) 'main'   -> Mode Utama: Mengakses Peta & Mark Lokasi (Default)
  // 2) 'canvas' -> Mode Kanvas: Mendesain & Melukis Peta (Land Brush, River, dsb.)
  // ============================================================================
  const [mapMode, setMapMode] = useState<'main' | 'canvas'>('main');

  // In Mode Utama ('main'), user can either be in 'explore' (drag to pan map & click pins)
  // or 'pin' (click map to place a new Mark Location from Location tags)
  const [mainInteractionMode, setMainInteractionMode] = useState<'explore' | 'pin'>('explore');

  // Studio Tool Type for Mode Kanvas ('canvas')
  type StudioTool =
    | 'pan'
    | 'select'
    | 'land-brush'
    | 'water-brush'
    | 'region-brush'
    | 'eraser'
    | 'paths'
    | 'symbols'
    | 'labels'
    | 'mark-location';

  const [activeTool, setActiveTool] = useState<StudioTool>('land-brush');
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>('mountain-range');
  const [symbolScale, setSymbolScale] = useState<number>(100);
  const [brushSize, setBrushSize] = useState<number>(34);
  const [selectedLandColor, setSelectedLandColor] = useState<string>('#ebd5b3');
  const [selectedWaterColor, setSelectedWaterColor] = useState<string>('#4f8699');
  const [waterSubMode, setWaterSubMode] = useState<'river' | 'lake' | 'sea'>('river');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [symbolSetFilter, setSymbolSetFilter] = useState<string>('All');
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [pathStyle, setPathStyle] = useState<'dotted' | 'solid' | 'river'>('dotted');
  const [labelDraftText, setLabelDraftText] = useState<string>('Maidens Mountains');
  const [curvedLabel, setCurvedLabel] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // Oversized Map Free-Panning & Zoom State
  // Map surface is 2160 x 1350 (larger than viewport frame so it shows fine details and pans freely)
  const MAP_SURFACE_WIDTH = 2160;
  const MAP_SURFACE_HEIGHT = 1350;
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [isPanningState, setIsPanningState] = useState<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const panStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragPanRef = useRef<boolean>(false);
  const isSpacePressedRef = useRef<boolean>(false);

  // 1.5-second (1500ms) transition when clicking a Location Mark:
  // - First 0.8s (800ms) of the blur transition shifts the map so the target mark is centered
  // - Location mark thumbnail stays in place on the map mark, sharing the map's 1.5s Z-depth zoom-in blur
  const [zoomingMarker, setZoomingMarker] = useState<MapMarker | null>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  // Beralih Map Popover & Location Mark Drawer State in Mode Utama
  const [showSwitchMapMenu, setShowSwitchMapMenu] = useState<boolean>(false);
  const [showPinPopover, setShowPinPopover] = useState<boolean>(false);

  // Location Pinning State (shared across Mode Utama & Mode Kanvas)
  const [selectedLocationTagId, setSelectedLocationTagId] = useState<string>('');
  const [newLocationTagInput, setNewLocationTagInput] = useState<string>('');
  const [customPinLabel, setCustomPinLabel] = useState<string>('');
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  // New Map Modal State
  const [newMapTitle, setNewMapTitle] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const STORAGE_KEY_PREFIX = 'alt_universe_cartography_v2_';

  const [layerVisibility, setLayerVisibility] = useState<{
    Land: boolean;
    Water: boolean;
    Paths: boolean;
    Symbols: boolean;
    Regions: boolean;
    Labels: boolean;
    Overlay: boolean;
    Locations: boolean;
  }>({
    Land: true,
    Water: true,
    Paths: true,
    Symbols: true,
    Regions: true,
    Labels: true,
    Overlay: true,
    Locations: true
  });

  const [symbols, setSymbols] = useState<CartographySymbolItem[]>([]);
  const [paths, setPaths] = useState<CartographyPathItem[]>([]);
  const [labels, setLabels] = useState<CartographyLabelItem[]>([]);
  const [uploadedBgUrl, setUploadedBgUrl] = useState<string>('');

  // Refs for HTML5 Canvases (Land, Water/River/Lake/Sea, and Region tint)
  const viewportFrameRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const isPaintingRef = useRef<boolean>(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const currentPathPtsRef = useRef<{ x: number; y: number }[]>([]);
  const [draftPathPts, setDraftPathPts] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (locationArticles.length > 0 && !selectedLocationTagId) {
      setSelectedLocationTagId(locationArticles[0].id);
    }
  }, [locationArticles, selectedLocationTagId]);

  // 1.5s (1500ms) Full Transition (Matching Timeline UX):
  // - First 0.8s (800ms) shifts the map surface so the clicked Location Mark is centered
  // - Mark thumbnail stays in its original position & size inside the mark card
  // - Receives the exact same 1.5s Z-depth directional zoom-in blur effect as the map surface
  const handleTriggerLocationZoomTransition = useCallback(
    (marker: MapMarker) => {
      if (zoomingMarker) return;
      const matchedLoc = locationArticles.find(
        (a) =>
          a.id === marker.linkedArticleId ||
          a.title.toLowerCase() === marker.label.toLowerCase()
      );
      const targetLocId = matchedLoc?.id || marker.linkedArticleId;
      if (!targetLocId) return;

      // Shift map during the first 0.8s (800ms) of the blur transition so the target mark is centered
      const markerPxX = (marker.x / 100) * MAP_SURFACE_WIDTH;
      const markerPxY = (marker.y / 100) * MAP_SURFACE_HEIGHT;
      const targetPanX = Math.round(MAP_SURFACE_WIDTH / 2 - markerPxX);
      const targetPanY = Math.round(MAP_SURFACE_HEIGHT / 2 - markerPxY + 32);
      setPanOffset({ x: targetPanX, y: targetPanY });

      setHoveredPinId(null);
      setShowSwitchMapMenu(false);
      setShowPinPopover(false);
      onStartZoomTransition?.();
      setZoomingMarker(marker);

      if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = window.setTimeout(() => {
        onNavigateToLocation(targetLocId);
      }, 1500);
    },
    [zoomingMarker, locationArticles, onStartZoomTransition, onNavigateToLocation]
  );

  const captureSnapshot = useCallback((): HistorySnapshot => {
    return {
      landDataUrl: landCanvasRef.current ? landCanvasRef.current.toDataURL('image/png') : '',
      waterDataUrl: waterCanvasRef.current ? waterCanvasRef.current.toDataURL('image/png') : '',
      regionDataUrl: regionCanvasRef.current ? regionCanvasRef.current.toDataURL('image/png') : '',
      symbols: [...symbols],
      paths: [...paths],
      labels: [...labels],
      markers: activeMap ? [...activeMap.markers] : []
    };
  }, [symbols, paths, labels, activeMap]);

  const pushUndoSnapshot = useCallback(() => {
    const snap = captureSnapshot();
    setUndoStack((prev) => [...prev.slice(-29), snap]);
    setRedoStack([]);
  }, [captureSnapshot]);

  const saveStudioState = useCallback(
    (mapId: string, override?: Partial<CartographyMapSaveData>) => {
      if (!mapId) return;
      const landCanvas = landCanvasRef.current;
      const waterCanvas = waterCanvasRef.current;
      const regionCanvas = regionCanvasRef.current;
      const payload: CartographyMapSaveData = {
        mapId,
        landDataUrl:
          override?.landDataUrl !== undefined
            ? override.landDataUrl
            : landCanvas
            ? landCanvas.toDataURL('image/png')
            : undefined,
        waterDataUrl:
          override?.waterDataUrl !== undefined
            ? override.waterDataUrl
            : waterCanvas
            ? waterCanvas.toDataURL('image/png')
            : undefined,
        regionDataUrl:
          override?.regionDataUrl !== undefined
            ? override.regionDataUrl
            : regionCanvas
            ? regionCanvas.toDataURL('image/png')
            : undefined,
        uploadedBgUrl:
          override?.uploadedBgUrl !== undefined ? override.uploadedBgUrl : uploadedBgUrl,
        symbols: override?.symbols !== undefined ? override.symbols : symbols,
        paths: override?.paths !== undefined ? override.paths : paths,
        labels: override?.labels !== undefined ? override.labels : labels,
        layerVisibility:
          override?.layerVisibility !== undefined ? override.layerVisibility : layerVisibility
      };
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${mapId}`, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('alt-universe-substudio-change'));
      } catch {
        // Ignore storage quota warnings
      }
    },
    [uploadedBgUrl, symbols, paths, labels, layerVisibility]
  );

  const applySnapshot = useCallback(
    (snap: HistorySnapshot) => {
      if (!activeMap) return;
      const restoreCanvas = (canvas: HTMLCanvasElement | null, dataUrl: string) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (!dataUrl) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
      };

      restoreCanvas(landCanvasRef.current, snap.landDataUrl);
      restoreCanvas(waterCanvasRef.current, snap.waterDataUrl);
      restoreCanvas(regionCanvasRef.current, snap.regionDataUrl);
      setSymbols(snap.symbols);
      setPaths(snap.paths);
      setLabels(snap.labels);
      onUpdateMap({
        ...activeMap,
        markers: snap.markers
      });
      saveStudioState(activeMap.id, {
        landDataUrl: snap.landDataUrl,
        waterDataUrl: snap.waterDataUrl,
        regionDataUrl: snap.regionDataUrl,
        symbols: snap.symbols,
        paths: snap.paths,
        labels: snap.labels
      });
    },
    [activeMap, onUpdateMap, saveStudioState]
  );

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const currentSnap = captureSnapshot();
    const previousSnap = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentSnap]);
    applySnapshot(previousSnap);
  }, [undoStack, captureSnapshot, applySnapshot]);

  // Redo (Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const currentSnap = captureSnapshot();
    const nextSnap = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, currentSnap]);
    applySnapshot(nextSnap);
  }, [redoStack, captureSnapshot, applySnapshot]);

  // Keyboard shortcuts for Undo (Ctrl+Z), Redo (Ctrl+Shift+Z / Ctrl+Y), and Spacebar Pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        isSpacePressedRef.current = true;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (redoStack.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            handleRedo();
          }
        } else {
          if (undoStack.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (redoStack.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handleRedo();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleUndo, handleRedo, undoStack.length, redoStack.length]);

  // Draw Reference Fantasy Map onto current canvases (Maidens Mountains, Fear's Folly, Capricious Cove, rivers, etc.)
  const drawReferenceContinentDirectly = useCallback(
    (mapIdToSave?: string) => {
      const landCanvas = landCanvasRef.current;
      const waterCanvas = waterCanvasRef.current;
      if (!landCanvas || !waterCanvas) return;
      const ctx = landCanvas.getContext('2d');
      const wCtx = waterCanvas.getContext('2d');
      if (!ctx || !wCtx) return;

      ctx.clearRect(0, 0, landCanvas.width, landCanvas.height);
      wCtx.clearRect(0, 0, waterCanvas.width, waterCanvas.height);

      const drawBlobPolygon = (
        targetCtx: CanvasRenderingContext2D,
        pts: [number, number][],
        fillColor: string,
        radius = 26
      ) => {
        targetCtx.fillStyle = fillColor;
        targetCtx.beginPath();
        targetCtx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          targetCtx.lineTo(pts[i][0], pts[i][1]);
        }
        targetCtx.closePath();
        targetCtx.fill();
        for (const [bx, by] of pts) {
          targetCtx.beginPath();
          targetCtx.arc(bx, by, radius, 0, Math.PI * 2);
          targetCtx.fill();
        }
      };

      // Main Continent matching Map_if_filled_a85407c7.png
      drawBlobPolygon(
        ctx,
        [
          [380, 10],
          [595, 10],
          [645, 105],
          [675, 225],
          [750, 355],
          [775, 495],
          [860, 595],
          [835, 660],
          [735, 685],
          [615, 705],
          [525, 665],
          [575, 580],
          [505, 545],
          [455, 610],
          [415, 680],
          [305, 660],
          [245, 570],
          [195, 460],
          [250, 390],
          [335, 360],
          [375, 245],
          [345, 150]
        ],
        '#ebd5b3',
        28
      );

      // Northeast Island
      drawBlobPolygon(
        ctx,
        [
          [735, 75],
          [890, 15],
          [945, 155],
          [995, 240],
          [930, 315],
          [805, 300],
          [740, 195]
        ],
        '#dfd1b4',
        24
      );

      // Winding Rivers & Cove Waters
      wCtx.strokeStyle = '#6c5338';
      wCtx.lineWidth = 3.2;
      wCtx.lineCap = 'round';
      wCtx.lineJoin = 'round';
      wCtx.beginPath();
      wCtx.moveTo(455, 120);
      wCtx.quadraticCurveTo(495, 210, 550, 275);
      wCtx.quadraticCurveTo(475, 320, 360, 465);
      wCtx.quadraticCurveTo(325, 520, 290, 610);
      wCtx.stroke();

      const presetSymbols: CartographySymbolItem[] = [
        { id: 's-1', typeId: 'sea-monster', x: 14, y: 16, scale: 1.2 },
        { id: 's-2', typeId: 'sailing-ship', x: 17, y: 34, scale: 0.95 },
        { id: 's-3', typeId: 'sailing-ship', x: 60, y: 23, scale: 0.95 },
        { id: 's-4', typeId: 'village-hamlet', x: 43, y: 37, scale: 1.0 },
        { id: 's-5', typeId: 'village-hamlet', x: 35, y: 58, scale: 1.35 },
        { id: 's-6', typeId: 'single-peak', x: 76, y: 74, scale: 1.15 },
        { id: 's-8', typeId: 'mountain-range', x: 46, y: 47, scale: 1.5 },
        { id: 's-9', typeId: 'mountain-range', x: 55, y: 50, scale: 1.4 },
        { id: 's-10', typeId: 'single-peak', x: 40, y: 52, scale: 1.15 },
        { id: 's-11', typeId: 'pine-cluster', x: 51, y: 63, scale: 1.25 },
        { id: 's-12', typeId: 'pine-cluster', x: 58, y: 69, scale: 1.3 },
        { id: 's-13', typeId: 'pine-cluster', x: 63, y: 62, scale: 1.25 },
        { id: 's-14', typeId: 'deciduous-woods', x: 50, y: 30, scale: 1.15 },
        { id: 's-15', typeId: 'pine-cluster', x: 76, y: 23, scale: 1.15 },
        { id: 's-16', typeId: 'pine-cluster', x: 40, y: 6, scale: 1.1 }
      ];

      const presetPaths: CartographyPathItem[] = [
        {
          id: 'p-1',
          style: 'dotted',
          color: '#593e25',
          width: 2,
          points: [
            { x: 6, y: 33 },
            { x: 15, y: 36 },
            { x: 22, y: 48 },
            { x: 29, y: 26 },
            { x: 27, y: 4 }
          ]
        },
        {
          id: 'p-2',
          style: 'dotted',
          color: '#593e25',
          width: 2,
          points: [
            { x: 57, y: 30 },
            { x: 60, y: 16 },
            { x: 63, y: 3 }
          ]
        }
      ];

      const presetLabels: CartographyLabelItem[] = [
        {
          id: 'l-1',
          text: 'Maidens Mountains',
          x: 50,
          y: 49,
          scale: 1.45,
          color: '#f5ead6'
        },
        {
          id: 'l-2',
          text: "Fear's Folly",
          x: 24,
          y: 61,
          scale: 0.95,
          color: '#4e3c2a'
        },
        {
          id: 'l-3',
          text: 'Capricious Cove',
          x: 48,
          y: 77,
          scale: 0.82,
          color: '#5e5243',
          curved: true
        }
      ];

      setSymbols(presetSymbols);
      setPaths(presetPaths);
      setLabels(presetLabels);

      if (mapIdToSave) {
        saveStudioState(mapIdToSave, {
          landDataUrl: landCanvas.toDataURL('image/png'),
          waterDataUrl: waterCanvas.toDataURL('image/png'),
          symbols: presetSymbols,
          paths: presetPaths,
          labels: presetLabels
        });
      }
    },
    [saveStudioState]
  );

  // Load studio state when switching activeMap
  useEffect(() => {
    if (!activeMap) return;
    setUndoStack([]);
    setRedoStack([]);
    setZoomingMarker(null);
    const landCanvas = landCanvasRef.current;
    const waterCanvas = waterCanvasRef.current;
    const regionCanvas = regionCanvasRef.current;
    landCanvas?.getContext('2d')?.clearRect(0, 0, landCanvas.width, landCanvas.height);
    waterCanvas?.getContext('2d')?.clearRect(0, 0, waterCanvas.width, waterCanvas.height);
    regionCanvas?.getContext('2d')?.clearRect(0, 0, regionCanvas.width, regionCanvas.height);

    const raw =
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeMap.id}`) ||
      localStorage.getItem(`alt_universe_cartography_v1_${activeMap.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CartographyMapSaveData;
        setSymbols(parsed.symbols || []);
        setPaths(parsed.paths || []);
        setLabels(parsed.labels || []);
        setUploadedBgUrl(parsed.uploadedBgUrl || activeMap.customImageUrl || '');
        if (parsed.layerVisibility) {
          setLayerVisibility({
            Land: parsed.layerVisibility.Land ?? true,
            Water: parsed.layerVisibility.Water ?? true,
            Paths: parsed.layerVisibility.Paths ?? true,
            Symbols: parsed.layerVisibility.Symbols ?? true,
            Regions: parsed.layerVisibility.Regions ?? true,
            Labels: parsed.layerVisibility.Labels ?? true,
            Overlay: parsed.layerVisibility.Overlay ?? true,
            Locations: parsed.layerVisibility.Locations ?? true
          });
        }
        if (parsed.landDataUrl && landCanvas) {
          const img = new Image();
          img.onload = () => {
            const ctx = landCanvas.getContext('2d');
            ctx?.clearRect(0, 0, landCanvas.width, landCanvas.height);
            ctx?.drawImage(img, 0, 0);
          };
          img.src = parsed.landDataUrl;
        }
        if (parsed.waterDataUrl && waterCanvas) {
          const img = new Image();
          const ctx = waterCanvas.getContext('2d');
          img.onload = () => {
            ctx?.clearRect(0, 0, waterCanvas.width, waterCanvas.height);
            ctx?.drawImage(img, 0, 0);
          };
          img.src = parsed.waterDataUrl;
        }
        if (parsed.regionDataUrl && regionCanvas) {
          const img = new Image();
          const ctx = regionCanvas.getContext('2d');
          img.onload = () => {
            ctx?.clearRect(0, 0, regionCanvas.width, regionCanvas.height);
            ctx?.drawImage(img, 0, 0);
          };
          img.src = parsed.regionDataUrl;
        }
        return;
      } catch {
        // Fallback below
      }
    }

    if (activeMap.customImageUrl) {
      setSymbols([]);
      setPaths([]);
      setLabels([]);
      setUploadedBgUrl(activeMap.customImageUrl);
    } else {
      // Populate default continent art if map has no saved data yet so filled maps look rich
      setUploadedBgUrl('');
      window.requestAnimationFrame(() => {
        drawReferenceContinentDirectly(activeMap.id);
      });
    }
  }, [activeMap?.id, historyRevision]);

  // Paint helper on HTML5 canvas supporting multi-color Land Brush & River/Lake/Sea Water Brush
  const paintStrokeOnCanvas = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    tool: StudioTool
  ) => {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / 3));

    if (tool === 'land-brush') {
      const landCanvas = landCanvasRef.current;
      if (!landCanvas) return;
      const ctx = landCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedLandColor;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        ctx.beginPath();
        ctx.arc(cx, cy, brushSize, 0, Math.PI * 2);
        ctx.fill();
        for (let k = 0; k < 5; k++) {
          const angle = ((i * 7 + k * 72) % 360) * (Math.PI / 180);
          const ox = cx + Math.cos(angle) * (brushSize * 0.65);
          const oy = cy + Math.sin(angle) * (brushSize * 0.65);
          ctx.beginPath();
          ctx.arc(ox, oy, brushSize * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (tool === 'water-brush') {
      const waterCanvas = waterCanvasRef.current;
      if (!waterCanvas) return;
      const ctx = waterCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedWaterColor;
      const effectiveRadius =
        waterSubMode === 'river'
          ? Math.max(4, brushSize * 0.35)
          : waterSubMode === 'lake'
          ? brushSize * 0.85
          : brushSize * 1.25;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        ctx.beginPath();
        ctx.arc(cx, cy, effectiveRadius, 0, Math.PI * 2);
        ctx.fill();

        if (waterSubMode !== 'river') {
          for (let k = 0; k < 4; k++) {
            const angle = ((i * 11 + k * 90) % 360) * (Math.PI / 180);
            const ox = cx + Math.cos(angle) * (effectiveRadius * 0.55);
            const oy = cy + Math.sin(angle) * (effectiveRadius * 0.55);
            ctx.beginPath();
            ctx.arc(ox, oy, effectiveRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    } else if (tool === 'region-brush') {
      const regionCanvas = regionCanvasRef.current;
      if (!regionCanvas) return;
      const ctx = regionCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedLandColor;
      ctx.globalAlpha = 0.45;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        ctx.beginPath();
        ctx.arc(cx, cy, brushSize * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (tool === 'eraser') {
      [waterCanvasRef.current, regionCanvasRef.current, landCanvasRef.current].forEach(
        (canvas) => {
          const ctx = canvas?.getContext('2d');
          if (!ctx) return;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;
            ctx.beginPath();
            ctx.arc(cx, cy, brushSize, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      );
    }
  };

  const getCoordsFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { px: 0, py: 0, pctX: 50, pctY: 50 };
    const pctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const px = (pctX / 100) * 1200;
    const py = (pctY / 100) * 750;
    return { px, py, pctX, pctY };
  };

  // Clamp pan offset so the oversized map can be freely dragged across all edges without getting lost
  const clampPanOffset = useCallback(
    (nextX: number, nextY: number, zoom = mapZoom) => {
      const frame = viewportFrameRef.current;
      const frameW = frame ? frame.clientWidth : 1200;
      const frameH = frame ? frame.clientHeight : 800;
      const scaledW = MAP_SURFACE_WIDTH * zoom;
      const scaledH = MAP_SURFACE_HEIGHT * zoom;
      const maxX = Math.max(220, (scaledW - frameW) / 2 + 240);
      const maxY = Math.max(180, (scaledH - frameH) / 2 + 200);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY))
      };
    },
    [mapZoom]
  );

  const placeLocationMarkAt = (pctX: number, pctY: number) => {
    if (!activeMap) return;
    let targetArticle = locationArticles.find((a) => a.id === selectedLocationTagId);
    if (!targetArticle && newLocationTagInput.trim()) {
      targetArticle = onCreateLocationStub(newLocationTagInput.trim());
      setSelectedLocationTagId(targetArticle.id);
      setNewLocationTagInput('');
    }
    if (!targetArticle) return;

    pushUndoSnapshot();
    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      mapId: activeMap.id,
      label: customPinLabel.trim() || targetArticle.title,
      type: 'Location',
      layerId: 'layer-locations',
      x: Number(pctX.toFixed(2)),
      y: Number(pctY.toFixed(2)),
      description:
        targetArticle.summary ||
        `Klik mark ini untuk membuka halaman lokasi "${targetArticle.title}".`,
      linkedArticleId: targetArticle.id,
      isHiddenGM: false
    };

    const updatedMap: WorldMap = {
      ...activeMap,
      markers: [...activeMap.markers, newMarker]
    };
    onUpdateMap(updatedMap);
    setCustomPinLabel('');
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeMap || zoomingMarker) return;

    // Start free panning if:
    // 1) Middle mouse button (e.button === 1) or Spacebar held
    // 2) In Mode Utama ('main') and mainInteractionMode === 'explore'
    // 3) In Mode Kanvas ('canvas') and activeTool === 'pan'
    const shouldPan =
      e.button === 1 ||
      isSpacePressedRef.current ||
      (mapMode === 'main' && mainInteractionMode === 'explore' && e.button === 0) ||
      (mapMode === 'canvas' && activeTool === 'pan' && e.button === 0);

    if (shouldPan) {
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanningState(true);
      didDragPanRef.current = false;
      panStartClientRef.current = { x: e.clientX, y: e.clientY };
      panStartOffsetRef.current = { x: panOffset.x, y: panOffset.y };
      return;
    }

    if (e.button !== 0) return;
    const { px, py, pctX, pctY } = getCoordsFromEvent(e);

    // If user is in Mode Utama ('main') & Pin mode:
    if (mapMode === 'main') {
      if (mainInteractionMode === 'pin') {
        placeLocationMarkAt(pctX, pctY);
      }
      return;
    }

    // Mode Kanvas ('canvas'):
    if (
      activeTool === 'land-brush' ||
      activeTool === 'water-brush' ||
      activeTool === 'region-brush' ||
      activeTool === 'eraser'
    ) {
      pushUndoSnapshot();
      isPaintingRef.current = true;
      lastPtRef.current = { x: px, y: py };
      paintStrokeOnCanvas({ x: px, y: py }, { x: px, y: py }, activeTool);
    } else if (activeTool === 'paths') {
      pushUndoSnapshot();
      isPaintingRef.current = true;
      currentPathPtsRef.current = [{ x: pctX, y: pctY }];
      setDraftPathPts([{ x: pctX, y: pctY }]);
    } else if (activeTool === 'symbols') {
      pushUndoSnapshot();
      const nextSymbols: CartographySymbolItem[] = [
        ...symbols,
        {
          id: `sym-${Date.now()}`,
          typeId: selectedSymbolId,
          x: Number(pctX.toFixed(2)),
          y: Number(pctY.toFixed(2)),
          scale: symbolScale / 100,
          color: selectedLandColor
        }
      ];
      setSymbols(nextSymbols);
      saveStudioState(activeMap.id, { symbols: nextSymbols });
    } else if (activeTool === 'labels') {
      if (!labelDraftText.trim()) return;
      pushUndoSnapshot();
      const nextLabels: CartographyLabelItem[] = [
        ...labels,
        {
          id: `lbl-${Date.now()}`,
          text: labelDraftText.trim(),
          x: Number(pctX.toFixed(2)),
          y: Number(pctY.toFixed(2)),
          scale: symbolScale / 100,
          color: '#f7efe1',
          curved: curvedLabel
        }
      ];
      setLabels(nextLabels);
      saveStudioState(activeMap.id, { labels: nextLabels });
    } else if (activeTool === 'mark-location') {
      placeLocationMarkAt(pctX, pctY);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartClientRef.current.x;
      const dy = e.clientY - panStartClientRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        didDragPanRef.current = true;
      }
      setPanOffset(
        clampPanOffset(panStartOffsetRef.current.x + dx, panStartOffsetRef.current.y + dy)
      );
      return;
    }

    if (!isPaintingRef.current || !activeMap || mapMode !== 'canvas') return;
    const { px, py, pctX, pctY } = getCoordsFromEvent(e);

    if (
      activeTool === 'land-brush' ||
      activeTool === 'water-brush' ||
      activeTool === 'region-brush' ||
      activeTool === 'eraser'
    ) {
      const prev = lastPtRef.current || { x: px, y: py };
      paintStrokeOnCanvas(prev, { x: px, y: py }, activeTool);
      lastPtRef.current = { x: px, y: py };
    } else if (activeTool === 'paths') {
      const pts = currentPathPtsRef.current;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(pctX - last.x, pctY - last.y) > 1.2) {
        currentPathPtsRef.current = [
          ...pts,
          { x: Number(pctX.toFixed(2)), y: Number(pctY.toFixed(2)) }
        ];
        setDraftPathPts(currentPathPtsRef.current);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanningState(false);
      return;
    }

    if (!isPaintingRef.current || !activeMap) return;
    isPaintingRef.current = false;
    lastPtRef.current = null;

    if (activeTool === 'paths' && currentPathPtsRef.current.length > 1) {
      const newPath: CartographyPathItem = {
        id: `path-${Date.now()}`,
        style: pathStyle,
        color: pathStyle === 'river' ? selectedWaterColor : '#4a3623',
        width: pathStyle === 'river' ? 3.5 : 2,
        points: currentPathPtsRef.current
      };
      const nextPaths = [...paths, newPath];
      setPaths(nextPaths);
      currentPathPtsRef.current = [];
      setDraftPathPts([]);
      saveStudioState(activeMap.id, { paths: nextPaths });
    } else {
      saveStudioState(activeMap.id);
    }
  };

  // Load Reference Fantasy Map preset with rivers, lakes, mountains, forests
  const handleLoadReferenceContinent = () => {
    if (!activeMap) return;
    pushUndoSnapshot();
    drawReferenceContinentDirectly(activeMap.id);
  };

  // Clear Canvas to Blank Ocean
  const handleClearToBlankCanvas = () => {
    if (!activeMap) return;
    pushUndoSnapshot();
    landCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 750);
    waterCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 750);
    regionCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 1200, 750);
    setSymbols([]);
    setPaths([]);
    setLabels([]);
    setUploadedBgUrl('');
    saveStudioState(activeMap.id, {
      landDataUrl: '',
      waterDataUrl: '',
      regionDataUrl: '',
      uploadedBgUrl: '',
      symbols: [],
      paths: [],
      labels: []
    });
  };

  // Save Canvas Design & Smoothly Switch to Mode Utama (Halaman Peta Interaktif)
  const handleApplyCanvasToMainMap = () => {
    if (!activeMap) return;
    saveStudioState(activeMap.id);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
    setMapMode('main');
  };

  // Handle Map Image Upload
  const handleUploadMapFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!activeMap) {
        const newMap: WorldMap = {
          id: `map-${Date.now()}`,
          worldId: activeWorld.id,
          name: newMapTitle.trim() || file.name.replace(/\.[^/.]+$/, '') || 'Peta Baru',
          scaleLevel: 'World',
          description: 'Uploaded custom world map',
          svgTheme: 'archipelago',
          customImageUrl: dataUrl,
          layers: [
            { id: 'layer-terrain', name: 'Land & Terrain', visible: true, category: 'Terrain' },
            { id: 'layer-locations', name: 'Location Marks', visible: true, category: 'Political' }
          ],
          markers: []
        };
        onCreateMap(newMap);
        setSelectedMapId(newMap.id);
        setUploadedBgUrl(dataUrl);
        setShowCreateModal(false);
        setNewMapTitle('');
      } else {
        pushUndoSnapshot();
        setUploadedBgUrl(dataUrl);
        onUpdateMap({ ...activeMap, customImageUrl: dataUrl });
        saveStudioState(activeMap.id, { uploadedBgUrl: dataUrl });
        setShowCreateModal(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateBlankMap = (
    customTitle?: string,
    startInCanvasMode = true,
    startBlank = false
  ) => {
    const title = customTitle?.trim() || newMapTitle.trim() || `Maidens Continent`;
    const newId = `map-${Date.now()}`;
    if (startBlank) {
      const blankPayload: CartographyMapSaveData = {
        mapId: newId,
        landDataUrl: '',
        waterDataUrl: '',
        regionDataUrl: '',
        uploadedBgUrl: '',
        symbols: [],
        paths: [],
        labels: [],
        layerVisibility
      };
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${newId}`, JSON.stringify(blankPayload));
      } catch {
        // ignore
      }
    }
    const newMap: WorldMap = {
      id: newId,
      worldId: activeWorld.id,
      name: title,
      scaleLevel: 'World',
      description: 'Interactive Cartography & Location Map',
      svgTheme: 'archipelago',
      layers: [
        { id: 'layer-terrain', name: 'Land', visible: true, category: 'Terrain' },
        { id: 'layer-locations', name: 'Location Marks', visible: true, category: 'Political' }
      ],
      markers: []
    };
    onCreateMap(newMap);
    setSelectedMapId(newMap.id);
    setNewMapTitle('');
    setShowCreateModal(false);
    setMapMode(startInCanvasMode ? 'canvas' : 'main');
  };

  const handleDeleteMarker = (markerId: string) => {
    if (!activeMap) return;
    pushUndoSnapshot();
    onUpdateMap({
      ...activeMap,
      markers: activeMap.markers.filter((m) => m.id !== markerId)
    });
  };

  const filteredSymbols = useMemo(() => {
    return SYMBOL_LIBRARY.filter((sym) => {
      const matchesSet = symbolSetFilter === 'All' || sym.set === symbolSetFilter;
      const matchesSearch =
        !symbolSearch.trim() ||
        sym.name.toLowerCase().includes(symbolSearch.trim().toLowerCase());
      return matchesSet && matchesSearch;
    });
  }, [symbolSetFilter, symbolSearch]);

  // Compute transform for the outer Z-depth zoom-in blur wrapper (1.5s) and inner pan surface (0.8s)
  const mapZoomBlurWrapperStyle = useMemo<React.CSSProperties>(() => {
    if (zoomingMarker) {
      const targetScale = Math.max(2.65, mapZoom * 2.65);
      return {
        width: `${MAP_SURFACE_WIDTH}px`,
        height: `${MAP_SURFACE_HEIGHT}px`,
        transformOrigin: '50% 50%',
        transform: `perspective(900px) translate3d(0, 0, 180px) scale(${targetScale})`,
        filter: 'url(#map-depth-directional-blur) brightness(1.08)',
        transition:
          'transform 1500ms cubic-bezier(0.22, 1, 0.36, 1), filter 1500ms cubic-bezier(0.22, 1, 0.36, 1)'
      };
    }

    return {
      width: `${MAP_SURFACE_WIDTH}px`,
      height: `${MAP_SURFACE_HEIGHT}px`,
      transformOrigin: '50% 50%',
      transform: `scale(${mapZoom})`,
      filter: 'none',
      transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1), filter 500ms ease'
    };
  }, [zoomingMarker, mapZoom]);

  const mapSurfacePanStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: `${MAP_SURFACE_WIDTH}px`,
      height: `${MAP_SURFACE_HEIGHT}px`,
      backgroundColor: '#cfc8b8',
      transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
      transition: zoomingMarker
        ? 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)'
        : isPanningState
        ? 'none'
        : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)'
    };
  }, [panOffset.x, panOffset.y, zoomingMarker, isPanningState]);

  return (
    <div className="-mx-6 sm:-mx-8 -mt-22 sm:-mt-24 -mb-6 sm:-mb-8 h-screen bg-[#eef1f8] relative overflow-hidden select-none flex flex-col">
      <DepthDirectionalBlurSvgFilter
        filterId="map-depth-directional-blur"
        depthScale={zoomingMarker ? 95 : 0}
      />
      <input
        ref={fileUploadRef}
        type="file"
        accept="image/*"
        onChange={handleUploadMapFile}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* EMPTY STATE: Exact Match for Map_if_empty_302cf2ab.png               */}
      {/* ==================================================================== */}
      {!activeMap ? (
        <div className="flex-1 w-full h-full pt-20 pb-8 px-6 sm:px-10 flex flex-col">
          <div
            onClick={() => {
              if (!showCreateModal) setShowCreateModal(true);
            }}
            className="flex-1 w-full rounded-[32px] border border-[#cbd3e6] hover:border-[#738bbd] bg-gradient-to-br from-[#879fd0] via-[#7b93c4] to-[#738bbd] shadow-lg transition-all flex flex-col items-center justify-center cursor-pointer relative p-6"
          >
            {!showCreateModal ? (
              <div className="flex flex-col items-center justify-center text-center group">
                <Plus className="w-20 h-20 text-white stroke-[2.2] group-hover:scale-110 transition-transform duration-300" />
                <span className="mt-4 text-2xl sm:text-3xl font-serif text-white tracking-wide">
                  Add New Map
                </span>
              </div>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-[32px] bg-white/96 border border-[#cbd3e6] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-serif font-bold text-[#181b26]">Add New Map</h3>
                  <p className="text-xs text-[#52586e]">
                    Mulai dari kanvas kosong, muat peta referensi, atau unggah gambar peta Anda
                  </p>
                </div>

                <input
                  type="text"
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Nama Peta (mis. Maidens Continent, Kepulauan Utara)..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#f4f6fb] border border-[#cbd3e6] text-sm text-[#181b26] font-serif focus:outline-none focus:border-[#738bbd]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreateBlankMap(undefined, false, false)}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Compass className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Peta Referensi
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Buka Mode Utama dengan peta kontinen detail siap geser
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateBlankMap(undefined, true, true)}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Paintbrush className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Kanvas Kosong
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Lukis daratan multi-warna &amp; sungai dari awal di Canvas Mode
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Upload className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Upload Gambar
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Unggah gambar peta (.PNG / .JPG) dari perangkat Anda
                    </p>
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-xs text-[#52586e] hover:text-[#181b26] font-serif"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================================================================== */
        /* FILLED STATE: Oversized Freely Pannable Map + Smooth Mode Overlays */
        /* Matches Map_if_filled_a85407c7.png in Mode Utama                   */
        /* ================================================================== */
        <div
          ref={viewportFrameRef}
          onWheel={(e) => {
            if (zoomingMarker) return;
            if (e.ctrlKey || mapMode === 'main') {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.1 : -0.1;
              const nextZoom = Math.max(0.65, Math.min(2.2, Number((mapZoom + delta).toFixed(2))));
              setMapZoom(nextZoom);
              setPanOffset((prev) => clampPanOffset(prev.x, prev.y, nextZoom));
            }
          }}
          className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-[#eef1f8]"
        >
          {/* ============================================================== */}
          {/* OVERSIZED INTERACTIVE MAP SURFACE (Larger than Viewport Frame) */}
          {/* - Outer wrapper: 1.5s (1500ms) Z-depth directional zoom-in blur */}
          {/* - Inner canvas: 0.8s (800ms) pan shift to center target mark    */}
          {/* ============================================================== */}
          <div style={mapZoomBlurWrapperStyle} className="relative shrink-0">
            <div
              ref={containerRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={mapSurfacePanStyle}
              className={`relative shrink-0 rounded-sm shadow-[0_20px_60px_rgba(70,84,120,0.3)] select-none overflow-hidden border-[12px] border-[#d8be96] outline outline-2 outline-[#5e4629] ${
                mapMode === 'main'
                  ? mainInteractionMode === 'pin'
                    ? 'cursor-crosshair'
                    : isPanningState
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : activeTool === 'pan'
                  ? isPanningState
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : activeTool === 'select'
                  ? 'cursor-default'
                  : 'cursor-crosshair'
              }`}
            >
              <div className="absolute inset-2 border-2 border-[#6e5233] pointer-events-none z-40" />

            {/* Subtle Ocean Wave & Grid Pattern Background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="cartography-ocean-pattern"
                  width="48"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 0 16 Q 12 12 24 16 T 48 16"
                    fill="none"
                    stroke="#9e9585"
                    strokeWidth="0.9"
                  />
                  <path
                    d="M 0 32 L 48 32 M 48 0 L 48 32"
                    fill="none"
                    stroke="#b5ab9b"
                    strokeWidth="0.4"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cartography-ocean-pattern)" />
            </svg>

            {/* Optional Uploaded Background Image */}
            {uploadedBgUrl && (
              <img
                src={uploadedBgUrl}
                alt={activeMap.name}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[5]"
              />
            )}

            {/* LAYER 1: MULTI-COLOR PAINTED LANDMASS CANVAS */}
            <canvas
              ref={landCanvasRef}
              width={1200}
              height={750}
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-300 ${
                layerVisibility.Land ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                filter:
                  'drop-shadow(1px 0 0 #594128) drop-shadow(-1px 0 0 #594128) drop-shadow(0 1px 0 #594128) drop-shadow(0 -1px 0 #594128) drop-shadow(0 0 9px rgba(89,65,40,0.48))'
              }}
            />

            {/* LAYER 2: REGION TINT CANVAS */}
            <canvas
              ref={regionCanvasRef}
              width={1200}
              height={750}
              className={`absolute inset-0 w-full h-full pointer-events-none z-15 transition-opacity duration-300 ${
                layerVisibility.Regions ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* LAYER 2B: RIVER / LAKE / SEA WATER CANVAS */}
            <canvas
              ref={waterCanvasRef}
              width={1200}
              height={750}
              className={`absolute inset-0 w-full h-full pointer-events-none z-[18] transition-opacity duration-300 ${
                layerVisibility.Water ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                filter: 'drop-shadow(0 0 2px rgba(34, 62, 77, 0.7))'
              }}
            />

            {/* LAYER 3: PATHS */}
            {layerVisibility.Paths && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              >
                {[
                  ...paths,
                  ...(draftPathPts.length > 1
                    ? [
                        {
                          id: 'draft-path',
                          style: pathStyle,
                          color: pathStyle === 'river' ? selectedWaterColor : '#4a3623',
                          width: pathStyle === 'river' ? 3.5 : 2,
                          points: draftPathPts
                        }
                      ]
                    : [])
                ].map((p) => {
                  const d = p.points
                    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                    .join(' ');
                  return (
                    <path
                      key={p.id}
                      d={d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={p.width * 0.22}
                      strokeDasharray={p.style === 'dotted' ? '0.7 0.7' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}
              </svg>
            )}

            {/* LAYER 4: STAMPED CARTOGRAPHY SYMBOLS */}
            {layerVisibility.Symbols && (
              <div className="absolute inset-0 pointer-events-none z-25">
                {symbols.map((sym) => {
                  const def = SYMBOL_LIBRARY.find((s) => s.id === sym.typeId);
                  if (!def) return null;
                  const baseSize = 86 * (sym.scale || 1);
                  return (
                    <div
                      key={sym.id}
                      style={{
                        left: `${sym.x}%`,
                        top: `${sym.y}%`,
                        width: `${baseSize}px`,
                        height: `${baseSize}px`
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    >
                      {def.renderSvg(sym.scale, sym.color)}
                      {mapMode === 'canvas' && activeTool === 'select' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            pushUndoSnapshot();
                            const next = symbols.filter((s) => s.id !== sym.id);
                            setSymbols(next);
                            saveStudioState(activeMap.id, { symbols: next });
                          }}
                          className="pointer-events-auto hidden group-hover:flex absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white items-center justify-center text-xs shadow"
                          title="Hapus simbol"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* LAYER 5: SERIF CARTOGRAPHY TEXT LABELS */}
            {layerVisibility.Labels && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {labels.map((lbl) => (
                  <div
                    key={lbl.id}
                    style={{
                      left: `${lbl.x}%`,
                      top: `${lbl.y}%`,
                      fontSize: `${Math.round(28 * (lbl.scale || 1))}px`,
                      color: lbl.color
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 font-serif tracking-wide select-none group whitespace-nowrap drop-shadow-[0_2px_4px_rgba(25,18,10,0.85)] ${
                      lbl.curved ? 'italic -rotate-6' : 'font-semibold'
                    }`}
                  >
                    <span
                      style={{
                        WebkitTextStroke: '0.8px #2b1e10'
                      }}
                    >
                      {lbl.text}
                    </span>
                    {mapMode === 'canvas' && activeTool === 'select' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pushUndoSnapshot();
                          const next = labels.filter((l) => l.id !== lbl.id);
                          setLabels(next);
                          saveStudioState(activeMap.id, { labels: next });
                        }}
                        className="pointer-events-auto hidden group-hover:inline-flex ml-1.5 w-5 h-5 rounded-full bg-rose-600 text-white items-center justify-center text-xs align-middle"
                        title="Hapus label"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* LAYER 6: OVERLAY COMPASS ROSE */}
            {layerVisibility.Overlay && (
              <div className="absolute bottom-8 right-10 w-36 h-36 pointer-events-none z-30 opacity-85">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <line x1="18" y1="18" x2="82" y2="82" stroke="#6e3224" strokeWidth="1.6" />
                  <line x1="82" y1="18" x2="18" y2="82" stroke="#6e3224" strokeWidth="1.6" />
                  <polygon points="15,15 26,20 20,26" fill="#6e3224" />
                  <polygon points="85,15 74,20 80,26" fill="#6e3224" />
                  <polygon points="15,85 26,80 20,74" fill="#6e3224" />
                  <polygon points="85,85 74,80 80,74" fill="#6e3224" />
                  <text
                    x="50"
                    y="24"
                    textAnchor="middle"
                    fill="#3b2818"
                    className="font-serif text-[13px] font-bold"
                  >
                    N
                  </text>
                  <text
                    x="50"
                    y="84"
                    textAnchor="middle"
                    fill="#3b2818"
                    className="font-serif text-[13px] font-bold"
                  >
                    S
                  </text>
                  <text
                    x="20"
                    y="54"
                    textAnchor="middle"
                    fill="#3b2818"
                    className="font-serif text-[13px] font-bold"
                  >
                    W
                  </text>
                  <text
                    x="80"
                    y="54"
                    textAnchor="middle"
                    fill="#3b2818"
                    className="font-serif text-[13px] font-bold"
                  >
                    E
                  </text>
                </svg>
              </div>
            )}

            {/* LAYER 7: INTERACTIVE LOCATION MARKS (Click triggers 1.5s zoom-in blur to Location article) */}
            {layerVisibility.Locations && (
              <div className="absolute inset-0 pointer-events-none z-35">
                {activeMap.markers.map((marker) => {
                  const linkedLoc = locationArticles.find(
                    (a) =>
                      a.id === marker.linkedArticleId ||
                      a.title.toLowerCase() === marker.label.toLowerCase()
                  );
                  const locThumbUrl = String(
                    linkedLoc?.templateValues?.ThumbnailUrl ||
                      linkedLoc?.templateValues?.CustomIconUrl ||
                      ''
                  ).trim();
                  const isHovered = hoveredPinId === marker.id;

                  return (
                    <div
                      key={marker.id}
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
                      onMouseEnter={() => setHoveredPinId(marker.id)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (didDragPanRef.current) return;
                          handleTriggerLocationZoomTransition(marker);
                        }}
                        className="group flex flex-col items-center focus:outline-none"
                        title={`Klik untuk transisi menuju halaman Location: ${
                          linkedLoc?.title || marker.label
                        }`}
                      >
                        <div className="relative overflow-hidden min-w-[148px] max-w-[240px] px-3.5 py-2.5 rounded-2xl bg-[#5c688a] border border-white/75 text-white text-xs font-serif font-semibold shadow-[0_12px_30px_rgba(70,84,120,0.45)] flex items-center justify-between gap-2.5 group-hover:border-white group-hover:-translate-y-0.5 transition">
                          {/* Location Thumbnail as 50% Opacity Card Background (Matches Timeline UX) */}
                          <div
                            data-mark-thumb="true"
                            className="absolute inset-0 z-0 opacity-50 pointer-events-none overflow-hidden"
                          >
                            {locThumbUrl ? (
                              <img
                                src={locThumbUrl}
                                alt={linkedLoc?.title || marker.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#7792c4] via-[#6d7696] to-[#494a52]" />
                            )}
                          </div>

                          <div className="relative z-10 min-w-0 flex-1 text-left drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]">
                            <div className="text-[13px] font-bold text-white group-hover:text-[#f5dec0] truncate">
                              {linkedLoc?.title || marker.label}
                            </div>
                            <div className="text-[10px] text-white/90 font-sans font-medium flex items-center gap-1 mt-0.5">
                              <span>Location</span>
                              <ExternalLink className="w-2.5 h-2.5 text-white opacity-85" />
                            </div>
                          </div>
                        </div>
                        <div className="w-0.5 h-3.5 bg-white/85 group-hover:bg-white" />
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-[#6d7696] group-hover:border-[#4b67a1] shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center">
                          {locThumbUrl ? (
                            <img
                              src={locThumbUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5b74a8]" />
                          )}
                        </div>
                      </button>

                      {isHovered && !zoomingMarker && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-white/96 border border-[#cbd3e6] shadow-2xl text-left z-50"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                data-mark-thumb="true"
                                className="w-10 h-12 rounded-lg overflow-hidden border border-[#cbd3e6] bg-[#7792c4] shrink-0 flex items-center justify-center shadow-inner"
                              >
                                {locThumbUrl ? (
                                  <img
                                    src={locThumbUrl}
                                    alt={linkedLoc?.title || marker.label}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src="/assets/icons/location.png"
                                    alt=""
                                    className="w-5 h-5 object-contain opacity-90"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase tracking-wider text-[#5b74a8] font-semibold block">
                                  Tag Location Terhubung
                                </span>
                                <h4 className="text-xs font-serif font-bold text-[#181b26] mt-0.5 truncate">
                                  {linkedLoc?.title || marker.label}
                                </h4>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMarker(marker.id)}
                              className="text-[#52586e] hover:text-rose-600 p-1 shrink-0"
                              title="Hapus mark dari peta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {linkedLoc?.summary && (
                            <p className="text-[11px] text-[#52586e] line-clamp-2 mt-2">
                              {linkedLoc.summary}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTriggerLocationZoomTransition(marker)}
                            className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg bg-[#6d7696] hover:bg-[#5d6685] text-white text-[11px] font-serif font-semibold flex items-center justify-center gap-1.5 transition"
                          >
                            <span>Buka Halaman Location</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* MODE UTAMA MINIMALIST FLOATING HUD                             */}
          {/* Compact controls so the main map screen remains unobstructed   */}
          {/* ============================================================== */}
          <div
            className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mapMode === 'main' && !zoomingMarker
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-6'
            }`}
          >
            {/* Top-Left Minimalist Bar: "+ Add New Map", "(current map name)", "Beralih map" */}
            <div className="absolute top-[56px] left-5 flex flex-wrap items-center gap-2">
              {/* Pill 1: + Add New Map */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className={`h-8 px-3 rounded-full bg-white/95 hover:bg-[#f4f6fb] backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center gap-1.5 transition group ${
                  mapMode === 'main' && !zoomingMarker ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#5b74a8] stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-serif font-medium text-[#181b26] tracking-wide whitespace-nowrap">
                  Add New Map
                </span>
              </button>

              {/* Pill 2: (current map name) */}
              <div
                className={`h-8 px-3 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center ${
                  mapMode === 'main' && !zoomingMarker ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <input
                  type="text"
                  value={activeMap.name}
                  onChange={(e) =>
                    onUpdateMap({
                      ...activeMap,
                      name: e.target.value
                    })
                  }
                  placeholder="(current map name)"
                  className="w-32 sm:w-40 bg-transparent text-xs font-serif font-semibold text-[#181b26] text-center focus:outline-none truncate"
                  title="Klik untuk mengubah nama peta saat ini"
                />
              </div>

              {/* Pill 3: Beralih map */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSwitchMapMenu((prev) => !prev)}
                  className={`h-8 px-3 rounded-full bg-white/95 hover:bg-[#f4f6fb] backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center justify-center transition ${
                    mapMode === 'main' && !zoomingMarker ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  <span className="text-xs font-serif font-medium text-[#181b26] whitespace-nowrap">
                    Beralih map
                  </span>
                </button>

                {/* Dropdown Popover for "Beralih map" */}
                {showSwitchMapMenu && mapMode === 'main' && !zoomingMarker && (
                  <div className="pointer-events-auto absolute top-10 left-0 w-60 rounded-2xl bg-white/98 border border-[#cbd3e6] shadow-2xl p-2 space-y-1.5 z-40">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#52586e] font-semibold flex items-center justify-between">
                      <span>Daftar Peta ({worldMaps.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSwitchMapMenu(false)}
                        className="text-[#52586e] hover:text-[#181b26]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {worldMaps.map((m) => {
                        const isCurrent = m.id === activeMap.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-serif transition ${
                              isCurrent
                                ? 'bg-[#6d7696] text-white font-semibold border border-[#5d6685]'
                                : 'text-[#181b26] hover:bg-[#f4f6fb]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMapId(m.id);
                                setShowSwitchMapMenu(false);
                              }}
                              className="flex-1 text-left truncate"
                            >
                              {m.name}{' '}
                              <span
                                className={`text-[10px] ${
                                  isCurrent ? 'text-white/80' : 'text-[#52586e]'
                                }`}
                              >
                                ({m.markers.length} mark)
                              </span>
                            </button>
                            {worldMaps.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onDeleteMap(m.id)}
                                className={`${
                                  isCurrent
                                    ? 'text-white/80 hover:text-rose-200'
                                    : 'text-[#52586e] hover:text-rose-600'
                                } p-1`}
                                title="Hapus peta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top-Right Minimalist Pill: "Canvas Mode" */}
            <div className="absolute top-[56px] right-5">
              <button
                type="button"
                onClick={() => {
                  setShowSwitchMapMenu(false);
                  setShowPinPopover(false);
                  setMapMode('canvas');
                }}
                className={`h-8 px-3.5 rounded-full bg-[#6d7696] hover:bg-[#5d6685] backdrop-blur-md border border-[#8e98b8] shadow-md flex items-center justify-center transition ${
                  mapMode === 'main' && !zoomingMarker ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <span className="text-xs font-serif font-semibold text-white tracking-wide whitespace-nowrap">
                  Canvas Mode
                </span>
              </button>
            </div>

            {/* Bottom Minimalist Action Pill in Mode Utama: Pan/Explore, + Mark Lokasi, Zoom & Reset */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              {showPinPopover && mapMode === 'main' && !zoomingMarker && (
                <div
                  className={`w-72 p-3 rounded-2xl bg-white/96 border border-[#cbd3e6] shadow-2xl space-y-2 ${
                    mapMode === 'main' ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-serif text-[#4b67a1] font-semibold">
                    <span>Pilih Tag Location &amp; Klik Peta</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinPopover(false);
                        setMainInteractionMode('explore');
                      }}
                      className="text-[#52586e] hover:text-[#181b26]"
                    >
                      ✕
                    </button>
                  </div>

                  {locationArticles.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selLoc = locationArticles.find(
                          (l) => l.id === selectedLocationTagId
                        );
                        const selThumb = String(
                          selLoc?.templateValues?.ThumbnailUrl ||
                            selLoc?.templateValues?.CustomIconUrl ||
                            ''
                        ).trim();
                        return (
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#cbd3e6] bg-[#7792c4] shrink-0 flex items-center justify-center">
                            {selThumb ? (
                              <img
                                src={selThumb}
                                alt={selLoc?.title || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src="/assets/icons/location.png"
                                alt=""
                                className="w-4 h-4 object-contain opacity-90"
                              />
                            )}
                          </div>
                        );
                      })()}
                      <select
                        value={selectedLocationTagId}
                        onChange={(e) => {
                          setSelectedLocationTagId(e.target.value);
                          setMainInteractionMode('pin');
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-serif focus:outline-none focus:border-[#738bbd]"
                      >
                        {locationArticles.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#52586e]">
                      Belum ada tag Location. Buat judul lokasi baru di bawah:
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newLocationTagInput}
                      onChange={(e) => setNewLocationTagInput(e.target.value)}
                      placeholder="Buat tag Location baru..."
                      className="flex-1 px-2.5 py-1 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-serif focus:outline-none focus:border-[#738bbd]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLocationTagInput.trim()) return;
                        const created = onCreateLocationStub(newLocationTagInput.trim());
                        setSelectedLocationTagId(created.id);
                        setNewLocationTagInput('');
                        setMainInteractionMode('pin');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] text-white text-xs font-serif shrink-0"
                    >
                      + Buat
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-[#cbd3e6] shadow-md backdrop-blur-md ${
                  mapMode === 'main' && !zoomingMarker ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMainInteractionMode('explore');
                    setShowPinPopover(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-serif flex items-center gap-1 transition ${
                    mainInteractionMode === 'explore'
                      ? 'bg-[#6d7696] text-white font-semibold'
                      : 'text-[#52586e] hover:text-[#181b26]'
                  }`}
                >
                  <MousePointer className="w-3 h-3" />
                  <span>Geser Peta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = mainInteractionMode === 'pin' ? 'explore' : 'pin';
                    setMainInteractionMode(nextMode);
                    setShowPinPopover(nextMode === 'pin');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-serif flex items-center gap-1 transition ${
                    mainInteractionMode === 'pin'
                      ? 'bg-[#7792c4] text-white font-semibold'
                      : 'text-[#4b67a1] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>+ Mark ({activeMap.markers.length})</span>
                </button>

                <div className="h-3.5 w-px bg-[#cbd3e6] mx-0.5" />

                <button
                  type="button"
                  onClick={() =>
                    setMapZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))
                  }
                  className="px-1.5 py-0.5 rounded-full text-[11px] text-[#52586e] hover:text-[#181b26] hover:bg-[#f4f6fb] font-mono"
                  title="Perkecil tampilan peta"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMapZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="px-1.5 py-0.5 rounded-full text-[10px] text-[#181b26] font-semibold hover:bg-[#f4f6fb] font-mono"
                  title="Reset posisi & zoom tengah peta"
                >
                  {Math.round(mapZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMapZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))
                  }
                  className="px-1.5 py-0.5 rounded-full text-[11px] text-[#52586e] hover:text-[#181b26] hover:bg-[#f4f6fb] font-mono"
                  title="Perbesar tampilan peta"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* MODE KANVAS OVERLAYS: Smooth Slide-In Left, Right & Top Bars   */}
          {/* ============================================================== */}

          {/* Top Bar in Canvas Mode */}
          <div
            className={`absolute top-[64px] left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 border border-[#cbd3e6] shadow-2xl backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mapMode === 'canvas'
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-10 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={handleApplyCanvasToMainMap}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mode Utama Peta</span>
            </button>

            <div className="flex items-center bg-[#f4f6fb] border border-[#cbd3e6] rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-serif transition ${
                  undoStack.length > 0
                    ? 'text-[#181b26] hover:bg-[#e4eaf6]'
                    : 'text-[#b5bfd6] cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <div className="w-px h-4 bg-[#cbd3e6]" />
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-serif transition ${
                  redoStack.length > 0
                    ? 'text-[#181b26] hover:bg-[#e4eaf6]'
                    : 'text-[#b5bfd6] cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileUploadRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-xs text-[#181b26] font-serif transition"
            >
              <Upload className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Upload Gambar</span>
            </button>

            <button
              type="button"
              onClick={handleLoadReferenceContinent}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-xs text-[#181b26] font-serif transition"
              title="Muat contoh desain peta referensi"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Contoh Peta</span>
            </button>

            <button
              type="button"
              onClick={handleClearToBlankCanvas}
              className="p-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-[#52586e] hover:text-[#181b26] transition"
              title="Reset Kanvas Kosong"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left Dock in Canvas Mode: Layers & Cartography Brushes */}
          <div
            className={`absolute top-[64px] bottom-4 left-4 w-[172px] z-30 rounded-2xl bg-white/96 border border-[#cbd3e6] shadow-2xl backdrop-blur-md flex flex-col justify-between overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mapMode === 'canvas'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-full pointer-events-none'
            }`}
          >
            <div>
              {/* Layer Visibility Toggles */}
              <div className="py-2 border-b border-[#e2e7f3]">
                {(
                  [
                    { key: 'Land', label: 'Land' },
                    { key: 'Water', label: 'River / Perairan' },
                    { key: 'Paths', label: 'Paths' },
                    { key: 'Symbols', label: 'Symbols' },
                    { key: 'Regions', label: 'Regions' },
                    { key: 'Labels', label: 'Labels' },
                    { key: 'Overlay', label: 'Overlay' },
                    { key: 'Locations', label: 'Locations' }
                  ] as const
                ).map((layer) => {
                  const isVisible = layerVisibility[layer.key];
                  return (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...layerVisibility,
                          [layer.key]: !isVisible
                        };
                        setLayerVisibility(updated);
                        saveStudioState(activeMap.id, { layerVisibility: updated });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs font-sans transition ${
                        isVisible
                          ? 'text-[#181b26] font-medium hover:bg-[#f4f6fb]'
                          : 'text-[#52586e] hover:bg-[#f4f6fb]'
                      }`}
                    >
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-[#5b74a8] shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-[#b5bfd6] shrink-0" />
                      )}
                      <span className="truncate">{layer.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Primary Cartography Tool Buttons */}
              <div className="py-2 flex flex-col gap-1 px-1.5">
                {/* 0. Pan / Geser Peta */}
                <button
                  type="button"
                  onClick={() => setActiveTool('pan')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'pan'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                  title="Geser Peta (Atau tahan tombol Space + Drag)"
                >
                  <Compass
                    className={`w-4 h-4 shrink-0 ${
                      activeTool === 'pan' ? 'text-white' : 'text-[#5b74a8]'
                    }`}
                  />
                  <span className="truncate">Geser Peta (Pan)</span>
                </button>

                {/* 1. Multi-color Land Brush */}
                <button
                  type="button"
                  onClick={() => setActiveTool('land-brush')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'land-brush'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                  title="Land Brush — Lukis daratan dengan beragam pilihan warna"
                >
                  <Paintbrush
                    className="w-4 h-4 shrink-0"
                    style={{ color: selectedLandColor }}
                  />
                  <span className="truncate">Land Brush</span>
                </button>

                {/* 2. River / Perairan */}
                <button
                  type="button"
                  onClick={() => setActiveTool('water-brush')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'water-brush'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                  title="River / Perairan — Gambar sungai, danau, hingga laut"
                >
                  <Waves
                    className="w-4 h-4 shrink-0"
                    style={{ color: selectedWaterColor }}
                  />
                  <span className="truncate">River / Perairan</span>
                </button>

                {/* 3. Forests & Nature */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('symbols');
                    setSymbolSetFilter('Trees & Nature');
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'symbols' && symbolSetFilter === 'Trees & Nature'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <Trees className="w-4 h-4 shrink-0" />
                  <span>Forests</span>
                </button>

                {/* 4. Mountains & Peaks */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('symbols');
                    setSymbolSetFilter('Mountains');
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'symbols' && symbolSetFilter === 'Mountains'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <Mountain className="w-4 h-4 shrink-0" />
                  <span>Mountains</span>
                </button>

                {/* 5. Paths / Routes */}
                <button
                  type="button"
                  onClick={() => setActiveTool('paths')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'paths'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <RouteIcon className="w-4 h-4 shrink-0" />
                  <span>Paths</span>
                </button>

                {/* 6. Region Biome Tint */}
                <button
                  type="button"
                  onClick={() => setActiveTool('region-brush')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'region-brush'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded border border-[#cbd3e6] shrink-0"
                    style={{ backgroundColor: selectedLandColor }}
                  />
                  <span>Regions</span>
                </button>

                {/* 7. Labels */}
                <button
                  type="button"
                  onClick={() => setActiveTool('labels')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'labels'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <Type className="w-4 h-4 shrink-0" />
                  <span>Labels</span>
                </button>

                {/* 8. Eraser */}
                <button
                  type="button"
                  onClick={() => setActiveTool('eraser')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'eraser'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <Eraser className="w-4 h-4 shrink-0" />
                  <span>Eraser</span>
                </button>

                {/* 9. Mark Location */}
                <button
                  type="button"
                  onClick={() => setActiveTool('mark-location')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition mt-1 ${
                    activeTool === 'mark-location'
                      ? 'bg-[#7792c4] text-white border border-[#5b74a8] shadow-xs'
                      : 'bg-[#f4f6fb] text-[#4b67a1] hover:bg-[#e4eaf6] border border-[#cbd3e6]'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Mark Location</span>
                </button>

                {/* 10. Select / Click */}
                <button
                  type="button"
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTool === 'select'
                      ? 'bg-[#6d7696] text-white shadow-xs border border-[#5d6685]'
                      : 'text-[#181b26] hover:bg-[#f4f6fb]'
                  }`}
                >
                  <MousePointer className="w-4 h-4 shrink-0" />
                  <span>Select / Klik</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 border-t border-[#e2e7f3] text-[10px] text-[#52586e] leading-relaxed space-y-0.5">
              <div>
                • Undo: <code className="text-[#181b26] font-semibold">Ctrl+Z</code>
              </div>
              <div>
                • Redo: <code className="text-[#181b26] font-semibold">Ctrl+Shift+Z</code>
              </div>
              <div>
                • Pan: <code className="text-[#181b26] font-semibold">Space + Drag</code>
              </div>
            </div>
          </div>

          {/* Right Dock in Canvas Mode: Brushes, River/Water, Custom Colors, Symbols & Location Tag Picker */}
          <div
            className={`absolute top-[64px] bottom-4 right-4 w-[295px] z-30 rounded-2xl bg-white/96 border border-[#cbd3e6] shadow-2xl backdrop-blur-md p-3.5 flex flex-col justify-between space-y-4 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mapMode === 'canvas'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 translate-x-full pointer-events-none'
            }`}
          >
            <div className="space-y-4">
              {/* 1. Brush Size vs Symbol Scale Slider */}
              {activeTool === 'land-brush' ||
              activeTool === 'water-brush' ||
              activeTool === 'region-brush' ||
              activeTool === 'eraser' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#52586e] font-medium">
                    <span>
                      {activeTool === 'water-brush' ? 'Water / River Size' : 'Brush Size'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#f4f6fb] border border-[#cbd3e6] text-[#181b26] text-[11px] font-mono">
                      {brushSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={110}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-[#5b74a8] cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#52586e] font-medium">
                    <span>Symbol Scale</span>
                    <span className="px-2 py-0.5 rounded bg-[#f4f6fb] border border-[#cbd3e6] text-[#181b26] text-[11px] font-mono">
                      {symbolScale}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    value={symbolScale}
                    onChange={(e) => setSymbolScale(Number(e.target.value))}
                    className="w-full accent-[#5b74a8] cursor-pointer"
                  />
                </div>
              )}

              {/* If Mark Location Tool is active in Canvas Mode */}
              {activeTool === 'mark-location' && (
                <div className="p-3 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] space-y-2.5">
                  <div className="text-xs font-serif font-semibold text-[#4b67a1] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5b74a8]" />
                    <span>Pasang Mark Location</span>
                  </div>
                  {locationArticles.length > 0 && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selLoc = locationArticles.find(
                          (l) => l.id === selectedLocationTagId
                        );
                        const selThumb = String(
                          selLoc?.templateValues?.ThumbnailUrl ||
                            selLoc?.templateValues?.CustomIconUrl ||
                            ''
                        ).trim();
                        return (
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#cbd3e6] bg-[#7792c4] shrink-0 flex items-center justify-center">
                            {selThumb ? (
                              <img
                                src={selThumb}
                                alt={selLoc?.title || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src="/assets/icons/location.png"
                                alt=""
                                className="w-4 h-4 object-contain opacity-90"
                              />
                            )}
                          </div>
                        );
                      })()}
                      <select
                        value={selectedLocationTagId}
                        onChange={(e) => setSelectedLocationTagId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#cbd3e6] text-xs text-[#181b26] font-serif"
                      >
                        {locationArticles.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newLocationTagInput}
                      onChange={(e) => setNewLocationTagInput(e.target.value)}
                      placeholder="Tag lokasi baru..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#cbd3e6] text-xs text-[#181b26] font-serif"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLocationTagInput.trim()) return;
                        const created = onCreateLocationStub(newLocationTagInput.trim());
                        setSelectedLocationTagId(created.id);
                        setNewLocationTagInput('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#6d7696] hover:bg-[#5d6685] text-white text-xs font-serif"
                    >
                      + Buat
                    </button>
                  </div>
                </div>
              )}

              {/* 2A. RIVER / PERAIRAN CONTROLS */}
              <div className="p-3 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-semibold text-[#4b67a1] flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#5b74a8]" />
                    River / Perairan Brush
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTool('water-brush')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      activeTool === 'water-brush'
                        ? 'bg-[#6d7696] text-white'
                        : 'bg-white text-[#4b67a1] border border-[#cbd3e6]'
                    }`}
                  >
                    {activeTool === 'water-brush' ? 'Aktif' : 'Gunakan'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'river', label: 'Sungai' },
                      { id: 'lake', label: 'Danau' },
                      { id: 'sea', label: 'Laut' }
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setWaterSubMode(mode.id);
                        setActiveTool('water-brush');
                      }}
                      className={`py-1 px-2 rounded text-[11px] font-serif border transition ${
                        activeTool === 'water-brush' && waterSubMode === mode.id
                          ? 'bg-[#6d7696] border-[#5d6685] text-white font-semibold'
                          : 'bg-white border-[#cbd3e6] text-[#181b26] hover:bg-[#e4eaf6]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#52586e]">
                    <span>Warna Perairan</span>
                    <input
                      type="color"
                      value={selectedWaterColor}
                      onChange={(e) => {
                        setSelectedWaterColor(e.target.value);
                        setActiveTool('water-brush');
                      }}
                      className="w-5 h-5 rounded bg-transparent cursor-pointer border-0"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {WATER_COLORS.map((wc) => (
                      <button
                        key={wc.hex}
                        type="button"
                        onClick={() => {
                          setSelectedWaterColor(wc.hex);
                          setActiveTool('water-brush');
                        }}
                        style={{ backgroundColor: wc.hex }}
                        className={`h-5 rounded border transition ${
                          selectedWaterColor === wc.hex
                            ? 'border-[#181b26] ring-2 ring-[#5b74a8] scale-105'
                            : 'border-[#cbd3e6] opacity-85 hover:opacity-100'
                        }`}
                        title={wc.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2B. LAND BRUSH & REGION MULTI-COLOR PALETTE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#52586e] font-medium">
                  <span>Land Brush &amp; Custom Colors</span>
                  <label className="flex items-center gap-1 text-[10px] text-[#4b67a1] font-semibold cursor-pointer">
                    <span>Warna Bebas</span>
                    <input
                      type="color"
                      value={selectedLandColor}
                      onChange={(e) => {
                        setSelectedLandColor(e.target.value);
                        if (activeTool !== 'region-brush') {
                          setActiveTool('land-brush');
                        }
                      }}
                      className="w-5 h-5 rounded bg-transparent cursor-pointer border-0"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {LAND_AND_CUSTOM_COLORS.map((item) => (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => {
                        setSelectedLandColor(item.hex);
                        if (activeTool !== 'region-brush') {
                          setActiveTool('land-brush');
                        }
                      }}
                      style={{ backgroundColor: item.hex }}
                      className={`h-6 rounded border transition ${
                        selectedLandColor === item.hex
                          ? 'border-[#181b26] ring-2 ring-[#5b74a8] scale-105'
                          : 'border-[#cbd3e6] opacity-85 hover:opacity-100'
                      }`}
                      title={item.label}
                    />
                  ))}
                </div>
              </div>

              {/* 3. Collapsible > Advanced Controls */}
              <div className="border-t border-b border-[#e2e7f3] py-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs text-[#52586e] hover:text-[#181b26] font-medium w-full text-left"
                >
                  {showAdvanced ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <span>Advanced</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2.5 space-y-2.5 pl-2 border-l border-[#cbd3e6] text-xs">
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#52586e]">Path Style</span>
                      <div className="grid grid-cols-3 gap-1">
                        {(
                          [
                            { id: 'dotted', label: 'Dotted Sea' },
                            { id: 'solid', label: 'Solid Road' },
                            { id: 'river', label: 'Alur Sungai' }
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setPathStyle(st.id);
                              setActiveTool('paths');
                            }}
                            className={`px-2 py-1 rounded text-[10px] border ${
                              pathStyle === st.id
                                ? 'bg-[#6d7696] border-[#5d6685] text-white font-semibold'
                                : 'bg-[#f4f6fb] border-[#cbd3e6] text-[#52586e]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#52586e]">Teks Label Wilayah</span>
                      <input
                        type="text"
                        value={labelDraftText}
                        onChange={(e) => setLabelDraftText(e.target.value)}
                        onFocus={() => setActiveTool('labels')}
                        placeholder="Nama pegunungan / sungai / laut..."
                        className="w-full px-2.5 py-1.5 rounded bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-serif"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-[#52586e] pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={curvedLabel}
                          onChange={(e) => setCurvedLabel(e.target.checked)}
                        />
                        <span>Gaya Miring / Teluk (Italic Curved)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Set Filter & Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#52586e] w-10">Set</span>
                  <select
                    value={symbolSetFilter}
                    onChange={(e) => {
                      setSymbolSetFilter(e.target.value);
                      setActiveTool('symbols');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Trees & Nature">Trees &amp; Nature</option>
                    <option value="Mountains">Mountains</option>
                    <option value="Bridges & Structures">Bridges &amp; Settlements</option>
                    <option value="Ships & Creatures">Ships &amp; Creatures</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#52586e] w-10">Search</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={symbolSearch}
                      onChange={(e) => {
                        setSymbolSearch(e.target.value);
                        setActiveTool('symbols');
                      }}
                      placeholder="Cari simbol..."
                      className="w-full pl-2.5 pr-7 py-1.5 rounded bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-[#52586e] absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* 5. Symbols Palette Grid */}
              <div className="space-y-2">
                <div className="text-xs text-[#52586e] font-medium">Symbols Palette</div>
                <div className="grid grid-cols-3 gap-2">
                  {filteredSymbols.map((sym) => {
                    const isSelected =
                      activeTool === 'symbols' && selectedSymbolId === sym.id;
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => {
                          setSelectedSymbolId(sym.id);
                          setActiveTool('symbols');
                        }}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition aspect-square ${
                          isSelected
                            ? 'bg-[#e4eaf6] border-[#5b74a8] shadow-inner'
                            : 'bg-[#f4f6fb] border-[#cbd3e6] hover:border-[#738bbd]'
                        }`}
                        title={sym.name}
                      >
                        <div className="w-11 h-11 flex items-center justify-center">
                          {sym.renderSvg(1, selectedLandColor)}
                        </div>
                        <span className="text-[9px] text-[#52586e] truncate w-full text-center">
                          {sym.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Save & Return to Mode Utama Button at Bottom of Mode Kanvas */}
            <div className="pt-3 border-t border-[#e2e7f3]">
              <button
                type="button"
                onClick={handleApplyCanvasToMainMap}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Buka Mode Utama Peta</span>
              </button>
            </div>
          </div>

          {/* Modal for New Map Creation when triggered from "+ Add New Map" in Filled Mode */}
          {showCreateModal && (
            <div className="absolute inset-0 z-40 bg-[#181b26]/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-xl rounded-[32px] bg-white border border-[#cbd3e6] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-[#181b26]">Add New Map</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-[#52586e] hover:text-[#181b26] text-sm"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="text"
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Nama Peta Baru (mis. Benua Aethelgard, Kepulauan Utara)..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#f4f6fb] border border-[#cbd3e6] text-sm text-[#181b26] font-serif focus:outline-none focus:border-[#738bbd]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreateBlankMap(undefined, false, false)}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Compass className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Peta Referensi
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Mulai di Mode Utama dengan peta kontinen detail
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateBlankMap(undefined, true, true)}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Paintbrush className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Kanvas Kosong
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Lukis daratan &amp; sungai dari awal di Canvas Mode
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      fileUploadRef.current?.click();
                    }}
                    className="p-4 rounded-2xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-left space-y-1.5 transition"
                  >
                    <Upload className="w-5 h-5 text-[#5b74a8]" />
                    <div className="text-xs font-serif font-semibold text-[#181b26]">
                      Upload Gambar
                    </div>
                    <p className="text-[11px] text-[#52586e] leading-snug">
                      Unggah gambar peta dari perangkat Anda
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {savedToast && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#494a52] border border-white/30 text-white px-4 py-2 rounded-full text-xs font-serif flex items-center gap-2 shadow-xl">
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Desain kanvas berhasil disimpan ke Peta Utama!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
