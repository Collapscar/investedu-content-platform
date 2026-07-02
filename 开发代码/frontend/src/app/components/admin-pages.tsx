import { useEffect, useRef, useState } from "react";
import { TopBar } from "./sidebar-nav";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  type Asset, type Category, type Topic, type Scene,
  SCENES, catDefaults,
  topicCover, findAsset, topicCountForAsset,
  assetCategoryOptionsOf, categoryOptionsOf,
  type PlatformStore,
} from "./data";
import { EmptyState, Lightbox, SceneBadge, FilterPicker } from "./pages";
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
  Plus, Pencil, Trash2, Eye, Search, Check, Upload, ArrowUp, ArrowDown, FileImage, Sparkles, Loader2, XCircle,
} from "lucide-react";

const TODAY = "2026-06-18";

/* ==================== 素材管理 ==================== */
export function AssetManagePage({ store }: { store: PlatformStore }) {
  const { assets, topics, categories, addAsset, updateAsset, deleteAsset, refresh } = store;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [creating, setCreating] = useState(false);
  const [batchImporting, setBatchImporting] = useState(false);
  const [lightbox, setLightbox] = useState<Asset | null>(null);
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  const rows = assets.filter((a) =>
    (!q || a.title.includes(q) || a.id.includes(q)) &&
    (!cat || a.cat === cat)
  );
  const categoryOptions = assetCategoryOptionsOf(categories, assets.map((asset) => asset.cat));

  return (
    <>
      <TopBar
        title="素材管理"
        subtitle={`共 ${assets.length} 件素材`}
        searchNode={<div />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBatchImporting(true)}><Upload className="size-4 mr-1" />批量导入</Button>
            <Button size="sm" className="bg-primary" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />上传素材</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[300px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索素材标题或编号" className="pl-9 h-9 bg-card border-border" />
          </div>
          <FilterPicker label="品类" value={cat} options={categoryOptions} onChange={setCat} />
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
                  <TableRow>
                    <TableCell colSpan={8} className="px-4 py-8">
                      <EmptyState compact title="无符合条件的素材" desc="可调整搜索词或品类筛选，清空条件后查看全部素材。" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <AssetEditor
          asset={editing}
          categoryOptions={categoryOptions}
          existingIds={assets.map((a) => a.id)}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(a, isNew) => {
            if (isNew) addAsset(a); else updateAsset(a.id, a);
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {batchImporting && (
        <AssetBatchImportDialog
          categoryOptions={categoryOptions}
          existingIds={assets.map((a) => a.id)}
          onClose={() => setBatchImporting(false)}
          onImported={() => { void refresh(); }}
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

function AssetEditor({ asset, categoryOptions, existingIds, onClose, onSave }: {
  asset: Asset | null;
  categoryOptions: string[];
  existingIds: string[];
  onClose: () => void;
  onSave: (a: Asset, isNew: boolean) => void;
}) {
  const isNew = !asset;
  const defaultCat = categoryOptions[0] ?? "基金";
  const [f, setF] = useState<Asset>(asset ?? {
    id: "", title: "", cat: defaultCat, question: "", summary: "",
    risk: "", cover: "", scene: "客户咨询", updated: TODAY,
    ...catDefaults(defaultCat), downloads: 0,
  });
  const mountedRef = useRef(true);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const localPreviewRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pickedFileName, setPickedFileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const set = <K extends keyof Asset>(k: K, v: Asset[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => () => {
    mountedRef.current = false;
    uploadAbortRef.current?.abort();
    aiAbortRef.current?.abort();
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
  }, []);

  const closeEditor = () => {
    uploadAbortRef.current?.abort();
    aiAbortRef.current?.abort();
    onClose();
  };

  const onCategoryChange = (cat: string) => {
    const defaults = catDefaults(cat);
    setF((p) => ({
      ...p,
      cat,
      audience: p.audience || defaults.audience,
      useWhen: p.useWhen || defaults.useWhen,
      talkTip: p.talkTip || defaults.talkTip,
    }));
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAbortRef.current?.abort();
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
      const previewUrl = URL.createObjectURL(file);
      localPreviewRef.current = previewUrl;
      const controller = new AbortController();
      uploadAbortRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 45000);
      setPickedFileName(file.name);
      setUploading(true);
      setUploadError(null);
      set("cover", previewUrl);
      void contentApi.uploadCover(file, controller.signal)
        .then(({ publicUrl }) => {
          if (!mountedRef.current) return;
          set("cover", publicUrl);
          if (localPreviewRef.current) {
            URL.revokeObjectURL(localPreviewRef.current);
            localPreviewRef.current = null;
          }
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          if (controller.signal.aborted) {
            setUploadError("上传已取消，请重新选择文件。");
            return;
          }
          setUploadError(err instanceof Error ? err.message : "图片上传失败，请重新选择文件。");
        })
        .finally(() => {
          window.clearTimeout(timeout);
          if (!mountedRef.current) return;
          if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
          setUploading(false);
        });
    }
    e.target.value = "";
  };

  const cancelUpload = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUploading(false);
  };

  const generateAssetText = () => {
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    setGenerating(true);
    setAiError(null);
    void contentApi.generateAssetDescription({
      title: f.title,
      cat: f.cat,
      scene: f.scene,
      fileName: pickedFileName,
      cover: f.cover,
      question: f.question,
      summary: f.summary,
      audience: f.audience,
      useWhen: f.useWhen,
      talkTip: f.talkTip,
      risk: f.risk,
    }, controller.signal)
      .then((suggestion) => {
        if (!mountedRef.current) return;
        setF((prev) => ({
          ...prev,
          title: suggestion.title || prev.title,
          question: suggestion.question || prev.question,
          summary: suggestion.summary || prev.summary,
          audience: suggestion.audience || prev.audience,
          useWhen: suggestion.useWhen || prev.useWhen,
          talkTip: suggestion.talkTip || prev.talkTip,
          risk: suggestion.risk || prev.risk,
          scene: SCENES.includes(suggestion.scene as Scene) ? (suggestion.scene as Scene) : prev.scene,
        }));
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        if (controller.signal.aborted) {
          setAiError("生成说明已取消，可继续编辑或重新生成。");
          return;
        }
        setAiError(err instanceof Error ? err.message : "AI 说明生成失败");
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (aiAbortRef.current === controller) aiAbortRef.current = null;
        if (mountedRef.current) setGenerating(false);
      });
  };

  const cancelGenerate = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setGenerating(false);
  };

  const canSave = !!(f.title.trim() && f.cat) && !uploading;
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
    <Dialog open onOpenChange={(o) => !o && closeEditor()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-[820px] max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 pr-12 border-b bg-card">
          <DialogTitle className="text-[20px]">{isNew ? "上传素材" : "编辑素材信息"}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            {isNew ? "上传后客户经理端可直接使用。" : `素材编号 ${f.id}（不可修改）`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-144px)] overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-[#F8FAFC]">
          <FormSection title="长图文件" desc="上传完整长图后，系统会生成客户经理端预览和素材包下载内容。">
            <div className="grid grid-cols-1 sm:grid-cols-[116px_1fr] gap-4">
              <div className="w-[116px] h-[150px] rounded-lg bg-muted overflow-hidden shrink-0 border border-[#D8E0EA] shadow-sm">
                {f.cover ? (
                  <ImageWithFallback src={f.cover} alt="封面" className="size-full object-cover object-top" />
                ) : (
                  <div className="size-full grid place-items-center text-center text-[12px] text-muted-foreground px-3">
                    <FileImage className="size-6 mb-2 mx-auto text-primary" />
                    暂无封面
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <Label className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>{isNew ? "长图文件" : "更换长图"}</Label>
                <label className="mt-2 flex min-h-[84px] items-center justify-center gap-2 rounded-lg border border-dashed border-[#AFC3DD] bg-white cursor-pointer text-[13px] text-muted-foreground hover:border-primary hover:bg-[var(--primary-light)] hover:text-primary transition">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {uploading ? "正在上传..." : f.cover ? "重新选择图片" : "选择长图文件"}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickFile} />
                </label>
                <div className="text-[12px] text-muted-foreground mt-2 leading-relaxed">支持 PNG/JPG；建议使用竖版长图，文件会保存在本地素材库。</div>
                {(uploading || uploadError) && (
                  <div className={`mt-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px] ${uploadError ? "bg-red-50 text-red-600" : "bg-[var(--primary-light)] text-primary"}`}>
                    <span className="min-w-0">{uploadError || "图片上传中，可取消或直接关闭窗口。"}</span>
                    {uploading && (
                      <button type="button" onClick={cancelUpload} className="inline-flex items-center gap-1 shrink-0" style={{ fontWeight: 600 }}>
                        <XCircle className="size-3.5" />取消上传
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection
            title="基础信息"
            desc="用于客户经理端检索、筛选和详情页展示。"
            extra={
              <Button variant="outline" size="sm" onClick={generateAssetText} disabled={generating || uploading || (!f.cover && !f.title.trim())}>
                {generating ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Sparkles className="size-3.5 mr-1" />}
                生成说明
              </Button>
            }
          >
            {(generating || aiError) && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px] ${aiError ? "bg-red-50 text-red-600" : "bg-[var(--primary-light)] text-primary"}`}>
                <span className="min-w-0">{aiError || "AI 正在生成说明，可取消后继续编辑或关闭窗口。"}</span>
                {generating && (
                  <button type="button" onClick={cancelGenerate} className="inline-flex items-center gap-1 shrink-0" style={{ fontWeight: 600 }}>
                    <XCircle className="size-3.5" />取消生成
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldText label="素材标题" required value={f.title} onChange={(v) => set("title", v)} placeholder="请输入客户经理端展示的素材标题" className="md:col-span-2" />
              <FieldSelect label="品类" required value={f.cat} options={categoryOptions} onChange={onCategoryChange} />
              <FieldSelect label="使用场景" value={f.scene} options={SCENES} onChange={(v) => set("scene", v as Scene)} />
              <FieldText label="客户问题" value={f.question} onChange={(v) => set("question", v)} placeholder="例如：客户最常问的疑问或沟通触发点" className="md:col-span-2" />
              <FieldArea label="核心摘要" value={f.summary} onChange={(v) => set("summary", v)} placeholder="用一句话概括素材要帮助客户理解什么" className="md:col-span-2" />
            </div>
          </FormSection>

          <FormSection title="客户经理使用说明" desc="这些内容会进入素材详情和下载包说明，帮助一线人员正确转述。">
            <div className="grid grid-cols-1 gap-4">
              <FieldText label="适用对象" value={f.audience} onChange={(v) => set("audience", v)} placeholder="例如：首次咨询该品类、关注风险和费用的客户" />
              <FieldArea label="讲解提示" value={f.talkTip} onChange={(v) => set("talkTip", v)} placeholder="提示客户经理沟通时应强调的边界和重点" />
              <FieldArea label="风险提示" value={f.risk} onChange={(v) => set("risk", v)} placeholder="填写合规风险提示，避免收益承诺和误导性表述" />
            </div>
          </FormSection>
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t bg-card">
          <Button variant="outline" onClick={closeEditor}>取消</Button>
          <Button className="bg-primary" disabled={!canSave} onClick={submit}>{isNew ? "保存素材" : "保存修改"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ImportRow = Record<string, unknown>;

type BatchImportResult = {
  ok: number;
  failed: string[];
};

const ASSET_SAMPLE = `id,title,cat,scene,question,summary,audience,useWhen,talkTip,risk,cover
BATCH-FUND-001,批量导入基金测试素材,基金,客户咨询,客户想先了解基金风险边界,用一张长图说明基金投教重点,首次咨询基金的客户,客户提出基金基础问题时,先讲清风险和规则边界,本资料仅用于投资者教育，不构成投资建议；不承诺收益。,/api/v1/storage/covers/FUND-001.png`;

const TOPIC_SAMPLE = `id,name,channel,scene,sceneGroup,assetIds,audience,tagline,goal,combineReason,sendMode,sendOrder,talkBoundary
BATCH-TOPIC-001,批量导入基金入门专题,基金,客户咨询,小白入门,"FUND-001|FUND-002",首次咨询基金的客户,先分清基金类型和风险边界,帮助客户建立基金基础认知,两篇素材覆盖类型区分和名称误区,分次发送,FUND-001→FUND-002,不承诺收益，不提供买卖点，以正式文件为准。`;

function AssetBatchImportDialog({ categoryOptions, existingIds, onClose, onImported }: {
  categoryOptions: string[];
  existingIds: string[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [raw, setRaw] = useState(ASSET_SAMPLE);
  const [items, setItems] = useState<Asset[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BatchImportResult | null>(null);

  const parse = () => {
    const next = parseAssets(raw, categoryOptions, existingIds);
    setItems(next.items);
    setErrors(next.errors);
    setResult(null);
    return next;
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      setRaw(text);
      setItems([]);
      setErrors([]);
      setResult(null);
    });
    e.target.value = "";
  };

  const submit = () => {
    const parsed = items.length > 0 && errors.length === 0 ? { items, errors } : parse();
    if (parsed.errors.length > 0 || parsed.items.length === 0) return;
    setImporting(true);
    setResult(null);
    void (async () => {
      const failed: string[] = [];
      let ok = 0;
      for (const item of parsed.items) {
        try {
          await contentApi.createAsset(item);
          ok += 1;
        } catch (err) {
          failed.push(`${item.id}：${err instanceof Error ? err.message : "导入失败"}`);
        }
      }
      setResult({ ok, failed });
      setImporting(false);
      if (ok > 0) onImported();
    })();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !importing && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-[860px] max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 pr-12 border-b bg-card">
          <DialogTitle className="text-[20px]">批量导入素材</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">支持 JSON 或 CSV。导入会按素材编号新增或覆盖同编号素材。</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-144px)] overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-[#F8FAFC]">
          <FormSection title="导入内容" desc="CSV 第一行必须是表头；JSON 可使用数组，或 { assets: [...] }。">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setRaw(ASSET_SAMPLE); setItems([]); setErrors([]); setResult(null); }}>填入 CSV 示例</Button>
              <label className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-[12px] cursor-pointer hover:border-primary hover:bg-[var(--primary-light)] hover:text-primary">
                上传 JSON/CSV
                <input type="file" accept=".json,.csv,.txt,text/csv,application/json" className="hidden" onChange={onPickFile} />
              </label>
            </div>
            <FieldArea
              label="导入数据"
              value={raw}
              onChange={(v) => { setRaw(v); setItems([]); setErrors([]); setResult(null); }}
              className="min-h-[260px]"
              placeholder="粘贴 JSON 或 CSV"
              helper="必填字段：title、cat。可选字段：id、scene、question、summary、audience、useWhen、talkTip、risk、cover。"
            />
          </FormSection>

          <BatchPreviewPanel
            title="素材预览"
            count={items.length}
            errors={errors}
            result={result}
            rows={items.slice(0, 6).map((item) => `${item.id}｜${item.cat}｜${item.title}`)}
          />
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t bg-card">
          <Button variant="outline" onClick={onClose} disabled={importing}>关闭</Button>
          <Button variant="outline" onClick={parse} disabled={importing}>解析预览</Button>
          <Button className="bg-primary" onClick={submit} disabled={importing || !raw.trim()}>
            {importing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Upload className="size-4 mr-1" />}
            执行导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== 品类管理 ==================== */
export function CategoryManagePage({ store }: { store: PlatformStore }) {
  const { categories, assets, topics, addCategory, updateCategory, deleteCategory } = store;
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const rows = categories.filter((category) =>
    !q || category.name.includes(q) || category.coverageContent.includes(q)
  );

  const assetCountOf = (name: string) => assets.filter((asset) => asset.cat === name).length;
  const topicCountOf = (name: string) => topics.filter((topic) => topic.channel === name).length;

  return (
    <>
      <TopBar
        title="品类管理"
        subtitle={`共 ${categories.length} 个品类`}
        searchNode={<div />}
        actions={<Button size="sm" className="bg-primary" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />新增品类</Button>}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="relative w-[300px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索品类名称或覆盖内容" className="pl-9 h-9 bg-card border-border" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">品类名称</TableHead>
                  <TableHead className="min-w-[320px]">覆盖内容</TableHead>
                  <TableHead className="text-center">素材数</TableHead>
                  <TableHead className="text-center">专题包数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell>
                      <span className="text-[13px]" style={{ fontWeight: 600 }}>{category.name}</span>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground leading-relaxed">
                      {category.coverageContent || "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{assetCountOf(category.name)}</TableCell>
                    <TableCell className="text-center tabular-nums">{topicCountOf(category.name)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="编辑" onClick={() => setEditing(category)}><Pencil className="size-4" /></IconBtn>
                        <IconBtn title="删除" danger onClick={() => setToDelete(category)}><Trash2 className="size-4" /></IconBtn>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-[13px] text-muted-foreground">无符合条件的品类</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <CategoryEditor
          category={editing}
          existingNames={categories.map((category) => category.name)}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(category, isNew, originalName) => {
            if (isNew) addCategory(category); else updateCategory(originalName, category);
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="删除品类"
          desc={`确定删除「${toDelete.name}」品类配置？当前关联 ${assetCountOf(toDelete.name)} 件素材、${topicCountOf(toDelete.name)} 个专题包；删除品类不会删除这些内容。是否继续？`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { deleteCategory(toDelete.name); setToDelete(null); }}
        />
      )}
    </>
  );
}

function CategoryEditor({ category, existingNames, onClose, onSave }: {
  category: Category | null;
  existingNames: string[];
  onClose: () => void;
  onSave: (category: Category, isNew: boolean, originalName: string) => void;
}) {
  const isNew = !category;
  const [f, setF] = useState<Category>(category ?? { name: "", coverageContent: "" });
  const normalizedName = f.name.trim();
  const duplicate = existingNames.some((name) => name === normalizedName && name !== category?.name);
  const canSave = !!normalizedName && !!f.coverageContent.trim() && !duplicate;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-[620px] max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 pr-12 border-b bg-card">
          <DialogTitle className="text-[20px]">{isNew ? "新增品类" : "编辑品类"}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            维护客户经理端筛选项和内容资产首页的品类覆盖说明。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-144px)] overflow-y-auto px-5 sm:px-6 py-5 bg-[#F8FAFC]">
          <FormSection title="品类信息" desc="品类名称会作为客户经理端素材库、专题包列表和首页统计的统一筛选项。">
            <div className="grid grid-cols-1 gap-4">
              <FieldText
                label="品类名称"
                required
                value={f.name}
                onChange={(name) => setF((prev) => ({ ...prev, name }))}
                placeholder="例如：黄金"
                error={duplicate ? "该品类名称已存在" : undefined}
              />
              <FieldArea
                label="覆盖内容"
                required
                value={f.coverageContent}
                onChange={(coverageContent) => setF((prev) => ({ ...prev, coverageContent }))}
                placeholder="例如：实物黄金 · 积存金 · 价格波动"
                helper="建议用 2-4 个关键词概括该品类覆盖范围，客户经理端首页会直接展示。"
              />
            </div>
          </FormSection>
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t bg-card">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            className="bg-primary"
            disabled={!canSave}
            onClick={() => onSave({ name: normalizedName, coverageContent: f.coverageContent.trim() }, isNew, category?.name ?? normalizedName)}
          >
            {isNew ? "保存品类" : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== 专题包管理 ==================== */
export function TopicManagePage({ store }: { store: PlatformStore }) {
  const { assets, topics, categories, addTopic, updateTopic, deleteTopic, refresh } = store;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [creating, setCreating] = useState(false);
  const [batchImporting, setBatchImporting] = useState(false);
  const [preview, setPreview] = useState<Topic | null>(null);
  const [toDelete, setToDelete] = useState<Topic | null>(null);

  const rows = topics.filter((t) =>
    (!q || t.name.includes(q)) &&
    (!cat || t.channel === cat)
  );
  const categoryOptions = categoryOptionsOf(categories, topics.map((topic) => topic.channel));

  return (
    <>
      <TopBar
        title="专题包管理"
        subtitle={`共 ${topics.length} 个专题包`}
        searchNode={<div />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBatchImporting(true)}><Upload className="size-4 mr-1" />批量导入</Button>
            <Button size="sm" className="bg-primary" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />新建专题包</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[300px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索专题包名称" className="pl-9 h-9 bg-card border-border" />
          </div>
          <FilterPicker label="品类" value={cat} options={categoryOptions} onChange={setCat} />
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
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8">
                      <EmptyState compact title="无符合条件的专题包" desc="可调整搜索词或品类筛选，清空条件后查看全部专题包。" />
                    </TableCell>
                  </TableRow>
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
          categoryOptions={categoryOptions}
          existingIds={topics.map((t) => t.id)}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(t, isNew) => {
            if (isNew) addTopic(t); else updateTopic(t.id, t);
            setCreating(false); setEditing(null);
          }}
        />
      )}
      {batchImporting && (
        <TopicBatchImportDialog
          assets={assets}
          categoryOptions={categoryOptions}
          existingIds={topics.map((t) => t.id)}
          onClose={() => setBatchImporting(false)}
          onImported={() => { void refresh(); }}
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

function TopicEditor({ topic, assets, categoryOptions, existingIds, onClose, onSave }: {
  topic: Topic | null;
  assets: Asset[];
  categoryOptions: string[];
  existingIds: string[];
  onClose: () => void;
  onSave: (t: Topic, isNew: boolean) => void;
}) {
  const isNew = !topic;
  const defaultCat = categoryOptions[0] ?? "基金";
  const [f, setF] = useState<Topic>(topic ?? {
    id: "", name: "", channel: defaultCat, assetIds: [], scene: "客户咨询",
    audience: "", goal: "", tagline: "", updated: TODAY, url: "",
    combineReason: "", sendMode: "一次发送", sendOrder: "", talkBoundary: "",
    sceneGroup: "", downloads: 0,
  });
  const mountedRef = useRef(true);
  const aiAbortRef = useRef<AbortController | null>(null);
  const set = <K extends keyof Topic>(k: K, v: Topic[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => () => {
    mountedRef.current = false;
    aiAbortRef.current?.abort();
  }, []);

  const [assetQuery, setAssetQuery] = useState("");
  const candidates = assets.filter((a) =>
    !assetQuery || a.title.includes(assetQuery) || a.id.includes(assetQuery) || a.cat.includes(assetQuery)
  );
  const selectedAssets = f.assetIds.map((id) => findAsset(assets, id)).filter(Boolean) as Asset[];
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
  const applyLocalTopicDraft = () => {
    if (selectedAssets.length === 0) return;
    const channel = f.channel || selectedAssets[0]?.cat || defaultCat;
    const firstTitle = selectedAssets[0]?.title.replace(/[，,。？?].*$/, "").trim();
    const selectedNames = selectedAssets.slice(0, 4).map((asset) => asset.title).join("、");
    const selectedOrder = selectedAssets.map((asset) => asset.id).join("→");
    setF((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : `${channel}专题：${firstTitle || "客户常见问题"}`,
      tagline: prev.tagline.trim() ? prev.tagline : `围绕${channel}客户高频问题，按认知、规则和风险顺序讲清楚。`,
      audience: prev.audience.trim() ? prev.audience : "有相关咨询需求、需要连续讲解的客户",
      goal: prev.goal.trim() ? prev.goal : `帮助客户系统理解${channel}相关内容，形成清晰的问题框架和风险边界。`,
      combineReason: prev.combineReason.trim() ? prev.combineReason : `所选素材覆盖${selectedNames || "客户常见问题"}，适合组合成连续讲解包。`,
      sendMode: selectedAssets.length > 3 ? "分次发送" : prev.sendMode,
      sendOrder: prev.sendOrder.trim() ? prev.sendOrder : selectedOrder || "先基础认知，再规则说明，最后风险提示",
      talkBoundary: prev.talkBoundary.trim() ? prev.talkBoundary : "不承诺收益或审批结果，不提供买卖点，不替客户做最终决策；具体规则以正式文件为准。",
      sceneGroup: prev.sceneGroup || "小白入门",
    }));
  };

  const generateTopicText = () => {
    if (selectedAssets.length === 0) return;
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    applyLocalTopicDraft();
    setGenerating(true);
    setAiError(null);
    void contentApi.generateTopicDescription({
      name: f.name,
      channel: f.channel,
      scene: f.scene,
      sceneGroup: f.sceneGroup,
      audience: f.audience,
      goal: f.goal,
      tagline: f.tagline,
      combineReason: f.combineReason,
      sendMode: f.sendMode,
      sendOrder: f.sendOrder,
      talkBoundary: f.talkBoundary,
      assets: selectedAssets.map((asset) => ({
        id: asset.id,
        title: asset.title,
        cat: asset.cat,
        question: asset.question,
        summary: asset.summary,
        scene: asset.scene,
      })),
    }, controller.signal)
      .then((suggestion) => {
        if (!mountedRef.current) return;
        setF((prev) => ({
          ...prev,
          name: suggestion.name || prev.name,
          tagline: suggestion.tagline || prev.tagline,
          audience: suggestion.audience || prev.audience,
          goal: suggestion.goal || prev.goal,
          combineReason: suggestion.combineReason || prev.combineReason,
          sendMode: suggestion.sendMode === "一次发送" || suggestion.sendMode === "分次发送" ? suggestion.sendMode : prev.sendMode,
          sendOrder: suggestion.sendOrder || prev.sendOrder,
          talkBoundary: suggestion.talkBoundary || prev.talkBoundary,
          scene: SCENES.includes(suggestion.scene as Scene) ? (suggestion.scene as Scene) : prev.scene,
          sceneGroup: suggestion.sceneGroup || prev.sceneGroup,
        }));
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        if (controller.signal.aborted) {
          setAiError("生成说明已取消，可继续编辑或重新生成。");
          return;
        }
        setAiError(err instanceof Error ? err.message : "AI 说明生成失败");
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (aiAbortRef.current === controller) aiAbortRef.current = null;
        if (mountedRef.current) setGenerating(false);
      });
  };

  const cancelGenerate = (message = "生成说明已取消，可继续编辑或重新生成。") => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setGenerating(false);
    setAiError(message);
  };

  const submit = () => {
    const id = isNew ? nextTopicId(existingIds) : f.id;
    onSave({ ...f, id, updated: TODAY, url: f.url || `https://h5.invested.cn/t/${id.toLowerCase()}`, sceneGroup: f.sceneGroup || f.scene }, isNew);
  };

  const requestClose = () => {
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
      aiAbortRef.current = null;
    }
    setGenerating(false);
    onClose();
  };

  const requestSave = () => {
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
      aiAbortRef.current = null;
    }
    setGenerating(false);
    submit();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && requestClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-[900px] max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 pr-12 border-b bg-card">
          <DialogTitle className="text-[20px]">{isNew ? "新建专题包" : "编辑专题包"}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">保存后客户经理端可直接使用。</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-144px)] overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-[#F8FAFC]">
          <FormSection title="基本信息" desc="用于专题包列表、详情页和客户经理端下载说明。">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldText label="专题包名称" required value={f.name} onChange={(v) => set("name", v)} placeholder="请输入专题包名称" className="md:col-span-2" />
              <FieldSelect label="品类" required value={f.channel} options={categoryOptions} onChange={(v) => set("channel", v)} />
              <FieldSelect label="使用场景" value={f.scene} options={SCENES} onChange={(v) => set("scene", v as Scene)} />
              <FieldText label="适用对象" value={f.audience} onChange={(v) => set("audience", v)} placeholder="例如：首次咨询基金配置、需要连续讲解的客户" className="md:col-span-2" />
              <FieldText label="解决的客户问题" value={f.tagline} onChange={(v) => set("tagline", v)} placeholder="例如：客户不知道该按什么顺序理解这个主题" className="md:col-span-2" />
              <FieldArea label="内容目标" value={f.goal} onChange={(v) => set("goal", v)} placeholder="说明专题包要达成的沟通目标" className="md:col-span-2" />
            </div>
          </FormSection>

          <FormSection
            title="选择素材"
            desc="勾选素材后可调整展示顺序；客户经理端会按这里的顺序下载和查看。"
            extra={
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[12px] text-primary" style={{ fontWeight: 600 }}>已选 {f.assetIds.length} 篇</span>
                <Button type="button" variant="outline" size="sm" onClick={generateTopicText} disabled={generating || selectedAssets.length === 0}>
                  {generating ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Sparkles className="size-3.5 mr-1" />}
                  生成说明
                </Button>
              </div>
            }
          >
            {(generating || aiError) && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px] ${aiError ? "bg-red-50 text-red-600" : "bg-[var(--primary-light)] text-primary"}`}>
                <span className="min-w-0">{aiError || "AI 正在生成专题说明，可取消后继续编辑或关闭窗口。"}</span>
                {generating && (
                  <button type="button" onClick={() => cancelGenerate()} className="inline-flex items-center gap-1 shrink-0" style={{ fontWeight: 600 }}>
                    <XCircle className="size-3.5" />取消生成
                  </button>
                )}
              </div>
            )}

            {/* 已选（可排序、删除） */}
            {f.assetIds.length > 0 && (
              <div className="space-y-2 mb-3">
                {f.assetIds.map((id, idx) => {
                  const a = findAsset(assets, id);
                  if (!a) return null;
                  return (
                    <div key={id} className="flex items-center gap-2.5 rounded-lg border border-[#D8E0EA] p-2.5 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
            <div className="rounded-lg border border-[#D8E0EA] p-3 bg-[#F8FAFC] space-y-3">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)} placeholder="搜索素材标题、编号或品类" className="pl-9 h-10 rounded-lg bg-white border-[#D8E0EA]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {candidates.map((a) => {
                  const checked = f.assetIds.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAsset(a.id)}
                      className={`flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${checked ? "border-primary bg-[var(--primary-light)]" : "border-[#D8E0EA] bg-white hover:border-[#94BFFF]"}`}>
                      <span className={`size-4 rounded grid place-items-center border shrink-0 ${checked ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}><Check className="size-3" strokeWidth={3} /></span>
                      <span className="flex-1 min-w-0 text-[12px] truncate">{a.title}</span>
                      <span className="text-[10.5px] text-muted-foreground shrink-0">{a.cat}</span>
                    </button>
                  );
                })}
                {candidates.length === 0 && <div className="col-span-2 text-center text-[12px] text-muted-foreground py-4">未找到匹配素材</div>}
              </div>
            </div>
          </FormSection>

          <FormSection title="使用说明" desc="用于约束专题包转发节奏、讲解顺序和沟通边界。">
            <FieldArea label="为什么这样组合" value={f.combineReason} onChange={(v) => set("combineReason", v)} placeholder="说明这些素材放在同一个专题包里的原因" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldSelect label="推荐使用方式" value={f.sendMode} options={["一次发送", "分次发送"]} onChange={(v) => set("sendMode", v as Topic["sendMode"])} />
              <FieldText label="推荐使用顺序" value={f.sendOrder} onChange={(v) => set("sendOrder", v)} placeholder="例如：先认知、再规则、最后风险提示" />
            </div>
            <FieldArea label="理财经理讲解边界" value={f.talkBoundary} onChange={(v) => set("talkBoundary", v)} placeholder="明确不能承诺收益、不能代替客户决策等边界" />
          </FormSection>
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t bg-card">
          <Button type="button" variant="outline" onClick={requestClose}>取消</Button>
          <Button type="button" className="bg-primary" disabled={!canSave} onClick={requestSave}>{isNew ? "保存专题包" : "保存修改"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TopicBatchImportDialog({ assets, categoryOptions, existingIds, onClose, onImported }: {
  assets: Asset[];
  categoryOptions: string[];
  existingIds: string[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [raw, setRaw] = useState(TOPIC_SAMPLE);
  const [items, setItems] = useState<Topic[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BatchImportResult | null>(null);

  const parse = () => {
    const next = parseTopics(raw, assets, categoryOptions, existingIds);
    setItems(next.items);
    setErrors(next.errors);
    setResult(null);
    return next;
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      setRaw(text);
      setItems([]);
      setErrors([]);
      setResult(null);
    });
    e.target.value = "";
  };

  const submit = () => {
    const parsed = items.length > 0 && errors.length === 0 ? { items, errors } : parse();
    if (parsed.errors.length > 0 || parsed.items.length === 0) return;
    setImporting(true);
    setResult(null);
    void (async () => {
      const failed: string[] = [];
      let ok = 0;
      for (const item of parsed.items) {
        try {
          await contentApi.createTopic(item);
          ok += 1;
        } catch (err) {
          failed.push(`${item.id}：${err instanceof Error ? err.message : "导入失败"}`);
        }
      }
      setResult({ ok, failed });
      setImporting(false);
      if (ok > 0) onImported();
    })();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !importing && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-[900px] max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 pr-12 border-b bg-card">
          <DialogTitle className="text-[20px]">批量导入专题包</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">支持 JSON 或 CSV。专题素材编号需已存在于素材库。</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-144px)] overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-[#F8FAFC]">
          <FormSection title="导入内容" desc="CSV 中 assetIds 可用竖线分隔，例如 FUND-001|FUND-002；JSON 可使用数组，或 { topics: [...] }。">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setRaw(TOPIC_SAMPLE); setItems([]); setErrors([]); setResult(null); }}>填入 CSV 示例</Button>
              <label className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-[12px] cursor-pointer hover:border-primary hover:bg-[var(--primary-light)] hover:text-primary">
                上传 JSON/CSV
                <input type="file" accept=".json,.csv,.txt,text/csv,application/json" className="hidden" onChange={onPickFile} />
              </label>
            </div>
            <FieldArea
              label="导入数据"
              value={raw}
              onChange={(v) => { setRaw(v); setItems([]); setErrors([]); setResult(null); }}
              className="min-h-[260px]"
              placeholder="粘贴 JSON 或 CSV"
              helper="必填字段：name、channel、assetIds。可选字段：id、scene、sceneGroup、audience、tagline、goal、combineReason、sendMode、sendOrder、talkBoundary。"
            />
          </FormSection>

          <BatchPreviewPanel
            title="专题包预览"
            count={items.length}
            errors={errors}
            result={result}
            rows={items.slice(0, 6).map((item) => `${item.id}｜${item.channel}｜${item.name}｜${item.assetIds.length} 篇素材`)}
          />
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t bg-card">
          <Button variant="outline" onClick={onClose} disabled={importing}>关闭</Button>
          <Button variant="outline" onClick={parse} disabled={importing}>解析预览</Button>
          <Button className="bg-primary" onClick={submit} disabled={importing || !raw.trim()}>
            {importing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Upload className="size-4 mr-1" />}
            执行导入
          </Button>
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
function FormSection({
  title,
  desc,
  extra,
  children,
  className = "",
}: {
  title: string;
  desc?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-[#D8E0EA] bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionMark>{title}</SectionMark>
          {desc && <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</div>}
        </div>
        {extra && <div className="shrink-0 pt-0.5">{extra}</div>}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function SectionMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[14px] text-foreground" style={{ fontWeight: 700 }}>
      <span className="w-[3px] h-4 rounded bg-primary" />{children}
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

function FieldText({
  label,
  value,
  onChange,
  className = "",
  placeholder,
  helper,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <FieldLabel label={label} required={required} />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-2 h-10 rounded-lg border-[#D8E0EA] bg-white px-3 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-primary focus-visible:ring-primary/15"
      />
      <FieldNote helper={helper} error={error} />
    </div>
  );
}

function FieldArea({
  label,
  value,
  onChange,
  className = "",
  placeholder,
  helper,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <FieldLabel label={label} required={required} />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-2 min-h-[88px] rounded-lg border-[#D8E0EA] bg-white px-3 py-2.5 text-[13px] leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-primary focus-visible:ring-primary/15"
      />
      <FieldNote helper={helper} error={error} />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
  className = "",
  helper,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <FieldLabel label={label} required={required} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2 h-10 rounded-lg border-[#D8E0EA] bg-white px-3 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-primary focus-visible:ring-primary/15"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}
        </SelectContent>
      </Select>
      <FieldNote helper={helper} />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
  );
}

function FieldNote({ helper, error }: { helper?: string; error?: string }) {
  if (!helper && !error) return null;
  return <div className={`mt-1.5 text-[12px] leading-relaxed ${error ? "text-red-600" : "text-muted-foreground"}`}>{error || helper}</div>;
}

function BatchPreviewPanel({
  title,
  count,
  errors,
  result,
  rows,
}: {
  title: string;
  count: number;
  errors: string[];
  result: BatchImportResult | null;
  rows: string[];
}) {
  return (
    <FormSection title={title} desc="先解析预览，确认无错误后再执行导入。">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#D8E0EA] bg-white px-3 py-2">
          <div className="text-[11px] text-muted-foreground">可导入</div>
          <div className="mt-1 text-[18px] tabular-nums" style={{ fontWeight: 700 }}>{count}</div>
        </div>
        <div className="rounded-lg border border-[#D8E0EA] bg-white px-3 py-2">
          <div className="text-[11px] text-muted-foreground">校验错误</div>
          <div className={`mt-1 text-[18px] tabular-nums ${errors.length ? "text-red-600" : "text-foreground"}`} style={{ fontWeight: 700 }}>{errors.length}</div>
        </div>
        <div className="rounded-lg border border-[#D8E0EA] bg-white px-3 py-2">
          <div className="text-[11px] text-muted-foreground">导入结果</div>
          <div className="mt-1 text-[13px]" style={{ fontWeight: 600 }}>
            {result ? `成功 ${result.ok}，失败 ${result.failed.length}` : "待执行"}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600 leading-relaxed space-y-1">
          {errors.slice(0, 8).map((error) => <div key={error}>{error}</div>)}
          {errors.length > 8 && <div>还有 {errors.length - 8} 条错误未展示。</div>}
        </div>
      )}

      {result?.failed.length ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600 leading-relaxed space-y-1">
          {result.failed.slice(0, 8).map((error) => <div key={error}>{error}</div>)}
          {result.failed.length > 8 && <div>还有 {result.failed.length - 8} 条失败未展示。</div>}
        </div>
      ) : null}

      {result && result.failed.length === 0 && result.ok > 0 && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">导入完成，列表已刷新。</div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-[#D8E0EA] bg-white divide-y divide-[#E6ECF3]">
          {rows.map((row) => <div key={row} className="px-3 py-2 text-[12px] text-foreground/80 line-clamp-1">{row}</div>)}
        </div>
      )}
    </FormSection>
  );
}

function parseAssets(raw: string, categoryOptions: string[], existingIds: string[]) {
  const parsed = parseImportRows(raw, "assets");
  const errors = [...parsed.errors];
  const usedIds = new Set<string>();
  const items: Asset[] = [];
  parsed.rows.forEach((row, index) => {
    const rowNo = index + 1;
    const title = pickString(row, ["title", "素材标题", "标题", "name", "名称"]);
    const cat = pickString(row, ["cat", "品类", "category", "channel", "所属品类"]) || categoryOptions[0] || "基金";
    if (!title) errors.push(`第 ${rowNo} 行：素材标题 title 不能为空`);
    if (!cat) errors.push(`第 ${rowNo} 行：品类 cat 不能为空`);
    let id = pickString(row, ["id", "素材编号", "编号", "assetId"]);
    if (!id) id = nextAssetId(cat, [...existingIds, ...Array.from(usedIds)]);
    if (usedIds.has(id)) errors.push(`第 ${rowNo} 行：素材编号 ${id} 在本次导入中重复`);
    usedIds.add(id);
    const scene = normalizeScene(pickString(row, ["scene", "使用场景", "场景"]));
    const defaults = catDefaults(cat);
    items.push({
      id,
      title,
      cat,
      question: pickString(row, ["question", "客户问题", "问题"]),
      summary: pickString(row, ["summary", "核心摘要", "摘要"]),
      risk: pickString(row, ["risk", "风险提示", "合规提示"]) || "本资料仅用于投资者教育，不构成投资建议；不承诺收益，不替代客户自主决策。",
      cover: pickString(row, ["cover", "封面", "图片", "图片地址"]) || `/api/v1/storage/covers/${id}.png`,
      scene,
      updated: pickString(row, ["updated", "更新时间", "date", "日期"]) || TODAY,
      audience: pickString(row, ["audience", "适用对象"]) || defaults.audience,
      useWhen: pickString(row, ["useWhen", "使用时机", "适用时机"]) || defaults.useWhen,
      talkTip: pickString(row, ["talkTip", "讲解提示", "转述提示"]) || defaults.talkTip,
      downloads: pickNumber(row, ["downloads", "下载次数"]) ?? 0,
    });
  });
  return { items: errors.length ? [] : items, errors };
}

function parseTopics(raw: string, assets: Asset[], categoryOptions: string[], existingIds: string[]) {
  const parsed = parseImportRows(raw, "topics");
  const errors = [...parsed.errors];
  const usedIds = new Set<string>();
  const assetSet = new Set(assets.map((asset) => asset.id));
  const items: Topic[] = [];
  parsed.rows.forEach((row, index) => {
    const rowNo = index + 1;
    const name = pickString(row, ["name", "专题包名称", "专题名称", "title", "标题"]);
    const channel = pickString(row, ["channel", "品类", "category", "所属品类"]) || categoryOptions[0] || "基金";
    const assetIds = pickAssetIds(row);
    if (!name) errors.push(`第 ${rowNo} 行：专题包名称 name 不能为空`);
    if (!channel) errors.push(`第 ${rowNo} 行：品类 channel 不能为空`);
    if (assetIds.length === 0) errors.push(`第 ${rowNo} 行：assetIds 至少填写 1 个素材编号`);
    const missing = assetIds.filter((id) => !assetSet.has(id));
    if (missing.length > 0) errors.push(`第 ${rowNo} 行：素材编号不存在：${missing.join("、")}`);
    let id = pickString(row, ["id", "专题编号", "编号", "topicId"]);
    if (!id) id = nextTopicId([...existingIds, ...Array.from(usedIds)]);
    if (usedIds.has(id)) errors.push(`第 ${rowNo} 行：专题编号 ${id} 在本次导入中重复`);
    usedIds.add(id);
    const scene = normalizeScene(pickString(row, ["scene", "使用场景", "场景"]));
    items.push({
      id,
      name,
      channel,
      assetIds,
      scene,
      audience: pickString(row, ["audience", "适用对象"]),
      goal: pickString(row, ["goal", "内容目标", "目标"]),
      tagline: pickString(row, ["tagline", "解决的客户问题", "解决问题", "客户问题"]),
      updated: pickString(row, ["updated", "更新时间", "date", "日期"]) || TODAY,
      url: pickString(row, ["url", "链接"]) || `https://h5.invested.cn/t/${id.toLowerCase()}`,
      combineReason: pickString(row, ["combineReason", "为什么这样组合", "组合说明"]),
      sendMode: normalizeSendMode(pickString(row, ["sendMode", "推荐使用方式", "使用方式"])),
      sendOrder: pickString(row, ["sendOrder", "推荐使用顺序", "使用顺序"]),
      talkBoundary: pickString(row, ["talkBoundary", "讲解边界", "理财经理讲解边界"]) || "不承诺收益，不提供买卖点，不替代客户自主决策；具体规则以正式文件为准。",
      coverId: pickString(row, ["coverId", "封面素材编号"]) || assetIds[0],
      sceneGroup: normalizeSceneGroup(pickString(row, ["sceneGroup", "分类", "分层分类"]), scene),
      downloads: pickNumber(row, ["downloads", "下载次数"]) ?? 0,
    });
  });
  return { items: errors.length ? [] : items, errors };
}

function parseImportRows(raw: string, rootKey: "assets" | "topics") {
  const text = raw.trim();
  if (!text) return { rows: [] as ImportRow[], errors: ["导入内容不能为空"] };
  try {
    if (text.startsWith("{") || text.startsWith("[")) {
      const value = JSON.parse(text) as unknown;
      const rows = Array.isArray(value)
        ? value
        : isRecord(value) && Array.isArray(value[rootKey])
          ? value[rootKey]
          : [];
      if (!rows.length) return { rows: [] as ImportRow[], errors: [`JSON 需要是数组，或包含 ${rootKey} 数组字段`] };
      return { rows: rows.filter(isRecord), errors: rows.every(isRecord) ? [] : ["JSON 数组中存在非对象元素"] };
    }
    const rows = parseCsv(text);
    if (rows.length < 2) return { rows: [] as ImportRow[], errors: ["CSV 至少需要表头和 1 行数据"] };
    const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
    return {
      rows: rows.slice(1).filter((cols) => cols.some((cell) => cell.trim())).map((cols) => Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? ""]))),
      errors: [],
    };
  } catch (err) {
    return { rows: [] as ImportRow[], errors: [err instanceof Error ? err.message : "导入内容解析失败"] };
  }
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (quoted && next === "\"") {
        cell += "\"";
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  rows.push(row);
  return rows.filter((cols) => cols.some((value) => value !== ""));
}

function pickString(row: ImportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value == null) continue;
    if (Array.isArray(value)) return value.join("|").trim();
    const str = String(value).trim();
    if (str) return str;
  }
  return "";
}

function pickNumber(row: ImportRow, keys: string[]) {
  const value = pickString(row, keys);
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function pickAssetIds(row: ImportRow) {
  const direct = row.assetIds ?? row["素材编号列表"] ?? row["素材列表"] ?? row["素材编号"];
  if (Array.isArray(direct)) return direct.map((id) => String(id).trim()).filter(Boolean);
  return String(direct ?? "")
    .split(/[|,，;；、\n]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function normalizeScene(value: string): Scene {
  return SCENES.includes(value as Scene) ? (value as Scene) : "客户咨询";
}

function normalizeSendMode(value: string): Topic["sendMode"] {
  return value === "分次发送" ? "分次发送" : "一次发送";
}

function normalizeSceneGroup(value: string, fallback: string) {
  const groups = ["小白入门", "进阶理解", "高层管理"];
  if (groups.includes(value)) return value;
  return groups.includes(fallback) ? fallback : "小白入门";
}

function isRecord(value: unknown): value is ImportRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
