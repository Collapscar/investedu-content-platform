import http from "node:http";
import os from "node:os";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "frontend/dist");
const coverDir = path.join(root, "backend/storage/covers");
const seedFile = path.join(root, "backend/src/main/java/com/investedu/platform/config/DataInitializer.java");
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";

const source = await fs.readFile(seedFile, "utf8");

const riskMap = Object.fromEntries(
  [...source.matchAll(/private static final String (RISK_[A-Z]+) = "([^"]+)";/g)]
    .map((m) => [m[1], m[2]]),
);

const audience = {
  基金: "咨询基金、想了解基金类型的客户",
  理财: "首次购买理财、关注风险测评的客户",
  保险: "关注家庭保障与缺口梳理的客户",
  信贷: "有借贷需求、关注还款能力的客户",
  养老: "关注养老规划与现金流安排的客户",
};
const useWhen = {
  基金: "客户首次咨询基金品类、或对基金风险有疑问时",
  理财: "客户首次购买理财、签约前完成风险测评环节",
  保险: "家庭保障盘点、年度保单复核或新增成员场景",
  信贷: "贷款受理前的需求与还款能力沟通环节",
  养老: "客户开始关注养老规划、临近退休或家庭代际财务沟通时",
};
const talkTip = {
  基金: "重点带客户看清投资方向与波动特征，不与历史业绩挂钩",
  理财: "强调先测评再决策，避免代替客户填写测评",
  保险: "聚焦缺口梳理与责任顺序，不替客户决定具体产品",
  信贷: "结合客户实际现金流做一次压力测试，避免只看月供",
  养老: "强调长期规划与弹性，避免与具体收益率挂钩",
};

function seedDownloads(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 36 + (h % 320);
}

function splitArgs(text) {
  const out = [];
  let cur = "";
  let inString = false;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\"" && text[i - 1] !== "\\") inString = !inString;
    if (!inString) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function valueOf(token) {
  const trimmed = token.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) return trimmed.slice(1, -1);
  if (riskMap[trimmed]) return riskMap[trimmed];
  if (trimmed.startsWith("List.of(")) return [...trimmed.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  return trimmed;
}

function readSeedLines(prefix) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(`${prefix}(`));
}

let assets = readSeedLines("asset").map((line) => {
  const body = line.replace(/^asset\(/, "").replace(/\),?$/, "");
  const [id, title, cat, question, summary, risk, scene, updated] = splitArgs(body).map(valueOf);
  return {
    id,
    title,
    cat,
    question,
    summary,
    risk,
    cover: `/api/v1/storage/covers/${id}.png`,
    scene,
    updated,
    audience: audience[cat] ?? "有相关需求的客户",
    useWhen: useWhen[cat] ?? "对应客户咨询场景",
    talkTip: talkTip[cat] ?? "以正式材料为准，避免主观引申",
    downloads: seedDownloads(id),
  };
});

let topics = readSeedLines("topic").map((line) => {
  const body = line.replace(/^topic\(/, "").replace(/\),?$/, "");
  const [
    id,
    name,
    channel,
    sceneGroup,
    assetIds,
    scene,
    audienceText,
    goal,
    tagline,
    updated,
    combineReason,
    sendMode,
    sendOrder,
    talkBoundary,
  ] = splitArgs(body).map(valueOf);
  return {
    id,
    name,
    channel,
    assetIds,
    scene,
    audience: audienceText,
    goal,
    tagline,
    updated,
    url: `https://h5.invested.cn/t/${String(id).toLowerCase()}`,
    combineReason,
    sendMode,
    sendOrder,
    talkBoundary,
    sceneGroup,
    downloads: seedDownloads(id),
  };
});

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function zip(entries) {
  const files = [];
  const central = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8");
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    files.push(local, name, data);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(dosTime, 12);
    header.writeUInt16LE(dosDate, 14);
    header.writeUInt32LE(checksum, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);
    offset += local.length + name.length + data.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...files, ...central, end]);
}

