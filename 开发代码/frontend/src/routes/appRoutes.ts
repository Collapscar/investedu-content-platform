export const managerRoutes = [
  { key: "portal", label: "内容资产" },
  { key: "assets", label: "素材库" },
  { key: "topics", label: "专题包" },
] as const;

export const adminRoutes = [
  { key: "admin-assets", label: "素材管理" },
  { key: "admin-topics", label: "专题包管理" },
  { key: "admin-categories", label: "品类管理" },
] as const;
