import { useMemo, useState } from "react";
import { TopBar } from "./sidebar-nav";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  type Asset, type Topic, type Scene,
  SCENES,
  forwardTextOf, introOf, DISCLAIMER,
  assetPackageFiles, topicPackageFiles, topicCover, findAsset,
  assetCategoryOptionsOf, categoryOptionsOf, categoryThemeOf,
  type PlatformStore,
} from "./data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import {
  Copy, Download, QrCode, Smartphone, Eye, FileText,
  Layers, ChevronLeft, FileArchive, CheckCircle2, Search,
  Check, X, Maximize2, ArrowRight, Clock, Package,
  HelpCircle, ChevronDown, ChevronUp, ListChecks, MessageSquare, ShieldAlert,
} from "lucide-react";

/* ==================== 1. 内容资产（总览） ==================== */
export function ContentAssetsPage({
  store, onGoAssets, onGoTopics, onViewCategory, onOpenAsset, onOpenTopic, searchNode,
}: {
  store: PlatformStore;
  onGoAssets: () => void;
  onGoTopics: () => void;
  onViewCategory: (cat: string) => void;
  onOpenAsset: (id: string) => void;
  onOpenTopic: (id: string) => void;
  searchNode?: React.ReactNode;
}) {
  const { assets, topics, categories, downloadAsset } = store;
  const recent = [...assets].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 4);
  const recommended = topics.slice(0, 3);

  // 仅展示已配置内容的品类
  const purchasedChannels = assetCategoryOptionsOf(categories, assets.map((asset) => asset.cat))
    .filter((c) => assets.some((a) => a.cat === c));

  return (
    <>
      <TopBar title="内容资产" searchNode={searchNode} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-background">
        {/* 资产概览 */}
        <section>
          <SectionTitle>资产概览</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <KpiTile label="可用素材" value={String(assets.length)} suffix="件" icon={<CheckCircle2 className="size-4" />} actionText="查看全部素材" onClick={onGoAssets} />
            <KpiTile label="专题包" value={String(topics.length)} suffix="个" icon={<Package className="size-4" />} actionText="查看专题包列表" onClick={onGoTopics} />
            <KpiTile label="覆盖品类" value={String(purchasedChannels.length)} suffix="个" icon={<Layers className="size-4" />} />
          </div>
        </section>

        {/* 品类覆盖 */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <SectionTitle>品类覆盖</SectionTitle>
            <span className="text-[12px] text-muted-foreground">覆盖 {purchasedChannels.length} 个品类</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {purchasedChannels.map((c) => {
              const catAssets = assets.filter((a) => a.cat === c);
              const packs = topics.filter((t) => t.channel === c);
              const last = catAssets.map((a) => a.updated).sort().slice(-1)[0];
              return (
                <Card key={c} className="hover:border-[#94BFFF] transition">
                  <CardContent className="p-4 sm:p-5 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-7 rounded-md bg-[var(--primary-light)] text-primary grid place-items-center">
                          <Layers className="size-4" />
                        </span>
                        <span className="text-[15px] truncate" style={{ fontWeight: 600 }}>{c}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 text-right leading-tight">更新 {last}</span>
                    </div>
                    <div className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">
                      覆盖：{categoryThemeOf(categories, c)}
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-[12.5px] text-foreground/85">
                      <span className="flex items-center gap-1.5"><FileText className="size-3.5 text-muted-foreground" />素材 <span className="tabular-nums" style={{ fontWeight: 600 }}>{catAssets.length}</span> 篇</span>
                      <span className="flex items-center gap-1.5"><Package className="size-3.5 text-muted-foreground" />专题包 <span className="tabular-nums" style={{ fontWeight: 600 }}>{packs.length}</span> 个</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Button size="sm" variant="outline" className="h-8 text-[12.5px] border-primary text-primary hover:bg-[var(--primary-light)]" onClick={() => onViewCategory(c)}>
                        查看素材
                      </Button>
                      <button onClick={onGoTopics} className="text-[12.5px] text-primary hover:underline">查看专题包 →</button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 最新可用素材 */}
        <section>
          <SectionHeader title="最新可用素材" hint="最近更新的素材，可直接预览和下载" onMore={onGoAssets} moreLabel="查看全部" />
          <Card>
            <CardContent className="p-2">
              {recent.map((a, i) => (
                <div key={a.id} className={i > 0 ? "border-t border-border" : ""}>
                  <DeliveryRow a={a} onPreview={() => onOpenAsset(a.id)} onDownload={() => downloadAsset(a)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* 常用专题包 */}
        <section>
          <SectionHeader title="常用专题包" hint="按使用场景整理的内容组合" onMore={onGoTopics} moreLabel="查看全部专题包" />
          <div className="grid grid-cols-1 min-[1180px]:grid-cols-2 min-[1600px]:grid-cols-3 gap-4">
            {recommended.map((t) => (
              <RecommendedTopicCard key={t.id} t={t} assets={assets} onPreview={() => onOpenTopic(t.id)} onDownload={() => store.downloadTopic(t)} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHeader({ title, hint, onMore, moreLabel }: { title: string; hint?: string; onMore?: () => void; moreLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <div className="text-[15px]" style={{ fontWeight: 600 }}>{title}</div>
        {hint && <div className="text-[12px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {onMore && (
        <button onClick={onMore} className="text-[12.5px] text-primary hover:underline shrink-0">
          {moreLabel ?? "查看全部"} →
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title, desc, action, children, compact = false,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-dashed border-border bg-card/60 text-center ${compact ? "px-4 py-6" : "p-8"} space-y-3`}>
      <div className="mx-auto size-9 rounded-full bg-muted text-muted-foreground grid place-items-center">
        <Search className="size-4" />
      </div>
      <div className="space-y-1">
        <div className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>{title}</div>
        {desc && <div className="text-[12px] text-muted-foreground leading-relaxed">{desc}</div>}
      </div>
      {children}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

function DeliveryRow({ a, onPreview, onDownload }: { a: Asset; onPreview: () => void; onDownload: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded hover:bg-muted/40">
      <div className="w-14 h-[72px] rounded bg-muted overflow-hidden shrink-0">
        <ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] truncate" style={{ fontWeight: 500 }}>{a.title}</span>
        </div>
        <div className="text-[11.5px] text-muted-foreground flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--input-background)] text-foreground/70">{a.cat}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="size-3" />更新时间 {a.updated}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" className="h-8 text-[12.5px]" onClick={onPreview}><Eye className="size-3.5 mr-1" />预览</Button>
        <Button size="sm" className="h-8 text-[12.5px] bg-primary" onClick={onDownload}><Download className="size-3.5 mr-1" />下载素材包</Button>
      </div>
    </div>
  );
}

function RecommendedTopicCard({ t, assets, onPreview, onDownload }: { t: Topic; assets: Asset[]; onPreview: () => void; onDownload: () => void }) {
  const cover = topicCover(assets, t);
  return (
    <Card className="h-full overflow-hidden cursor-pointer border hover:border-[#94BFFF] hover:shadow-[0_8px_24px_rgba(29,33,41,0.06)] transition" onClick={onPreview}>
      <CardContent className="p-4 flex flex-col min-[900px]:flex-row gap-4 min-h-[188px] h-full">
        <div className="w-full min-[900px]:w-[210px] h-[140px] min-[900px]:h-[150px] rounded-lg bg-muted overflow-hidden shrink-0">
          {cover && <ImageWithFallback src={cover} alt={t.name} className="size-full object-cover object-top" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="text-[14.5px] leading-snug line-clamp-2 min-h-[38px]" style={{ fontWeight: 600 }}>{t.name}</div>
          <div className="text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2 min-h-[38px]">解决：{t.tagline}</div>
          <div className="flex items-center gap-2 flex-wrap text-[11.5px] min-h-[24px]">
            <SceneBadge scene={t.scene} />
            <span className="text-muted-foreground">· 包含 {t.assetIds.length} 篇</span>
          </div>
          <div className="flex items-center gap-2 pt-1 mt-auto flex-wrap">
            <Button size="sm" variant="outline" className="h-8 text-[12.5px] border-primary text-primary hover:bg-[var(--primary-light)]" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
              <Eye className="size-3.5 mr-1" />预览专题
            </Button>
            <Button size="sm" className="h-8 text-[12.5px] bg-primary" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="size-3.5 mr-1" />下载专题包
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function assetRandomRank(id: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/* ==================== 2. 素材库 ==================== */
export function AssetsPage({
  store, initialCat, initialSelected, searchNode,
}: {
  store: PlatformStore;
  initialCat?: string | null;
  initialSelected?: string | null;
  searchNode?: React.ReactNode;
}) {
  const { assets, categories, downloadAsset } = store;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(initialCat ?? null);
  const [scene, setScene] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);
  const [picked, setPicked] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<Asset | null>(null);
  const [assetShuffleSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));

  const filtered = useMemo(() => assets
    .filter((a) =>
      (!query || a.title.includes(query) || a.question.includes(query) || a.summary.includes(query)) &&
      (!cat || a.cat === cat) &&
      (!scene || a.scene === scene)
    )
    .sort((a, b) => assetRandomRank(a.id, assetShuffleSeed) - assetRandomRank(b.id, assetShuffleSeed) || a.id.localeCompare(b.id)),
    [assets, assetShuffleSeed, cat, query, scene]);
  const selectedAsset = assets.find((a) => a.id === selected);
  const detail = selectedAsset ?? filtered[0] ?? assets[0];
  const activeSelectedId = selectedAsset?.id ?? detail?.id ?? null;
  const categoryOptions = assetCategoryOptionsOf(categories, assets.map((asset) => asset.cat))
    .filter((c) => assets.some((a) => a.cat === c));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clearFilters = () => { setQuery(""); setCat(null); setScene(null); };
  const filterActive = !!(query || cat || scene);

  // 无结果时的相邻推荐
  const fallback = filtered.length === 0 ? assets.slice(0, 3) : [];

  if (!detail) {
    return (
      <>
        <TopBar title="素材库" searchNode={searchNode} />
        <div className="p-4 sm:p-6">
          <EmptyState title="暂无素材" desc="当前机构还没有可用素材。" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="素材库" searchNode={searchNode} />
      <div className="flex-1 grid grid-cols-1 min-[1180px]:grid-cols-[minmax(0,1fr)_360px] gap-4 p-4 sm:p-6 overflow-y-auto min-[1180px]:overflow-hidden">
        <div className="min-[1180px]:overflow-y-auto min-[1180px]:pr-1 space-y-4 min-w-0">
          <div className="space-y-2">
            <FilterPicker label="品类" value={cat} options={categoryOptions} onChange={setCat} />
            <FilterPicker label="使用场景" value={scene} options={SCENES} onChange={setScene} />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[12px] text-muted-foreground">
                当前结果 <span className="text-foreground tabular-nums" style={{ fontWeight: 500 }}>{filtered.length}</span> 件
              </span>
              <div className="flex-1" />
              {filterActive && (
                <Button size="sm" variant="ghost" className="h-8 text-[12px]" onClick={clearFilters}>
                  <X className="size-3 mr-1" />清空筛选
                </Button>
              )}
            </div>
          </div>

          {/* 批量领取条 */}
          {picked.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2">
              <Check className="size-4 text-primary" />
              <span className="text-[12.5px]">已选 <span style={{ fontWeight: 600 }}>{picked.length}</span> 件</span>
              <div className="flex-1" />
              <Button size="sm" className="h-8 text-[12px] bg-primary" onClick={() => picked.map((id) => findAsset(assets, id)).forEach((a) => a && downloadAsset(a))}>
                <Download className="size-3.5 mr-1" />批量下载素材包
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-[12px]" onClick={() => setPicked([])}>取消选择</Button>
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-start gap-4">
              {filtered.map((a) => {
                const isPicked = picked.includes(a.id);
                const isSelected = activeSelectedId === a.id;
                return (
                  <Card key={a.id} onClick={() => setSelected(a.id)}
                    className={`overflow-hidden cursor-pointer transition border ${isSelected ? "border-primary shadow-[0_0_0_3px_var(--primary-light)]" : "hover:border-[#94BFFF]"}`}>
                    <div className="flex flex-col min-w-0">
                      <div className="relative w-full h-[280px] bg-muted overflow-hidden">
                        <ImageWithFallback src={a.cover} alt={a.title} className="absolute inset-0 w-full h-full object-cover object-top" />
                        <button onClick={(e) => { e.stopPropagation(); toggle(a.id); }} title="多选"
                          className={`absolute top-2 left-2 size-[18px] rounded grid place-items-center border transition ${isPicked ? "bg-primary text-primary-foreground border-primary" : "bg-white/95 border-border text-transparent hover:text-muted-foreground"}`}>
                          <Check className="size-3" strokeWidth={3} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setLightbox(a); }} title="查看长图"
                          className="absolute bottom-2 left-2 inline-flex items-center gap-1 h-[22px] px-1.5 rounded text-[10.5px] bg-black/60 text-white hover:bg-black/75 transition" style={{ fontWeight: 500 }}>
                          <Maximize2 className="size-2.5" />长图预览
                        </button>
                        {/* 底部渐变提示「可滚动查看完整长图」 */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
                      </div>
                      <CardContent className="min-w-0 flex flex-col p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center h-[20px] px-1.5 rounded text-[10.5px] bg-[var(--input-background)] text-foreground/70 border border-border" style={{ fontWeight: 500 }}>{a.cat}</span>
                            <span className="tabular-nums">{a.id}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-[14px] line-clamp-2 leading-snug" style={{ fontWeight: 600 }}>{a.title}</div>
                        <div className="mt-3 rounded-md bg-muted/35 px-2.5 py-2 space-y-1.5">
                          <div className="text-[12px] text-foreground/75 line-clamp-2 leading-relaxed">
                            <span className="text-muted-foreground">客户问题：</span>{a.question}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                            <span className="text-foreground/60">核心摘要：</span>{a.summary}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground line-clamp-1 leading-relaxed">
                            <span className="text-foreground/60">适用对象：</span>{a.audience}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <SceneBadge scene={a.scene} />
                          <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                            <Clock className="size-3" />更新于 {a.updated}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <Button size="sm" className="flex-1 h-8 text-[12.5px] bg-primary" onClick={(e) => { e.stopPropagation(); downloadAsset(a); }}>
                            <Download className="size-3.5 mr-1" />下载素材包
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2.5 text-[12.5px] border-primary text-primary hover:bg-[var(--primary-light)]" onClick={(e) => { e.stopPropagation(); setLightbox(a); }}>
                            <Eye className="size-3.5 mr-1" />预览
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="无符合条件的素材"
              desc="可尝试调整关键词、品类或使用场景，或先清空筛选查看全部素材。"
              action={<Button size="sm" variant="outline" onClick={clearFilters}>清空全部筛选</Button>}
            >
              {fallback.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {fallback.map((a) => (
                    <button key={a.id} onClick={() => { clearFilters(); setSelected(a.id); }}
                      className="text-[12px] px-2.5 py-1 rounded border border-border hover:bg-muted max-w-full">
                      {a.cat} · {a.title}
                    </button>
                  ))}
                </div>
              )}
            </EmptyState>
          )}
        </div>

        {/* 详情：四区 */}
        <Card className="min-[1180px]:overflow-y-auto min-w-0">
          <CardHeader className="pb-2">
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              素材详情 · {detail.cat}
            </div>
            <CardTitle>{detail.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* 内容预览 */}
            <div className="space-y-2">
              <ZoneLabel>内容预览</ZoneLabel>
              <div className="relative rounded-lg bg-muted overflow-hidden max-h-[320px] overflow-y-auto">
                <ImageWithFallback src={detail.cover} alt={detail.title} className="w-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[12px]" onClick={() => setLightbox(detail)}>
                  <Maximize2 className="size-3.5 mr-1" />查看大图
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[12px]" onClick={() => downloadAsset(detail)}>
                  <Download className="size-3.5 mr-1" />下载 PNG 原图
                </Button>
              </div>
            </div>

            {/* 内容说明 */}
            <div className="space-y-2">
              <ZoneLabel>内容说明</ZoneLabel>
              <InfoLine label="内容编号" value={detail.id} />
              <InfoLine label="所属品类" value={detail.cat} />
              <InfoLine label="客户问题" value={detail.question} />
              <InfoLine label="核心摘要" value={detail.summary} />
              <InfoLine label="适用场景" value={detail.scene} />
              <InfoLine label="适用对象" value={detail.audience} />
              <InfoLine label="更新时间" value={detail.updated} />
            </div>

            {/* 使用指引 */}
            <div className="space-y-2">
              <ZoneLabel>使用指引</ZoneLabel>
              <InfoLine label="适合什么时候使用" value={detail.useWhen} />
              <div className="rounded-lg border border-border p-2.5 bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">推荐转发文案</span>
                  <CopyButton text={forwardTextOf(detail)} />
                </div>
                <div className="text-[12px] leading-relaxed whitespace-pre-line">{forwardTextOf(detail)}</div>
              </div>
              <InfoLine label="理财经理讲解提示" value={detail.talkTip} />
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">风险提示</div>
                <div className="text-[11.5px] leading-relaxed bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">{detail.risk}</div>
              </div>
              <InfoLine label="免责声明" value={DISCLAIMER} />
            </div>

            <Separator />

            {/* 领取内容 */}
            <div className="space-y-2">
              <ZoneLabel>领取内容</ZoneLabel>
              <Button size="sm" className="w-full bg-primary" onClick={() => downloadAsset(detail)}>
                <FileArchive className="size-3.5 mr-1.5" />下载完整素材包
              </Button>
              <div className="rounded-lg border border-border p-2.5 bg-muted/30">
                <div className="text-[11.5px] text-muted-foreground mb-1.5">素材包文件清单 · 共 {assetPackageFiles(detail).length} 项</div>
                <ul className="space-y-1.5">
                  {assetPackageFiles(detail).map((f) => (
                    <li key={f.name} className="flex items-center gap-2 text-[11.5px] min-w-0">
                      <FileText className="size-3 text-muted-foreground shrink-0" />
                      <code className="text-foreground/85 truncate flex-shrink min-w-0" title={f.name}>{f.name}</code>
                      <span className="text-muted-foreground shrink-0">· {f.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {introOf(detail) && (
                <InfoLine label="内容介绍短文" value={introOf(detail)} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {lightbox && <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/* ==================== 3. 专题包 ==================== */
export function TopicsPage({
  store, viewState, setViewState, searchNode,
}: {
  store: PlatformStore;
  viewState: { view: "list" | "detail"; id?: string };
  setViewState: (v: { view: "list" | "detail"; id?: string }) => void;
  searchNode?: React.ReactNode;
}) {
  const { view, id } = viewState;
  if (view === "detail" && id) return <TopicDetail store={store} id={id} onBack={() => setViewState({ view: "list" })} />;
  return <TopicList store={store} onOpen={(tid) => setViewState({ view: "detail", id: tid })} searchNode={searchNode} />;
}

function TopicList({ store, onOpen, searchNode }: { store: PlatformStore; onOpen: (id: string) => void; searchNode?: React.ReactNode }) {
  const { assets, topics, categories, downloadTopic } = store;
  const [cat, setCat] = useState<string | null>(null);
  const [scene, setScene] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const filterActive = !!(cat || scene);

  const rows = topics
    .filter((t) =>
      (!cat || t.channel === cat) &&
      (!scene || t.scene === scene)
    )
    .sort((a, b) => sort === "recent" ? b.updated.localeCompare(a.updated) : a.name.localeCompare(b.name));

  // 按 sceneGroup 分组
  const groups = useMemo(() => {
    const m = new Map<string, Topic[]>();
    rows.forEach((t) => {
      const arr = m.get(t.sceneGroup) ?? [];
      arr.push(t);
      m.set(t.sceneGroup, arr);
    });
    return Array.from(m.entries());
  }, [rows]);

  return (
    <>
      <TopBar title="专题包" searchNode={searchNode} />
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
        <FilterPicker
          label="品类"
          value={cat}
          options={categoryOptionsOf(categories, topics.map((topic) => topic.channel)).filter((c) => topics.some((t) => t.channel === c))}
          onChange={setCat}
        />
        <FilterPicker label="使用场景" value={scene} options={SCENES} onChange={setScene} />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[12px] text-muted-foreground">共 {rows.length} 个专题包</span>
          <div className="flex-1" />
          <select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "name")}
            className="h-9 rounded-md border border-border bg-card px-2 text-[12.5px]">
            <option value="recent">按更新时间排序</option>
            <option value="name">按名称排序</option>
          </select>
        </div>

        {groups.length === 0 && (
          <EmptyState
            title="无符合条件的专题包"
            desc="可尝试调整品类或使用场景，或先清空筛选查看全部专题包。"
            action={filterActive ? <Button size="sm" variant="outline" onClick={() => { setCat(null); setScene(null); }}>清空全部筛选</Button> : undefined}
          />
        )}

        {groups.map((entry, idx) => {
          const groupName = entry[0];
          const ts = entry[1];
          return (
            <section key={`grp-${idx}-${groupName}`} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{groupName}</span>
                <span className="text-[11px] text-muted-foreground">· {ts.length} 个专题包</span>
              </div>
              <div className="grid grid-cols-1 min-[1180px]:grid-cols-2 min-[1600px]:grid-cols-3 gap-3">
                {ts.map((t) => (
                  <TopicCard key={`tc-${t.id}`} t={t} assets={assets} onOpen={() => onOpen(t.id)} onDownload={() => downloadTopic(t)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function TopicCard({ t, assets, onOpen, onDownload }: { t: Topic; assets: Asset[]; onOpen: () => void; onDownload: () => void }) {
  const cover = topicCover(assets, t);
  return (
    <Card className="h-full overflow-hidden cursor-pointer border hover:border-[#94BFFF] hover:shadow-[0_8px_24px_rgba(29,33,41,0.06)] transition" onClick={onOpen}>
      <CardContent className="p-4 flex flex-col min-[900px]:flex-row gap-4 min-h-[202px] min-[1600px]:h-[245px] h-full">
        <div className="w-full min-[900px]:w-[220px] h-[150px] min-[900px]:h-[164px] rounded-lg bg-muted overflow-hidden shrink-0">
          {cover && <ImageWithFallback src={cover} alt={t.name} className="size-full object-cover object-top" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="text-[14.5px] leading-snug line-clamp-2 min-h-[38px]" style={{ fontWeight: 600 }}>{t.name}</div>
          <div className="text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2 min-h-[38px]">解决：{t.tagline}</div>
          <div className="flex items-center gap-2 flex-wrap text-[11.5px] min-h-[24px]">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--input-background)] text-foreground/70">{t.channel}</span>
            <SceneBadge scene={t.scene} />
            <span className="text-muted-foreground">· 包含 {t.assetIds.length} 篇</span>
          </div>
          <div className="text-[12px] leading-relaxed text-muted-foreground line-clamp-1 min-h-[18px]">适合客户：{t.audience}</div>
          <div className="text-[12px] leading-relaxed text-muted-foreground line-clamp-1 min-h-[18px]">推荐使用方式：{t.sendMode}</div>
          <div className="flex items-center gap-2 pt-1 mt-auto flex-wrap">
            <Button size="sm" variant="outline" className="h-8 text-[12.5px] border-primary text-primary hover:bg-[var(--primary-light)]" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <Eye className="size-3.5 mr-1" />预览专题
            </Button>
            <Button size="sm" className="h-8 text-[12.5px] bg-primary" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="size-3.5 mr-1" />下载专题包
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicDetail({ store, id, onBack }: { store: PlatformStore; id: string; onBack: () => void }) {
  const { assets, topics, downloadTopic } = store;
  const topic = topics.find((t) => t.id === id);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Asset | null>(null);
  if (!topic) return null;
  const topicAssets = topic.assetIds.map((aid) => findAsset(assets, aid)).filter(Boolean) as Asset[];
  const forwardText = `${topic.name}\n${topic.tagline}\n${topicAssets.map((a) => `· ${a.title}`).join("\n")}`;

  return (
    <>
      <TopBar title={topic.name} subtitle={`${topic.channel} · ${topic.scene} · ${topic.assetIds.length} 篇 · 更新于 ${topic.updated}`}
        actions={<Button size="sm" variant="ghost" onClick={onBack}><ChevronLeft className="size-4 mr-1" />返回</Button>} />
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 sm:p-6 overflow-y-auto xl:overflow-hidden">
        <div className="xl:col-span-8 xl:overflow-y-auto space-y-4 min-w-0">
          {/* 专题说明 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle>专题说明</CardTitle></CardHeader>
            <CardContent className="pt-0 grid grid-cols-1 min-[900px]:grid-cols-2 gap-x-6 gap-y-1.5">
              <DetailRow label="所属品类" valueNode={<Badge variant="outline">{topic.channel}</Badge>} />
              <DetailRow label="适用场景" valueNode={<SceneBadge scene={topic.scene} />} />
              <DetailRow label="包含素材" value={`${topic.assetIds.length} 篇`} />
              <DetailRow label="更新时间" value={topic.updated} />
              <div className="min-[900px]:col-span-2 pt-1 space-y-1.5">
                <InfoLine label="解决的客户问题" value={topic.tagline} />
                <InfoLine label="适用对象" value={topic.audience} />
                <InfoLine label="内容目标" value={topic.goal} />
              </div>
            </CardContent>
          </Card>

          {/* 为什么这样组合 */}
          {topic.combineReason && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><ListChecks className="size-[16px] text-muted-foreground" />为什么这样组合</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <p className="text-[12.5px] leading-relaxed text-foreground/85">{topic.combineReason}</p>
              </CardContent>
            </Card>
          )}

          {/* 包含素材 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle>包含素材（按推荐使用顺序）</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              {topicAssets.map((a, i) => (
                <div key={a.id} className="flex items-start min-[900px]:items-center gap-3 p-3 rounded-lg border border-border hover:border-[#94BFFF] transition">
                  <span className="tabular-nums text-[18px] text-primary shrink-0 w-8 text-center" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="w-14 h-[72px] rounded bg-muted overflow-hidden shrink-0">
                    <ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-[13.5px] truncate" style={{ fontWeight: 600 }}>{a.title}</div>
                    <div className="text-[11.5px] text-muted-foreground line-clamp-1">
                      <span className="text-foreground/70">客户问题：</span>{a.question}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground line-clamp-1">
                      <span className="text-foreground/70">核心摘要：</span>{a.summary}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12.5px] border-primary text-primary hover:bg-[var(--primary-light)] shrink-0"
                    onClick={() => setLightbox(a)}
                  >
                    <Eye className="size-3.5 mr-1" />预览素材
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 使用指引 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><MessageSquare className="size-[16px] text-muted-foreground" />使用指引</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              <InfoLine label="推荐使用方式" value={topic.sendMode} />
              <InfoLine label="推荐发送顺序" value={topic.sendOrder} />
              <div className="rounded-lg border border-border p-2.5 bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">配套转发文案</span>
                  <CopyButton text={forwardText} />
                </div>
                <div className="text-[12px] leading-relaxed whitespace-pre-line text-foreground/85">{forwardText}</div>
              </div>
              <InfoLine label="理财经理讲解边界" value={topic.talkBoundary} />
              <div>
                <div className="text-[12px] text-muted-foreground mb-1 flex items-center gap-1"><ShieldAlert className="size-3.5" />风险提示与免责声明</div>
                <div className="text-[11.5px] leading-relaxed bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">
                  {topicAssets[0]?.risk}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1.5">{DISCLAIMER}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 xl:overflow-y-auto space-y-4 min-w-0">
          {/* 下载内容包 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle>下载内容包</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Button size="sm" className="w-full bg-primary" onClick={() => downloadTopic(topic)}><FileArchive className="size-3.5 mr-1.5" />下载完整专题包</Button>
              <div className="rounded-lg border border-border p-2.5 bg-muted/30">
                <div className="text-[11.5px] text-muted-foreground mb-1.5">专题包文件清单 · 共 {topicPackageFiles(assets, topic).length} 项</div>
                <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {topicPackageFiles(assets, topic).map((f) => (
                    <li key={f.name} className="flex items-center gap-2 text-[11.5px] min-w-0">
                      <FileText className="size-3 text-muted-foreground shrink-0" />
                      <code className="text-foreground/85 truncate flex-shrink min-w-0" title={f.name}>{f.name}</code>
                      <span className="text-muted-foreground shrink-0">· {f.note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 其他使用方式：折叠 */}
              <Separator />
              <button onClick={() => setMoreOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[12.5px] text-foreground/85 hover:text-foreground py-1">
                <span className="flex items-center gap-1.5"><QrCode className="size-3.5 text-muted-foreground" />其他使用方式（按需）</span>
                {moreOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {moreOpen && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-2.5 bg-muted/30">
                    <div className="text-[11.5px] text-muted-foreground mb-1">H5 链接</div>
                    <code className="text-[11px] break-all">{topic.url}</code>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-[11.5px]"><Eye className="size-3 mr-1" />预览 H5</Button>
                      <CopyButton text={topic.url} label="复制链接" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <QrCode className="size-20 mx-auto text-primary" />
                    <Button size="sm" variant="ghost" className="mt-1 text-[12px]"><Download className="size-3 mr-1" />下载二维码</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 移动端预览 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2"><Smartphone className="size-[16px] text-muted-foreground" />移动端预览</CardTitle>
              <span className="text-[11px] text-muted-foreground">375 × auto</span>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-[280px] rounded-[24px] border-[6px] border-foreground/10 bg-card overflow-hidden">
                <div className="bg-primary text-primary-foreground p-3">
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{topic.name}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">{topic.channel} · 回答客户关心的真实问题</div>
                </div>
                <div className="p-2.5 space-y-2.5">
                  {topicAssets.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border overflow-hidden bg-card">
                      <div className="aspect-[16/9] bg-muted overflow-hidden"><ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover" /></div>
                      <div className="p-2 text-[12px]" style={{ fontWeight: 500 }}>{a.title}</div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2.5 text-[10px] text-muted-foreground text-center bg-muted/30 leading-relaxed">本资料仅供参考，不构成投资建议。投资有风险，详见各产品风险揭示书。</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {lightbox && <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/* ==================== 全局搜索 ==================== */
type MatchKind = "标题匹配" | "客户问题匹配" | "内容关键词匹配";
function matchAsset(a: Asset, kw: string): MatchKind | null {
  if (a.title.includes(kw)) return "标题匹配";
  if (a.question.includes(kw)) return "客户问题匹配";
  if (a.summary.includes(kw) || a.cat.includes(kw) || a.scene.includes(kw)) return "内容关键词匹配";
  return null;
}
function matchTopic(t: Topic, kw: string): MatchKind | null {
  if (t.name.includes(kw)) return "标题匹配";
  if (t.tagline.includes(kw) || t.goal.includes(kw) || t.audience.includes(kw)) return "客户问题匹配";
  if (t.channel.includes(kw) || t.scene.includes(kw)) return "内容关键词匹配";
  return null;
}

export function GlobalSearch({ store, onPickAsset, onPickTopic }: {
  store: PlatformStore; onPickAsset: (id: string) => void; onPickTopic: (id: string) => void;
}) {
  const { assets, topics } = store;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const kw = q.trim();
  const questionHits = useMemo(() => kw
    ? assets.filter((a) => a.question.includes(kw)).slice(0, 4)
    : [], [kw, assets]);
  const assetHits = useMemo(() => kw ? assets.map((a) => ({ a, m: matchAsset(a, kw) })).filter((x) => x.m).slice(0, 5) : [], [kw, assets]);
  const topicHits = useMemo(() => kw ? topics.map((t) => ({ t, m: matchTopic(t, kw) })).filter((x) => x.m).slice(0, 4) : [], [kw, topics]);
  const has = questionHits.length + assetHits.length + topicHits.length > 0;

  return (
    <div className="relative w-full max-w-[520px] min-w-0">
      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); } }}
        placeholder="搜索素材标题、或专题包名称"
        className="pl-9 h-9 bg-[var(--input-background)] border-border"
      />
      {open && kw && (
        <div className="absolute top-11 left-0 right-0 bg-card border border-border rounded-lg shadow-[0_8px_24px_rgba(29,33,41,0.12)] z-20 max-h-[460px] overflow-y-auto p-2">
          {!has && <div className="text-[12.5px] text-muted-foreground text-center py-6">未找到相关内容</div>}

          {questionHits.length > 0 && (
            <>
              <div className="text-[11px] text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
                <HelpCircle className="size-3" />客户问题建议
              </div>
              {questionHits.map((a) => (
                <button key={`q-${a.id}`} onMouseDown={() => { onPickAsset(a.id); setQ(""); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-muted text-left">
                  <Search className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 text-[13px] truncate">{a.question}</span>
                  <span className="text-[10.5px] text-muted-foreground shrink-0">{a.cat}</span>
                </button>
              ))}
            </>
          )}

          {assetHits.length > 0 && (
            <>
              <div className="text-[11px] text-muted-foreground px-2 py-1.5 mt-1 flex items-center gap-1.5">
                <FileText className="size-3" />相关素材
              </div>
              {assetHits.map(({ a, m }) => (
                <button key={`a-${a.id}`} onMouseDown={() => { onPickAsset(a.id); setQ(""); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left">
                  <div className="size-9 rounded bg-muted overflow-hidden shrink-0"><ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] truncate" style={{ fontWeight: 500 }}>{a.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.cat} · {a.question}</div>
                  </div>
                  <span className="text-[10.5px] text-primary bg-[var(--primary-light)] px-1.5 py-0.5 rounded shrink-0">{m}</span>
                </button>
              ))}
            </>
          )}

          {topicHits.length > 0 && (
            <>
              <div className="text-[11px] text-muted-foreground px-2 py-1.5 mt-1 flex items-center gap-1.5">
                <Package className="size-3" />相关专题包
              </div>
              {topicHits.map(({ t, m }) => (
                <button key={`t-${t.id}`} onMouseDown={() => { onPickTopic(t.id); setQ(""); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left">
                  <div className="size-9 rounded bg-[var(--primary-light)] text-primary grid place-items-center shrink-0"><Package className="size-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] truncate" style={{ fontWeight: 500 }}>{t.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{t.channel} · {t.assetIds.length} 篇 · {t.tagline}</div>
                  </div>
                  <span className="text-[10.5px] text-primary bg-[var(--primary-light)] px-1.5 py-0.5 rounded shrink-0">{m}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ==================== 共享小组件（也供管理后台复用） ==================== */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] text-muted-foreground mb-2" style={{ fontWeight: 500 }}>{children}</div>;
}

export function ZoneLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-primary flex items-center gap-1.5" style={{ fontWeight: 600 }}><span className="size-1.5 rounded-full bg-primary" />{children}</div>;
}

export function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[12px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-[12.5px] leading-relaxed text-foreground/85">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 text-[12.5px]">
      <span className="text-muted-foreground">{label}</span>
      {valueNode ?? <span className="text-right">{value}</span>}
    </div>
  );
}

export function CopyButton({ text, label, full }: { text: string; label?: string; full?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); });
  };
  return (
    <Button size="sm" variant="outline" className={`h-7 text-[12px] ${full ? "w-full" : ""}`} onClick={copy}>
      {done ? <Check className="size-3.5 mr-1 text-emerald-600" /> : <Copy className="size-3.5 mr-1" />}
      {done ? "已复制" : (label ?? "复制")}
    </Button>
  );
}

export function Lightbox({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <button className="absolute top-4 right-4 size-9 rounded-full bg-white/15 text-white grid place-items-center hover:bg-white/25" onClick={onClose}><X className="size-5" /></button>
      <div className="max-h-full overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()}>
        <ImageWithFallback src={asset.cover} alt={asset.title} className="w-[360px] max-w-full" />
      </div>
    </div>
  );
}

export function SceneBadge({ scene }: { scene: Scene }) {
  return <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/8 text-primary">{scene}</span>;
}

export function FilterPicker({ label, value, options, onChange }: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[12px] text-muted-foreground w-[60px]">{label}：</span>
      <button onClick={() => onChange(null)}
        className={`text-[12px] px-2 py-1 rounded ${value === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>全部</button>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`text-[12px] px-2 py-1 rounded ${value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{o}</button>
      ))}
    </div>
  );
}

function KpiTile({ label, value, suffix, icon, actionText, onClick }: { label: string; value: string; suffix?: string; icon?: React.ReactNode; actionText?: string; onClick?: () => void }) {
  return (
    <Card
      className={`h-[124px] ${onClick ? "cursor-pointer hover:border-[#94BFFF] hover:shadow-[0_8px_24px_rgba(29,33,41,0.06)]" : ""} transition`}
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between text-muted-foreground text-[12.5px]">
          <span>{label}</span>
          <span className="text-primary/70">{icon}</span>
        </div>
        <div>
          <span className="tabular-nums" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
          {suffix && <span className="text-[13px] text-muted-foreground ml-1">{suffix}</span>}
        </div>
        {actionText && onClick && (
          <div className="text-[12px] text-primary flex items-center gap-1">
            {actionText} <ArrowRight className="size-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
