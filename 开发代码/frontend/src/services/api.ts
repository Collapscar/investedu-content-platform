import type {
  Asset,
  AssetDescriptionRequest,
  AssetDescriptionSuggestion,
  AssetPayload,
  Category,
  CategoryPayload,
  DownloadResponse,
  Topic,
  TopicDescriptionRequest,
  TopicDescriptionSuggestion,
  TopicPayload,
} from "../types/content";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type RequestOptions = RequestInit & {
  admin?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.admin) {
    headers.set("X-Role", "admin");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const contentApi = {
  listCategories: () => request<Category[]>("/categories"),
  listAssets: () => request<Asset[]>("/assets"),
  getAsset: (id: string) => request<Asset>(`/assets/${encodeURIComponent(id)}`),
  listTopics: () => request<Topic[]>("/topics"),
  getTopic: (id: string) => request<Topic>(`/topics/${encodeURIComponent(id)}`),
  downloadAsset: (id: string) =>
    request<DownloadResponse>(`/assets/${encodeURIComponent(id)}/download`, { method: "POST" }),
  downloadTopic: (id: string) =>
    request<DownloadResponse>(`/topics/${encodeURIComponent(id)}/download`, { method: "POST" }),

  createAsset: (payload: AssetPayload) =>
    request<Asset>("/admin/assets", { method: "POST", body: JSON.stringify(payload), admin: true }),
  updateAsset: (id: string, payload: AssetPayload) =>
    request<Asset>(`/admin/assets/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      admin: true,
    }),
  deleteAsset: (id: string) =>
    request<void>(`/admin/assets/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),

  createTopic: (payload: TopicPayload) =>
    request<Topic>("/admin/topics", { method: "POST", body: JSON.stringify(payload), admin: true }),
  updateTopic: (id: string, payload: TopicPayload) =>
    request<Topic>(`/admin/topics/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      admin: true,
    }),
  deleteTopic: (id: string) =>
    request<void>(`/admin/topics/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),

  createCategory: (payload: CategoryPayload) =>
    request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(payload), admin: true }),
  updateCategory: (name: string, payload: CategoryPayload) =>
    request<Category>(`/admin/categories/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      admin: true,
    }),
  deleteCategory: (name: string) =>
    request<void>(`/admin/categories/${encodeURIComponent(name)}`, { method: "DELETE", admin: true }),

  generateAssetDescription: (payload: AssetDescriptionRequest, signal?: AbortSignal) =>
    request<AssetDescriptionSuggestion>("/admin/ai/assets/description", {
      method: "POST",
      body: JSON.stringify(payload),
      admin: true,
      signal,
    }),
  generateTopicDescription: (payload: TopicDescriptionRequest, signal?: AbortSignal) =>
    request<TopicDescriptionSuggestion>("/admin/ai/topics/description", {
      method: "POST",
      body: JSON.stringify(payload),
      admin: true,
      signal,
    }),

  uploadCover: (file: File, signal?: AbortSignal) => {
    const form = new FormData();
    form.set("file", file);
    return request<{ publicUrl: string }>("/admin/files/covers", {
      method: "POST",
      body: form,
      admin: true,
      signal,
    });
  },
};

function resolveRuntimeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = new URL(API_BASE, window.location.origin);
  if (url.startsWith("/")) {
    return new URL(url, base.origin).toString();
  }

  const baseHref = base.href.endsWith("/") ? base.href : `${base.href}/`;
  return new URL(url, baseHref).toString();
}

function ensureZipFilename(filename: string) {
  return filename.toLowerCase().endsWith(".zip") ? filename : `${filename}.zip`;
}

function isZipPayload(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function describeNonZipPayload(buffer: ArrayBuffer) {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, 300)).trim();
  return text || "服务器没有返回 ZIP 文件";
}

export async function downloadZipFile(url: string, filename: string) {
  const response = await fetch(resolveRuntimeUrl(url), {
    headers: {
      Accept: "application/zip,application/octet-stream,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`下载失败：${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  if (!isZipPayload(buffer)) {
    throw new Error(`下载包生成异常：${describeNonZipPayload(buffer)}`);
  }

  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = ensureZipFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
