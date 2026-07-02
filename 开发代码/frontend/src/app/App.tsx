// 知投 — 金融投教内容资产平台：客户经理端 + 管理员后台（工作台在右上角头像切换）
import { useState } from "react";
import { SidebarNav, RoleProvider, type PageKey, type Role } from "./components/sidebar-nav";
import {
  ContentAssetsPage,
  AssetsPage,
  TopicsPage,
  GlobalSearch,
} from "./components/pages";
import {
  AssetManagePage,
  CategoryManagePage,
  TopicManagePage,
} from "./components/admin-pages";
import { usePlatformStore } from "./components/data";

export default function App() {
  const store = usePlatformStore();
  const [role, setRole] = useState<Role>("manager");
  const [page, setPage] = useState<PageKey>("portal");
  const [topicView, setTopicView] = useState<{ view: "list" | "detail"; id?: string }>({ view: "list" });
  // 素材库聚焦：从内容资产/全局搜索跳转时定位品类或具体素材（key 触发重挂载以应用初始值）
  const [assetFocus, setAssetFocus] = useState<{ cat?: string | null; id?: string | null; key: number }>({ key: 0 });

  const switchRole = (r: Role) => {
    setRole(r);
    setPage(r === "admin" ? "admin-assets" : "portal");
    setTopicView({ view: "list" });
  };

  const jumpToTopic = (id: string) => {
    setTopicView({ view: "detail", id });
    setPage("topics");
  };

  const viewCategory = (cat: string) => {
    setAssetFocus((f) => ({ cat, id: null, key: f.key + 1 }));
    setPage("assets");
  };

  const openAsset = (id: string) => {
    setAssetFocus((f) => ({ cat: null, id, key: f.key + 1 }));
    setPage("assets");
  };

  const globalSearch = (
    <GlobalSearch store={store} onPickAsset={openAsset} onPickTopic={jumpToTopic} />
  );

  return (
    <RoleProvider value={{ role, switchRole, availableRoles: ["manager", "admin"] }}>
    <div className="size-full flex bg-background text-foreground">
      <SidebarNav
        role={role}
        active={page}
        onChange={(k) => { setPage(k); if (k === "topics") setTopicView({ view: "list" }); }}
      />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 客户经理端 */}
        {page === "portal" && (
          <ContentAssetsPage
            store={store}
            onGoAssets={() => { setAssetFocus((f) => ({ cat: null, id: null, key: f.key + 1 })); setPage("assets"); }}
            onGoTopics={() => { setTopicView({ view: "list" }); setPage("topics"); }}
            onViewCategory={viewCategory}
            onOpenAsset={openAsset}
            onOpenTopic={jumpToTopic}
            searchNode={globalSearch}
          />
        )}
        {page === "assets" && (
          <AssetsPage
            key={assetFocus.key}
            store={store}
            initialCat={assetFocus.cat}
            initialSelected={assetFocus.id}
            searchNode={globalSearch}
          />
        )}
        {page === "topics" && (
          <TopicsPage
            store={store}
            viewState={topicView}
            setViewState={setTopicView}
            searchNode={globalSearch}
          />
        )}

        {/* 管理员后台 */}
        {page === "admin-assets" && <AssetManagePage store={store} />}
        {page === "admin-topics" && <TopicManagePage store={store} />}
        {page === "admin-categories" && <CategoryManagePage store={store} />}
      </main>
    </div>
    </RoleProvider>
  );
}
