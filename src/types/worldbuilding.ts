export type UserRoleType =
  | 'Platform Admin'
  | 'Workspace Owner'
  | 'Workspace Admin'
  | 'Editor'
  | 'Contributor'
  | 'Reviewer'
  | 'Viewer';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  specialty: string;
  permissions: {
    canEditWorld: boolean;
    canPublish: boolean;
    canViewSecrets: boolean;
    canManageMembers: boolean;
    canExportData: boolean;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'public' | 'shared';
  members: WorkspaceMember[];
  storageUsedMb: number;
  storageLimitMb: number;
  variables: Record<string, string>;
}

export interface Universe {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  cosmologyNotes: string;
}

export interface World {
  id: string;
  workspaceId: string;
  universeId: string;
  universeName: string;
  name: string;
  genre: string;
  tags: string[];
  synopsis: string;
  announcement: string;
  visibility: 'private' | 'public' | 'password';
  accessCode?: string;
  customDomain?: string;
  accentColor: string;
  customCss: string;
  articleLayout: 'encyclopedia' | 'dossier' | 'chronicle';
  updatedAt: string;
}

export type BuiltInTemplateType =
  | 'Character'
  | 'Condition'
  | 'Document'
  | 'Ethnicity / Culture'
  | 'Military Unit'
  | 'Item'
  | 'Language'
  | 'Material'
  | 'Conflict'
  | 'Myth / Legend'
  | 'Location - Building'
  | 'Location - Geographic'
  | 'Location - Settlement'
  | 'Natural Law'
  | 'Organization'
  | 'Prose'
  | 'Profession'
  | 'Plot'
  | 'Title'
  | 'Session Report'
  | 'Species'
  | 'Spell'
  | 'Technology'
  | 'Tradition / Ritual'
  | 'Vehicle'
  | 'Generic Article';

export type TemplateFieldType =
  | 'Text'
  | 'Long Text'
  | 'Number'
  | 'Date'
  | 'Dropdown'
  | 'Multi-select'
  | 'Checkbox'
  | 'Image'
  | 'File'
  | 'URL'
  | 'Entity Reference'
  | 'Repeater';

export interface TemplateFieldDefinition {
  id: string;
  key: string;
  label: string;
  type: TemplateFieldType;
  prompt: string;
  required: boolean;
  options?: string[];
  section?: string;
}

export interface ArticleTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  isBuiltIn: boolean;
  fields: TemplateFieldDefinition[];
}

export interface ArticleVersion {
  id: string;
  timestamp: string;
  author: string;
  note: string;
  contentSnapshot: string;
}

export interface ArticleComment {
  id: string;
  author: string;
  role: UserRoleType;
  timestamp: string;
  text: string;
}

export interface Article {
  id: string;
  worldId: string;
  title: string;
  aliases: string[];
  templateType: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  secretNotes: string;
  spoilerWarning: string;
  templateValues: Record<string, string | number | boolean | string[]>;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'secret';
  password?: string;
  linkedEntityIds: string[];
  galleryCaptions: string[];
  versions: ArticleVersion[];
  comments: ArticleComment[];
  wordCount: number;
  updatedAt: string;
}

export type RelationshipCategory =
  | 'Character Relationship'
  | 'Family Tree'
  | 'Diplomacy Web'
  | 'Content Tree';

export interface EntityRelationship {
  id: string;
  worldId: string;
  category: RelationshipCategory;
  sourceArticleId: string;
  targetArticleId: string;
  relationType: string; // e.g. 'Sibling', 'Marriage', 'Parent', 'Rivalry', 'Mentor / Student', 'Alliance', 'Conflict', 'Sub-branch'
  score?: number; // -100 to +100 for Diplomacy Web
  generation?: number; // 1, 2, 3 for Family Tree
  description: string;
  bidirectional: boolean;
}

export interface MapMarker {
  id: string;
  mapId: string;
  label: string;
  type: 'Location' | 'Character' | 'Event' | 'Polygon' | 'Route' | 'Custom';
  layerId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  description: string;
  linkedArticleId?: string;
  childMapId?: string; // Nested map drill-down
  isHiddenGM: boolean;
  eraTag?: string;
  pathCoords?: { x: number; y: number }[];
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  category: 'Terrain' | 'Political' | 'Trade Routes' | 'Historical' | 'Character Tracks' | 'Secret GM';
}

export interface WorldMap {
  id: string;
  worldId: string;
  parentMapId?: string;
  name: string;
  scaleLevel: 'World' | 'Region' | 'City' | 'Building';
  description: string;
  svgTheme: 'archipelago' | 'citadel' | 'undersea' | 'orbital';
  customImageUrl?: string;
  layers: MapLayer[];
  markers: MapMarker[];
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  timelineId: string;
  title: string;
  year: number;
  monthIndex: number;
  day: number;
  durationDays: number;
  era: string;
  lane: string; // For parallel timelines
  summary: string;
  linkedArticleIds: string[];
  linkedMapId?: string;
  linkedMarkerId?: string;
  significance: 'Major' | 'Milestone' | 'Conflict' | 'Cataclysm' | 'Cultural';
}

