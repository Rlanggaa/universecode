import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Upload,
  Check,
  GitBranch,
  Link2,
  ExternalLink,
  Edit3,
  MousePointer,
  X
} from 'lucide-react';
import { Article, World } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

export type FixedRelationshipTypeId =
  | 'antarkarakter'
  | 'sosial_hierarki'
  | 'politik_diplomasi'
  | 'manusia_institusi'
  | 'makhluk_alam';

export type SupportedRelationshipTagTab =
  | 'characters'
  | 'conditions'
  | 'locations'
  | 'organizations'
  | 'species'
  | 'cosmics';

export interface FixedRelationshipTypeDefinition {
  id: FixedRelationshipTypeId;
  indexNumber: number;
  name: string;
  shortName: string;
  description: string;
  supportedTabs: SupportedRelationshipTagTab[];
  supportedLabelsText: string;
  accentColor: string;
}

export const FIXED_WORLD_RELATIONSHIP_TYPES: FixedRelationshipTypeDefinition[] = [
  {
    id: 'antarkarakter',
    indexNumber: 1,
    name: 'Hubungan Antarkarakter',
    shortName: 'Antarkarakter',
    description:
      'Jaringan relasi personal, ikatan darah, rivalitas, aliansi, serta kondisi yang mengikat antarkarakter.',
    supportedTabs: ['characters', 'conditions'],
    supportedLabelsText: 'Character & Condition',
    accentColor: '#d4a672'
  },
  {
    id: 'sosial_hierarki',
    indexNumber: 2,
    name: 'Hubungan Sosial dan Hierarki Kelas',
    shortName: 'Sosial & Hierarki Kelas',
    description:
      'Struktur stratifikasi sosial, kasta, penguasaan wilayah, serta kondisi sosial antar lokasi.',
    supportedTabs: ['locations', 'conditions'],
    supportedLabelsText: 'Location & Condition',
    accentColor: '#6bc294'
  },
  {
    id: 'politik_diplomasi',
    indexNumber: 3,
    name: 'Hubungan Politik dan Diplomasi',
    shortName: 'Politik & Diplomasi',
    description:
      'Perjanjian kedaulatan, poros geopolitik, konflik perbatasan, serta kondisi diplomatik antar lokasi.',
    supportedTabs: ['locations', 'conditions'],
    supportedLabelsText: 'Location & Condition',
    accentColor: '#d97780'
  },
  {
    id: 'manusia_institusi',
    indexNumber: 4,
    name: 'Hubungan Manusia dengan Institusi',
    shortName: 'Manusia & Institusi',
    description:
      'Keanggotaan, kepemimpinan, patronase, maupun perlawanan antara tokoh karakter dan organisasi/institusi.',
    supportedTabs: ['characters', 'organizations'],
    supportedLabelsText: 'Character & Organization',
    accentColor: '#e0c170'
  },
  {
    id: 'makhluk_alam',
    indexNumber: 5,
    name: 'Hubungan Makhluk Hidup dengan Alam',
    shortName: 'Makhluk Hidup & Alam',
    description:
      'Ekologi, simbiosis, hukum kosmik, dan kondisi alam yang menghubungkan karakter, spesies, entitas kosmik, serta kondisi.',
    supportedTabs: ['characters', 'species', 'cosmics', 'conditions'],
    supportedLabelsText: 'Character, Species, Cosmic & Condition',
    accentColor: '#a98bd4'
  }
];

export const TAG_TAB_METADATA: Record<
  SupportedRelationshipTagTab,
  {
    label: string;
    indonesianLabel: string;
    articleCategory: string;
    templateType: string;
    badgeClass: string;
    borderGlow: string;
    dotColor: string;
  }
> = {
  characters: {
    label: 'Character',
    indonesianLabel: 'Karakter',
    articleCategory: 'Characters',
    templateType: 'Character',
    badgeClass: 'bg-[#5c4028] text-[#ebd5b8] border border-[#8c6543]/60',
    borderGlow: 'border-[#c49a6c]/55 hover:border-[#ebd0a8]',
    dotColor: '#d4a672'
  },
  conditions: {
    label: 'Condition',
    indonesianLabel: 'Kondisi',
    articleCategory: 'Conditions',
    templateType: 'Condition / State',
    badgeClass: 'bg-[#63242b] text-[#f2c4c9] border border-[#963c46]/60',
    borderGlow: 'border-[#b8656e]/55 hover:border-[#f09ca5]',
    dotColor: '#d97780'
  },
  locations: {
    label: 'Location',
    indonesianLabel: 'Lokasi',
    articleCategory: 'Locations',
    templateType: 'Location - Settlement / City',
    badgeClass: 'bg-[#2f5741] text-[#c5ebd5] border border-[#498262]/60',
    borderGlow: 'border-[#6da888]/55 hover:border-[#9ee0bc]',
    dotColor: '#6bc294'
  },
  organizations: {
    label: 'Organization',
    indonesianLabel: 'Organisasi',
    articleCategory: 'Organizations',
    templateType: 'Organization / Faction',
    badgeClass: 'bg-[#594a24] text-[#f0e0b6] border border-[#8c763e]/60',
    borderGlow: 'border-[#cbb06b]/55 hover:border-[#f2d994]',
    dotColor: '#e0c170'
  },
  species: {
    label: 'Species',
    indonesianLabel: 'Spesies',
    articleCategory: 'Species',
    templateType: 'Species / Race',
    badgeClass: 'bg-[#254e63] text-[#bde3f7] border border-[#3e7d9c]/60',
    borderGlow: 'border-[#63a4c7]/55 hover:border-[#9ad4f5]',
    dotColor: '#6cc0e6'
  },
  cosmics: {
    label: 'Cosmic',
    indonesianLabel: 'Kosmik',
    articleCategory: 'Cosmics',
    templateType: 'Cosmic / Planar Entity',
    badgeClass: 'bg-[#462f5e] text-[#dec5f5] border border-[#6f4e91]/60',
    borderGlow: 'border-[#9678b8]/55 hover:border-[#c9aef0]',
    dotColor: '#a98bd4'
  }
};

export interface RelationshipGraphNode {
  id: string;
  worldId: string;
  relationshipTypeId: FixedRelationshipTypeId;
  title: string;
  tagTab: SupportedRelationshipTagTab;
  roleSubtitle: string;
  summary: string;
  thumbnailUrl?: string;
  linkedArticleId?: string;
  xPx: number;
  yPx: number;
}

export interface RelationshipGraphEdge {
  id: string;
  worldId: string;
  relationshipTypeId: FixedRelationshipTypeId;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  lineStyle: 'branch' | 'direct' | 'dashed';
  direction: 'directed' | 'bidirectional';
  color?: string;
}

interface RelationshipStudioViewProps {
  activeWorld: World;
  articles: Article[];
  onStartZoomTransition?: () => void;
  onNavigateToTagPage: (articleId: string, targetTab: SupportedRelationshipTagTab) => void;
  onCreateOrSyncTagArticle: (payload: {
    id?: string;
    worldId: string;
    title: string;
    tagTab: SupportedRelationshipTagTab;
    summary: string;
    thumbnailUrl?: string;
  }) => Article;
  historyRevision?: number;
}

const LOCAL_RELATIONSHIP_STUDIO_KEY = 'alt_universe_relationship_studio_v1';

const renderDefaultTagArtwork = (tab: SupportedRelationshipTagTab, index: number) => {
  if (tab === 'characters' || index % 4 === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="relCharBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c99768" />
            <stop offset="55%" stopColor="#6b4835" />
            <stop offset="100%" stopColor="#1e1624" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#relCharBg)" />
        <circle cx="50" cy="36" r="16" fill="#231820" opacity="0.85" />
        <path d="M22,92 C22,64 78,64 78,92 Z" fill="#231820" opacity="0.85" />
      </svg>
    );
  }
  if (tab === 'locations' || tab === 'species') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="relLocBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6da888" />
            <stop offset="60%" stopColor="#2f5741" />
            <stop offset="100%" stopColor="#171f24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#relLocBg)" />
        <polygon points="8,82 38,36 68,82" fill="#1d3328" opacity="0.8" />
        <polygon points="42,82 72,44 96,82" fill="#16261e" opacity="0.9" />
      </svg>
    );
  }
  if (tab === 'cosmics') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="relCosmicBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8d6ec4" />
            <stop offset="55%" stopColor="#462f5e" />
            <stop offset="100%" stopColor="#14111f" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#relCosmicBg)" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#ebd5b3" strokeWidth="2" opacity="0.6" />
        <circle cx="50" cy="50" r="9" fill="#ebd5b3" opacity="0.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
      <defs>
        <linearGradient id="relCondBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c46872" />
          <stop offset="60%" stopColor="#63242b" />
          <stop offset="100%" stopColor="#1f141b" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#relCondBg)" />
      <polygon points="50,18 80,50 50,82 20,50" fill="#2b1419" opacity="0.75" />
    </svg>
  );
};

