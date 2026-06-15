import { useState } from "react";
import { TopBar } from "./sidebar-nav";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  type Asset, type Topic, type Scene,
  CHANNELS_ALL, SCENES, catDefaults,
  topicCover, findAsset, topicCountForAsset,
  type PlatformStore,
} from "./data";
import { Lightbox, SceneBadge, FilterPicker } from "./pages";
import { contentApi } from "../../services/api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "./ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  Plus, Pencil, Trash2, Eye, Search, Check, Upload, ArrowUp, ArrowDown,
} from "lucide-react";

const TODAY = "2026-06-15";

/* ==================== 素材管理 ==================== */
export function AssetManagePage({ store }: { store: PlatformStore }) {
  const { assets, topics, addAsset, updateAsset, deleteAsset } = store;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [creating, setCreating] = useState(false);
  const [lightbox, setLightbox] = useState<Asset | null>(null);
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  const rows = assets.filter((a) =>
    (!q || a.title.includes(q) || a.id.includes(q)) &&
    (!cat || a.cat === cat)
  );

  return (
    <>
      <TopBar
        title="素材管理"
        subtitle={`共 ${assets.length} 件素材`}
        searchNode={<div />}
        actions={<Button size="sm" className="bg-primary" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />上传素材</Button>}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[300px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索素材标题或编号" className="pl-9 h-9 bg-card border-border" />
          </div>
          <FilterPicker label="品类" value={cat} options={CHANNELS_ALL} onChange={setCat} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">素材标题</TableHead>
                  <TableHead>素材编号</TableHead>
                  <TableHead>品类</TableHead>
                  <TableHead>使用场景</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-center">所属专题包</TableHead>
                  <TableHead className="text-center">下载次数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const refCount = topicCountForAsset(topics, a.id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-12 rounded bg-muted overflow-hidden shrink-0">
                            <ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" />
                          </div>
                          <span className="line-clamp-2 text-[13px]" style={{ fontWeight: 500 }}>{a.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-[12.5px] text-muted-foreground">{a.id}</TableCell>
                      <TableCell><span className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--input-background)] text-foreground/70">{a.cat}</span></TableCell>
                      <TableCell><SceneBadge scene={a.scene} /></TableCell>
                      <TableCell className="tabular-nums text-[12.5px] text-muted-foreground">{a.updated}</TableCell>
                      <TableCell className="text-center">
                        {refCount > 0
                          ? <span className="inline-flex items-center justify-center min-w-[34px] h-[22px] px-1.5 rounded text-[12px] bg-[var(--primary-light)] text-primary tabular-nums" style={{ fontWeight: 600 }}>{refCount}</span>
                          : <span className="text-[12px] text-muted-foreground tabular-nums">0</span>}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{a.downloads}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="预览" onClick={() => setLightbox(a)}><Eye className="size-4" /></IconBtn>
                          <IconBtn title="编辑" onClick={() => setEditing(a)}><Pencil className="size-4" /></IconBtn>
                          <IconBtn title="删除" danger onClick={() => setToDelete(a)}><Trash2 className="size-4" /></IconBtn>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-[13px] text-muted-foreground">无符合条件的素材</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <AssetEditor
          asset={editing}
          existingIds={assets.map((a) => a.id)}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(a, isNew) => {
            if (isNew) addAsset(a); else updateAsset(a.id, a);
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {lightbox && <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />}
      {toDelete && (
        <ConfirmDialog
          title="删除素材"
          desc={topicCountForAsset(topics, toDelete.id) > 0
            ? `该素材已被 ${topicCountForAsset(topics, toDelete.id)} 个专题包引用，删除后相关专题包将同步移除该素材。是否继续？`
            : `确定删除「${toDelete.title}」？删除后客户经理端将不再展示。是否继续？`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { deleteAsset(toDelete.id); setToDelete(null); }}
        />
      )}
    </>
  );
}

const nextAssetId = (cat: string, existing: string[]) => {
  const prefixByCat: Record<string, string> = { 基金: "FUND", 理财: "WM", 保险: "INS", 信贷: "CREDIT", 养老: "PENSION", 黄金: "GOLD", 代发: "PAYROLL" };
  const prefix = prefixByCat[cat] ?? "AST";
  let n = 1;
  while (existing.includes(`${prefix}-${String(n).padStart(3, "0")}`)) n++;
  return `${prefix}-${String(n).padStart(3, "0")}`;
};

function AssetEditor({ asset, existingIds, onClose, onSave }: {
  asset: Asset | null;
  existingIds: string[];
  onClose: () => void;
  onSave: (a: Asset, isNew: boolean) => void;
}) {
  const isNew = !asset;
  const [f, setF] = useState<Asset>(asset ?? {
    id: "", title: "", cat: "基金", question: "", summary: "",
    risk: "", cover: "", scene: "客户咨询", updated: TODAY,
    ...catDefaults("基金"), downloads: 0,
  });
  const set = <K extends keyof Asset>(k: K, v: Asset[K]) => setF((p) => ({ ...p, [k]: v }));

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      set("cover", previewUrl);
      void contentApi.uploadCover(file).then(({ publicUrl }) => set("cover", publicUrl));
    }
  };

  const canSave = !!(f.title.trim() && f.cat);
  const submit = () => {
    if (isNew) {
      const id = nextAssetId(f.cat, existingIds);
      // 非必填项按品类自动补默认值，管理员无需手填
      onSave({ ...f, id, updated: TODAY, ...catDefaults(f.cat), audience: f.audience || catDefaults(f.cat).audience, talkTip: f.talkTip || catDefaults(f.cat).talkTip }, true);
    } else {
      onSave({ ...f, updated: TODAY }, false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[720px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "上传素材" : "编辑素材信息"}</DialogTitle>
          <DialogDescription>
            {isNew ? "上传后客户经理端可直接使用。" : `素材编号 ${f.id}（不可修改）`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-1">
          <div className="col-span-2 flex items-start gap-3">
            <div className="w-[88px] h-[116px] rounded bg-muted overflow-hidden shrink-0 border border-border">
              {f.cover ? <ImageWithFallback src={f.cover} alt="封面" className="size-full object-cover object-top" /> : <div className="size-full grid place-items-center text-[11px] text-muted-foreground">无封面</div>}
            </div>
            <div className="flex-1">
              <Label className="text-[12px] text-muted-foreground">{isNew ? "长图文件" : "更换长图"}</Label>
              <label className="mt-1.5 flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-border cursor-pointer text-[12.5px] text-muted-foreground hover:border-primary hover:text-primary transition">
                <Upload className="size-4" />{f.cover ? "重新选择图片" : "选择长图文件"}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickFile} />
              </label>
              <div className="text-[11px] text-muted-foreground mt-1.5">支持 PNG/JPG，建议上传完整长图。</div>
            </div>
          </div>

          <FieldText label="素材标题" value={f.title} onChange={(v) => set("title", v)} className="col-span-2" />
          <FieldSelect label="品类" value={f.cat} options={CHANNELS_ALL} onChange={(v) => set("cat", v)} />
          <FieldSelect label="使用场景" value={f.scene} options={SCENES} onChange={(v) => set("scene", v as Scene)} />
          <FieldText label="客户问题" value={f.question} onChange={(v) => set("question", v)} className="col-span-2" />
          <FieldArea label="核心摘要" value={f.summary} onChange={(v) => set("summary", v)} className="col-span-2" />
          <FieldText label="适用对象" value={f.audience} onChange={(v) => set("audience", v)} className="col-span-2" />
          <FieldArea label="讲解提示" value={f.talkTip} onChange={(v) => set("talkTip", v)} className="col-span-2" />
          <FieldArea label="风险提示" value={f.risk} onChange={(v) => set("risk", v)} className="col-span-2" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="bg-primary" disabled={!canSave} onClick={submit}>{isNew ? "保存素材" : "保存修改"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== 专题包管理 ==================== */
export function TopicManagePage({ store }: { store: PlatformStore }) {
  const { assets, topics, addTopic, updateTopic, deleteTopic } = store;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Topic | null>(null);
  const [toDelete, setToDelete] = useState<Topic | null>(null);

  const rows = topics.filter((t) =>
    (!q || t.name.includes(q)) &&
    (!cat || t.channel === cat)
  );

  return (
    <>
      <TopBar
        title="专题包管理"
        subtitle={`共 ${topics.length} 个专题包`}
        searchNode={<div />}
        actions={<Button size="sm" className="bg-primary" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />新建专题包</Button>}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[300px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索专题包名称" className="pl-9 h-9 bg-card border-border" />
          </div>
          <FilterPicker label="品类" value={cat} options={CHANNELS_ALL} onChange={setCat} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[280px]">专题包名称</TableHead>
                  <TableHead>品类</TableHead>
                  <TableHead>使用场景</TableHead>
                  <TableHead className="text-center">包含素材数</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-center">下载次数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-9 rounded bg-muted overflow-hidden shrink-0">
                          {topicCover(assets, t) && <ImageWithFallback src={topicCover(assets, t)!} alt={t.name} className="size-full object-cover object-top" />}
                        </div>
                        <div className="min-w-0">
                          <div className="line-clamp-1 text-[13px]" style={{ fontWeight: 500 }}>{t.name}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{t.tagline}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--input-background)] text-foreground/70">{t.channel}</span></TableCell>
                    <TableCell><SceneBadge scene={t.scene} /></TableCell>
                    <TableCell className="text-center tabular-nums">{t.assetIds.length}</TableCell>
                    <TableCell className="tabular-nums text-[12.5px] text-muted-foreground">{t.updated}</TableCell>
                    <TableCell className="text-center tabular-nums">{t.downloads}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="预览" onClick={() => setPreview(t)}><Eye className="size-4" /></IconBtn>
                        <IconBtn title="编辑" onClick={() => setEditing(t)}><Pencil className="size-4" /></IconBtn>
                        <IconBtn title="删除" danger onClick={() => setToDelete(t)}><Trash2 className="size-4" /></IconBtn>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-[13px] text-muted-foreground">无符合条件的专题包</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <TopicEditor
          topic={editing}
          assets={assets}
          existingIds={topics.map((t) => t.id)}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(t, isNew) => {
            if (isNew) addTopic(t); else updateTopic(t.id, t);
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {preview && <TopicPreviewDialog topic={preview} assets={assets} onClose={() => setPreview(null)} />}
      {toDelete && (
        <ConfirmDialog
          title="删除专题包"
          desc="删除后客户经理端将无法查看和下载该专题包，但不会删除其中素材。是否继续？"
          onCancel={() => setToDelete(null)}
          onConfirm={() => { deleteTopic(toDelete.id); setToDelete(null); }}
        />
      )}
    </>
  );
}

const nextTopicId = (existing: string[]) => {
  let n = 1;
  while (existing.includes(`T${String(n).padStart(3, "0")}`)) n++;
  return `T${String(n).padStart(3, "0")}`;
};

function TopicEditor({ topic, assets, existingIds, onClose, onSave }: {
  topic: Topic | null;
  assets: Asset[];
  existingIds: string[];
  onClose: () => void;
  onSave: (t: Topic, isNew: boolean) => void;
}) {
  const isNew = !topic;
  const [f, setF] = useState<Topic>(topic ?? {
    id: "", name: "", channel: "基金", assetIds: [], scene: "客户咨询",
    audience: "", goal: "", tagline: "", updated: TODAY, url: "",
    combineReason: "", sendMode: "一次发送", sendOrder: "", talkBoundary: "",
    sceneGroup: "", downloads: 0,
  });
  const set = <K extends keyof Topic>(k: K, v: Topic[K]) => setF((p) => ({ ...p, [k]: v }));

  const [assetQuery, setAssetQuery] = useState("");
  const candidates = assets.filter((a) =>
    !assetQuery || a.title.includes(assetQuery) || a.id.includes(assetQuery) || a.cat.includes(assetQuery)
  );

  const toggleAsset = (id: string) =>
    setF((p) => ({ ...p, assetIds: p.assetIds.includes(id) ? p.assetIds.filter((x) => x !== id) : [...p.assetIds, id] }));
  const move = (idx: number, dir: -1 | 1) =>
    setF((p) => {
      const arr = [...p.assetIds];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...p, assetIds: arr };
    });

  const canSave = !!(f.name.trim() && f.channel && f.assetIds.length > 0);
  const submit = () => {
    const id = isNew ? nextTopicId(existingIds) : f.id;
    onSave({ ...f, id, updated: TODAY, url: f.url || `https://h5.invested.cn/t/${id.toLowerCase()}`, sceneGroup: f.sceneGroup || f.scene }, isNew);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[820px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "新建专题包" : "编辑专题包"}</DialogTitle>
          <DialogDescription>保存后客户经理端可直接使用。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* 1. 基本信息 */}
          <section className="space-y-3">
            <SectionMark>基本信息</SectionMark>
            <div className="grid grid-cols-2 gap-4">
              <FieldText label="专题包名称" value={f.name} onChange={(v) => set("name", v)} className="col-span-2" />
              <FieldSelect label="品类" value={f.channel} options={CHANNELS_ALL} onChange={(v) => set("channel", v)} />
              <FieldSelect label="使用场景" value={f.scene} options={SCENES} onChange={(v) => set("scene", v as Scene)} />
              <FieldText label="适用对象" value={f.audience} onChange={(v) => set("audience", v)} className="col-span-2" />
              <FieldText label="解决的客户问题" value={f.tagline} onChange={(v) => set("tagline", v)} className="col-span-2" />
              <FieldArea label="内容目标" value={f.goal} onChange={(v) => set("goal", v)} className="col-span-2" />
            </div>
          </section>

          <Separator />

          {/* 2. 选择素材 */}
          <section className="space-y-3">
            <SectionMark>选择素材<span className="text-[12px] text-muted-foreground ml-2" style={{ fontWeight: 400 }}>已选 {f.assetIds.length} 篇</span></SectionMark>

            {/* 已选（可排序、删除） */}
            {f.assetIds.length > 0 && (
              <div className="space-y-2">
                {f.assetIds.map((id, idx) => {
                  const a = findAsset(assets, id);
                  if (!a) return null;
                  return (
                    <div key={id} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 bg-card">
                      <span className="tabular-nums text-[14px] text-primary w-6 text-center shrink-0" style={{ fontWeight: 700 }}>{String(idx + 1).padStart(2, "0")}</span>
                      <div className="w-8 h-10 rounded bg-muted overflow-hidden shrink-0"><ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] line-clamp-1" style={{ fontWeight: 500 }}>{a.title}</div>
                        <div className="text-[11px] text-muted-foreground">{a.cat} · {a.id}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <IconBtn title="上移" onClick={() => move(idx, -1)}><ArrowUp className="size-3.5" /></IconBtn>
                        <IconBtn title="下移" onClick={() => move(idx, 1)}><ArrowDown className="size-3.5" /></IconBtn>
                        <IconBtn title="移除" danger onClick={() => toggleAsset(id)}><Trash2 className="size-3.5" /></IconBtn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 搜索并勾选 */}
            <div className="rounded-lg border border-border p-3 bg-muted/20 space-y-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)} placeholder="搜索素材标题、编号或品类" className="pl-9 h-9 bg-card border-border" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {candidates.map((a) => {
                  const checked = f.assetIds.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAsset(a.id)}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${checked ? "border-primary bg-[var(--primary-light)]" : "border-border bg-card hover:border-[#94BFFF]"}`}>
                      <span className={`size-4 rounded grid place-items-center border shrink-0 ${checked ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}><Check className="size-3" strokeWidth={3} /></span>
                      <span className="flex-1 min-w-0 text-[12px] truncate">{a.title}</span>
                      <span className="text-[10.5px] text-muted-foreground shrink-0">{a.cat}</span>
                    </button>
                  );
                })}
                {candidates.length === 0 && <div className="col-span-2 text-center text-[12px] text-muted-foreground py-4">未找到匹配素材</div>}
              </div>
            </div>
          </section>

          <Separator />

          {/* 3. 使用说明 */}
          <section className="space-y-3">
            <SectionMark>使用说明</SectionMark>
            <FieldArea label="为什么这样组合" value={f.combineReason} onChange={(v) => set("combineReason", v)} />
            <div className="grid grid-cols-2 gap-4">
              <FieldSelect label="推荐使用方式" value={f.sendMode} options={["一次发送", "分次发送"]} onChange={(v) => set("sendMode", v as Topic["sendMode"])} />
              <FieldText label="推荐使用顺序" value={f.sendOrder} onChange={(v) => set("sendOrder", v)} />
            </div>
            <FieldArea label="理财经理讲解边界" value={f.talkBoundary} onChange={(v) => set("talkBoundary", v)} />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="bg-primary" disabled={!canSave} onClick={submit}>{isNew ? "保存专题包" : "保存修改"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TopicPreviewDialog({ topic, assets, onClose }: { topic: Topic; assets: Asset[]; onClose: () => void }) {
  const items = topic.assetIds.map((id) => findAsset(assets, id)).filter(Boolean) as Asset[];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[620px] max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic.name}</DialogTitle>
          <DialogDescription>{topic.channel} · {topic.scene} · 包含 {topic.assetIds.length} 篇 · 更新于 {topic.updated}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-[12.5px] text-foreground/85">解决：{topic.tagline}</div>
          <div className="text-[12px] text-muted-foreground">适用对象：{topic.audience || "—"}</div>
          {topic.combineReason && <div className="text-[12px] text-muted-foreground leading-relaxed">为什么这样组合：{topic.combineReason}</div>}
          <Separator />
          {items.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <span className="tabular-nums text-[14px] text-primary w-6 text-center" style={{ fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
              <div className="w-10 h-12 rounded bg-muted overflow-hidden shrink-0"><ImageWithFallback src={a.cover} alt={a.title} className="size-full object-cover object-top" /></div>
              <div className="min-w-0">
                <div className="text-[13px] line-clamp-1" style={{ fontWeight: 500 }}>{a.title}</div>
                <div className="text-[11.5px] text-muted-foreground line-clamp-1">{a.cat} · {a.question}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-[12.5px] text-muted-foreground py-4 text-center">该专题包暂未选择素材</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== 通用小组件 ==================== */
function SectionMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ fontWeight: 600 }}>
      <span className="w-[3px] h-3.5 rounded bg-primary" />{children}
    </div>
  );
}

function IconBtn({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick}
      className={`size-8 grid place-items-center rounded-md transition ${danger ? "text-muted-foreground hover:bg-red-50 hover:text-red-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function FieldText({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 text-[13px]" />
    </div>
  );
}

function FieldArea({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 text-[13px] min-h-[64px]" />
    </div>
  );
}

function FieldSelect({ label, value, options, onChange, className = "" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-9 text-[13px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConfirmDialog({ title, desc, onCancel, onConfirm }: { title: string; desc: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}><Trash2 className="size-4 mr-1" />确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