export interface CustomCalendar {
  id: string;
  worldId: string;
  name: string;
  yearZeroLabel: string;
  currentYear: number;
  months: { name: string; days: number; season: string }[];
  weekdays: string[];
  moons: { name: string; cycleDays: number; color: string }[];
  festivals: { name: string; monthIndex: number; day: number; description: string }[];
}

export interface WhiteboardNode {
  id: string;
  boardId: string;
  type: 'sticky' | 'text' | 'entity' | 'article' | 'map' | 'shape';
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  linkedEntityId?: string;
  layer: string;
}

export interface WhiteboardEdge {
  id: string;
  boardId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

export interface WhiteboardBoard {
  id: string;
  worldId: string;
  name: string;
  category: 'Plot Diagram' | 'Lore Brainstorm' | 'Magic System' | 'Tech Tree' | 'Org Chart';
  nodes: WhiteboardNode[];
  edges: WhiteboardEdge[];
  freehandPaths: string[];
}

export interface ManuscriptScene {
  id: string;
  title: string;
  synopsis: string;
  povCharacterId?: string;
  locationArticleId?: string;
  status: 'Outline' | 'Drafting' | 'Revised' | 'Final';
  content: string;
  notes: string;
  wordCount: number;
}

export interface ManuscriptChapter {
  id: string;
  title: string;
  synopsis: string;
  scenes: ManuscriptScene[];
}

export interface Manuscript {
  id: string;
  worldId: string;
  title: string;
  genre: string;
  synopsis: string;
  targetWords: number;
  theme: 'editorial' | 'parchment' | 'midnight';
  chapters: ManuscriptChapter[];
  updatedAt: string;
}

export interface NotebookNote {
  id: string;
  worldId: string;
  scope: 'Personal' | 'Project';
  title: string;
  category: string;
  color: 'slate' | 'amber' | 'emerald' | 'sky' | 'rose';
  tags: string[];
  content: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  worldId: string;
  title: string;
  category: 'Lore' | 'Art & Concept' | 'Manuscript' | 'Map' | 'Review';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Backlog' | 'In Progress' | 'In Review' | 'Completed';
  assignee: string;
  deadline: string;
  linkedArticleId?: string;
}

export interface InteractiveTable {
  id: string;
  worldId: string;
  name: string;
  description: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface RandomGeneratorPoolItem {
  label: string;
  weight: number;
}

export interface RandomGenerator {
  id: string;
  worldId: string;
  name: string;
  category: string;
  description: string;
  pattern: string; // e.g. "{Prefix} {Core} of {Suffix}"
  pools: Record<string, RandomGeneratorPoolItem[]>;
  savedResults: string[];
}

export interface RPGStatblock {
  id: string;
  name: string;
  type: string;
  challengeRating: string;
  armorClass: number;
  hitPoints: string;
  speed: string;
  stats: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
  abilities: string[];
  actions: string[];
}

export interface RPGCampaign {
  id: string;
  worldId: string;
  name: string;
  systemName: string;
  partyLevel: number;
  gmScreenNotes: string;
  discordWebhookUrl: string;
  players: { id: string; playerName: string; characterName: string; ancestry: string; classRole: string; hp: string; passivePerception: number; inventory: string[] }[];
  quests: { id: string; title: string; giver: string; status: 'Active' | 'Completed' | 'Hidden'; reward: string; summary: string }[];
  sessions: { id: string; number: number; title: string; date: string; summary: string; gmSecretOutcome: string }[];
  handouts: { id: string; title: string; content: string; revealedToPlayers: boolean }[];
  statblocks: RPGStatblock[];
}

export interface IPPipelineAsset {
  id: string;
  worldId: string;
  bibleType: 'Character Bible' | 'Environment Bible' | 'Prop Database' | 'Episode Breakdown' | 'Concept Moodboard';
  title: string;
  code: string;
  owner: string;
  approvalStatus: 'Draft' | 'Pending Review' | 'Approved' | 'Revision Requested';
  versionCompareNote: string;
  specs: string;
  linkedArticleId?: string;
  colorPalette: string[];
  reviewerFeedback: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorRole: string;
  worldTitle: string;
  title: string;
  category: 'Showcase' | 'Lore Critique' | 'Map Feedback' | 'System Design';
  content: string;
  likes: number;
  poll?: {
    question: string;
    options: { label: string; votes: number }[];
  };
  replies: { id: string; author: string; text: string; timestamp: string }[];
}

export interface TutorialModule {
  id: string;
  moduleNumber: string;
  title: string;
  category: string;
  targetNavTab: string;
  whatIsIt: string;
  whatIsItUsedFor: string;
  howDoesItWork: string;
  stepByStep: string[];
  practicalExample: string;
  commonMistakes: string[];
}

export interface RecentActivityItem {
  id: string;
  entityId: string;
  title: string;
  type: 'World' | 'Article' | 'Character' | 'Location' | 'Organization' | 'Map' | 'Timeline' | 'Manuscript' | 'Condition';
  moduleTarget: string;
  thumbnailUrl?: string;
  timestampLabel: string;
  timestampMs: number;
}

export interface DigitalAsset {
  id: string;
  worldId: string;
  title: string;
  category: 'World Cover' | 'Character Portrait' | 'Location Concept' | 'Map Image' | 'Item / Prop' | 'Reference';
  dataUrl: string;
  tags: string[];
  linkedEntityId?: string;
  sizeKb: number;
  createdAt: string;
}

