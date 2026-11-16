import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Upload,
  Check,
  Calendar,
  ExternalLink,
  Edit3,
  MousePointer
} from 'lucide-react';
import { Article, World, TimelineEvent } from '../types/worldbuilding';
import { DepthDirectionalBlurSvgFilter } from './ConcaveLensTransitionOverlay';

export interface WorldTimelineContainer {
  id: string;
  worldId: string;
  name: string;
  description: string;
  optionalStartYear?: number | null;
  optionalEndYear?: number | null;
  createdAt: string;
}

export interface TimelineEventNode {
  id: string;
  timelineId: string;
  worldId: string;
  title: string;
  startYear: number;
  endYear?: number | null;
  yearLabelOverride?: string;
  categoryTag: string;
  categoryColor: 'politik' | 'konflik' | 'sosial' | 'peradaban' | 'kosmis';
  summary: string;
  thumbnailUrl?: string;
  position: 'above' | 'below' | 'auto';
  linkedEventArticleId?: string;
}

interface TimelineStudioViewProps {
  activeWorld: World;
  worlds: World[];
  articles: Article[];
  timelineEvents: TimelineEvent[];
  onNavigateToEvent: (eventArticleId: string) => void;
  onStartZoomTransition?: () => void;
  onCreateOrSyncEventArticle: (payload: {
    id?: string;
    worldId: string;
    title: string;
    summary: string;
    thumbnailUrl?: string;
    categoryTag?: string;
    yearText?: string;
  }) => Article;
  historyRevision?: number;
}

const LOCAL_TIMELINES_STORAGE_KEY = 'alt_universe_timelines_studio_v1';

const CATEGORY_BADGE_STYLES: Record<
  TimelineEventNode['categoryColor'],
  { label: string; badgeClass: string; borderGlow: string; dotColor: string }
> = {
  politik: {
    label: 'Politik',
    badgeClass: 'bg-[#5c4028] text-[#ebd5b8] border border-[#8c6543]/60',
    borderGlow: 'border-[#c49a6c]/55 hover:border-[#ebd0a8]',
    dotColor: '#d4a672'
  },
  konflik: {
    label: 'Konflik',
    badgeClass: 'bg-[#63242b] text-[#f2c4c9] border border-[#963c46]/60',
    borderGlow: 'border-[#b8656e]/55 hover:border-[#f09ca5]',
    dotColor: '#d97780'
  },
  sosial: {
    label: 'Sosial',
    badgeClass: 'bg-[#2f5741] text-[#c5ebd5] border border-[#498262]/60',
    borderGlow: 'border-[#6da888]/55 hover:border-[#9ee0bc]',
    dotColor: '#6bc294'
  },
  peradaban: {
    label: 'Peradaban',
    badgeClass: 'bg-[#594a24] text-[#f0e0b6] border border-[#8c763e]/60',
    borderGlow: 'border-[#cbb06b]/55 hover:border-[#f2d994]',
    dotColor: '#e0c170'
  },
  kosmis: {
    label: 'Kosmis',
    badgeClass: 'bg-[#462f5e] text-[#dec5f5] border border-[#6f4e91]/60',
    borderGlow: 'border-[#9678b8]/55 hover:border-[#c9aef0]',
    dotColor: '#a98bd4'
  }
};

// Built-in SVG artwork fallback when an event node has no custom uploaded thumbnail
const renderDefaultEventArtwork = (
  colorKey: TimelineEventNode['categoryColor'],
  index: number
) => {
  if (colorKey === 'konflik' || index % 4 === 1) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="bgKonflik" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d99b82" />
            <stop offset="60%" stopColor="#8c4f46" />
            <stop offset="100%" stopColor="#2b1b24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgKonflik)" />
        <polygon points="0,78 32,48 65,78" fill="#593232" opacity="0.7" />
        <polygon points="40,78 75,42 100,78" fill="#452428" opacity="0.8" />
        <line x1="48" y1="16" x2="48" y2="75" stroke="#24151a" strokeWidth="2.5" />
        <path d="M48,18 L82,28 L48,40 Z" fill="#9e2a2b" />
        <circle cx="30" cy="68" r="5" fill="#24151a" />
        <rect x="26" y="73" width="8" height="18" rx="2" fill="#24151a" />
        <circle cx="58" cy="66" r="5.5" fill="#24151a" />
        <rect x="53" y="72" width="10" height="20" rx="2" fill="#24151a" />
        <circle cx="76" cy="70" r="4.5" fill="#24151a" />
        <rect x="72" y="75" width="8" height="16" rx="2" fill="#24151a" />
      </svg>
    );
  }
  if (colorKey === 'sosial' || index % 4 === 2) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="bgSosial" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8c7de" />
            <stop offset="65%" stopColor="#6e7f99" />
            <stop offset="100%" stopColor="#252c38" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgSosial)" />
        <polygon points="18,52 50,24 82,52" fill="#4a3f3d" />
        <rect x="24" y="52" width="52" height="32" fill="#dfd3c3" />
        <rect x="32" y="58" width="10" height="18" fill="#4a3f3d" />
        <rect x="46" y="56" width="10" height="26" fill="#362c2a" />
        <rect x="60" y="58" width="10" height="18" fill="#4a3f3d" />
        <rect x="0" y="82" width="100" height="18" fill="#2d4739" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
      <defs>
        <linearGradient id="bgPolitik" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8c3a5" />
          <stop offset="55%" stopColor="#8e7970" />
          <stop offset="100%" stopColor="#2a232b" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bgPolitik)" />
      <polygon points="10,72 42,36 74,72" fill="#6b5b6e" opacity="0.65" />
      <polygon points="45,72 76,30 105,72" fill="#524557" opacity="0.75" />
      <polygon points="16,72 28,42 40,72" fill="#4a372d" />
      <polygon points="34,72 50,30 66,72" fill="#3b2a22" />
      <rect x="0" y="72" width="100" height="28" fill="#332624" />
      <path d="M35,100 L46,72 L56,72 L68,100 Z" fill="#cfa676" opacity="0.7" />
    </svg>
  );
};

