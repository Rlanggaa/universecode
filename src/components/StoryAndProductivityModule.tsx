import React, { useState, useMemo } from 'react';
import {
  Feather,
  BookOpen,
  Maximize2,
  Minimize2,
  Download,
  Plus,
  CheckSquare,
  Table as TableIcon,
  Dices,
  Sparkles,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2
} from 'lucide-react';
import {
  World,
  Workspace,
  Article,
  Manuscript,
  ManuscriptScene,
  NotebookNote,
  ProjectTask,
  InteractiveTable,
  RandomGenerator,
  IPPipelineAsset
} from '../types/worldbuilding';

interface StoryAndProductivityModuleProps {
  activeWorld: World;
  workspace: Workspace;
  articles: Article[];
  manuscripts: Manuscript[];
  notes: NotebookNote[];
  tasks: ProjectTask[];
  tables: InteractiveTable[];
  generators: RandomGenerator[];
  ipAssets: IPPipelineAsset[];
  initialTab?: 'manuscripts' | 'notebook' | 'tables' | 'ip-pipeline';
  onSelectArticle: (id: string) => void;
  onUpdateManuscript: (ms: Manuscript) => void;
  onAddNote: (note: NotebookNote) => void;
  onUpdateTask: (task: ProjectTask) => void;
  onAddTask: (task: ProjectTask) => void;
  onUpdateTable: (tbl: InteractiveTable) => void;
  onUpdateGenerator: (gen: RandomGenerator) => void;
  onUpdateIPAsset: (asset: IPPipelineAsset) => void;
  onUpdateWorkspaceVariables: (vars: Record<string, string>) => void;
}

