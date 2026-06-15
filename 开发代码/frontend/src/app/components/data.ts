import type { Asset, Topic } from "../../types/content";
import {
  CHANNELS_ALL,
  SCENES,
  catDefaults,
  type Scene,
} from "../../types/content";
import { usePlatformStore, type PlatformStore } from "../../hooks/usePlatformStore";

export {
  CHANNELS_ALL,
  SCENES,
  catDefaults,
  usePlatformStore,
  type Asset,
  type Topic,
  type Scene,
  type PlatformStore,
};

export const forwardTextOf = (a: Asset) =>
  `【${a.title}】\n${a.summary}\n💡「${a.question}」——点开这张图，一看就懂。\n（${a.risk.split("；")[0]}。）`;

export const introOf = (a: Asset) =>
  `本素材面向「${a.audience}」，适用于「${a.scene}」场景。${a.summary}`;

export const DISCLAIMER = "本资料仅用于投资者教育，不构成投资建议；投资有风险，决策需谨慎。";

export const assetPackageFiles = (a: Asset) => [
  { name: `${a.title}.png`, note: "长图原图" },
  { name: "内容说明.pdf", note: "素材说明" },
  { name: "推荐转发文案.txt", note: "可直接复制使用" },
  { name: "风险提示与免责声明.txt", note: "合规说明" },
];

export const CATEGORY_THEMES: Record<string, string> = {
  基金: "基金类型 · 风险认知 · 交易规则",
  理财: "风险测评 · 风险等级 · 购买自检",
  保险: "保障缺口 · 家庭顺序 · 产品差异",
  信贷: "借贷决策 · 还款能力 · 用途边界",
  养老: "支出估算 · 医疗弹性 · 代际平衡",
};

export const findAsset = (assets: Asset[], id: string) => assets.find((a) => a.id === id);

export const topicCover = (assets: Asset[], t: Topic) =>
  findAsset(assets, t.coverId ?? t.assetIds[0])?.cover;

export const topicPackageFiles = (assets: Asset[], t: Topic) => [
  { name: "专题说明.pdf", note: "专题包含逻辑与适用场景" },
  ...t.assetIds.map((aid, i) => ({
    name: `素材 ${i + 1}：${findAsset(assets, aid)?.title ?? aid}.png`,
    note: "长图原图",
  })),
  { name: "配套转发文案.txt", note: "整体与单篇文案" },
  { name: "风险提示与免责声明.txt", note: "合规说明" },
];

export const topicCountForAsset = (topics: Topic[], assetId: string) =>
  topics.filter((t) => t.assetIds.includes(assetId)).length;
