(function () {
  "use strict";

  function normalizeProvider(raw) {
    const v = (raw || "").toString().toLowerCase();
    if (v.includes("gemini")) return "gemini";
    if (v.includes("anthropic") || v.includes("claude")) return "anthropic";
    if (v.includes("openai")) return "openai";
    if (v.includes("deepseek")) return "openai";
    return "openai";
  }

  const {
    loadState,
    saveState,
    getActiveConnection,
    ensureInitialConnection,
    getMessages,
  } = window.LLMHubState;

  let state = ensureInitialConnection(loadState());
  const els = {};

  function initDomRefs() {
    els.globalInstructionInput = document.getElementById(
      "globalInstructionInput"
    );
    els.temperatureSlider = document.getElementById("temperatureSlider");
    els.maxTokensSlider = document.getElementById("maxTokensSlider");
    els.frequencyPenaltySlider = document.getElementById("frequencyPenaltySlider");
    els.presencePenaltySlider = document.getElementById("presencePenaltySlider");
    els.temperatureValue = document.getElementById("temperatureValue");
    els.maxTokensValue = document.getElementById("maxTokensValue");
    els.frequencyPenaltyValue = document.getElementById("frequencyPenaltyValue");
    els.presencePenaltyValue = document.getElementById("presencePenaltyValue");

    // 记忆条目相关
    els.memoryItemsList = document.getElementById("memoryItemsList");
    els.addMemoryItemButton = document.getElementById("addMemoryItemButton");
    els.memoryItemModal = document.getElementById("memoryItemModal");
    els.memoryItemModalTitle = document.getElementById("memoryItemModalTitle");
    els.memoryItemContent = document.getElementById("memoryItemContent");
    els.memoryItemSaveButton = document.getElementById("memoryItemSaveButton");
    els.memoryItemCancelButton = document.getElementById("memoryItemCancelButton");
    els.closeMemoryItemModal = document.getElementById("closeMemoryItemModal");

    // 上下文限制相关
    els.contextLimitMode = document.getElementById("contextLimitMode");
    els.contextLimitRoundsField = document.getElementById("contextLimitRoundsField");
    els.contextLimitTokensField = document.getElementById("contextLimitTokensField");
    els.maxRoundsSlider = document.getElementById("maxRoundsSlider");
    els.maxRoundsValue = document.getElementById("maxRoundsValue");
    els.maxContextTokensSlider = document.getElementById("maxContextTokensSlider");
    els.maxContextTokensValue = document.getElementById("maxContextTokensValue");
    
    // 自动记忆相关
    els.autoMemoryEnabled = document.getElementById("autoMemoryEnabled");
    els.autoMemoryIntervalField = document.getElementById("autoMemoryIntervalField");
    els.autoMemoryIntervalSlider = document.getElementById("autoMemoryIntervalSlider");
    els.autoMemoryIntervalValue = document.getElementById("autoMemoryIntervalValue");
    
    // 服务器记忆相关
    els.serverMemoryEnabled = document.getElementById("serverMemoryEnabled");
    els.serverMemorySection = document.getElementById("serverMemorySection");
    els.serverMemoryUrl = document.getElementById("serverMemoryUrl");
    els.serverMemoryToken = document.getElementById("serverMemoryToken");
    els.serverMemoryIntervalSlider = document.getElementById("serverMemoryIntervalSlider");
    els.serverMemoryIntervalValue = document.getElementById("serverMemoryIntervalValue");
    
    // 记忆提取模型选择
    els.autoMemoryConnectionSelect = document.getElementById("autoMemoryConnectionSelect");
    els.autoMemoryModelInput = document.getElementById("autoMemoryModelInput");
    els.serverMemoryConnectionSelect = document.getElementById("serverMemoryConnectionSelect");
    els.serverMemoryModelInput = document.getElementById("serverMemoryModelInput");
    els.viewServerMemoriesBtn = document.getElementById("viewServerMemoriesBtn");
    els.serverMemoriesList = document.getElementById("serverMemoriesList");
    
  }

  function renderGlobalInstruction() {
    els.globalInstructionInput.value = state.globalInstruction || "";
  }

  function renderGenerationConfig() {
    const cfg = state.generationConfig || {};
    if (els.temperatureSlider) {
      const v = typeof cfg.temperature === "number" ? cfg.temperature : 0.7;
      els.temperatureSlider.value = v;
      if (els.temperatureValue) {
        els.temperatureValue.textContent = v.toFixed(2);
      }
    }
    if (els.maxTokensSlider) {
      const v = typeof cfg.maxTokens === "number" ? cfg.maxTokens : 4096;
      els.maxTokensSlider.value = v;
      if (els.maxTokensValue) {
        els.maxTokensValue.textContent = String(Math.round(v));
      }
    }
    if (els.frequencyPenaltySlider) {
      const v = typeof cfg.frequencyPenalty === "number" ? cfg.frequencyPenalty : 0;
      els.frequencyPenaltySlider.value = v;
      if (els.frequencyPenaltyValue) {
        els.frequencyPenaltyValue.textContent = v.toFixed(2);
      }
    }
    if (els.presencePenaltySlider) {
      const v = typeof cfg.presencePenalty === "number" ? cfg.presencePenalty : 0;
      els.presencePenaltySlider.value = v;
      if (els.presencePenaltyValue) {
        els.presencePenaltyValue.textContent = v.toFixed(2);
      }
    }
  }

  function renderContextLimit() {
    const cfg = state.contextLimit || { mode: "none", maxRounds: 50, maxTokens: 30000 };
    
    if (els.contextLimitMode) {
      els.contextLimitMode.value = cfg.mode || "none";
    }
    
    // 显示/隐藏对应的设置字段
    if (els.contextLimitRoundsField) {
      els.contextLimitRoundsField.style.display = cfg.mode === "rounds" ? "block" : "none";
    }
    if (els.contextLimitTokensField) {
      els.contextLimitTokensField.style.display = cfg.mode === "tokens" ? "block" : "none";
    }
    
    if (els.maxRoundsSlider) {
      const v = typeof cfg.maxRounds === "number" ? cfg.maxRounds : 50;
      els.maxRoundsSlider.value = v;
      if (els.maxRoundsValue) {
        els.maxRoundsValue.textContent = String(v);
      }
    }
    
    if (els.maxContextTokensSlider) {
      const v = typeof cfg.maxTokens === "number" ? cfg.maxTokens : 30000;
      els.maxContextTokensSlider.value = v;
      if (els.maxContextTokensValue) {
        els.maxContextTokensValue.textContent = String(v);
      }
    }
  }

  // 填充连接下拉框
  function populateConnectionSelect(selectEl, selectedId) {
    if (!selectEl) return;
    // 重新加载 state 确保连接列表是最新的
    state = loadState();
    const conns = state.connections || [];
    console.log("[记忆设置] 连接数量:", conns.length, conns.map(c => c.name));
    selectEl.innerHTML = '<option value="">跟随当前对话</option>';
    conns.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name + " (" + (c.defaultModel || c.provider) + ")";
      if (c.id === selectedId) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function renderAutoMemory() {
    const cfg = state.autoMemory || { enabled: false, extractAfterRounds: 15 };
    
    if (els.autoMemoryEnabled) {
      els.autoMemoryEnabled.checked = cfg.enabled || false;
    }
    
    // 显示/隐藏频率设置
    if (els.autoMemoryIntervalField) {
      els.autoMemoryIntervalField.style.display = cfg.enabled ? "block" : "none";
    }
    
    if (els.autoMemoryIntervalSlider) {
      const v = typeof cfg.extractAfterRounds === "number" ? cfg.extractAfterRounds : 15;
      els.autoMemoryIntervalSlider.value = v;
      if (els.autoMemoryIntervalValue) {
        els.autoMemoryIntervalValue.textContent = String(v);
      }
    }
    
    // 填充连接下拉框
    populateConnectionSelect(els.autoMemoryConnectionSelect, cfg.extractConnectionId || "");
    if (els.autoMemoryModelInput) {
      els.autoMemoryModelInput.value = cfg.extractModel || "";
    }
  }


  // ========== 服务器记忆管理 ==========
  
  function renderServerMemory() {
    const cfg = state.serverMemory || { enabled: false, serverUrl: "", token: "", extractAfterRounds: 20 };
    
    if (els.serverMemoryEnabled) {
      els.serverMemoryEnabled.checked = cfg.enabled || false;
    }
    
    if (els.serverMemoryUrl) {
      els.serverMemoryUrl.value = cfg.serverUrl || "";
    }
    
    if (els.serverMemoryToken) {
      els.serverMemoryToken.value = cfg.token || "";
    }
    
    if (els.serverMemoryIntervalSlider) {
      const v = cfg.extractAfterRounds || 20;
      els.serverMemoryIntervalSlider.value = v;
      if (els.serverMemoryIntervalValue) {
        els.serverMemoryIntervalValue.textContent = v;
      }
    }
    
    // 填充连接下拉框
    populateConnectionSelect(els.serverMemoryConnectionSelect, cfg.extractConnectionId || "");
    if (els.serverMemoryModelInput) {
      els.serverMemoryModelInput.value = cfg.extractModel || "";
    }
    
    // 显示/隐藏配置区
    if (els.serverMemorySection) {
      els.serverMemorySection.style.display = cfg.enabled ? "block" : "none";
    }
  }
  
  // ========== 主动消息配置 ==========
  async function loadServerMemories() {
    if (!els.serverMemoriesList) return;
    
    const cfg = state.serverMemory || {};
    if (!cfg.serverUrl) {
      els.serverMemoriesList.innerHTML = '<div class="empty-text">请先配置服务器地址</div>';
      els.serverMemoriesList.style.display = "block";
      return;
    }
    
    els.serverMemoriesList.innerHTML = '<div class="empty-text">加载中...</div>';
    els.serverMemoriesList.style.display = "block";
    
    try {
      const url = cfg.serverUrl.replace(/\/$/, "") + "/memory";
      const headers = {};
      if (cfg.token) headers['x-memory-token'] = cfg.token;
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error("请求失败: " + resp.status);
      
      const memories = await resp.json();
      
      if (!memories || memories.length === 0) {
        els.serverMemoriesList.innerHTML = '<div class="empty-text">还没有记忆，聊几轮后会自动形成。</div>';
        return;
      }
      
      els.serverMemoriesList.innerHTML = "";
      
      // 类型标签映射
      const typeLabels = { fact: '事实', preference: '偏好', habit: '习惯', experience: '经历', relationship: '关系', self: '自我', understanding: '理解', feel: '感受', general: '通用' };
      
      // 存储记忆数据用于筛选
      window._serverMemories = memories;
      
      // 显示筛选栏
      const filtersEl = document.getElementById("serverMemoryFilters");
      if (filtersEl) filtersEl.style.display = "flex";
      
      renderFilteredMemories(memories, "all");
      
      // 绑定筛选按钮
      if (filtersEl && !filtersEl._bound) {
        filtersEl._bound = true;
        filtersEl.addEventListener("click", (e) => {
          const chip = e.target.closest(".filter-chip");
          if (!chip) return;
          filtersEl.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          renderFilteredMemories(window._serverMemories, chip.dataset.filter);
        });
      }
    } catch (e) {
      console.error("加载服务器记忆失败:", e);
      els.serverMemoriesList.innerHTML = '<div class="empty-text">加载失败：' + e.message + '</div>';
    }
  }
  
  function renderFilteredMemories(memories, filter) {
    if (!els.serverMemoriesList) return;
    
    const typeLabels = { fact: '事实', preference: '偏好', habit: '习惯', experience: '经历', relationship: '关系', self: '自我', understanding: '理解', feel: '💭 感受', general: '通用' };
    
    let filtered = memories;
    if (filter === "pinned") {
      filtered = memories.filter(m => m.pinned);
    } else if (filter === "feel") {
      filtered = memories.filter(m => m.type === "feel");
    } else if (filter === "other") {
      filtered = memories.filter(m => !["fact","preference","experience","relationship","feel"].includes(m.type));
    } else if (filter !== "all") {
      filtered = memories.filter(m => m.type === filter);
    }
    
    els.serverMemoriesList.innerHTML = "";
    
    if (filtered.length === 0) {
      els.serverMemoriesList.innerHTML = '<div class="empty-text">这个分类下还没有记忆</div>';
      return;
    }
    
    // 排序：钉选最前，然后按综合热度（重要度+加成+访问次数）排
    filtered.sort((a, b) => {
      if ((b.pinned || 0) !== (a.pinned || 0)) return (b.pinned || 0) - (a.pinned || 0);
      const scoreA = (a.importance || 0.5) + (a.dynamic_boost || 0) + Math.min(0.2, (a.access_count || 0) * 0.01);
      const scoreB = (b.importance || 0.5) + (b.dynamic_boost || 0) + Math.min(0.2, (b.access_count || 0) * 0.01);
      return scoreB - scoreA;
    });
    
    filtered.forEach((mem) => {
      const div = document.createElement("div");
      div.className = "memory-item server-memory" + (mem.pinned ? " pinned" : "") + (mem.type === "feel" ? " feel-type" : "");
      div.dataset.id = mem.id;
      
      // 类型标签
      const tag = document.createElement("span");
      tag.className = "memory-type-tag" + (mem.type === "feel" ? " feel" : "");
      tag.textContent = (mem.pinned ? "📌 " : "") + (typeLabels[mem.type] || mem.type);
      
      const content = document.createElement("div");
      content.className = "memory-content";
      content.textContent = mem.content;
      
      // 时间
      const time = document.createElement("small");
      time.className = "memory-time";
      const date = new Date(mem.created_at);
      const boost = mem.dynamic_boost || 0;
      const baseImp = mem.importance || 0.5;
      const effImp = Math.min(1.0, baseImp + boost);
      const accessCount = mem.access_count || 0;
      
      // 构建时间行：日期 + 重要度 + 访问次数 + 热度加成
      let timeText = date.toLocaleDateString("zh-CN");
      timeText += `  ·  重要度 ${effImp.toFixed(2)}`;
      if (boost >= 0.01) {
        timeText += ` (🔥 +${boost.toFixed(2)})`;
      }
      if (accessCount >= 3) {
        timeText += `  ·  访问 ${accessCount} 次`;
      }
      time.textContent = timeText;
      
      // 操作按钮
      const actions = document.createElement("div");
      actions.className = "memory-actions";
      
      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = "small-button" + (mem.pinned ? " pinned" : "");
      pinBtn.textContent = mem.pinned ? "取消钉选" : "📌 钉选";
      pinBtn.addEventListener("click", () => togglePinMemory(mem.id, !mem.pinned));
      
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "small-button";
      editBtn.textContent = "编辑";
      editBtn.addEventListener("click", () => openServerMemoryEdit(mem));
      
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "small-button";
      delBtn.textContent = "删除";
      delBtn.addEventListener("click", () => deleteServerMemory(mem.id));
      
      actions.appendChild(pinBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      
      div.appendChild(tag);
      div.appendChild(content);
      div.appendChild(time);
      div.appendChild(actions);
      els.serverMemoriesList.appendChild(div);
    });
  }
  
  async function togglePinMemory(memoryId, pin) {
    const cfg = state.serverMemory || {};
    if (!cfg.serverUrl) return;
    
    try {
      const url = cfg.serverUrl.replace(/\/$/, "") + "/api/memory-pin";
      const headers = { "Content-Type": "application/json" };
      if (cfg.token) headers["x-memory-token"] = cfg.token;
      const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify({ id: memoryId, pinned: pin }) });
      if (resp.ok) {
        loadServerMemories();
      } else {
        alert("操作失败");
      }
    } catch (e) {
      alert("操作失败：" + e.message);
    }
  }
  
  async function deleteServerMemory(memoryId) {
    if (!window.confirm("确定要删除这条记忆吗？")) return;
    
    const cfg = state.serverMemory || {};
    if (!cfg.serverUrl) return;
    
    try {
      const url = cfg.serverUrl.replace(/\/$/, "") + "/memory/" + memoryId;
      const headers = {};
      if (cfg.token) headers['x-memory-token'] = cfg.token;
      const resp = await fetch(url, { method: "DELETE", headers });
      if (resp.ok) {
        loadServerMemories();
      } else {
        alert("删除失败");
      }
    } catch (e) {
      alert("删除失败：" + e.message);
    }
  }

  // ========== 服务器记忆编辑/添加 ==========
  let editingServerMemoryId = null;
  
  function openServerMemoryEdit(mem) {
    editingServerMemoryId = mem.id;
    
    const modal = document.getElementById("serverMemoryEditModal");
    const modalTitle = modal.querySelector(".modal-title");
    const contentInput = document.getElementById("serverMemoryEditContent");
    const typeSelect = document.getElementById("serverMemoryEditType");
    const importanceSlider = document.getElementById("serverMemoryEditImportanceSlider");
    const importanceValue = document.getElementById("serverMemoryEditImportanceValue");
    
    if (!modal || !contentInput) return;
    
    if (modalTitle) modalTitle.textContent = "编辑服务器记忆";
    contentInput.value = mem.content || "";
    typeSelect.value = mem.type || "general";
    importanceSlider.value = mem.importance || 0.5;
    importanceValue.textContent = (mem.importance || 0.5).toFixed(1);
    
    const pinnedCheckbox = document.getElementById("serverMemoryEditPinned");
    if (pinnedCheckbox) pinnedCheckbox.checked = !!mem.pinned;
    
    modal.classList.remove("hidden");
  }

  function openServerMemoryAdd() {
    editingServerMemoryId = null; // null 表示添加模式
    
    const modal = document.getElementById("serverMemoryEditModal");
    const modalTitle = modal.querySelector(".modal-title");
    const contentInput = document.getElementById("serverMemoryEditContent");
    const typeSelect = document.getElementById("serverMemoryEditType");
    const importanceSlider = document.getElementById("serverMemoryEditImportanceSlider");
    const importanceValue = document.getElementById("serverMemoryEditImportanceValue");
    
    if (!modal || !contentInput) return;
    
    // 重置为默认值
    if (modalTitle) modalTitle.textContent = "添加服务器记忆";
    contentInput.value = "";
    typeSelect.value = "general";
    importanceSlider.value = 0.5;
    importanceValue.textContent = "0.5";
    
    const pinnedCheckbox = document.getElementById("serverMemoryEditPinned");
    if (pinnedCheckbox) pinnedCheckbox.checked = false;
    
    modal.classList.remove("hidden");
  }
  
  function closeServerMemoryEdit() {
    const modal = document.getElementById("serverMemoryEditModal");
    if (modal) modal.classList.add("hidden");
    editingServerMemoryId = null;
  }
  
  async function saveServerMemoryEdit() {
    const contentInput = document.getElementById("serverMemoryEditContent");
    const typeSelect = document.getElementById("serverMemoryEditType");
    const importanceSlider = document.getElementById("serverMemoryEditImportanceSlider");
    
    const content = contentInput.value.trim();
    if (!content) {
      alert("记忆内容不能为空");
      return;
    }
    
    const cfg = state.serverMemory || {};
    if (!cfg.serverUrl) {
      alert("请先配置服务器地址");
      return;
    }
    
    try {
      const headers = { "Content-Type": "application/json" };
      if (cfg.token) headers['x-memory-token'] = cfg.token;
      
      const pinnedCheckbox = document.getElementById("serverMemoryEditPinned");
      const bodyData = {
        content: content,
        type: typeSelect.value,
        importance: parseFloat(importanceSlider.value)
      };

      let url, method;
      if (editingServerMemoryId) {
        // 编辑模式：PUT
        url = cfg.serverUrl.replace(/\/$/, "") + "/memory/" + editingServerMemoryId;
        method = "PUT";
      } else {
        // 添加模式：POST
        url = cfg.serverUrl.replace(/\/$/, "") + "/memory";
        method = "POST";
      }
      
      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyData)
      });
      
      if (resp.ok) {
        // 如果有钉选状态变更，单独调用pin接口
        if (editingServerMemoryId && pinnedCheckbox) {
          const pinUrl = cfg.serverUrl.replace(/\/$/, "") + "/api/memory-pin";
          await fetch(pinUrl, { method: "POST", headers, body: JSON.stringify({ id: editingServerMemoryId, pinned: pinnedCheckbox.checked }) }).catch(() => {});
        }
        closeServerMemoryEdit();
        loadServerMemories();
      } else {
        const err = await resp.json().catch(() => ({}));
        alert("保存失败：" + (err.error || resp.status));
      }
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  }
  
  function initServerMemoryEditListeners() {
    const closeBtn = document.getElementById("closeServerMemoryEditModal");
    const cancelBtn = document.getElementById("serverMemoryEditCancelBtn");
    const saveBtn = document.getElementById("serverMemoryEditSaveBtn");
    const importanceSlider = document.getElementById("serverMemoryEditImportanceSlider");
    const importanceValue = document.getElementById("serverMemoryEditImportanceValue");
    const addBtn = document.getElementById("addServerMemoryBtn");
    
    if (closeBtn) closeBtn.addEventListener("click", closeServerMemoryEdit);
    if (cancelBtn) cancelBtn.addEventListener("click", closeServerMemoryEdit);
    if (saveBtn) saveBtn.addEventListener("click", saveServerMemoryEdit);
    if (addBtn) addBtn.addEventListener("click", openServerMemoryAdd);
    
    if (importanceSlider && importanceValue) {
      importanceSlider.addEventListener("input", () => {
        importanceValue.textContent = parseFloat(importanceSlider.value).toFixed(1);
      });
    }
  }

  // ========== 记忆条目管理 ==========
  let editingMemoryItemId = null;

  function renderMemoryItems() {
    if (!els.memoryItemsList) return;
    els.memoryItemsList.innerHTML = "";

    if (!state.memoryItems || !state.memoryItems.length) {
      els.memoryItemsList.innerHTML = '<div class="empty-text">还没有记忆条目，点下方按钮添加。</div>';
      return;
    }

    state.memoryItems.forEach((item) => {
      const div = document.createElement("div");
      let className = "memory-item";
      if (item.enabled === false) className += " disabled";
      if (item.autoExtracted) className += " auto-extracted";
      div.className = className;
      div.dataset.id = item.id;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "memory-toggle";
      toggle.textContent = item.enabled === false ? "○" : "●";
      toggle.title = item.enabled === false ? "点击启用" : "点击禁用";
      toggle.addEventListener("click", () => toggleMemoryItem(item.id));

      const content = document.createElement("div");
      content.className = "memory-content";
      content.textContent = item.content;
      
      // 自动提取标记
      if (item.autoExtracted) {
        const badge = document.createElement("span");
        badge.className = "memory-auto-badge";
        badge.textContent = "自动";
        content.appendChild(badge);
      }

      const actions = document.createElement("div");
      actions.className = "memory-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "small-button";
      editBtn.textContent = "编辑";
      editBtn.addEventListener("click", () => openMemoryItemModal(item));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "small-button";
      delBtn.textContent = "删除";
      delBtn.addEventListener("click", () => deleteMemoryItem(item.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      div.appendChild(toggle);
      div.appendChild(content);
      div.appendChild(actions);
      els.memoryItemsList.appendChild(div);
    });
  }

  function openMemoryItemModal(item) {
    if (!els.memoryItemModal) return;
    if (item) {
      editingMemoryItemId = item.id;
      els.memoryItemModalTitle.textContent = "编辑记忆";
      els.memoryItemContent.value = item.content || "";
    } else {
      editingMemoryItemId = null;
      els.memoryItemModalTitle.textContent = "添加记忆";
      els.memoryItemContent.value = "";
    }
    els.memoryItemModal.classList.remove("hidden");
    els.memoryItemContent.focus();
  }

  function closeMemoryItemModal() {
    if (!els.memoryItemModal) return;
    els.memoryItemModal.classList.add("hidden");
    editingMemoryItemId = null;
  }

  function saveMemoryItem() {
    const content = (els.memoryItemContent.value || "").trim();
    if (!content) {
      window.alert("记忆内容不能为空。");
      return;
    }

    if (editingMemoryItemId) {
      // 编辑现有条目
      const idx = state.memoryItems.findIndex((m) => m.id === editingMemoryItemId);
      if (idx >= 0) {
        state.memoryItems[idx].content = content;
      }
    } else {
      // 添加新条目
      const newItem = {
        id: window.LLMHubState.uuid(),
        content: content,
        enabled: true,
        createdAt: Date.now(),
      };
      state.memoryItems.push(newItem);
    }

    saveState(state);
    renderMemoryItems();
    closeMemoryItemModal();
    // 自动同步
    if (window.LLMHubSync && window.LLMHubSync.autoSync) {
      window.LLMHubSync.autoSync();
    }
  }

  function deleteMemoryItem(id) {
    if (!window.confirm("确定要删除这条记忆吗？")) return;
    state.memoryItems = state.memoryItems.filter((m) => m.id !== id);
    saveState(state);
    renderMemoryItems();
    // 自动同步
    if (window.LLMHubSync && window.LLMHubSync.autoSync) {
      window.LLMHubSync.autoSync();
    }
  }

  function toggleMemoryItem(id) {
    const item = state.memoryItems.find((m) => m.id === id);
    if (item) {
      item.enabled = item.enabled === false ? true : false;
      saveState(state);
      renderMemoryItems();
      // 自动同步
      if (window.LLMHubSync && window.LLMHubSync.autoSync) {
        window.LLMHubSync.autoSync();
      }
    }
  }

  function handleGlobalInstructionChange() {
    state.globalInstruction = els.globalInstructionInput.value;
    saveState(state);
    // 自动同步
    if (window.LLMHubSync && window.LLMHubSync.autoSync) {
      window.LLMHubSync.autoSync();
    }
  }

  async function callLLM(connection, messages, globalInstruction, overrideModel) {
    const provider = normalizeProvider(connection.provider);
    const baseUrl = connection.baseUrl;
    const apiKey = connection.apiKey;
    const model = overrideModel || connection.defaultModel;

    if (!model) {
      throw new Error("未设置模型名称。");
    }
    if (!apiKey) {
      throw new Error("当前连接未填写 API Key。");
    }

    const gen = (window.LLMHubState && window.LLMHubState.loadState
      ? window.LLMHubState.loadState().generationConfig
      : {
          temperature: 0.7,
          maxTokens: 4096,
          frequencyPenalty: 0,
          presencePenalty: 0,
        });

    const temperature =
      typeof gen.temperature === "number" ? gen.temperature : 0.7;
    const maxTokens =
      typeof gen.maxTokens === "number" ? Math.round(gen.maxTokens) : 4096;
    const frequencyPenalty =
      typeof gen.frequencyPenalty === "number" ? gen.frequencyPenalty : 0;
    const presencePenalty =
      typeof gen.presencePenalty === "number" ? gen.presencePenalty : 0;

    if (provider === "openai") {
      const url =
        (baseUrl || "https://api.openai.com/v1").replace(/\/$/, "") +
        "/chat/completions";
      const bodyMessages = [];
      if (globalInstruction && globalInstruction.trim()) {
        bodyMessages.push({ role: "system", content: globalInstruction });
      }
      messages.forEach((m) => {
        bodyMessages.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        });
      });

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model,
          messages: bodyMessages,
          temperature,
          max_tokens: maxTokens,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("OpenAI 兼容接口错误：" + resp.status + " " + text);
      }
      const data = await resp.json();
      const choice = data.choices && data.choices[0];
      if (
        !choice ||
        !choice.message ||
        typeof choice.message.content !== "string"
      ) {
        throw new Error("响应格式异常（没有 content 字段）。");
      }
      return choice.message.content.trim();
    }

    if (provider === "gemini") {
      const safeBase = (
        baseUrl || "https://generativelanguage.googleapis.com/v1beta"
      ).replace(/\/$/, "");
      const url =
        safeBase + "/models/" + encodeURIComponent(model) + ":generateContent?key=" + apiKey;

      const contents = [];
      
      // 把系统指令作为第一条 user 消息
      if (globalInstruction && globalInstruction.trim()) {
        contents.push({
          role: "user",
          parts: [{ text: "[系统指令]\n" + globalInstruction }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "好的，我会遵循这些指令。" }],
        });
      }
      
      messages.forEach((m) => {
        const role = m.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: m.content }],
        });
      });

      const body = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
        ],
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("Gemini 接口错误：" + resp.status + " " + text);
      }
      const data = await resp.json();
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0] ||
        typeof data.candidates[0].content.parts[0].text !== "string"
      ) {
        throw new Error("Gemini 响应格式异常。");
      }
      return data.candidates[0].content.parts[0].text.trim();
    }

    if (provider === "anthropic") {
      const safeBase = (baseUrl || "https://api.anthropic.com/v1").replace(
        /\/$/,
        ""
      );
      const url = safeBase + "/messages";

      const finalMessages = [];

      messages.forEach((m) => {
        if (m.role === "user" || m.role === "assistant") {
          finalMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      });

      const body = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: finalMessages.length
          ? finalMessages
          : [{ role: "user", content: "Hello" }],
      };
      if (globalInstruction && globalInstruction.trim()) {
        body.system = globalInstruction;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("Claude 接口错误：" + resp.status + " " + text);
      }
      const data = await resp.json();
      if (
        !data.content ||
        !data.content[0] ||
        typeof data.content[0].text !== "string"
      ) {
        throw new Error("Claude 响应格式异常。");
      }
      return data.content[0].text.trim();
    }

    throw new Error("未知提供商类型：" + provider);
  }


  function initEventListeners() {
    if (els.globalInstructionInput) {
      const handler = () => {
        state.globalInstruction = els.globalInstructionInput.value || "";
        saveState(state);
      };
      els.globalInstructionInput.addEventListener("input", handler);
      els.globalInstructionInput.addEventListener("blur", handler);
    }

    if (els.temperatureSlider) {
      els.temperatureSlider.addEventListener("input", () => {
        const v = parseFloat(els.temperatureSlider.value);
        state.generationConfig.temperature = isNaN(v) ? 0.7 : v;
        if (els.temperatureValue) {
          els.temperatureValue.textContent =
            state.generationConfig.temperature.toFixed(2);
        }
        saveState(state);
      });
    }

    if (els.maxTokensSlider) {
      els.maxTokensSlider.addEventListener("input", () => {
        const v = parseInt(els.maxTokensSlider.value, 10);
        state.generationConfig.maxTokens = isNaN(v) ? 4096 : v;
        if (els.maxTokensValue) {
          els.maxTokensValue.textContent = String(
            Math.round(state.generationConfig.maxTokens)
          );
        }
        saveState(state);
      });
    }

    if (els.frequencyPenaltySlider) {
      els.frequencyPenaltySlider.addEventListener("input", () => {
        const v = parseFloat(els.frequencyPenaltySlider.value);
        state.generationConfig.frequencyPenalty = isNaN(v) ? 0 : v;
        if (els.frequencyPenaltyValue) {
          els.frequencyPenaltyValue.textContent =
            state.generationConfig.frequencyPenalty.toFixed(2);
        }
        saveState(state);
      });
    }

    if (els.presencePenaltySlider) {
      els.presencePenaltySlider.addEventListener("input", () => {
        const v = parseFloat(els.presencePenaltySlider.value);
        state.generationConfig.presencePenalty = isNaN(v) ? 0 : v;
        if (els.presencePenaltyValue) {
          els.presencePenaltyValue.textContent =
            state.generationConfig.presencePenalty.toFixed(2);
        }
        saveState(state);
      });
    }

    document.addEventListener("click", (evt) => {
      const btn = evt.target.closest("button[data-help]");
      if (!btn) return;
      const key = btn.getAttribute("data-help");
      if (key === "temperature") {
        window.alert(
          "温度：数值越高，模型越敢乱飞，回答更有想象力但也更不稳定；数值越低，回答更老实、更像按部就班。"
        );
      } else if (key === "max_tokens") {
        window.alert(
          "最大回复长度：控制一次最多能回多少字。太小会被截断，太大会浪费额度，4096 一般够用。"
        );
      } else if (key === "frequency_penalty") {
        window.alert(
          "重复惩罚：数值越大，模型越不敢反复重复同一句话，适合压住啰嗦和口头禅。"
        );
      } else if (key === "presence_penalty") {
        window.alert(
          "话题新鲜度：数值越大，模型越愿意引入新话题、新信息，不会老围着一个点打转。"
        );
      }
    });


    // 记忆条目事件
    if (els.addMemoryItemButton) {
      els.addMemoryItemButton.addEventListener("click", () => openMemoryItemModal(null));
    }
    if (els.memoryItemSaveButton) {
      els.memoryItemSaveButton.addEventListener("click", saveMemoryItem);
    }
    if (els.memoryItemCancelButton) {
      els.memoryItemCancelButton.addEventListener("click", closeMemoryItemModal);
    }
    if (els.closeMemoryItemModal) {
      els.closeMemoryItemModal.addEventListener("click", closeMemoryItemModal);
    }

    // 上下文限制事件
    if (els.contextLimitMode) {
      els.contextLimitMode.addEventListener("change", () => {
        if (!state.contextLimit) state.contextLimit = {};
        state.contextLimit.mode = els.contextLimitMode.value;
        saveState(state);
        renderContextLimit();
        // 自动同步
        if (window.LLMHubSync && window.LLMHubSync.autoSync) {
          window.LLMHubSync.autoSync();
        }
      });
    }
    if (els.maxRoundsSlider) {
      els.maxRoundsSlider.addEventListener("input", () => {
        const v = parseInt(els.maxRoundsSlider.value, 10);
        if (!state.contextLimit) state.contextLimit = {};
        state.contextLimit.maxRounds = isNaN(v) ? 50 : v;
        if (els.maxRoundsValue) {
          els.maxRoundsValue.textContent = String(state.contextLimit.maxRounds);
        }
        saveState(state);
        // 自动同步（有防抖）
        if (window.LLMHubSync && window.LLMHubSync.autoSync) {
          window.LLMHubSync.autoSync();
        }
      });
    }
    if (els.maxContextTokensSlider) {
      els.maxContextTokensSlider.addEventListener("input", () => {
        const v = parseInt(els.maxContextTokensSlider.value, 10);
        if (!state.contextLimit) state.contextLimit = {};
        state.contextLimit.maxTokens = isNaN(v) ? 30000 : v;
        if (els.maxContextTokensValue) {
          els.maxContextTokensValue.textContent = String(state.contextLimit.maxTokens);
        }
        saveState(state);
        // 自动同步（有防抖）
        if (window.LLMHubSync && window.LLMHubSync.autoSync) {
          window.LLMHubSync.autoSync();
        }
      });
    }
    
    // 自动记忆事件
    if (els.autoMemoryEnabled) {
      els.autoMemoryEnabled.addEventListener("change", () => {
        if (!state.autoMemory) state.autoMemory = {};
        state.autoMemory.enabled = els.autoMemoryEnabled.checked;
        saveState(state);
        renderAutoMemory();
        if (window.LLMHubSync && window.LLMHubSync.autoSync) {
          window.LLMHubSync.autoSync();
        }
      });
    }
    if (els.autoMemoryIntervalSlider) {
      els.autoMemoryIntervalSlider.addEventListener("input", () => {
        const v = parseInt(els.autoMemoryIntervalSlider.value, 10);
        if (!state.autoMemory) state.autoMemory = {};
        state.autoMemory.extractAfterRounds = isNaN(v) ? 15 : v;
        if (els.autoMemoryIntervalValue) {
          els.autoMemoryIntervalValue.textContent = String(state.autoMemory.extractAfterRounds);
        }
        saveState(state);
        if (window.LLMHubSync && window.LLMHubSync.autoSync) {
          window.LLMHubSync.autoSync();
        }
      });
    }
    // 本地记忆提取：连接和模型选择
    if (els.autoMemoryConnectionSelect) {
      els.autoMemoryConnectionSelect.addEventListener("change", () => {
        if (!state.autoMemory) state.autoMemory = {};
        state.autoMemory.extractConnectionId = els.autoMemoryConnectionSelect.value || "";
        saveState(state);
      });
    }
    if (els.autoMemoryModelInput) {
      els.autoMemoryModelInput.addEventListener("change", () => {
        if (!state.autoMemory) state.autoMemory = {};
        state.autoMemory.extractModel = els.autoMemoryModelInput.value.trim() || "";
        saveState(state);
      });
    }
    
    // 服务器记忆事件
    if (els.serverMemoryEnabled) {
      els.serverMemoryEnabled.addEventListener("change", () => {
        if (!state.serverMemory) state.serverMemory = { serverUrl: "", extractAfterRounds: 20 };
        state.serverMemory.enabled = els.serverMemoryEnabled.checked;
        saveState(state);
        renderServerMemory();
      });
    }
    if (els.serverMemoryUrl) {
      els.serverMemoryUrl.addEventListener("input", () => {
        if (!state.serverMemory) state.serverMemory = { enabled: false, extractAfterRounds: 20 };
        state.serverMemory.serverUrl = els.serverMemoryUrl.value.trim();
        saveState(state);
      });
    }
    if (els.serverMemoryToken) {
      els.serverMemoryToken.addEventListener("input", () => {
        if (!state.serverMemory) state.serverMemory = { enabled: false, extractAfterRounds: 20 };
        state.serverMemory.token = els.serverMemoryToken.value.trim();
        saveState(state);
      });
    }
    if (els.serverMemoryIntervalSlider) {
      els.serverMemoryIntervalSlider.addEventListener("input", () => {
        const v = parseInt(els.serverMemoryIntervalSlider.value, 10);
        if (els.serverMemoryIntervalValue) {
          els.serverMemoryIntervalValue.textContent = v;
        }
        if (!state.serverMemory) state.serverMemory = { enabled: false, serverUrl: "" };
        state.serverMemory.extractAfterRounds = v;
        saveState(state);
      });
    }
    // 服务器记忆提取：连接和模型选择
    if (els.serverMemoryConnectionSelect) {
      els.serverMemoryConnectionSelect.addEventListener("change", () => {
        if (!state.serverMemory) state.serverMemory = { enabled: false, serverUrl: "" };
        state.serverMemory.extractConnectionId = els.serverMemoryConnectionSelect.value || "";
        saveState(state);
      });
    }
    if (els.serverMemoryModelInput) {
      els.serverMemoryModelInput.addEventListener("change", () => {
        if (!state.serverMemory) state.serverMemory = { enabled: false, serverUrl: "" };
        state.serverMemory.extractModel = els.serverMemoryModelInput.value.trim() || "";
        saveState(state);
      });
    }
    if (els.viewServerMemoriesBtn) {
      els.viewServerMemoriesBtn.addEventListener("click", loadServerMemories);
    }
    
  }

  
  function init() {
    initDomRefs();
    renderGlobalInstruction();
    renderGenerationConfig();
    renderContextLimit();
    renderAutoMemory();
    renderServerMemory();
    renderMemoryItems();
    initEventListeners();
    initServerMemoryEditListeners();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();