export const TimelineStudioView: React.FC<TimelineStudioViewProps> = ({
  activeWorld,
  worlds,
  articles,
  onNavigateToEvent,
  onStartZoomTransition,
  onCreateOrSyncEventArticle,
  historyRevision = 0
}) => {
  const isRestoringRef = useRef<boolean>(false);

  // Load persisted timelines & nodes from localStorage
  const [timelines, setTimelines] = useState<WorldTimelineContainer[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.timelines)) return parsed.timelines;
      }
    } catch {
      // Ignore corrupt storage
    }
    return [];
  });

  const [eventNodes, setEventNodes] = useState<TimelineEventNode[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.eventNodes)) return parsed.eventNodes;
      }
    } catch {
      // Ignore corrupt storage
    }
    return [];
  });

  const [selectedTimelineId, setSelectedTimelineId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.selectedTimelineId === 'string') return parsed.selectedTimelineId;
      }
    } catch {
      // Ignore corrupt storage
    }
    return '';
  });

  // Restore state when global Undo / Redo (historyRevision) is triggered
  useEffect(() => {
    if (historyRevision === 0) return;
    try {
      const raw = localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY);
      if (raw) {
        isRestoringRef.current = true;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.timelines)) setTimelines(parsed.timelines);
        if (Array.isArray(parsed.eventNodes)) setEventNodes(parsed.eventNodes);
        if (typeof parsed.selectedTimelineId === 'string') {
          setSelectedTimelineId(parsed.selectedTimelineId);
        }
        window.setTimeout(() => {
          isRestoringRef.current = false;
        }, 0);
      }
    } catch {
      // Ignore corrupt storage
    }
  }, [historyRevision]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_TIMELINES_STORAGE_KEY,
        JSON.stringify({ timelines, eventNodes, selectedTimelineId })
      );
      if (!isRestoringRef.current) {
        window.dispatchEvent(new CustomEvent('alt-universe-substudio-change'));
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [timelines, eventNodes, selectedTimelineId]);
  const [studioMode, setStudioMode] = useState<'main' | 'canvas'>('main');
  const [showSwitchTimelineMenu, setShowSwitchTimelineMenu] = useState<boolean>(false);

  // Step 1 Modal: Create / Edit Timeline Container
  const [showCreateTimelineModal, setShowCreateTimelineModal] = useState<boolean>(false);
  const [newTimelineName, setNewTimelineName] = useState<string>('');
  const [newTimelineDesc, setNewTimelineDesc] = useState<string>('');
  const [newTimelineWorldId, setNewTimelineWorldId] = useState<string>(activeWorld.id);
  const [newTimelineStartYear, setNewTimelineStartYear] = useState<string>('');
  const [newTimelineEndYear, setNewTimelineEndYear] = useState<string>('');

  // Event Node Form State (Used in Canvas Mode & Quick Add Event Modal)
  const [editingNodeId, setEditingNodeId] = useState<string>('');
  const [nodeTitle, setNodeTitle] = useState<string>('');
  const [nodeStartYear, setNodeStartYear] = useState<string>('100');
  const [nodeEndYear, setNodeEndYear] = useState<string>('');
  const [nodeYearOverride, setNodeYearOverride] = useState<string>('');
  const [nodeCategoryTag, setNodeCategoryTag] = useState<string>('Peradaban');
  const [nodeCategoryColor, setNodeCategoryColor] =
    useState<TimelineEventNode['categoryColor']>('peradaban');
  const [nodePosition, setNodePosition] = useState<TimelineEventNode['position']>('auto');
  const [nodeSummary, setNodeSummary] = useState<string>('');
  const [nodeThumbnail, setNodeThumbnail] = useState<string>('');
  const [selectedExistingEventArticleId, setSelectedExistingEventArticleId] =
    useState<string>('');
  const [showQuickAddEventModal, setShowQuickAddEventModal] = useState<boolean>(false);

  const eventThumbInputRef = useRef<HTMLInputElement | null>(null);

  // Pan & Zoom State for the Wide Timeline Surface
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number }>({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0
  });
  const hasDraggedRef = useRef<boolean>(false);

  // 1.5-second (1500ms) transition when clicking an Event Tag on the Timeline:
  // Timeline thumbnail stays in place on the timeline card without morphing its position/size
  // to the Event page, experiencing the exact same 1.5s Z-depth zoom-in blur as the timeline page
  const [zoomingEventNode, setZoomingEventNode] = useState<TimelineEventNode | null>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
    };
  }, []);

  // Available Event Articles from Master Workspace ("Event" section)
  const eventArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.category === 'Events' ||
          a.templateType === 'Event / Historical Milestone' ||
          a.tags.includes('Event')
      ),
    [articles]
  );

  // Active Timeline selection
  const activeTimeline = useMemo(() => {
    if (timelines.length === 0) return null;
    return timelines.find((t) => t.id === selectedTimelineId) || timelines[0];
  }, [timelines, selectedTimelineId]);

  useEffect(() => {
    if (activeTimeline && activeTimeline.id !== selectedTimelineId) {
      setSelectedTimelineId(activeTimeline.id);
    }
  }, [activeTimeline, selectedTimelineId]);

  // Events belonging to the active Timeline, sorted chronologically by startYear
  const activeTimelineNodes = useMemo(() => {
    if (!activeTimeline) return [];
    return eventNodes
      .filter((n) => n.timelineId === activeTimeline.id)
      .slice()
      .sort((a, b) => a.startYear - b.startYear);
  }, [eventNodes, activeTimeline]);

  // ============================================================================
  // STEP 2: RENTANG WAKTU BERKEMBANG MENGIKUTI KONTEN (Auto-Expanding Span)
  // ============================================================================
  const computedTimeRange = useMemo(() => {
    const hasManualStart =
      activeTimeline?.optionalStartYear !== undefined &&
      activeTimeline?.optionalStartYear !== null &&
      !Number.isNaN(Number(activeTimeline.optionalStartYear));
    const hasManualEnd =
      activeTimeline?.optionalEndYear !== undefined &&
      activeTimeline?.optionalEndYear !== null &&
      !Number.isNaN(Number(activeTimeline.optionalEndYear));

    if (activeTimelineNodes.length === 0) {
      const start = hasManualStart ? Number(activeTimeline!.optionalStartYear) : 100;
      const end = hasManualEnd ? Number(activeTimeline!.optionalEndYear) : 800;
      return {
        minYear: Math.min(start, end),
        maxYear: Math.max(start, end),
        isAutoExpanded: !hasManualStart && !hasManualEnd
      };
    }

    const nodeYears: number[] = [];
    activeTimelineNodes.forEach((n) => {
      nodeYears.push(n.startYear);
      if (n.endYear !== undefined && n.endYear !== null && !Number.isNaN(Number(n.endYear))) {
        nodeYears.push(Number(n.endYear));
      }
    });

    let minY = Math.min(...nodeYears);
    let maxY = Math.max(...nodeYears);

    if (hasManualStart) {
      minY = Math.min(minY, Number(activeTimeline!.optionalStartYear));
    }
    if (hasManualEnd) {
      maxY = Math.max(maxY, Number(activeTimeline!.optionalEndYear));
    }

    return {
      minYear: minY,
      maxYear: maxY,
      isAutoExpanded: true
    };
  }, [activeTimeline, activeTimelineNodes]);

  // Compute horizontal X positions (in pixels on the wide timeline surface)
  // Combines proportional year placement with minimum card spacing so cards never collide
  const positionedNodes = useMemo(() => {
    const count = activeTimelineNodes.length;
    if (count === 0) return [];

    const baseWidth = Math.max(1850, count * 390);
    const leftPad = 240;
    const rightPad = 240;
    const usableWidth = baseWidth - leftPad - rightPad;

    const span = Math.max(1, computedTimeRange.maxYear - computedTimeRange.minYear);

    const rawPositions = activeTimelineNodes.map((node, idx) => {
      const ratio =
        count === 1
          ? 0.5
          : (node.startYear - computedTimeRange.minYear) / span;
      // Blend proportional time position (65%) with even sequence distribution (35%) so large gaps are visible yet cards stay readable
      const evenRatio = count === 1 ? 0.5 : idx / (count - 1);
      const blendedRatio = span === 0 ? evenRatio : ratio * 0.65 + evenRatio * 0.35;
      return leftPad + blendedRatio * usableWidth;
    });

    // Enforce minimum horizontal distance of 310px between adjacent nodes
    const minGap = 310;
    const adjustedPositions = [...rawPositions];
    for (let i = 1; i < adjustedPositions.length; i++) {
      if (adjustedPositions[i] - adjustedPositions[i - 1] < minGap) {
        adjustedPositions[i] = adjustedPositions[i - 1] + minGap;
      }
    }

    const totalSurfaceWidth = Math.max(
      2160,
      (adjustedPositions[adjustedPositions.length - 1] || 1600) + rightPad + 120
    );

    return activeTimelineNodes.map((node, idx) => {
      const resolvedSide: 'above' | 'below' =
        node.position === 'auto'
          ? idx % 2 === 0
            ? 'above'
            : 'below'
          : node.position;
      return {
        node,
        xPx: adjustedPositions[idx],
        side: resolvedSide,
        totalSurfaceWidth
      };
    });
  }, [activeTimelineNodes, computedTimeRange]);

  const surfaceWidth =
    positionedNodes.length > 0 ? positionedNodes[0].totalSurfaceWidth : 2160;
  const surfaceHeight = 1150;

  // Create New Timeline Handler (Step 1)
  const handleCreateTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newTimelineName.trim() || `World Timeline (${timelines.length + 1})`;
    const parsedStart =
      newTimelineStartYear.trim() !== '' && !Number.isNaN(Number(newTimelineStartYear))
        ? Number(newTimelineStartYear)
        : null;
    const parsedEnd =
      newTimelineEndYear.trim() !== '' && !Number.isNaN(Number(newTimelineEndYear))
        ? Number(newTimelineEndYear)
        : null;

    const created: WorldTimelineContainer = {
      id: `tl-${Date.now()}`,
      worldId: newTimelineWorldId || activeWorld.id,
      name: finalName,
      description:
        newTimelineDesc.trim() ||
        'Rentang waktu berkembang otomatis mengikuti peristiwa sejarah yang dimasukkan.',
      optionalStartYear: parsedStart,
      optionalEndYear: parsedEnd,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setTimelines((prev) => [created, ...prev]);
    setSelectedTimelineId(created.id);
    setNewTimelineName('');
    setNewTimelineDesc('');
    setNewTimelineStartYear('');
    setNewTimelineEndYear('');
    setShowCreateTimelineModal(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleResetNodeForm = () => {
    setEditingNodeId('');
    setNodeTitle('');
    setNodeStartYear(
      activeTimelineNodes.length > 0
        ? String(activeTimelineNodes[activeTimelineNodes.length - 1].startYear + 150)
        : '100'
    );
    setNodeEndYear('');
    setNodeYearOverride('');
    setNodeCategoryTag('Peradaban');
    setNodeCategoryColor('peradaban');
    setNodePosition('auto');
    setNodeSummary('');
    setNodeThumbnail('');
    setSelectedExistingEventArticleId('');
  };

  const handleSelectNodeForEdit = (node: TimelineEventNode) => {
    const linkedArt = eventArticles.find(
      (a) =>
        (node.linkedEventArticleId && a.id === node.linkedEventArticleId) ||
        a.title.toLowerCase() === node.title.toLowerCase()
    );
    const resolvedThumb = String(
      linkedArt?.templateValues?.ThumbnailUrl ||
        linkedArt?.templateValues?.CustomIconUrl ||
        node.thumbnailUrl ||
        ''
    ).trim();

    setEditingNodeId(node.id);
    setNodeTitle(linkedArt?.title || node.title);
    setNodeStartYear(String(node.startYear));
    setNodeEndYear(node.endYear !== null && node.endYear !== undefined ? String(node.endYear) : '');
    setNodeYearOverride(node.yearLabelOverride || '');
    setNodeCategoryTag(node.categoryTag);
    setNodeCategoryColor(node.categoryColor);
    setNodePosition(node.position);
    setNodeSummary(node.summary);
    setNodeThumbnail(resolvedThumb);
    setSelectedExistingEventArticleId(linkedArt?.id || node.linkedEventArticleId || '');
  };

  // Auto-save edits when modifying an existing event node in Canvas Mode
  useEffect(() => {
    if (!editingNodeId || !activeTimeline || showQuickAddEventModal) return;
    const existing = eventNodes.find((n) => n.id === editingNodeId);
    if (!existing) return;

    const startYr = Number(nodeStartYear) || 100;
    const endYr =
      nodeEndYear.trim() !== '' && !Number.isNaN(Number(nodeEndYear))
        ? Number(nodeEndYear)
        : null;
    const finalTitle = nodeTitle.trim() || existing.title;

    if (
      existing.title === finalTitle &&
      existing.startYear === startYr &&
      existing.endYear === endYr &&
      (existing.yearLabelOverride || '') === nodeYearOverride.trim() &&
      existing.categoryTag === (nodeCategoryTag.trim() || existing.categoryTag) &&
      existing.categoryColor === nodeCategoryColor &&
      existing.position === nodePosition &&
      existing.summary === nodeSummary.trim() &&
      (existing.thumbnailUrl || '') === nodeThumbnail
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEventNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? {
                ...n,
                title: finalTitle,
                startYear: startYr,
                endYear: endYr,
                yearLabelOverride: nodeYearOverride.trim() || undefined,
                categoryTag:
                  nodeCategoryTag.trim() || CATEGORY_BADGE_STYLES[nodeCategoryColor].label,
                categoryColor: nodeCategoryColor,
                position: nodePosition,
                summary: nodeSummary.trim(),
                thumbnailUrl: nodeThumbnail || undefined
              }
            : n
        )
      );
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    editingNodeId,
    activeTimeline,
    showQuickAddEventModal,
    nodeTitle,
    nodeStartYear,
    nodeEndYear,
    nodeYearOverride,
    nodeCategoryTag,
    nodeCategoryColor,
    nodePosition,
    nodeSummary,
    nodeThumbnail,
    eventNodes
  ]);

  const handleEventThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Add or Update an Event on the Timeline + Sync with Master Workspace "Event" Article
  const handleSaveTimelineEventNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTimeline) return;

    const finalTitle = nodeTitle.trim() || `Peristiwa Tahun ${nodeStartYear || 100}`;
    const startYr = Number(nodeStartYear) || 100;
    const endYr =
      nodeEndYear.trim() !== '' && !Number.isNaN(Number(nodeEndYear))
        ? Number(nodeEndYear)
        : null;

    const formattedYearText = nodeYearOverride.trim()
      ? nodeYearOverride.trim()
      : endYr !== null
      ? `${startYr} – ${endYr}`
      : `${startYr}`;

    // Ensure a corresponding Event article exists in Master Workspace -> Event
    const syncedArticle = onCreateOrSyncEventArticle({
      id: selectedExistingEventArticleId || undefined,
      worldId: activeTimeline.worldId || activeWorld.id,
      title: finalTitle,
      summary:
        nodeSummary.trim() ||
        `Peristiwa sejarah pada tahun ${formattedYearText} (${nodeCategoryTag.trim() || 'Event'}).`,
      thumbnailUrl: nodeThumbnail || undefined,
      categoryTag: nodeCategoryTag.trim() || 'Event',
      yearText: formattedYearText
    });

    const newNode: TimelineEventNode = {
      id: editingNodeId || `tlnode-${Date.now()}`,
      timelineId: activeTimeline.id,
      worldId: activeTimeline.worldId || activeWorld.id,
      title: finalTitle,
      startYear: startYr,
      endYear: endYr,
      yearLabelOverride: nodeYearOverride.trim() || undefined,
      categoryTag: nodeCategoryTag.trim() || CATEGORY_BADGE_STYLES[nodeCategoryColor].label,
      categoryColor: nodeCategoryColor,
      summary: nodeSummary.trim(),
      thumbnailUrl: nodeThumbnail || undefined,
      position: nodePosition,
      linkedEventArticleId: syncedArticle.id
    };

    setEventNodes((prev) =>
      prev.some((n) => n.id === newNode.id)
        ? prev.map((n) => (n.id === newNode.id ? newNode : n))
        : [...prev, newNode]
    );

    handleResetNodeForm();
    setShowQuickAddEventModal(false);
  };

  // Load Sample Events (100 - 800 Auto-Expanding Example OR Sample_b2b0e321.png Reference)
  const handleLoadPresetEvents = (preset: '100-800' | 'nusantara') => {
    if (!activeTimeline) return;

    const items: Array<{
      title: string;
      startYear: number;
      endYear: number | null;
      yearLabelOverride?: string;
      categoryTag: string;
      categoryColor: TimelineEventNode['categoryColor'];
      position: 'above' | 'below';
      summary: string;
    }> =
      preset === '100-800'
        ? [
            {
              title: 'Peradaban Pertama Muncul',
              startYear: 100,
              endYear: null,
              categoryTag: 'Peradaban',
              categoryColor: 'peradaban' as const,
              position: 'above' as const,
              summary: 'Tahun 100: Peradaban pertama muncul di lembah sungai purba.'
            },
            {
              title: 'Kerajaan Pertama Berdiri',
              startYear: 250,
              endYear: null,
              categoryTag: 'Politik',
              categoryColor: 'politik' as const,
              position: 'below' as const,
              summary: 'Tahun 250: Kerajaan pertama berdiri menyatukan klan-klan awal.'
            },
            {
              title: 'Perang Besar Terjadi',
              startYear: 500,
              endYear: null,
              categoryTag: 'Konflik',
              categoryColor: 'konflik' as const,
              position: 'above' as const,
              summary: 'Tahun 500: Perang besar terjadi memperebutkan takhta dan sumber daya.'
            },
            {
              title: 'Kerajaan Runtuh',
              startYear: 800,
              endYear: null,
              categoryTag: 'Kosmis',
              categoryColor: 'kosmis' as const,
              position: 'below' as const,
              summary: 'Tahun 800: Kerajaan runtuh dan memulai era pecahan baru.'
            }
          ]
        : [
            {
              title: 'Pendirian Keraton',
              startYear: 1755,
              endYear: null,
              categoryTag: 'Politik',
              categoryColor: 'politik' as const,
              position: 'above' as const,
              summary: 'Pendirian pusat pemerintahan dan tatanan budaya keraton.'
            },
            {
              title: 'Perjanjian Giyanti',
              startYear: 1757,
              endYear: null,
              categoryTag: 'Politik',
              categoryColor: 'politik' as const,
              position: 'below' as const,
              summary: 'Kesepakatan politik besar yang membagi wilayah kekuasaan.'
            },
            {
              title: 'Perang Jawa',
              startYear: 1825,
              endYear: 1830,
              categoryTag: 'Konflik',
              categoryColor: 'konflik' as const,
              position: 'above' as const,
              summary: 'Perjuangan besar selama lima tahun (1825 – 1830).'
            },
            {
              title: 'Modernisasi Jawa',
              startYear: 1900,
              endYear: 1940,
              categoryTag: 'Sosial',
              categoryColor: 'sosial' as const,
              position: 'below' as const,
              summary: 'Transformasi infrastruktur, pendidikan, dan pergerakan sosial.'
            },
            {
              title: 'Era Kemerdekaan',
              startYear: 1945,
              endYear: null,
              yearLabelOverride: 'Jawa · 1945',
              categoryTag: 'Politik',
              categoryColor: 'politik' as const,
              position: 'above' as const,
              summary: 'Lahirnya kedaulatan baru dan babak baru sejarah bangsa.'
            }
          ];

    const createdNodes: TimelineEventNode[] = items.map((item, idx) => {
      const yrText = item.yearLabelOverride
        ? item.yearLabelOverride
        : item.endYear
        ? `${item.startYear} – ${item.endYear}`
        : `${item.startYear}`;

      const syncedArt = onCreateOrSyncEventArticle({
        worldId: activeTimeline.worldId || activeWorld.id,
        title: item.title,
        summary: item.summary,
        categoryTag: item.categoryTag,
        yearText: yrText
      });

      return {
        id: `tlnode-${Date.now()}-${idx}`,
        timelineId: activeTimeline.id,
        worldId: activeTimeline.worldId || activeWorld.id,
        title: item.title,
        startYear: item.startYear,
        endYear: item.endYear,
        yearLabelOverride: item.yearLabelOverride,
        categoryTag: item.categoryTag,
        categoryColor: item.categoryColor,
        summary: item.summary,
        position: item.position,
        linkedEventArticleId: syncedArt.id
      };
    });

    setEventNodes((prev) => [
      ...prev.filter((n) => n.timelineId !== activeTimeline.id),
      ...createdNodes
    ]);
    setPanOffset({ x: 0, y: 0 });
  };

  // 1.5s (1500ms) Full Transition:
  // - First 0.2s (200ms) of the blur transition shifts the timeline so the target event is centered
  // - Timeline thumbnail stays in its original position & size inside the timeline card
  // - Receives the exact same 1.5s Z-depth directional zoom-in blur effect as the timeline page
  const handleTriggerEventZoomTransition = (node: TimelineEventNode) => {
    if (zoomingEventNode) return;
    const matchedByTitleOrId = eventArticles.find(
      (a) =>
        (node.linkedEventArticleId && a.id === node.linkedEventArticleId) ||
        a.title.toLowerCase() === node.title.toLowerCase()
    );
    let targetArticleId = matchedByTitleOrId?.id || node.linkedEventArticleId;
    if (!targetArticleId || !articles.some((a) => a.id === targetArticleId)) {
      const created = onCreateOrSyncEventArticle({
        worldId: node.worldId || activeWorld.id,
        title: node.title,
        summary: node.summary || `Peristiwa pada tahun ${node.startYear}`,
        thumbnailUrl: node.thumbnailUrl,
        categoryTag: node.categoryTag,
        yearText: node.endYear ? `${node.startYear} – ${node.endYear}` : `${node.startYear}`
      });
      targetArticleId = created.id;
    }

    if (targetArticleId && node.linkedEventArticleId !== targetArticleId) {
      setEventNodes((prev) =>
        prev.map((n) =>
          n.id === node.id ? { ...n, linkedEventArticleId: targetArticleId } : n
        )
      );
    }

    // Shift timeline during the first 0.2s (200ms) of the blur transition so the target event is centered
    const targetPositioned = positionedNodes.find((p) => p.node.id === node.id);
    if (targetPositioned) {
      const targetPanX = Math.round(surfaceWidth / 2 - targetPositioned.xPx);
      const targetPanY = targetPositioned.side === 'above' ? 112 : -112;
      setPanOffset({ x: targetPanX, y: targetPanY });
    }

    setShowSwitchTimelineMenu(false);
    onStartZoomTransition?.();
    setZoomingEventNode(node);

    if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = window.setTimeout(() => {
      onNavigateToEvent(targetArticleId!);
    }, 1500);
  };

  // Mouse Drag / Pan Handlers on the Wide Timeline Surface
  const handleSurfaceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || zoomingEventNode) return;
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
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }
    setPanOffset({
      x: Math.max(-1400, Math.min(900, panStartRef.current.originX + dx)),
      y: Math.max(-360, Math.min(360, panStartRef.current.originY + dy))
    });
  };

  const handleSurfaceMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="-mx-6 sm:-mx-8 -mt-22 sm:-mt-24 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] h-screen bg-[#eef1f8] text-[#181b26] select-none overflow-hidden relative flex flex-col">
      <input
        ref={eventThumbInputRef}
        type="file"
        accept="image/*"
        onChange={handleEventThumbnailUpload}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* STATE 1: EMPTY TIMELINE VIEW (Matches Map_if_empty_302cf2ab.png)     */}
      {/* ==================================================================== */}
      {!activeTimeline ? (
        <div className="flex-1 w-full h-full pt-20 pb-8 px-6 sm:px-10 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setNewTimelineWorldId(activeWorld.id);
              setShowCreateTimelineModal(true);
            }}
            className="w-full h-full max-w-[1380px] max-h-[820px] rounded-[34px] border border-dashed border-white/80 bg-gradient-to-br from-[#879fd0] via-[#7b93c4] to-[#738bbd] shadow-[0_18px_45px_rgba(115,139,189,0.28)] transition-all duration-300 flex flex-col items-center justify-center gap-4 group cursor-pointer"
          >
            <Plus className="w-20 h-20 text-white stroke-[2.2] group-hover:scale-105 transition-transform duration-300 drop-shadow-sm" />
            <div className="text-2xl sm:text-3xl font-serif text-white tracking-wide drop-shadow-sm">
              Add New Timeline
            </div>
            <p className="text-xs sm:text-sm font-serif text-white/90 max-w-md text-center">
              Mulai dari Timeline utama (misalnya World Timeline). Cukup tentukan Nama, Deskripsi, World terkait, dan Rentang Waktu (opsional).
            </p>
          </button>
        </div>
      ) : (
        /* ================================================================== */
        /* STATE 2: POPULATED WIDE TIMELINE SURFACE (Mode Utama & Mode Kanvas)*/
        /* ================================================================== */
        <div
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
                'radial-gradient(circle at 38% 50%, rgba(135, 159, 208, 0.34) 0%, rgba(119, 146, 196, 0.16) 45%, rgba(238, 241, 248, 0.96) 82%)'
            }}
          />

          {/* ============================================================== */}
          {/* OVERSIZED FREELY PANNABLE TIMELINE CANVAS                      */}
          {/* - Outer wrapper: 1.5s (1500ms) Z-depth directional zoom-in blur */}
          {/* - Inner canvas: 0.8s (800ms) pan shift to center target event   */}
          {/* ============================================================== */}
          <DepthDirectionalBlurSvgFilter
            filterId="timeline-depth-directional-blur"
            depthScale={zoomingEventNode ? 95 : 0}
          />
          <div
            style={(() => {
              if (zoomingEventNode) {
                const targetScale = Math.max(2.5, timelineZoom * 2.5);
                return {
                  width: `${surfaceWidth}px`,
                  height: `${surfaceHeight}px`,
                  transformOrigin: '50% 50%',
                  transform: `perspective(900px) translate3d(0, 0, 180px) scale(${targetScale})`,
                  filter: 'url(#timeline-depth-directional-blur) brightness(1.04)',
                  transition:
                    'transform 1500ms cubic-bezier(0.22, 1, 0.36, 1), filter 1500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1500ms ease'
                };
              }

              return {
                width: `${surfaceWidth}px`,
                height: `${surfaceHeight}px`,
                transformOrigin: '50% 50%',
                transform: `scale(${timelineZoom})`,
                filter: 'none',
                transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), filter 350ms ease'
              };
            })()}
            className="relative shrink-0 opacity-100"
          >
            <div
              style={{
                width: `${surfaceWidth}px`,
                height: `${surfaceHeight}px`,
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
                transition: zoomingEventNode
                  ? 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : isPanning
                  ? 'none'
                  : 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              className="relative w-full h-full"
            >
            {/* Subtle historical grid lines & vignette */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(109,118,150,0.12) 1px, transparent 1px)',
                backgroundSize: '160px 100%'
              }}
            />

            {/* ============================================================ */}
            {/* HORIZONTAL GLOWING TIMELINE AXIS (Matches Sample_b2b0e321.png)*/}
            {/* ============================================================ */}
            <div className="absolute left-24 right-24 top-1/2 -translate-y-1/2 h-[3px] flex items-center">
              {/* Gradient horizontal axis bar */}
              <div
                className="w-full h-[3px] rounded-full shadow-[0_0_14px_rgba(109,118,150,0.45)]"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(135,159,208,0.45) 0%, rgba(109,118,150,0.95) 45%, rgba(119,146,196,0.95) 80%, rgba(135,159,208,0.45) 100%)'
                }}
              />

              {/* Center Glowing Star / Diamond Milestone Accent */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <div className="w-px h-44 bg-gradient-to-b from-transparent via-[#6d7696]/50 to-transparent" />
                <div className="absolute w-5 h-5 rounded-full bg-[#879fd0]/40 blur-xs" />
                <div className="absolute w-3.5 h-3.5 rotate-45 bg-white border-2 border-[#6d7696] shadow-[0_0_12px_rgba(109,118,150,0.65)]" />
              </div>
            </div>

            {/* Empty Timeline Events Prompt inside the Active Timeline */}
            {positionedNodes.length === 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 bg-white/95 border border-[#cbd3e6] rounded-3xl px-8 py-6 text-center shadow-[0_16px_40px_rgba(115,139,189,0.22)] max-w-md">
                <Calendar className="w-8 h-8 text-[#6d7696]" />
                <div className="text-base font-serif font-semibold text-[#181b26]">
                  Belum Ada Peristiwa di &ldquo;{activeTimeline.name}&rdquo;
                </div>
                <p className="text-xs text-[#52586e] leading-relaxed">
                  Tambahkan peristiwa sejarah (misalnya Tahun 100, 250, 500, 800). Rentang waktu Timeline akan otomatis meluas mengikuti konten!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetNodeForm();
                      setShowQuickAddEventModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#6d7696] text-white font-serif font-semibold text-xs transition shadow-sm"
                  >
                    + Tambah Peristiwa Pertama
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetEvents('100-800')}
                    className="px-3.5 py-2 rounded-xl bg-[#edf1fa] hover:bg-[#e1e8f6] border border-[#cbd3e6] text-[#181b26] font-serif text-xs transition"
                  >
                    Contoh Tahun 100–800
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetEvents('nusantara')}
                    className="px-3.5 py-2 rounded-xl bg-[#edf1fa] hover:bg-[#e1e8f6] border border-[#cbd3e6] text-[#181b26] font-serif text-xs transition"
                  >
                    Contoh Referensi Gambar
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* RENDER TIMELINE EVENT CARDS & AXIS CONNECTORS                */}
            {/* ============================================================ */}
            {positionedNodes.map(({ node, xPx, side }, idx) => {
              const styleCfg =
                CATEGORY_BADGE_STYLES[node.categoryColor] || CATEGORY_BADGE_STYLES.politik;
              const isSelectedInCanvas =
                studioMode === 'canvas' && editingNodeId === node.id;

              const linkedEventArt = eventArticles.find(
                (a) =>
                  (node.linkedEventArticleId && a.id === node.linkedEventArticleId) ||
                  a.title.toLowerCase() === node.title.toLowerCase()
              );
              const resolvedThumbUrl = String(
                linkedEventArt?.templateValues?.ThumbnailUrl ||
                  linkedEventArt?.templateValues?.CustomIconUrl ||
                  node.thumbnailUrl ||
                  ''
              ).trim();
              const resolvedTitle = linkedEventArt?.title || node.title;

              const yearDisplay = node.yearLabelOverride
                ? node.yearLabelOverride
                : node.endYear !== null && node.endYear !== undefined
                ? `${node.startYear} – ${node.endYear}`
                : `${node.startYear}`;

              return (
                <div
                  key={node.id}
                  style={{ left: `${xPx}px` }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                >
                  {/* Circular Ring Node on the Horizontal Axis Line */}
                  <div
                    style={{ borderColor: styleCfg.dotColor }}
                    className="w-5 h-5 rounded-full bg-white border-[2.5px] shadow-[0_2px_8px_rgba(73,74,82,0.3)] flex items-center justify-center z-20 overflow-hidden"
                  >
                    {resolvedThumbUrl ? (
                      <img
                        src={resolvedThumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: styleCfg.dotColor }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    )}
                  </div>

                  {/* Vertical Stem + Diamond + Event Card (Above or Below Axis) */}
                  {side === 'above' ? (
                    <div className="absolute bottom-2 flex flex-col items-center">
                      {/* Event Card */}
                      <div
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (hasDraggedRef.current) return;
                          if (studioMode === 'canvas') {
                            handleSelectNodeForEdit(node);
                          } else {
                            handleTriggerEventZoomTransition(node);
                          }
                        }}
                        className={`relative overflow-hidden w-[295px] sm:w-[315px] min-h-[104px] rounded-2xl bg-[#5c688a] border p-4 flex items-center shadow-[0_14px_30px_rgba(92,104,138,0.32)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                          isSelectedInCanvas
                            ? 'border-[#494a52] ring-2 ring-[#6d7696]/50'
                            : 'border-white/70 hover:border-white'
                        }`}
                      >
                        {/* Event Thumbnail as Background of the Event Card with 50% Opacity */}
                        <div
                          data-event-thumb="true"
                          className="absolute inset-0 z-0 opacity-50 pointer-events-none overflow-hidden"
                        >
                          {resolvedThumbUrl ? (
                            <img
                              src={resolvedThumbUrl}
                              alt={resolvedTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            renderDefaultEventArtwork(node.categoryColor, idx)
                          )}
                        </div>

                        {/* Event Info: Title, Year, Category Pill */}
                        <div className="relative z-10 min-w-0 flex-1 space-y-1 drop-shadow-[0_2px_6px_rgba(24,27,38,0.75)]">
                          <div className="text-[15px] font-bold text-white leading-snug group-hover:text-[#f0f4ff] transition-colors truncate">
                            {resolvedTitle}
                          </div>
                          <div className="text-sm text-white/95 font-medium tracking-wide">
                            {yearDisplay}
                          </div>
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-medium ${styleCfg.badgeClass}`}
                            >
                              {node.categoryTag}
                            </span>
                            <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              <span>{studioMode === 'canvas' ? 'Edit' : 'Buka Event'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diamond Connector at Bottom of Card */}
                      <div
                        style={{ backgroundColor: styleCfg.dotColor }}
                        className="w-2.5 h-2.5 rotate-45 -mt-1 z-10 shadow-xs"
                      />

                      {/* Vertical Line Down to Axis */}
                      <div
                        style={{ backgroundColor: styleCfg.dotColor }}
                        className="w-[1.5px] h-14 opacity-85"
                      />
                    </div>
                  ) : (
                    <div className="absolute top-2 flex flex-col items-center">
                      {/* Vertical Line Down from Axis */}
                      <div
                        style={{ backgroundColor: styleCfg.dotColor }}
                        className="w-[1.5px] h-14 opacity-85"
                      />

                      {/* Diamond Connector at Top of Card */}
                      <div
                        style={{ backgroundColor: styleCfg.dotColor }}
                        className="w-2.5 h-2.5 rotate-45 -mb-1 z-10 shadow-xs"
                      />

                      {/* Event Card */}
                      <div
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (hasDraggedRef.current) return;
                          if (studioMode === 'canvas') {
                            handleSelectNodeForEdit(node);
                          } else {
                            handleTriggerEventZoomTransition(node);
                          }
                        }}
                        className={`relative overflow-hidden w-[295px] sm:w-[315px] min-h-[104px] rounded-2xl bg-[#5c688a] border p-4 flex items-center shadow-[0_14px_30px_rgba(92,104,138,0.32)] cursor-pointer group transition-all duration-300 hover:translate-y-1 ${
                          isSelectedInCanvas
                            ? 'border-[#494a52] ring-2 ring-[#6d7696]/50'
                            : 'border-white/70 hover:border-white'
                        }`}
                      >
                        {/* Event Thumbnail as Background of the Event Card with 50% Opacity */}
                        <div
                          data-event-thumb="true"
                          className="absolute inset-0 z-0 opacity-50 pointer-events-none overflow-hidden"
                        >
                          {resolvedThumbUrl ? (
                            <img
                              src={resolvedThumbUrl}
                              alt={resolvedTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            renderDefaultEventArtwork(node.categoryColor, idx)
                          )}
                        </div>

                        {/* Event Info: Title, Year, Category Pill */}
                        <div className="relative z-10 min-w-0 flex-1 space-y-1 drop-shadow-[0_2px_6px_rgba(24,27,38,0.75)]">
                          <div className="text-[15px] font-bold text-white leading-snug group-hover:text-[#f0f4ff] transition-colors truncate">
                            {resolvedTitle}
                          </div>
                          <div className="text-sm text-white/95 font-medium tracking-wide">
                            {yearDisplay}
                          </div>
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-medium ${styleCfg.badgeClass}`}
                            >
                              {node.categoryTag}
                            </span>
                            <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              <span>{studioMode === 'canvas' ? 'Edit' : 'Buka Event'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* LEFT & RIGHT CIRCULAR AXIS PAN BUTTONS (< and > in Sample.png) */}
          {/* ============================================================== */}
          <button
            type="button"
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, x: Math.min(900, prev.x + 340) }))
            }
            className={`absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-[#cbd3e6] text-[#5b74a8] flex items-center justify-center shadow-lg transition ${
              zoomingEventNode ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            title="Geser Timeline ke Kiri (Masa Sebelumnya)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, x: Math.max(-1400, prev.x - 340) }))
            }
            className={`absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-[#cbd3e6] text-[#5b74a8] flex items-center justify-center shadow-lg transition ${
              zoomingEventNode ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            title="Geser Timeline ke Kanan (Masa Berikutnya)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* ============================================================== */}
          {/* MODE UTAMA MINIMALIST FLOATING HUD                             */}
          {/* Compact controls so the main timeline remains unobstructed     */}
          {/* ============================================================== */}
          <div
            className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              studioMode === 'main' && !zoomingEventNode
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-6'
            }`}
          >
            {/* Top-Left Minimalist Bar: "+ Add New Timeline", "Name world timeline", "Beralih timeline" */}
            <div className="absolute top-[56px] left-5 flex flex-wrap items-center gap-2">
              {/* Pill 1: + Add New Timeline */}
              <button
                type="button"
                onClick={() => {
                  setNewTimelineWorldId(activeWorld.id);
                  setShowCreateTimelineModal(true);
                }}
                className={`h-8 px-3 rounded-full bg-white/95 hover:bg-[#edf1fa] backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center gap-1.5 transition group ${
                  studioMode === 'main' && !zoomingEventNode
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#5b74a8] stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-serif text-[#181b26] font-medium tracking-wide whitespace-nowrap">
                  Add New Timeline
                </span>
              </button>

              {/* Pill 2: Name world timeline */}
              <div
                className={`h-8 px-3 rounded-full bg-white/95 backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center ${
                  studioMode === 'main' && !zoomingEventNode
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                <input
                  type="text"
                  value={activeTimeline.name}
                  onChange={(e) =>
                    setTimelines((prev) =>
                      prev.map((t) =>
                        t.id === activeTimeline.id ? { ...t, name: e.target.value } : t
                      )
                    )
                  }
                  placeholder="Name world timeline"
                  className="w-36 sm:w-44 bg-transparent text-xs font-serif font-semibold text-[#181b26] text-center focus:outline-none truncate"
                  title="Klik untuk mengubah nama Timeline saat ini"
                />
              </div>

              {/* Pill 3: Beralih timeline */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSwitchTimelineMenu((prev) => !prev)}
                  className={`h-8 px-3 rounded-full bg-white/95 hover:bg-[#edf1fa] backdrop-blur-md border border-[#cbd3e6] shadow-md flex items-center justify-center transition ${
                    studioMode === 'main' && !zoomingEventNode
                      ? 'pointer-events-auto'
                      : 'pointer-events-none'
                  }`}
                >
                  <span className="text-xs font-serif text-[#181b26] font-medium whitespace-nowrap">
                    Beralih timeline
                  </span>
                </button>

                {/* Dropdown Popover for "Beralih timeline" */}
                {showSwitchTimelineMenu && studioMode === 'main' && !zoomingEventNode && (
                  <div className="pointer-events-auto absolute top-10 left-0 w-64 rounded-2xl bg-white border border-[#cbd3e6] shadow-2xl p-2.5 space-y-1.5 z-40">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#52586e] font-semibold flex items-center justify-between">
                      <span>Daftar Timeline ({timelines.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSwitchTimelineMenu(false)}
                        className="text-[#52586e] hover:text-[#181b26]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {timelines.map((tl) => {
                        const isCurrent = tl.id === activeTimeline.id;
                        const evCount = eventNodes.filter((n) => n.timelineId === tl.id).length;
                        return (
                          <div
                            key={tl.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-serif transition ${
                              isCurrent
                                ? 'bg-[#6d7696] text-white font-semibold'
                                : 'text-[#181b26] hover:bg-[#edf1fa]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTimelineId(tl.id);
                                setShowSwitchTimelineMenu(false);
                                setPanOffset({ x: 0, y: 0 });
                              }}
                              className="flex-1 text-left truncate"
                            >
                              <div>{tl.name}</div>
                              <div className={`text-[10px] ${isCurrent ? 'text-white/85' : 'text-[#52586e]'}`}>
                                {evCount} peristiwa
                              </div>
                            </button>
                            {timelines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelines((prev) => prev.filter((item) => item.id !== tl.id));
                                  setEventNodes((prev) =>
                                    prev.filter((n) => n.timelineId !== tl.id)
                                  );
                                }}
                                className={`p-1 ${isCurrent ? 'text-white/85 hover:text-white' : 'text-[#52586e] hover:text-rose-600'}`}
                                title="Hapus Timeline"
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
                  setShowSwitchTimelineMenu(false);
                  setStudioMode('canvas');
                }}
                className={`h-8 px-3.5 rounded-full bg-[#6d7696] hover:bg-[#5d6685] border border-[#6d7696] shadow-md flex items-center justify-center transition ${
                  studioMode === 'main' && !zoomingEventNode
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                <span className="text-xs font-serif text-white font-semibold tracking-wide whitespace-nowrap">
                  Canvas Mode
                </span>
              </button>
            </div>

            {/* Bottom Minimalist Pill in Mode Utama: Auto-Expanding Span Info + Tag Event + Zoom Timeline */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div
                className={`flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-[#cbd3e6] shadow-lg backdrop-blur-md ${
                  studioMode === 'main' && !zoomingEventNode
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                {/* Dynamic Expanding Time Range Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf1fa] border border-[#cbd3e6] text-[11px] font-serif text-[#181b26]">
                  <Calendar className="w-3 h-3 text-[#5b74a8]" />
                  <span>
                    Tahun{' '}
                    <strong>
                      {computedTimeRange.minYear} – {computedTimeRange.maxYear}
                    </strong>
                  </span>
                  <span className="text-[10px] text-[#52586e]">
                    ({activeTimelineNodes.length})
                  </span>
                </div>

                {/* Quick "+ Tag Event" Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleResetNodeForm();
                    setShowQuickAddEventModal(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#6d7696] hover:bg-[#5d6685] border border-[#6d7696] text-white text-[11px] font-serif font-semibold flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Tag Event</span>
                </button>

                <div className="h-3.5 w-px bg-[#cbd3e6] mx-0.5" />

                {/* Zoom Timeline Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTimelineZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))
                    }
                    className="p-1 rounded-full text-[#52586e] hover:text-[#181b26] hover:bg-[#edf1fa] transition"
                    title="Zoom Out Timeline (Perkecil Rentang Waktu)"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineZoom(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="px-1.5 py-0.5 rounded-full text-[10px] text-[#181b26] hover:bg-[#edf1fa] font-mono font-semibold"
                    title="Reset Zoom & Posisi Tengah"
                  >
                    {Math.round(timelineZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTimelineZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))
                    }
                    className="p-1 rounded-full text-[#52586e] hover:text-[#181b26] hover:bg-[#edf1fa] transition"
                    title="Zoom In Timeline (Perbesar Rentang Waktu)"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* MODE KANVAS OVERLAYS: Smooth Slide-In Top Bar & Left Studio    */}
          {/* ============================================================== */}

          {/* Top Bar in Canvas Mode */}
          <div
            className={`absolute top-[64px] left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/95 border border-[#cbd3e6] shadow-xl backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              studioMode === 'canvas'
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-10 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => setStudioMode('main')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mode Utama Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadPresetEvents('100-800')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-xs text-[#181b26] font-serif transition"
              title="Muat contoh Tahun 100, 250, 500, 800"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Contoh 100–800</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadPresetEvents('nusantara')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-xs text-[#181b26] font-serif transition"
              title="Muat contoh sejarah seperti gambar referensi"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5b74a8]" />
              <span>Contoh Referensi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTimelineZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#cbd3e6] text-[#52586e] hover:text-[#181b26] transition"
              title="Reset Posisi Tengah"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left Studio Panel in Canvas Mode: Design Timeline & Add/Edit Event Nodes */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute top-[64px] bottom-5 left-5 w-[330px] z-30 rounded-3xl bg-white/96 border border-[#cbd3e6] shadow-2xl backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              studioMode === 'canvas'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-full pointer-events-none'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e7f3] pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5b74a8] font-semibold">
                    Mode Kanvas Timeline
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#181b26]">
                    {editingNodeId ? 'Edit Peristiwa (Event)' : 'Tambah Peristiwa ke Timeline'}
                  </h3>
                </div>
                {editingNodeId && (
                  <button
                    type="button"
                    onClick={handleResetNodeForm}
                    className="text-[11px] text-[#5b74a8] hover:text-[#181b26] underline"
                  >
                    + Baru
                  </button>
                )}
              </div>

              {/* Form to Add/Edit Event Node on Timeline */}
              <form onSubmit={handleSaveTimelineEventNode} className="space-y-3">
                {/* Link Existing Event Tag from Master Workspace */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                    Ambil dari Tag Event (Opsional)
                  </label>
                  <select
                    value={selectedExistingEventArticleId}
                    onChange={(e) => {
                      const artId = e.target.value;
                      setSelectedExistingEventArticleId(artId);
                      const found = eventArticles.find((a) => a.id === artId);
                      if (found) {
                        setNodeTitle(found.title);
                        setNodeSummary(found.content || found.summary);
                        const thumb = String(found.templateValues?.ThumbnailUrl || '');
                        if (thumb) setNodeThumbnail(thumb);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                  >
                    <option value="">-- Buat Tag Event Baru / Ketik Manual --</option>
                    {eventArticles.map((art) => (
                      <option key={art.id} value={art.id}>
                        📅 {art.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judul Peristiwa */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                    Nama Peristiwa / Event *
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    placeholder="Contoh: Peradaban Pertama Muncul"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                  />
                </div>

                {/* Tahun Mulai & Tahun Selesai (Auto-Expands Timeline Range) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Tahun Mulai *
                    </label>
                    <input
                      type="number"
                      required
                      value={nodeStartYear}
                      onChange={(e) => setNodeStartYear(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Tahun Selesai (Opsional)
                    </label>
                    <input
                      type="number"
                      value={nodeEndYear}
                      onChange={(e) => setNodeEndYear(e.target.value)}
                      placeholder="Contoh: 800"
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                    />
                  </div>
                </div>

                {/* Kategori Pill & Warna */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Label Tag Kategori
                    </label>
                    <input
                      type="text"
                      value={nodeCategoryTag}
                      onChange={(e) => setNodeCategoryTag(e.target.value)}
                      placeholder="Politik / Konflik / Sosial"
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Warna Badge &amp; Garis
                    </label>
                    <select
                      value={nodeCategoryColor}
                      onChange={(e) => {
                        const val = e.target.value as TimelineEventNode['categoryColor'];
                        setNodeCategoryColor(val);
                        if (
                          !nodeCategoryTag ||
                          Object.values(CATEGORY_BADGE_STYLES).some(
                            (s) => s.label === nodeCategoryTag
                          )
                        ) {
                          setNodeCategoryTag(CATEGORY_BADGE_STYLES[val].label);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                    >
                      <option value="peradaban">Emas (Peradaban)</option>
                      <option value="politik">Cokelat Perunggu (Politik)</option>
                      <option value="konflik">Merah Marun (Konflik)</option>
                      <option value="sosial">Hijau Sage (Sosial)</option>
                      <option value="kosmis">Ungu Kosmis (Kosmis)</option>
                    </select>
                  </div>
                </div>

                {/* Posisi Kartu & Thumbnail */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Posisi Kartu
                    </label>
                    <select
                      value={nodePosition}
                      onChange={(e) =>
                        setNodePosition(e.target.value as TimelineEventNode['position'])
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                    >
                      <option value="auto">Otomatis Selang-seling</option>
                      <option value="above">Di Atas Garis</option>
                      <option value="below">Di Bawah Garis</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                      Thumbnail Kartu
                    </label>
                    <button
                      type="button"
                      onClick={() => eventThumbInputRef.current?.click()}
                      className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-dashed border-[#738bbd] text-xs text-[#4b67a1] font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {nodeThumbnail ? 'Ganti Gambar' : 'Upload Gambar'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Deskripsi Singkat (Sinkron ke Artikel Event) */}
                <div className="space-y-1">
                  <label className="block text-[11px] text-[#52586e] font-serif font-semibold">
                    Deskripsi Peristiwa (Tersinkron ke Halaman Event)
                  </label>
                  <textarea
                    rows={2}
                    value={nodeSummary}
                    onChange={(e) => setNodeSummary(e.target.value)}
                    placeholder="Ringkasan peristiwa sejarah..."
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd] resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow transition"
                  >
                    {editingNodeId ? 'Simpan Perubahan Event' : '+ Tambahkan ke Timeline'}
                  </button>
                  {editingNodeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEventNodes((prev) => prev.filter((n) => n.id !== editingNodeId));
                        handleResetNodeForm();
                      }}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 transition"
                      title="Hapus Peristiwa dari Timeline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* List of Events Currently on Timeline */}
              <div className="pt-3 border-t border-[#e2e7f3] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#52586e] font-medium">
                  <span>Urutan Peristiwa ({activeTimelineNodes.length})</span>
                  <span className="text-[#4b67a1] font-semibold">
                    Tahun {computedTimeRange.minYear} – {computedTimeRange.maxYear}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {activeTimelineNodes.map((n, listIdx) => {
                    const linkedArt = eventArticles.find(
                      (a) =>
                        (n.linkedEventArticleId && a.id === n.linkedEventArticleId) ||
                        a.title.toLowerCase() === n.title.toLowerCase()
                    );
                    const listThumbUrl = String(
                      linkedArt?.templateValues?.ThumbnailUrl ||
                        linkedArt?.templateValues?.CustomIconUrl ||
                        n.thumbnailUrl ||
                        ''
                    ).trim();

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNodeForEdit(n)}
                        className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                          editingNodeId === n.id
                            ? 'bg-[#6d7696] border border-[#5d6685] text-white shadow-sm'
                            : 'bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-[#dce3f2] text-[#181b26]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#cbd3e6] bg-[#7792c4] shrink-0 flex items-center justify-center">
                            {listThumbUrl ? (
                              <img
                                src={listThumbUrl}
                                alt={linkedArt?.title || n.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              renderDefaultEventArtwork(n.categoryColor, listIdx)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">
                              {linkedArt?.title || n.title}
                            </div>
                            <div
                              className={`text-[10px] ${
                                editingNodeId === n.id ? 'text-white/80' : 'text-[#52586e]'
                              }`}
                            >
                              Tahun {n.endYear ? `${n.startYear}–${n.endYear}` : n.startYear} ·{' '}
                              {n.categoryTag}
                            </div>
                          </div>
                        </div>
                        <Edit3
                          className={`w-3.5 h-3.5 shrink-0 ${
                            editingNodeId === n.id ? 'text-white' : 'text-[#52586e]'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e2e7f3] text-[11px] text-[#52586e] flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-[#5b74a8] shrink-0" />
              <span>
                Klik kartu di Mode Utama untuk membuka halaman Event dengan transisi zoom-in blur 1.5 detik.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: MULAI DARI TIMELINE UTAMA (Create New Timeline)             */}
      {/* ==================================================================== */}
      {showCreateTimelineModal && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-[#181b26]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#cbd3e6] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2e7f3] pb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#5b74a8] font-semibold">
                  Tahap 1 — Mulai dari Timeline Utama
                </div>
                <h2 className="text-xl font-serif font-bold text-[#181b26] mt-0.5">
                  Buat Timeline Baru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTimelineModal(false)}
                className="text-[#52586e] hover:text-[#181b26] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTimelineSubmit} className="space-y-4">
              {/* 1. Nama Timeline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Nama Timeline *
                </label>
                <input
                  type="text"
                  required
                  value={newTimelineName}
                  onChange={(e) => setNewTimelineName(e.target.value)}
                  placeholder="Contoh: World Timeline / Sejarah Nusantara"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                />
              </div>

              {/* 2. Deskripsi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={newTimelineDesc}
                  onChange={(e) => setNewTimelineDesc(e.target.value)}
                  placeholder="Deskripsi singkat mengenai lini masa sejarah ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd] resize-none"
                />
              </div>

              {/* 3. World yang terkait */}
              <div className="space-y-1.5">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  World yang Terkait
                </label>
                <select
                  value={newTimelineWorldId}
                  onChange={(e) => setNewTimelineWorldId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                >
                  {worlds.length > 0 ? (
                    worlds.map((w) => (
                      <option key={w.id} value={w.id}>
                        🌍 {w.name}
                      </option>
                    ))
                  ) : (
                    <option value={activeWorld.id}>🌍 {activeWorld.name}</option>
                  )}
                </select>
              </div>

              {/* 4. Rentang Waktu (Opsional) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#f4f6fb] border border-[#dce3f2]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif text-[#4b67a1] font-semibold">
                    Rentang Waktu (Opsional)
                  </label>
                  <span className="text-[10px] text-[#52586e]">Bisa ditentukan belakangan</span>
                </div>
                <p className="text-[11px] text-[#52586e] leading-relaxed">
                  Anda tidak harus menentukan durasi terlebih dahulu. Saat peristiwa dimasukkan (misal Tahun 100 hingga 800), cakupan Timeline otomatis meluas mengikuti konten.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <input
                    type="number"
                    value={newTimelineStartYear}
                    onChange={(e) => setNewTimelineStartYear(e.target.value)}
                    placeholder="Tahun Awal (opsional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                  />
                  <input
                    type="number"
                    value={newTimelineEndYear}
                    onChange={(e) => setNewTimelineEndYear(e.target.value)}
                    placeholder="Tahun Akhir (opsional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTimelineModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#cbd3e6] text-xs text-[#52586e] hover:text-[#181b26]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow"
                >
                  Buat Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: QUICK "+ TAG EVENT" FROM MAIN MODE                          */}
      {/* ==================================================================== */}
      {showQuickAddEventModal && activeTimeline && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-[#181b26]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#cbd3e6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e7f3] pb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#5b74a8] font-semibold">
                  Tag Event ke {activeTimeline.name}
                </div>
                <h3 className="text-lg font-serif font-bold text-[#181b26]">
                  Tambah Peristiwa Sejarah
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddEventModal(false)}
                className="text-[#52586e] hover:text-[#181b26] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTimelineEventNode} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Pilih dari Daftar Event (Opsional)
                </label>
                <select
                  value={selectedExistingEventArticleId}
                  onChange={(e) => {
                    const artId = e.target.value;
                    setSelectedExistingEventArticleId(artId);
                    const found = eventArticles.find((a) => a.id === artId);
                    if (found) {
                      setNodeTitle(found.title);
                      setNodeSummary(found.content || found.summary);
                      const thumb = String(found.templateValues?.ThumbnailUrl || '');
                      if (thumb) setNodeThumbnail(thumb);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                >
                  <option value="">-- Buat Tag Event Baru --</option>
                  {eventArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      📅 {art.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-serif font-semibold text-[#181b26]">
                  Judul Peristiwa *
                </label>
                <input
                  type="text"
                  required
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder="Contoh: Kerajaan Pertama Berdiri"
                  className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Tahun Mulai *
                  </label>
                  <input
                    type="number"
                    required
                    value={nodeStartYear}
                    onChange={(e) => setNodeStartYear(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Tahun Selesai (Opsional)
                  </label>
                  <input
                    type="number"
                    value={nodeEndYear}
                    onChange={(e) => setNodeEndYear(e.target.value)}
                    placeholder="Opsional"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] font-mono focus:outline-none focus:border-[#738bbd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Kategori
                  </label>
                  <select
                    value={nodeCategoryColor}
                    onChange={(e) => {
                      const val = e.target.value as TimelineEventNode['categoryColor'];
                      setNodeCategoryColor(val);
                      setNodeCategoryTag(CATEGORY_BADGE_STYLES[val].label);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] border border-[#cbd3e6] text-xs text-[#181b26] focus:outline-none focus:border-[#738bbd]"
                  >
                    <option value="peradaban">Peradaban</option>
                    <option value="politik">Politik</option>
                    <option value="konflik">Konflik</option>
                    <option value="sosial">Sosial</option>
                    <option value="kosmis">Kosmis</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-serif font-semibold text-[#181b26]">
                    Thumbnail (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => eventThumbInputRef.current?.click()}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f6fb] hover:bg-[#e4eaf6] border border-dashed border-[#738bbd] text-xs text-[#4b67a1] font-medium flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{nodeThumbnail ? 'Ganti Gambar' : 'Upload'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#cbd3e6] text-xs text-[#52586e]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6d7696] hover:bg-[#5d6685] border border-[#8e98b8] text-white font-serif font-semibold text-xs shadow"
                >
                  Simpan &amp; Perluas Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
