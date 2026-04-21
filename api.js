// ========== 服务器API客户端 ==========
(function() {
  "use strict";

  // 获取服务器配置
  function getServerConfig() {
    const state = window.LLMHubState?.loadState?.() || {};
    const sm = state.serverMemory || {};
    if (!sm.serverUrl || !sm.token) return null;
    return {
      baseUrl: sm.serverUrl.replace(/\/$/, ''),
      token: sm.token
    };
  }

  // 通用请求函数
  async function apiRequest(path, options = {}) {
    const config = getServerConfig();
    if (!config) throw new Error('服务器未配置');

    const url = config.baseUrl + path;
    const resp = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-memory-token': config.token,
        ...(options.headers || {})
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API错误 ${resp.status}: ${text}`);
    }

    return resp.json();
  }

  // ========== 聊天API ==========
  
  // 获取聊天列表
  async function getChats(limit = 50, offset = 0) {
    return apiRequest(`/api/chats?limit=${limit}&offset=${offset}`);
  }

  // 创建聊天
  async function createChat(data) {
    return apiRequest('/api/chats', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 更新聊天
  async function updateChat(chatId, data) {
    return apiRequest(`/api/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // 删除聊天
  async function deleteChat(chatId) {
    return apiRequest(`/api/chats/${chatId}`, {
      method: 'DELETE'
    });
  }

  // ========== 消息API ==========

  // 获取消息
  async function getMessages(chatId, limit = 200, offset = 0) {
    return apiRequest(`/api/chats/${chatId}/messages?limit=${limit}&offset=${offset}`);
  }

  // 添加消息
  async function addMessage(chatId, message) {
    return apiRequest(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  // 批量添加消息
  async function addMessagesBatch(chatId, messages) {
    return apiRequest(`/api/chats/${chatId}/messages/batch`, {
      method: 'POST',
      body: JSON.stringify({ messages })
    });
  }

  // 更新消息
  async function updateMessage(chatId, msgId, data) {
    return apiRequest(`/api/chats/${chatId}/messages/${msgId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // 删除消息
  async function deleteMessage(chatId, msgId) {
    return apiRequest(`/api/chats/${chatId}/messages/${msgId}`, {
      method: 'DELETE'
    });
  }

  // ========== 数据迁移 ==========
  async function migrateData(chats, messagesByChatId) {
    return apiRequest('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({ chats, messagesByChatId })
    });
  }

  // 检查服务器是否可用
  async function checkServer() {
    try {
      const config = getServerConfig();
      if (!config) return { available: false, reason: '未配置服务器' };
      
      await apiRequest('/api/chats?limit=1');
      return { available: true };
    } catch (e) {
      return { available: false, reason: e.message };
    }
  }

  // 暴露API
  window.LLMHubAPI = {
    getServerConfig,
    checkServer,
    // 聊天
    getChats,
    createChat,
    updateChat,
    deleteChat,
    // 消息
    getMessages,
    addMessage,
    addMessagesBatch,
    updateMessage,
    deleteMessage,
    // 迁移
    migrateData
  };

})();
