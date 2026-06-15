import { useCallback, useEffect, useState } from "react";
import { contentApi, downloadZipFile } from "../services/api";
import type { Asset, Topic } from "../types/content";

export function usePlatformStore() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextAssets, nextTopics] = await Promise.all([
        contentApi.listAssets(),
        contentApi.listTopics(),
      ]);
      setAssets(nextAssets);
      setTopics(nextTopics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addAsset = (asset: Asset) => {
    void contentApi.createAsset(asset).then((saved) => {
      setAssets((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    });
  };

  const updateAsset = (id: string, patch: Partial<Asset>) => {
    const current = assets.find((asset) => asset.id === id);
    if (!current) return;

    const optimistic = { ...current, ...patch };
    setAssets((prev) => prev.map((item) => (item.id === id ? optimistic : item)));

    void contentApi.updateAsset(id, optimistic).then((saved) => {
      setAssets((prev) => prev.map((item) => (item.id === id ? saved : item)));
    });
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
    setTopics((prev) => prev.map((topic) => ({
      ...topic,
      assetIds: topic.assetIds.filter((assetId) => assetId !== id),
    })));
    void contentApi.deleteAsset(id).then(refresh);
  };

  const addTopic = (topic: Topic) => {
    void contentApi.createTopic(topic).then((saved) => {
      setTopics((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    });
  };

  const updateTopic = (id: string, patch: Partial<Topic>) => {
    const current = topics.find((topic) => topic.id === id);
    if (!current) return;

    const optimistic = { ...current, ...patch };
    setTopics((prev) => prev.map((item) => (item.id === id ? optimistic : item)));

    void contentApi.updateTopic(id, optimistic).then((saved) => {
      setTopics((prev) => prev.map((item) => (item.id === id ? saved : item)));
    });
  };

  const deleteTopic = (id: string) => {
    setTopics((prev) => prev.filter((item) => item.id !== id));
    void contentApi.deleteTopic(id);
  };

  const downloadAsset = (asset: Asset) => {
    void (async () => {
      try {
        const result = await contentApi.downloadAsset(asset.id);
        await downloadZipFile(result.downloadUrl, `${asset.id}-素材包.zip`);
        setAssets((prev) => prev.map((item) => (
          item.id === asset.id ? { ...item, downloads: result.downloads } : item
        )));
      } catch (err) {
        setError(err instanceof Error ? err.message : "下载素材包失败");
      }
    })();
  };

  const downloadTopic = (topic: Topic) => {
    void (async () => {
      try {
        const result = await contentApi.downloadTopic(topic.id);
        await downloadZipFile(result.downloadUrl, `${topic.id}-专题包.zip`);
        setTopics((prev) => prev.map((item) => (
          item.id === topic.id ? { ...item, downloads: result.downloads } : item
        )));
      } catch (err) {
        setError(err instanceof Error ? err.message : "下载专题包失败");
      }
    })();
  };

  return {
    assets,
    topics,
    loading,
    error,
    refresh,
    addAsset,
    updateAsset,
    deleteAsset,
    addTopic,
    updateTopic,
    deleteTopic,
    downloadAsset,
    downloadTopic,
  };
}

export type PlatformStore = ReturnType<typeof usePlatformStore>;
