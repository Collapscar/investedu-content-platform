export const CHANNELS_ALL = ["基金", "理财", "黄金", "信贷", "保险", "养老", "代发", "跨品类"];

export type Scene = "客户咨询" | "主题宣传" | "风险教育" | "节日活动";
export const SCENES: Scene[] = ["客户咨询", "主题宣传", "风险教育", "节日活动"];

export type Category = {
  name: string;
  coverageContent: string;
};

export type Asset = {
  id: string;
  title: string;
  cat: string;
  question: string;
  summary: string;
  risk: string;
  cover: string;
  scene: Scene;
  updated: string;
  audience: string;
  useWhen: string;
  talkTip: string;
  downloads: number;
};

export type Topic = {
  id: string;
  name: string;
  channel: string;
  assetIds: string[];
  scene: Scene;
  audience: string;
  goal: string;
  tagline: string;
  updated: string;
  url: string;
  combineReason: string;
  sendMode: "一次发送" | "分次发送";
  sendOrder: string;
  talkBoundary: string;
  coverId?: string;
  sceneGroup: string;
  downloads: number;
};

const AUDIENCE_BY_CAT: Record<string, string> = {
  基金: "咨询基金、想了解基金类型的客户",
  理财: "首次购买理财、关注风险测评的客户",
  保险: "关注家庭保障与缺口梳理的客户",
  信贷: "有借贷需求、关注还款能力的客户",
  养老: "关注养老规划与现金流安排的客户",
  黄金: "关注黄金投资形式、交易成本与价格波动的客户",
  代发: "使用工资账户、关注薪资管理与权益保护的客户",
};

const USEWHEN_BY_CAT: Record<string, string> = {
  基金: "客户首次咨询基金品类、或对基金风险有疑问时",
  理财: "客户首次购买理财、签约前完成风险测评环节",
  保险: "家庭保障盘点、年度保单复核或新增成员场景",
  信贷: "贷款受理前的需求与还款能力沟通环节",
  养老: "客户开始关注养老规划、临近退休或家庭代际财务沟通时",
  黄金: "客户咨询黄金产品、准备交易或复盘黄金配置时",
  代发: "客户办理或使用工资账户、核对收入及安排月度现金流时",
};

const TALK_BY_CAT: Record<string, string> = {
  基金: "重点带客户看清投资方向与波动特征，不与历史业绩挂钩",
  理财: "强调先测评再决策，避免代替客户填写测评",
  保险: "聚焦缺口梳理与责任顺序，不替客户决定具体产品",
  信贷: "结合客户实际现金流做一次压力测试，避免只看月供",
  养老: "强调长期规划与弹性，避免与具体收益率挂钩",
  黄金: "讲清产品形式、价差费用和波动风险，不判断金价走势或提供买卖点",
  代发: "引导客户核对正式规则并保护账户与收入信息，不承诺专属权益或审批结果",
};

export const catDefaults = (cat: string): Pick<Asset, "audience" | "useWhen" | "talkTip"> => ({
  audience: AUDIENCE_BY_CAT[cat] ?? "有相关需求的客户",
  useWhen: USEWHEN_BY_CAT[cat] ?? "对应客户咨询场景",
  talkTip: TALK_BY_CAT[cat] ?? "以正式材料为准，避免主观引申",
});

export type CategoryPayload = Category;
export type AssetPayload = Omit<Asset, "downloads"> & { downloads?: number };
export type TopicPayload = Omit<Topic, "downloads"> & { downloads?: number };

export type AssetDescriptionRequest = {
  title?: string;
  cat?: string;
  scene?: string;
  fileName?: string;
  cover?: string;
  question?: string;
  summary?: string;
  audience?: string;
  useWhen?: string;
  talkTip?: string;
  risk?: string;
};

export type AssetDescriptionSuggestion = Partial<
  Pick<Asset, "title" | "question" | "summary" | "audience" | "useWhen" | "talkTip" | "risk" | "scene">
>;

export type TopicDescriptionRequest = {
  name?: string;
  channel?: string;
  scene?: string;
  sceneGroup?: string;
  audience?: string;
  goal?: string;
  tagline?: string;
  combineReason?: string;
  sendMode?: string;
  sendOrder?: string;
  talkBoundary?: string;
  assets: Pick<Asset, "id" | "title" | "cat" | "question" | "summary" | "scene">[];
};

export type TopicDescriptionSuggestion = Partial<
  Pick<Topic, "name" | "tagline" | "audience" | "goal" | "combineReason" | "sendMode" | "sendOrder" | "talkBoundary" | "scene" | "sceneGroup">
>;

export type DownloadResponse = {
  id: string;
  type: "asset" | "topic";
  downloadUrl: string;
  downloads: number;
};

export type SearchResponse = {
  assets: Asset[];
  topics: Topic[];
};
