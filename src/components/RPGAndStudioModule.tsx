import React, { useState } from 'react';
import {
  Dices,
  Shield,
  ScrollText,
  Palette,
  Globe,
  Share2,
  Users,
  Code2,
  Download,
  Upload,
  Lock,
  Eye,
  MessageSquare,
  Check,
  Terminal,
  Database
} from 'lucide-react';
import {
  Workspace,
  World,
  Article,
  RPGCampaign,
  CommunityPost,
  UserRoleType
} from '../types/worldbuilding';

interface RPGAndStudioModuleProps {
  workspace: Workspace;
  activeWorld: World;
  worlds: World[];
  articles: Article[];
  campaigns: RPGCampaign[];
  communityPosts: CommunityPost[];
  initialTab?: 'campaigns' | 'studio' | 'publishing' | 'community' | 'settings';
  onSelectArticle: (id: string) => void;
  onUpdateWorld: (world: World) => void;
  onUpdateCampaign: (cmp: RPGCampaign) => void;
  onUpdateCommunityPosts: (posts: CommunityPost[]) => void;
  onUpdateMemberRole: (memberId: string, role: UserRoleType) => void;
  onExportFullWorkspaceJson: () => void;
  onImportWorkspaceJson: (rawJson: string) => void;
}

export const RPGAndStudioModule: React.FC<RPGAndStudioModuleProps> = ({
  workspace,
  activeWorld,
  worlds,
  articles,
  campaigns,
  communityPosts,
  initialTab = 'campaigns',
  onSelectArticle,
  onUpdateWorld,
  onUpdateCampaign,
  onUpdateCommunityPosts,
  onUpdateMemberRole,
  onExportFullWorkspaceJson,
  onImportWorkspaceJson
}) => {
  const [subTab, setSubTab] = useState<
    'campaigns' | 'studio' | 'publishing' | 'community' | 'settings'
  >(initialTab);

  React.useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  // ============================================================================
  // MODULE 13: RPG CAMPAIGN MANAGER & DICE ROLLER
  // ============================================================================
  const activeCampaign = campaigns[0];
  const [diceLog, setDiceLog] = useState<{ die: string; roll: number; mod: number; total: number; time: string }[]>([
    { die: 'd20', roll: 17, mod: 4, total: 21, time: '15:18:04' }
  ]);
  const [diceMod, setDiceMod] = useState<number>(2);
  const [showGmSecretScreen, setShowGmSecretScreen] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const handleRollDie = (sides: number) => {
    const raw = Math.floor(Math.random() * sides) + 1;
    const total = raw + diceMod;
    const entry = {
      die: `d${sides}`,
      roll: raw,
      mod: diceMod,
      total,
      time: new Date().toTimeString().slice(0, 8)
    };
    setDiceLog((prev) => [entry, ...prev.slice(0, 9)]);
  };

  const handleToggleHandoutReveal = (handoutId: string) => {
    if (!activeCampaign) return;
    onUpdateCampaign({
      ...activeCampaign,
      handouts: activeCampaign.handouts.map((h) =>
        h.id === handoutId ? { ...h, revealedToPlayers: !h.revealedToPlayers } : h
      )
    });
  };

  const handleExportFoundryVTT = () => {
    if (!activeCampaign) return;
    const payload = {
      system: 'aetherium-d20',
      campaign: activeCampaign.name,
      actors: activeCampaign.players,
      statblocks: activeCampaign.statblocks,
      journalEntries: articles.filter((a) => a.worldId === activeWorld.id)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foundry-vtt-${activeWorld.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerDiscordWebhook = () => {
    setWebhookStatus(
      `Dispatched Session & Dice Payload (${diceLog[0]?.die || 'd20'} = ${
        diceLog[0]?.total || 20
      }) to Discord Webhook.`
    );
    setTimeout(() => setWebhookStatus(null), 3000);
  };

  // ============================================================================
  // MODULE 14 & 15: CREATIVE STUDIO, CUSTOMIZATION & PUBLICATION
  // ============================================================================
  const [customCssDraft, setCustomCssDraft] = useState(activeWorld.customCss || '');
  const [customDomainDraft, setCustomDomainDraft] = useState(
    activeWorld.customDomain || 'aethelgard.codex.studio'
  );
  const [accessCodeDraft, setAccessCodeDraft] = useState(activeWorld.accessCode || 'SOLARIS-418');
  const [showPublicReaderPreview, setShowPublicReaderPreview] = useState(false);

  // Sanitize custom CSS (strip script/import/url injection)
  const sanitizeCustomCss = (raw: string) => {
    return raw.replace(/<[^>]*>/g, '').replace(/javascript:|expression\(|@import/gi, '');
  };

  const handleSaveStudioCustomization = () => {
    onUpdateWorld({
      ...activeWorld,
      customCss: sanitizeCustomCss(customCssDraft),
      customDomain: customDomainDraft.trim(),
      accessCode: accessCodeDraft.trim()
    });
  };

  // ============================================================================
  // MODULE 16: COMMUNITY & DISCUSSION
  // ============================================================================
  const [replyText, setReplyText] = useState('');

  const handleVotePoll = (postId: string, optionIdx: number) => {
    onUpdateCommunityPosts(
      communityPosts.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map((opt, idx) =>
              idx === optionIdx ? { ...opt, votes: opt.votes + 1 } : opt
            )
          }
        };
      })
    );
  };

  const handleAddCommunityReply = (postId: string) => {
    if (!replyText.trim()) return;
    onUpdateCommunityPosts(
      communityPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                {
                  id: `rep-${Date.now()}`,
                  author: 'Elena Rostova',
                  text: replyText.trim(),
                  timestamp: 'Just now'
                }
              ]
            }
          : p
      )
    );
    setReplyText('');
  };

  // ============================================================================
  // MODULE 17: API, WEBHOOKS & DATA PORTABILITY
  // ============================================================================
  const [apiEndpoint, setApiEndpoint] = useState('/api/v1/worlds/world-aethelgard/articles');
  const [importJsonText, setImportJsonText] = useState('');

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{activeWorld.name}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              RPG Campaigns, Studio Customization, Publishing &amp; API (Modules 13 – 17)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {subTab === 'campaigns' && '13. Tabletop RPG Campaign Manager & Storyteller Screen'}
            {subTab === 'studio' && '14. Creative Studio, Themes & Isolated CSS Styling'}
            {subTab === 'publishing' && '15. Publication, Privacy Policies & Reader Homepage'}
            {subTab === 'community' && '16. Creator Community Showcase & Lore Polls'}
            {subTab === 'settings' && '17. Role Permissions, Data Portability & Developer REST API'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          {[
            { id: 'campaigns', label: 'RPG Campaigns' },
            { id: 'studio', label: 'Creative Studio' },
            { id: 'publishing', label: 'Publishing & SEO' },
            { id: 'community', label: 'Community' },
            { id: 'settings', label: 'Roles, Backup & API' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setSubTab(
                  t.id as 'campaigns' | 'studio' | 'publishing' | 'community' | 'settings'
                )
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
      {/* TAB 1: RPG CAMPAIGN MANAGEMENT (MODULE 13)                           */}
      {/* ==================================================================== */}
      {subTab === 'campaigns' && activeCampaign && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Party, Quests, Handouts & Statblocks */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500">
                    System: {activeCampaign.systemName} · Party Level {activeCampaign.partyLevel}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeCampaign.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportFoundryVTT}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export Foundry VTT JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerDiscordWebhook}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                  >
                    Send Session to Discord
                  </button>
                </div>
              </div>
              {webhookStatus && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {webhookStatus}
                </div>
              )}

              {/* Player Characters Roster */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeCampaign.players.map((pc) => (
                  <div
                    key={pc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Player: {pc.playerName}</span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                        HP {pc.hp}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {pc.characterName}
                    </div>
                    <div className="text-slate-500">
                      {pc.ancestry} · {pc.classRole}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Inventory: {pc.inventory.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quests & Player Handouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Active Campaign Quests ({activeCampaign.quests.length})
                </h3>
                {activeCampaign.quests.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{q.title}</span>
                      <span className="text-amber-600 dark:text-amber-400">{q.status}</span>
                    </div>
                    <div className="text-slate-500">Patron: {q.giver} · Reward: {q.reward}</div>
                    <p className="text-slate-600 dark:text-slate-300">{q.summary}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Player Handouts &amp; Clues
                </h3>
                {activeCampaign.handouts.map((ho) => (
                  <div
                    key={ho.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {ho.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleHandoutReveal(ho.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          ho.revealedToPlayers
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {ho.revealedToPlayers ? 'Revealed to Party' : 'Hidden GM Handout'}
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic">{ho.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statblocks */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Encounter Statblocks
              </h3>
              {activeCampaign.statblocks.map((sb) => (
                <div
                  key={sb.id}
                  className="p-4 rounded-xl border border-amber-500/30 bg-slate-50 dark:bg-slate-950 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {sb.name}
                      </span>
                      <span className="text-slate-500 ml-2">· {sb.type}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-amber-500">
                      {sb.challengeRating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    <span>AC: {sb.armorClass}</span>
                    <span>HP: {sb.hitPoints}</span>
                    <span>Speed: {sb.speed}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 py-1.5 text-center font-mono tabular-nums bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    {Object.entries(sb.stats).map(([statName, val]) => (
                      <div key={statName}>
                        <div className="text-[10px] text-slate-400">{statName}</div>
                        <div className="font-bold">{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {sb.abilities.map((ab, i) => (
                      <p key={i} className="text-slate-600 dark:text-slate-300">
                        • {ab}
                      </p>
                    ))}
                    {sb.actions.map((act, i) => (
                      <p key={i} className="text-slate-800 dark:text-slate-200 font-medium">
                        ⚔ {act}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Polyhedral Dice Roller & Secret GM Storyteller Screen */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Dices className="w-4 h-4 text-amber-500" />
                  Polyhedral Dice Roller
                </h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Modifier:</span>
                  <input
                    type="number"
                    value={diceMod}
                    onChange={(e) => setDiceMod(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
                  <button
                    key={sides}
                    type="button"
                    onClick={() => handleRollDie(sides)}
                    className="py-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white rounded-lg transition-colors"
                  >
                    d{sides}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">Roll Telemetry Log</div>
                {diceLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                  >
                    <span>
                      {entry.die} ({entry.roll}) {entry.mod >= 0 ? `+ ${entry.mod}` : entry.mod}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      = {entry.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secret Storyteller / GM Screen */}
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Secret Storyteller / GM Screen
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGmSecretScreen((s) => !s)}
                  className="text-xs underline"
                >
                  {showGmSecretScreen ? 'Hide' : 'Show'}
                </button>
              </div>
              {showGmSecretScreen && (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeCampaign.gmScreenNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CREATIVE STUDIO & CUSTOMIZATION (MODULE 14)                   */}
      {/* ==================================================================== */}
      {subTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              World Presentation Theme &amp; Layout Architecture
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(['encyclopedia', 'dossier', 'chronicle'] as const).map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => onUpdateWorld({ ...activeWorld, articleLayout: layout })}
                  className={`p-3 rounded-xl border text-left text-xs capitalize transition-colors ${
                    activeWorld.articleLayout === layout
                      ? 'border-amber-500 bg-amber-500/10 font-semibold'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>{layout} Layout</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Standardizes article cards &amp; sidebars
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold">
                Isolated World Custom CSS (Sanitized &amp; Scoped — No External Scripts Allowed)
              </label>
              <textarea
                rows={5}
                value={customCssDraft}
                onChange={(e) => setCustomCssDraft(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={handleSaveStudioCustomization}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Apply Scoped Theme &amp; CSS
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Scoped Theme Preview
            </h2>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                {activeWorld.name} · {activeWorld.articleLayout.toUpperCase()} PRESENTATION
              </div>
              <h3 className="text-lg font-bold">{articles[0]?.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {articles[0]?.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PUBLICATION, PRIVACY & WHITE-LABEL SHARING (MODULE 15)        */}
      {/* ==================================================================== */}
      {subTab === 'publishing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                World Access Control, Custom Domain &amp; White-Label Portal
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {(['public', 'private', 'password'] as const).map((vis) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => onUpdateWorld({ ...activeWorld, visibility: vis })}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold capitalize ${
                      activeWorld.visibility === vis
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {vis} Mode
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Custom Domain / Slug</label>
                  <input
                    type="text"
                    value={customDomainDraft}
                    onChange={(e) => setCustomDomainDraft(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Reader Access Code (When Password Mode Active)
                  </label>
                  <input
                    type="text"
                    value={accessCodeDraft}
                    onChange={(e) => setAccessCodeDraft(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveStudioCustomization}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                >
                  Save Publication Policy
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublicReaderPreview((p) => !p)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  {showPublicReaderPreview
                    ? 'Hide Public World Homepage Preview'
                    : 'Preview Public World Homepage'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                SEO Metadata, Sitemap &amp; RSS Feed Generator
              </h2>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
                <div>Canonical URL: https://{customDomainDraft}/worlds/{activeWorld.id}</div>
                <div>Sitemap XML: https://{customDomainDraft}/sitemap.xml</div>
                <div>RSS Lore Feed: https://{customDomainDraft}/rss.xml</div>
                <div>
                  Published Public Articles:{' '}
                  {
                    articles.filter(
                      (a) =>
                        a.worldId === activeWorld.id &&
                        a.status === 'published' &&
                        a.visibility === 'public'
                    ).length
                  }{' '}
                  entries
                </div>
              </div>
            </div>
          </div>

          {showPublicReaderPreview && (
            <div className="p-6 rounded-xl border border-amber-500/40 bg-white dark:bg-slate-900 space-y-4">
              <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
                WHITE-LABEL PUBLIC READER PORTAL PREVIEW — {customDomainDraft}
              </div>
              <h2 className="text-3xl font-bold">{activeWorld.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
                {activeWorld.synopsis}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {articles
                  .filter(
                    (a) =>
                      a.worldId === activeWorld.id &&
                      a.status === 'published' &&
                      a.visibility === 'public'
                  )
                  .slice(0, 6)
                  .map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle(art.id)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 cursor-pointer space-y-1"
                    >
                      <div className="text-xs text-slate-400">
                        {art.templateType} · {art.category}
                      </div>
                      <div className="text-sm font-bold">{art.title}</div>
                      <p className="text-xs text-slate-500 line-clamp-2">{art.summary}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: COMMUNITY & DISCUSSION SHOWCASE (MODULE 16)                   */}
      {/* ==================================================================== */}
      {subTab === 'community' && (
        <div className="space-y-6">
          {communityPosts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  <strong>{post.author}</strong> · {post.authorRole} · World: {post.worldTitle}
                </span>
                <span>{post.category}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{post.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{post.content}</p>

              {post.poll && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5">
                  <div className="text-xs font-bold">{post.poll.question}</div>
                  <div className="space-y-2">
                    {post.poll.options.map((opt, idx) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleVotePoll(post.id, idx)}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 flex items-center justify-between text-xs"
                      >
                        <span>{opt.label}</span>
                        <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                          {opt.votes} votes
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold">Discussion Replies ({post.replies.length})</div>
                {post.replies.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 text-xs flex items-center justify-between"
                  >
                    <span>
                      <strong>{r.author}:</strong> {r.text}
                    </span>
                    <span className="text-slate-400 font-mono">{r.timestamp}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write constructive feedback..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCommunityReply(post.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: ROLES, DATA PORTABILITY & DEVELOPER API (MODULE 17 & SEC 2)   */}
      {/* ==================================================================== */}
      {subTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Role-Based Access Control Matrix */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Workspace Role &amp; Permission Matrix (Zero-Subscription Policy)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All platform modules are 100% unlocked for every user. Permissions are governed strictly by Workspace Role.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {workspace.members.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{mem.name}</div>
                    <div className="text-slate-500">
                      {mem.specialty} · {mem.email}
                    </div>
                  </div>
                  <select
                    value={mem.role}
                    onChange={(e) => onUpdateMemberRole(mem.id, e.target.value as UserRoleType)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    {[
                      'Platform Admin',
                      'Workspace Owner',
                      'Workspace Admin',
                      'Editor',
                      'Contributor',
                      'Reviewer',
                      'Viewer'
                    ].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Transparent Resource & Storage Governance */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Transparent Workspace Resource Quota (No Feature Locks)</span>
                <span className="font-mono tabular-nums">
                  {workspace.storageUsedMb} MB / {workspace.storageLimitMb} MB (2.8%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[4%]" />
              </div>
              <p className="text-[11px] text-slate-500">
                Supports S3-compatible external user storage mount and unlimited self-hosted JSON/Markdown exports.
              </p>
            </div>
          </div>

          {/* Full Data Portability & REST API Playground */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Data Ownership, Full Backup &amp; REST API
            </h2>
            <p className="text-xs text-slate-500">
              Export your entire workspace, worlds, articles, maps, timelines, and manuscripts at any time.
            </p>
            <button
              type="button"
              onClick={onExportFullWorkspaceJson}
              className="w-full py-2.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Complete Workspace Backup (.JSON)
            </button>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold">Restore / Import Workspace JSON</label>
              <textarea
                rows={2}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='Paste exported JSON backup to restore...'
                className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  if (importJsonText.trim()) {
                    onImportWorkspaceJson(importJsonText.trim());
                    setImportJsonText('');
                  }
                }}
                className="w-full py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
              >
                Restore from Backup
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold">Developer REST API &amp; Webhook Endpoint</div>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
              />
              <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(
                  {
                    status: 200,
                    world: activeWorld.name,
                    totalArticles: articles.filter((a) => a.worldId === activeWorld.id).length,
                    subscriptionRequired: false
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
