import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  GitBranch,
  Clock,
  Calendar as CalendarIcon,
  LayoutGrid,
  Plus,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Eye,
  Edit3,
  CornerDownRight,
  ArrowUpLeft,
  Trash2,
  Link2,
  Moon,
  Sparkles
} from 'lucide-react';
import {
  World,
  Article,
  EntityRelationship,
  RelationshipCategory,
  WorldMap,
  MapMarker,
  TimelineEvent,
  CustomCalendar,
  WhiteboardBoard,
  WhiteboardNode
} from '../types/worldbuilding';

interface VisualWorldModuleProps {
  activeWorld: World;
  articles: Article[];
  relationships: EntityRelationship[];
  maps: WorldMap[];
  timelineEvents: TimelineEvent[];
  calendar: CustomCalendar;
  whiteboards: WhiteboardBoard[];
  initialTab?: 'maps' | 'relationships' | 'timelines' | 'chronicles' | 'whiteboards';
  onSelectArticle: (articleId: string) => void;
  onAddRelationship: (rel: EntityRelationship) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateMap: (updatedMap: WorldMap) => void;
  onAddTimelineEvent: (evt: TimelineEvent) => void;
  onUpdateCalendar: (cal: CustomCalendar) => void;
  onUpdateWhiteboard: (wb: WhiteboardBoard) => void;
}