export const RelationshipStudioView: React.FC<RelationshipStudioViewProps> = ({
  activeWorld,
  articles,
  onStartZoomTransition,
  onNavigateToTagPage,
  onCreateOrSyncTagArticle,
  historyRevision = 0
}) => {
  const SURFACE_WIDTH = 2600;
  const SURFACE_HEIGHT = 1400;
  const isRestoringRef = useRef<boolean>(false);

  // Fixed 5 Relationship Types — user cannot create a 6th container, only switch between the 5
  const [selectedRelTypeId, setSelectedRelTypeId] = useState<FixedRelationshipTypeId>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed.selectedRelTypeId === 'string' &&
          FIXED_WORLD_RELATIONSHIP_TYPES.some((r) => r.id === parsed.selectedRelTypeId)
        ) {
          return parsed.selectedRelTypeId as FixedRelationshipTypeId;
        }
      }
    } catch {
      // ignore
    }
    return 'antarkarakter';
  });
  const [studioMode, setStudioMode] = useState<'main' | 'canvas'>('main');
  const [showSwitchRelMenu, setShowSwitchRelMenu] = useState<boolean>(false);

  // Persisted Graph Nodes & Branching Edges
  const [graphNodes, setGraphNodes] = useState<RelationshipGraphNode[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes)) return parsed.nodes;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [graphEdges, setGraphEdges] = useState<RelationshipGraphEdge[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.edges)) return parsed.edges;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Restore state when global Undo / Redo (historyRevision) is triggered
  useEffect(() => {
    if (historyRevision === 0) return;
    try {
      const raw = localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY);
      if (raw) {
        isRestoringRef.current = true;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes)) setGraphNodes(parsed.nodes);
        if (Array.isArray(parsed.edges)) setGraphEdges(parsed.edges);
        if (
          typeof parsed.selectedRelTypeId === 'string' &&
          FIXED_WORLD_RELATIONSHIP_TYPES.some((r) => r.id === parsed.selectedRelTypeId)
        ) {
          setSelectedRelTypeId(parsed.selectedRelTypeId as FixedRelationshipTypeId);
        }
        window.setTimeout(() => {
          isRestoringRef.current = false;
        }, 0);
      }
    } catch {
      // ignore
    }
  }, [historyRevision]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_RELATIONSHIP_STUDIO_KEY,
        JSON.stringify({
          nodes: graphNodes,
          edges: graphEdges,
          selectedRelTypeId
        })
      );
      if (!isRestoringRef.current) {
        window.dispatchEvent(new CustomEvent('alt-universe-substudio-change'));
      }
    } catch {
      // ignore quota error
    }
  }, [graphNodes, graphEdges, selectedRelTypeId]);

  const activeRelType = useMemo(
    () =>
      FIXED_WORLD_RELATIONSHIP_TYPES.find((r) => r.id === selectedRelTypeId) ||
      FIXED_WORLD_RELATIONSHIP_TYPES[0],
    [selectedRelTypeId]
  );

  // Filter nodes & edges for the current World and current Relationship Type (1 of 5)
  const activeNodes = useMemo(
    () =>
      graphNodes.filter(
        (n) =>
          (n.worldId === activeWorld.id || !n.worldId) &&
          n.relationshipTypeId === selectedRelTypeId
      ),
    [graphNodes, activeWorld.id, selectedRelTypeId]
  );

  const activeEdges = useMemo(
    () =>
      graphEdges.filter(
        (e) =>
          (e.worldId === activeWorld.id || !e.worldId) &&
          e.relationshipTypeId === selectedRelTypeId
      ),
    [graphEdges, activeWorld.id, selectedRelTypeId]
  );

  // Helper to check if an Article belongs to a supported tab
  const doesArticleMatchTab = (art: Article, tab: SupportedRelationshipTagTab): boolean => {
    const cat = art.category.toLowerCase();
    const tpl = String(art.templateType).toLowerCase();
    switch (tab) {
      case 'characters':
        return cat === 'characters' || tpl === 'character' || art.tags.includes('Character');
      case 'conditions':
        return cat === 'conditions' || tpl.includes('condition') || art.tags.includes('Condition');
      case 'locations':
        return cat === 'locations' || tpl.startsWith('location') || art.tags.includes('Location');
      case 'organizations':
        return (
          cat === 'organizations' ||
          tpl.includes('organization') ||
          art.tags.includes('Organization')
        );
      case 'species':
        return cat === 'species' || tpl.includes('species') || art.tags.includes('Species');
      case 'cosmics':
        return cat === 'cosmics' || tpl.includes('cosmic') || art.tags.includes('Cosmic');
      default:
        return false;
    }
  };

  // Articles available for the currently active Relationship Type's supported tabs
  const supportedArticlesByTab = useMemo(() => {
    const map: Record<SupportedRelationshipTagTab, Article[]> = {
      characters: [],
      conditions: [],
      locations: [],
      organizations: [],
      species: [],
      cosmics: []
    };
    articles.forEach((art) => {
      activeRelType.supportedTabs.forEach((tab) => {
        if (doesArticleMatchTab(art, tab)) {
          map[tab].push(art);
        }
      });
    });
    return map;
  }, [articles, activeRelType]);

  // Node Form State (Used in Canvas Mode & Quick Add / Branch Modal)
  const [editingNodeId, setEditingNodeId] = useState<string>('');
  const [nodeTagTab, setNodeTagTab] = useState<SupportedRelationshipTagTab>(
    activeRelType.supportedTabs[0]
  );
  const [selectedExistingArticleId, setSelectedExistingArticleId] = useState<string>('');
  const [nodeTitle, setNodeTitle] = useState<string>('');
  const [nodeRoleSubtitle, setNodeRoleSubtitle] = useState<string>('');
  const [nodeSummary, setNodeSummary] = useState<string>('');
  const [nodeThumbnail, setNodeThumbnail] = useState<string>('');

  // Branch / Connection Parent State when adding a new node or connecting nodes
  const [branchFromNodeId, setBranchFromNodeId] = useState<string>('');
  const [branchEdgeLabel, setBranchEdgeLabel] = useState<string>('Cabang Relasi');
  const [branchEdgeStyle, setBranchEdgeStyle] =
    useState<RelationshipGraphEdge['lineStyle']>('branch');
  const [branchEdgeDirection, setBranchEdgeDirection] =
    useState<RelationshipGraphEdge['direction']>('directed');

  // Dedicated Connect Two Existing Nodes Form State
  const [connectSourceId, setConnectSourceId] = useState<string>('');
  const [connectTargetId, setConnectTargetId] = useState<string>('');
  const [connectLabel, setConnectLabel] = useState<string>('Terhubung Dengan');
  const [connectLineStyle, setConnectLineStyle] =
    useState<RelationshipGraphEdge['lineStyle']>('branch');
  const [connectDirection, setConnectDirection] =
    useState<RelationshipGraphEdge['direction']>('bidirectional');

  // Interactive Canvas Click-to-Connect Mode & Inline Edge Label Editing
  const [linkingFromNodeId, setLinkingFromNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingEdgeLabelText, setEditingEdgeLabelText] = useState<string>('');
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Dragging a single node on the canvas in Canvas Mode
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragNodeStartRef = useRef<{
    clientX: number;
    clientY: number;
    origX: number;
    origY: number;
  }>({ clientX: 0, clientY: 0, origX: 0, origY: 0 });

  const nodeThumbInputRef = useRef<HTMLInputElement | null>(null);

  // Keep nodeTagTab valid whenever the user switches among the 5 Relationship Types
  useEffect(() => {
    if (!activeRelType.supportedTabs.includes(nodeTagTab)) {
      setNodeTagTab(activeRelType.supportedTabs[0]);
      setSelectedExistingArticleId('');
    }
    setEditingNodeId('');
    setLinkingFromNodeId(null);
  }, [activeRelType, nodeTagTab]);

  // Pan & Zoom State for the Oversized Relationship Surface
  const [relZoom, setRelZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number }>({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0
  });
  const hasDraggedRef = useRef<boolean>(false);

  // 1.5-second (1500ms) Z-depth directional zoom-in blur transition
  // with first 0.8s (800ms) shifting the canvas so the target node is centered
  const [zoomingGraphNode, setZoomingGraphNode] = useState<RelationshipGraphNode | null>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
    };
  }, []);

  const handleResetNodeForm = (defaultParentId = '') => {
    setEditingNodeId('');
    setNodeTagTab(activeRelType.supportedTabs[0]);
    setSelectedExistingArticleId('');
    setNodeTitle('');
    setNodeRoleSubtitle('');
    setNodeSummary('');
    setNodeThumbnail('');
    setBranchFromNodeId(defaultParentId);
    setBranchEdgeLabel('Cabang Relasi');
    setBranchEdgeStyle('branch');
    setBranchEdgeDirection('directed');
  };

  const handleSelectNodeForEdit = (node: RelationshipGraphNode) => {
    setEditingNodeId(node.id);
    setNodeTagTab(node.tagTab);
    setSelectedExistingArticleId(node.linkedArticleId || '');
    setNodeTitle(node.title);
    setNodeRoleSubtitle(node.roleSubtitle);
    setNodeSummary(node.summary);
    setNodeThumbnail(node.thumbnailUrl || '');
  };

  // Auto-save edits when modifying an existing relationship node in Canvas Mode
  useEffect(() => {
    if (!editingNodeId || showQuickAddModal) return;
    const existing = graphNodes.find((n) => n.id === editingNodeId);
    if (!existing) return;

    const finalTitle = nodeTitle.trim() || existing.title;
    const finalRole = nodeRoleSubtitle.trim() || TAG_TAB_METADATA[nodeTagTab].indonesianLabel;
    const finalSum = nodeSummary.trim();

    if (
      existing.title === finalTitle &&
      existing.tagTab === nodeTagTab &&
      existing.roleSubtitle === finalRole &&
      existing.summary === finalSum &&
      (existing.thumbnailUrl || '') === nodeThumbnail
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setGraphNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? {
                ...n,
                title: finalTitle,
                tagTab: nodeTagTab,
                roleSubtitle: finalRole,
                summary: finalSum,
                thumbnailUrl: nodeThumbnail || undefined
              }
            : n
        )
      );
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    editingNodeId,
    showQuickAddModal,
    nodeTitle,
    nodeTagTab,
    nodeRoleSubtitle,
    nodeSummary,
    nodeThumbnail,
    graphNodes
  ]);

  const handleNodeThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNodeThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Compute smart position for a new node or branch node so branches spread out cleanly
  const computeNewNodeCoordinates = (parentNodeId?: string) => {
    const parent = activeNodes.find((n) => n.id === parentNodeId);
    if (parent) {
      const existingSiblingEdges = activeEdges.filter(
        (e) => e.sourceNodeId === parent.id || e.targetNodeId === parent.id
      );
      const branchIdx = existingSiblingEdges.length;
      const offsetsY = [-220, 220, -380, 380, 0];
      const deltaY = offsetsY[branchIdx % offsetsY.length];
      const deltaX = 420 + Math.floor(branchIdx / 2) * 140;
      return {
        xPx: Math.max(260, Math.min(SURFACE_WIDTH - 260, parent.xPx + deltaX)),
        yPx: Math.max(200, Math.min(SURFACE_HEIGHT - 200, parent.yPx + deltaY))
      };
    }

    const idx = activeNodes.length;
    if (idx === 0) {
      return { xPx: Math.round(SURFACE_WIDTH / 2 - 380), yPx: Math.round(SURFACE_HEIGHT / 2) };
    }
    const col = Math.floor(idx / 2);
    const rowOffset = idx % 2 === 0 ? -190 : 190;
    return {
      xPx: Math.min(SURFACE_WIDTH - 300, 680 + col * 420),
      yPx: Math.round(SURFACE_HEIGHT / 2 + rowOffset)
    };
  };

  const handleSaveNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeTitle.trim()) return;

    const syncedArticle = onCreateOrSyncTagArticle({
      id: selectedExistingArticleId || undefined,
      worldId: activeWorld.id,
      title: nodeTitle.trim(),
      tagTab: nodeTagTab,
      summary:
        nodeSummary.trim() ||
        `${nodeTitle.trim()} — ${TAG_TAB_METADATA[nodeTagTab].indonesianLabel} (${activeRelType.name})`,
      thumbnailUrl: nodeThumbnail || undefined
    });

    const nodeId = editingNodeId || `relnode-${Date.now()}`;
    const existingNode = activeNodes.find((n) => n.id === editingNodeId);
    const coords = existingNode
      ? { xPx: existingNode.xPx, yPx: existingNode.yPx }
      : computeNewNodeCoordinates(branchFromNodeId);

    const savedNode: RelationshipGraphNode = {
      id: nodeId,
      worldId: activeWorld.id,
      relationshipTypeId: selectedRelTypeId,
      title: syncedArticle.title,
      tagTab: nodeTagTab,
      roleSubtitle:
        nodeRoleSubtitle.trim() || TAG_TAB_METADATA[nodeTagTab].indonesianLabel,
      summary: nodeSummary.trim() || syncedArticle.summary,
      thumbnailUrl:
        nodeThumbnail ||
        String(syncedArticle.templateValues?.ThumbnailUrl || '') ||
        undefined,
      linkedArticleId: syncedArticle.id,
      xPx: coords.xPx,
      yPx: coords.yPx
    };

    setGraphNodes((prev) =>
      prev.some((n) => n.id === nodeId)
        ? prev.map((n) => (n.id === nodeId ? savedNode : n))
        : [...prev, savedNode]
    );

    // If a parent/source node was chosen for branching, automatically create the branch line!
    if (branchFromNodeId && branchFromNodeId !== nodeId) {
      const alreadyConnected = activeEdges.some(
        (edge) =>
          (edge.sourceNodeId === branchFromNodeId && edge.targetNodeId === nodeId) ||
          (edge.sourceNodeId === nodeId && edge.targetNodeId === branchFromNodeId)
      );
      if (!alreadyConnected) {
        const newEdge: RelationshipGraphEdge = {
          id: `reledge-${Date.now()}`,
          worldId: activeWorld.id,
          relationshipTypeId: selectedRelTypeId,
          sourceNodeId: branchFromNodeId,
          targetNodeId: nodeId,
          label: branchEdgeLabel.trim() || 'Cabang Relasi',
          lineStyle: branchEdgeStyle,
          direction: branchEdgeDirection,
          color: activeRelType.accentColor
        };
        setGraphEdges((prev) => [...prev, newEdge]);
      }
    }

    handleResetNodeForm();
    setShowQuickAddModal(false);
  };

  const handleConnectExistingNodes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectSourceId || !connectTargetId || connectSourceId === connectTargetId) return;

    const newEdge: RelationshipGraphEdge = {
      id: `reledge-${Date.now()}`,
      worldId: activeWorld.id,
      relationshipTypeId: selectedRelTypeId,
      sourceNodeId: connectSourceId,
      targetNodeId: connectTargetId,
      label: connectLabel.trim() || 'Terhubung',
      lineStyle: connectLineStyle,
      direction: connectDirection,
      color: activeRelType.accentColor
    };
    setGraphEdges((prev) => [...prev, newEdge]);
    setConnectLabel('Terhubung Dengan');
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraphNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setGraphEdges((prev) =>
      prev.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
    );
    if (editingNodeId === nodeId) handleResetNodeForm();
  };

  const handleDeleteEdge = (edgeId: string) => {
    setGraphEdges((prev) => prev.filter((e) => e.id !== edgeId));
    if (editingEdgeId === edgeId) {
      setEditingEdgeId(null);
      setEditingEdgeLabelText('');
    }
  };

  const handleUpdateEdge = (
    edgeId: string,
    patch: Partial<Pick<RelationshipGraphEdge, 'label' | 'lineStyle' | 'direction'>>
  ) => {
    setGraphEdges((prev) =>
      prev.map((edge) => (edge.id === edgeId ? { ...edge, ...patch } : edge))
    );
  };

  const handleCommitInlineEdgeLabel = (edgeId: string) => {
    const trimmed = editingEdgeLabelText.trim();
    if (trimmed) {
      handleUpdateEdge(edgeId, { label: trimmed });
    }
    setEditingEdgeId(null);
    setEditingEdgeLabelText('');
  };

  const handleZoomIn = () => {
    setRelZoom((z) => Math.min(2.4, Number((z + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setRelZoom((z) => Math.max(0.45, Number((z - 0.15).toFixed(2))));
  };

  const handleResetZoomAndPan = () => {
    setRelZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Load Rich Branching & Interconnected Sample Preset for the active Relationship Type
  const handleLoadBranchingPreset = () => {
    const cx = Math.round(SURFACE_WIDTH / 2);
    const cy = Math.round(SURFACE_HEIGHT / 2);

    const presetDefinitions: Record<
      FixedRelationshipTypeId,
      {
        nodes: Array<{
          key: string;
          title: string;
          tagTab: SupportedRelationshipTagTab;
          roleSubtitle: string;
          summary: string;
          dx: number;
          dy: number;
        }>;
        edges: Array<{
          from: string;
          to: string;
          label: string;
          lineStyle: RelationshipGraphEdge['lineStyle'];
          direction: RelationshipGraphEdge['direction'];
        }>;
      }
    > = {
      antarkarakter: {
        nodes: [
          {
            key: 'n1',
            title: 'Raja Aldric V',
            tagTab: 'characters',
            roleSubtitle: 'Penguasa Takhta',
            summary: 'Pemimpin tertinggi yang memegang sumpah darah keluarga kerajaan.',
            dx: -520,
            dy: 0
          },
          {
            key: 'n2',
            title: 'Pangeran Kaelen',
            tagTab: 'characters',
            roleSubtitle: 'Pewaris Utama',
            summary: 'Putra sulung yang mewarisi ambisi militer dan beban takhta.',
            dx: -80,
            dy: -220
          },
          {
            key: 'n3',
            title: 'Lady Seraphina',
            tagTab: 'characters',
            roleSubtitle: 'Penasihat Bayangan',
            summary: 'Adik tiri yang mengendalikan jaringan diplomasi rahasia.',
            dx: -80,
            dy: 220
          },
          {
            key: 'n4',
            title: 'Kutukan Darah Perak',
            tagTab: 'conditions',
            roleSubtitle: 'Kondisi Genetik & Magis',
            summary: 'Kondisi turun-temurun yang mengikat garis keturunan kerajaan.',
            dx: 380,
            dy: 0
          },
          {
            key: 'n5',
            title: 'Jenderal Vane',
            tagTab: 'characters',
            roleSubtitle: 'Komandan Garda',
            summary: 'Rival sekaligus pelindung yang terikat sumpah dengan Kaelen.',
            dx: 380,
            dy: -250
          }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'Ayah & Pewaris', lineStyle: 'branch', direction: 'directed' },
          { from: 'n1', to: 'n3', label: 'Ikatan Darah', lineStyle: 'branch', direction: 'directed' },
          { from: 'n2', to: 'n3', label: 'Rivalitas Takhta', lineStyle: 'dashed', direction: 'bidirectional' },
          { from: 'n2', to: 'n4', label: 'Terjangkit Kondisi', lineStyle: 'branch', direction: 'directed' },
          { from: 'n3', to: 'n4', label: 'Pembawa Kutukan', lineStyle: 'branch', direction: 'directed' },
          { from: 'n2', to: 'n5', label: 'Sumpah Setia', lineStyle: 'direct', direction: 'bidirectional' }
        ]
      },
      sosial_hierarki: {
        nodes: [
          {
            key: 'n1',
            title: 'Distrik Mahkota Emas',
            tagTab: 'locations',
            roleSubtitle: 'Kasta Bangsawan Tinggi',
            summary: 'Pusat kediaman elit penguasa di puncak bukit ibu kota.',
            dx: -500,
            dy: 0
          },
          {
            key: 'n2',
            title: 'Pelabuhan Serikat Dagang',
            tagTab: 'locations',
            roleSubtitle: 'Kelas Saudagar & Borjuis',
            summary: 'Sentra ekonomi tempat perputaran upeti dan pajak perdagangan.',
            dx: -40,
            dy: -220
          },
          {
            key: 'n3',
            title: 'Lembah Tambang Abu',
            tagTab: 'locations',
            roleSubtitle: 'Kelas Pekerja Bawah',
            summary: 'Wilayah eksploitasi sumber daya yang menopang ibu kota.',
            dx: -40,
            dy: 220
          },
          {
            key: 'n4',
            title: 'Ketimpangan Upeti Feodal',
            tagTab: 'conditions',
            roleSubtitle: 'Kondisi Sosial Ekonomi',
            summary: 'Kondisi pajak berlapis yang memicu ketegangan antar kelas.',
            dx: 420,
            dy: 0
          }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'Hak Monopoli', lineStyle: 'branch', direction: 'directed' },
          { from: 'n1', to: 'n3', label: 'Hierarki Penguasa', lineStyle: 'branch', direction: 'directed' },
          { from: 'n2', to: 'n3', label: 'Kontrak Buruh', lineStyle: 'direct', direction: 'directed' },
          { from: 'n2', to: 'n4', label: 'Memicu Kondisi', lineStyle: 'branch', direction: 'directed' },
          { from: 'n3', to: 'n4', label: 'Terdampak Langsung', lineStyle: 'dashed', direction: 'bidirectional' }
        ]
      },
      politik_diplomasi: {
        nodes: [
          {
            key: 'n1',
            title: 'Benteng Utara Valoria',
            tagTab: 'locations',
            roleSubtitle: 'Kekuatan Militer Utara',
            summary: 'Wilayah kedaulatan utara yang menguasai jalur pegunungan.',
            dx: -500,
            dy: -160
          },
          {
            key: 'n2',
            title: 'Kepulauan Maritim Solis',
            tagTab: 'locations',
            roleSubtitle: 'Koalisi Armada Laut',
            summary: 'Negara kota maritim yang mengontrol selat perdagangan.',
            dx: -500,
            dy: 180
          },
          {
            key: 'n3',
            title: 'Zona Netral Perbatasan',
            tagTab: 'locations',
            roleSubtitle: 'Wilayah Penyangga',
            summary: 'Kota diplomasi tempat perundingan kedua kekuatan besar.',
            dx: -20,
            dy: 0
          },
          {
            key: 'n4',
            title: 'Gencatan Senjata Rapuh',
            tagTab: 'conditions',
            roleSubtitle: 'Kondisi Geopolitik',
            summary: 'Status perang dingin dan embargo yang sewaktu-waktu pecah.',
            dx: 430,
            dy: 0
          }
        ],
        edges: [
          { from: 'n1', to: 'n3', label: 'Delegasi Utara', lineStyle: 'branch', direction: 'directed' },
          { from: 'n2', to: 'n3', label: 'Delegasi Maritim', lineStyle: 'branch', direction: 'directed' },
          { from: 'n1', to: 'n2', label: 'Pakta Dagang & Rivalitas', lineStyle: 'dashed', direction: 'bidirectional' },
          { from: 'n3', to: 'n4', label: 'Status Diplomasi', lineStyle: 'branch', direction: 'directed' }
        ]
      },
      manusia_institusi: {
        nodes: [
          {
            key: 'n1',
            title: 'Ordo Arsiparis Agung',
            tagTab: 'organizations',
            roleSubtitle: 'Institusi Pengetahuan',
            summary: 'Lembaga kuno yang menyimpan naskah terlarang dunia.',
            dx: -500,
            dy: 0
          },
          {
            key: 'n2',
            title: 'Magister Elian',
            tagTab: 'characters',
            roleSubtitle: 'Ketua Dewan Ordo',
            summary: 'Tokoh penjaga doktrin murni di dalam institusi.',
            dx: -40,
            dy: -220
          },
          {
            key: 'n3',
            title: 'Lyra sang Pembelot',
            tagTab: 'characters',
            roleSubtitle: 'Mantan Inkuisitor',
            summary: 'Karakter yang membocorkan rahasia institusi ke publik.',
            dx: -40,
            dy: 220
          },
          {
            key: 'n4',
            title: 'Serikat Penjaga Malam',
            tagTab: 'organizations',
            roleSubtitle: 'Faksi Oposisi',
            summary: 'Organisasi bawah tanah yang melindungi Lyra.',
            dx: 420,
            dy: 220
          }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'Memimpin Institusi', lineStyle: 'branch', direction: 'bidirectional' },
          { from: 'n1', to: 'n3', label: 'Mengejar Pembelot', lineStyle: 'dashed', direction: 'directed' },
          { from: 'n2', to: 'n3', label: 'Mantan Mentor', lineStyle: 'direct', direction: 'bidirectional' },
          { from: 'n3', to: 'n4', label: 'Bergabung ke Faksi', lineStyle: 'branch', direction: 'directed' }
        ]
      },
      makhluk_alam: {
        nodes: [
          {
            key: 'n1',
            title: 'Nebula Aether Purba',
            tagTab: 'cosmics',
            roleSubtitle: 'Entitas Kosmik',
            summary: 'Sumber pancaran energi kosmik yang mengatur siklus musim.',
            dx: -520,
            dy: 0
          },
          {
            key: 'n2',
            title: 'Ras Sylvan Penjaga Hutan',
            tagTab: 'species',
            roleSubtitle: 'Spesies Endemik',
            summary: 'Spesies yang bermutasi selaras dengan resonansi Aether.',
            dx: -60,
            dy: -220
          },
          {
            key: 'n3',
            title: 'Arion sang Pengembara',
            tagTab: 'characters',
            roleSubtitle: 'Karakter Peneliti Alam',
            summary: 'Manusia yang menjalin simbiosis dengan ekosistem purba.',
            dx: -60,
            dy: 220
          },
          {
            key: 'n4',
            title: 'Anomali Badai Mana',
            tagTab: 'conditions',
            roleSubtitle: 'Kondisi Ekologi & Kosmis',
            summary: 'Fenomena alam ekstrem akibat pergeseran orbit kosmik.',
            dx: 420,
            dy: 0
          }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'Evolusi Kosmik', lineStyle: 'branch', direction: 'directed' },
          { from: 'n1', to: 'n4', label: 'Memicu Anomali', lineStyle: 'branch', direction: 'directed' },
          { from: 'n2', to: 'n3', label: 'Simbiosis Alam', lineStyle: 'direct', direction: 'bidirectional' },
          { from: 'n2', to: 'n4', label: 'Adaptasi Ekologi', lineStyle: 'branch', direction: 'directed' },
          { from: 'n3', to: 'n4', label: 'Meneliti Dampak', lineStyle: 'dashed', direction: 'directed' }
        ]
      }
    };

    const chosen = presetDefinitions[selectedRelTypeId];
    const idMap: Record<string, string> = {};
    const now = Date.now();

    const createdNodes: RelationshipGraphNode[] = chosen.nodes.map((item, idx) => {
      const synced = onCreateOrSyncTagArticle({
        worldId: activeWorld.id,
        title: item.title,
        tagTab: item.tagTab,
        summary: item.summary
      });
      const nodeId = `relnode-${now}-${idx}`;
      idMap[item.key] = nodeId;
      return {
        id: nodeId,
        worldId: activeWorld.id,
        relationshipTypeId: selectedRelTypeId,
        title: synced.title,
        tagTab: item.tagTab,
        roleSubtitle: item.roleSubtitle,
        summary: item.summary,
        thumbnailUrl: String(synced.templateValues?.ThumbnailUrl || '') || undefined,
        linkedArticleId: synced.id,
        xPx: cx + item.dx,
        yPx: cy + item.dy
      };
    });

    const createdEdges: RelationshipGraphEdge[] = chosen.edges.map((edge, idx) => ({
      id: `reledge-${now}-${idx}`,
      worldId: activeWorld.id,
      relationshipTypeId: selectedRelTypeId,
      sourceNodeId: idMap[edge.from],
      targetNodeId: idMap[edge.to],
      label: edge.label,
      lineStyle: edge.lineStyle,
      direction: edge.direction,
      color: activeRelType.accentColor
    }));

    setGraphNodes((prev) => [
      ...prev.filter(
        (n) =>
          !(n.worldId === activeWorld.id && n.relationshipTypeId === selectedRelTypeId)
      ),
      ...createdNodes
    ]);
    setGraphEdges((prev) => [
      ...prev.filter(
        (e) =>
          !(e.worldId === activeWorld.id && e.relationshipTypeId === selectedRelTypeId)
      ),
      ...createdEdges
    ]);
    setPanOffset({ x: 0, y: 0 });
  };

  // 1.5s (1500ms) Full Transition (Matching Timeline & Maps UX):
  // - First 0.8s (800ms) shifts the Relationship canvas so the clicked Tag/Mark node is centered
  // - Node thumbnail stays in its original position & size as 50% opacity background of the card
  // - Receives the exact same 1.5s Z-depth directional zoom-in blur effect as the canvas
  const handleTriggerNodeZoomTransition = (node: RelationshipGraphNode) => {
    if (zoomingGraphNode) return;

    const matchedArt = articles.find(
      (a) =>
        (node.linkedArticleId && a.id === node.linkedArticleId) ||
        (doesArticleMatchTab(a, node.tagTab) &&
          a.title.toLowerCase() === node.title.toLowerCase())
    );

    let targetArticleId = matchedArt?.id || node.linkedArticleId;
    if (!targetArticleId || !articles.some((a) => a.id === targetArticleId)) {
      const created = onCreateOrSyncTagArticle({
        worldId: node.worldId || activeWorld.id,
        title: node.title,
        tagTab: node.tagTab,
        summary: node.summary || `${node.title} (${TAG_TAB_METADATA[node.tagTab].indonesianLabel})`,
        thumbnailUrl: node.thumbnailUrl
      });
      targetArticleId = created.id;
    }

    // Shift Relationship canvas during the first 0.8s (800ms) so the clicked node is centered
    const targetPanX = Math.round(SURFACE_WIDTH / 2 - node.xPx);
    const targetPanY = Math.round(SURFACE_HEIGHT / 2 - node.yPx);
    setPanOffset({ x: targetPanX, y: targetPanY });

    setShowSwitchRelMenu(false);
    onStartZoomTransition?.();
    setZoomingGraphNode(node);

    if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = window.setTimeout(() => {
      onNavigateToTagPage(targetArticleId!, node.tagTab);
    }, 1500);
  };

  // Surface Mouse Pan & Node Drag Handlers
  const handleSurfaceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || zoomingGraphNode) return;
    setIsPanning(true);
    hasDraggedRef.current = false;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: panOffset.x,
      originY: panOffset.y
    };
  };

  const handleSurfaceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNodeId && studioMode === 'canvas') {
      const dx = (e.clientX - dragNodeStartRef.current.clientX) / relZoom;
      const dy = (e.clientY - dragNodeStartRef.current.clientY) / relZoom;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }
      const nextX = Math.max(
        200,
        Math.min(SURFACE_WIDTH - 200, Math.round(dragNodeStartRef.current.origX + dx))
      );
      const nextY = Math.max(
        140,
        Math.min(SURFACE_HEIGHT - 140, Math.round(dragNodeStartRef.current.origY + dy))
      );
      setGraphNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, xPx: nextX, yPx: nextY } : n))
      );
      return;
    }

    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }
    setPanOffset({
      x: Math.max(-1500, Math.min(1500, panStartRef.current.originX + dx)),
      y: Math.max(-650, Math.min(650, panStartRef.current.originY + dy))
    });
  };

  const handleSurfaceMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  return (
    <div className="-mx-6 sm:-mx-8 -mt-22 sm:-mt-24 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] h-screen bg-[#eef1f8] text-[#181b26] select-none overflow-hidden relative flex flex-col">
      <input
        ref={nodeThumbInputRef}
        type="file"
        accept="image/*"
        onChange={handleNodeThumbnailUpload}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* POPULATED WIDE RELATIONSHIP SURFACE (Mode Utama & Mode Kanvas)       */}
      {/* ==================================================================== */}
      <div
        onWheel={(e) => {
          if (zoomingGraphNode) return;
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.12 : -0.12;
          setRelZoom((prev) =>
            Math.max(0.45, Math.min(2.4, Number((prev + delta).toFixed(2))))
          );
        }}
        onMouseDown={handleSurfaceMouseDown}
        onMouseMove={handleSurfaceMouseMove}
        onMouseUp={handleSurfaceMouseUp}
        onMouseLeave={handleSurfaceMouseUp}
        className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-[#eef1f8] ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Ambient radial glow background matching Reference Image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 42% 50%, rgba(119, 146, 196, 0.25) 0%, rgba(135, 159, 208, 0.14) 45%, rgba(238, 241, 248, 0.96) 80%)'
          }}
        />

        {/* ============================================================== */}
        {/* OVERSIZED FREELY PANNABLE RELATIONSHIP CANVAS                  */}
        {/* - Outer wrapper: 1.5s (1500ms) Z-depth directional zoom-in blur */}
        {/* - Inner canvas: 0.8s (800ms) pan shift to center target node    */}
        {/* ============================================================== */}
        <DepthDirectionalBlurSvgFilter
          filterId="relationship-depth-directional-blur"
          depthScale={zoomingGraphNode ? 95 : 0}
        />
        <div
          style={(() => {
            if (zoomingGraphNode) {
              const targetScale = Math.max(2.5, relZoom * 2.5);
              return {
                width: `${SURFACE_WIDTH}px`,
                height: `${SURFACE_HEIGHT}px`,
                transformOrigin: '50% 50%',
                transform: `perspective(900px) translate3d(0, 0, 180px) scale(${targetScale})`,
                filter: 'url(#relationship-depth-directional-blur) brightness(1.04)',
                transition:
                  'transform 1500ms cubic-bezier(0.22, 1, 0.36, 1), filter 1500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1500ms ease'
              };
            }

            return {
              width: `${SURFACE_WIDTH}px`,
              height: `${SURFACE_HEIGHT}px`,
              transformOrigin: '50% 50%',
              transform: `scale(${relZoom})`,
              filter: 'none',
              transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), filter 350ms ease'
            };
          })()}
          className="relative shrink-0 opacity-100"
        >
          <div
            style={{
              width: `${SURFACE_WIDTH}px`,
              height: `${SURFACE_HEIGHT}px`,
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
              transition: zoomingGraphNode
                ? 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)'
                : isPanning || draggingNodeId
                ? 'none'
                : 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
            className="relative w-full h-full"
          >
            {/* Subtle network grid lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-45"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(109, 118, 150, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(109, 118, 150, 0.12) 1px, transparent 1px)',
                backgroundSize: '160px 160px'
              }}
            />

            {/* ============================================================ */}
            {/* CENTRAL HORIZONTAL BACKBONE AXIS (Subtle Reference Line)     */}
            {/* ============================================================ */}
            <div className="absolute left-32 right-32 top-1/2 -translate-y-1/2 h-[2px] pointer-events-none flex items-center opacity-60">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, #6d7696 25%, #5b74a8 50%, #6d7696 75%, transparent 100%)`
                }}
              />
            </div>

            {/* ============================================================ */}
            {/* SVG LAYER: BRANCHING LINES & INTERCONNECTIONS BETWEEN NODES  */}
            {/* Supports multi-branching trees, curved/orthogonal branches,  */}
            {/* directional arrowheads, split junctions & connection badges   */}
            {/* ============================================================ */}
            <svg
              width={SURFACE_WIDTH}
              height={SURFACE_HEIGHT}
              viewBox={`0 0 ${SURFACE_WIDTH} ${SURFACE_HEIGHT}`}
              className="absolute inset-0 pointer-events-none z-10"
            >
              <defs>
                <marker
                  id="rel-arrow-end"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#5d6685" />
                </marker>
              </defs>

              {activeEdges.map((edge) => {
                const source = activeNodes.find((n) => n.id === edge.sourceNodeId);
                const target = activeNodes.find((n) => n.id === edge.targetNodeId);
                if (!source || !target) return null;

                const sx = source.xPx;
                const sy = source.yPx;
                const tx = target.xPx;
                const ty = target.yPx;
                const midX = Math.round((sx + tx) / 2);
                const midY = Math.round((sy + ty) / 2);

                // Branching path geometry:
                // - 'branch': smooth cubic S-branch with a visible branching split elbow
                // - 'direct' / 'dashed': arched bezier curve so cross-connections never overlap straight branches
                let pathD = '';
                let labelX = midX;
                let labelY = midY;

                if (edge.lineStyle === 'branch') {
                  const branchJoinX = Math.round(sx + (tx - sx) * 0.42);
                  pathD = `M ${sx} ${sy} L ${branchJoinX} ${sy} C ${branchJoinX + (tx - branchJoinX) * 0.45} ${sy}, ${branchJoinX + (tx - branchJoinX) * 0.55} ${ty}, ${tx} ${ty}`;
                  labelX = Math.round((branchJoinX + tx) / 2);
                  labelY = Math.round((sy + ty) / 2);
                } else {
                  const dx = tx - sx;
                  const dy = ty - sy;
                  const curveOffset = Math.abs(dy) < 40 ? -70 : 0;
                  const cx1 = Math.round(sx + dx * 0.35);
                  const cy1 = Math.round(sy + dy * 0.15 + curveOffset);
                  const cx2 = Math.round(sx + dx * 0.65);
                  const cy2 = Math.round(sy + dy * 0.85 + curveOffset);
                  pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
                  labelX = midX;
                  labelY = Math.round(midY + curveOffset * 0.6);
                }

                const strokeColor = edge.color || activeRelType.accentColor;
                const branchJunctionX =
                  edge.lineStyle === 'branch' ? Math.round(sx + (tx - sx) * 0.42) : null;

                return (
                  <g key={edge.id}>
                    {/* Outer Soft Glow Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="6"
                      strokeOpacity="0.22"
                      strokeLinecap="round"
                    />
                    {/* Main Branch / Connection Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      strokeDasharray={edge.lineStyle === 'dashed' ? '7 6' : undefined}
                      markerEnd="url(#rel-arrow-end)"
                      markerStart={
                        edge.direction === 'bidirectional' ? 'url(#rel-arrow-end)' : undefined
                      }
                      strokeLinecap="round"
                    />
                    {/* Diamond Branch Split Node at the Branching Elbow */}
                    {branchJunctionX !== null && Math.abs(sy - ty) > 20 && (
                      <rect
                        x={branchJunctionX - 4.5}
                        y={sy - 4.5}
                        width="9"
                        height="9"
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth="1.8"
                        transform={`rotate(45 ${branchJunctionX} ${sy})`}
                      />
                    )}
                    {/* Editable Connection Label Pill along the Branch Line */}
                    <foreignObject
                      x={labelX - 115}
                      y={labelY - 18}
                      width="230"
                      height="38"
                      className="overflow-visible pointer-events-auto"
                    >
                      <div
                        onMouseDown={(ev) => ev.stopPropagation()}
                        onClick={(ev) => ev.stopPropagation()}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {editingEdgeId === edge.id ? (
                          <form
                            onSubmit={(ev) => {
                              ev.preventDefault();
                              handleCommitInlineEdgeLabel(edge.id);
                            }}
                            className="px-2 py-0.5 rounded-full bg-white border border-[#6d7696] shadow-xl flex items-center gap-1"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={editingEdgeLabelText}
                              onChange={(ev) => setEditingEdgeLabelText(ev.target.value)}
                              onBlur={() => handleCommitInlineEdgeLabel(edge.id)}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Escape') {
                                  setEditingEdgeId(null);
                                  setEditingEdgeLabelText('');
                                }
                              }}
                              placeholder="Nama hubungan cabang..."
                              className="w-32 bg-transparent text-[11px] font-serif text-[#181b26] focus:outline-none px-1"
                            />
                            <button
                              type="submit"
                              className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"
                              title="Simpan nama hubungan"
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          </form>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingEdgeId(edge.id);
                              setEditingEdgeLabelText(edge.label);
                            }}
                            title="Klik untuk mengedit nama hubungan antar cabang"
                            className="px-2.5 py-0.5 rounded-full bg-white/95 hover:bg-[#f4f6fb] border border-[#cbd3e6] hover:border-[#6d7696] text-[10px] font-serif font-medium text-[#181b26] shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer group/edge transition"
                          >
                            <span>{edge.label}</span>
                            <Edit3 className="w-2.5 h-2.5 text-[#5b74a8] group-hover/edge:text-[#181b26] transition" />
                            {studioMode === 'canvas' && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  handleDeleteEdge(edge.id);
                                }}
                                className="text-[#52586e] hover:text-rose-600 transition ml-0.5"
                                title="Hapus garis penghubung ini"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* Empty State inside the Active Relationship Type */}
            {activeNodes.length === 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 bg-white/95 border border-[#cbd3e6] rounded-3xl px-8 py-6 text-center shadow-2xl max-w-lg">
                <GitBranch className="w-8 h-8 text-[#5b74a8]" />
                <div className="text-base font-serif font-semibold text-[#181b26]">
                  {activeRelType.indexNumber}. {activeRelType.name}
                </div>
                <p className="text-xs text-[#52586e] leading-relaxed">
                  {activeRelType.description}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-[#52586e]">Tag/Mark yang didukung:</span>
                  {activeRelType.supportedTabs.map((tabKey) => {
                    const meta = TAG_TAB_METADATA[tabKey];
                    return (
                      <span
                        key={tabKey}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        {meta.label} ({meta.indonesianLabel})
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetNodeForm();
                      setShowQuickAddModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow transition"
                  >
                    + Tambah Tag / Mark Pertama
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadBranchingPreset}
                    className="px-4 py-2 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-[#181b26] font-serif text-xs transition"
                  >
                    Muat Contoh Percabangan ({activeRelType.shortName})
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* RENDER RELATIONSHIP TAG/MARK NODES ON THE BRANCHING GRAPH    */}
            {/* ============================================================ */}
            {activeNodes.map((node, idx) => {
              const tabMeta = TAG_TAB_METADATA[node.tagTab] || TAG_TAB_METADATA.characters;
              const isSelectedInCanvas =
                studioMode === 'canvas' && editingNodeId === node.id;
              const isLinkSource = linkingFromNodeId === node.id;

              const linkedArt = articles.find(
                (a) =>
                  (node.linkedArticleId && a.id === node.linkedArticleId) ||
                  (doesArticleMatchTab(a, node.tagTab) &&
                    a.title.toLowerCase() === node.title.toLowerCase())
              );
              const resolvedThumbUrl = String(
                linkedArt?.templateValues?.ThumbnailUrl ||
                  linkedArt?.templateValues?.CustomIconUrl ||
                  node.thumbnailUrl ||
                  ''
              ).trim();
              const resolvedTitle = linkedArt?.title || node.title;

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${node.xPx}px`,
                    top: `${node.yPx}px`
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                >
                  {/* Top Circular Ring Node on the Branch Point (Uses Tag Thumbnail) */}
                  <div
                    style={{ borderColor: tabMeta.dotColor }}
                    className="w-5 h-5 rounded-full bg-white border-[2.5px] shadow-[0_2px_10px_rgba(91,116,168,0.4)] flex items-center justify-center z-20 overflow-hidden mb-1.5"
                  >
                    {resolvedThumbUrl ? (
                      <img
                        src={resolvedThumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: tabMeta.dotColor }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    )}
                  </div>

                  {/* Relationship Node Card (With 50% Opacity Thumbnail Background matching Timeline UX) */}
                  <div
                    onMouseDown={(ev) => {
                      if (studioMode === 'canvas' && ev.button === 0) {
                        ev.stopPropagation();
                        hasDraggedRef.current = false;
                        setDraggingNodeId(node.id);
                        dragNodeStartRef.current = {
                          clientX: ev.clientX,
                          clientY: ev.clientY,
                          origX: node.xPx,
                          origY: node.yPx
                        };
                      }
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (hasDraggedRef.current) return;

                      // If user is in "Hubungkan Antar Tag" click-to-link state
                      if (linkingFromNodeId) {
                        if (linkingFromNodeId !== node.id) {
                          const exists = activeEdges.some(
                            (e) =>
                              (e.sourceNodeId === linkingFromNodeId &&
                                e.targetNodeId === node.id) ||
                              (e.sourceNodeId === node.id &&
                                e.targetNodeId === linkingFromNodeId)
                          );
                          if (!exists) {
                            const newId = `reledge-${Date.now()}`;
                            setGraphEdges((prev) => [
                              ...prev,
                              {
                                id: newId,
                                worldId: activeWorld.id,
                                relationshipTypeId: selectedRelTypeId,
                                sourceNodeId: linkingFromNodeId,
                                targetNodeId: node.id,
                                label: 'Hubungan Cabang',
                                lineStyle: 'branch',
                                direction: 'bidirectional',
                                color: activeRelType.accentColor
                              }
                            ]);
                            setEditingEdgeId(newId);
                            setEditingEdgeLabelText('Hubungan Cabang');
                          }
                        }
                        setLinkingFromNodeId(null);
                        return;
                      }

                      if (studioMode === 'canvas') {
                        handleSelectNodeForEdit(node);
                      } else {
                        handleTriggerNodeZoomTransition(node);
                      }
                    }}
                    className={`relative overflow-hidden w-[285px] sm:w-[305px] min-h-[104px] rounded-2xl bg-[#5c688a] border p-4 flex items-center shadow-[0_14px_32px_rgba(70,84,120,0.3)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                      isLinkSource
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                        : isSelectedInCanvas
                        ? 'border-[#181b26] ring-2 ring-[#6d7696]/50'
                        : 'border-white/70 hover:border-white'
                    }`}
                  >
                    {/* Linked Tag Thumbnail as Background of the Card with 50% Opacity */}
                    <div
                      data-rel-thumb="true"
                      className="absolute inset-0 z-0 opacity-50 pointer-events-none overflow-hidden"
                    >
                      {resolvedThumbUrl ? (
                        <img
                          src={resolvedThumbUrl}
                          alt={resolvedTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        renderDefaultTagArtwork(node.tagTab, idx)
                      )}
                    </div>

                    {/* Foreground Node Info */}
                    <div className="relative z-10 min-w-0 flex-1 space-y-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[15px] font-bold text-white leading-snug group-hover:text-[#f5dec0] transition-colors truncate">
                          {resolvedTitle}
                        </div>
                      </div>
                      <div className="text-xs text-slate-100 font-medium tracking-wide truncate">
                        {node.roleSubtitle || tabMeta.indonesianLabel}
                      </div>
                      <div className="pt-1 flex items-center justify-between gap-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${tabMeta.badgeClass}`}
                        >
                          {tabMeta.label}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Quick "+ Cabang" button right on the card */}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleResetNodeForm(node.id);
                              setShowQuickAddModal(true);
                            }}
                            className="px-2 py-0.5 rounded-full bg-black/55 hover:bg-[#494a52] border border-white/25 text-[10px] text-white flex items-center gap-0.5 transition"
                            title={`Buat percabangan baru dari "${resolvedTitle}"`}
                          >
                            <GitBranch className="w-2.5 h-2.5" />
                            <span>+ Cabang</span>
                          </button>

                          {/* Quick "Hubungkan" button to connect to another existing node */}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setLinkingFromNodeId((prev) =>
                                prev === node.id ? null : node.id
                              );
                            }}
                            className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-0.5 transition ${
                              isLinkSource
                                ? 'bg-emerald-600 border-emerald-300 text-white'
                                : 'bg-black/55 hover:bg-teal-900/80 border-white/25 text-teal-200'
                            }`}
                            title={`Klik lalu pilih node lain untuk menghubungkan "${resolvedTitle}"`}
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            <span>{isLinkSource ? 'Pilih Target...' : 'Hubungkan'}</span>
                          </button>

                          {studioMode === 'main' && (
                            <span className="text-[10px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Click-to-Connect Banner when linkingFromNodeId is active */}
        {linkingFromNodeId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-[#494a52] border border-white/30 text-white text-xs font-serif shadow-2xl flex items-center gap-3">
            <Link2 className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>
              Klik kartu Tag/Mark lain di kanvas untuk membuat garis penghubung langsung.
            </span>
            <button
              type="button"
              onClick={() => setLinkingFromNodeId(null)}
              className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[11px]"
            >
              Batal
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* LEFT & RIGHT CIRCULAR PAN BUTTONS (Matches Timeline Studio)    */}
        {/* ============================================================== */}
        <button
          type="button"
          onClick={() =>
            setPanOffset((prev) => ({ ...prev, x: Math.min(1500, prev.x + 340) }))
          }
          className={`absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#7792c4]/90 hover:bg-[#6681b5] border border-white/60 text-white flex items-center justify-center shadow-lg transition ${
            zoomingGraphNode ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Geser Kanvas Relationship ke Kiri"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setPanOffset((prev) => ({ ...prev, x: Math.max(-1500, prev.x - 340) }))
          }
          className={`absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#7792c4]/90 hover:bg-[#6681b5] border border-white/60 text-white flex items-center justify-center shadow-lg transition ${
            zoomingGraphNode ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Geser Kanvas Relationship ke Kanan"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* ============================================================== */}
        {/* MODE UTAMA MINIMALIST FLOATING HUD                             */}
        {/* Note: User cannot add new relationship containers;             */}
        {/* switches strictly between the 5 main relationship types!       */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            studioMode === 'main' && !zoomingGraphNode
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-6'
          }`}
        >
          {/* Top-Left Minimalist Bar: Active Relationship (1 of 5), Beralih Relationship, + Tambah Tag/Cabang */}
          <div className="absolute top-[56px] left-5 flex flex-wrap items-center gap-2">
            {/* Pill 1: Active Relationship Name (Fixed 1 of 5 in the World) */}
            <div
              className={`h-8 px-3.5 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center gap-2 ${
                studioMode === 'main' && !zoomingGraphNode
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span className="text-xs font-serif font-semibold text-[#181b26] tracking-wide whitespace-nowrap">
                {activeRelType.indexNumber}/5 · {activeRelType.name}
              </span>
              <span className="hidden md:inline-block text-[10px] text-[#52586e] border-l border-[#cbd3e6] pl-2">
                Tag: {activeRelType.supportedLabelsText}
              </span>
            </div>

            {/* Pill 2: Beralih Relationship (5 Jenis Utama dalam 1 World) */}
            <div
              className={`relative ${
                studioMode === 'main' && !zoomingGraphNode
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowSwitchRelMenu((prev) => !prev)}
                className="h-8 px-3 rounded-full bg-white/95 hover:bg-[#f4f6fb] backdrop-blur-md border border-[#cbd3e6] text-xs font-serif font-medium text-[#181b26] flex items-center gap-1.5 shadow-md transition whitespace-nowrap"
              >
                <span>Beralih Relationship (5 Jenis)</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5b74a8]" />
              </button>

              {showSwitchRelMenu && (
                <div className="absolute left-0 mt-1.5 w-88 rounded-2xl bg-white/98 backdrop-blur-xl border border-[#cbd3e6] shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#52586e]">
                    <span>5 Jenis Relationship Utama ({activeWorld.name})</span>
                    <span className="text-[#4b67a1]">Tetap (5/5)</span>
                  </div>
                  {FIXED_WORLD_RELATIONSHIP_TYPES.map((relType) => {
                    const isCurrent = relType.id === selectedRelTypeId;
                    const countNodes = graphNodes.filter(
                      (n) =>
                        (n.worldId === activeWorld.id || !n.worldId) &&
                        n.relationshipTypeId === relType.id
                    ).length;
                    return (
                      <button
                        key={relType.id}
                        type="button"
                        onClick={() => {
                          setSelectedRelTypeId(relType.id);
                          setShowSwitchRelMenu(false);
                          setPanOffset({ x: 0, y: 0 });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-start justify-between gap-2 ${
                          isCurrent
                            ? 'bg-[#6d7696] text-white border border-[#5d6685] shadow-sm'
                            : 'text-[#181b26] hover:bg-[#f4f6fb] border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-serif font-semibold truncate">
                            {relType.indexNumber}. {relType.name}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isCurrent ? 'text-white/85' : 'text-[#52586e]'
                            }`}
                          >
                            Didukung: {relType.supportedLabelsText}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isCurrent
                                ? 'bg-white/20 text-white'
                                : 'bg-[#f4f6fb] text-[#52586e]'
                            }`}
                          >
                            {countNodes} tag
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pill 3: + Tambah Tag / Cabang */}
            <button
              type="button"
              onClick={() => {
                handleResetNodeForm();
                setShowQuickAddModal(true);
              }}
              className={`h-8 px-3 rounded-full bg-[#6d7696] hover:bg-[#5d6685] backdrop-blur-md border border-[#8e98b8] text-xs font-serif font-medium text-white shadow-md flex items-center gap-1.5 transition whitespace-nowrap ${
                studioMode === 'main' && !zoomingGraphNode
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tag / Cabang</span>
            </button>

            {/* Pill 4: Contoh Percabangan */}
            <button
              type="button"
              onClick={handleLoadBranchingPreset}
              className={`h-8 px-2.5 rounded-full bg-white/95 hover:bg-[#f4f6fb] backdrop-blur-md border border-[#cbd3e6] text-[11px] font-serif font-medium text-[#181b26] shadow-md flex items-center gap-1 transition whitespace-nowrap ${
                studioMode === 'main' && !zoomingGraphNode
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
              title="Muat contoh jaringan percabangan untuk jenis relationship ini"
            >
              <Sparkles className="w-3 h-3 text-[#5b74a8]" />
              <span>Contoh Cabang</span>
            </button>
          </div>

          {/* Top-Right Minimalist Bar: Zoom In / Zoom Out & Mode Kanvas Toggle */}
          <div
            className={`absolute top-[56px] right-5 flex items-center gap-2 ${
              studioMode === 'main' && !zoomingGraphNode
                ? 'pointer-events-auto'
                : 'pointer-events-none'
            }`}
          >
            <div className="h-8 px-2 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2 h-6 rounded-full hover:bg-[#f4f6fb] text-[#181b26] flex items-center gap-1 text-[11px] font-serif transition"
                title="Zoom Out (Perkecil)"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#5b74a8]" />
                <span className="hidden sm:inline">Zoom Out</span>
              </button>
              <span className="text-[11px] font-mono text-[#181b26] font-semibold px-1.5 border-x border-[#e2e7f3]">
                {Math.round(relZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2 h-6 rounded-full hover:bg-[#f4f6fb] text-[#181b26] flex items-center gap-1 text-[11px] font-serif transition"
                title="Zoom In (Perbesar)"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#5b74a8]" />
                <span className="hidden sm:inline">Zoom In</span>
              </button>
              <button
                type="button"
                onClick={handleResetZoomAndPan}
                className="w-6 h-6 rounded-full hover:bg-[#f4f6fb] text-[#52586e] hover:text-[#181b26] flex items-center justify-center"
                title="Reset Zoom & Posisi"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStudioMode('canvas')}
              className="h-8 px-3.5 rounded-full bg-[#6d7696] hover:bg-[#5d6685] backdrop-blur-md border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow-md flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mode Kanvas</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PERSISTENT BOTTOM-LEFT FLOATING ZOOM IN / ZOOM OUT DOCK        */}
        {/* Always accessible in both Mode Utama and Mode Kanvas           */}
        {/* ============================================================== */}
        {!zoomingGraphNode && (
          <div className="absolute bottom-5 left-5 z-30 h-9 px-2.5 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] shadow-xl flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="px-2.5 h-6 rounded-full bg-[#f4f6fb] hover:bg-[#e4eaf6] text-[#181b26] flex items-center gap-1 text-xs font-serif transition"
              title="Zoom Out (Perkecil Kanvas)"
            >
              <ZoomOut className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Zoom Out</span>
            </button>
            <span className="text-xs font-mono font-semibold text-[#4b67a1] px-2">
              {Math.round(relZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="px-2.5 h-6 rounded-full bg-[#f4f6fb] hover:bg-[#e4eaf6] text-[#181b26] flex items-center gap-1 text-xs font-serif transition"
              title="Zoom In (Perbesar Kanvas)"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Zoom In</span>
            </button>
            <button
              type="button"
              onClick={handleResetZoomAndPan}
              className="w-6 h-6 rounded-full hover:bg-[#f4f6fb] text-[#52586e] hover:text-[#181b26] flex items-center justify-center ml-0.5"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE KANVAS FLOATING HUD (Minimalist Editor & Branch Manager)  */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 z-30 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            studioMode === 'canvas'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 pointer-events-none translate-y-4'
          }`}
        >
          {/* Top Minimalist Bar in Mode Kanvas */}
          <div
            className={`absolute top-[56px] left-5 right-5 flex flex-wrap items-center justify-between gap-2 ${
              studioMode === 'canvas' ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 px-3.5 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] text-xs font-serif font-semibold text-[#181b26] flex items-center gap-2 shadow-md">
                <GitBranch className="w-3.5 h-3.5 text-[#5b74a8]" />
                <span>
                  Mode Kanvas · {activeRelType.indexNumber}/5 {activeRelType.shortName}
                </span>
                <span className="text-[10px] text-[#52586e] font-normal border-l border-[#cbd3e6] pl-2">
                  Geser kartu bebas di kanvas
                </span>
              </div>

              {/* Switch between the 5 Relationship Types inside Canvas Mode too */}
              <select
                value={selectedRelTypeId}
                onChange={(e) => {
                  setSelectedRelTypeId(e.target.value as FixedRelationshipTypeId);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="h-8 px-3 rounded-full bg-white/95 border border-[#cbd3e6] text-xs font-serif font-medium text-[#181b26] shadow-md focus:outline-none focus:border-[#738bbd]"
              >
                {FIXED_WORLD_RELATIONSHIP_TYPES.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.indexNumber}. {rt.name} ({rt.supportedLabelsText})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setStudioMode('main');
                setLinkingFromNodeId(null);
              }}
              className="h-8 px-4 rounded-full bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow-md flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Selesai &amp; Kembali ke Mode Utama</span>
            </button>
          </div>

          {/* Right Compact Inspector Drawer for Adding/Editing Tag Nodes & Branch Connections */}
          <div
            className={`absolute top-26 right-5 bottom-6 w-84 rounded-3xl bg-white/96 backdrop-blur-xl border border-[#cbd3e6] shadow-2xl p-4 flex flex-col gap-4 overflow-y-auto ${
              studioMode === 'canvas' ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            {/* Section A: Add / Edit Supported Tag Node */}
            <form onSubmit={handleSaveNodeSubmit} className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#e2e7f3] pb-2">
                <h4 className="text-xs font-serif font-semibold text-[#5b74a8] uppercase tracking-wider">
                  {editingNodeId ? 'Edit Tag / Mark Node' : 'Tambah Tag & Percabangan'}
                </h4>
                {editingNodeId && (
                  <button
                    type="button"
                    onClick={() => handleResetNodeForm()}
                    className="text-[11px] text-[#5b74a8] hover:text-[#181b26] underline"
                  >
                    + Buat Baru
                  </button>
                )}
              </div>

              {/* Supported Tag Category Selector (Strictly restricted to the active Relationship Type!) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-serif font-semibold text-[#52586e]">
                  Pilih Tab Tag yang Didukung *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeRelType.supportedTabs.map((tabKey) => {
                    const meta = TAG_TAB_METADATA[tabKey];
                    const active = nodeTagTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => {
                          setNodeTagTab(tabKey);
                          setSelectedExistingArticleId('');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-left text-[11px] font-serif transition ${
                          active
                            ? 'bg-[#6d7696] border-[#5d6685] text-white font-semibold shadow-sm'
                            : 'bg-[#f4f6fb] border-[#cbd3e6] text-[#181b26] hover:bg-[#e4eaf6]'
                        }`}
                      >
                        <div>{meta.label}</div>
                        <div className={`text-[9px] ${active ? 'text-white/80' : 'text-[#52586e]'}`}>
                          {meta.indonesianLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pick from existing articles in that supported tab */}
              <div className="space-y-1">
                <label className="block text-[11px] font-serif font-semibold text-[#52586e]">
                  Ambil dari Halaman {TAG_TAB_METADATA[nodeTagTab].label} yang Ada
                </label>
                <select
                  value={selectedExistingArticleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedExistingArticleId(id);
                    const found = supportedArticlesByTab[nodeTagTab].find((a) => a.id === id);
                    if (found) {
                      setNodeTitle(found.title);
                      setNodeSummary(found.summary);
                      setNodeThumbnail(String(found.templateValues?.ThumbnailUrl || ''));
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                >
                  <option value="">-- Ketik Tag {TAG_TAB_METADATA[nodeTagTab].label} Baru --</option>
                  {supportedArticlesByTab[nodeTagTab].map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-serif font-semibold text-[#52586e]">
                  Nama Tag ({TAG_TAB_METADATA[nodeTagTab].label}) *
                </label>
                <input
                  type="text"
                  required
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder={`Contoh: ${
                    nodeTagTab === 'characters'
                      ? 'Raja Aldric V'
                      : nodeTagTab === 'locations'
                      ? 'Benteng Utara Valoria'
                      : nodeTagTab === 'organizations'
                      ? 'Ordo Arsiparis Agung'
                      : nodeTagTab === 'species'
                      ? 'Ras Sylvan'
                      : nodeTagTab === 'cosmics'
                      ? 'Nebula Aether'
                      : 'Kutukan Darah Perak'
                  }`}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-serif font-semibold text-[#52586e]">
                  Peran / Kedudukan dalam Relasi
                </label>
                <input
                  type="text"
                  value={nodeRoleSubtitle}
                  onChange={(e) => setNodeRoleSubtitle(e.target.value)}
                  placeholder="Contoh: Pemimpin Faksi / Kasta Atas / Kondisi Mengikat"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                />
              </div>

              {/* Branching Option: Connect as a branch from an existing node */}
              {!editingNodeId && activeNodes.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-[#f4f6fb] border border-[#dce3f2] space-y-2">
                  <label className="block text-[11px] font-serif font-semibold text-[#4b67a1]">
                    Percabangan dari Node (Opsional)
                  </label>
                  <select
                    value={branchFromNodeId}
                    onChange={(e) => setBranchFromNodeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26]"
                  >
                    <option value="">-- Mandiri (Tanpa Induk Cabang) --</option>
                    {activeNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        Cabang dari: {n.title} ({TAG_TAB_METADATA[n.tagTab].label})
                      </option>
                    ))}
                  </select>
                  {branchFromNodeId && (
                    <input
                      type="text"
                      value={branchEdgeLabel}
                      onChange={(e) => setBranchEdgeLabel(e.target.value)}
                      placeholder="Label garis cabang (mis. Aliansi / Hierarki)"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26]"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow transition"
                >
                  {editingNodeId ? 'Simpan Perubahan Node' : '+ Simpan Tag ke Kanvas'}
                </button>
                {editingNodeId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNode(editingNodeId)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600"
                    title="Hapus node ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Section B: Connect Any Two Existing Nodes (Interconnection / Percabangan Lintas Node) */}
            {activeNodes.length >= 2 && (
              <form
                onSubmit={handleConnectExistingNodes}
                className="pt-3 border-t border-[#e2e7f3] space-y-2.5"
              >
                <h4 className="text-xs font-serif font-semibold text-[#4b67a1] uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Hubungkan Antar Node</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={connectSourceId}
                    onChange={(e) => setConnectSourceId(e.target.value)}
                    className="px-2 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-[11px] text-[#181b26]"
                  >
                    <option value="">Dari Node...</option>
                    {activeNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={connectTargetId}
                    onChange={(e) => setConnectTargetId(e.target.value)}
                    className="px-2 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-[11px] text-[#181b26]"
                  >
                    <option value="">Ke Node...</option>
                    {activeNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={connectLabel}
                  onChange={(e) => setConnectLabel(e.target.value)}
                  placeholder="Label hubungan (mis. Konflik / Simbiosis)"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26]"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={connectLineStyle}
                    onChange={(e) =>
                      setConnectLineStyle(e.target.value as RelationshipGraphEdge['lineStyle'])
                    }
                    className="px-2 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-[11px] text-[#181b26]"
                  >
                    <option value="branch">Garis Percabangan</option>
                    <option value="direct">Garis Lengkung</option>
                    <option value="dashed">Garis Putus-putus</option>
                  </select>
                  <select
                    value={connectDirection}
                    onChange={(e) =>
                      setConnectDirection(e.target.value as RelationshipGraphEdge['direction'])
                    }
                    className="px-2 py-1.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-[11px] text-[#181b26]"
                  >
                    <option value="directed">Satu Arah (→)</option>
                    <option value="bidirectional">Dua Arah (↔)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 rounded-xl bg-[#7792c4] hover:bg-[#6681b5] text-white font-serif font-semibold text-xs transition"
                >
                  + Buat Garis Penghubung
                </button>
              </form>
            )}

            {/* Section C: Edit Nama Hubungan Antar Cabang (List of Active Branch Connections) */}
            {activeEdges.length > 0 && (
              <div className="pt-3 border-t border-[#e2e7f3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-semibold text-[#5b74a8] uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Nama Hubungan Antar Cabang</span>
                  </h4>
                  <span className="text-[10px] text-[#52586e]">
                    {activeEdges.length} garis
                  </span>
                </div>
                <div className="space-y-2">
                  {activeEdges.map((edge) => {
                    const srcNode = activeNodes.find((n) => n.id === edge.sourceNodeId);
                    const tgtNode = activeNodes.find((n) => n.id === edge.targetNodeId);
                    if (!srcNode || !tgtNode) return null;
                    return (
                      <div
                        key={edge.id}
                        className="p-2.5 rounded-2xl bg-[#f4f6fb] border border-[#dce3f2] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] text-[#52586e] font-serif">
                          <span className="truncate max-w-[105px] font-semibold text-[#181b26]">
                            {srcNode.title}
                          </span>
                          <span className="text-[#5b74a8]">
                            {edge.direction === 'bidirectional' ? '↔' : '→'}
                          </span>
                          <span className="truncate max-w-[105px] font-semibold text-[#181b26]">
                            {tgtNode.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteEdge(edge.id)}
                            className="text-[#52586e] hover:text-rose-600 p-0.5 shrink-0"
                            title="Hapus hubungan cabang ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={edge.label}
                            onChange={(e) =>
                              handleUpdateEdge(edge.id, { label: e.target.value })
                            }
                            placeholder="Nama hubungan antar cabang..."
                            className="flex-1 px-2.5 py-1 rounded-xl bg-white border border-[#cbd3e6] focus:border-[#738bbd] text-xs text-[#181b26] font-serif focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={edge.lineStyle}
                            onChange={(e) =>
                              handleUpdateEdge(edge.id, {
                                lineStyle: e.target.value as RelationshipGraphEdge['lineStyle']
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-white border border-[#cbd3e6] text-[10px] text-[#181b26]"
                          >
                            <option value="branch">Garis Percabangan</option>
                            <option value="direct">Garis Lengkung</option>
                            <option value="dashed">Garis Putus-putus</option>
                          </select>
                          <select
                            value={edge.direction}
                            onChange={(e) =>
                              handleUpdateEdge(edge.id, {
                                direction: e.target.value as RelationshipGraphEdge['direction']
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-white border border-[#cbd3e6] text-[10px] text-[#181b26]"
                          >
                            <option value="directed">Satu Arah (→)</option>
                            <option value="bidirectional">Dua Arah (↔)</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* QUICK ADD TAG / BRANCH MODAL (Accessible from Mode Utama & Card)     */}
      {/* ==================================================================== */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-[#181b26]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#cbd3e6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#5b74a8] font-semibold">
                  {activeRelType.indexNumber}. {activeRelType.name}
                </span>
                <h3 className="text-lg font-serif font-bold text-[#181b26] mt-0.5">
                  {branchFromNodeId ? 'Buat Percabangan Baru' : 'Tambah Tag / Mark Relasi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f4f6fb] text-[#52586e] hover:text-[#181b26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNodeSubmit} className="space-y-3.5">
              {/* Supported Tabs Only */}
              <div className="space-y-1">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Jenis Tag yang Didukung pada Relationship Ini *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeRelType.supportedTabs.map((tabKey) => {
                    const meta = TAG_TAB_METADATA[tabKey];
                    const active = nodeTagTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => {
                          setNodeTagTab(tabKey);
                          setSelectedExistingArticleId('');
                        }}
                        className={`px-3 py-2 rounded-xl border text-left text-xs font-serif transition ${
                          active
                            ? 'bg-[#6d7696] border-[#5d6685] text-white font-semibold shadow-sm'
                            : 'bg-[#f4f6fb] border-[#cbd3e6] text-[#181b26] hover:bg-[#e4eaf6]'
                        }`}
                      >
                        <div>{meta.label}</div>
                        <div className={`text-[10px] ${active ? 'text-white/80' : 'text-[#52586e]'}`}>
                          {meta.indonesianLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Pilih dari Halaman {TAG_TAB_METADATA[nodeTagTab].label} (Atau Buat Baru)
                </label>
                <select
                  value={selectedExistingArticleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedExistingArticleId(id);
                    const found = supportedArticlesByTab[nodeTagTab].find((a) => a.id === id);
                    if (found) {
                      setNodeTitle(found.title);
                      setNodeSummary(found.summary);
                      setNodeThumbnail(String(found.templateValues?.ThumbnailUrl || ''));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26]"
                >
                  <option value="">-- Buat Tag {TAG_TAB_METADATA[nodeTagTab].label} Baru --</option>
                  {supportedArticlesByTab[nodeTagTab].map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Nama Tag *
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    placeholder={`Nama ${TAG_TAB_METADATA[nodeTagTab].indonesianLabel}...`}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Peran / Keterangan
                  </label>
                  <input
                    type="text"
                    value={nodeRoleSubtitle}
                    onChange={(e) => setNodeRoleSubtitle(e.target.value)}
                    placeholder="Mis. Sekutu / Kasta / Kondisi"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26]"
                  />
                </div>
              </div>

              {activeNodes.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#f4f6fb] border border-[#dce3f2] space-y-2">
                  <label className="block text-xs font-serif font-semibold text-[#4b67a1]">
                    Hubungkan / Cabangkan dari Node:
                  </label>
                  <select
                    value={branchFromNodeId}
                    onChange={(e) => setBranchFromNodeId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26]"
                  >
                    <option value="">-- Tanpa Induk Cabang --</option>
                    {activeNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({TAG_TAB_METADATA[n.tagTab].label})
                      </option>
                    ))}
                  </select>
                  {branchFromNodeId && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={branchEdgeLabel}
                        onChange={(e) => setBranchEdgeLabel(e.target.value)}
                        placeholder="Label cabang (mis. Aliansi)"
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26]"
                      />
                      <select
                        value={branchEdgeStyle}
                        onChange={(e) =>
                          setBranchEdgeStyle(
                            e.target.value as RelationshipGraphEdge['lineStyle']
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26]"
                      >
                        <option value="branch">Garis Percabangan</option>
                        <option value="direct">Garis Lengkung</option>
                        <option value="dashed">Garis Putus-putus</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#cbd3e6] text-xs text-[#52586e]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow"
                >
                  Simpan ke Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
