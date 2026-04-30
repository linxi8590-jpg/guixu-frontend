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
    
    // 主动消息相关
    els.proactiveEnabled = document.getElementById("proactiveEnabled");
    els.proactiveSection = document.getElementById("proactiveSection");
    els.proactiveTargetChat = document.getElementById("proactiveTargetChat");
    els.proactiveIdleEnabled = document.getElementById("proactiveIdleEnabled");
    els.proactiveIdleConfig = document.getElementById("proactiveIdleConfig");
    els.proactiveIdleSlider = document.getElementById("proactiveIdleSlider");
    els.proactiveIdleValue = document.getElementById("proactiveIdleValue");
    els.proactivePrompts = document.getElementById("proactivePrompts");
    els.dndEnabled = document.getElementById("dndEnabled");
    els.dndConfig = document.getElementById("dndConfig");
    els.dndStart = document.getElementById("dndStart");
    els.dndEnd = document.getElementById("dndEnd");
    els.taskQueueList = document.getElementById("taskQueueList");
    els.refreshTasksBtn = document.getElementById("refreshTasksBtn");
    // 漫游相关
    els.wanderEnabled = document.getElementById("wanderEnabled");
    els.wanderConfig = document.getElementById("wanderConfig");
    els.wanderPerDaySlider = document.getElementById("wanderPerDaySlider");
    els.wanderPerDayValue = document.getElementById("wanderPerDayValue");
    els.wanderInterests = document.getElementById("wanderInterests");
    els.wanderTriggerBtn = document.getElementById("wanderTriggerBtn");
    els.wanderLogsBtn = document.getElementById("wanderLogsBtn");
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
  function renderProactiveMessage() {
    const cfg = state.proactiveMessage || {};
    
    if (els.proactiveEnabled) {
      els.proactiveEnabled.checked = cfg.enabled || false;
    }
    
    if (els.proactiveSection) {
      els.proactiveSection.style.display = cfg.enabled ? "block" : "none";
    }
    
    // 目标窗口下拉
    if (els.proactiveTargetChat) {
      els.proactiveTargetChat.innerHTML = '<option value="">当前活跃窗口</option>';
      const chatsSorted = [...(state.chats || [])].sort(
        (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
      );
      chatsSorted.forEach(chat => {
        const opt = document.createElement("option");
        opt.value = chat.id;
        opt.textContent = chat.title || "未命名会话";
        if (cfg.targetChatId === chat.id) opt.selected = true;
        els.proactiveTargetChat.appendChild(opt);
      });
    }
    
    // 空闲触发
    if (els.proactiveIdleEnabled) {
      els.proactiveIdleEnabled.checked = cfg.idleEnabled || false;
    }
    if (els.proactiveIdleConfig) {
      els.proactiveIdleConfig.style.display = cfg.idleEnabled ? "block" : "none";
    }
    if (els.proactiveIdleSlider) {
      const v = cfg.idleMinutes || 30;
      els.proactiveIdleSlider.value = v;
      if (els.proactiveIdleValue) els.proactiveIdleValue.textContent = v;
    }
    
    // 提示词
    if (els.proactivePrompts) {
      const prompts = cfg.prompts || [];
      els.proactivePrompts.value = prompts.join("\n");
    }
    
    // 免打扰时段
    if (els.dndEnabled) {
      els.dndEnabled.checked = cfg.dndEnabled || false;
    }
    if (els.dndConfig) {
      els.dndConfig.style.display = cfg.dndEnabled ? "block" : "none";
    }
    if (els.dndStart) {
      els.dndStart.value = cfg.dndStart || "23:00";
    }
    if (els.dndEnd) {
      els.dndEnd.value = cfg.dndEnd || "07:00";
    }
    
    // 漫游配置渲染
    const wanderCfg = cfg.wander || {};
    if (els.wanderEnabled) {
      els.wanderEnabled.checked = wanderCfg.enabled || false;
    }
    if (els.wanderPerDaySlider) {
      const v = wanderCfg.perDay || 3;
      els.wanderPerDaySlider.value = v;
      if (els.wanderPerDayValue) els.wanderPerDayValue.textContent = v;
    }
    if (els.wanderInterests) {
      els.wanderInterests.value = wanderCfg.interests || "";
      if (!wanderCfg.interests) {
        els.wanderInterests.placeholder = "命理学、心理学、哲学、AI新闻、小红书生活分享";
      }
    }
    if (els.wanderConfig) {
      els.wanderConfig.style.display = wanderCfg.enabled ? "block" : "none";
    }
    
    // 任务队列
    renderTaskQueue();
  }
  
  function renderTaskQueue() {
    if (!els.taskQueueList) return;
    
    const taskQueue = JSON.parse(localStorage.getItem('llmhub_task_queue') || '[]');
    
    if (taskQueue.length === 0) {
      els.taskQueueList.innerHTML = '<div class="empty-text" style="font-size: 0.85rem;">暂无提醒任务</div>';
      return;
    }
    
    const now = Date.now();
    els.taskQueueList.innerHTML = "";
    
    taskQueue.forEach((task, idx) => {
      const div = document.createElement("div");
      div.style.cssText = "display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 0.5rem; margin-bottom: 0.5rem;";
      
      let timeText = "";
      let icon = "";
      
      if (task.type === "once") {
        const triggerTime = new Date(task.triggerAt);
        const remaining = Math.max(0, Math.round((task.triggerAt - now) / 60000));
        timeText = remaining > 0 
          ? `${remaining}分钟后 (${triggerTime.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})})`
          : `已过期`;
        icon = "⏱️";
      } else if (task.type === "daily") {
        timeText = `每天 ${task.time}`;
        icon = "📅";
      }
      
      div.innerHTML = `
        <span style="flex: 1;">
          <span>${icon}</span>
          <strong>${timeText}</strong>
          <br><span style="font-size: 0.85rem; color: var(--text-secondary);">${task.reason}</span>
        </span>
        <button type="button" class="small-button" style="background: var(--danger-color, #e74c3c);">删除</button>
      `;
      
      div.querySelector("button").addEventListener("click", () => {
        removeTask(idx);
      });
      
      els.taskQueueList.appendChild(div);
    });
  }
  
  function removeTask(idx) {
    const taskQueue = JSON.parse(localStorage.getItem('llmhub_task_queue') || '[]');
    if (idx >= 0 && idx < taskQueue.length) {
      taskQueue.splice(idx, 1);
      localStorage.setItem('llmhub_task_queue', JSON.stringify(taskQueue));
      renderTaskQueue();
    }
  }
  
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
    
    // 主动消息事件
    if (els.proactiveEnabled) {
      els.proactiveEnabled.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.enabled = els.proactiveEnabled.checked;
        saveState(state);
        renderProactiveMessage();
        // 通知 chat.js 重新初始化定时器
        if (window.LLMHubProactive) window.LLMHubProactive.init();
      });
    }
    if (els.proactiveTargetChat) {
      els.proactiveTargetChat.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.targetChatId = els.proactiveTargetChat.value || null;
        saveState(state);
      });
    }
    if (els.proactiveIdleEnabled) {
      els.proactiveIdleEnabled.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.idleEnabled = els.proactiveIdleEnabled.checked;
        saveState(state);
        renderProactiveMessage();
        if (window.LLMHubProactive) window.LLMHubProactive.init();
      });
    }
    if (els.proactiveIdleSlider) {
      els.proactiveIdleSlider.addEventListener("input", () => {
        const v = parseInt(els.proactiveIdleSlider.value, 10);
        if (els.proactiveIdleValue) els.proactiveIdleValue.textContent = v;
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.idleMinutes = v;
        saveState(state);
        if (window.LLMHubProactive) window.LLMHubProactive.init();
      });
    }
    if (els.proactivePrompts) {
      els.proactivePrompts.addEventListener("input", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        const text = els.proactivePrompts.value || "";
        state.proactiveMessage.prompts = text.split("\n").map(s => s.trim()).filter(Boolean);
        saveState(state);
      });
    }
    
    // 免打扰事件
    if (els.dndEnabled) {
      els.dndEnabled.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.dndEnabled = els.dndEnabled.checked;
        saveState(state);
        renderProactiveMessage();
      });
    }
    if (els.dndStart) {
      els.dndStart.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.dndStart = els.dndStart.value;
        saveState(state);
      });
    }
    if (els.dndEnd) {
      els.dndEnd.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        state.proactiveMessage.dndEnd = els.dndEnd.value;
        saveState(state);
      });
    }
    
    // 刷新任务列表
    if (els.refreshTasksBtn) {
      els.refreshTasksBtn.addEventListener("click", renderTaskQueue);
    }
    
    // ===== 漫游事件 =====
    if (els.wanderEnabled) {
      els.wanderEnabled.addEventListener("change", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        if (!state.proactiveMessage.wander) state.proactiveMessage.wander = {};
        state.proactiveMessage.wander.enabled = els.wanderEnabled.checked;
        if (els.wanderConfig) {
          els.wanderConfig.style.display = els.wanderEnabled.checked ? "block" : "none";
        }
        saveState(state);
      });
    }
    if (els.wanderPerDaySlider) {
      els.wanderPerDaySlider.addEventListener("input", () => {
        const v = parseInt(els.wanderPerDaySlider.value);
        if (els.wanderPerDayValue) els.wanderPerDayValue.textContent = v;
        if (!state.proactiveMessage) state.proactiveMessage = {};
        if (!state.proactiveMessage.wander) state.proactiveMessage.wander = {};
        state.proactiveMessage.wander.perDay = v;
        saveState(state);
      });
    }
    if (els.wanderInterests) {
      els.wanderInterests.addEventListener("input", () => {
        if (!state.proactiveMessage) state.proactiveMessage = {};
        if (!state.proactiveMessage.wander) state.proactiveMessage.wander = {};
        state.proactiveMessage.wander.interests = els.wanderInterests.value;
        saveState(state);
      });
    }
    if (els.wanderTriggerBtn) {
      els.wanderTriggerBtn.addEventListener("click", () => {
        // 写入触发标记，主页面 poll 时会检测到并执行漫游
        localStorage.setItem("llmhub_wander_trigger", String(Date.now()));
        alert("已发送漫游指令！\n\n回到主聊天页面，澈会在30秒内出门逛。\n完成后状态栏会提示「🌿 澈逛完回来了」。");
      });
    }
    if (els.wanderLogsBtn) {
      els.wanderLogsBtn.addEventListener("click", () => {
        try {
          const logs = JSON.parse(localStorage.getItem("llmhub_wander_logs") || "[]");
          if (logs.length === 0) {
            alert("还没有漫游日志。\n\n启用漫游后澈自主或手动触发漫游，回来后会在这里看到记录。");
            return;
          }
          const lines = logs.slice().reverse().map(log => {
            const t = new Date(log.ts).toLocaleString("zh-CN");
            return `[${t}] ${log.summary || "(无总结)"}`;
          }).join("\n\n");
          alert(`最近 ${logs.length} 次漫游日志:\n\n${lines}`);
        } catch (e) {
          alert("读取日志失败: " + e.message);
        }
      });
    }
  }

async function loadChatsForProactive() {
    // 从服务器拉聊天列表，用于主动消息目标下拉框
    if (!window.LLMHubAPI) return;
    try {
      const result = await window.LLMHubAPI.getChats(100);
      if (result && Array.isArray(result.chats)) {
        state.chats = result.chats.map(c => ({
          id: c.id,
          title: c.title || "新对话",
          updatedAt: new Date(c.updated_at).getTime(),
          createdAt: new Date(c.created_at).getTime(),
        }));
        // 拉到后重新渲染一次
        renderProactiveMessage();
      }
    } catch (e) {
      console.warn("[memory] 拉取聊天列表失败:", e);
    }
  }
  
  function init() {
    initDomRefs();
    renderGlobalInstruction();
    renderGenerationConfig();
    renderContextLimit();
    renderAutoMemory();
    renderServerMemory();
    renderProactiveMessage();
    renderMemoryItems();
    initEventListeners();
    initServerMemoryEditListeners();
    // 异步拉取聊天列表，让"目标窗口"下拉能显示所有窗口
    loadChatsForProactive();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();