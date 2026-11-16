import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Link2,
  Eye,
  Edit3,
  History,
  Copy,
  ArrowRightLeft,
  Download,
  Check,
  Sparkles,
  Lock,
  MessageSquare,
  Sliders,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  Layers
} from 'lucide-react';
import {
  Article,
  ArticleTemplate,
  TemplateFieldDefinition,
  TemplateFieldType,
  World
} from '../types/worldbuilding';

interface ArticleAndTemplateModuleProps {
  activeWorld: World;
  worlds: World[];
  articles: Article[];
  templates: ArticleTemplate[];
  selectedArticleId: string;
  initialSubTab?: 'wiki' | 'templates' | 'characters' | 'locations' | 'organizations';
  onSelectArticle: (id: string) => void;
  onSaveArticle: (updated: Article) => void;
  onCreateArticle: (newArt: Article) => void;
  onDeleteArticle: (id: string) => void;
  onSaveTemplate: (tpl: ArticleTemplate) => void;
  onOpenOnMap?: (articleId: string) => void;
}

const FIELD_TYPES: TemplateFieldType[] = [
  'Text',
  'Long Text',
  'Number',
  'Date',
  'Dropdown',
  'Multi-select',
  'Checkbox',
  'Image',
  'File',
  'URL',
  'Entity Reference',
  'Repeater'
];

