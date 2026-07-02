import { useCallback, useEffect, useState } from "react";
import { contentApi, downloadZipFile } from "../services/api";
import type { Asset, Category, Topic } from "../types/content";

export function usePlatformStore() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextAssets, nextTopics] = await Promise.all([
        contentApi.listCategories(),
        contentApi.listAssets(),
        contentApi.listTopics(),
      ]);
      setCategories(nextCategories);
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

  const addCategory = (category: Category) => {
    void contentApi.createCategory(category).then((saved) => {
      setCategories((prev) => [...prev.filter((item) => item.name !== saved.name), saved]);
    });
  };

  const updateCategory = (name: string, patch: Partial<Category>) => {
    const current = categories.find((category) => category.name === name);
    if (!current) return;

    const optimistic = { ...current, ...patch };
    setCategories((prev) => prev.map((item) => (item.name === name ? optimistic : item)));
    if (optimistic.name !== name) {
      setAssets((prev) => prev.map((asset) => (asset.cat === name ? { ...asset, cat: optimistic.name } : asset)));
      setTopics((prev) => prev.map((topic) => (topic.channel === name ? { ...topic, channel: optimistic.name } : topic)));
    }

    void contentApi.updateCategory(name, optimistic).then((saved) => {
      setCategories((prev) => prev.map((item) => (item.name === optimistic.name ? saved : item)));
      if (saved.name !== optimistic.name) {
        setAssets((prev) => prev.map((asset) => (asset.cat === optimistic.name ? { ...asset, cat: saved.name } : asset)));
        setTopics((prev) => prev.map((topic) => (topic.channel === optimistic.name ? { ...topic, channel: saved.name } : topic)));
      }
    });
  };

  const deleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((item) => item.name !== name));
    void contentApi.deleteCategory(name);
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
    categories,
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
    addCategory,
    updateCategory,
    deleteCategory,
    downloadAsset,
    downloadTopic,
  };
}

export type PlatformStore = ReturnType<typeof usePlatformStore>;
