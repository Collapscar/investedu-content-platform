import { createContext, useContext } from "react";
import { LayoutGrid, FolderOpen, Package, Search, User, Images, Boxes, Users, ShieldCheck, Check, ChevronDown, Tags } from "lucide-react";
import { Input } from "./ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuItem,
} from "./ui/dropdown-menu";

export type Role = "manager" | "admin";

/* ==================== 工作台上下文（供 TopBar 头像菜单切换工作台） ==================== */
// availableRoles：当前账号有权进入的工作台。客户经理账号仅含 "manager"，管理员账号含两者。
type RoleCtx = { role: Role; switchRole: (r: Role) => void; availableRoles: Role[] };
const RoleContext = createContext<RoleCtx | null>(null);

export function RoleProvider({ value, children }: { value: RoleCtx; children: React.ReactNode }) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

function useRole() {
  return useContext(RoleContext);
}
export type PageKey =
  | "portal" | "assets" | "topics"            // 客户经理端
  | "admin-assets" | "admin-topics" | "admin-categories"; // 管理员后台

/** 平台 Logo：蓝底圆角方块，承载一枚由「向上箭头 + 视线圆点」组成的标记，象征「认知 → 增长」的投教价值 */
function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="知投">
      <rect width="28" height="28" rx="7" fill="#1664FF" />
      {/* 向上的认知折线（知识增长） */}
      <path d="M7 18.5l4.2-4.4 3.1 2.6L21 10.5" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      {/* 终点高亮圆点（洞察 / 看懂） */}
      <circle cx="21" cy="10.5" r="2.1" fill="#FFFFFF" />
      <circle cx="21" cy="10.5" r="0.9" fill="#1664FF" />
    </svg>
  );
}