export const StoryAndProductivityModule: React.FC<StoryAndProductivityModuleProps> = ({
  activeWorld,
  workspace,
  articles,
  manuscripts,
  notes,
  tasks,
  tables,
  generators,
  ipAssets,
  initialTab = 'manuscripts',
  onSelectArticle,
  onUpdateManuscript,
  onAddNote,
  onUpdateTask,
  onAddTask,
  onUpdateTable,
  onUpdateGenerator,
  onUpdateIPAsset,
  onUpdateWorkspaceVariables
}) => {
  const [subTab, setSubTab] = useState<'manuscripts' | 'notebook' | 'tables' | 'ip-pipeline'>(
    initialTab
  );

  React.useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  const worldArticles = useMemo(
    () => articles.filter((a) => a.worldId === activeWorld.id),
    [articles, activeWorld.id]
  );

  // ============================================================================
  // MODULE 10: MANUSCRIPT & STORY STUDIO STATE
  // ============================================================================
  const currentManuscript = manuscripts[0];
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    currentManuscript?.chapters[0]?.id || 'ch-1'
  );
  const currentChapter = useMemo(
    () =>
      currentManuscript?.chapters.find((c) => c.id === selectedChapterId) ||
      currentManuscript?.chapters[0],
    [currentManuscript, selectedChapterId]
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    currentChapter?.scenes[0]?.id || 'sc-101'
  );
  const currentScene = useMemo(
    () =>
      currentChapter?.scenes.find((s) => s.id === selectedSceneId) ||
      currentChapter?.scenes[0] ||
      null,
    [currentChapter, selectedSceneId]
  );

  const [msViewMode, setMsViewMode] = useState<'write' | 'outline' | 'reading'>('write');
  const [focusMode, setFocusMode] = useState(false);
  const [msTheme, setMsTheme] = useState<'editorial' | 'parchment' | 'midnight'>(
    currentManuscript?.theme || 'editorial'
  );
  const [sceneContent, setSceneContent] = useState(currentScene?.content || '');
  const [sceneNotes, setSceneNotes] = useState(currentScene?.notes || '');
  const [sceneTitle, setSceneTitle] = useState(currentScene?.title || '');
  const [sceneStatus, setSceneStatus] = useState<ManuscriptScene['status']>(
    currentScene?.status || 'Drafting'
  );
  const [newChapterTitle, setNewChapterTitle] = useState('');

  React.useEffect(() => {
    if (currentScene) {
      setSceneContent(currentScene.content);
      setSceneNotes(currentScene.notes);
      setSceneTitle(currentScene.title);
      setSceneStatus(currentScene.status);
    }
  }, [currentScene?.id]);

  const totalManuscriptWords = useMemo(() => {
    if (!currentManuscript) return 0;
    return currentManuscript.chapters.reduce(
      (acc, ch) => acc + ch.scenes.reduce((sAcc, sc) => sAcc + sc.wordCount, 0),
      0
    );
  }, [currentManuscript]);

  const handleSaveScene = () => {
    if (!currentManuscript || !currentChapter || !currentScene) return;
    const wc = sceneContent
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const updatedChapters = currentManuscript.chapters.map((ch) => {
      if (ch.id !== currentChapter.id) return ch;
      return {
        ...ch,
        scenes: ch.scenes.map((sc) =>
          sc.id === currentScene.id
            ? {
                ...sc,
                title: sceneTitle,
                content: sceneContent,
                notes: sceneNotes,
                status: sceneStatus,
                wordCount: wc
              }
            : sc
        )
      };
    });
    onUpdateManuscript({
      ...currentManuscript,
      theme: msTheme,
      chapters: updatedChapters,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });
  };

  const handleAddSceneToChapter = () => {
    if (!currentManuscript || !currentChapter) return;
    const newSc: ManuscriptScene = {
      id: `sc-${Date.now()}`,
      title: `Scene ${currentChapter.scenes.length + 1}: New Beat`,
      synopsis: 'New narrative beat.',
      povCharacterId: worldArticles.find((a) => a.templateType === 'Character')?.id,
      locationArticleId: worldArticles.find((a) => a.category === 'Locations')?.id,
      status: 'Outline',
      content: 'Begin drafting scene prose here...',
      notes: 'Continuity check notes.',
      wordCount: 5
    };
    const updatedChapters = currentManuscript.chapters.map((ch) =>
      ch.id === currentChapter.id ? { ...ch, scenes: [...ch.scenes, newSc] } : ch
    );
    onUpdateManuscript({ ...currentManuscript, chapters: updatedChapters });
    setSelectedSceneId(newSc.id);
  };

  const handleAddChapter = () => {
    if (!currentManuscript || !newChapterTitle.trim()) return;
    const newChId = `ch-${Date.now()}`;
    const newScId = `sc-${Date.now()}-1`;
    const newCh = {
      id: newChId,
      title: newChapterTitle.trim(),
      synopsis: 'Chapter synopsis and dramatic objective.',
      scenes: [
        {
          id: newScId,
          title: 'Scene 1: Opening Beat',
          synopsis: 'Opening scene.',
          status: 'Outline' as const,
          content: 'Draft chapter opening here...',
          notes: '',
          wordCount: 4
        }
      ]
    };
    onUpdateManuscript({
      ...currentManuscript,
      chapters: [...currentManuscript.chapters, newCh]
    });
    setSelectedChapterId(newChId);
    setSelectedSceneId(newScId);
    setNewChapterTitle('');
  };

  const handleExportManuscript = (ext: 'md' | 'txt' | 'doc') => {
    if (!currentManuscript) return;
    const body = currentManuscript.chapters
      .map(
        (ch) =>
          `# ${ch.title}\n\n> ${ch.synopsis}\n\n` +
          ch.scenes.map((sc) => `## ${sc.title}\n\n${sc.content}\n`).join('\n---\n\n')
      )
      .join('\n\n');
    const fullText = `# ${currentManuscript.title}\nGenre: ${currentManuscript.genre}\nTotal Words: ${totalManuscriptWords}\n\n${body}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentManuscript.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // MODULE 11: NOTEBOOK, PROJECT VARIABLES & KANBAN TASKS STATE
  // ============================================================================
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteScope, setNewNoteScope] = useState<'Project' | 'Personal'>('Project');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectTask['priority']>('High');
  const [newTaskCategory, setNewTaskCategory] = useState<ProjectTask['category']>('Lore');
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  // Resolve {{variable}} syntax in notebook notes
  const resolveVariablesInText = (text: string) => {
    return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return workspace.variables[key] ? `${workspace.variables[key]} (${match})` : match;
    });
  };

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      worldId: activeWorld.id,
      scope: newNoteScope,
      title: newNoteTitle.trim(),
      category: 'Idea Capture',
      color: 'amber',
      tags: ['Notebook'],
      content: newNoteContent.trim() || 'Captured worldbuilding note.',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      id: `tsk-${Date.now()}`,
      worldId: activeWorld.id,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      status: 'Backlog',
      assignee: 'Elena Rostova',
      deadline: '2026-11-25'
    });
    setNewTaskTitle('');
  };

  const handleAddVariable = () => {
    if (!newVarKey.trim() || !newVarVal.trim()) return;
    onUpdateWorkspaceVariables({
      ...workspace.variables,
      [newVarKey.trim().replace(/[^a-zA-Z0-9_]/g, '_')]: newVarVal.trim()
    });
    setNewVarKey('');
    setNewVarVal('');
  };

  // ============================================================================
  // MODULE 12: INTERACTIVE TABLE & WEIGHTED RANDOM GENERATOR STATE
  // ============================================================================
  const activeTable = tables[0];
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>(activeTable?.columns[0] || '');
  const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});
  const [csvImportText, setCsvImportText] = useState('');

  const activeGenerator = generators[0];
  const [generatedBatch, setGeneratedBatch] = useState<string[]>(
    activeGenerator?.savedResults || []
  );

  const filteredTableRows = useMemo(() => {
    if (!activeTable) return [];
    const q = tableSearch.trim().toLowerCase();
    const rows = activeTable.rows.filter((r) =>
      !q ? true : Object.values(r).some((v) => v.toLowerCase().includes(q))
    );
    if (!sortColumn) return rows;
    return [...rows].sort((a, b) => (a[sortColumn] || '').localeCompare(b[sortColumn] || ''));
  }, [activeTable, tableSearch, sortColumn]);

  const handleAddTableRow = () => {
    if (!activeTable) return;
    const rowObj: Record<string, string> = {};
    activeTable.columns.forEach((col) => {
      rowObj[col] = newRowValues[col] || '—';
    });
    onUpdateTable({
      ...activeTable,
      rows: [...activeTable.rows, rowObj]
    });
    setNewRowValues({});
  };

  const handleExportTableCsv = () => {
    if (!activeTable) return;
    const header = activeTable.columns.join(',');
    const lines = activeTable.rows.map((r) =>
      activeTable.columns.map((c) => `"${(r[c] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsvRows = () => {
    if (!activeTable || !csvImportText.trim()) return;
    const lines = csvImportText.trim().split('\n');
    const importedRows: Record<string, string>[] = lines.map((line) => {
      const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      activeTable.columns.forEach((col, i) => {
        obj[col] = cells[i] || '—';
      });
      return obj;
    });
    onUpdateTable({
      ...activeTable,
      rows: [...activeTable.rows, ...importedRows]
    });
    setCsvImportText('');
  };

  // Weighted Random Selection Helper
  const pickWeighted = (items: { label: string; weight: number }[]) => {
    const total = items.reduce((acc, it) => acc + it.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
      if (r < item.weight) return item.label;
      r -= item.weight;
    }
    return items[0]?.label || '';
  };

  const handleRollGenerator = (count: number) => {
    if (!activeGenerator) return;
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      let text = activeGenerator.pattern;
      Object.entries(activeGenerator.pools).forEach(([poolKey, items]) => {
        text = text.replace(`{${poolKey}}`, pickWeighted(items));
      });
      results.push(text);
    }
    setGeneratedBatch(results);
    onUpdateGenerator({
      ...activeGenerator,
      savedResults: [...results, ...activeGenerator.savedResults].slice(0, 12)
    });
  };

  const handleSaveRollToNotebook = (rollText: string) => {
    onAddNote({
      id: `note-gen-${Date.now()}`,
      worldId: activeWorld.id,
      scope: 'Project',
      title: `Generated Prompt: ${rollText.slice(0, 42)}...`,
      category: 'Generator Seed',
      color: 'emerald',
      tags: ['Random Generator', 'Seed'],
      content: rollText,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{activeWorld.name}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              Story Studio, Productivity &amp; Creative IP Pipeline (Modules 10 – 12)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {subTab === 'manuscripts' && '10. Manuscript Writing & Scene Development Studio'}
            {subTab === 'notebook' && '11. Notebook, Global Variables & Kanban Task Board'}
            {subTab === 'tables' && '12. Interactive Data Tables & Weighted Random Generators'}
            {subTab === 'ip-pipeline' && '12B. Creative IP Pipeline: Bibles, Moodboards & Review'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          {[
            { id: 'manuscripts', label: 'Manuscripts & Scenes' },
            { id: 'notebook', label: 'Notebook & Kanban' },
            { id: 'tables', label: 'Tables & Generators' },
            { id: 'ip-pipeline', label: 'Creative IP Pipeline' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setSubTab(t.id as 'manuscripts' | 'notebook' | 'tables' | 'ip-pipeline')
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === t.id
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
      {/* TAB 1: MANUSCRIPTS & STORY DEVELOPMENT (MODULE 10)                   */}
      {/* ==================================================================== */}
      {subTab === 'manuscripts' && currentManuscript && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chapter & Scene Tree (Hidden when Focus Mode is active) */}
          {!focusMode && (
            <div className="lg:col-span-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{currentManuscript.genre}</div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {currentManuscript.title}
                </h2>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-500">Word Goal Progress</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {totalManuscriptWords.toLocaleString()} /{' '}
                      {currentManuscript.targetWords.toLocaleString()}w
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(4, Math.round((totalManuscriptWords / currentManuscript.targetWords) * 100))
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chapter & Scene Hierarchy */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                {currentManuscript.chapters.map((ch) => (
                  <div key={ch.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChapterId(ch.id);
                        if (ch.scenes[0]) setSelectedSceneId(ch.scenes[0].id);
                      }}
                      className="w-full text-left text-xs font-bold text-slate-900 dark:text-slate-100 py-1 hover:text-amber-500"
                    >
                      {ch.title}
                    </button>
                    <div className="pl-3 space-y-1 border-l border-slate-200 dark:border-slate-800">
                      {ch.scenes.map((sc) => {
                        const active = currentScene?.id === sc.id;
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => {
                              setSelectedChapterId(ch.id);
                              setSelectedSceneId(sc.id);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              active
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{sc.title}</span>
                            <span className="font-mono tabular-nums text-[10px] shrink-0">
                              {sc.wordCount}w
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSceneToChapter}
                  className="w-full py-1.5 text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-500"
                >
                  + Add Scene to Active Chapter
                </button>
              </div>

              {/* Add New Chapter */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="New Chapter Title..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddChapter}
                  className="w-full py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
                >
                  + Create Chapter
                </button>
              </div>
            </div>
          )}

          {/* Center Manuscript Editor / Outline / Reading Canvas */}
          <div
            className={`${
              focusMode ? 'lg:col-span-9' : 'lg:col-span-6'
            } border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 transition-colors ${
              msTheme === 'parchment'
                ? 'bg-[#fbf7ef] text-slate-900'
                : msTheme === 'midnight'
                ? 'bg-slate-950 text-slate-100'
                : 'bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
            }`}
          >
            {/* Manuscript Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                {(['write', 'outline', 'reading'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMsViewMode(m)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize rounded-md ${
                      msViewMode === m
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {m} Mode
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={msTheme}
                  onChange={(e) =>
                    setMsTheme(e.target.value as 'editorial' | 'parchment' | 'midnight')
                  }
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  <option value="editorial">Editorial Theme</option>
                  <option value="parchment">Warm Parchment</option>
                  <option value="midnight">Midnight Focus</option>
                </select>
                <button
                  type="button"
                  onClick={() => setFocusMode((f) => !f)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  {focusMode ? 'Exit Focus' : 'Focus Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportManuscript('md')}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  Export MD
                </button>
                <button
                  type="button"
                  onClick={() => handleExportManuscript('doc')}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  DOC
                </button>
              </div>
            </div>

            {msViewMode === 'write' && currentScene && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sceneTitle}
                    onChange={(e) => setSceneTitle(e.target.value)}
                    className="text-lg font-bold bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none flex-1"
                  />
                  <select
                    value={sceneStatus}
                    onChange={(e) => setSceneStatus(e.target.value as ManuscriptScene['status'])}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                  >
                    <option value="Outline">Outline</option>
                    <option value="Drafting">Drafting</option>
                    <option value="Revised">Revised</option>
                    <option value="Final">Final</option>
                  </select>
                </div>

                <textarea
                  rows={14}
                  value={sceneContent}
                  onChange={(e) => setSceneContent(e.target.value)}
                  className="w-full p-4 text-[15px] leading-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-amber-500"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <input
                    type="text"
                    value={sceneNotes}
                    onChange={(e) => setSceneNotes(e.target.value)}
                    placeholder="Scene author notes & continuity reminders..."
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent"
                  />
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      Scene: {sceneContent.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveScene}
                      className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                    >
                      Save Scene
                    </button>
                  </div>
                </div>
              </div>
            )}

            {msViewMode === 'outline' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold">Full Structural Outline &amp; Scene Matrix</h3>
                {currentManuscript.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="font-bold text-sm">{ch.title}</div>
                    <p className="text-xs text-slate-500">{ch.synopsis}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                      {ch.scenes.map((sc) => (
                        <div
                          key={sc.id}
                          onClick={() => {
                            setSelectedChapterId(ch.id);
                            setSelectedSceneId(sc.id);
                            setMsViewMode('write');
                          }}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-500"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{sc.title}</span>
                            <span className="font-mono tabular-nums text-amber-500">
                              {sc.status} · {sc.wordCount}w
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{sc.synopsis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {msViewMode === 'reading' && (
              <div className="space-y-6 max-w-2xl mx-auto py-4">
                <h2 className="text-2xl font-bold">{currentChapter?.title}</h2>
                {currentChapter?.scenes.map((sc) => (
                  <div key={sc.id} className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {sc.title}
                    </h3>
                    {sc.content.split('\n\n').map((p, i) => (
                      <p key={i} className="text-[15px] leading-7">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Integrated World Database Lore Reference Drawer */}
          <div className="lg:col-span-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              World Lore Reference Drawer
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click to insert an entity mention into the active scene or inspect its full dossier.
            </p>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[460px] overflow-y-auto">
              {worldArticles.map((art) => (
                <div key={art.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectArticle(art.id)}
                      className="font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-500 truncate"
                    >
                      {art.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSceneContent((prev) => `${prev} ${art.title}`)}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                    >
                      + Cite
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{art.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: NOTEBOOK, PROJECT VARIABLES & KANBAN BOARD (MODULE 11)        */}
      {/* ==================================================================== */}
      {subTab === 'notebook' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Project & Personal Notebook */}
            <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Idea Capture &amp; Project Notebook ({notes.length})
                </h2>
                <span className="text-xs text-slate-500">Supports {'{{variables}}'}</span>
              </div>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {n.scope} Notebook · {n.category}
                      </span>
                      <span className="font-mono tabular-nums">{n.updatedAt}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {resolveVariablesInText(n.content)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note Title..."
                    className="col-span-2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                  <select
                    value={newNoteScope}
                    onChange={(e) => setNewNoteScope(e.target.value as 'Project' | 'Personal')}
                    className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  >
                    <option value="Project">Project</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write idea or use {{empire_name}} variable..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  Save Note to Notebook
                </button>
              </div>

              {/* Global Project Variables Dictionary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Global Project Variables ({Object.keys(workspace.variables).length})
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(workspace.variables).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between"
                    >
                      <span className="font-mono text-amber-600 dark:text-amber-400">{`{{${k}}}`}</span>
                      <span className="truncate ml-2 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    placeholder="var_key"
                    className="w-28 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                  <input
                    type="text"
                    value={newVarVal}
                    onChange={(e) => setNewVarVal(e.target.value)}
                    placeholder="Canonical value"
                    className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariable}
                    className="px-3 py-1 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded"
                  >
                    + Set
                  </button>
                </div>
              </div>
            </div>

            {/* Kanban & List Production Task Board */}
            <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Worldbuilding &amp; Production Task Board ({tasks.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track lore completion, map pins, concept art, and manuscript edits.
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTaskViewMode('kanban')}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      taskViewMode === 'kanban'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-500'
                    }`}
                  >
                    Kanban Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskViewMode('list')}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      taskViewMode === 'list'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-500'
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>

              {/* Add Task Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add production task or worldbuilding todo..."
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as ProjectTask['category'])}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="Lore">Lore</option>
                  <option value="Map">Map</option>
                  <option value="Manuscript">Manuscript</option>
                  <option value="Art & Concept">Art &amp; Concept</option>
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as ProjectTask['priority'])}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  + Add Task
                </button>
              </div>

              {taskViewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(['Backlog', 'In Progress', 'In Review', 'Completed'] as const).map((colStatus) => {
                    const colTasks = tasks.filter((t) => t.status === colStatus);
                    return (
                      <div
                        key={colStatus}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{colStatus}</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map((tsk) => (
                            <div
                              key={tsk.id}
                              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 text-xs"
                            >
                              <div className="text-[11px] text-slate-500">
                                {tsk.category} · {tsk.priority}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                {tsk.title}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                <span>{tsk.assignee}</span>
                                <select
                                  value={tsk.status}
                                  onChange={(e) =>
                                    onUpdateTask({
                                      ...tsk,
                                      status: e.target.value as ProjectTask['status']
                                    })
                                  }
                                  className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-700 dark:text-slate-300"
                                >
                                  <option value="Backlog">Backlog</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="In Review">In Review</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {tasks.map((tsk) => (
                    <div
                      key={tsk.id}
                      className="p-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {tsk.title}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {tsk.category} · Priority: {tsk.priority} · Assignee: {tsk.assignee} · Due{' '}
                          <span className="font-mono tabular-nums">{tsk.deadline}</span>
                        </div>
                      </div>
                      <select
                        value={tsk.status}
                        onChange={(e) =>
                          onUpdateTask({
                            ...tsk,
                            status: e.target.value as ProjectTask['status']
                          })
                        }
                        className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded"
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: INTERACTIVE TABLES & WEIGHTED RANDOM GENERATOR (MODULE 12)    */}
      {/* ==================================================================== */}
      {subTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Data Table */}
          {activeTable && (
            <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeTable.name}
                  </h2>
                  <p className="text-xs text-slate-500">{activeTable.description}</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTableCsv}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter rows by any value..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  {activeTable.columns.map((c) => (
                    <option key={c} value={c}>
                      Sort by: {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {activeTable.columns.map((col) => (
                        <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredTableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {activeTable.columns.map((col) => (
                          <td
                            key={col}
                            className="py-2.5 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200"
                          >
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row & Import CSV */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold">Add Custom Row</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeTable.columns.map((col) => (
                    <input
                      key={col}
                      type="text"
                      value={newRowValues[col] || ''}
                      onChange={(e) =>
                        setNewRowValues((prev) => ({ ...prev, [col]: e.target.value }))
                      }
                      placeholder={col}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddTableRow}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                >
                  + Append Row to Table
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold">Batch Import CSV Rows</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={csvImportText}
                    onChange={(e) => setCsvImportText(e.target.value)}
                    placeholder="Paste CSV row: Vanguard-II, Sunspire Citadel, 32, 21000, 510 MW, Twin Lance"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                  <button
                    type="button"
                    onClick={handleImportCsvRows}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded"
                  >
                    Import CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Weighted Random Generator */}
          {activeGenerator && (
            <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeGenerator.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeGenerator.description}</p>
                <div className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-950 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                  Rule Pattern: {activeGenerator.pattern}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRollGenerator(1)}
                  className="flex-1 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  Generate 1 Result
                </button>
                <button
                  type="button"
                  onClick={() => handleRollGenerator(4)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
                >
                  Batch Roll (4x)
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Generated Prompts &amp; Encounters
                </div>
                {generatedBatch.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-2"
                  >
                    <p className="text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                      {res}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveRollToNotebook(res)}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      + Save Result to Project Notebook
                    </button>
                  </div>
                ))}
              </div>

              {/* Probability Pools Inspector */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold">Weighted Probability Pools</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(activeGenerator.pools).map(([poolName, items]) => (
                    <div
                      key={poolName}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px]"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {poolName} ({items.length})
                      </div>
                      {items.map((it) => (
                        <div key={it.label} className="flex justify-between text-slate-500 truncate">
                          <span className="truncate">{it.label}</span>
                          <span className="font-mono tabular-nums ml-1">{it.weight}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CREATIVE IP PRODUCTION PIPELINE (SECTION 12 DIFFERENTIATOR)   */}
      {/* ==================================================================== */}
      {subTab === 'ip-pipeline' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Studio IP Production Bibles &amp; Visual Reference Moodboards
              </h2>
              <p className="text-xs text-slate-500">
                Bridges worldbuilding lore directly with animation, game dev, webtoon, and illustration production pipelines.
              </p>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500">
              {ipAssets.filter((a) => a.approvalStatus === 'Approved').length} / {ipAssets.length}{' '}
              Assets Approved
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ipAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                    {asset.code} · {asset.bibleType}
                  </span>
                  <span>Lead: {asset.owner}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {asset.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{asset.specs}</p>
                </div>

                {/* Color Script Swatches */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500">Approved Color Script &amp; Material Swatches</div>
                  <div className="flex items-center gap-2">
                    {asset.colorPalette.map((hex) => (
                      <div key={hex} className="flex items-center gap-1.5 text-xs font-mono">
                        <span
                          className="w-5 h-5 rounded border border-slate-300 dark:border-slate-700 inline-block"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[11px] text-slate-500">{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Version Diff Note: {asset.versionCompareNote}
                  </div>
                  <div className="text-slate-500">Director Feedback: {asset.reviewerFeedback}</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Review Status:</span>
                    <select
                      value={asset.approvalStatus}
                      onChange={(e) =>
                        onUpdateIPAsset({
                          ...asset,
                          approvalStatus: e.target.value as IPPipelineAsset['approvalStatus']
                        })
                      }
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Revision Requested">Revision Requested</option>
                    </select>
                  </div>

                  {asset.linkedArticleId && (
                    <button
                      type="button"
                      onClick={() => onSelectArticle(asset.linkedArticleId!)}
                      className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Open Linked Canon Article →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
