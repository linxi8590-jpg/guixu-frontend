# 归墟 架构文档
> 新窗口开聊前必读。最后更新：2026-04-29

## 一、整体架构

```
前端 (Cloudflare Pages)          后端 (Vultr VPS 138.2.93.18)
guixu-frontend/                  llm-api/
├── index.html                   ├── server.js        (2186行，主文件)
├── chat.js  (5710行，核心)       ├── mcp-sse.js       (45行，记忆MCP SSE)
├── mcp.js   (MCP服务器管理)      ├── gemini-proxy.js
├── memory.js (记忆管理UI)        ├── vertex-proxy.js
├── connections.js               ├── memory.db        (SQLite)
├── imagegen.js                  └── dream_snapshot.json
├── tts.js
├── state.js / config.js
├── styles.css
├── sw.js / sw-register.js
├── dream.html / diary.html
├── memory.html / connections.html / data.html
└── manifest.json
```

**部署方式：**
- 前端：Cloudflare Pages，在 /home/ubuntu/guixu-frontend/ 用 git push 自动部署
- 后端：pm2 进程 `llm-api`（端口80）+ `browser-mcp`（端口3002）
- 域名：`api.777903.xyz` → Vultr后端
- 编辑规则：先备份 `cp server.js server.js.bak_描述`，改完 `node --check server.js && pm2 restart llm-api`

## 二、后端 server.js 模块分布

| 行号范围 | 模块 | 说明 |
|---------|------|------|
| 1-18 | 依赖导入 | express, better-sqlite3, cors, webpush, http-proxy-middleware |
| 19-45 | 记忆评分 | computeMemoryScore, sortByScore, getEffectiveImportance |
| 46-140 | 搜索系统 | parseDateFromQuery, hybridSearch（关键词+日期+语义三路搜索） |
| 142-165 | 冲突检测 | findConflictingMemory |
| 167-273 | 数据库表 | memories, dream_diary, dream_events, dream_push_tokens, dream_config |
| 239-273 | 记忆衰减 | decayDynamicBoost（每24h跑一次，30天/90天阈值） |
| 275-298 | Express配置 | CORS, body parser, /browser 反代到3002, token中间件 |
| 300-500 | 记忆CRUD | /memory, /memory/search, /memory/context, /api/memory-pin, 语义搜索, 批量导入 |
| 501-655 | Dream REST API | dream/events, dream/diary, dream/pending, dream/consume, dream/stats |
| 656-687 | 快照系统 | POST/GET /api/dream/snapshot（存/读 dream_snapshot.json） |
| 689-715 | Dream配置 | POST/GET /api/dream/config（存dream_config表） |
| 718-780 | Web Push | VAPID, push-subscribe, sendPushNotification |
| 782-920 | Keepalive工具系统 | BrowserMcpClient, executeKeepAliveTool, runToolLoop |
| 920-1000 | Keepalive工具定义 | getKeepAliveToolDefs（**现在返回空数组，统一用snapshot工具**） |
| 1000-1327 | 定时唤醒核心 | getDreamConfig, inActiveHours, cacheWarmup, keepaliveCheck, setInterval |
| 1330-1402 | MCP工具定义(旧) | MCP_TOOLS 数组（给 /mcp/execute 用的，和MCP SSE的工具独立） |
| 1404-1478 | MCP HTTP端点 | /mcp/tools, /mcp/execute（旧HTTP方式，前端MCP执行走这里） |
| 1481-1514 | OpenAI代理 | /v1/chat/completions → api.openai.com |
| 1515-1607 | Anthropic代理 | /anthropic/messages → api.anthropic.com（支持流式pipe） |
| 1609-1665 | 数据同步 | /sync/push, /sync/pull, /sync/status |
| 1666-1930 | 聊天存储 | chats/messages CRUD，批量导入，数据迁移 /api/migrate |
| 1930-1960 | 用户配置 | /api/config CRUD |
| 1960-2040 | 数据迁移 | /api/migrate（批量导入聊天记录） |
| 2040-2150 | Imagen/BFL代理 | /imagen/:action, /bfl/generate（生图代理） |
| 2186 | 启动 | app.listen(80) |

## 三、前端 chat.js 模块分布

