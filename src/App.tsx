/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Globe,
  BookOpen,
  Users,
  MapPin,
  Building2,
  Map as MapIcon,
  Clock,
  GitBranch,
  Feather,
  Image as ImageIcon,
  Settings,
  Search,
  Plus,
  Bell,
  History,
  FileText,
  Compass,
  Sparkles,
  CheckSquare,
  Dices,
  Layers,
  GraduationCap,
  Download,
  Upload,
  Trash2,
  Edit3,
  Eye,
  FolderOpen,
  Database,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Undo2,
  Redo2,
  Sun,
  Moon
} from 'lucide-react';
import {
  INITIAL_WORKSPACE,
  INITIAL_UNIVERSES,
  INITIAL_WORLDS,
  INITIAL_ARTICLES,
  INITIAL_RELATIONSHIPS,
  INITIAL_MAPS,
  INITIAL_TIMELINE_EVENTS,
  INITIAL_CALENDAR,
  INITIAL_WHITEBOARDS,
  INITIAL_MANUSCRIPTS,
  INITIAL_NOTES,
  INITIAL_TASKS,
  INITIAL_TABLES,
  INITIAL_GENERATORS,
  INITIAL_CAMPAIGNS,
  INITIAL_IP_PIPELINE_ASSETS,
  INITIAL_COMMUNITY_POSTS
} from './data/initialSeedData';
import { BUILT_IN_TEMPLATES, INTERACTIVE_TUTORIAL_MODULES } from './data/templatesAndTutorials';
import {
  Workspace,
  Universe,
  World,
  Article,
  ArticleTemplate,
  EntityRelationship,
  WorldMap,
  TimelineEvent,
  CustomCalendar,
  WhiteboardBoard,
  Manuscript,
  NotebookNote,
  ProjectTask,
  InteractiveTable,
  RandomGenerator,
  RPGCampaign,
  IPPipelineAsset,
  CommunityPost,
  UserRoleType,
  RecentActivityItem,
  DigitalAsset
} from './types/worldbuilding';
import { ArticleAndTemplateModule } from './components/ArticleAndTemplateModule';
import { VisualWorldModule } from './components/VisualWorldModule';
import { StoryAndProductivityModule } from './components/StoryAndProductivityModule';
import { RPGAndStudioModule } from './components/RPGAndStudioModule';
import { OnboardingAndLearningView } from './components/OnboardingAndLearningModal';
import { DigitalAssetLibrary } from './components/DigitalAssetLibrary';
import { CharacterStudioView } from './components/CharacterStudioView';
import { LocationStudioView } from './components/LocationStudioView';
import { EntityCategoryStudioView, EntityCategoryMode } from './components/EntityCategoryStudioView';
import { CartographyMapStudio } from './components/CartographyMapStudio';
import { TimelineStudioView } from './components/TimelineStudioView';
import {
  RelationshipStudioView,
  TAG_TAB_METADATA
} from './components/RelationshipStudioView';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  syncUserProfileToFirestore,
  syncWorkspaceToFirestore,
  syncWorldToFirestore,
  syncArticleToFirestore,
  User
} from './lib/firebase';

type PrimaryNavId =
  | 'dashboard'
  | 'worlds'
  | 'articles'
  | 'characters'
  | 'locations'
  | 'organizations'
  | 'species'
  | 'conditions'
  | 'cosmics'
  | 'manuscripts'
  | 'events'
  | 'maps'
  | 'timelines'
  | 'relationships'
  | 'assets'
  | 'campaigns'
  | 'onboarding';

type WorldManagerSection =
  | 'overview'
  | 'meta'
  | 'articles'
  | 'categories'
  | 'tags'
  | 'images'
  | 'maps'
  | 'timelines'
  | 'calendars'
  | 'characters'
  | 'locations'
  | 'organizations'
  | 'other'
  | 'settings';

const LOCAL_STORAGE_KEY = 'alt_universe_local_workspace_v1';
const LOCAL_TIMELINES_STORAGE_KEY = 'alt_universe_timelines_studio_v1';
const LOCAL_RELATIONSHIP_STUDIO_KEY = 'alt_universe_relationship_studio_v1';

