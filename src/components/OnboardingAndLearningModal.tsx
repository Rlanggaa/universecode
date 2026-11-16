import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  FastForward,
  Compass,
  BookOpen,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { TutorialModule } from '../types/worldbuilding';
import { INTERACTIVE_TUTORIAL_MODULES } from '../data/templatesAndTutorials';

interface OnboardingAndLearningViewProps {
  completedTutorialIds: string[];
  onToggleCompleteTutorial: (id: string) => void;
  onResetTutorials: () => void;
  onJumpToModule: (targetNavTab: string) => void;
  onLoadExampleWorld: () => void;
}

export const OnboardingAndLearningView: React.FC<OnboardingAndLearningViewProps> = ({
  completedTutorialIds,
  onToggleCompleteTutorial,
  onResetTutorials,
  onJumpToModule,
  onLoadExampleWorld
}) => {
  const [selectedTutorialId, setSelectedTutorialId] = useState<string>(
    INTERACTIVE_TUTORIAL_MODULES[0].id
  );
  const [helpSearch, setHelpSearch] = useState('');
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);

  const filteredTutorials = useMemo(() => {
    const q = helpSearch.trim().toLowerCase();
    if (!q) return INTERACTIVE_TUTORIAL_MODULES;
    return INTERACTIVE_TUTORIAL_MODULES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.whatIsIt.toLowerCase().includes(q) ||
        t.whatIsItUsedFor.toLowerCase().includes(q) ||
        t.practicalExample.toLowerCase().includes(q)
    );
  }, [helpSearch]);

  const currentTutorial = useMemo(
    () =>
      INTERACTIVE_TUTORIAL_MODULES.find((t) => t.id === selectedTutorialId) ||
      filteredTutorials[0] ||
      INTERACTIVE_TUTORIAL_MODULES[0],
    [selectedTutorialId, filteredTutorials]
  );

  const progressPct = Math.round(
    (completedTutorialIds.length / INTERACTIVE_TUTORIAL_MODULES.length) * 100
  );

  const firstIncompleteTutorial = useMemo(
    () => INTERACTIVE_TUTORIAL_MODULES.find((t) => !completedTutorialIds.includes(t.id)),
    [completedTutorialIds]
  );

  return (
    <div className="space-y-6">
      {/* Header & Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Onboarding &amp; Interactive Learning</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {completedTutorialIds.length} of {INTERACTIVE_TUTORIAL_MODULES.length} Modules Mastered ({progressPct}%)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            14. Welcome Wizard, Interactive Product Tour &amp; Help Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {firstIncompleteTutorial && (
            <button
              type="button"
              onClick={() => setSelectedTutorialId(firstIncompleteTutorial.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
            >
              <Play className="w-3.5 h-3.5" />
              Resume: {firstIncompleteTutorial.title}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTourStep(0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            Start Interactive Tour
          </button>
          <button
            type="button"
            onClick={onResetTutorials}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay All
          </button>
        </div>
      </div>

      {/* Interactive Guided Tour Banner if active */}
      {activeTourStep !== null && (
        <div className="p-5 rounded-xl border border-amber-500/50 bg-amber-500/10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
              INTERACTIVE PRODUCT TOUR · STEP {activeTourStep + 1} OF {INTERACTIVE_TUTORIAL_MODULES.length}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {INTERACTIVE_TUTORIAL_MODULES[activeTourStep].moduleNumber}.{' '}
              {INTERACTIVE_TUTORIAL_MODULES[activeTourStep].title}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {INTERACTIVE_TUTORIAL_MODULES[activeTourStep].whatIsIt}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onJumpToModule(INTERACTIVE_TUTORIAL_MODULES[activeTourStep].targetNavTab)
              }
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
            >
              Try Feature Live →
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveTourStep((prev) =>
                  prev !== null && prev < INTERACTIVE_TUTORIAL_MODULES.length - 1 ? prev + 1 : null
                )
              }
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg"
            >
              {activeTourStep < INTERACTIVE_TUTORIAL_MODULES.length - 1 ? 'Next Step' : 'Finish Tour'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTourStep(null)}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:underline"
            >
              Skip Tour
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Searchable Help Center & 14-Module Getting Started Checklist */}
        <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={helpSearch}
              onChange={(e) => setHelpSearch(e.target.value)}
              placeholder="Search 14 module guides & examples..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">Getting Started Checklist</span>
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[520px] overflow-y-auto pr-1">
            {filteredTutorials.map((tut) => {
              const isDone = completedTutorialIds.includes(tut.id);
              const isSelected = currentTutorial.id === tut.id;
              return (
                <div
                  key={tut.id}
                  onClick={() => setSelectedTutorialId(tut.id)}
                  className={`py-2.5 px-3 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-amber-500/15 text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompleteTutorial(tut.id);
                      }}
                      className="text-amber-500 shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate">
                        {tut.moduleNumber}. {tut.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{tut.category}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Structured 6-Part Pedagogical Guide for Selected Module */}
        <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                MODULE {currentTutorial.moduleNumber} · {currentTutorial.category.toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {currentTutorial.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleCompleteTutorial(currentTutorial.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  completedTutorialIds.includes(currentTutorial.id)
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {completedTutorialIds.includes(currentTutorial.id)
                  ? '✓ Marked Complete'
                  : 'Mark Tutorial Complete'}
              </button>
              <button
                type="button"
                onClick={() => onJumpToModule(currentTutorial.targetNavTab)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                <span>Open {currentTutorial.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. What is it? & 2. What is it used for? & 3. How does it work? */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                01. What is it?
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentTutorial.whatIsIt}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                02. What is it used for?
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentTutorial.whatIsItUsedFor}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                03. How does it work?
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentTutorial.howDoesItWork}
              </p>
            </div>
          </div>

          {/* 4. Step-by-step instructions */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              04. Step-by-Step Instructions
            </h3>
            <div className="space-y-2">
              {currentTutorial.stepByStep.map((step, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs"
                >
                  <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                    Step 0{i + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Practical Example & 6. Common Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                05. Practical Example in Aethelgard
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {currentTutorial.practicalExample}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1.5">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                06. Common Mistakes to Avoid
              </div>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                {currentTutorial.commonMistakes.map((m, idx) => (
                  <li key={idx}>• {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