export const VisualWorldModule: React.FC<VisualWorldModuleProps> = ({
  activeWorld,
  articles,
  relationships,
  maps,
  timelineEvents,
  calendar,
  whiteboards,
  initialTab = 'maps',
  onSelectArticle,
  onAddRelationship,
  onDeleteRelationship,
  onUpdateMap,
  onAddTimelineEvent,
  onUpdateCalendar,
  onUpdateWhiteboard
}) => {
  const [activeVisualTab, setActiveVisualTab] = useState<
    'maps' | 'relationships' | 'timelines' | 'chronicles' | 'whiteboards'
  >(initialTab);

  React.useEffect(() => {
    setActiveVisualTab(initialTab);
  }, [initialTab]);

  const worldArticles = useMemo(
    () => articles.filter((a) => a.worldId === activeWorld.id),
    [articles, activeWorld.id]
  );

  // ============================================================================
  // MODULE 06: INTERACTIVE MAP STATE
  // ============================================================================
  const worldMaps = useMemo(
    () => maps.filter((m) => m.worldId === activeWorld.id),
    [maps, activeWorld.id]
  );
  const [selectedMapId, setSelectedMapId] = useState<string>(worldMaps[0]?.id || 'map-aethelgard-world');
  const currentMap = useMemo(
    () => worldMaps.find((m) => m.id === selectedMapId) || worldMaps[0] || maps[0],
    [worldMaps, maps, selectedMapId]
  );
  const [mapMode, setMapMode] = useState<'explore' | 'edit'>('explore');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
    currentMap?.markers[0]?.id || null
  );
  const [newMarkerLabel, setNewMarkerLabel] = useState('');
  const [newMarkerType, setNewMarkerType] = useState<MapMarker['type']>('Location');
  const [newMarkerDesc, setNewMarkerDesc] = useState('');
  const [newMarkerArticleId, setNewMarkerArticleId] = useState('');
  const [newMarkerHiddenGM, setNewMarkerHiddenGM] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);

  const selectedMarker = useMemo(
    () => currentMap?.markers.find((m) => m.id === selectedMarkerId) || null,
    [currentMap, selectedMarkerId]
  );

  const handleToggleLayer = (layerId: string) => {
    if (!currentMap) return;
    const updatedLayers = currentMap.layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    onUpdateMap({ ...currentMap, layers: updatedLayers });
  };

  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mapMode !== 'edit' || !currentMap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingCoords({ x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) });
  };

  const handleCreateMarkerAtCoords = () => {
    if (!currentMap || !pendingCoords || !newMarkerLabel.trim()) return;
    const created: MapMarker = {
      id: `mk-${Date.now()}`,
      mapId: currentMap.id,
      label: newMarkerLabel.trim(),
      type: newMarkerType,
      layerId: currentMap.layers[0]?.id || 'lay-terrain',
      x: pendingCoords.x,
      y: pendingCoords.y,
      description: newMarkerDesc.trim() || `Cartographic pin in ${currentMap.name}.`,
      linkedArticleId: newMarkerArticleId || undefined,
      isHiddenGM: newMarkerHiddenGM
    };
    onUpdateMap({
      ...currentMap,
      markers: [...currentMap.markers, created]
    });
    setSelectedMarkerId(created.id);
    setNewMarkerLabel('');
    setNewMarkerDesc('');
    setPendingCoords(null);
  };

  // ============================================================================
  // MODULE 05: RELATIONSHIP MANAGEMENT & KNOWLEDGE GRAPH STATE
  // ============================================================================
  const [relCategory, setRelCategory] = useState<RelationshipCategory>('Character Relationship');
  const [newRelSource, setNewRelSource] = useState(worldArticles[0]?.id || '');
  const [newRelTarget, setNewRelTarget] = useState(worldArticles[1]?.id || '');
  const [newRelType, setNewRelType] = useState('Allied Pact');
  const [newRelScore, setNewRelScore] = useState(65);
  const [newRelDesc, setNewRelDesc] = useState('');

  const filteredRelationships = useMemo(
    () =>
      relationships.filter(
        (r) => r.worldId === activeWorld.id && r.category === relCategory
      ),
    [relationships, activeWorld.id, relCategory]
  );

  const handleCreateRelationship = () => {
    if (!newRelSource || !newRelTarget || newRelSource === newRelTarget) return;
    const created: EntityRelationship = {
      id: `rel-${Date.now()}`,
      worldId: activeWorld.id,
      category: relCategory,
      sourceArticleId: newRelSource,
      targetArticleId: newRelTarget,
      relationType: newRelType.trim() || 'Connected',
      score: newRelScore,
      generation: 2,
      description: newRelDesc.trim() || 'Canonical relationship registered in IP Graph.',
      bidirectional: true
    };
    onAddRelationship(created);
    setNewRelDesc('');
  };

  // ============================================================================
  // MODULE 07 & 08: TIMELINE, CUSTOM CALENDAR & SYNCHRONIZED CHRONICLES
  // ============================================================================
  const worldEvents = useMemo(
    () =>
      timelineEvents
        .filter((e) => e.worldId === activeWorld.id)
        .sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex || a.day - b.day),
    [timelineEvents, activeWorld.id]
  );
  const [selectedChronicleEventId, setSelectedChronicleEventId] = useState<string>(
    worldEvents[0]?.id || ''
  );
  const activeChronicleEvent = useMemo(
    () => worldEvents.find((e) => e.id === selectedChronicleEventId) || worldEvents[0] || null,
    [worldEvents, selectedChronicleEventId]
  );

  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtYear, setNewEvtYear] = useState(418);
  const [newEvtMonth, setNewEvtMonth] = useState(2);
  const [newEvtDay, setNewEvtDay] = useState(15);
  const [newEvtEra, setNewEvtEra] = useState('Current Era (418 SR)');
  const [newEvtLane, setNewEvtLane] = useState('Planetary History');
  const [newEvtSignificance, setNewEvtSignificance] =
    useState<TimelineEvent['significance']>('Major');
  const [newEvtSummary, setNewEvtSummary] = useState('');
  const [newEvtMarkerId, setNewEvtMarkerId] = useState('mk-sunspire');

  const handleCreateTimelineEvent = () => {
    if (!newEvtTitle.trim()) return;
    const evt: TimelineEvent = {
      id: `evt-${Date.now()}`,
      worldId: activeWorld.id,
      timelineId: 'tl-main',
      title: newEvtTitle.trim(),
      year: Number(newEvtYear),
      monthIndex: Number(newEvtMonth),
      day: Number(newEvtDay),
      durationDays: 1,
      era: newEvtEra,
      lane: newEvtLane,
      summary: newEvtSummary.trim() || 'Historical milestone recorded in chronicles.',
      linkedArticleIds: [],
      linkedMapId: currentMap?.id,
      linkedMarkerId: newEvtMarkerId,
      significance: newEvtSignificance
    };
    onAddTimelineEvent(evt);
    setSelectedChronicleEventId(evt.id);
    setNewEvtTitle('');
    setNewEvtSummary('');
  };

  // ============================================================================
  // MODULE 09: VISUAL DIAGRAM & INFINITE WHITEBOARD
  // ============================================================================
  const activeBoard = whiteboards[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    activeBoard?.nodes[0]?.id || null
  );
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<WhiteboardNode['type']>('sticky');
  const [newNodeContent, setNewNodeContent] = useState('');
  const [newNodeColor, setNewNodeColor] = useState('amber');
  const [edgeFromId, setEdgeFromId] = useState(activeBoard?.nodes[0]?.id || '');
  const [edgeToId, setEdgeToId] = useState(activeBoard?.nodes[1]?.id || '');
  const [edgeLabel, setEdgeLabel] = useState('Triggers');

  const handleAddWhiteboardNode = () => {
    if (!activeBoard || !newNodeTitle.trim()) return;
    const created: WhiteboardNode = {
      id: `wn-${Date.now()}`,
      boardId: activeBoard.id,
      type: newNodeType,
      title: newNodeTitle.trim(),
      content: newNodeContent.trim() || 'Visual planning note.',
      x: 80 + ((activeBoard.nodes.length * 140) % 580),
      y: 80 + ((activeBoard.nodes.length * 95) % 240),
      width: 230,
      height: 115,
      color: newNodeColor,
      layer: 'Default'
    };
    onUpdateWhiteboard({
      ...activeBoard,
      nodes: [...activeBoard.nodes, created]
    });
    setNewNodeTitle('');
    setNewNodeContent('');
  };

  const handleMoveWhiteboardNode = (nodeId: string, dx: number, dy: number) => {
    if (!activeBoard) return;
    onUpdateWhiteboard({
      ...activeBoard,
      nodes: activeBoard.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, x: Math.max(10, Math.min(720, n.x + dx)), y: Math.max(10, Math.min(340, n.y + dy)) }
          : n
      )
    });
  };

  const handleAddWhiteboardEdge = () => {
    if (!activeBoard || !edgeFromId || !edgeToId || edgeFromId === edgeToId) return;
    onUpdateWhiteboard({
      ...activeBoard,
      edges: [
        ...activeBoard.edges,
        {
          id: `we-${Date.now()}`,
          boardId: activeBoard.id,
          fromNodeId: edgeFromId,
          toNodeId: edgeToId,
          label: edgeLabel.trim() || 'Connected'
        }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Visual Worldbuilding Sub-Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{activeWorld.name}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              Visual Worldbuilding Suite (Modules 05 – 09)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {activeVisualTab === 'maps' && '06. Interactive Cartography & Nested Atlas'}
            {activeVisualTab === 'relationships' && '05. Entity Relationship Webs & IP Knowledge Graph'}
            {activeVisualTab === 'timelines' && '07. Parallel Timelines & Historical Eras'}
            {activeVisualTab === 'chronicles' && '08. Custom Lunar Calendar & Synchronized Chronicles'}
            {activeVisualTab === 'whiteboards' && '09. Visual Whiteboard & Architecture Canvas'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          {[
            { id: 'maps', label: 'Interactive Maps' },
            { id: 'relationships', label: 'Relationship Graphs' },
            { id: 'timelines', label: 'Timelines' },
            { id: 'chronicles', label: 'Calendar & Chronicles' },
            { id: 'whiteboards', label: 'Whiteboard Canvas' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setActiveVisualTab(
                  t.id as 'maps' | 'relationships' | 'timelines' | 'chronicles' | 'whiteboards'
                )
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeVisualTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: INTERACTIVE MAPS & NESTED CARTOGRAPHY (MODULE 06)             */}
      {/* ==================================================================== */}
      {activeVisualTab === 'maps' && currentMap && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Controls & Layers Sidebar */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                Nested Map Hierarchy (World → Region → City)
              </label>
              <div className="space-y-1.5">
                {maps.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMapId(m.id);
                      setSelectedMarkerId(m.markers[0]?.id || null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentMap.id === m.id
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {m.parentMapId && <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span className="truncate">{m.name}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">{m.scaleLevel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Switcher: Exploration vs Editing Mode */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cartography Mode
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMapMode('explore');
                    setPendingCoords(null);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    mapMode === 'explore'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Exploration Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('edit')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    mapMode === 'edit'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Editing Mode (Pin)
                </button>
              </div>
              {mapMode === 'edit' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  Click anywhere on the map canvas to drop a new location, character, or event marker.
                </p>
              )}
            </div>

            {/* Map Layers Toggle */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Active Map Layers ({currentMap.layers.filter((l) => l.visible).length}/{currentMap.layers.length})
              </div>
              {currentMap.layers.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer py-1"
                >
                  <span>{layer.name}</span>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => handleToggleLayer(layer.id)}
                    className="rounded border-slate-300"
                  />
                </label>
              ))}
            </div>

            {/* Selected Marker Inspector */}
            {selectedMarker && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Selected Pin · {selectedMarker.type} · ({selectedMarker.x}%, {selectedMarker.y}%)
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedMarker.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedMarker.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedMarker.linkedArticleId && (
                    <button
                      type="button"
                      onClick={() => onSelectArticle(selectedMarker.linkedArticleId!)}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                    >
                      Open Linked Wiki Article
                    </button>
                  )}
                  {selectedMarker.childMapId && (
                    <button
                      type="button"
                      onClick={() => setSelectedMapId(selectedMarker.childMapId!)}
                      className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg"
                    >
                      Drill Into Child Map →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pending New Marker Form when in Edit Mode */}
            {pendingCoords && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2.5">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                  New Marker at ({pendingCoords.x}%, {pendingCoords.y}%)
                </div>
                <input
                  type="text"
                  value={newMarkerLabel}
                  onChange={(e) => setNewMarkerLabel(e.target.value)}
                  placeholder="Marker Title (e.g. Watchtower of Vael)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                />
                <select
                  value={newMarkerType}
                  onChange={(e) => setNewMarkerType(e.target.value as MapMarker['type'])}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                >
                  <option value="Location">Location Marker</option>
                  <option value="Character">Character Position</option>
                  <option value="Event">Historical Event Pin</option>
                  <option value="Custom">Custom Hazard / Dungeon</option>
                </select>
                <select
                  value={newMarkerArticleId}
                  onChange={(e) => setNewMarkerArticleId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                >
                  <option value="">Link to Encyclopedia Article (optional)...</option>
                  {worldArticles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.templateType})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newMarkerDesc}
                  onChange={(e) => setNewMarkerDesc(e.target.value)}
                  placeholder="Description & lore notes..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                />
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={newMarkerHiddenGM}
                    onChange={(e) => setNewMarkerHiddenGM(e.target.checked)}
                  />
                  <span>Hidden GM / Secret Marker</span>
                </label>
                <button
                  type="button"
                  onClick={handleCreateMarkerAtCoords}
                  className="w-full py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                >
                  Save Marker to Map
                </button>
              </div>
            )}
          </div>

          {/* Interactive SVG Cartography Canvas */}
          <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-slate-950 rounded-xl overflow-hidden relative">
            {/* Top Floating Map Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{currentMap.name}</span>
                <span className="text-slate-400">· Scale: {currentMap.scaleLevel}</span>
                {currentMap.parentMapId && (
                  <button
                    type="button"
                    onClick={() => setSelectedMapId(currentMap.parentMapId!)}
                    className="inline-flex items-center gap-1 text-amber-400 hover:underline ml-2"
                  >
                    <ArrowUpLeft className="w-3.5 h-3.5" />
                    Return to Parent World Map
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono tabular-nums px-2">{Math.round(mapZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(1.8, Number((z + 0.2).toFixed(1))))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Map Viewport */}
            <div className="w-full h-[520px] overflow-auto bg-[#09111e] relative flex items-center justify-center">
              <svg
                viewBox="0 0 1000 620"
                onClick={handleMapCanvasClick}
                style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}
                className={`w-full h-full transition-transform duration-150 ${
                  mapMode === 'edit' ? 'cursor-crosshair' : 'cursor-grab'
                }`}
              >
                <defs>
                  <radialGradient id="calderaGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#e11d48" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#09111e" stopOpacity="0" />
                  </radialGradient>
                  <pattern id="cartoGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                {/* Coordinate Grid */}
                <rect width="1000" height="620" fill="url(#cartoGrid)" />

                {/* Terrain & Sky-Islands or Concentric Citadel Rings */}
                {currentMap.svgTheme === 'archipelago' ? (
                  <g>
                    {/* Northern Rim & Sunspire Continent */}
                    <path
                      d="M 140 110 Q 260 65 390 120 T 520 240 Q 460 340 310 320 T 130 220 Z"
                      fill="#162436"
                      stroke="#38bdf8"
                      strokeOpacity="0.35"
                      strokeWidth="2"
                    />
                    {/* Western Sky-Archipelago */}
                    <path
                      d="M 180 390 Q 280 370 350 440 T 270 540 Q 170 510 180 390 Z"
                      fill="#162436"
                      stroke="#38bdf8"
                      strokeOpacity="0.25"
                      strokeWidth="1.5"
                    />
                    {/* Shattered Caldera Crater */}
                    <circle cx="680" cy="384" r="145" fill="url(#calderaGlow)" />
                    <path
                      d="M 570 330 Q 670 250 790 320 T 780 470 Q 660 520 560 430 Z"
                      fill="#1f1629"
                      stroke="#f43f5e"
                      strokeOpacity="0.45"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  </g>
                ) : (
                  /* Concentric Rings of Sunspire Citadel */
                  <g>
                    <circle
                      cx="500"
                      cy="310"
                      r="240"
                      fill="#132032"
                      stroke="#f59e0b"
                      strokeOpacity="0.35"
                      strokeWidth="2"
                    />
                    <circle
                      cx="500"
                      cy="310"
                      r="165"
                      fill="#182940"
                      stroke="#38bdf8"
                      strokeOpacity="0.4"
                      strokeWidth="2"
                    />
                    <circle
                      cx="500"
                      cy="310"
                      r="85"
                      fill="#1e3450"
                      stroke="#fde68a"
                      strokeOpacity="0.6"
                      strokeWidth="2.5"
                    />
                  </g>
                )}

                {/* Trade Routes Layer */}
                {currentMap.layers.some((l) => l.category === 'Trade Routes' && l.visible) &&
                  currentMap.svgTheme === 'archipelago' && (
                    <g>
                      <path
                        d="M 240 124 Q 310 190 340 235 T 680 384"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="8 6"
                        strokeOpacity="0.65"
                      />
                    </g>
                  )}

                {/* Character Movement Track Layer */}
                {currentMap.layers.some((l) => l.category === 'Character Tracks' && l.visible) &&
                  currentMap.markers
                    .filter((m) => m.pathCoords && m.pathCoords.length > 1)
                    .map((m) => (
                      <polyline
                        key={`track-${m.id}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        points={m
                          .pathCoords!.map((pt) => `${pt.x * 10},${pt.y * 6.2}`)
                          .join(' ')}
                      />
                    ))}

                {/* Compass Rose */}
                <g transform="translate(915, 75)">
                  <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                  <polygon points="0,-24 6,-6 0,-10 -6,-6" fill="#f59e0b" />
                  <polygon points="0,24 6,6 0,10 -6,6" fill="#64748b" />
                  <text x="-4" y="-27" fill="#f8fafc" fontSize="10" fontFamily="monospace">
                    N
                  </text>
                </g>

                {/* Render Visible Markers */}
                {currentMap.markers
                  .filter((mk) => {
                    const layer = currentMap.layers.find((l) => l.id === mk.layerId);
                    return layer ? layer.visible : true;
                  })
                  .map((mk) => {
                    const cx = mk.x * 10;
                    const cy = mk.y * 6.2;
                    const isSelected = selectedMarker?.id === mk.id;
                    const pinColor = mk.isHiddenGM
                      ? '#f43f5e'
                      : mk.type === 'Character'
                      ? '#38bdf8'
                      : mk.type === 'Event'
                      ? '#a855f7'
                      : '#f59e0b';
                    return (
                      <g
                        key={mk.id}
                        transform={`translate(${cx}, ${cy})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarkerId(mk.id);
                        }}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx="0"
                            cy="0"
                            r="20"
                            fill="none"
                            stroke={pinColor}
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? 10 : 8}
                          fill={pinColor}
                          stroke="#0f172a"
                          strokeWidth="2.5"
                        />
                        <rect
                          x="14"
                          y="-12"
                          width={mk.label.length * 6.8 + 16}
                          height="22"
                          rx="4"
                          fill="rgba(15, 23, 42, 0.88)"
                          stroke={isSelected ? pinColor : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x="22"
                          y="3"
                          fill="#f8fafc"
                          fontSize="11"
                          fontWeight="600"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {mk.label}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: RELATIONSHIP MANAGEMENT & KNOWLEDGE GRAPH (MODULE 05)         */}
      {/* ==================================================================== */}
      {activeVisualTab === 'relationships' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls: Graph Mode & Add Connection */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Select Diagram Architecture
              </label>
              <div className="space-y-1.5">
                {(
                  [
                    'Character Relationship',
                    'Diplomacy Web',
                    'Family Tree',
                    'Content Tree'
                  ] as RelationshipCategory[]
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRelCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      relCategory === cat
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-mono tabular-nums text-[11px]">
                      {
                        relationships.filter(
                          (r) => r.worldId === activeWorld.id && r.category === cat
                        ).length
                      }{' '}
                      edges
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add New Entity Relationship */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                + Link Entities in {relCategory}
              </h3>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Source Entity</label>
                <select
                  value={newRelSource}
                  onChange={(e) => setNewRelSource(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  {worldArticles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.templateType})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Target Entity</label>
                <select
                  value={newRelTarget}
                  onChange={(e) => setNewRelTarget(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  {worldArticles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.templateType})
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newRelType}
                onChange={(e) => setNewRelType(e.target.value)}
                placeholder="Relationship Label (e.g. Blood Oath, Rivalry, Parent)"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Affinity / Diplomacy Score:{' '}
                  <span className="font-mono tabular-nums font-semibold">{newRelScore}</span> (-100 to +100)
                </label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={newRelScore}
                  onChange={(e) => setNewRelScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <input
                type="text"
                value={newRelDesc}
                onChange={(e) => setNewRelDesc(e.target.value)}
                placeholder="Context note..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={handleCreateRelationship}
                className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Register Connection
              </button>
            </div>
          </div>

          {/* Right Column: Visual Interactive Graph & Relationship Matrix */}
          <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-6">
            {/* Interactive SVG Network Diagram */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-950 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  Interactive {relCategory} Graph — Click any node to open its Encyclopedia entry
                </span>
                <span className="font-mono tabular-nums">{filteredRelationships.length} active links</span>
              </div>
              <svg viewBox="0 0 800 380" className="w-full h-[340px]">
                {/* Position articles around an ellipse */}
                {(() => {
                  const involvedIds = Array.from(
                    new Set(
                      filteredRelationships.flatMap((r) => [r.sourceArticleId, r.targetArticleId])
                    )
                  );
                  const nodes = involvedIds
                    .map((id) => worldArticles.find((a) => a.id === id))
                    .filter(Boolean) as Article[];
                  const coords: Record<string, { x: number; y: number }> = {};
                  nodes.forEach((node, idx) => {
                    const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
                    coords[node.id] = {
                      x: Math.round(400 + Math.cos(angle) * 240),
                      y: Math.round(190 + Math.sin(angle) * 125)
                    };
                  });

                  return (
                    <>
                      {/* Edges */}
                      {filteredRelationships.map((rel) => {
                        const s = coords[rel.sourceArticleId];
                        const t = coords[rel.targetArticleId];
                        if (!s || !t) return null;
                        const mx = (s.x + t.x) / 2;
                        const my = (s.y + t.y) / 2;
                        const strokeColor =
                          (rel.score ?? 0) < 0
                            ? '#f43f5e'
                            : (rel.score ?? 0) > 40
                            ? '#10b981'
                            : '#f59e0b';
                        return (
                          <g key={rel.id}>
                            <line
                              x1={s.x}
                              y1={s.y}
                              x2={t.x}
                              y2={t.y}
                              stroke={strokeColor}
                              strokeWidth="2"
                              strokeOpacity="0.75"
                            />
                            <rect
                              x={mx - 65}
                              y={my - 11}
                              width="130"
                              height="20"
                              rx="4"
                              fill="#0f172a"
                              stroke={strokeColor}
                              strokeWidth="1"
                            />
                            <text
                              x={mx}
                              y={my + 3}
                              textAnchor="middle"
                              fill="#e2e8f0"
                              fontSize="10"
                              fontFamily="Plus Jakarta Sans, sans-serif"
                            >
                              {rel.relationType.slice(0, 20)}
                              {rel.score !== undefined ? ` (${rel.score > 0 ? '+' : ''}${rel.score})` : ''}
                            </text>
                          </g>
                        );
                      })}

                      {/* Nodes */}
                      {nodes.map((node) => {
                        const pt = coords[node.id];
                        return (
                          <g
                            key={node.id}
                            transform={`translate(${pt.x}, ${pt.y})`}
                            onClick={() => onSelectArticle(node.id)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx="0"
                              cy="0"
                              r="24"
                              fill="#1e293b"
                              stroke="#f59e0b"
                              strokeWidth="2"
                            />
                            <text
                              x="0"
                              y="4"
                              textAnchor="middle"
                              fill="#fde68a"
                              fontSize="11"
                              fontWeight="700"
                            >
                              {node.title
                                .split(' ')
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')}
                            </text>
                            <text
                              x="0"
                              y="40"
                              textAnchor="middle"
                              fill="#f8fafc"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {node.title}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Tabular Relationship Ledger */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Registered {relCategory} Ledger
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {filteredRelationships.map((rel) => {
                  const sArt = worldArticles.find((a) => a.id === rel.sourceArticleId);
                  const tArt = worldArticles.find((a) => a.id === rel.targetArticleId);
                  return (
                    <div
                      key={rel.id}
                      className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                          <button
                            type="button"
                            onClick={() => sArt && onSelectArticle(sArt.id)}
                            className="hover:underline text-amber-600 dark:text-amber-400"
                          >
                            {sArt?.title || rel.sourceArticleId}
                          </button>
                          <span className="text-slate-400">↔</span>
                          <button
                            type="button"
                            onClick={() => tArt && onSelectArticle(tArt.id)}
                            className="hover:underline text-amber-600 dark:text-amber-400"
                          >
                            {tArt?.title || rel.targetArticleId}
                          </button>
                          <span className="text-slate-400">·</span>
                          <span>{rel.relationType}</span>
                          {rel.score !== undefined && (
                            <span className="font-mono tabular-nums text-slate-500">
                              (Score: {rel.score > 0 ? `+${rel.score}` : rel.score})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">{rel.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteRelationship(rel.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3 & 4: TIMELINES, CUSTOM CALENDAR & SYNCHRONIZED CHRONICLES      */}
      {/* ==================================================================== */}
      {(activeVisualTab === 'timelines' || activeVisualTab === 'chronicles') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chronological Event Stream + Add Event */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Chronological History ({worldEvents.length} Events)
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                Calendar: {calendar.name}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
              {worldEvents.map((evt) => {
                const isSelected = activeChronicleEvent?.id === evt.id;
                const monthName =
                  calendar.months[evt.monthIndex]?.name || `Month ${evt.monthIndex + 1}`;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSelectedChronicleEventId(evt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        Year {evt.year} SR · {monthName} Day {evt.day}
                      </span>
                      <span>
                        {evt.era} · {evt.lane}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {evt.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Add Historical Event Form */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                + Record Historical Event
              </h3>
              <input
                type="text"
                value={newEvtTitle}
                onChange={(e) => setNewEvtTitle(e.target.value)}
                placeholder="Event Title (e.g. Treaty of the Three Spires)"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Year (SR)</label>
                  <input
                    type="number"
                    value={newEvtYear}
                    onChange={(e) => setNewEvtYear(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Month</label>
                  <select
                    value={newEvtMonth}
                    onChange={(e) => setNewEvtMonth(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  >
                    {calendar.months.map((m, idx) => (
                      <option key={m.name} value={idx}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newEvtDay}
                    onChange={(e) => setNewEvtDay(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newEvtLane}
                  onChange={(e) => setNewEvtLane(e.target.value)}
                  placeholder="Parallel Lane (e.g. Imperial Politics)"
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                />
                <select
                  value={newEvtMarkerId}
                  onChange={(e) => setNewEvtMarkerId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                >
                  {maps[0]?.markers.map((m) => (
                    <option key={m.id} value={m.id}>
                      Map Pin: {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newEvtSummary}
                onChange={(e) => setNewEvtSummary(e.target.value)}
                placeholder="Historical summary & consequences..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={handleCreateTimelineEvent}
                className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Add Event to Timeline &amp; Chronicles
              </button>
            </div>
          </div>

          {/* Right Column: Synchronized Chronicles View (Calendar + Lunar Cycles + Auto-Focused Map) */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-6">
            {activeChronicleEvent && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                    <span>CHRONICLES SYNCHRONIZER</span>
                    <span>·</span>
                    <span>
                      Year {activeChronicleEvent.year} SR,{' '}
                      {calendar.months[activeChronicleEvent.monthIndex]?.name} Day{' '}
                      {activeChronicleEvent.day}
                    </span>
                    <span>·</span>
                    <span>Duration: {activeChronicleEvent.durationDays}d</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {activeChronicleEvent.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {activeChronicleEvent.summary}
                  </p>
                  {activeChronicleEvent.linkedArticleIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                      <span>Participating Entities:</span>
                      {activeChronicleEvent.linkedArticleIds.map((id, i) => {
                        const art = worldArticles.find((a) => a.id === id);
                        if (!art) return null;
                        return (
                          <React.Fragment key={id}>
                            {i > 0 && <span>·</span>}
                            <button
                              type="button"
                              onClick={() => onSelectArticle(art.id)}
                              className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                            >
                              {art.title}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Synchronized Map Spotlight for Event Location */}
                {(() => {
                  const targetMap = maps[0];
                  const targetMarker =
                    targetMap?.markers.find((m) => m.id === activeChronicleEvent.linkedMarkerId) ||
                    targetMap?.markers[0];
                  return (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400">
                          Synchronized Cartographic Locus: {targetMarker?.label || 'World Center'}
                        </span>
                        <span className="font-mono tabular-nums text-slate-400">
                          Auto-focused at ({targetMarker?.x ?? 50}%, {targetMarker?.y ?? 50}%)
                        </span>
                      </div>
                      <svg viewBox="0 0 600 180" className="w-full h-36 rounded-lg bg-[#09111e]">
                        <path
                          d="M 80 30 Q 180 15 260 55 T 340 130 Q 220 155 110 115 Z"
                          fill="#162436"
                          stroke="#38bdf8"
                          strokeOpacity="0.4"
                        />
                        <circle
                          cx={(targetMarker?.x ?? 50) * 6}
                          cy={(targetMarker?.y ?? 50) * 1.8}
                          r="24"
                          fill="rgba(245, 158, 11, 0.2)"
                          stroke="#f59e0b"
                          strokeDasharray="4 3"
                        />
                        <circle
                          cx={(targetMarker?.x ?? 50) * 6}
                          cy={(targetMarker?.y ?? 50) * 1.8}
                          r="7"
                          fill="#f59e0b"
                        />
                        <text
                          x={(targetMarker?.x ?? 50) * 6 + 14}
                          y={(targetMarker?.y ?? 50) * 1.8 + 4}
                          fill="#fde68a"
                          fontSize="12"
                          fontWeight="600"
                        >
                          {targetMarker?.label} ({activeChronicleEvent.year} SR)
                        </text>
                      </svg>
                    </div>
                  );
                })()}

                {/* Custom Calendar & Lunar Orbital State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {calendar.name} — Month of{' '}
                      {calendar.months[activeChronicleEvent.monthIndex]?.name}
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px] text-slate-500">
                      {calendar.weekdays.map((wd) => (
                        <div key={wd} className="truncate font-medium">
                          {wd.slice(0, 3)}
                        </div>
                      ))}
                      {Array.from(
                        { length: calendar.months[activeChronicleEvent.monthIndex]?.days || 30 },
                        (_, i) => i + 1
                      ).map((dayNum) => {
                        const isEventDay = dayNum === activeChronicleEvent.day;
                        return (
                          <div
                            key={dayNum}
                            className={`py-1 rounded font-mono tabular-nums ${
                              isEventDay
                                ? 'bg-amber-600 text-white font-bold'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multi-Moon Phase Calculator */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-amber-500" />
                      Celestial &amp; Lunar Alignment on Day {activeChronicleEvent.day}
                    </div>
                    <div className="space-y-2">
                      {calendar.moons.map((moon) => {
                        const totalDays =
                          activeChronicleEvent.year * 180 +
                          activeChronicleEvent.monthIndex * 30 +
                          activeChronicleEvent.day;
                        const phasePct = Math.round(((totalDays % moon.cycleDays) / moon.cycleDays) * 100);
                        const phaseLabel =
                          phasePct < 15 || phasePct > 85
                            ? 'New / Conjunction'
                            : phasePct >= 40 && phasePct <= 60
                            ? 'Full Luminance'
                            : 'Crescent / Gibbous';
                        return (
                          <div
                            key={moon.name}
                            className="flex items-center justify-between text-xs p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {moon.name}
                              </span>
                              <span className="text-slate-400 ml-1.5 font-mono tabular-nums">
                                ({moon.cycleDays}d cycle)
                              </span>
                            </div>
                            <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                              {phaseLabel} ({phasePct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: VISUAL DIAGRAM & WHITEBOARD CANVAS (MODULE 09)                */}
      {/* ==================================================================== */}
      {activeVisualTab === 'whiteboards' && activeBoard && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Whiteboard Sidebar */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activeBoard.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: {activeBoard.category} · {activeBoard.nodes.length} cards ·{' '}
                {activeBoard.edges.length} connectors
              </p>
            </div>

            {/* Add Card to Canvas */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                + Add Card / Sticky Note to Canvas
              </h3>
              <input
                type="text"
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                placeholder="Card Title..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as WhiteboardNode['type'])}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="sticky">Sticky Note</option>
                  <option value="entity">Entity Reference Card</option>
                  <option value="article">Article Excerpt Card</option>
                  <option value="map">Map Coordinate Card</option>
                </select>
                <select
                  value={newNodeColor}
                  onChange={(e) => setNewNodeColor(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="amber">Amber Gold</option>
                  <option value="sky">Aether Sky</option>
                  <option value="emerald">Emerald</option>
                  <option value="rose">Crimson Rose</option>
                  <option value="slate">Slate Neutral</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={newNodeContent}
                onChange={(e) => setNewNodeContent(e.target.value)}
                placeholder="Card body notes..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddWhiteboardNode}
                className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Place Card on Whiteboard
              </button>
            </div>

            {/* Connect Two Nodes */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                + Connect Two Cards with Arrow
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={edgeFromId}
                  onChange={(e) => setEdgeFromId(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                >
                  {activeBoard.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      From: {n.title}
                    </option>
                  ))}
                </select>
                <select
                  value={edgeToId}
                  onChange={(e) => setEdgeToId(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                >
                  {activeBoard.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      To: {n.title}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={edgeLabel}
                onChange={(e) => setEdgeLabel(e.target.value)}
                placeholder="Connector label (e.g. Causes, Secretly Funds)"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              />
              <button
                type="button"
                onClick={handleAddWhiteboardEdge}
                className="w-full py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
              >
                Add Connector Line
              </button>
            </div>
          </div>

          {/* Whiteboard Interactive Canvas */}
          <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-slate-950 rounded-xl p-4 overflow-x-auto">
            <div className="relative w-[940px] h-[470px] bg-[#0b1322] rounded-lg border border-slate-800 overflow-hidden">
              {/* SVG Connector Arrows Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {activeBoard.edges.map((edge) => {
                  const fromNode = activeBoard.nodes.find((n) => n.id === edge.fromNodeId);
                  const toNode = activeBoard.nodes.find((n) => n.id === edge.toNodeId);
                  if (!fromNode || !toNode) return null;
                  const x1 = fromNode.x + fromNode.width / 2;
                  const y1 = fromNode.y + fromNode.height / 2;
                  const x2 = toNode.x + toNode.width / 2;
                  const y2 = toNode.y + toNode.height / 2;
                  return (
                    <g key={edge.id}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 6}
                        textAnchor="middle"
                        fill="#fde68a"
                        fontSize="11"
                        fontFamily="monospace"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Positioned Cards */}
              {activeBoard.nodes.map((node) => {
                const borderColors: Record<string, string> = {
                  amber: 'border-amber-500/50 bg-slate-900/95',
                  sky: 'border-sky-500/50 bg-slate-900/95',
                  emerald: 'border-emerald-500/50 bg-slate-900/95',
                  rose: 'border-rose-500/50 bg-slate-900/95',
                  slate: 'border-slate-700 bg-slate-900/95'
                };
                return (
                  <div
                    key={node.id}
                    style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${node.width}px` }}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`absolute p-3 rounded-xl border ${
                      borderColors[node.color] || borderColors.slate
                    } text-slate-100 shadow-md transition-transform`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="uppercase tracking-wider">{node.type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveWhiteboardNode(node.id, -30, 0)}
                          className="px-1 hover:text-white"
                          title="Nudge Left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveWhiteboardNode(node.id, 30, 0)}
                          className="px-1 hover:text-white"
                          title="Nudge Right"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveWhiteboardNode(node.id, 0, -25)}
                          className="px-1 hover:text-white"
                          title="Nudge Up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveWhiteboardNode(node.id, 0, 25)}
                          className="px-1 hover:text-white"
                          title="Nudge Down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white">{node.title}</div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{node.content}</p>
                    {node.linkedEntityId && (
                      <button
                        type="button"
                        onClick={() => onSelectArticle(node.linkedEntityId!)}
                        className="mt-2 text-[11px] font-medium text-amber-400 hover:underline"
                      >
                        Inspect Wiki Entity →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
