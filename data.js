(function () {
  "use strict";

  const { defaultState, loadState, saveState } = window.LLMHubState;
  
  let state = loadState();
  let syncInProgress = false;
  
  const els = {};

  function initDomRefs() {
    els.exportDataButton = document.getElementById("exportDataButton");
    els.importFileInput = document.getElementById("importFileInput");
    
    // 同步相关
    els.notConfiguredArea = document.getElementById("notConfiguredArea");
    els.configuredArea = document.getElementById("configuredArea");
    els.serverUrl = document.getElementById("serverUrl");
    els.syncIndicator = document.getElementById("syncIndicator");
    els.lastSyncTime = document.getElementById("lastSyncTime");
    els.syncNowButton = document.getElementById("syncNowButton");
    els.pullFromCloudButton = document.getElementById("pullFromCloudButton");
    els.migrateDataButton = document.getElementById("migrateDataButton");
  }

  // 获取同步配置（复用服务器记忆配置）
  function getSyncConfig() {
    // 每次都重新加载最新的state
    const currentState = loadState();
    const serverMemory = currentState.serverMemory || {};
    if (!serverMemory.serverUrl || !serverMemory.token) {
      return null;
    }
    return {
      serverUrl: serverMemory.serverUrl.replace(/\/$/, ""),
      token: serverMemory.token
    };
  }

  function updateUIForConfig() {
    const config = getSyncConfig();
    if (config) {
      if (els.notConfiguredArea) els.notConfiguredArea.style.display = "none";
      if (els.configuredArea) els.configuredArea.style.display = "block";
      if (els.serverUrl) {
        // 只显示域名部分
        try {
          const url = new URL(config.serverUrl);
          els.serverUrl.textContent = url.hostname;
        } catch {
          els.serverUrl.textContent = config.serverUrl;
        }
      }
      updateLastSyncTime();
    } else {
      if (els.notConfiguredArea) els.notConfiguredArea.style.display = "block";
      if (els.configuredArea) els.configuredArea.style.display = "none";
    }
  }

  function updateLastSyncTime() {
    const lastSync = localStorage.getItem("llm_hub_last_sync");
    if (els.lastSyncTime) {
      if (lastSync) {
        const d = new Date(parseInt(lastSync, 10));
        els.lastSyncTime.textContent = "上次同步：" + d.toLocaleString();
      } else {
        els.lastSyncTime.textContent = "上次同步：从未";
      }
    }
  }

  function setSyncIndicator(status) {
    if (!els.syncIndicator) return;
    if (status === "syncing") {
      els.syncIndicator.textContent = "◐";
      els.syncIndicator.className = "sync-indicator syncing";
      els.syncIndicator.title = "同步中...";
    } else if (status === "success") {
      els.syncIndicator.textContent = "●";
      els.syncIndicator.className = "sync-indicator success";
      els.syncIndicator.title = "已同步";
    } else if (status === "error") {
      els.syncIndicator.textContent = "●";
      els.syncIndicator.className = "sync-indicator error";
      els.syncIndicator.title = "同步失败";
    } else {
      els.syncIndicator.textContent = "○";
      els.syncIndicator.className = "sync-indicator";
      els.syncIndicator.title = "未同步";
    }
  }

  // ========== 云同步功能 ==========
  async function syncToCloud() {
    console.log("[Sync] syncToCloud called");
    const config = getSyncConfig();
    console.log("[Sync] config:", config);
    if (!config || syncInProgress) {
      console.log("[Sync] skipped: config=", !!config, "syncInProgress=", syncInProgress);
      return;
    }
    
    syncInProgress = true;
    setSyncIndicator("syncing");
    
    try {
      state = loadState();
      
      // 准备要同步的数据（聊天消息单独走 /api/chats 主路径，不放进这个备份里）
      // 否则 messagesByChatId 只含已加载的对话，备份会残缺
      const syncData = {
        connections: state.connections,
        chats: state.chats,
        activeChatId: state.activeChatId,
        activeConnectionId: state.activeConnectionId,
        globalInstruction: state.globalInstruction,
        summariesByChatId: state.summariesByChatId,
        generationConfig: state.generationConfig,
        memoryItems: state.memoryItems,
        tokenStats: state.tokenStats,
        contextLimit: state.contextLimit,
        autoMemory: state.autoMemory,
        serverMemory: state.serverMemory,
        proactiveMessage: state.proactiveMessage,
        mcpServers: state.mcpServers,
        imageGenConfigs: state.imageGenConfigs,
        ttsConfig: state.ttsConfig,
        searchConfig: state.searchConfig,
      };

      const resp = await fetch(config.serverUrl + "/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-memory-token": config.token
        },
        body: JSON.stringify({ data: syncData })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "推送失败");
      }

      localStorage.setItem("llm_hub_last_sync", String(Date.now()));
      updateLastSyncTime();
      setSyncIndicator("success");
      
    } catch (e) {
      console.error("同步失败:", e);
      setSyncIndicator("error");
      alert("推送失败：" + e.message);
    } finally {
      syncInProgress = false;
    }
  }

  async function pullFromCloud(forceOverwrite = false) {
    const config = getSyncConfig();
    if (!config || syncInProgress) return;
    
    syncInProgress = true;
    setSyncIndicator("syncing");
    
    try {
      const resp = await fetch(config.serverUrl + "/sync/pull", {
        headers: {
          "x-memory-token": config.token
        }
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "拉取失败");
      }

      const result = await resp.json();
      
      if (!result.data) {
        // 没有云端数据，首次使用，把本地数据推上去
        setSyncIndicator("success");
        await syncToCloud();
        alert("云端暂无数据，已将本地数据推送到云端。");
        return;
      }

      const cloudData = result.data;
      const localData = loadState();
      
      let finalData;
      if (forceOverwrite) {
        // 完全覆盖
        finalData = Object.assign({}, defaultState, cloudData);
      } else {
        // 智能合并
        finalData = mergeData(localData, cloudData);
      }
      
      saveState(finalData);
      state = finalData;
      
      localStorage.setItem("llm_hub_last_sync", String(Date.now()));
      updateLastSyncTime();
      setSyncIndicator("success");
      
      const mode = forceOverwrite ? "覆盖" : "合并";
      alert(`已从云端${mode}数据，刷新页面后生效。`);
      
    } catch (e) {
      console.error("拉取失败:", e);
      setSyncIndicator("error");
      alert("拉取失败：" + e.message);
    } finally {
      syncInProgress = false;
    }
  }

  // 智能合并数据
  function mergeData(local, cloud) {
    const result = JSON.parse(JSON.stringify(local));
    
    // 合并连接
    if (cloud.connections) {
      const localIds = new Set((local.connections || []).map(c => c.id));
      for (const conn of cloud.connections) {
        if (!localIds.has(conn.id)) {
          result.connections.push(conn);
        }
      }
    }
    
    // 合并聊天
    if (cloud.chats) {
      const localIds = new Set((local.chats || []).map(c => c.id));
      for (const chat of cloud.chats) {
        if (!localIds.has(chat.id)) {
          result.chats.push(chat);
        }
      }
    }
    
    // 合并消息
    if (cloud.messagesByChatId) {
      for (const chatId of Object.keys(cloud.messagesByChatId)) {
        if (!result.messagesByChatId[chatId]) {
          result.messagesByChatId[chatId] = cloud.messagesByChatId[chatId];
        }
      }
    }
    
    // 合并记忆
    if (cloud.memoryItems) {
      const localContents = new Set((local.memoryItems || []).map(m => m.content));
      for (const mem of cloud.memoryItems) {
        if (!localContents.has(mem.content)) {
          result.memoryItems.push(mem);
        }
      }
    }
    
    // 合并摘要
    if (cloud.summariesByChatId) {
      Object.assign(result.summariesByChatId || {}, cloud.summariesByChatId);
    }
    
    // 使用云端配置（如果本地没有）
    if (!local.globalInstruction && cloud.globalInstruction) {
      result.globalInstruction = cloud.globalInstruction;
    }
    if (!local.generationConfig && cloud.generationConfig) {
      result.generationConfig = cloud.generationConfig;
    }
    
    return result;
  }

  // ========== 本地导入导出 ==========
  function exportData() {
    state = loadState();
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guixu_backup_" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (ev) {
      try {
        const imported = JSON.parse(ev.target.result);
        
        const mode = confirm(
          "请选择导入方式：\n\n" +
          "【确定】= 合并（保留现有数据，添加新内容）\n" +
          "【取消】= 覆盖（完全使用导入的数据）"
        );
        
        const localData = loadState();
        let finalData;
        
        if (mode) {
          finalData = mergeData(localData, imported);
        } else {
          finalData = Object.assign({}, defaultState, imported);
        }
        
        // 保存配置部分到localStorage
        saveState(finalData);
        state = finalData;
        
        // 如果有聊天数据，写入服务器
        const chats = imported.chats || finalData.chats || [];
        const messagesByChatId = imported.messagesByChatId || finalData.messagesByChatId || {};
        
        if (chats.length > 0) {
          const config = getSyncConfig();
          if (config) {
            setSyncIndicator("syncing");
            try {
              const resp = await fetch(config.serverUrl + "/api/migrate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-memory-token": config.token
                },
                body: JSON.stringify({ chats, messagesByChatId })
              });
              
              if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || "服务器写入失败");
              }
              
              const result = await resp.json();
              setSyncIndicator("success");
              
              const modeText = mode ? "合并" : "覆盖";
              alert(`导入成功（${modeText}模式）！\n\n已写入服务器：${result.chatCount} 个聊天，${result.msgCount} 条消息。\n\n刷新页面后生效。`);
            } catch (syncErr) {
              console.error("聊天数据写入服务器失败:", syncErr);
              setSyncIndicator("error");
              alert(`配置已导入，但聊天数据写入服务器失败：${syncErr.message}\n\n请稍后在数据页面点"迁移到服务器"重试。`);
            }
          } else {
            alert("配置已导入，但服务器未配置，聊天数据无法保存。\n请先配置服务器记忆，然后使用「迁移到服务器」功能。");
          }
        } else {
          const modeText = mode ? "合并" : "覆盖";
          alert(`导入成功（${modeText}模式），刷新页面后生效。`);
        }
        
      } catch (err) {
        alert("导入失败：文件格式错误\n" + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ========== 事件绑定 ==========
  // ========== 数据迁移（从localStorage到服务器）==========
  async function migrateToServer() {
    const config = getSyncConfig();
    if (!config) {
      alert("请先配置服务器连接");
      return;
    }
    
    // 读取localStorage中的完整数据
    const raw = localStorage.getItem("llm_hub_state_v1");
    if (!raw) {
      alert("本地没有数据需要迁移");
      return;
    }
    
    let localData;
    try {
      localData = JSON.parse(raw);
    } catch(e) {
      alert("本地数据格式错误：" + e.message);
      return;
    }
    
    const chats = localData.chats || [];
    const messagesByChatId = localData.messagesByChatId || {};
    
    if (chats.length === 0) {
      alert("本地没有聊天记录需要迁移");
      return;
    }
    
    if (!confirm(`即将迁移 ${chats.length} 个聊天到服务器。\n\n这会把本地的聊天记录上传到服务器，之后聊天数据将只存服务器。\n\n继续？`)) {
      return;
    }
    
    setSyncIndicator("syncing");
    
    try {
      const resp = await fetch(config.serverUrl + "/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-memory-token": config.token
        },
        body: JSON.stringify({ chats, messagesByChatId })
      });
      
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "迁移失败");
      }
      
      const result = await resp.json();
      
      // 清理localStorage中的聊天数据
      delete localData.chats;
      delete localData.messagesByChatId;
      delete localData.summariesByChatId;
      localStorage.setItem("llm_hub_state_v1", JSON.stringify(localData));
      
      setSyncIndicator("success");
      alert(`迁移成功！\n\n已迁移 ${result.chatCount} 个聊天，${result.msgCount} 条消息。\n\n现在聊天数据存储在服务器，localStorage空间已释放。\n\n请刷新页面。`);
      
    } catch(e) {
      console.error("迁移失败:", e);
      setSyncIndicator("error");
      alert("迁移失败：" + e.message);
    }
  }

  function bindEvents() {
    if (els.exportDataButton) {
      els.exportDataButton.addEventListener("click", exportData);
    }
    
    if (els.importFileInput) {
      els.importFileInput.addEventListener("change", handleImport);
    }
    
    if (els.syncNowButton) {
      els.syncNowButton.addEventListener("click", syncToCloud);
    }
    
    if (els.pullFromCloudButton) {
      els.pullFromCloudButton.addEventListener("click", () => {
        const mode = confirm(
          "请选择拉取方式：\n\n" +
          "【确定】= 合并（保留本地数据，添加云端新内容）\n" +
          "【取消】= 覆盖（完全使用云端数据）"
        );
        pullFromCloud(!mode);
      });
    }
    
    if (els.migrateDataButton) {
      els.migrateDataButton.addEventListener("click", migrateToServer);
    }
  }

  // ========== 自动同步 ==========
  window.LLMHubSync = {
    autoSync: function() {
      const config = getSyncConfig();
      if (config && !syncInProgress) {
        // 静默同步，不显示alert
        syncToCloud().catch(e => console.warn("自动同步失败:", e));
      }
    }
  };

  // ========== 初始化 ==========
  document.addEventListener("DOMContentLoaded", function () {
    initDomRefs();
    bindEvents();
    updateUIForConfig();
  });
})();
