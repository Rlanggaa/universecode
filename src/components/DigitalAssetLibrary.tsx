import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Search,
  Link2,
  FolderOpen
} from 'lucide-react';
import { DigitalAsset, World, Article } from '../types/worldbuilding';

interface DigitalAssetLibraryProps {
  activeWorld: World | null;
  articles: Article[];
  assets: DigitalAsset[];
  onAddAsset: (asset: DigitalAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSelectArticle: (id: string) => void;
  onSetWorldThumbnail?: (dataUrl: string) => void;
}

export const DigitalAssetLibrary: React.FC<DigitalAssetLibraryProps> = ({
  activeWorld,
  articles,
  assets,
  onAddAsset,
  onDeleteAsset,
  onSelectArticle,
  onSetWorldThumbnail
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<DigitalAsset['category']>('Location Concept');
  const [newTags, setNewTags] = useState<string>('');
  const [newLinkedEntityId, setNewLinkedEntityId] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [fileSizeKb, setFileSizeKb] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const worldAssets = assets.filter((a) => !activeWorld || a.worldId === activeWorld.id);
  const filteredAssets = worldAssets.filter((asset) => {
    const matchesCat = categoryFilter === 'All' || asset.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      asset.title.toLowerCase().includes(q) ||
      asset.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSizeKb(Math.max(1, Math.round(file.size / 1024)));
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAsset = () => {
    if (!newTitle.trim() || !previewDataUrl) return;
    const created: DigitalAsset = {
      id: `ast-${Date.now()}`,
      worldId: activeWorld?.id || 'global',
      title: newTitle.trim(),
      category: newCategory,
      dataUrl: previewDataUrl,
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedEntityId: newLinkedEntityId || undefined,
      sizeKb: fileSizeKb || 48,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onAddAsset(created);
    setNewTitle('');
    setNewTags('');
    setPreviewDataUrl('');
    setNewLinkedEntityId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2b2e3b] pb-4">
        <div>
          <div className="text-xs text-slate-400">
            {activeWorld ? `World: ${activeWorld.name}` : 'Global Workspace'} · Digital Asset Management
          </div>
          <h1 className="text-2xl font-serif font-semibold text-slate-100 mt-1">
            Image &amp; Asset Library
          </h1>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#4a7c77] hover:bg-[#58918b] text-white rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Visual Asset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Metadata Form */}
        <div className="lg:col-span-4 bg-[#1c1e26] border border-[#2b2e3b] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">Add Image / Concept Reference</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 rounded-xl border border-dashed border-[#383c4d] bg-[#15171e] hover:border-[#5da399] transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Asset Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-1.5 p-4">
                <Plus className="w-7 h-7 text-slate-400 mx-auto" />
                <div className="text-xs font-medium text-slate-300">
                  Click to Select Image File
                </div>
                <div className="text-[11px] text-slate-500">
                  Stored locally in your workspace database
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Asset Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Padepokan Astacala Concept Art"
                className="w-full px-3 py-2 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-xl text-slate-100 focus:outline-none focus:border-[#5da399]"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Or Paste Image URL</label>
              <input
                type="text"
                value={previewDataUrl}
                onChange={(e) => setPreviewDataUrl(e.target.value)}
                placeholder="data:image/... or local asset path"
                className="w-full px-3 py-2 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-xl text-slate-100 focus:outline-none focus:border-[#5da399]"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Asset Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DigitalAsset['category'])}
                className="w-full px-3 py-2 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-xl text-slate-100"
              >
                <option value="World Cover">World Cover</option>
                <option value="Character Portrait">Character Portrait</option>
                <option value="Location Concept">Location Concept</option>
                <option value="Map Image">Map Image</option>
                <option value="Item / Prop">Item / Prop</option>
                <option value="Reference">Reference / Moodboard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Link to Entity (Optional)</label>
              <select
                value={newLinkedEntityId}
                onChange={(e) => setNewLinkedEntityId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-xl text-slate-100"
              >
                <option value="">None</option>
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title} ({art.templateType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="architecture, portrait, map..."
                className="w-full px-3 py-2 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-xl text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveAsset}
              disabled={!newTitle.trim() || !previewDataUrl}
              className="w-full py-2.5 text-xs font-semibold bg-[#4a7c77] hover:bg-[#58918b] disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              Save to Asset Library
            </button>
          </div>
        </div>

        {/* Asset Gallery Grid */}
        <div className="lg:col-span-8 bg-[#1c1e26] border border-[#2b2e3b] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#14161d] rounded-xl border border-[#2b2e3b]">
              {[
                'All',
                'World Cover',
                'Character Portrait',
                'Location Concept',
                'Map Image',
                'Item / Prop',
                'Reference'
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-[#2b2e3b] text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#14161d] border border-[#2b2e3b] rounded-full text-slate-100"
              />
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-[#2b2e3b] rounded-2xl">
              <FolderOpen className="w-10 h-10 text-slate-500 mx-auto stroke-1" />
              <div className="text-sm font-medium text-slate-300">No Content yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your uploaded world covers, character portraits, maps, and visual references will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAssets.map((ast) => {
                const linkedArt = articles.find((a) => a.id === ast.linkedEntityId);
                return (
                  <div
                    key={ast.id}
                    className="rounded-xl border border-[#2b2e3b] bg-[#14161d] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-36 bg-[#0f1117] overflow-hidden relative">
                      <img
                        src={ast.dataUrl}
                        alt={ast.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {ast.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ast.category} · <span className="font-mono tabular-nums">{ast.sizeKb} KB</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#2b2e3b] text-[11px]">
                        {linkedArt ? (
                          <button
                            type="button"
                            onClick={() => onSelectArticle(linkedArt.id)}
                            className="text-[#5da399] hover:underline truncate"
                          >
                            → {linkedArt.title}
                          </button>
                        ) : onSetWorldThumbnail && activeWorld ? (
                          <button
                            type="button"
                            onClick={() => onSetWorldThumbnail(ast.dataUrl)}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            Set as World Banner
                          </button>
                        ) : (
                          <span className="text-slate-500">{ast.createdAt}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteAsset(ast.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