| 行号范围 | 模块 | 说明 |
|---------|------|------|
| 1-70 | 初始化 | IIFE包裹，OpenRouter适配，日志过滤 |
| 80-230 | 服务器存储 | loadChatsFromServer, saveMessageToServer 等 |
| 249-530 | UI基础 | DOM引用，侧边栏，聊天列表渲染，重命名 |
| 533-720 | 模型面板 | 连接选择，模型切换，自定义模型 |
| 718-1300 | 消息渲染 | renderMessages, createMessageElement, formatMessageContent, 消息编辑 |
| 1326-1500 | 状态/配置 | setStatus, thinking配置面板 |
| 1508-1770 | 图片/搜索 | 图片上传预览，位置获取，网页搜索 |
| 1777-1870 | 发送入口 | handleSend（用户输入入口） |
| 1869-1960 | Dream交互 | pushDreamSnapshot, syncDreamConnection, fetchPendingMessages |
| 2002-2270 | 消息发送核心 | sendMessage（构建上下文→调API→处理工具循环→保存） |
| 2271-2350 | 上下文管理 | applyContextLimit（token限制截断），estimateTokens |
| 2354-2510 | 服务器记忆 | fetchServerMemories, searchServerMemories, buildFullInstruction |
| 2505-2575 | System Prompt | buildFullInstruction（组装时间+pending+锚点+记忆+MCP工具说明） |
| 2573-2670 | Provider适配 | normalizeProvider, buildApiUrl, getGeminiApiVersion |
| 2670-2720 | 工具支持检测 | checkToolSupport（哪些模型支持function calling） |
| 2720-2970 | 工具定义 | getToolDefinitions（web_search + get_location + 记忆工具 + MCP工具 + 生图） |
| 2971-3020 | Schema清理 | cleanSchemaForGemini, formatToolsForProvider |
| 3021-3100 | 工具执行 | executeMcpTool（HTTP→/mcp/execute），executeTool（路由分发） |
| 3100-3400 | 生图执行 | generate_image工具处理，displayGeneratedImage |
| 3407-4165 | LLM调用（工具循环） | callLLMWithTools — OpenAI/Gemini/Anthropic 三分支，各自处理工具循环 |
| 4166-4250 | 缓存策略 | applyAnthropicMessageCache, applyAnthropicSystemCache, buildOpenRouterSystemMessage |
| 4251-4470 | LLM调用（无工具） | callLLM — 备用，不走工具循环 |
| 4465-4700 | 流式调用 | callLLMStream + 三种流式解析器 |
| 4692-5100 | 流式解析器 | parseOpenAIStream, parseAnthropicStream, parseGeminiStream（含工具版和纯文本版） |
| 5101-5120 | 输入框 | autoResizeInput |
| 5108-5520 | 事件绑定 | initEventListeners（键盘快捷键，按钮，模型选择等） |
| 5274-5520 | 记忆提取 | maybeExtractMemory, extractMemoryFromChat, maybeExtractServerMemory |
| 5520-5710 | 初始化启动 | init(), urgentSync, DOMContentLoaded |

## 四、缓存系统（Prompt Caching）

**核心原理：** Anthropic按内容hash缓存前缀，cache_control标记"缓存到此位置"

**三个缓存断点（最多允许4个）：**
1. **system[1]** — 从 `[身份锚定]` 开始的静态部分（时间前缀不缓存，每次都变）
2. **tools[最后一个]** — 缓存整个工具数组
3. **messages[倒数第二条]** — 缓存历史消息，只有最新一条不缓存

**三个使用场景必须用同一套内容，否则缓存互相覆盖：**
| 场景 | 触发方式 | 工具来源 | 间隔 |
|------|---------|---------|------|
| 聊天 | 前端发请求 | 前端构建39个工具 | 用户触发 |
| cache_warmup | 后端定时 max_tokens=1 | snapshot（前端推送） | 5分钟 |
| keepalive | 后端定时完整请求 | snapshot（前端推送） | 配置intervalMinutes |

**关键规则：keepalive 不再自定义额外工具（getKeepAliveToolDefs返回[]），全部从snapshot拿，确保三者缓存一致。**

## 五、MCP工具路由

```
前端注册工具名: mcp_{serverId}_{toolName}
例如: mcp_mcp_1776335669192_screenshot

前端执行: executeMcpTool() → HTTP POST /mcp/execute
         → 用 originalName（去掉前缀）调用对应服务器

后端keepalive: snapshot里是长名字 → unwrapMcpToolName() 提取原名 → 调浏览器MCP
```