async function standardZip(entries) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "investedu-package-"));
  const zipPath = path.join(tempDir, "package.zip");
  try {
    for (const entry of entries) {
      await fs.writeFile(path.join(tempDir, entry.name), entry.data);
    }
    execFileSync("/usr/bin/zip", ["-q", "-r", zipPath, "."], { cwd: tempDir });
    return await fs.readFile(zipPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function assetPackage(asset) {
  const entries = [
    {
      name: "content-info.txt",
      data: [
        `素材编号：${asset.id}`,
        `素材标题：${asset.title}`,
        `所属品类：${asset.cat}`,
        `客户问题：${asset.question}`,
        `核心摘要：${asset.summary}`,
        `适用场景：${asset.scene}`,
        `适用对象：${asset.audience}`,
        `更新时间：${asset.updated}`,
      ].join("\n"),
    },
    {
      name: "forward-copy.txt",
      data: `【${asset.title}】\n${asset.summary}\n「${asset.question}」——点开这张图，一看就懂。\n（${asset.risk.split("；")[0]}。）`,
    },
    {
      name: "risk-disclaimer.txt",
      data: `${asset.risk}\n本资料仅用于投资者教育，不构成投资建议；投资有风险，决策需谨慎。`,
    },
  ];
  const coverPath = path.join(coverDir, `${asset.id}.png`);
  if (fssync.existsSync(coverPath)) {
    entries.unshift({ name: `${asset.id}.png`, data: await fs.readFile(coverPath) });
  }
  return standardZip(entries);
}

async function topicPackage(topic) {
  const topicAssets = topic.assetIds.map((id) => assets.find((asset) => asset.id === id)).filter(Boolean);
  const entries = [
    {
      name: "topic-info.txt",
      data: [
        `专题编号：${topic.id}`,
        `专题名称：${topic.name}`,
        `所属品类：${topic.channel}`,
        `适用场景：${topic.scene}`,
        `适用对象：${topic.audience}`,
        `内容目标：${topic.goal}`,
        `组合说明：${topic.combineReason}`,
        `推荐使用方式：${topic.sendMode}`,
        `推荐使用顺序：${topic.sendOrder}`,
        `讲解边界：${topic.talkBoundary}`,
      ].join("\n"),
    },
    {
      name: "forward-copy.txt",
      data: `${topic.name}\n${topic.tagline}\n${topicAssets.map((asset) => `· ${asset.title}`).join("\n")}`,
    },
    {
      name: "risk-disclaimer.txt",
      data: "本资料仅用于投资者教育，不构成投资建议；投资有风险，决策需谨慎。",
    },
  ];

  for (const [index, asset] of topicAssets.entries()) {
    const coverPath = path.join(coverDir, `${asset.id}.png`);
    if (fssync.existsSync(coverPath)) {
      entries.push({ name: `asset-${String(index + 1).padStart(2, "0")}-${asset.id}.png`, data: await fs.readFile(coverPath) });
    }
  }
  return standardZip(entries);
}

function sendJson(res, value, status = 200) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function notFound(res) {
  sendJson(res, { message: "Not found" }, 404);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function filterAsset(asset, url) {
  const keyword = url.searchParams.get("keyword");
  const cat = url.searchParams.get("cat");
  const scene = url.searchParams.get("scene");
  return (!keyword || [asset.title, asset.question, asset.summary].some((value) => value?.includes(keyword)))
    && (!cat || asset.cat === cat)
    && (!scene || asset.scene === scene);
}

function filterTopic(topic, url) {
  const keyword = url.searchParams.get("keyword");
  const channel = url.searchParams.get("channel");
  const scene = url.searchParams.get("scene");
  return (!keyword || [topic.name, topic.tagline, topic.goal].some((value) => value?.includes(keyword)))
    && (!channel || topic.channel === channel)
    && (!scene || topic.scene === scene);
}

async function serveFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".js"
        ? "text/javascript; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".png"
            ? "image/png"
            : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Content-Length": data.length });
    res.end(data);
  } catch {
    notFound(res);
  }
}

function sendZip(res, filename, body, headOnly = false) {
  const encoded = encodeURIComponent(filename);
  const fallbackName = filename.replace(/[^\w.-]+/g, "_");
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encoded}`,
    "X-Content-Type-Options": "nosniff",
    "Content-Length": body.length,
  });
  res.end(headOnly ? undefined : body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === "/api/v1/assets" && req.method === "GET") return sendJson(res, assets.filter((asset) => filterAsset(asset, url)));
    if (url.pathname === "/api/v1/topics" && req.method === "GET") return sendJson(res, topics.filter((topic) => filterTopic(topic, url)));
    if (url.pathname === "/api/v1/search" && req.method === "GET") {
      const keyword = url.searchParams.get("keyword") ?? "";
      return sendJson(res, {
        assets: keyword ? assets.filter((asset) => filterAsset(asset, url)).slice(0, 10) : [],
        topics: keyword ? topics.filter((topic) => filterTopic(topic, url)).slice(0, 10) : [],
      });
    }

    let match;
    if ((match = url.pathname.match(/^\/api\/v1\/assets\/([^/]+)$/)) && req.method === "GET") {
      const id = decodeURIComponent(match[1]);
      const asset = assets.find((item) => item.id === id);
      return asset ? sendJson(res, asset) : notFound(res);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/topics\/([^/]+)$/)) && req.method === "GET") {
      const id = decodeURIComponent(match[1]);
      const topic = topics.find((item) => item.id === id);
      return topic ? sendJson(res, topic) : notFound(res);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/assets\/([^/]+)\/download$/)) && req.method === "POST") {
      const id = decodeURIComponent(match[1]);
      const asset = assets.find((item) => item.id === id);
      if (!asset) return notFound(res);
      asset.downloads++;
      return sendJson(res, { id, type: "asset", downloadUrl: `/api/v1/assets/${id}/package`, downloads: asset.downloads });
    }
    if ((match = url.pathname.match(/^\/api\/v1\/topics\/([^/]+)\/download$/)) && req.method === "POST") {
      const id = decodeURIComponent(match[1]);
      const topic = topics.find((item) => item.id === id);
      if (!topic) return notFound(res);
      topic.downloads++;
      return sendJson(res, { id, type: "topic", downloadUrl: `/api/v1/topics/${id}/package`, downloads: topic.downloads });
    }
    if ((match = url.pathname.match(/^\/api\/v1\/assets\/([^/]+)\/package$/)) && (req.method === "GET" || req.method === "HEAD")) {
      const id = decodeURIComponent(match[1]);
      const asset = assets.find((item) => item.id === id);
      if (!asset) return notFound(res);
      return sendZip(res, `${id}-素材包.zip`, await assetPackage(asset), req.method === "HEAD");
    }
    if ((match = url.pathname.match(/^\/api\/v1\/topics\/([^/]+)\/package$/)) && (req.method === "GET" || req.method === "HEAD")) {
      const id = decodeURIComponent(match[1]);
      const topic = topics.find((item) => item.id === id);
      if (!topic) return notFound(res);
      return sendZip(res, `${id}-专题包.zip`, await topicPackage(topic), req.method === "HEAD");
    }
    if ((match = url.pathname.match(/^\/api\/v1\/storage\/covers\/(.+)$/)) && req.method === "GET") {
      return serveFile(res, path.join(coverDir, decodeURIComponent(match[1])));
    }

    if (url.pathname === "/api/v1/admin/assets" && req.method === "POST") {
      const body = await parseBody(req);
      const id = body.id || `AST-${String(assets.length + 1).padStart(3, "0")}`;
      const saved = { downloads: 0, updated: new Date().toISOString().slice(0, 10), ...body, id };
      assets = [saved, ...assets.filter((asset) => asset.id !== id)];
      return sendJson(res, saved, 201);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/admin\/assets\/([^/]+)$/)) && req.method === "PUT") {
      const id = decodeURIComponent(match[1]);
      const body = await parseBody(req);
      assets = assets.map((asset) => (asset.id === id ? { ...asset, ...body, id } : asset));
      return sendJson(res, assets.find((asset) => asset.id === id) ?? body);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/admin\/assets\/([^/]+)$/)) && req.method === "DELETE") {
      const id = decodeURIComponent(match[1]);
      assets = assets.filter((asset) => asset.id !== id);
      topics = topics.map((topic) => ({ ...topic, assetIds: topic.assetIds.filter((assetId) => assetId !== id) }));
      res.writeHead(204);
      res.end();
      return;
    }
    if (url.pathname === "/api/v1/admin/topics" && req.method === "POST") {
      const body = await parseBody(req);
      const id = body.id || `T${String(topics.length + 1).padStart(3, "0")}`;
      const saved = { downloads: 0, updated: new Date().toISOString().slice(0, 10), ...body, id };
      topics = [saved, ...topics.filter((topic) => topic.id !== id)];
      return sendJson(res, saved, 201);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/admin\/topics\/([^/]+)$/)) && req.method === "PUT") {
      const id = decodeURIComponent(match[1]);
      const body = await parseBody(req);
      topics = topics.map((topic) => (topic.id === id ? { ...topic, ...body, id } : topic));
      return sendJson(res, topics.find((topic) => topic.id === id) ?? body);
    }
    if ((match = url.pathname.match(/^\/api\/v1\/admin\/topics\/([^/]+)$/)) && req.method === "DELETE") {
      const id = decodeURIComponent(match[1]);
      topics = topics.filter((topic) => topic.id !== id);
      res.writeHead(204);
      res.end();
      return;
    }

    const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    let filePath = path.normalize(path.join(distDir, requested));
    if (!filePath.startsWith(distDir) || !fssync.existsSync(filePath) || fssync.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, "index.html");
    }
    return serveFile(res, filePath);
  } catch (err) {
    sendJson(res, { message: err instanceof Error ? err.message : String(err) }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`Preview server: http://${host}:${port}`);
  console.log(`Assets: ${assets.length}, Topics: ${topics.length}`);
});