interface GlobalWorkspaceSnapshot {
  worlds: World[];
  activeWorldId: string;
  universes: Universe[];
  articles: Article[];
  selectedArticleId: string;
  activeStoryId: string;
  storyTitle: string;
  storySynopsis: string;
  storyText: string;
  storyThumbnail: string;
  relationships: EntityRelationship[];
  maps: WorldMap[];
  timelineEvents: TimelineEvent[];
  manuscripts: Manuscript[];
  notes: NotebookNote[];
  tasks: ProjectTask[];
  digitalAssets: DigitalAsset[];
  timelineStudioRaw: string | null;
  relationshipStudioRaw: string | null;
}

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('alt_universe_theme_mode_v1');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage access errors
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    try {
      localStorage.setItem('alt_universe_theme_mode_v1', themeMode);
    } catch {
      // Ignore storage write errors
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backupStatus, setBackupStatus] = useState<string>('Local-first Auto-Saved');

  // ============================================================================
  // SECTION 3.2 FIRST-TIME EXPERIENCE:
  // Fresh installation starts EMPTY (0 worlds, 0 articles, 0 characters, 0 assets, 0 dummy lore)
  // ============================================================================
  const [workspace, setWorkspace] = useState<Workspace>(() => ({
    ...INITIAL_WORKSPACE,
    name: 'Personal Worldbuilding Workspace',
    storageUsedMb: 0.4
  }));
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [activeWorldId, setActiveWorldId] = useState<string>('');

  const [articles, setArticles] = useState<Article[]>([]);
  const [templates, setTemplates] = useState<ArticleTemplate[]>(BUILT_IN_TEMPLATES);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [maps, setMaps] = useState<WorldMap[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [calendar, setCalendar] = useState<CustomCalendar>(INITIAL_CALENDAR);
  const [whiteboards, setWhiteboards] = useState<WhiteboardBoard[]>([]);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [tables, setTables] = useState<InteractiveTable[]>([]);
  const [generators, setGenerators] = useState<RandomGenerator[]>(INITIAL_GENERATORS);
  const [campaigns, setCampaigns] = useState<RPGCampaign[]>([]);
  const [ipAssets, setIpAssets] = useState<IPPipelineAsset[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([]);

  // Recently Opened & Recently Edited lists (shown on Dashboard)
  const [recentlyOpened, setRecentlyOpened] = useState<RecentActivityItem[]>([]);
  const [recentlyEdited, setRecentlyEdited] = useState<RecentActivityItem[]>([]);

  // Navigation & UI state (supports direct URL access, browser back/forward, and page refresh)
  const validNavIds: PrimaryNavId[] = [
    'dashboard',
    'worlds',
    'articles',
    'characters',
    'locations',
    'organizations',
    'species',
    'conditions',
    'cosmics',
    'manuscripts',
    'events',
    'maps',
    'timelines',
    'relationships',
    'assets',
    'campaigns',
    'onboarding'
  ];

  const resolveInitialNav = (): PrimaryNavId => {
    try {
      const pathSegment = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (pathSegment && validNavIds.includes(pathSegment as PrimaryNavId)) {
        return pathSegment as PrimaryNavId;
      }
      const hashSegment = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hashSegment && validNavIds.includes(hashSegment as PrimaryNavId)) {
        return hashSegment as PrimaryNavId;
      }
      const savedNav = localStorage.getItem('alt_universe_active_nav_v1');
      if (savedNav && validNavIds.includes(savedNav as PrimaryNavId)) {
        return savedNav as PrimaryNavId;
      }
    } catch {
      // Ignore URL or storage errors
    }
    return 'dashboard';
  };

  const [activeNav, setActiveNav] = useState<PrimaryNavId>(resolveInitialNav);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(false);
  const [isCanvasZoomTransitioning, setIsCanvasZoomTransitioning] = useState<boolean>(false);
  const [isCreatingWorld, setIsCreatingWorld] = useState<boolean>(false);
  const [worldManagerTab, setWorldManagerTab] = useState<WorldManagerSection>('overview');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [openInFullscreen, setOpenInFullscreen] = useState<boolean>(false);
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState<boolean>(false);
  const [isStoryFullscreen, setIsStoryFullscreen] = useState<boolean>(false);
  const [universeLineReturnOrigin, setUniverseLineReturnOrigin] = useState<{
    navId: 'maps' | 'timelines' | 'relationships';
    label: 'Maps' | 'Timeline' | 'Relationship';
    iconSrc: string;
   } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRecentActivityPopover, setShowRecentActivityPopover] = useState<boolean>(false);
  const [showQuickCreateMenu, setShowQuickCreateMenu] = useState<boolean>(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  // Sync activeNav to localStorage and URL history so refreshing or opening direct URLs works seamlessly
  useEffect(() => {
    try {
      localStorage.setItem('alt_universe_active_nav_v1', activeNav);
      const targetPath = activeNav === 'dashboard' ? '/' : `/${activeNav}`;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({ nav: activeNav }, '', targetPath);
      }
    } catch {
      // Ignore history/storage errors in restricted iframe contexts
    }
  }, [activeNav]);

  useEffect(() => {
    const handlePopState = () => {
      const pathSegment = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (pathSegment && validNavIds.includes(pathSegment as PrimaryNavId)) {
        setActiveNav(pathSegment as PrimaryNavId);
      } else if (!pathSegment) {
        setActiveNav('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatically minimize main sidebar when accessing Maps, Timeline, or opening via tag/mark
  useEffect(() => {
    setIsCanvasZoomTransitioning(false);
    if (
      activeNav === 'maps' ||
      activeNav === 'timelines' ||
      activeNav === 'relationships' ||
      openInFullscreen
    ) {
      setIsSidebarMinimized(true);
    }
    if (
      activeNav === 'dashboard' ||
      activeNav === 'maps' ||
      activeNav === 'timelines' ||
      activeNav === 'relationships'
    ) {
      setIsWorkspaceFullscreen(false);
    } else if (activeNav === 'articles') {
      if (openInFullscreen) {
        setIsStoryFullscreen(true);
        setIsWorkspaceFullscreen(true);
        setOpenInFullscreen(false);
      } else {
        setIsWorkspaceFullscreen(isStoryFullscreen);
      }
    }
  }, [activeNav, openInFullscreen, isStoryFullscreen]);

  // Page 6 World Creation Form State (Only World Name is required!)
  const [formWorldName, setFormWorldName] = useState<string>('');
  const [formWorldDesc, setFormWorldDesc] = useState<string>('');
  const [formWorldGenre, setFormWorldGenre] = useState<string>('');
  const [formWorldImage, setFormWorldImage] = useState<string>('');
  const [formWorldVisibility, setFormWorldVisibility] = useState<'private' | 'public' | 'password'>('private');
  const [formUniverseName, setFormUniverseName] = useState<string>('Prime Universe');
  const [formAdditionalNotes, setFormAdditionalNotes] = useState<string>('');
  const [showAdvancedWorldForm, setShowAdvancedWorldForm] = useState<boolean>(false);
  const worldThumbInputRef = useRef<HTMLInputElement | null>(null);

  // Story UI State (Matching 4_efc095fa.png: Sinopsis & Full Story)
  const [activeStoryId, setActiveStoryId] = useState<string>('');
  const [storySynopsis, setStorySynopsis] = useState<string>('');
  const [storyText, setStoryText] = useState<string>('');
  const [storyThumbnail, setStoryThumbnail] = useState<string>('');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storySavedToast, setStorySavedToast] = useState<boolean>(false);
  const [showStoryAdvancedWiki, setShowStoryAdvancedWiki] = useState<boolean>(false);
  const storyThumbInputRef = useRef<HTMLInputElement | null>(null);

  // ============================================================================
  // GLOBAL UNDO (Ctrl+Z) & REDO (Ctrl+Shift+Z) + UNIVERSAL AUTO-SAVE ENGINE
  // ============================================================================
  const [historyRevision, setHistoryRevision] = useState<number>(0);
  const [subStudioTick, setSubStudioTick] = useState<number>(0);
  const [undoCount, setUndoCount] = useState<number>(0);
  const [redoCount, setRedoCount] = useState<number>(0);
  const [historyToastText, setHistoryToastText] = useState<string>('');
  const undoStackRef = useRef<GlobalWorkspaceSnapshot[]>([]);
  const redoStackRef = useRef<GlobalWorkspaceSnapshot[]>([]);
  const lastCommittedSnapshotRef = useRef<GlobalWorkspaceSnapshot | null>(null);
  const lastSerializedSnapshotRef = useRef<string>('');
  const isRestoringHistoryRef = useRef<boolean>(false);
  const isInitialLoadDoneRef = useRef<boolean>(false);

  // Listen for Timeline & Relationship Studio localStorage changes so they join the Global Undo/Redo stack
  useEffect(() => {
    const onSubStudioChange = () => {
      if (!isRestoringHistoryRef.current) {
        setSubStudioTick((t) => t + 1);
      }
    };
    window.addEventListener('alt-universe-substudio-change', onSubStudioChange);
    return () => window.removeEventListener('alt-universe-substudio-change', onSubStudioChange);
  }, []);

  // Load persisted local-first data if previously saved by user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.worlds)) setWorlds(parsed.worlds);
        if (parsed.activeWorldId) setActiveWorldId(parsed.activeWorldId);
        if (Array.isArray(parsed.universes)) setUniverses(parsed.universes);
        if (Array.isArray(parsed.articles)) setArticles(parsed.articles);
        if (Array.isArray(parsed.relationships)) setRelationships(parsed.relationships);
        if (Array.isArray(parsed.maps)) setMaps(parsed.maps);
        if (Array.isArray(parsed.timelineEvents)) setTimelineEvents(parsed.timelineEvents);
        if (Array.isArray(parsed.manuscripts)) setManuscripts(parsed.manuscripts);
        if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.digitalAssets)) setDigitalAssets(parsed.digitalAssets);
        if (Array.isArray(parsed.recentlyOpened)) setRecentlyOpened(parsed.recentlyOpened);
        if (Array.isArray(parsed.recentlyEdited)) setRecentlyEdited(parsed.recentlyEdited);
      }
    } catch {
      // Ignore corrupt local state
    } finally {
      window.setTimeout(() => {
        isInitialLoadDoneRef.current = true;
      }, 60);
    }
  }, []);

  // Persist local-first state on changes & record Undo/Redo history snapshots
  useEffect(() => {
    try {
      const payload = {
        worlds,
        activeWorldId,
        universes,
        articles,
        relationships,
        maps,
        timelineEvents,
        manuscripts,
        notes,
        tasks,
        digitalAssets,
        recentlyOpened,
        recentlyEdited
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setBackupStatus('Local-first Auto-Saved');
    } catch {
      // Quota or storage disabled
    }
  }, [
    worlds,
    activeWorldId,
    universes,
    articles,
    relationships,
    maps,
    timelineEvents,
    manuscripts,
    notes,
    tasks,
    digitalAssets,
    recentlyOpened,
    recentlyEdited
  ]);

  // Capture debounced workspace & substudio changes into the Global Undo Stack
  useEffect(() => {
    const timelineStudioRaw = localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY);
    const relationshipStudioRaw = localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY);

    const currentSnap: GlobalWorkspaceSnapshot = {
      worlds,
      activeWorldId,
      universes,
      articles,
      selectedArticleId,
      activeStoryId,
      storyTitle,
      storySynopsis,
      storyText,
      storyThumbnail,
      relationships,
      maps,
      timelineEvents,
      manuscripts,
      notes,
      tasks,
      digitalAssets,
      timelineStudioRaw,
      relationshipStudioRaw
    };

    const serialized = JSON.stringify({
      worlds,
      activeWorldId,
      universes,
      articles,
      storyTitle,
      storySynopsis,
      storyText,
      storyThumbnail,
      relationships,
      maps,
      timelineEvents,
      manuscripts,
      notes,
      tasks,
      digitalAssets,
      timelineStudioRaw,
      relationshipStudioRaw
    });

    if (!isInitialLoadDoneRef.current) {
      lastCommittedSnapshotRef.current = currentSnap;
      lastSerializedSnapshotRef.current = serialized;
      return;
    }

    if (isRestoringHistoryRef.current) {
      lastCommittedSnapshotRef.current = currentSnap;
      lastSerializedSnapshotRef.current = serialized;
      return;
    }

    if (serialized === lastSerializedSnapshotRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isRestoringHistoryRef.current) return;
      if (lastCommittedSnapshotRef.current && serialized !== lastSerializedSnapshotRef.current) {
        undoStackRef.current = [...undoStackRef.current.slice(-59), lastCommittedSnapshotRef.current];
        redoStackRef.current = [];
        setUndoCount(undoStackRef.current.length);
        setRedoCount(0);
      }
      lastCommittedSnapshotRef.current = currentSnap;
      lastSerializedSnapshotRef.current = serialized;
    }, 240);

    return () => window.clearTimeout(timer);
  }, [
    worlds,
    activeWorldId,
    universes,
    articles,
    selectedArticleId,
    activeStoryId,
    storyTitle,
    storySynopsis,
    storyText,
    storyThumbnail,
    relationships,
    maps,
    timelineEvents,
    manuscripts,
    notes,
    tasks,
    digitalAssets,
    subStudioTick
  ]);

  const applyWorkspaceSnapshot = (snap: GlobalWorkspaceSnapshot, label: string) => {
    isRestoringHistoryRef.current = true;
    setWorlds(snap.worlds);
    setActiveWorldId(snap.activeWorldId);
    setUniverses(snap.universes);
    setArticles(snap.articles);
    setSelectedArticleId(snap.selectedArticleId);
    setActiveStoryId(snap.activeStoryId);
    setStoryTitle(snap.storyTitle);
    setStorySynopsis(snap.storySynopsis);
    setStoryText(snap.storyText);
    setStoryThumbnail(snap.storyThumbnail);
    setRelationships(snap.relationships);
    setMaps(snap.maps);
    setTimelineEvents(snap.timelineEvents);
    setManuscripts(snap.manuscripts);
    setNotes(snap.notes);
    setTasks(snap.tasks);
    setDigitalAssets(snap.digitalAssets);

    try {
      if (snap.timelineStudioRaw !== null) {
        localStorage.setItem(LOCAL_TIMELINES_STORAGE_KEY, snap.timelineStudioRaw);
      }
      if (snap.relationshipStudioRaw !== null) {
        localStorage.setItem(LOCAL_RELATIONSHIP_STUDIO_KEY, snap.relationshipStudioRaw);
      }
    } catch {
      // ignore
    }

    lastCommittedSnapshotRef.current = snap;
    setHistoryRevision((r) => r + 1);
    setHistoryToastText(label);
    window.setTimeout(() => {
      isRestoringHistoryRef.current = false;
    }, 80);
    window.setTimeout(() => {
      setHistoryToastText('');
    }, 1800);
  };

  const handleGlobalUndo = () => {
    if (undoStackRef.current.length === 0) return;
    const currentSnap: GlobalWorkspaceSnapshot = {
      worlds,
      activeWorldId,
      universes,
      articles,
      selectedArticleId,
      activeStoryId,
      storyTitle,
      storySynopsis,
      storyText,
      storyThumbnail,
      relationships,
      maps,
      timelineEvents,
      manuscripts,
      notes,
      tasks,
      digitalAssets,
      timelineStudioRaw: localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY),
      relationshipStudioRaw: localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY)
    };
    const prevSnap = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, currentSnap];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
    applyWorkspaceSnapshot(prevSnap, 'Undo (Ctrl+Z)');
  };

  const handleGlobalRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const currentSnap: GlobalWorkspaceSnapshot = {
      worlds,
      activeWorldId,
      universes,
      articles,
      selectedArticleId,
      activeStoryId,
      storyTitle,
      storySynopsis,
      storyText,
      storyThumbnail,
      relationships,
      maps,
      timelineEvents,
      manuscripts,
      notes,
      tasks,
      digitalAssets,
      timelineStudioRaw: localStorage.getItem(LOCAL_TIMELINES_STORAGE_KEY),
      relationshipStudioRaw: localStorage.getItem(LOCAL_RELATIONSHIP_STUDIO_KEY)
    };
    const nextSnap = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, currentSnap];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
    applyWorkspaceSnapshot(nextSnap, 'Redo (Ctrl+Shift+Z)');
  };

  // Universal Keyboard Listener for Undo (Ctrl+Z) & Redo (Ctrl+Shift+Z / Ctrl+Y) everywhere
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (e.shiftKey) {
          if (redoStackRef.current.length > 0) {
            e.preventDefault();
            handleGlobalRedo();
          }
        } else {
          if (undoStackRef.current.length > 0) {
            e.preventDefault();
            handleGlobalUndo();
          }
        }
      } else if (key === 'y') {
        if (redoStackRef.current.length > 0) {
          e.preventDefault();
          handleGlobalRedo();
        }
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncUserProfileToFirestore(
            user,
            user.displayName || 'Creator',
            'Worldbuilder',
            true,
            false
          );
          await syncWorkspaceToFirestore(
            user,
            workspace.id,
            workspace.name,
            workspace.description,
            workspace.visibility,
            false
          );
          setBackupStatus('Local-first + Cloud Synced');
        } catch {
          setBackupStatus('Local-first Active');
        }
      }
    });
    return () => unsub();
  }, [workspace.id, workspace.name, workspace.description, workspace.visibility]);

  const activeWorld = useMemo(
    () => worlds.find((w) => w.id === activeWorldId) || worlds[0] || null,
    [worlds, activeWorldId]
  );

  const worldArticles = useMemo(
    () => (activeWorld ? articles.filter((a) => a.worldId === activeWorld.id) : []),
    [articles, activeWorld]
  );

  const totalCharactersCount = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.templateType === 'Character' || a.category.toLowerCase().includes('character')
      ).length,
    [articles]
  );

  const totalLocationsCount = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.templateType.startsWith('Location') || a.category.toLowerCase().includes('location')
      ).length,
    [articles]
  );

  // Helper to record Recently Opened & Recently Edited items
  const recordOpenedItem = (
    entityId: string,
    title: string,
    type: RecentActivityItem['type'],
    moduleTarget: string,
    thumbnailUrl?: string
  ) => {
    const item: RecentActivityItem = {
      id: `open-${Date.now()}`,
      entityId,
      title,
      type,
      moduleTarget,
      thumbnailUrl,
      timestampLabel: 'last opened just now',
      timestampMs: Date.now()
    };
    setRecentlyOpened((prev) => [
      item,
      ...prev.filter((p) => p.entityId !== entityId).slice(0, 7)
    ]);
  };

  const recordEditedItem = (
    entityId: string,
    title: string,
    type: RecentActivityItem['type'],
    moduleTarget: string,
    thumbnailUrl?: string
  ) => {
    const item: RecentActivityItem = {
      id: `edit-${Date.now()}`,
      entityId,
      title,
      type,
      moduleTarget,
      thumbnailUrl,
      timestampLabel: 'last edited just now',
      timestampMs: Date.now()
    };
    setRecentlyEdited((prev) => [
      item,
      ...prev.filter((p) => p.entityId !== entityId).slice(0, 7)
    ]);
  };

  // Thumbnail Upload Handler for Page 6 World Creation Form
  const handleWorldThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormWorldImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Thumbnail Upload Handler for Story View (Standardized to 1920x1080 px 16:9 Template)
  const handleStoryThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setStoryThumbnail(rawDataUrl);
            return;
          }
          ctx.clearRect(0, 0, 1920, 1080);
          const scale = Math.max(1920 / img.width, 1080 / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (1920 - drawW) / 2;
          const drawY = (1080 - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          setStoryThumbnail(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => setStoryThumbnail(rawDataUrl);
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save Story Entry Handler (Saves Sinopsis & Full Story into local-first Articles + Recent Activity)
  const handleSaveStoryEntry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storySynopsis.trim() && !storyText.trim() && !storyTitle.trim()) return;

    const targetWorld = ensureActiveWorldForQuickCreate();
    const firstLine = (storySynopsis.trim() || storyText.trim())
      .split('\n')[0]
      ?.replace(/^#+\s*/, '')
      .slice(0, 60);
    const resolvedTitle =
      storyTitle.trim() || firstLine || `Story Entry (${articles.length + 1})`;
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const wordCount = `${storySynopsis} ${storyText}`
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const storyId = activeStoryId || `story-${Date.now()}`;
    const storyArticle: Article = {
      id: storyId,
      worldId: targetWorld.id,
      title: resolvedTitle,
      aliases: [],
      templateType: 'Generic Article',
      category: 'Stories',
      tags: ['Story'],
      summary: storySynopsis.trim() || storyText.trim().slice(0, 160),
      content: storyText,
      secretNotes: storyThumbnail || '',
      spoilerWarning: 'Hanya admin dan yang diizinkan yang dapat mengakses Full Story',
      templateValues: {
        Sinopsis: storySynopsis,
        FullStory: storyText,
        AccessControl: 'Admin & Authorized Only',
        Thumbnail: storyThumbnail ? 'Attached' : 'None'
      },
      status: 'published',
      visibility: 'private',
      linkedEntityIds: [],
      galleryCaptions: storyThumbnail ? [resolvedTitle] : [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: nowStamp,
          author: currentUser?.displayName || 'Creator',
          note: 'Saved from Story Studio',
          contentSnapshot: storyText
        }
      ],
      comments: [],
      wordCount,
      updatedAt: nowStamp
    };

    setArticles((prev) =>
      prev.some((a) => a.id === storyId)
        ? prev.map((a) => (a.id === storyId ? storyArticle : a))
        : [storyArticle, ...prev]
    );
    setActiveStoryId(storyId);
    setSelectedArticleId(storyId);

    if (storyThumbnail) {
      setDigitalAssets((prev) =>
        prev.some((ast) => ast.title === `${resolvedTitle} — Story Thumbnail`)
          ? prev
          : [
              {
                id: `ast-story-${Date.now()}`,
                worldId: targetWorld.id,
                title: `${resolvedTitle} — Story Thumbnail`,
                category: 'Reference',
                dataUrl: storyThumbnail,
                tags: ['story', 'lore'],
                sizeKb: 95,
                createdAt: nowStamp
              },
              ...prev
            ]
      );
    }

    recordOpenedItem(storyId, resolvedTitle, 'Article', 'articles', storyThumbnail);
    recordEditedItem(storyId, resolvedTitle, 'Article', 'articles', storyThumbnail);

    setStorySavedToast(true);
    setTimeout(() => setStorySavedToast(false), 2500);

    if (currentUser) {
      try {
        await syncArticleToFirestore(
          currentUser,
          storyArticle.id,
          storyArticle.worldId,
          storyArticle.title,
          storyArticle.templateType,
          storyArticle.category,
          storyArticle.summary,
          storyArticle.content,
          storyArticle.status,
          storyArticle.visibility,
          false
        );
      } catch {
        // Local-first fallback
      }
    }
  };

  // Automatic real-time save for Story View (Sinopsis, Full Story, Title, Thumbnail)
  useEffect(() => {
    if (activeNav !== 'articles' || showStoryAdvancedWiki || isRestoringHistoryRef.current) return;
    const hasContent = Boolean(
      storyTitle.trim() || storySynopsis.trim() || storyText.trim() || storyThumbnail
    );
    if (!activeStoryId && !hasContent) return;

    const existing = activeStoryId ? articles.find((a) => a.id === activeStoryId) : null;
    if (
      existing &&
      existing.title === (storyTitle.trim() || existing.title) &&
      String(existing.templateValues?.Sinopsis || '') === storySynopsis &&
      (existing.content || '') === storyText &&
      (existing.secretNotes || '') === (storyThumbnail || '')
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isRestoringHistoryRef.current) return;
      const targetWorld = ensureActiveWorldForQuickCreate();
      const firstLine = (storySynopsis.trim() || storyText.trim())
        .split('\n')[0]
        ?.replace(/^#+\s*/, '')
        .slice(0, 60);
      const resolvedTitle =
        storyTitle.trim() ||
        existing?.title ||
        firstLine ||
        `Story Entry (${articles.length + 1})`;
      const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const wordCount = `${storySynopsis} ${storyText}`
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

      const storyId = activeStoryId || `story-${Date.now()}`;
      const storyArticle: Article = {
        id: storyId,
        worldId: targetWorld.id,
        title: resolvedTitle,
        aliases: [],
        templateType: 'Generic Article',
        category: 'Stories',
        tags: ['Story'],
        summary: storySynopsis.trim() || storyText.trim().slice(0, 160),
        content: storyText,
        secretNotes: storyThumbnail || '',
        spoilerWarning: 'Hanya admin dan yang diizinkan yang dapat mengakses Full Story',
        templateValues: {
          Sinopsis: storySynopsis,
          FullStory: storyText,
          AccessControl: 'Admin & Authorized Only',
          Thumbnail: storyThumbnail ? 'Attached' : 'None'
        },
        status: 'published',
        visibility: 'private',
        linkedEntityIds: [],
        galleryCaptions: storyThumbnail ? [resolvedTitle] : [],
        versions: [
          {
            id: `v-${Date.now()}`,
            timestamp: nowStamp,
            author: currentUser?.displayName || 'Creator',
            note: 'Auto-saved from Story Studio',
            contentSnapshot: storyText
          }
        ],
        comments: [],
        wordCount,
        updatedAt: nowStamp
      };

      setArticles((prev) =>
        prev.some((a) => a.id === storyId)
          ? prev.map((a) => (a.id === storyId ? storyArticle : a))
          : [storyArticle, ...prev]
      );
      if (!activeStoryId) {
        setActiveStoryId(storyId);
        setSelectedArticleId(storyId);
      }
      setStorySavedToast(true);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    activeNav,
    showStoryAdvancedWiki,
    storyTitle,
    storySynopsis,
    storyText,
    storyThumbnail,
    activeStoryId,
    articles
  ]);

  // Create World Handler (Page 6 Specification: Only World Name is required!)
  const handleCreateWorldFromForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formWorldName.trim()) return;

    const uniId = `uni-${Date.now()}`;
    const uniName = formUniverseName.trim() || 'Prime Universe';
    if (!universes.some((u) => u.name.toLowerCase() === uniName.toLowerCase())) {
      setUniverses((prev) => [
        ...prev,
        {
          id: uniId,
          workspaceId: workspace.id,
          name: uniName,
          description: `Universe container for ${formWorldName.trim()}`,
          cosmologyNotes: ''
        }
      ]);
    }

    const newWorldId = `world-${Date.now()}`;
    const createdWorld: World = {
      id: newWorldId,
      workspaceId: workspace.id,
      universeId: uniId,
      universeName: uniName,
      name: formWorldName.trim(),
      genre: formWorldGenre.trim() || 'Speculative Fiction',
      tags: formWorldGenre.trim() ? [formWorldGenre.trim()] : ['Original World'],
      synopsis:
        formWorldDesc.trim() ||
        `Canonical world workspace for ${formWorldName.trim()}.`,
      announcement: formAdditionalNotes.trim() || 'World workspace initialized.',
      visibility: formWorldVisibility,
      accentColor: '#55b3a8',
      customCss: formWorldImage || '',
      articleLayout: 'encyclopedia',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    // Also initialize a default interactive map, calendar, whiteboard, and manuscript for this world so all modules work seamlessly
    const defaultMap: WorldMap = {
      id: `map-${newWorldId}`,
      worldId: newWorldId,
      name: `${createdWorld.name} — Primary Atlas`,
      scaleLevel: 'World',
      description: `Interactive cartography canvas for ${createdWorld.name}.`,
      svgTheme: 'archipelago',
      layers: [
        { id: 'lay-terrain', name: 'Terrain & Landmasses', visible: true, category: 'Terrain' },
        { id: 'lay-political', name: 'Regions & Settlements', visible: true, category: 'Political' },
        { id: 'lay-routes', name: 'Trade & Travel Routes', visible: true, category: 'Trade Routes' },
        { id: 'lay-secret', name: 'Hidden Lore Layer', visible: true, category: 'Secret GM' }
      ],
      markers: []
    };

    const defaultWhiteboard: WhiteboardBoard = {
      id: `wb-${newWorldId}`,
      worldId: newWorldId,
      name: `${createdWorld.name} — Visual Concept Board`,
      category: 'Lore Brainstorm',
      nodes: [],
      edges: [],
      freehandPaths: []
    };

    const defaultManuscript: Manuscript = {
      id: `ms-${newWorldId}`,
      worldId: newWorldId,
      title: `${createdWorld.name} — Story Manuscript`,
      genre: createdWorld.genre,
      synopsis: createdWorld.synopsis,
      targetWords: 50000,
      theme: 'midnight',
      updatedAt: createdWorld.updatedAt,
      chapters: [
        {
          id: `ch-${Date.now()}`,
          title: 'Chapter 1: Opening',
          synopsis: 'Opening chapter.',
          scenes: [
            {
              id: `sc-${Date.now()}`,
              title: 'Scene 1.1',
              synopsis: 'Opening scene.',
              status: 'Drafting',
              content: '',
              notes: '',
              wordCount: 0
            }
          ]
        }
      ]
    };

    if (formWorldImage) {
      setDigitalAssets((prev) => [
        {
          id: `ast-${Date.now()}`,
          worldId: newWorldId,
          title: `${createdWorld.name} Cover Banner`,
          category: 'World Cover',
          dataUrl: formWorldImage,
          tags: ['cover', createdWorld.name],
          sizeKb: 120,
          createdAt: createdWorld.updatedAt
        },
        ...prev
      ]);
    }

    setWorlds((prev) => [...prev, createdWorld]);
    setMaps((prev) => [...prev, defaultMap]);
    setWhiteboards((prev) => [...prev, defaultWhiteboard]);
    setManuscripts((prev) => [...prev, defaultManuscript]);
    setActiveWorldId(newWorldId);
    setIsCreatingWorld(false);

    recordOpenedItem(newWorldId, createdWorld.name, 'World', 'worlds', formWorldImage);
    recordEditedItem(newWorldId, createdWorld.name, 'World', 'worlds', formWorldImage);

    // Reset form
    setFormWorldName('');
    setFormWorldDesc('');
    setFormWorldGenre('');
    setFormWorldImage('');
    setFormAdditionalNotes('');
    setActiveNav('dashboard');

    if (currentUser) {
      try {
        await syncWorldToFirestore(
          currentUser,
          createdWorld.id,
          workspace.id,
          createdWorld.name,
          createdWorld.universeName,
          createdWorld.genre,
          createdWorld.synopsis,
          createdWorld.visibility,
          false
        );
      } catch {
        // Local-first fallback
      }
    }
  };

  // Ensure a world exists before Quick Creating an Article/Character/Location/Map
  const ensureActiveWorldForQuickCreate = (): World => {
    if (activeWorld) return activeWorld;
    const autoWorldId = `world-${Date.now()}`;
    const autoWorld: World = {
      id: autoWorldId,
      workspaceId: workspace.id,
      universeId: 'uni-default',
      universeName: 'Prime Universe',
      name: 'My First World',
      genre: 'Speculative Fiction',
      tags: ['Original'],
      synopsis: 'Personal worldbuilding setting.',
      announcement: 'Created via Quick Create.',
      visibility: 'private',
      accentColor: '#55b3a8',
      customCss: '',
      articleLayout: 'encyclopedia',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    const defaultMap: WorldMap = {
      id: `map-${autoWorldId}`,
      worldId: autoWorldId,
      name: `${autoWorld.name} — Atlas`,
      scaleLevel: 'World',
      description: 'Primary world map.',
      svgTheme: 'archipelago',
      layers: [
        { id: 'lay-terrain', name: 'Terrain', visible: true, category: 'Terrain' },
        { id: 'lay-political', name: 'Locations', visible: true, category: 'Political' }
      ],
      markers: []
    };
    setWorlds((prev) => [...prev, autoWorld]);
    setMaps((prev) => [...prev, defaultMap]);
    setActiveWorldId(autoWorldId);
    return autoWorld;
  };

  // Quick Create Handlers (matching the 5 buttons in the PDF mockup: New World, New Article, New Character, New Location, New Map)
  const handleQuickCreateAction = (
    kind: 'world' | 'article' | 'character' | 'location' | 'map'
  ) => {
    setShowQuickCreateMenu(false);
    if (kind === 'world') {
      setIsCreatingWorld(false);
      setSelectedArticleId('');
      setActiveNav('worlds');
      return;
    }

    const targetWorld = ensureActiveWorldForQuickCreate();

    if (kind === 'map') {
      const newMap: WorldMap = {
        id: `map-${Date.now()}`,
        worldId: targetWorld.id,
        name: `New Regional Map (${maps.filter((m) => m.worldId === targetWorld.id).length + 1})`,
        scaleLevel: 'Region',
        description: 'Interactive cartographic region.',
        svgTheme: 'archipelago',
        layers: [
          { id: 'lay-terrain', name: 'Terrain & Biomes', visible: true, category: 'Terrain' },
          { id: 'lay-political', name: 'Settlements & Pins', visible: true, category: 'Political' }
        ],
        markers: []
      };
      setMaps((prev) => [...prev, newMap]);
      recordEditedItem(newMap.id, newMap.name, 'Map', 'maps');
      recordOpenedItem(newMap.id, newMap.name, 'Map', 'maps');
      setActiveNav('maps');
      return;
    }

    const templateType =
      kind === 'character'
        ? 'Character'
        : kind === 'location'
        ? 'Location - Settlement'
        : 'Generic Article';
    const category =
      kind === 'character'
        ? 'Characters'
        : kind === 'location'
        ? 'Locations'
        : 'Articles';
    const defaultTitle =
      kind === 'character'
        ? 'New Character Profile'
        : kind === 'location'
        ? 'New Location Entry'
        : 'New Encyclopedia Article';

    const newArt: Article = {
      id: `art-${Date.now()}`,
      worldId: targetWorld.id,
      title: defaultTitle,
      aliases: [],
      templateType,
      category,
      tags: [category],
      summary: `${templateType} documentation in ${targetWorld.name}.`,
      content: '',
      secretNotes: '',
      spoilerWarning: '',
      templateValues: {},
      status: 'draft',
      visibility: 'private',
      linkedEntityIds: [],
      galleryCaptions: [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          author: 'Creator',
          note: 'Created via Quick Create',
          contentSnapshot: ''
        }
      ],
      comments: [],
      wordCount: 0,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setArticles((prev) => [newArt, ...prev]);
    setSelectedArticleId(newArt.id);
    const activityType: RecentActivityItem['type'] =
      kind === 'character' ? 'Character' : kind === 'location' ? 'Location' : 'Article';
    const targetTab: PrimaryNavId =
      kind === 'character' ? 'characters' : kind === 'location' ? 'locations' : 'articles';
    recordEditedItem(newArt.id, newArt.title, activityType, targetTab);
    recordOpenedItem(newArt.id, newArt.title, activityType, targetTab);
    setActiveNav(targetTab);
  };

  // Optional: Load Sample World ("Padepokan Astacala / Aethelgard") or Reset to Empty First-Time Experience
  const handleLoadSampleWorkspace = () => {
    setUniverses(INITIAL_UNIVERSES);
    setWorlds(INITIAL_WORLDS);
    setActiveWorldId(INITIAL_WORLDS[0].id);
    setArticles(INITIAL_ARTICLES);
    setRelationships(INITIAL_RELATIONSHIPS);
    setMaps(INITIAL_MAPS);
    setTimelineEvents(INITIAL_TIMELINE_EVENTS);
    setWhiteboards(INITIAL_WHITEBOARDS);
    setManuscripts(INITIAL_MANUSCRIPTS);
    setNotes(INITIAL_NOTES);
    setTasks(INITIAL_TASKS);
    setTables(INITIAL_TABLES);
    setCampaigns(INITIAL_CAMPAIGNS);
    setIpAssets(INITIAL_IP_PIPELINE_ASSETS);
    setSelectedArticleId(INITIAL_ARTICLES[0].id);
    setRecentlyOpened([
      {
        id: 'ro-1',
        entityId: INITIAL_ARTICLES[4].id,
        title: INITIAL_ARTICLES[4].title,
        type: 'Location',
        moduleTarget: 'locations',
        timestampLabel: 'Location - last opened 2m ago',
        timestampMs: Date.now() - 120000
      },
      {
        id: 'ro-2',
        entityId: INITIAL_ARTICLES[0].id,
        title: INITIAL_ARTICLES[0].title,
        type: 'Character',
        moduleTarget: 'characters',
        timestampLabel: 'Character - last opened 4m ago',
        timestampMs: Date.now() - 240000
      }
    ]);
    setRecentlyEdited([
      {
        id: 're-1',
        entityId: INITIAL_ARTICLES[1].id,
        title: INITIAL_ARTICLES[1].title,
        type: 'Character',
        moduleTarget: 'characters',
        timestampLabel: 'Character - last edited 2m ago',
        timestampMs: Date.now() - 120000
      },
      {
        id: 're-2',
        entityId: INITIAL_ARTICLES[9].id,
        title: INITIAL_ARTICLES[9].title,
        type: 'Article',
        moduleTarget: 'articles',
        timestampLabel: 'Article - last edited 5m ago',
        timestampMs: Date.now() - 300000
      }
    ]);
    setIsCreatingWorld(false);
    setActiveNav('dashboard');
  };

  const handleResetToEmptyFirstTimeState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUniverses([]);
    setWorlds([]);
    setActiveWorldId('');
    setArticles([]);
    setRelationships([]);
    setMaps([]);
    setTimelineEvents([]);
    setWhiteboards([]);
    setManuscripts([]);
    setNotes([]);
    setTasks([]);
    setTables([]);
    setCampaigns([]);
    setIpAssets([]);
    setDigitalAssets([]);
    setRecentlyOpened([]);
    setRecentlyEdited([]);
    setIsCreatingWorld(false);
    setActiveNav('dashboard');
  };

  // Global Search Results (Used in Global Header & Converted In-Page Search in Fullscreen)
  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const worldHits = worlds
      .filter((w) => w.name.toLowerCase().includes(q) || w.synopsis.toLowerCase().includes(q))
      .map((w) => ({
        id: w.id,
        title: w.name,
        subtitle: `World · ${w.genre}`,
        onSelect: () => {
          setActiveWorldId(w.id);
          setSelectedArticleId(w.id);
          if (isWorkspaceFullscreen) setOpenInFullscreen(true);
          setActiveNav('worlds');
          setGlobalSearchQuery('');
        }
      }));
    const articleHits = articles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
      .map((a) => {
        let targetNav: PrimaryNavId = 'articles';
        if (a.category === 'Characters' || a.templateType === 'Character') {
          targetNav = 'characters';
        } else if (a.category === 'Locations' || a.templateType.startsWith('Location')) {
          targetNav = 'locations';
        } else if (a.category === 'Species' || a.templateType === 'Species / Race') {
          targetNav = 'species';
        } else if (a.category === 'Conditions' || a.templateType === 'Medical Condition') {
          targetNav = 'conditions';
        } else if (a.category === 'Organizations' || a.templateType.startsWith('Organization')) {
          targetNav = 'organizations';
        } else if (a.category === 'Cosmics' || a.templateType === 'Cosmology / Plane') {
          targetNav = 'cosmics';
        } else if (a.category === 'Manuscripts' || a.templateType.startsWith('Manuscript')) {
          targetNav = 'manuscripts';
        } else if (a.category === 'Events' || a.templateType.startsWith('Event')) {
          targetNav = 'events';
        } else if (a.category === 'Worlds' || a.templateType.startsWith('World')) {
          targetNav = 'worlds';
        }
        return {
          id: a.id,
          title: a.title,
          subtitle: `${a.templateType} · ${a.category}`,
          onSelect: () => {
            setSelectedArticleId(a.id);
            if (targetNav === 'articles') {
              setActiveStoryId(a.id);
              setStoryTitle(a.title);
              setStorySynopsis(String(a.templateValues?.Sinopsis || a.summary || ''));
              setStoryText(a.content || '');
              setStoryThumbnail(
                a.secretNotes?.startsWith('data:image') ? a.secretNotes : ''
              );
            }
            if (isWorkspaceFullscreen) setOpenInFullscreen(true);
            recordOpenedItem(
              a.id,
              a.title,
              targetNav === 'characters'
                ? 'Character'
                : targetNav === 'locations'
                ? 'Location'
                : 'Article',
              targetNav
            );
            setActiveNav(targetNav);
            setGlobalSearchQuery('');
          }
        };
      });
    return [...worldHits, ...articleHits].slice(0, 8);
  }, [globalSearchQuery, worlds, articles, isWorkspaceFullscreen]);

  // Converted In-Page Search Bar rendered directly inside Master Workspace pages when Fullscreen is active
  const inPageSearchElement = (
    <div className="relative w-full z-40">
      <Search className="w-3.5 h-3.5 text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={globalSearchQuery}
        onChange={(e) => setGlobalSearchQuery(e.target.value)}
        placeholder="Search across your world, article, and more"
        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full bg-[#8da7db] hover:bg-[#7f9bd4] focus:bg-[#7792c4] border border-[#7792c4] text-white placeholder:text-white/90 focus:outline-none shadow-sm transition-colors"
      />
      {globalSearchResults.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#dce3f2] rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-[#eef1f8]">
          {globalSearchResults.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={hit.onSelect}
              className="w-full text-left px-4 py-2.5 hover:bg-[#f2f4f9] flex items-center justify-between text-xs"
            >
              <span className="font-semibold text-[#181b26] truncate">{hit.title}</span>
              <span className="text-[11px] text-[#6d7696] ml-2 shrink-0">
                {hit.subtitle}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Back-navigation descriptor when a Master Workspace page is accessed via Universe Line (Maps / Timeline / Relationship)
  const returnToUniverseLineProp = universeLineReturnOrigin
    ? {
        label: universeLineReturnOrigin.label,
        iconSrc: universeLineReturnOrigin.iconSrc,
        onReturn: () => {
          const targetNav = universeLineReturnOrigin.navId;
          setOpenInFullscreen(false);
          setIsWorkspaceFullscreen(false);
          setIsSidebarMinimized(true);
          setUniverseLineReturnOrigin(null);
          setActiveNav(targetNav);
        }
      }
    : null;

  const handleExportFullWorkspaceJson = () => {
    const archive = {
      exportedAt: new Date().toISOString(),
      platform: 'Alt-Universe Personal Worldbuilding & Creative Knowledge Workspace',
      workspace,
      universes,
      worlds,
      articles,
      templates,
      relationships,
      maps,
      timelineEvents,
      calendar,
      whiteboards,
      manuscripts,
      notes,
      tasks,
      tables,
      generators,
      campaigns,
      ipAssets,
      digitalAssets
    };
    const blob = new Blob([JSON.stringify(archive, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alt-universe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Main Left Sidebar Groups:
  // Group 1: Master Workspace
  const masterWorkspaceItems: { id: PrimaryNavId; label: string; iconSrc: string }[] = [
    { id: 'dashboard', label: 'Dashboard', iconSrc: '/assets/icons/dashboard.png' },
    { id: 'worlds', label: 'World', iconSrc: '/assets/icons/world.png' },
    { id: 'articles', label: 'Story', iconSrc: '/assets/icons/story.png' },
    { id: 'characters', label: 'Character', iconSrc: '/assets/icons/character.png' },
    { id: 'species', label: 'Species', iconSrc: '/assets/icons/species.png' },
    { id: 'conditions', label: 'Condition', iconSrc: '/assets/icons/conditions.png' },
    { id: 'locations', label: 'Location', iconSrc: '/assets/icons/location.png' },
    { id: 'organizations', label: 'Organization', iconSrc: '/assets/icons/organization.png' },
    { id: 'cosmics', label: 'Cosmics', iconSrc: '/assets/icons/cosmics.png' },
    { id: 'manuscripts', label: 'Manuscripts', iconSrc: '/assets/icons/manuscripts.png' },
    { id: 'events', label: 'Event', iconSrc: '/assets/icons/timeline.png' }
  ];

  // Group 2: Universe Line
  const universeLineItems: { id: PrimaryNavId; label: string; iconSrc: string }[] = [
    { id: 'maps', label: 'Maps', iconSrc: '/assets/icons/maps.png' },
    { id: 'timelines', label: 'Timeline', iconSrc: '/assets/icons/timeline.png' },
    { id: 'relationships', label: 'Relationship', iconSrc: '/assets/icons/relationship.png' }
  ];

  // Fallback World object when a user opens a sub-module before creating a world
  const safeActiveWorld: World = activeWorld || {
    id: 'world-empty',
    workspaceId: workspace.id,
    universeId: 'uni-empty',
    universeName: 'Unassigned Universe',
    name: 'No World Selected',
    genre: 'Unassigned',
    tags: [],
    synopsis: 'Create your first world to begin documenting lore.',
    announcement: '',
    visibility: 'private',
    accentColor: '#55b3a8',
    customCss: '',
    articleLayout: 'encyclopedia',
    updatedAt: '—'
  };

  return (
    <div className="min-h-screen flex bg-[#f2f4f9] text-[#181b26] select-none sm:select-auto">
      {/* ==================================================================== */}
      {/* LEFT PRIMARY SIDEBAR (Master Workspace & Universe Line + Minimize)   */}
      {/* ==================================================================== */}
      <aside
        className={`${
          isSidebarMinimized ? 'w-[68px] px-2' : 'w-52 sm:w-56 px-2.5'
        } shrink-0 bg-[#f8f9fc] border-r border-[#d5dced] flex flex-col justify-between py-3.5 sticky top-0 h-screen z-30 overflow-y-auto overflow-x-hidden transition-all duration-200 shadow-[4px_0_24px_rgba(115,139,189,0.08)]`}
      >
        <div className="space-y-4">
          {/* Logo Header + Minimize Toggle Button */}
          <div
            className={`flex items-center ${
              isSidebarMinimized ? 'flex-col gap-2 justify-center' : 'justify-between gap-1 px-1'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsCreatingWorld(false);
                setUniverseLineReturnOrigin(null);
                setActiveNav('dashboard');
              }}
              className={`flex items-center ${
                isSidebarMinimized ? 'justify-center' : 'gap-2 flex-1 min-w-0'
              } py-1 text-left group`}
              title="Alt-Universe Dashboard"
            >
              <img
                src="/assets/aistudio/Logo_Alt-Universe_6d85153b.png"
                alt="Alt-Universe Logo"
                className={`${
                  isSidebarMinimized ? 'w-9 h-8' : 'w-10 h-8'
                } object-contain shrink-0`}
              />
              {!isSidebarMinimized && (
                <div className="min-w-0">
                  <div className="text-xs font-serif font-bold tracking-wide text-[#181b26] group-hover:text-[#6d7696] transition-colors truncate">
                    Alt-Universe
                  </div>
                  <div className="text-[10px] text-[#52586e] truncate">
                    {activeWorld ? activeWorld.name : 'Local-first Studio'}
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarMinimized((prev) => !prev)}
              className="p-1.5 rounded-xl bg-white hover:bg-[#e6ecf7] border border-[#cbd3e6] text-[#494a52] hover:text-[#181b26] transition shrink-0 shadow-xs"
              title={isSidebarMinimized ? 'Perluas Sidebar Kiri' : 'Minimalize Sidebar Kiri'}
            >
              {isSidebarMinimized ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* GROUP 1: MASTER WORKSPACE */}
          <div className="space-y-1">
            {!isSidebarMinimized ? (
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-serif font-bold uppercase tracking-wider text-[#6d7696] flex items-center justify-between">
                <span>Master Workspace</span>
              </div>
            ) : (
              <div
                className="w-8 mx-auto border-t border-[#d5dced] my-1"
                title="Master Workspace"
              />
            )}

            <nav className="space-y-1">
              {masterWorkspaceItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsCreatingWorld(false);
                      setUniverseLineReturnOrigin(null);
                      setActiveNav(item.id);
                    }}
                    title={item.label}
                    className={`w-full flex items-center ${
                      isSidebarMinimized ? 'justify-center px-1.5 py-2' : 'gap-3 px-3 py-1.5'
                    } rounded-2xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#6d7696] text-white font-semibold shadow-[0_4px_14px_rgba(109,118,150,0.35)] border border-[#879fd0]'
                        : 'text-[#2c3142] hover:text-[#181b26] hover:bg-[#e6ecf7] border border-transparent'
                    }`}
                  >
                    <img
                      src={item.iconSrc}
                      alt={item.label}
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    {!isSidebarMinimized && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GROUP 2: UNIVERSE LINE */}
          <div className="pt-2 border-t border-[#d5dced] space-y-1">
            {!isSidebarMinimized ? (
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-serif font-bold uppercase tracking-wider text-[#6d7696] flex items-center justify-between">
                <span>Universe Line</span>
              </div>
            ) : (
              <div
                className="w-8 mx-auto py-0.5 text-[8px] text-center uppercase tracking-tighter text-[#6d7696] font-serif font-semibold"
                title="Universe Line"
              >
                Univ
              </div>
            )}

            <nav className="space-y-1">
              {universeLineItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsCreatingWorld(false);
                      setUniverseLineReturnOrigin(null);
                      setActiveNav(item.id);
                    }}
                    title={item.label}
                    className={`w-full flex items-center ${
                      isSidebarMinimized ? 'justify-center px-1.5 py-2' : 'gap-3 px-3 py-1.5'
                    } rounded-2xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#6d7696] text-white font-semibold shadow-[0_4px_14px_rgba(109,118,150,0.35)] border border-[#879fd0]'
                        : 'text-[#2c3142] hover:text-[#181b26] hover:bg-[#e6ecf7] border border-transparent'
                    }`}
                  >
                    <img
                      src={item.iconSrc}
                      alt={item.label}
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    {!isSidebarMinimized && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Theme Mode Toggle + Minimize / Expand Toggle Button */}
        <div className="pt-3 mt-2 border-t border-[#d5dced] space-y-1.5">
          <button
            type="button"
            onClick={toggleThemeMode}
            className={`w-full flex items-center ${
              isSidebarMinimized ? 'justify-center px-1.5 py-2' : 'gap-2.5 px-3 py-2'
            } rounded-2xl text-[11px] font-semibold bg-white hover:bg-[#e6ecf7] border border-[#cbd3e6] text-[#181b26] transition shadow-2xs`}
            title={
              themeMode === 'light'
                ? 'Ganti ke Mode Gelap (Dark Mode)'
                : 'Ganti ke Mode Terang (Light Mode)'
            }
          >
            {themeMode === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-[#5b74a8] shrink-0" />
                {!isSidebarMinimized && <span className="truncate">Mode Terang</span>}
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                {!isSidebarMinimized && <span className="truncate">Mode Gelap</span>}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarMinimized((prev) => !prev)}
            className={`w-full flex items-center ${
              isSidebarMinimized ? 'justify-center px-1.5 py-2' : 'gap-2.5 px-3 py-2'
            } rounded-2xl text-[11px] text-[#52586e] hover:text-[#181b26] hover:bg-[#e6ecf7] transition`}
            title={isSidebarMinimized ? 'Perluas Sidebar' : 'Minimalize Sidebar'}
          >
            {isSidebarMinimized ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">Minimalize Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN COLUMN: GLOBAL HEADER (Section 2.2) + CONTENT VIEWPORT          */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Global Header matching Reference Image & Section 2.2 */}
        <header
          className={
            isWorkspaceFullscreen
              ? 'hidden'
              : `h-16 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-all duration-300 ${
                  isCanvasZoomTransitioning
                    ? 'opacity-0 pointer-events-none bg-transparent border-b border-transparent'
                    : activeNav === 'maps' || activeNav === 'timelines'
                    ? 'bg-transparent border-b border-transparent pointer-events-none'
                    : 'border-b border-[#d5dced] bg-[#f8f9fc]/95 backdrop-blur-md'
                }`
          }
        >
          {/* Left: Current Workspace & World Selector */}
          <div
            className={`hidden lg:flex items-center gap-2 text-xs text-[#52586e] shrink-0 pointer-events-auto ${
              activeNav === 'maps' || activeNav === 'timelines'
                ? 'opacity-0 pointer-events-none w-0 overflow-hidden'
                : ''
            }`}
          >
            <span className="text-[#6d7696]">Workspace:</span>
            <span className="font-semibold text-[#181b26] truncate max-w-[140px]">
              {workspace.name}
            </span>
            <span className="text-[#b5bfd6]">/</span>
            {worlds.length > 0 ? (
              <select
                value={activeWorld?.id || ''}
                onChange={(e) => {
                  setActiveWorldId(e.target.value);
                  const found = worlds.find((w) => w.id === e.target.value);
                  if (found) {
                    recordOpenedItem(found.id, found.name, 'World', 'worlds', found.customCss);
                  }
                }}
                className="bg-white border border-[#cbd3e6] text-[#181b26] font-medium rounded-full px-3 py-1 text-xs focus:outline-none focus:border-[#879fd0] shadow-2xs"
              >
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingWorld(true);
                  setActiveNav('worlds');
                }}
                className="text-[#6d7696] hover:text-[#181b26] hover:underline font-medium"
              >
                + Create First World
              </button>
            )}
          </div>

          {/* Center: Pill Search Bar ("Search across your world, article, and more" — matches Recent Search pills in reference) */}
          <div
            className={`flex-1 relative pointer-events-auto ${
              activeNav === 'maps' || activeNav === 'timelines'
                ? 'max-w-2xl ml-2 mr-auto'
                : 'max-w-md mx-auto'
            }`}
          >
            <Search className="w-4 h-4 text-white absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search across your world, article, and more"
              className={`w-full pl-10 pr-4 py-1.5 text-xs rounded-full text-white placeholder:text-white/90 focus:outline-none transition-colors ${
                activeNav === 'maps' || activeNav === 'timelines'
                  ? 'bg-[#7792c4]/95 backdrop-blur-md border border-white/60 focus:bg-[#6d7696] shadow-md'
                  : 'bg-[#8da7db] hover:bg-[#7f9bd4] focus:bg-[#7792c4] border border-[#7792c4] shadow-xs'
              }`}
            />
            {globalSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#dce3f2] rounded-2xl shadow-xl overflow-hidden z-40 divide-y divide-[#eef1f8]">
                {globalSearchResults.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={hit.onSelect}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f2f4f9] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-[#181b26] truncate">{hit.title}</span>
                    <span className="text-[11px] text-[#6d7696] ml-2 shrink-0">
                      {hit.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Undo / Redo + Auto-Save Pill + Quick Create + Recent Activity + Notification Bell + Profile Avatar */}
          <div className="flex items-center gap-2.5 shrink-0 relative pointer-events-auto">
            {/* Global Undo (Ctrl+Z) & Redo (Ctrl+Shift+Z) + Auto-Save Status Pill */}
            <div className="flex items-center gap-1 bg-white border border-[#cbd3e6] rounded-full px-2 py-1 shadow-2xs">
              <button
                type="button"
                onClick={handleGlobalUndo}
                disabled={undoCount === 0}
                className={`p-1 rounded-full transition-colors ${
                  undoCount > 0
                    ? 'text-[#181b26] hover:bg-[#e6ecf7] cursor-pointer'
                    : 'text-[#b5bfd6] cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleGlobalRedo}
                disabled={redoCount === 0}
                className={`p-1 rounded-full transition-colors ${
                  redoCount > 0
                    ? 'text-[#181b26] hover:bg-[#e6ecf7] cursor-pointer'
                    : 'text-[#b5bfd6] cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <span className="hidden md:inline-flex items-center gap-1 pl-1.5 pr-1 border-l border-[#dce3f2] text-[10px] font-semibold text-[#6d7696]">
                <Check className="w-3 h-3 text-[#7792c4]" />
                <span>{historyToastText || 'Auto-Save'}</span>
              </span>
            </div>

            {/* Header Quick Create Button (Styled like the "Sign up" #6d7696 pill button in reference) */}
            <div className={activeNav === 'maps' || activeNav === 'timelines' ? 'hidden' : 'relative'}>
              <button
                type="button"
                onClick={() => setShowQuickCreateMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#6d7696] hover:bg-[#5d6685] border border-[#879fd0] text-white rounded-full shadow-[0_4px_14px_rgba(109,118,150,0.3)] transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              {showQuickCreateMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#dce3f2] rounded-2xl shadow-2xl p-2 z-40 space-y-1">
                  {[
                    { id: 'world', label: 'New World', icon: Globe },
                    { id: 'article', label: 'New Article', icon: FileText },
                    { id: 'character', label: 'New Character', icon: Users },
                    { id: 'location', label: 'New Location', icon: MapPin },
                    { id: 'map', label: 'New Map', icon: MapIcon }
                  ].map((qc) => {
                    const Icon = qc.icon;
                    return (
                      <button
                        key={qc.id}
                        type="button"
                        onClick={() =>
                          handleQuickCreateAction(
                            qc.id as 'world' | 'article' | 'character' | 'location' | 'map'
                          )
                        }
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#181b26] hover:bg-[#6d7696] hover:text-white rounded-xl transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{qc.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Mode Toggle Button (Mode Terang / Mode Gelap) */}
            <button
              type="button"
              onClick={toggleThemeMode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#e6ecf7] border border-[#cbd3e6] text-xs font-semibold text-[#181b26] transition-colors shadow-2xs"
              title={
                themeMode === 'light'
                  ? 'Beralih ke Mode Gelap (Dark Mode)'
                  : 'Beralih ke Mode Terang (Light Mode)'
              }
            >
              {themeMode === 'light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xl:inline">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#b8bcff]" />
                  <span className="hidden xl:inline">Gelap</span>
                </>
              )}
            </button>

            {/* Recent Activity Indicator (Styled like the top-left #494a52 / #8da7db icon buttons in reference) */}
            <button
              type="button"
              onClick={() => {
                setShowRecentActivityPopover((p) => !p);
                setShowNotifications(false);
              }}
              className="p-2 rounded-xl bg-[#494a52] hover:bg-[#383940] text-white transition-colors shadow-xs"
              title="Recent Activity"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Notification Bell Indicator */}
            <button
              type="button"
              onClick={() => {
                setShowNotifications((n) => !n);
                setShowRecentActivityPopover(false);
              }}
              className="p-2 rounded-xl bg-[#8da7db] hover:bg-[#7792c4] text-white transition-colors relative shadow-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <span className="h-5 w-px bg-[#d5dced]" />

            {/* User Profile Avatar & Account Controls (Matches "Log in" white pill with dark border in reference) */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => signOutUser()}
                className="flex items-center gap-2 text-xs text-[#181b26] hover:text-[#6d7696]"
                title="Click to Sign Out"
              >
                <span className="w-8 h-8 rounded-xl bg-[#6d7696] border border-[#879fd0] text-white font-bold flex items-center justify-center text-xs">
                  {(currentUser.displayName || 'V')[0].toUpperCase()}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-[#eef1f8] border border-[#494a52] text-xs font-bold text-[#181b26] transition shadow-2xs"
                title="Sign In / Sync Account"
              >
                Log in
              </button>
            )}

            {/* Popover: Recent Activity */}
            {showRecentActivityPopover && (
              <div className="absolute right-12 top-12 w-72 bg-white border border-[#dce3f2] rounded-2xl shadow-2xl p-4 z-40 space-y-2.5 text-xs">
                <div className="font-semibold text-[#181b26] flex items-center justify-between">
                  <span>Recent Workspace Activity</span>
                  <button
                    type="button"
                    onClick={() => setShowRecentActivityPopover(false)}
                    className="text-[#6d7696] hover:text-[#181b26]"
                  >
                    ✕
                  </button>
                </div>
                {recentlyEdited.length === 0 ? (
                  <p className="text-[#6d7696] py-3 text-center">
                    No activity recorded in this session yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentlyEdited.slice(0, 5).map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-[#f2f4f9] border border-[#dce3f2] flex items-center justify-between"
                      >
                        <span className="truncate font-medium text-[#181b26]">{act.title}</span>
                        <span className="text-[10px] text-[#6d7696] ml-2 shrink-0">
                          {act.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Popover: Notifications */}
            {showNotifications && (
              <div className="absolute right-4 top-12 w-72 bg-white border border-[#dce3f2] rounded-2xl shadow-2xl p-4 z-40 space-y-2.5 text-xs">
                <div className="font-semibold text-[#181b26] flex items-center justify-between">
                  <span>System &amp; Backup Status</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[#6d7696] hover:text-[#181b26]"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f2f4f9] border border-[#dce3f2] space-y-1">
                  <div className="text-[#6d7696] font-semibold">{backupStatus}</div>
                  <p className="text-[#52586e] text-[11px]">
                    All features unlocked with zero subscription restrictions. Data is stored locally first.
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ================================================================== */}
        {/* MAIN VIEWPORT                                                      */}
        {/* ================================================================== */}
        <main
          className={`flex-1 p-6 sm:p-8 ${
            activeNav === 'characters' ||
            activeNav === 'locations' ||
            activeNav === 'worlds' ||
            (activeNav === 'articles' && !showStoryAdvancedWiki) ||
            activeNav === 'species' ||
            activeNav === 'conditions' ||
            activeNav === 'organizations' ||
            activeNav === 'cosmics' ||
            activeNav === 'manuscripts' ||
            activeNav === 'events' ||
            activeNav === 'maps' ||
            activeNav === 'timelines'
              ? isWorkspaceFullscreen
                ? 'h-screen max-h-screen overflow-hidden'
                : 'h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden'
              : 'overflow-y-auto'
          }`}
        >
          {/* ================================================================ */}
          {/* VIEW 1: DASHBOARD (Nocturnal Starlit Indigo Banner & 3 Columns)  */}
          {/* ================================================================ */}
          {activeNav === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-7">
              {worlds.length === 0 ? (
                /* ============================================================ */
                /* SECTION 3.2 FIRST-TIME EXPERIENCE (Soft Periwinkle Hero Card)*/
                /* ============================================================ */
                <div
                  className="relative rounded-[28px] border border-[#a5b9e3] px-8 sm:px-10 py-8 overflow-hidden flex flex-wrap items-center justify-between gap-6 shadow-[0_16px_42px_rgba(115,139,189,0.28)]"
                  style={{
                    background:
                      themeMode === 'dark'
                        ? 'linear-gradient(130deg, #1b1742 0%, #2a2668 52%, #1d2769 100%)'
                        : 'linear-gradient(130deg, #879fd0 0%, #7d95c7 52%, #738bbd 100%)'
                  }}
                >
                  {/* Starlight & Planetary Arc Backdrop matching Reference Image */}
                  <div
                    className={`absolute -bottom-24 -left-16 w-80 h-80 rounded-full pointer-events-none ${
                      themeMode === 'dark' ? 'bg-[#3b3d85]/45' : 'bg-[#a3b8e3]/60'
                    }`}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-65"
                    style={{
                      backgroundImage:
                        'radial-gradient(1.5px 1.5px at 12% 24%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 28% 68%, #f0f4ff, transparent), radial-gradient(2px 2px at 46% 30%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 64% 75%, #f0f4ff, transparent), radial-gradient(2px 2px at 82% 22%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 91% 60%, #ffffff, transparent)'
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-10 z-10">
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-white/90">
                        Alt-Universe Studio
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Create Your First World
                      </h1>
                      <p className="text-sm text-white/95 max-w-md leading-relaxed">
                        Build your universe, characters, maps, timelines, and branching relationships in one unified creative workspace.
                      </p>
                      <div className="flex items-center gap-2 pt-3">
                        <span className="w-8 h-1 rounded-full bg-white" />
                        <span className="w-8 h-1 rounded-full bg-white/40" />
                        <span className="w-8 h-1 rounded-full bg-white/40" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingWorld(true);
                        setActiveNav('worlds');
                      }}
                      className="w-36 h-28 rounded-[24px] border border-white/80 bg-[#6d7696] hover:bg-[#5d6685] shadow-[0_8px_24px_rgba(73,74,82,0.3)] transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <Plus className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-white">
                        Create First World
                      </span>
                    </button>
                  </div>

                  {/* Astrological Constellation Flourish on Right Side */}
                  <svg
                    viewBox="0 0 260 120"
                    className="w-56 h-28 opacity-55 pointer-events-none hidden md:block z-10"
                  >
                    <circle cx="190" cy="60" r="45" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="190" cy="60" r="3" fill="#ffffff" />
                    <path
                      d="M140 95 Q190 20 240 95"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              ) : (
                /* ============================================================ */
                /* SECTION 3.1 POPULATED MAIN DASHBOARD (Layla Light Reference) */
                /* ============================================================ */
                <div
                  className="relative rounded-[28px] border border-[#a5b9e3] px-8 sm:px-10 py-8 overflow-hidden flex flex-wrap items-center justify-between gap-6 shadow-[0_16px_42px_rgba(115,139,189,0.28)]"
                  style={
                    activeWorld?.customCss && activeWorld.customCss.startsWith('data:image')
                      ? {
                          backgroundImage:
                            themeMode === 'dark'
                              ? `linear-gradient(125deg, rgba(25, 22, 62, 0.92) 0%, rgba(40, 38, 102, 0.86) 55%, rgba(28, 39, 107, 0.82) 100%), url(${activeWorld.customCss})`
                              : `linear-gradient(125deg, rgba(135, 159, 208, 0.92) 0%, rgba(125, 149, 199, 0.86) 55%, rgba(115, 139, 189, 0.82) 100%), url(${activeWorld.customCss})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }
                      : {
                          background:
                            themeMode === 'dark'
                              ? 'linear-gradient(130deg, #1b1742 0%, #2a2668 52%, #1d2769 100%)'
                              : 'linear-gradient(130deg, #879fd0 0%, #7d95c7 52%, #738bbd 100%)'
                        }
                  }
                >
                  {/* Planetary Dome & Starfield Dots matching Reference Banner */}
                  <div
                    className={`absolute -bottom-28 -left-16 w-96 h-72 rounded-full pointer-events-none ${
                      themeMode === 'dark' ? 'bg-[#3b3d85]/45' : 'bg-[#a3b8e3]/60'
                    }`}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-65"
                    style={{
                      backgroundImage:
                        'radial-gradient(1.5px 1.5px at 14% 22%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 32% 64%, #f0f4ff, transparent), radial-gradient(2px 2px at 48% 28%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 66% 72%, #f0f4ff, transparent), radial-gradient(2px 2px at 84% 25%, #ffffff, transparent)'
                    }}
                  />

                  <div className="z-10 space-y-2 max-w-xl">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/90">
                      Welcome back · Alt-Universe
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {activeWorld ? activeWorld.name : 'Lets Continue Your Journey'}
                    </h1>
                    <p className="text-sm text-white/95 leading-relaxed line-clamp-2">
                      {activeWorld?.synopsis ||
                        'She is a student in the Rtawahist Darshan, specializing in Theoretical Astrology and world lore.'}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-6">
                      <button
                        type="button"
                        onClick={() => setActiveNav('worlds')}
                        className="inline-flex flex-col items-start group"
                      >
                        <span className="text-sm font-bold text-white group-hover:text-white/85 transition">
                          Read More
                        </span>
                        <span className="w-full h-[3px] rounded-full bg-white mt-0.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="w-8 h-1 rounded-full bg-white" />
                        <span className="w-8 h-1 rounded-full bg-white/40" />
                        <span className="w-8 h-1 rounded-full bg-white/40" />
                      </div>
                    </div>
                  </div>

                  {/* Workspace Overview 4 Stat Boxes on the Right of Banner */}
                  <div className="z-10 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Workspace Overview</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: 'Total Worlds',
                          count: worlds.length,
                          iconSrc: '/assets/icons/world.png',
                          nav: 'worlds'
                        },
                        {
                          label: 'Total Articles',
                          count: articles.length,
                          iconSrc: '/assets/icons/story.png',
                          nav: 'articles'
                        },
                        {
                          label: 'Total Characters',
                          count: totalCharactersCount,
                          iconSrc: '/assets/icons/character.png',
                          nav: 'characters'
                        },
                        {
                          label: 'Total Locations',
                          count: totalLocationsCount,
                          iconSrc: '/assets/icons/location.png',
                          nav: 'locations'
                        }
                      ].map((stat) => (
                        <button
                          key={stat.label}
                          type="button"
                          onClick={() => setActiveNav(stat.nav as PrimaryNavId)}
                          className="w-28 py-3 px-3 rounded-[20px] bg-white/95 hover:bg-white border border-white transition-all text-center space-y-1 shadow-[0_8px_20px_rgba(73,74,82,0.16)]"
                        >
                          <img
                            src={stat.iconSrc}
                            alt=""
                            className="w-6 h-6 object-contain mx-auto"
                          />
                          <div className="text-[10px] font-semibold text-[#52586e]">{stat.label}</div>
                          <div className="text-base font-bold font-mono tabular-nums text-[#181b26]">
                            {stat.count}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 3-COLUMN DASHBOARD CARDS (Matching Artwork / Recent Search / */}
              {/* Crisp White Info Cards from Reference Image)                 */}
              {/* ============================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Column 1: Recently Opened */}
                <div className="rounded-[28px] bg-white border border-[#dce3f2] p-6 flex flex-col justify-between min-h-[340px] shadow-[0_12px_30px_rgba(115,139,189,0.14)]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e8edf7] pb-3">
                      <div className="flex items-center gap-2 text-lg font-bold text-[#181b26]">
                        <span>Recently Opened</span>
                        <ChevronRight className="w-4 h-4 text-[#181b26]" />
                      </div>
                      <Clock className="w-4 h-4 text-[#6d7696]" />
                    </div>

                    {recentlyOpened.length === 0 ? (
                      <div className="py-10 text-center space-y-3">
                        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto text-[#879fd0]">
                          <path
                            d="M60 12 L64 24 L76 28 L64 32 L60 44 L56 32 L44 28 L56 24 Z"
                            fill="currentColor"
                          />
                          <path
                            d="M20 48 Q40 42 58 52 L58 80 Q40 70 20 76 Z"
                            fill="currentColor"
                          />
                          <path
                            d="M100 48 Q80 42 62 52 L62 80 Q80 70 100 76 Z"
                            fill="currentColor"
                          />
                        </svg>
                        <div className="text-base font-bold text-[#181b26]">
                          No Content yet
                        </div>
                        <p className="text-xs text-[#52586e] max-w-[200px] mx-auto leading-relaxed">
                          Your recently opened files will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentlyOpened.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.type === 'World') {
                                setActiveWorldId(item.entityId);
                                setActiveNav('worlds');
                              } else {
                                setSelectedArticleId(item.entityId);
                                setOpenInFullscreen(true);
                                setActiveNav(item.moduleTarget as PrimaryNavId);
                              }
                            }}
                            className="w-full text-left flex items-center gap-3.5 p-3 rounded-[20px] bg-[#f5f7fc] hover:bg-[#e8eef9] border border-[#dce3f2] hover:border-[#879fd0] transition-all group"
                          >
                            <div className="w-11 h-11 rounded-2xl bg-[#879fd0] border border-[#7792c4] flex items-center justify-center shrink-0 overflow-hidden">
                              {item.thumbnailUrl && item.thumbnailUrl.startsWith('data:image') ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#181b26] group-hover:text-[#6d7696] truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#52586e] truncate mt-0.5">
                                {item.type} · {item.timestampLabel}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Recently Edited */}
                <div className="rounded-[28px] bg-white border border-[#dce3f2] p-6 flex flex-col justify-between min-h-[340px] shadow-[0_12px_30px_rgba(115,139,189,0.14)]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e8edf7] pb-3">
                      <div className="flex items-center gap-2 text-lg font-bold text-[#181b26]">
                        <span>Recently Edited</span>
                        <ChevronRight className="w-4 h-4 text-[#181b26]" />
                      </div>
                      <Edit3 className="w-4 h-4 text-[#6d7696]" />
                    </div>

                    {recentlyEdited.length === 0 ? (
                      <div className="py-10 text-center space-y-3">
                        <svg viewBox="0 0 120 90" className="w-24 h-20 mx-auto text-[#879fd0]">
                          <path
                            d="M78 14 C60 22 48 40 44 64 L38 78 L50 66 C68 58 82 40 78 14 Z"
                            fill="currentColor"
                          />
                          <circle cx="45" cy="76" r="5" fill="currentColor" />
                        </svg>
                        <div className="text-base font-bold text-[#181b26]">
                          No Content yet
                        </div>
                        <p className="text-xs text-[#52586e] max-w-[200px] mx-auto leading-relaxed">
                          Your latest edit will be shown here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentlyEdited.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.type === 'World') {
                                setActiveWorldId(item.entityId);
                                setActiveNav('worlds');
                              } else {
                                setSelectedArticleId(item.entityId);
                                setOpenInFullscreen(true);
                                setActiveNav(item.moduleTarget as PrimaryNavId);
                              }
                            }}
                            className="w-full text-left flex items-center gap-3.5 p-3 rounded-[20px] bg-[#f5f7fc] hover:bg-[#e8eef9] border border-[#dce3f2] hover:border-[#879fd0] transition-all group"
                          >
                            <div className="w-11 h-11 rounded-2xl bg-[#7792c4] border border-[#6d7696] flex items-center justify-center shrink-0 overflow-hidden">
                              <Feather className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#181b26] group-hover:text-[#6d7696] truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#52586e] truncate mt-0.5">
                                {item.type} · {item.timestampLabel}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Quick Create (Exact 5-Tier Pill Palette from Reference Image) */}
                <div className="rounded-[28px] bg-white border border-[#dce3f2] p-6 flex flex-col justify-between min-h-[340px] relative shadow-[0_12px_30px_rgba(115,139,189,0.14)]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e8edf7] pb-3">
                      <div className="flex items-center gap-2 text-lg font-bold text-[#181b26]">
                        <span>Quick Create</span>
                      </div>
                      <Sparkles className="w-4 h-4 text-[#6d7696]" />
                    </div>

                    <div className="space-y-3 pt-1">
                      {[
                        {
                          id: 'world',
                          label: 'New World',
                          iconSrc: '/assets/icons/world.png',
                          pillClass:
                            'bg-[#8da7db] hover:bg-[#7d98ce] border-[#8da7db] text-white shadow-[0_4px_12px_rgba(141,167,219,0.35)]'
                        },
                        {
                          id: 'article',
                          label: 'New Article',
                          iconSrc: '/assets/icons/story.png',
                          pillClass:
                            'bg-[#7792c4] hover:bg-[#6984b8] border-[#7792c4] text-white shadow-[0_4px_12px_rgba(119,146,196,0.35)]'
                        },
                        {
                          id: 'character',
                          label: 'New Character',
                          iconSrc: '/assets/icons/character.png',
                          pillClass:
                            'bg-[#6d7696] hover:bg-[#5d6685] border-[#6d7696] text-white shadow-[0_4px_12px_rgba(109,118,150,0.35)]'
                        },
                        {
                          id: 'location',
                          label: 'New Location',
                          iconSrc: '/assets/icons/location.png',
                          pillClass:
                            'bg-[#494a52] hover:bg-[#383940] border-[#494a52] text-white shadow-[0_4px_12px_rgba(73,74,82,0.35)]'
                        },
                        {
                          id: 'map',
                          label: 'New Map',
                          iconSrc: '/assets/icons/maps.png',
                          pillClass:
                            'bg-white hover:bg-[#f2f4f9] border-[#dce3f2] text-[#181b26] shadow-[0_4px_14px_rgba(115,139,189,0.18)]'
                        }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() =>
                            handleQuickCreateAction(
                              btn.id as 'world' | 'article' | 'character' | 'location' | 'map'
                            )
                          }
                          className={`w-full py-2.5 px-4 rounded-full font-semibold text-xs flex items-center gap-3 transition-all border ${btn.pillClass}`}
                        >
                          <img
                            src={btn.iconSrc}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Bottom Status Bar (Section 3.1: Active tasks, Storage usage, Backup status) */}
              <div className="rounded-[24px] bg-white border border-[#dce3f2] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#52586e] shadow-[0_8px_24px_rgba(115,139,189,0.12)]">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Active Tasks:{' '}
                    <strong className="font-mono tabular-nums text-[#181b26]">
                      {tasks.filter((t) => t.status !== 'Completed').length}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Local Storage Usage:{' '}
                    <strong className="font-mono tabular-nums text-[#181b26]">
                      {worlds.length === 0 ? '0.0 MB' : `${workspace.storageUsedMb} MB`}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Backup Status:{' '}
                    <strong className="text-[#6d7696]">{backupStatus}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {worlds.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleLoadSampleWorkspace}
                      className="text-xs text-[#6d7696] hover:text-[#181b26] underline font-semibold"
                    >
                      Optional: Load Sample World (Demo Lore)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetToEmptyFirstTimeState}
                      className="text-xs text-[#52586e] hover:text-rose-600 underline"
                    >
                      Reset to Empty First-Time State
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportFullWorkspaceJson}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6d7696] hover:bg-[#5d6685] border border-[#879fd0] text-white font-semibold transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Backup JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 3A: STORY UI (Soft Periwinkle & Crisp White Palette)        */}
          {/* ================================================================ */}
          {activeNav === 'articles' && !showStoryAdvancedWiki && (
            <div
              className={`relative -mx-6 sm:-mx-8 -my-6 sm:-my-8 bg-[#f2f4f9] flex flex-col overflow-y-auto ${
                isStoryFullscreen
                  ? 'h-screen max-h-screen'
                  : 'h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]'
              }`}
            >
              <input
                ref={storyThumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleStoryThumbnailUpload}
                className="hidden"
              />

              {/* Sticky Top Action Bar for Story: In-Page Search (when Fullscreen) & Fullscreen Toggle */}
              <div className="sticky top-0 z-30 bg-[#f2f4f9]/95 backdrop-blur-md px-6 sm:px-10 pt-5 sm:pt-6 pb-3">
                <div
                  className={`mx-auto flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300 ${
                    isStoryFullscreen ? 'max-w-7xl' : 'max-w-5xl'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[220px]">
                    {returnToUniverseLineProp && (
                      <button
                        type="button"
                        onClick={returnToUniverseLineProp.onReturn}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#e6ecf7] text-[#181b26] border border-[#6d7696] text-xs font-serif font-semibold transition shadow-xs shrink-0 cursor-pointer group"
                        title={`Kembali ke halaman ${returnToUniverseLineProp.label}`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#6d7696] group-hover:-translate-x-0.5 transition-transform" />
                        {returnToUniverseLineProp.iconSrc && (
                          <img
                            src={returnToUniverseLineProp.iconSrc}
                            alt=""
                            className="w-4 h-4 object-contain shrink-0"
                          />
                        )}
                        <span>Kembali ke {returnToUniverseLineProp.label}</span>
                      </button>
                    )}
                    {isStoryFullscreen && (
                      <div className="flex-1 min-w-[200px] max-w-md">{inPageSearchElement}</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isStoryFullscreen;
                      setIsStoryFullscreen(next);
                      setIsWorkspaceFullscreen(next);
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-serif font-semibold transition shadow-xs ${
                      isStoryFullscreen
                        ? 'bg-[#6d7696] text-white border-[#879fd0] shadow-[0_4px_14px_rgba(109,118,150,0.35)]'
                        : 'bg-white hover:bg-[#e8eef9] text-[#181b26] border-[#494a52]'
                    }`}
                  >
                    {isStoryFullscreen ? (
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

              {/* Stationary (Sticky) Top 1920x1080 px (16:9) Dashed Thumbnail Dropzone */}
              {(!isStoryFullscreen || storyThumbnail) && (
                <div
                  className={`sticky top-[56px] z-10 w-full mx-auto px-6 sm:px-10 pt-1 transition-all duration-300 ${
                    isStoryFullscreen ? 'max-w-7xl' : 'max-w-5xl'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!isStoryFullscreen) storyThumbInputRef.current?.click();
                    }}
                    style={storyThumbnail ? { borderStyle: 'none' } : undefined}
                    className={`w-full aspect-[16/9] max-h-[380px] sm:max-h-[440px] mx-auto rounded-[28px] bg-gradient-to-br from-[#879fd0] via-[#7d95c7] to-[#738bbd] shadow-[0_12px_32px_rgba(115,139,189,0.28)] transition-colors flex flex-col items-center justify-center relative overflow-hidden group ${
                      isStoryFullscreen ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      storyThumbnail
                        ? 'border border-[#cbd3e6]'
                        : 'border-2 border-dashed border-white/80 hover:border-white'
                    }`}
                  >
                    {storyThumbnail ? (
                      <>
                        <img
                          src={storyThumbnail}
                          alt="Story Thumbnail (1920x1080)"
                          className="w-full h-full object-cover"
                        />
                        {!isStoryFullscreen && (
                          <div className="absolute inset-0 bg-[#181b26]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-[#6d7696] border border-white/80 text-xs font-semibold text-white">
                              Change Thumbnail (1920×1080 px)
                            </span>
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setStoryThumbnail('');
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-[#494a52] border border-white/60 text-xs font-semibold text-white"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center space-y-2.5 select-none">
                        <Plus className="w-12 h-12 text-white mx-auto stroke-[2.5] group-hover:scale-105 transition-transform" />
                        <div className="text-base sm:text-lg font-bold text-white tracking-wide">
                          Add Thumbnail (Opsional)
                        </div>
                        <div className="text-xs font-mono text-white/90">
                          1920 × 1080 px
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scrolling Story / Article Card: Rises Upward Over the Stationary Thumbnail Until Covered */}
              <form
                onSubmit={handleSaveStoryEntry}
                className={`relative z-20 w-full mx-auto px-6 sm:px-10 mt-7 pb-[42vh] transition-all duration-300 ${
                  isStoryFullscreen ? 'max-w-7xl' : 'max-w-5xl'
                }`}
              >
                <div className="bg-[#f2f4f9] rounded-t-[28px] space-y-6">
                  {isStoryFullscreen ? (
                    <div className="rounded-[28px] bg-white border border-[#dce3f2] px-8 sm:px-12 py-8 min-h-[540px] flex flex-col justify-between shadow-[0_-18px_40px_rgba(242,244,249,0.98),0_12px_32px_rgba(115,139,189,0.18)] space-y-6 select-text font-serif">
                      <div className="space-y-6">
                        {storyTitle.trim() && (
                          <div className="border-b border-[#e4eaf6] pb-4">
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#181b26] tracking-wide">
                              {storyTitle.trim()}
                            </h1>
                          </div>
                        )}

                        <div className="space-y-3">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#181b26]">
                            Sinopsis
                          </h2>
                          <p className="text-lg sm:text-xl text-[#2c3142] leading-relaxed whitespace-pre-line">
                            {storySynopsis.trim() || 'Belum ada sinopsis cerita.'}
                          </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-[#e4eaf6]">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#181b26]">
                            Full Story
                          </h2>
                          <p className="text-lg sm:text-xl text-[#2c3142] leading-relaxed whitespace-pre-line">
                            {storyText.trim() || 'Belum ada teks cerita lengkap.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-[28px] bg-white border border-[#dce3f2] px-8 sm:px-12 py-8 min-h-[500px] flex flex-col justify-between shadow-[0_-18px_40px_rgba(242,244,249,0.98),0_12px_32px_rgba(115,139,189,0.18)] space-y-6">
                        {/* Section 1: Sinopsis */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#181b26]">
                              Sinopsis
                            </h2>
                            <input
                              type="text"
                              value={storyTitle}
                              onChange={(e) => setStoryTitle(e.target.value)}
                              placeholder="Judul Cerita (opsional)..."
                              className="bg-transparent font-serif text-xs text-[#6d7696] placeholder:text-[#848da8] focus:outline-none border-b border-transparent focus:border-[#879fd0] text-right"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={storySynopsis}
                            onChange={(e) => setStorySynopsis(e.target.value)}
                            placeholder="(deskripsi)"
                            className="w-full bg-transparent font-serif text-lg sm:text-xl text-[#181b26] placeholder:text-[#848da8] leading-relaxed resize-none focus:outline-none"
                          />
                        </div>

                        {/* Section 2: Full Story */}
                        <div className="space-y-3 flex-1 flex flex-col pt-2">
                          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#181b26]">
                            Full Story
                          </h2>
                          {!storyText && (
                            <div className="font-serif text-lg sm:text-xl pointer-events-none select-none -mb-8">
                              <span className="text-[#52586e]">(deskripsi) </span>
                              <span className="text-[#848da8]">
                                (hanya admin dan yang diizinkan yang dapat mengakses)
                              </span>
                            </div>
                          )}
                          <textarea
                            rows={10}
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                            placeholder=""
                            className="w-full flex-1 bg-transparent font-serif text-lg sm:text-xl text-[#181b26] leading-relaxed resize-none focus:outline-none relative z-10"
                          />
                        </div>
                      </div>

                      {/* Action Bar & Saved Stories Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#52586e]">
                          <span className="font-mono tabular-nums">
                            {`${storySynopsis} ${storyText}`.trim()
                              ? `${storySynopsis} ${storyText}`.trim().split(/\s+/).filter(Boolean).length
                              : 0}{' '}
                            words
                          </span>
                          {storySavedToast && (
                            <span className="inline-flex items-center gap-1 text-[#6d7696] font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              Story tersimpan di Workspace
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowStoryAdvancedWiki(true)}
                            className="text-[#6d7696] hover:text-[#181b26] underline ml-1 font-semibold"
                          >
                            Buka Daftar Artikel &amp; Tag ({articles.length})
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {(storySynopsis || storyText || storyTitle || storyThumbnail || activeStoryId) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveStoryId('');
                                setStoryTitle('');
                                setStorySynopsis('');
                                setStoryText('');
                                setStoryThumbnail('');
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

                      {/* Saved Stories List */}
                      {articles.filter((a) => a.category === 'Stories' || a.tags.includes('Story'))
                        .length > 0 && (
                        <div className="pt-4 border-t border-[#d5dced] space-y-3">
                          <div className="text-xs font-bold text-[#181b26]">
                            Story Tersimpan di Workspace
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {articles
                              .filter((a) => a.category === 'Stories' || a.tags.includes('Story'))
                              .map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveStoryId(st.id);
                                    setStoryTitle(st.title);
                                    setStorySynopsis(String(st.templateValues?.Sinopsis || st.summary || ''));
                                    setStoryText(st.content);
                                    setStoryThumbnail(
                                      st.secretNotes?.startsWith('data:image') ? st.secretNotes : ''
                                    );
                                    recordOpenedItem(
                                      st.id,
                                      st.title,
                                      'Article',
                                      'articles',
                                      st.secretNotes
                                    );
                                  }}
                                  className={`text-left p-3.5 rounded-[22px] border transition-all flex items-center gap-3 ${
                                    activeStoryId === st.id
                                      ? 'bg-[#6d7696] text-white border-[#879fd0] shadow-md'
                                      : 'bg-white text-[#181b26] border-[#dce3f2] hover:border-[#879fd0] shadow-xs'
                                  }`}
                                >
                                  {st.secretNotes && st.secretNotes.startsWith('data:image') ? (
                                    <img
                                      src={st.secretNotes}
                                      alt={st.title}
                                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#879fd0]"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-[#879fd0] border border-[#7792c4] flex items-center justify-center shrink-0">
                                      <BookOpen className="w-4 h-4 text-white" />
                                    </div>
                                  )}
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
                                      {st.summary || 'Sinopsis & Full Story'} · {st.wordCount}w
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 3B: REVISI (5) CHARACTER UI (Exact match for 5_4063e049.png)*/}
          {/* ================================================================ */}
          {activeNav === 'characters' && (
            <CharacterStudioView
              activeWorld={safeActiveWorld}
              articles={articles}
              selectedCharacterId={selectedArticleId}
              onSelectCharacter={(id) => {
                setSelectedArticleId(id);
                const found = articles.find((a) => a.id === id);
                if (found) {
                  recordOpenedItem(
                    found.id,
                    found.title,
                    'Character',
                    'characters',
                    String(found.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onSaveCharacter={async (charArt) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const finalChar: Article = { ...charArt, worldId: targetW.id };
                setArticles((prev) =>
                  prev.some((a) => a.id === finalChar.id)
                    ? prev.map((a) => (a.id === finalChar.id ? finalChar : a))
                    : [finalChar, ...prev]
                );
                const thumbUrl = String(finalChar.templateValues?.ThumbnailUrl || '');
                recordOpenedItem(finalChar.id, finalChar.title, 'Character', 'characters', thumbUrl);
                recordEditedItem(finalChar.id, finalChar.title, 'Character', 'characters', thumbUrl);

                if (currentUser) {
                  try {
                    await syncArticleToFirestore(
                      currentUser,
                      finalChar.id,
                      finalChar.worldId,
                      finalChar.title,
                      finalChar.templateType,
                      finalChar.category,
                      finalChar.summary,
                      finalChar.content,
                      finalChar.status,
                      finalChar.visibility,
                      false
                    );
                  } catch {
                    // Local-first fallback
                  }
                }
              }}
              onCreateStubTagArticle={({ title, category, templateType, tagTypeLabel }) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                // NB Rule: Tag baru yang dibuat di sub kolom karakter hanya memuat judul;
                // artikel mengenai tag tersebut dapat dilengkapi di bagian/sidebar masing-masing.
                const stubArt: Article = {
                  id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  worldId: targetW.id,
                  title,
                  aliases: [],
                  templateType,
                  category,
                  tags: [tagTypeLabel],
                  summary: `Tag ${tagTypeLabel} (Hanya memuat judul — lengkapi artikel di bagian ${category})`,
                  content: '',
                  secretNotes: '',
                  spoilerWarning: '',
                  templateValues: {},
                  status: 'draft',
                  visibility: 'private',
                  linkedEntityIds: [],
                  galleryCaptions: [],
                  versions: [
                    {
                      id: `v-${Date.now()}`,
                      timestamp: nowStamp,
                      author: 'Creator',
                      note: `Dibuat sebagai judul tag (${tagTypeLabel}) dari sub-kolom Character`,
                      contentSnapshot: ''
                    }
                  ],
                  comments: [],
                  wordCount: 0,
                  updatedAt: nowStamp
                };
                setArticles((prev) => [stubArt, ...prev]);
                return stubArt;
              }}
              onDeleteCharacter={(id) =>
                setArticles((prev) => prev.filter((a) => a.id !== id))
              }
              onJumpToTagArticle={(articleId, category) => {
                setIsSidebarMinimized(true);
                setSelectedArticleId(articleId);
                setOpenInFullscreen(true);
                if (category === 'Locations') {
                  setActiveNav('locations');
                } else if (category === 'Organizations') {
                  setActiveNav('organizations');
                } else if (category === 'Species') {
                  setActiveNav('species');
                } else if (category === 'Conditions') {
                  setActiveNav('conditions');
                } else if (category === 'Cosmics') {
                  setActiveNav('cosmics');
                } else {
                  setShowStoryAdvancedWiki(true);
                  setActiveNav('articles');
                }
              }}
              initialFullscreen={openInFullscreen}
              onFullscreenConsumed={() => setOpenInFullscreen(false)}
              onFullscreenChange={setIsWorkspaceFullscreen}
              inPageSearchNode={inPageSearchElement}
              returnToUniverseLine={returnToUniverseLineProp}
              historyRevision={historyRevision}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 3C: LOCATION UI (Exact match for 6_e265ce0a.png)            */}
          {/* ================================================================ */}
          {activeNav === 'locations' && (
            <LocationStudioView
              activeWorld={safeActiveWorld}
              articles={articles}
              selectedLocationId={selectedArticleId}
              initialFullscreen={openInFullscreen}
              onFullscreenConsumed={() => setOpenInFullscreen(false)}
              onFullscreenChange={setIsWorkspaceFullscreen}
              inPageSearchNode={inPageSearchElement}
              returnToUniverseLine={returnToUniverseLineProp}
              historyRevision={historyRevision}
              onSelectLocation={(id) => {
                setSelectedArticleId(id);
                const found = articles.find((a) => a.id === id);
                if (found) {
                  recordOpenedItem(
                    found.id,
                    found.title,
                    'Location',
                    'locations',
                    String(found.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onSaveLocation={async (locArt) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const finalLoc: Article = { ...locArt, worldId: targetW.id };
                setArticles((prev) =>
                  prev.some((a) => a.id === finalLoc.id)
                    ? prev.map((a) => (a.id === finalLoc.id ? finalLoc : a))
                    : [finalLoc, ...prev]
                );
                const thumbUrl = String(finalLoc.templateValues?.ThumbnailUrl || '');
                recordOpenedItem(finalLoc.id, finalLoc.title, 'Location', 'locations', thumbUrl);
                recordEditedItem(finalLoc.id, finalLoc.title, 'Location', 'locations', thumbUrl);

                if (currentUser) {
                  try {
                    await syncArticleToFirestore(
                      currentUser,
                      finalLoc.id,
                      finalLoc.worldId,
                      finalLoc.title,
                      finalLoc.templateType,
                      finalLoc.category,
                      finalLoc.summary,
                      finalLoc.content,
                      finalLoc.status,
                      finalLoc.visibility,
                      false
                    );
                  } catch {
                    // Local-first fallback
                  }
                }
              }}
              onCreateStubTagArticle={({ title, category, templateType, tagTypeLabel }) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                const stubArt: Article = {
                  id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  worldId: targetW.id,
                  title,
                  aliases: [],
                  templateType,
                  category,
                  tags: [tagTypeLabel],
                  summary: `Tag ${tagTypeLabel} (Hanya memuat judul — lengkapi artikel di bagian ${category})`,
                  content: '',
                  secretNotes: '',
                  spoilerWarning: '',
                  templateValues: {},
                  status: 'draft',
                  visibility: 'private',
                  linkedEntityIds: [],
                  galleryCaptions: [],
                  versions: [
                    {
                      id: `v-${Date.now()}`,
                      timestamp: nowStamp,
                      author: 'Creator',
                      note: `Dibuat sebagai judul tag (${tagTypeLabel}) dari sub-kolom Location`,
                      contentSnapshot: ''
                    }
                  ],
                  comments: [],
                  wordCount: 0,
                  updatedAt: nowStamp
                };
                setArticles((prev) => [stubArt, ...prev]);
                return stubArt;
              }}
              onDeleteLocation={(id) =>
                setArticles((prev) => prev.filter((a) => a.id !== id))
              }
              onJumpToTagArticle={(articleId, category) => {
                setIsSidebarMinimized(true);
                setSelectedArticleId(articleId);
                setOpenInFullscreen(true);
                if (category === 'Cosmics') setActiveNav('cosmics');
                else if (category === 'Species') setActiveNav('species');
                else if (category === 'Organizations') setActiveNav('organizations');
                else setActiveNav('articles');
              }}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 3D: WORLD / ORGANIZATION / SPECIES / CONDITION / COSMICS /  */}
          {/*          MANUSCRIPTS / EVENTS (Manuscript-Style Studio View)     */}
          {/* ================================================================ */}
          {(
            [
              'worlds',
              'organizations',
              'species',
              'conditions',
              'cosmics',
              'manuscripts',
              'events'
            ] as const
          ).includes(activeNav as EntityCategoryMode) && (
            <EntityCategoryStudioView
              mode={activeNav as EntityCategoryMode}
              activeWorld={safeActiveWorld}
              articles={
                activeNav === 'worlds'
                  ? [
                      ...articles,
                      ...worlds
                        .filter((w) => !articles.some((a) => a.id === w.id))
                        .map(
                          (w): Article => ({
                            id: w.id,
                            worldId: w.id,
                            title: w.name,
                            aliases: [],
                            templateType: 'World / Setting',
                            category: 'Worlds',
                            tags: ['World', 'Worlds'],
                            summary: w.synopsis.slice(0, 140),
                            content: w.synopsis,
                            secretNotes: w.announcement || '',
                            spoilerWarning: '',
                            templateValues: {
                              ThumbnailUrl: w.customCss?.startsWith('data:image')
                                ? w.customCss
                                : ''
                            },
                            status: 'published',
                            visibility: w.visibility === 'public' ? 'public' : 'private',
                            linkedEntityIds: [],
                            galleryCaptions: [],
                            versions: [],
                            comments: [],
                            wordCount: w.synopsis
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean).length,
                            updatedAt: w.updatedAt
                          })
                        )
                    ]
                  : articles
              }
              selectedEntityId={
                activeNav === 'worlds' ? selectedArticleId || activeWorldId : selectedArticleId
              }
              initialFullscreen={openInFullscreen}
              onFullscreenConsumed={() => setOpenInFullscreen(false)}
              onFullscreenChange={setIsWorkspaceFullscreen}
              inPageSearchNode={inPageSearchElement}
              returnToUniverseLine={returnToUniverseLineProp}
              historyRevision={historyRevision}
              onSelectEntity={(id) => {
                setSelectedArticleId(id);
                if (activeNav === 'worlds' && id) {
                  setActiveWorldId(id);
                  const foundW = worlds.find((w) => w.id === id);
                  if (foundW) {
                    recordOpenedItem(foundW.id, foundW.name, 'World', 'worlds', foundW.customCss);
                    return;
                  }
                }
                const found = articles.find((a) => a.id === id);
                if (found) {
                  recordOpenedItem(
                    found.id,
                    found.title,
                    activeNav === 'worlds' ? 'World' : 'Article',
                    activeNav,
                    String(found.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onSaveEntity={async (entityArt) => {
                const thumbUrl = String(entityArt.templateValues?.ThumbnailUrl || '');
                if (activeNav === 'worlds') {
                  const syncedWorld: World = {
                    id: entityArt.id,
                    workspaceId: workspace.id,
                    universeId: activeWorld?.universeId || `uni-${Date.now()}`,
                    universeName: activeWorld?.universeName || 'Prime Universe',
                    name: entityArt.title,
                    genre: 'Speculative Fiction',
                    tags: ['World'],
                    synopsis: entityArt.content || entityArt.summary,
                    announcement: entityArt.secretNotes || '',
                    visibility: 'private',
                    accentColor: '#368f66',
                    customCss: thumbUrl,
                    articleLayout: 'encyclopedia',
                    updatedAt: entityArt.updatedAt
                  };
                  setWorlds((prev) =>
                    prev.some((w) => w.id === syncedWorld.id)
                      ? prev.map((w) => (w.id === syncedWorld.id ? syncedWorld : w))
                      : [syncedWorld, ...prev]
                  );
                  setActiveWorldId(syncedWorld.id);
                  setArticles((prev) =>
                    prev.some((a) => a.id === entityArt.id)
                      ? prev.map((a) => (a.id === entityArt.id ? entityArt : a))
                      : [entityArt, ...prev]
                  );
                  recordOpenedItem(entityArt.id, entityArt.title, 'World', 'worlds', thumbUrl);
                  recordEditedItem(entityArt.id, entityArt.title, 'World', 'worlds', thumbUrl);

                  if (currentUser) {
                    try {
                      await syncWorldToFirestore(
                        currentUser,
                        syncedWorld.id,
                        syncedWorld.workspaceId,
                        syncedWorld.name,
                        syncedWorld.universeName,
                        syncedWorld.genre,
                        syncedWorld.synopsis,
                        syncedWorld.visibility,
                        false
                      );
                    } catch {
                      // Local-first fallback
                    }
                  }
                  return;
                }

                const targetW = ensureActiveWorldForQuickCreate();
                const finalEntity: Article = { ...entityArt, worldId: targetW.id };
                setArticles((prev) =>
                  prev.some((a) => a.id === finalEntity.id)
                    ? prev.map((a) => (a.id === finalEntity.id ? finalEntity : a))
                    : [finalEntity, ...prev]
                );
                recordOpenedItem(finalEntity.id, finalEntity.title, 'Article', activeNav, thumbUrl);
                recordEditedItem(finalEntity.id, finalEntity.title, 'Article', activeNav, thumbUrl);

                if (currentUser) {
                  try {
                    await syncArticleToFirestore(
                      currentUser,
                      finalEntity.id,
                      finalEntity.worldId,
                      finalEntity.title,
                      finalEntity.templateType,
                      finalEntity.category,
                      finalEntity.summary,
                      finalEntity.content,
                      finalEntity.status,
                      finalEntity.visibility,
                      false
                    );
                  } catch {
                    // Local-first fallback
                  }
                }
              }}
              onDeleteEntity={(id) => {
                setArticles((prev) => prev.filter((a) => a.id !== id));
                if (activeNav === 'worlds') {
                  setWorlds((prev) => prev.filter((w) => w.id !== id));
                }
              }}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 3E: ADVANCED LORE WIKI & TEMPLATES                          */}
          {/* ================================================================ */}
          {activeNav === 'articles' && showStoryAdvancedWiki && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white border border-[#dce3f2] rounded-2xl px-4 py-2.5 shadow-xs">
                <span className="text-xs text-[#52586e] font-serif">
                  Daftar Artikel &amp; Tag — Lengkapi artikel atau template kustom di sini
                </span>
                <button
                  type="button"
                  onClick={() => setShowStoryAdvancedWiki(false)}
                  className="px-4 py-1.5 rounded-full bg-[#6d7696] hover:bg-[#5d6685] border border-[#879fd0] text-white font-serif font-semibold text-xs"
                >
                  ← Kembali ke Story
                </button>
              </div>
              <ArticleAndTemplateModule
                activeWorld={safeActiveWorld}
                worlds={worlds}
                articles={articles}
                templates={templates}
                selectedArticleId={selectedArticleId}
                initialSubTab="wiki"
                onSelectArticle={(id) => {
                  setSelectedArticleId(id);
                  const found = articles.find((a) => a.id === id);
                  if (found) {
                    recordOpenedItem(found.id, found.title, 'Article', 'articles');
                  }
                }}
                onSaveArticle={async (updated) => {
                  setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                  recordEditedItem(updated.id, updated.title, 'Article', 'articles');
                }}
                onCreateArticle={async (newArt) => {
                  const targetW = ensureActiveWorldForQuickCreate();
                  const artWithWorld = { ...newArt, worldId: targetW.id };
                  setArticles((prev) => [artWithWorld, ...prev]);
                  recordEditedItem(artWithWorld.id, artWithWorld.title, 'Article', 'articles');
                }}
                onDeleteArticle={(id) => setArticles((prev) => prev.filter((a) => a.id !== id))}
                onSaveTemplate={(tpl) =>
                  setTemplates((prev) =>
                    prev.some((t) => t.id === tpl.id)
                      ? prev.map((t) => (t.id === tpl.id ? tpl : t))
                      : [...prev, tpl]
                  )
                }
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 4A: CARTOGRAPHY & LOCATION MAP STUDIO (MAPS)                */}
          {/* ================================================================ */}
          {activeNav === 'maps' && (
            <CartographyMapStudio
              activeWorld={safeActiveWorld}
              maps={maps}
              articles={articles}
              onUpdateMap={(updatedMap) => {
                setMaps((prev) =>
                  prev.some((m) => m.id === updatedMap.id)
                    ? prev.map((m) => (m.id === updatedMap.id ? updatedMap : m))
                    : [updatedMap, ...prev]
                );
                recordEditedItem(updatedMap.id, updatedMap.name, 'Map', 'maps');
              }}
              onCreateMap={(newMap) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const mapWithWorld: WorldMap = { ...newMap, worldId: targetW.id };
                setMaps((prev) => [mapWithWorld, ...prev]);
                recordOpenedItem(mapWithWorld.id, mapWithWorld.name, 'Map', 'maps');
                recordEditedItem(mapWithWorld.id, mapWithWorld.name, 'Map', 'maps');
              }}
              onDeleteMap={(mapId) => {
                setMaps((prev) => prev.filter((m) => m.id !== mapId));
              }}
              onStartZoomTransition={() => {
                setIsSidebarMinimized(true);
                setIsCanvasZoomTransitioning(true);
              }}
              onNavigateToLocation={(locationArticleId) => {
                setIsCanvasZoomTransitioning(false);
                setIsSidebarMinimized(true);
                setSelectedArticleId(locationArticleId);
                setOpenInFullscreen(true);
                setUniverseLineReturnOrigin({
                  navId: 'maps',
                  label: 'Maps',
                  iconSrc: '/assets/icons/maps.png'
                });
                setActiveNav('locations');
                const foundLoc = articles.find((a) => a.id === locationArticleId);
                if (foundLoc) {
                  recordOpenedItem(
                    foundLoc.id,
                    foundLoc.title,
                    'Article',
                    'locations',
                    String(foundLoc.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onCreateLocationStub={(locationTitle) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const existing = articles.find(
                  (a) =>
                    a.worldId === targetW.id &&
                    (a.category === 'Locations' ||
                      String(a.templateType).startsWith('Location')) &&
                    a.title.toLowerCase() === locationTitle.trim().toLowerCase()
                );
                if (existing) return existing;

                const newLocArt: Article = {
                  id: `art-loc-${Date.now()}`,
                  worldId: targetW.id,
                  title: locationTitle.trim(),
                  aliases: [],
                  category: 'Locations',
                  templateType: 'Location - Settlement / City',
                  tags: ['Location'],
                  summary: '',
                  content: '',
                  secretNotes: '',
                  spoilerWarning: '',
                  templateValues: {},
                  status: 'draft',
                  visibility: 'public',
                  linkedEntityIds: [],
                  galleryCaptions: [],
                  versions: [],
                  comments: [],
                  wordCount: 0,
                  updatedAt: new Date().toLocaleDateString('id-ID')
                };
                setArticles((prev) => [newLocArt, ...prev]);
                recordEditedItem(newLocArt.id, newLocArt.title, 'Article', 'locations');
                return newLocArt;
              }}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 4B: TIMELINE STUDIO (Mode Utama & Mode Kanvas)              */}
          {/* ================================================================ */}
          {activeNav === 'timelines' && (
            <TimelineStudioView
              activeWorld={safeActiveWorld}
              worlds={worlds}
              articles={articles}
              timelineEvents={timelineEvents}
              historyRevision={historyRevision}
              onStartZoomTransition={() => {
                setIsSidebarMinimized(true);
                setIsCanvasZoomTransitioning(true);
              }}
              onNavigateToEvent={(eventArticleId) => {
                setIsCanvasZoomTransitioning(false);
                setIsSidebarMinimized(true);
                setSelectedArticleId(eventArticleId);
                setOpenInFullscreen(true);
                setUniverseLineReturnOrigin({
                  navId: 'timelines',
                  label: 'Timeline',
                  iconSrc: '/assets/icons/timeline.png'
                });
                setActiveNav('events');
                const foundEv = articles.find((a) => a.id === eventArticleId);
                if (foundEv) {
                  recordOpenedItem(
                    foundEv.id,
                    foundEv.title,
                    'Article',
                    'events',
                    String(foundEv.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onCreateOrSyncEventArticle={({
                id,
                worldId,
                title,
                summary,
                thumbnailUrl,
                categoryTag,
                yearText
              }) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const resolvedWorldId = worldId || targetW.id;
                const existing = articles.find(
                  (a) =>
                    (id && a.id === id) ||
                    ((a.category === 'Events' ||
                      a.templateType === 'Event / Historical Milestone' ||
                      a.tags.includes('Event')) &&
                      a.title.toLowerCase() === title.trim().toLowerCase())
                );
                if (existing) {
                  const updated: Article = {
                    ...existing,
                    title: title.trim(),
                    summary: summary || existing.summary,
                    content: existing.content || summary,
                    templateValues: {
                      ...existing.templateValues,
                      ThumbnailUrl:
                        thumbnailUrl || String(existing.templateValues?.ThumbnailUrl || ''),
                      Tahun: yearText || String(existing.templateValues?.Tahun || ''),
                      KategoriEvent:
                        categoryTag || String(existing.templateValues?.KategoriEvent || '')
                    }
                  };
                  setArticles((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a))
                  );
                  return updated;
                }

                const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                const newEventArt: Article = {
                  id: id || `events-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  worldId: resolvedWorldId,
                  title: title.trim(),
                  aliases: [],
                  templateType: 'Event / Historical Milestone',
                  category: 'Events',
                  tags: ['Event', 'Events', ...(categoryTag ? [categoryTag] : [])],
                  summary: summary.slice(0, 140) || `${title.trim()} (${yearText || 'Event'})`,
                  content: summary,
                  secretNotes: '',
                  spoilerWarning: '',
                  templateValues: {
                    ThumbnailUrl: thumbnailUrl || '',
                    Tahun: yearText || '',
                    KategoriEvent: categoryTag || 'Event'
                  },
                  status: 'published',
                  visibility: 'private',
                  linkedEntityIds: [],
                  galleryCaptions: thumbnailUrl ? [title.trim()] : [],
                  versions: [
                    {
                      id: `v-${Date.now()}`,
                      timestamp: nowStamp,
                      author: 'Creator',
                      note: 'Created/Synced from Timeline Studio',
                      contentSnapshot: summary
                    }
                  ],
                  comments: [],
                  wordCount: summary
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length,
                  updatedAt: nowStamp
                };

                setArticles((prev) => [newEventArt, ...prev]);
                recordEditedItem(
                  newEventArt.id,
                  newEventArt.title,
                  'Article',
                  'events',
                  thumbnailUrl
                );
                return newEventArt;
              }}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 4C: RELATIONSHIP STUDIO (5 Fixed Types & Branching Graph)   */}
          {/* ================================================================ */}
          {activeNav === 'relationships' && (
            <RelationshipStudioView
              activeWorld={safeActiveWorld}
              articles={articles}
              historyRevision={historyRevision}
              onStartZoomTransition={() => {
                setIsSidebarMinimized(true);
                setIsCanvasZoomTransitioning(true);
              }}
              onNavigateToTagPage={(articleId, targetTab) => {
                setIsCanvasZoomTransitioning(false);
                setIsSidebarMinimized(true);
                setSelectedArticleId(articleId);
                setOpenInFullscreen(true);
                setUniverseLineReturnOrigin({
                  navId: 'relationships',
                  label: 'Relationship',
                  iconSrc: '/assets/icons/relationship.png'
                });
                setActiveNav(targetTab);
                const foundArt = articles.find((a) => a.id === articleId);
                if (foundArt) {
                  recordOpenedItem(
                    foundArt.id,
                    foundArt.title,
                    'Article',
                    targetTab,
                    String(foundArt.templateValues?.ThumbnailUrl || '')
                  );
                }
              }}
              onCreateOrSyncTagArticle={({
                id,
                worldId,
                title,
                tagTab,
                summary,
                thumbnailUrl
              }) => {
                const targetW = ensureActiveWorldForQuickCreate();
                const resolvedWorldId = worldId || targetW.id;
                const tabMeta = TAG_TAB_METADATA[tagTab];

                const existing = articles.find(
                  (a) =>
                    (id && a.id === id) ||
                    (a.category === tabMeta.articleCategory &&
                      a.title.toLowerCase() === title.trim().toLowerCase())
                );
                if (existing) {
                  const updated: Article = {
                    ...existing,
                    title: title.trim(),
                    summary: summary || existing.summary,
                    content: existing.content || summary,
                    templateValues: {
                      ...existing.templateValues,
                      ThumbnailUrl:
                        thumbnailUrl || String(existing.templateValues?.ThumbnailUrl || '')
                    }
                  };
                  setArticles((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a))
                  );
                  return updated;
                }

                const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                const newTagArt: Article = {
                  id:
                    id ||
                    `${tagTab}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  worldId: resolvedWorldId,
                  title: title.trim(),
                  aliases: [],
                  templateType: tabMeta.templateType,
                  category: tabMeta.articleCategory,
                  tags: [tabMeta.label, tabMeta.articleCategory],
                  summary:
                    summary.slice(0, 140) ||
                    `${title.trim()} (${tabMeta.indonesianLabel})`,
                  content: summary,
                  secretNotes: '',
                  spoilerWarning: '',
                  templateValues: {
                    ThumbnailUrl: thumbnailUrl || ''
                  },
                  status: 'published',
                  visibility: 'private',
                  linkedEntityIds: [],
                  galleryCaptions: thumbnailUrl ? [title.trim()] : [],
                  versions: [
                    {
                      id: `v-${Date.now()}`,
                      timestamp: nowStamp,
                      author: 'Creator',
                      note: 'Created/Synced from Relationship Studio',
                      contentSnapshot: summary
                    }
                  ],
                  comments: [],
                  wordCount: summary
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length,
                  updatedAt: nowStamp
                };

                setArticles((prev) => [newTagArt, ...prev]);
                recordEditedItem(
                  newTagArt.id,
                  newTagArt.title,
                  'Article',
                  tagTab,
                  thumbnailUrl
                );
                return newTagArt;
              }}
            />
          )}


          {/* ================================================================ */}
          {/* VIEW 6: IMAGE & ASSET LIBRARY (Section 2.1 Item 11)              */}
          {/* ================================================================ */}
          {activeNav === 'assets' && (
            <DigitalAssetLibrary
              activeWorld={activeWorld}
              articles={worldArticles}
              assets={digitalAssets}
              onAddAsset={(ast) => setDigitalAssets((prev) => [ast, ...prev])}
              onDeleteAsset={(id) =>
                setDigitalAssets((prev) => prev.filter((a) => a.id !== id))
              }
              onSelectArticle={(id) => {
                setSelectedArticleId(id);
                setActiveNav('articles');
              }}
              onSetWorldThumbnail={(dataUrl) => {
                if (!activeWorld) return;
                setWorlds((prev) =>
                  prev.map((w) =>
                    w.id === activeWorld.id ? { ...w, customCss: dataUrl } : w
                  )
                );
              }}
            />
          )}

          {/* ================================================================ */}
          {/* VIEW 7: RPG CAMPAIGNS                                            */}
          {/* ================================================================ */}
          {activeNav === 'campaigns' && (
            <div className="space-y-6">
              <RPGAndStudioModule
                workspace={workspace}
                activeWorld={safeActiveWorld}
                worlds={worlds}
                articles={articles}
                campaigns={campaigns.length > 0 ? campaigns : INITIAL_CAMPAIGNS}
                communityPosts={communityPosts}
                initialTab="campaigns"
                onSelectArticle={(id) => {
                  setSelectedArticleId(id);
                  setActiveNav('articles');
                }}
                onUpdateWorld={(updatedW) =>
                  setWorlds((prev) => prev.map((w) => (w.id === updatedW.id ? updatedW : w)))
                }
                onUpdateCampaign={(cmp) =>
                  setCampaigns((prev) =>
                    prev.some((c) => c.id === cmp.id)
                      ? prev.map((c) => (c.id === cmp.id ? cmp : c))
                      : [cmp, ...prev]
                  )
                }
                onUpdateCommunityPosts={setCommunityPosts}
                onUpdateMemberRole={(memId, role) =>
                  setWorkspace((prev) => ({
                    ...prev,
                    members: prev.members.map((m) => (m.id === memId ? { ...m, role } : m))
                  }))
                }
                onExportFullWorkspaceJson={handleExportFullWorkspaceJson}
                onImportWorkspaceJson={(raw) => {
                  try {
                    const parsed = JSON.parse(raw);
                    if (parsed.worlds) setWorlds(parsed.worlds);
                    if (parsed.articles) setArticles(parsed.articles);
                    if (parsed.relationships) setRelationships(parsed.relationships);
                  } catch {
                    // Ignore invalid JSON
                  }
                }}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 8: INTERACTIVE ONBOARDING & TUTORIALS                       */}
          {/* ================================================================ */}
          {activeNav === 'onboarding' && (
            <OnboardingAndLearningView
              completedTutorialIds={completedTutorials}
              onToggleCompleteTutorial={(id) =>
                setCompletedTutorials((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
              }
              onResetTutorials={() => setCompletedTutorials([])}
              onJumpToModule={(target) => {
                if (target === 'worlds') setActiveNav('worlds');
                else if (target === 'articles' || target === 'templates') setActiveNav('articles');
                else if (target === 'characters') setActiveNav('characters');
                else if (target === 'relationships') setActiveNav('relationships');
                else if (target === 'maps') setActiveNav('maps');
                else if (target === 'timelines' || target === 'chronicles')
                  setActiveNav('timelines');
                else if (target === 'manuscripts') setActiveNav('manuscripts');
                else setActiveNav('dashboard');
              }}
              onLoadExampleWorld={handleLoadSampleWorkspace}
            />
          )}
        </main>
      </div>
    </div>
  );
}