**MCP服务器列表（server.js内置 + 外部）：**
| 服务器 | URL | 工具数 | 说明 |
|-------|-----|--------|------|
| 记忆MCP | /sse (mcp-sse.js) | 8个 | search/save/update_memory, save/get_diary, get_context等 |
| 浏览器MCP | :3002/sse (browser-mcp) | 24个 | open, screenshot, click, type, moltbook_*等 |
| 玄机SSH | 外部 | 3个 | run_command, list_servers, list_files |

## 六、关键变量和常量

```
MEMORY_TOKEN = 'wdsbkjgx1'        // 全局认证token
EMBEDDING_KEY = 'sk-proj-...'      // OpenAI embedding key
dream_snapshot.json                // 最近一次聊天的完整请求体
lastKeepAlive / lastCacheWarmup    // 内存变量，重启归零
```

## 七、已知的坑和规则

### 必须遵守
1. **工具集统一**：keepalive的 `getKeepAliveToolDefs()` 必须返回空数组，所有工具从snapshot拿。如果keepalive有自己的工具定义，会导致缓存hash不匹配，每次唤醒都全量写入缓存（写入价格是读取的12.5倍）
2. **EventSource导入**：eventsource v4 用命名导出 → `const { EventSource } = require('eventsource')`
3. **cache_control不超过4个**：system + tools + messages 加起来不能超4个断点
4. **前端部署用git push**：在 /home/ubuntu/guixu-frontend/ 目录 git add + commit + push
5. **编辑前必须备份**：`cp server.js server.js.bak_描述`
6. **编辑后必须验证**：`node --check server.js && pm2 restart llm-api`
7. **用sed改代码时用精确行号插入**，不要用模式匹配（容易匹配到错误位置）
8. **所有注释和工具描述用"林曦"或第一人称**，不用"用户"、"该功能"

### 容易踩的坑
- `lastKeepAlive` 是内存变量，pm2 restart 后归零 → 重启后会立即触发一次keepalive
- `stripExcessCacheControl` 只处理messages，不处理system块（system的cache_control来自snapshot原样保留）
- 前端 `pushDreamSnapshot` 只在工具循环第一轮推送（避免快照包含工具中间状态）
- `inActiveHours()` 用的是北京时间 8:00-01:00，服务器时区是UTC
- cache_warmup 只在距上次聊天 5-55 分钟之间才跑（太近没必要，太远该keepalive了）

### 当前Dream配置
```
enabled: true
model: claude-opus-4-5-20251101
intervalMinutes: 180（3小时醒一次）
apiBaseUrl: https://api.777903.xyz/anthropic（走自己的代理）
活跃时段: 北京时间 8:00 - 01:00
```

## 八、数据库表结构

```sql
-- 记忆
memories (id, content, type, importance, embedding, created_at, last_accessed, access_count, pinned, related_id, dynamic_boost)

-- 澈的日记
dream_diary (id, thoughts, action, content, source, created_at, consumed)

-- 活动事件（iOS快捷指令推送）
dream_events (id, type, value, created_at)

-- 推送订阅
dream_push_tokens (id, token, created_at)

-- Dream配置（KV）
dream_config (key, value)

-- 聊天记录
chats (id, title, connection_id, model, created_at, updated_at)
messages (id, chat_id, role, content, images, thinking, created_at)

-- 用户配置
user_config (key, value, updated_at)

-- 数据同步
sync_data (id, data, updated_at)
```

## 九、健康检查清单

改完代码后对照检查：
- [ ] `node --check server.js` 无语法错误
- [ ] pm2 restart 后不立即崩溃（`pm2 logs llm-api --lines 5`）
- [ ] `curl localhost/` 返回 `{"status":"ok"}`
- [ ] 缓存命中：看日志 `[Dream] cache_warmup 完成，cache_read:` 后面的数字 > 0
- [ ] MCP SSE 连通：`curl 'localhost/sse?token=wdsbkjgx1'` 收到 `event: endpoint`
- [ ] 浏览器代理通：`curl localhost/browser/` 有响应
- [ ] snapshot 存在且合理：`cat dream_snapshot.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('tools:', len(d.get('tools',[])), 'msgs:', len(d.get('messages',[])))"` 