type NavItem = { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_MANAGER: NavItem[] = [
  { key: "portal", label: "内容资产", icon: LayoutGrid },
  { key: "assets", label: "素材库", icon: FolderOpen },
  { key: "topics", label: "专题包", icon: Package },
];

const NAV_ADMIN: NavItem[] = [
  { key: "admin-assets", label: "素材管理", icon: Images },
  { key: "admin-topics", label: "专题包管理", icon: Boxes },
  { key: "admin-categories", label: "品类管理", icon: Tags },
];

export function SidebarNav({
  role, active, onChange,
}: {
  role: Role;
  active: PageKey;
  onChange: (k: PageKey) => void;
}) {
  const isAdmin = role === "admin";
  const nav = isAdmin ? NAV_ADMIN : NAV_MANAGER;
  const home: PageKey = isAdmin ? "admin-assets" : "portal";
  const tagline = isAdmin ? "维护素材、专题包、品类" : "查找、预览、下载内容";

  return (
    <aside className="w-[208px] shrink-0 bg-card border-r border-border flex flex-col">
      <button onClick={() => onChange(home)} className="px-4 h-14 border-b border-border flex items-center gap-2.5 text-left hover:bg-muted/40 transition">
        <BrandLogo size={28} />
        <div className="leading-tight min-w-0">
          <div className="truncate text-[15px]" style={{ fontWeight: 700, letterSpacing: "0.5px" }}>知投</div>
          <div className="text-[10.5px] text-muted-foreground">金融投教内容资产平台</div>
        </div>
      </button>

      {/* 当前所处端 */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {isAdmin ? <ShieldCheck className="size-3.5 text-primary" /> : <Users className="size-3.5 text-primary" />}
          <span>{isAdmin ? "管理员后台" : "客户经理端"}</span>
        </div>
        <div className="text-[10.5px] text-muted-foreground/80 mt-0.5 leading-tight">{tagline}</div>
      </div>

      <nav className="px-2 py-2 flex-1">
        <ul className="space-y-0.5">
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <li key={key}>
                <button
                  onClick={() => onChange(key)}
                  className={`relative w-full flex items-center gap-3 rounded-md pl-4 pr-3 h-11 text-left transition-colors ${
                    isActive
                      ? "bg-[var(--primary-light)] text-primary"
                      : "text-[#4e5969] hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />}
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1 text-[14px]" style={{ fontWeight: isActive ? 600 : 500 }}>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
        展示平台所有内容
      </div>
    </aside>
  );
}

export function TopBar({
  title, subtitle, actions, searchNode,
}: { title: string; subtitle?: string; actions?: React.ReactNode; searchNode?: React.ReactNode }) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0 min-w-0">
      <div className="min-w-0 max-w-[260px] hidden min-[900px]:block">
        <div className="flex items-baseline gap-2">
          <h2 className="truncate text-[15px]" style={{ fontWeight: 600 }}>{title}</h2>
        </div>
        {subtitle && <div className="text-[11.5px] text-muted-foreground truncate leading-tight">{subtitle}</div>}
      </div>

      <div className="flex-1 min-w-0 flex justify-center">
        {searchNode ?? (
          <div className="relative w-full max-w-[520px] min-w-0">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索素材标题、或专题包名称" className="pl-9 h-9 bg-[var(--input-background)] border-border" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <AccountMenu />
      </div>
    </header>
  );
}

// 当前身份展示文案（头像旁）
const IDENTITY: Record<Role, { title: string; sub: string }> = {
  manager: { title: "客户经理", sub: "内容使用" },
  admin: { title: "管理员", sub: "内容管理" },
};

// 工作台入口文案（下拉项）
const WORKBENCH: Record<Role, { title: string; desc: string; Icon: React.ComponentType<{ className?: string }> }> = {
  manager: { title: "客户经理端", desc: "查找、预览、下载内容", Icon: Users },
  admin: { title: "管理后台", desc: "维护素材、专题包、品类", Icon: ShieldCheck },
};

const ROLE_ORDER: Role[] = ["manager", "admin"];

/** 右上角头像：展示当前工作台，并在有权限的工作台之间切换 */
function AccountMenu() {
  const ctx = useRole();
  const role = ctx?.role ?? "manager";
  const isAdmin = role === "admin";
  const id = IDENTITY[role];

  const avatar = (
    <span className="size-9 rounded-full bg-[var(--primary-light)] text-primary grid place-items-center">
      {isAdmin ? <ShieldCheck className="size-[18px]" /> : <User className="size-[18px]" />}
    </span>
  );

  // 未包裹在 RoleProvider 中、或账号仅有单一工作台权限时，降级为纯展示头像（不可切换）
  const switchable = ctx && ctx.availableRoles.length > 1;
  if (!switchable) {
    return (
      <div className="flex items-center gap-1.5 h-9 pl-1 pr-2">
        {avatar}
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[12px]" style={{ fontWeight: 600 }}>{id.title}</span>
          <span className="text-[10px] text-muted-foreground">{id.sub}</span>
        </span>
      </div>
    );
  }

  const entries = ROLE_ORDER.filter((r) => ctx!.availableRoles.includes(r));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button title="切换工作台" className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-full hover:bg-muted/60 transition">
          {avatar}
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[12px]" style={{ fontWeight: 600 }}>{id.title}</span>
            <span className="text-[10px] text-muted-foreground">{id.sub}</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[232px] p-1.5">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground px-2">切换工作台</DropdownMenuLabel>
        {entries.map((r) => (
          <WorkbenchItem key={r} active={role === r} role={r} onSelect={() => ctx!.switchRole(r)} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkbenchItem({ active, role, onSelect }: { active: boolean; role: Role; onSelect: () => void }) {
  const w = WORKBENCH[role];
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className={`group relative gap-2.5 py-2 pl-3 my-0.5 rounded-md cursor-pointer ${
        active ? "bg-[#EFF6FF] focus:bg-[#EFF6FF]" : "bg-white focus:bg-[#F1F5F9]"
      }`}
    >
      {/* 选中态左侧蓝色竖线 */}
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#2563EB]" />}
      <span className={`size-8 rounded-md grid place-items-center shrink-0 ${active ? "bg-[#DBEAFE]" : "bg-[#F3F4F6]"}`}>
        <w.Icon className={`size-4 ${active ? "text-[#2563EB]" : "text-[#6B7280]"}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-[#111827]" style={{ fontWeight: active ? 600 : 500 }}>{w.title}</span>
        <span className={`block text-[11px] text-[#6B7280] ${active ? "" : "group-focus:text-[#64748B]"}`}>{w.desc}</span>
      </span>
      {/* 选中态右侧蓝色对勾 */}
      {active && <Check className="size-4 text-[#2563EB] shrink-0" />}
    </DropdownMenuItem>
  );
}
