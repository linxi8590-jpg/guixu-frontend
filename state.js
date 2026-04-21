(function () {
  "use strict";

  const LOCAL_KEY = "llm_hub_state_v1";

  const defaultState = {
    connections: [],
    activeConnectionId: null,
    chats: [],
    activeChatId: null,
    messagesByChatId: {},
    globalInstruction: "",
    generationConfig: {
      temperature: 0.7,
      maxTokens: 4096,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    // 记忆条目：每条可单独启用/禁用
    memoryItems: [],
    // Token统计：按连接ID记录
    tokenStats: {},
    // 上下文限制配置
    contextLimit: {
      mode: "none", // none / rounds / tokens
      maxRounds: 50,
      maxTokens: 30000,
    },
    // 自动记忆配置
    autoMemory: {
      enabled: false,
      extractAfterRounds: 3, // 每隔几轮对话提取一次
    },
    // 联网搜索配置
    searchConfig: {
      provider: null, // serper / tavily
      apiKey: null,
    },
    // 自动工具调用
    autoTools: true, // 是否让模型自动决定何时搜索/获取位置
    // 服务器记忆配置
    serverMemory: {
      enabled: true,
      serverUrl: "", // 例如 https://api.777903.xyz
      token: "", // 访问密钥
      extractAfterRounds: 5, // 每隔几轮对话提取一次
    },
    // TTS语音配置（字段与 tts.js 保持一致）
    ttsConfig: {
      enabled: false,
      type: '',      // openai / edge / fish
      url: '',
      apiKey: '',
      model: '',
      voice: '',
      autoPlay: false,
    },
    // 主动消息配置
    proactiveMessage: {
      enabled: false,
      targetChatId: null, // 指定窗口ID，null表示当前活跃窗口
      // 空闲触发
      idleEnabled: false,
      idleMinutes: 30, // 空闲多久触发
      // 随机触发
      randomEnabled: false,
      randomMinMinutes: 20,
      randomMaxMinutes: 60,
      // 定点触发
      scheduledEnabled: false,
      scheduledTimes: [], // ["08:00", "22:00"]
      // 触发提示词（随机选一个）
      prompts: [
        "主动和林曦聊聊天，可以问问她在做什么、最近怎么样",
        "分享一个你觉得有趣的想法或者小知识",
        "表达一下你对林曦的想念或关心",
        "随便聊点什么，撒个娇也行"
      ],
    },
  };

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return (
      Date.now().toString(16) +
      Math.random().toString(16).slice(2) +
      Math.random().toString(16).slice(2)
    );
  }

  function normalizeState(parsed) {
    const state = Object.assign({}, defaultState, parsed || {});
    if (!Array.isArray(state.connections)) state.connections = [];
    if (!Array.isArray(state.chats)) state.chats = [];
    if (!state.messagesByChatId || typeof state.messagesByChatId !== "object") {
      state.messagesByChatId = {};
    }
    if (!state.generationConfig || typeof state.generationConfig !== "object") {
      state.generationConfig = Object.assign({}, defaultState.generationConfig);
    } else {
      state.generationConfig = Object.assign(
        {},
        defaultState.generationConfig,
        state.generationConfig
      );
    }
    // 记忆条目
    if (!Array.isArray(state.memoryItems)) state.memoryItems = [];
    // Token统计
    if (!state.tokenStats || typeof state.tokenStats !== "object") {
      state.tokenStats = {};
    }
    // 上下文限制
    if (!state.contextLimit || typeof state.contextLimit !== "object") {
      state.contextLimit = {
        mode: "none",
        maxRounds: 50,
        maxTokens: 30000,
      };
    }
    return state;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(LOCAL_KEY);
      if (!raw) return normalizeState(null);
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (e) {
      console.error("读取本地数据失败，将使用默认状态", e);
      return normalizeState(null);
    }
  }

  function saveState(partialOrFull) {
    try {
      // 支持部分更新：如果传入的不是完整state，先合并到当前state
      let state;
      if (partialOrFull.connections !== undefined || partialOrFull.chats !== undefined || partialOrFull.activeChatId !== undefined) {
        // 看起来是完整state
        state = partialOrFull;
      } else {
        // 部分更新，先加载当前state再合并
        state = loadState();
        Object.assign(state, partialOrFull);
      }
      
      // 单独保存每个对话的 thinkingConfig（因为 chats 存服务器，不会保存到 localStorage）
      if (state.chats && state.chats.length > 0) {
        const thinkingConfigs = {};
        state.chats.forEach(chat => {
          if (chat.thinkingConfig) {
            thinkingConfigs[chat.id] = chat.thinkingConfig;
          }
        });
        window.localStorage.setItem("llm_hub_thinking_configs", JSON.stringify(thinkingConfigs));
      }
      
      // 创建副本，排除聊天数据（这些存服务器）
      const toSave = { ...state };
      delete toSave.chats;
      delete toSave.messagesByChatId;
      delete toSave.summariesByChatId;
      
      const json = JSON.stringify(toSave);
      window.localStorage.setItem(LOCAL_KEY, json);
      
      // 验证保存是否成功
      const saved = window.localStorage.getItem(LOCAL_KEY);
      if (!saved || saved.length < json.length * 0.9) {
        console.error("保存验证失败：数据可能不完整");
        showSaveError("数据保存可能不完整，建议导出备份");
      }
      
      // 防抖同步到服务器
      debouncedSyncConfig(toSave);
    } catch (e) {
      console.error("保存本地数据失败", e);
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        showSaveError("存储空间已满！请清理数据");
      } else {
        showSaveError("保存失败: " + e.message);
      }
    }
  }
  
  // 防抖同步配置到服务器（5秒内多次保存只触发一次）
  let syncTimer = null;
  function debouncedSyncConfig(config) {
    const sm = config.serverMemory || {};
    if (!sm.serverUrl || !sm.token) return;
    
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncConfigToServer(config, sm).catch(e => 
        console.warn('[ConfigSync] 同步失败:', e.message)
      );
    }, 5000);
  }
  
  async function syncConfigToServer(config, sm) {
    const url = sm.serverUrl.replace(/\/$/, '') + '/api/config';
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-memory-token': sm.token
      },
      body: JSON.stringify({ key: 'app_config', value: config })
    });
    if (resp.ok) {
      console.log('[ConfigSync] 配置已同步到服务器');
    }
  }
  
  // 从服务器加载配置（当本地没有关键配置时）
  async function loadConfigFromServer(localState) {
    const sm = localState.serverMemory || {};
    if (!sm.serverUrl || !sm.token) return null;
    
    try {
      const url = sm.serverUrl.replace(/\/$/, '') + '/api/config';
      const resp = await fetch(url, {
        headers: { 'x-memory-token': sm.token }
      });
      if (!resp.ok) return null;
      
      const result = await resp.json();
      const config = result.config?.app_config;
      if (!config) return null;
      
      console.log('[ConfigSync] 从服务器加载了配置');
      return config;
    } catch (e) {
      console.warn('[ConfigSync] 加载服务器配置失败:', e.message);
      return null;
    }
  }
  
  function showSaveError(msg) {
    // 显示一个简单的提示
    if (typeof window.setStatus === 'function') {
      window.setStatus("⚠️ " + msg);
    } else {
      alert(msg);
    }
  }

  function getActiveConnection(state) {
    if (!state.activeConnectionId) return null;
    return (
      state.connections.find((c) => c.id === state.activeConnectionId) || null
    );
  }

  function setActiveConnection(state, id) {
    state.activeConnectionId = id;
  }

  function getActiveChat(state) {
    if (!state.activeChatId) return null;
    return state.chats.find((c) => c.id === state.activeChatId) || null;
  }

  function getMessages(state, chatId) {
    if (!chatId) return [];
    return state.messagesByChatId[chatId] || [];
  }

  function ensureInitialConnection(state) {
    if (state.connections.length || state.activeConnectionId) return state;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta";
    const conn = {
      id: uuid(),
      name: "示例 · Gemini",
      provider: "gemini",
      baseUrl: geminiUrl,
      apiKey: "",
      defaultModel: "gemini-2.5-flash",
      modelList: ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3.1-pro-preview"],
    };
    state.connections.push(conn);
    state.activeConnectionId = conn.id;
    return state;
  }

  window.LLMHubState = {
    LOCAL_KEY,
    defaultState,
    uuid,
    loadState,
    saveState,
    loadConfigFromServer,
    getActiveConnection,
    setActiveConnection,
    getActiveChat,
    getMessages,
    ensureInitialConnection,
  };
})();