export const ArticleAndTemplateModule: React.FC<ArticleAndTemplateModuleProps> = ({
  activeWorld,
  worlds,
  articles,
  templates,
  selectedArticleId,
  initialSubTab = 'wiki',
  onSelectArticle,
  onSaveArticle,
  onCreateArticle,
  onDeleteArticle,
  onSaveTemplate
}) => {
  const [subTab, setSubTab] = useState<'wiki' | 'templates'>(
    initialSubTab === 'templates' ? 'templates' : 'wiki'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialSubTab === 'characters'
      ? 'Characters'
      : initialSubTab === 'locations'
      ? 'Locations'
      : initialSubTab === 'organizations'
      ? 'Organizations'
      : 'All'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'reading' | 'versions'>('reading');

  // Sync category filter when sidebar changes initialSubTab
  React.useEffect(() => {
    if (initialSubTab === 'templates') {
      setSubTab('templates');
    } else {
      setSubTab('wiki');
      if (initialSubTab === 'characters') setCategoryFilter('Characters');
      else if (initialSubTab === 'locations') setCategoryFilter('Locations');
      else if (initialSubTab === 'organizations') setCategoryFilter('Organizations');
      else setCategoryFilter('All');
    }
  }, [initialSubTab]);

  const worldArticles = useMemo(
    () => articles.filter((a) => a.worldId === activeWorld.id),
    [articles, activeWorld.id]
  );

  const filteredArticles = useMemo(() => {
    return worldArticles.filter((art) => {
      const matchesCategory =
        categoryFilter === 'All' ||
        art.category.toLowerCase() === categoryFilter.toLowerCase() ||
        art.templateType.toLowerCase().includes(categoryFilter.toLowerCase().replace(/s$/, ''));
      const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [worldArticles, categoryFilter, statusFilter, searchQuery]);

  const currentArticle = useMemo(
    () =>
      worldArticles.find((a) => a.id === selectedArticleId) ||
      filteredArticles[0] ||
      worldArticles[0] ||
      null,
    [worldArticles, filteredArticles, selectedArticleId]
  );

  // Local editor state synced with currentArticle
  const [draftTitle, setDraftTitle] = useState(currentArticle?.title || '');
  const [draftSummary, setDraftSummary] = useState(currentArticle?.summary || '');
  const [draftContent, setDraftContent] = useState(currentArticle?.content || '');
  const [draftSecrets, setDraftSecrets] = useState(currentArticle?.secretNotes || '');
  const [draftSpoilers, setDraftSpoilers] = useState(currentArticle?.spoilerWarning || '');
  const [draftCategory, setDraftCategory] = useState(currentArticle?.category || 'Lore');
  const [draftTemplateType, setDraftTemplateType] = useState(currentArticle?.templateType || 'Character');
  const [draftStatus, setDraftStatus] = useState<'draft' | 'published' | 'archived'>(
    currentArticle?.status || 'published'
  );
  const [draftVisibility, setDraftVisibility] = useState<'public' | 'private' | 'secret'>(
    currentArticle?.visibility || 'public'
  );
  const [draftTags, setDraftTags] = useState((currentArticle?.tags || []).join(', '));
  const [draftTemplateValues, setDraftTemplateValues] = useState<
    Record<string, string | number | boolean | string[]>
  >(currentArticle?.templateValues || {});
  const [versionNote, setVersionNote] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [transferTargetWorldId, setTransferTargetWorldId] = useState('');

  // Auto-linking state
  const [selectedAutoLinkIds, setSelectedAutoLinkIds] = useState<string[]>([]);

  // Undo / Redo history for content
  const [undoStack, setUndoStack] = useState<string[]>([]);

  React.useEffect(() => {
    if (currentArticle) {
      setDraftTitle(currentArticle.title);
      setDraftSummary(currentArticle.summary);
      setDraftContent(currentArticle.content);
      setDraftSecrets(currentArticle.secretNotes);
      setDraftSpoilers(currentArticle.spoilerWarning);
      setDraftCategory(currentArticle.category);
      setDraftTemplateType(currentArticle.templateType);
      setDraftStatus(currentArticle.status);
      setDraftVisibility(currentArticle.visibility);
      setDraftTags(currentArticle.tags.join(', '));
      setDraftTemplateValues(currentArticle.templateValues || {});
      setSelectedAutoLinkIds(currentArticle.linkedEntityIds || []);
      setSpoilerRevealed(false);
    }
  }, [currentArticle?.id]);

  // Active template schema for current article
  const activeTemplateSchema = useMemo(
    () =>
      templates.find((t) => t.name === draftTemplateType) ||
      templates.find((t) => t.name === 'Generic Article') ||
      templates[0],
    [templates, draftTemplateType]
  );

  // Auto-Link Detection Engine: scans draftContent & templateValues for mentions of other articles in the world
  const autoLinkCandidates = useMemo(() => {
    if (!currentArticle) return [];
    const combinedText = `${draftContent} ${Object.values(draftTemplateValues).join(' ')}`.toLowerCase();
    return worldArticles
      .filter((other) => other.id !== currentArticle.id)
      .filter((other) => {
        const terms = [other.title, ...(other.aliases || [])].filter(Boolean);
        return terms.some((term) => term.length > 2 && combinedText.includes(term.toLowerCase()));
      });
  }, [worldArticles, currentArticle, draftContent, draftTemplateValues]);

  // Backlinks: other articles that link to currentArticle
  const backlinkedArticles = useMemo(() => {
    if (!currentArticle) return [];
    return worldArticles.filter(
      (other) =>
        other.id !== currentArticle.id &&
        (other.linkedEntityIds.includes(currentArticle.id) ||
          other.content.toLowerCase().includes(currentArticle.title.toLowerCase()))
    );
  }, [worldArticles, currentArticle]);

  // Table of contents from paragraphs or sections
  const tableOfContents = useMemo(() => {
    const sections = ['Overview & Canonical Lore'];
    if (activeTemplateSchema && activeTemplateSchema.fields.length > 0) {
      sections.push(`${activeTemplateSchema.name} Dossier Fields`);
    }
    if (draftSecrets) sections.push('Author & GM Secret Notes');
    sections.push('Cross-References & Backlinks');
    sections.push('Version History & Comments');
    return sections;
  }, [activeTemplateSchema, draftSecrets]);

  const handleContentChange = (val: string) => {
    setUndoStack((prev) => [...prev.slice(-15), draftContent]);
    setDraftContent(val);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setDraftContent(previous);
  };

  const handleAcceptAllAutoLinks = () => {
    const allIds = Array.from(new Set([...selectedAutoLinkIds, ...autoLinkCandidates.map((c) => c.id)]));
    setSelectedAutoLinkIds(allIds);
    setSaveFeedback(`Linked ${autoLinkCandidates.length} detected world entities.`);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const toggleAutoLinkCandidate = (id: string) => {
    setSelectedAutoLinkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveCurrentArticle = () => {
    if (!currentArticle) return;
    const words = draftContent
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const newVersion = {
      id: `ver-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      author: 'Elena Rostova',
      note: versionNote.trim() || 'Updated article & template fields',
      contentSnapshot: draftContent.slice(0, 300)
    };
    const updated: Article = {
      ...currentArticle,
      title: draftTitle.trim() || 'Untitled Article',
      summary: draftSummary.trim(),
      content: draftContent,
      secretNotes: draftSecrets,
      spoilerWarning: draftSpoilers,
      category: draftCategory,
      templateType: draftTemplateType,
      status: draftStatus,
      visibility: draftVisibility,
      tags: draftTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      templateValues: draftTemplateValues,
      linkedEntityIds: selectedAutoLinkIds,
      wordCount: words,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      versions: [newVersion, ...(currentArticle.versions || [])]
    };
    onSaveArticle(updated);
    setVersionNote('');
    setSaveFeedback('Saved & indexed in World Knowledge Graph');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleCreateNewArticle = (presetTemplate?: string, presetCategory?: string) => {
    const chosenTemplate = presetTemplate || 'Character';
    const chosenCategory =
      presetCategory ||
      (chosenTemplate === 'Character'
        ? 'Characters'
        : chosenTemplate.startsWith('Location')
        ? 'Locations'
        : chosenTemplate === 'Organization'
        ? 'Organizations'
        : 'Lore');
    const newArt: Article = {
      id: `art-${Date.now()}`,
      worldId: activeWorld.id,
      title: `New ${chosenTemplate} Entry`,
      aliases: [],
      templateType: chosenTemplate,
      category: chosenCategory,
      tags: [chosenTemplate, activeWorld.name.split(':')[0]],
      summary: `Canonical ${chosenTemplate.toLowerCase()} record in ${activeWorld.name}.`,
      content: `Write detailed encyclopedia documentation for this ${chosenTemplate.toLowerCase()}. Mention entities like Empress Seraphina Vance or Sunspire Citadel to test automatic entity linking.`,
      secretNotes: '',
      spoilerWarning: '',
      templateValues: {},
      status: 'draft',
      visibility: 'public',
      linkedEntityIds: [],
      galleryCaptions: [],
      versions: [
        {
          id: `v-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          author: 'Elena Rostova',
          note: 'Created from template',
          contentSnapshot: 'Initial creation'
        }
      ],
      comments: [],
      wordCount: 24,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onCreateArticle(newArt);
    onSelectArticle(newArt.id);
    setSubTab('wiki');
    setEditorMode('edit');
  };

  const handleDuplicateArticle = () => {
    if (!currentArticle) return;
    const copy: Article = {
      ...currentArticle,
      id: `art-copy-${Date.now()}`,
      title: `${currentArticle.title} (Copy)`,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onCreateArticle(copy);
    onSelectArticle(copy.id);
    setSaveFeedback('Article duplicated');
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  const handleTransferWorld = () => {
    if (!currentArticle || !transferTargetWorldId) return;
    const transferred: Article = {
      ...currentArticle,
      worldId: transferTargetWorldId,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onSaveArticle(transferred);
    setSaveFeedback('Transferred article to target world');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleExportSingleArticle = (format: 'md' | 'json') => {
    if (!currentArticle) return;
    let contentStr = '';
    let filename = `${currentArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (format === 'json') {
      contentStr = JSON.stringify(currentArticle, null, 2);
      filename += '.json';
    } else {
      const fieldsMd = Object.entries(currentArticle.templateValues || {})
        .map(([k, v]) => `- **${k}**: ${v}`)
        .join('\n');
      contentStr = `# ${currentArticle.title}\n\n**Template**: ${currentArticle.templateType} · **Category**: ${currentArticle.category} · **Status**: ${currentArticle.status}\n\n> ${currentArticle.summary}\n\n## Lore & Documentation\n\n${currentArticle.content}\n\n## Template Attributes\n\n${fieldsMd}\n`;
      filename += '.md';
    }
    const blob = new Blob([contentStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddComment = () => {
    if (!currentArticle || !newCommentText.trim()) return;
    const updated: Article = {
      ...currentArticle,
      comments: [
        ...(currentArticle.comments || []),
        {
          id: `cm-${Date.now()}`,
          author: 'Elena Rostova',
          role: 'Workspace Owner',
          timestamp: 'Just now',
          text: newCommentText.trim()
        }
      ]
    };
    onSaveArticle(updated);
    setNewCommentText('');
  };

  // Custom Template Builder state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl-character');
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Custom Lore');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<TemplateFieldType>('Text');
  const [newFieldPrompt, setNewFieldPrompt] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const selectedTemplateObj = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId]
  );

  const handleCreateCustomTemplate = () => {
    if (!newTplName.trim()) return;
    const created: ArticleTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: newTplName.trim(),
      category: newTplCategory.trim() || 'Custom',
      description: newTplDesc.trim() || 'User-defined custom worldbuilding template.',
      isBuiltIn: false,
      fields: [
        {
          id: `fld-${Date.now()}-1`,
          key: 'overview',
          label: 'Primary Specification',
          type: 'Long Text',
          prompt: 'Describe the core function and history of this entity.',
          required: true
        }
      ]
    };
    onSaveTemplate(created);
    setSelectedTemplateId(created.id);
    setNewTplName('');
    setNewTplDesc('');
  };

  const handleAddFieldToTemplate = () => {
    if (!selectedTemplateObj || !newFieldLabel.trim()) return;
    const cleanKey = newFieldLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
    const newField: TemplateFieldDefinition = {
      id: `fld-${Date.now()}`,
      key: cleanKey || `field_${Date.now()}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      prompt: newFieldPrompt.trim() || `Enter ${newFieldLabel.trim()}`,
      required: newFieldRequired,
      options:
        newFieldType === 'Dropdown' || newFieldType === 'Multi-select'
          ? newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined
    };
    const updatedTpl: ArticleTemplate = {
      ...selectedTemplateObj,
      fields: [...selectedTemplateObj.fields, newField]
    };
    onSaveTemplate(updatedTpl);
    setNewFieldLabel('');
    setNewFieldPrompt('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
  };

  const handleMoveField = (index: number, direction: -1 | 1) => {
    if (!selectedTemplateObj) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= selectedTemplateObj.fields.length) return;
    const copy = [...selectedTemplateObj.fields];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, removed);
    onSaveTemplate({ ...selectedTemplateObj, fields: copy });
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTemplateObj) return;
    onSaveTemplate({
      ...selectedTemplateObj,
      fields: selectedTemplateObj.fields.filter((f) => f.id !== fieldId)
    });
  };

  // Render prose with interactive clickable auto-detected entity links in Reading Mode
  const renderInteractiveLoreText = (rawText: string) => {
    const paragraphs = rawText.split('\n\n');
    return paragraphs.map((para, idx) => {
      // Highlight mentions of other articles in the world
      const linkedEntitiesInPara = worldArticles.filter(
        (other) =>
          other.id !== currentArticle?.id &&
          para.toLowerCase().includes(other.title.toLowerCase())
      );
      return (
        <div key={idx} className="mb-4 leading-relaxed text-slate-700 dark:text-slate-200">
          <p className="text-[15px] leading-7">{para}</p>
          {linkedEntitiesInPara.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Referenced in paragraph:</span>
              {linkedEntitiesInPara.map((ent, i) => (
                <React.Fragment key={ent.id}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <button
                    type="button"
                    onClick={() => onSelectArticle(ent.id)}
                    className="font-medium text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    {ent.title} ({ent.templateType})
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{activeWorld.universeName}</span>
            <span aria-hidden="true">/</span>
            <span>{activeWorld.name}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              {subTab === 'wiki' ? 'Encyclopedia & Wiki' : 'Worldbuilding Templates (26 Built-In + Custom)'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {subTab === 'wiki'
              ? '03. World Encyclopedia & Auto-Linking Wiki'
              : '04. Template System & Custom Schema Builder'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('wiki')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'wiki'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Encyclopedia Articles ({worldArticles.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('templates')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'templates'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Template Builder ({templates.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleCreateNewArticle('Character', 'Characters')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Article
          </button>
        </div>
      </div>

      {subTab === 'wiki' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filterable Directory of Articles */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, lore, tags..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Segmented Filter */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
              {['All', 'Characters', 'Locations', 'Organizations', 'Items', 'History & Lore'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Status filter:</span>
              <div className="flex items-center gap-2">
                {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`capitalize hover:underline whitespace-nowrap shrink-0 ${
                      statusFilter === st
                        ? 'font-semibold text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Article List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[620px] overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No articles match the current filter criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredArticles.map((art) => {
                  const isSelected = currentArticle?.id === art.id;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => onSelectArticle(art.id)}
                      className={`w-full text-left py-3 px-3 transition-colors rounded-lg ${
                        isSelected
                          ? 'bg-amber-500/10 text-slate-900 dark:text-slate-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate">{art.title}</span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                          {art.wordCount}w
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {art.summary}
                      </p>
                      {/* Clean unboxed metadata per Zero-Pill rule */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        <span>{art.templateType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{art.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{art.visibility}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{art.status}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Article Viewer / Rich Editor / Auto-Linker / Version Diff */}
          <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-6">
            {currentArticle ? (
              <>
                {/* Top Action & Mode Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setEditorMode('reading')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        editorMode === 'reading'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Reading Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('edit')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        editorMode === 'edit'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editor & Auto-Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('versions')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        editorMode === 'versions'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      History ({currentArticle.versions?.length || 1})
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {saveFeedback && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {saveFeedback}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleDuplicateArticle}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSingleArticle('md')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export MD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSingleArticle('json')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteArticle(currentArticle.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {editorMode === 'reading' && (
                  <div className="space-y-6">
                    {/* Article Header & Unboxed Metadata */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Template: {currentArticle.templateType}</span>
                        <span aria-hidden="true">·</span>
                        <span>Category: {currentArticle.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">Visibility: {currentArticle.visibility}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{currentArticle.wordCount} words</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Updated {currentArticle.updatedAt}</span>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                        {currentArticle.title}
                      </h2>
                      {currentArticle.aliases && currentArticle.aliases.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Known Aliases: {currentArticle.aliases.join(' · ')}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/80 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        {currentArticle.summary}
                      </p>
                    </div>

                    {/* Table of Contents */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Table of Contents
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {tableOfContents.map((sec, idx) => (
                          <span key={sec} className="font-mono tabular-nums">
                            0{idx + 1}. {sec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Spoiler Warning Gate if present */}
                    {currentArticle.spoilerWarning && (
                      <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg flex items-center justify-between gap-4">
                        <div className="text-xs text-amber-700 dark:text-amber-300">
                          <span className="font-semibold">Spoiler Notice: </span>
                          {currentArticle.spoilerWarning}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSpoilerRevealed((prev) => !prev)}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-500 whitespace-nowrap shrink-0"
                        >
                          {spoilerRevealed ? 'Hide Secret Notes' : 'Reveal Secret Notes'}
                        </button>
                      </div>
                    )}

                    {/* Main Canonical Lore with Auto-Link Mentions */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                        01. Overview &amp; Canonical Lore
                      </h3>
                      <div className="pt-2">{renderInteractiveLoreText(currentArticle.content)}</div>
                    </div>

                    {/* Template Structured Dossier Fields */}
                    {Object.keys(currentArticle.templateValues || {}).length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                          02. {currentArticle.templateType} Structured Dossier ({Object.keys(currentArticle.templateValues).length} attributes)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(currentArticle.templateValues).map(([key, value]) => {
                            const fieldDef = activeTemplateSchema?.fields.find((f) => f.key === key);
                            const label = fieldDef ? fieldDef.label : key;
                            return (
                              <div
                                key={key}
                                className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-950/50"
                              >
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {label}
                                </div>
                                <div className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-1 leading-relaxed">
                                  {String(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Secret Author / GM Notes */}
                    {currentArticle.secretNotes && (spoilerRevealed || !currentArticle.spoilerWarning) && (
                      <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Author / GM Secret Layer (Hidden from Public Readers)</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {currentArticle.secretNotes}
                        </p>
                      </div>
                    )}

                    {/* Outbound & Inbound Backlinks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Outbound Linked Entities ({currentArticle.linkedEntityIds.length})
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                          {currentArticle.linkedEntityIds.map((id, idx) => {
                            const target = worldArticles.find((a) => a.id === id);
                            if (!target) return null;
                            return (
                              <React.Fragment key={id}>
                                {idx > 0 && <span className="text-slate-400">·</span>}
                                <button
                                  type="button"
                                  onClick={() => onSelectArticle(target.id)}
                                  className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                                >
                                  {target.title}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Inbound Backlinks ({backlinkedArticles.length})
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                          {backlinkedArticles.map((back, idx) => (
                            <React.Fragment key={back.id}>
                              {idx > 0 && <span className="text-slate-400">·</span>}
                              <button
                                type="button"
                                onClick={() => onSelectArticle(back.id)}
                                className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
                              >
                                {back.title}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Editorial Comments & Review */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Editorial Review &amp; Collaborator Comments ({currentArticle.comments?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {(currentArticle.comments || []).map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                              <span>
                                <strong className="text-slate-900 dark:text-slate-100">{c.author}</strong> · {c.role}
                              </span>
                              <span className="font-mono tabular-nums">{c.timestamp}</span>
                            </div>
                            <p className="mt-1 text-slate-700 dark:text-slate-300">{c.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Add continuity note or review comment..."
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddComment}
                          className="px-3.5 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90 whitespace-nowrap shrink-0"
                        >
                          Post Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editorMode === 'edit' && (
                  <div className="space-y-5">
                    {/* Metadata Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Article Title
                        </label>
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Worldbuilding Template
                        </label>
                        <select
                          value={draftTemplateType}
                          onChange={(e) => setDraftTemplateType(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        >
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.name}>
                              {tpl.name} ({tpl.fields.length} fields)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={draftCategory}
                          onChange={(e) => setDraftCategory(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Editorial Status
                        </label>
                        <select
                          value={draftStatus}
                          onChange={(e) => setDraftStatus(e.target.value as 'draft' | 'published' | 'archived')}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived (Locked)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Privacy &amp; Visibility
                        </label>
                        <select
                          value={draftVisibility}
                          onChange={(e) => setDraftVisibility(e.target.value as 'public' | 'private' | 'secret')}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        >
                          <option value="public">Public Reader</option>
                          <option value="private">Workspace Members Only</option>
                          <option value="secret">Author / GM Secret</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={draftTags}
                          onChange={(e) => setDraftTags(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Synopsis */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Executive Summary / Excerpt
                      </label>
                      <input
                        type="text"
                        value={draftSummary}
                        onChange={(e) => setDraftSummary(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Rich Formatting Toolbar & Body Editor */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Canonical Article Prose (Supports [[Wiki Mentions]], Tables &amp; Sections)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleContentChange(`${draftContent}\n\n### New Section Heading\n`)}
                            className="px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            + Heading
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleContentChange(
                                `${draftContent}\n\n| Era / Date | Event | Impact |\n| --- | --- | --- |\n| 418 SR | Eclipse | High |\n`
                              )
                            }
                            className="px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            + Table
                          </button>
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={undoStack.length === 0}
                            className="px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                          >
                            Undo ({undoStack.length})
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={8}
                        value={draftContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* AUTO-LINKING ENGINE PANEL */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-amber-500" />
                            Auto-Linking Entity Detector ({autoLinkCandidates.length} detected in text)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Automatically detects registered Characters, Locations, Organizations, Items, and Events mentioned in your prose.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAcceptAllAutoLinks}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept All ({autoLinkCandidates.length})
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {worldArticles
                          .filter((a) => a.id !== currentArticle.id)
                          .map((entity) => {
                            const isDetected = autoLinkCandidates.some((c) => c.id === entity.id);
                            const isLinked = selectedAutoLinkIds.includes(entity.id);
                            return (
                              <button
                                key={entity.id}
                                type="button"
                                onClick={() => toggleAutoLinkCandidate(entity.id)}
                                className={`px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                                  isLinked
                                    ? 'bg-amber-600 text-white border-amber-600 font-medium'
                                    : isDetected
                                    ? 'bg-white dark:bg-slate-900 border-amber-500/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                                }`}
                              >
                                {isLinked ? '✓ ' : isDetected ? 'Suggested: ' : '+ '}
                                {entity.title}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Dynamic Template Specific Fields */}
                    {activeTemplateSchema && (
                      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {activeTemplateSchema.name} Template Fields ({activeTemplateSchema.fields.length} attributes)
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {activeTemplateSchema.description}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeTemplateSchema.fields.map((field) => {
                            const val = draftTemplateValues[field.key] ?? '';
                            return (
                              <div
                                key={field.id}
                                className={field.type === 'Long Text' ? 'md:col-span-2' : ''}
                              >
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  {field.label}{' '}
                                  {field.required && <span className="text-amber-500">*</span>}
                                  <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                                    ({field.type})
                                  </span>
                                </label>
                                {field.type === 'Long Text' ? (
                                  <textarea
                                    rows={2}
                                    value={String(val)}
                                    placeholder={field.prompt}
                                    onChange={(e) =>
                                      setDraftTemplateValues((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value
                                      }))
                                    }
                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                                  />
                                ) : field.type === 'Dropdown' && field.options ? (
                                  <select
                                    value={String(val)}
                                    onChange={(e) =>
                                      setDraftTemplateValues((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value
                                      }))
                                    }
                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                                  >
                                    <option value="">Select {field.label}...</option>
                                    {field.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type === 'Number' ? 'number' : 'text'}
                                    value={String(val)}
                                    placeholder={field.prompt}
                                    onChange={(e) =>
                                      setDraftTemplateValues((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value
                                      }))
                                    }
                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Secret Notes & Spoiler Warning */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Hidden Author / GM Secret Notes
                        </label>
                        <textarea
                          rows={2}
                          value={draftSecrets}
                          onChange={(e) => setDraftSecrets(e.target.value)}
                          placeholder="Confidential plot twists, true motives, or GM encounter notes..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Spoiler Banner Warning (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={draftSpoilers}
                          onChange={(e) => setDraftSpoilers(e.target.value)}
                          placeholder="e.g. Contains Book II ending spoilers..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Save & Version Note + World Transfer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <input
                          type="text"
                          value={versionNote}
                          onChange={(e) => setVersionNote(e.target.value)}
                          placeholder="Revision commit note (e.g. Added Act II diplomacy links)..."
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCurrentArticle}
                          className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Save Article &amp; Snapshot
                        </button>
                      </div>

                      {worlds.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={transferTargetWorldId}
                            onChange={(e) => setTransferTargetWorldId(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            <option value="">Transfer to world...</option>
                            {worlds
                              .filter((w) => w.id !== activeWorld.id)
                              .map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleTransferWorld}
                            disabled={!transferTargetWorldId}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 whitespace-nowrap shrink-0"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Move
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editorMode === 'versions' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Revision History &amp; Snapshot Comparison ({currentArticle.versions?.length || 0} snapshots)
                    </h3>
                    <div className="space-y-3">
                      {(currentArticle.versions || []).map((ver, idx) => (
                        <div
                          key={ver.id}
                          className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-950/60 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              Revision #{currentArticle.versions.length - idx}: {ver.note}
                            </span>
                            <span className="font-mono tabular-nums text-slate-500">
                              {ver.timestamp} · {ver.author}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                            {ver.contentSnapshot}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftContent(ver.contentSnapshot);
                              setEditorMode('edit');
                            }}
                            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Restore Snapshot to Editor
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No article selected in {activeWorld.name}.
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateNewArticle('Character', 'Characters')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                >
                  Create First Article
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODULE 04: WORLDBUILDING TEMPLATE SYSTEM & CUSTOM TEMPLATE BUILDER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: All 26 Built-in Templates + Custom Templates */}
          <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Available Templates ({templates.length})
              </h2>
              <span className="text-xs text-slate-500">26 Built-In + Custom</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[480px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left py-2.5 px-3 rounded-lg transition-colors ${
                    selectedTemplateId === tpl.id
                      ? 'bg-amber-500/10 text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{tpl.name}</span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {tpl.fields.length} fields
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {tpl.category} · {tpl.isBuiltIn ? 'Standard Schema' : 'Custom Schema'}
                  </div>
                </button>
              ))}
            </div>

            {/* Create New Custom Template Form */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                + Create New Custom Template
              </h3>
              <input
                type="text"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="Template Name (e.g. Mecha Frame, Deity, Guild Charter)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newTplCategory}
                onChange={(e) => setNewTplCategory(e.target.value)}
                placeholder="Category (e.g. Systems & Tech)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newTplDesc}
                onChange={(e) => setNewTplDesc(e.target.value)}
                placeholder="Short description of template purpose..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleCreateCustomTemplate}
                className="w-full py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90"
              >
                Create Custom Template
              </button>
            </div>
          </div>

          {/* Right Column: Custom Template Field Inspector & Editor */}
          <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-6">
            {selectedTemplateObj && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedTemplateObj.category} · {selectedTemplateObj.fields.length} Structured Attributes
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {selectedTemplateObj.name} Template Schema
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {selectedTemplateObj.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateNewArticle(selectedTemplateObj.name, selectedTemplateObj.category)
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create {selectedTemplateObj.name} Article
                  </button>
                </div>

                {/* Field List with Reordering & Deletion */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Configured Fields (Reorder, Inspect Prompts, or Customize)
                  </h3>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {selectedTemplateObj.fields.map((f, index) => (
                      <div
                        key={f.id}
                        className="p-3 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                            <span className="font-mono tabular-nums text-slate-400">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <span>{f.label}</span>
                            <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                              · {f.type}
                            </span>
                            {f.required && (
                              <span className="text-[11px] font-normal text-rose-500">· Required</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                            Prompt: {f.prompt}
                            {f.options && f.options.length > 0
                              ? ` | Options: ${f.options.join(', ')}`
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30"
                            title="Move field up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveField(index, 1)}
                            disabled={index === selectedTemplateObj.fields.length - 1}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30"
                            title="Move field down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(f.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Field to Selected Template */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    Add Custom Field to &ldquo;{selectedTemplateObj.name}&rdquo;
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Field Label</label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="e.g. Aether Resonance Tier"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Field Data Type (12 Types)</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as TemplateFieldType)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft} value={ft}>
                            {ft}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Writing Prompt / Hint</label>
                      <input
                        type="text"
                        value={newFieldPrompt}
                        onChange={(e) => setNewFieldPrompt(e.target.value)}
                        placeholder="Guidance shown in the article editor..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {(newFieldType === 'Dropdown' || newFieldType === 'Multi-select') && (
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Dropdown Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Tier 1, Tier 2, Tier 3, Forbidden"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span>Mark as Required Field</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFieldToTemplate}
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                    >
                      + Append Field to Schema
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
