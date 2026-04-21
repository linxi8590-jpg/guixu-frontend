(function () {
  "use strict";

  const BUILTIN_MODELS = {
    openai: [
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.1",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4o",
      "gpt-4o-mini",
      "o3-mini",
      "o1"
    ],
    gemini: [
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ],
    anthropic: [
      "claude-opus-4-7",
      "claude-opus-4-6",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-1"
    ],

    // 兼容一些你可能会用到的写法（中转站/自定义 provider）
    claude: [
      "claude-opus-4-7",
      "claude-opus-4-6",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-1"
    ],
    deepseek: [
      "deepseek-chat",
      "deepseek-reasoner"
    ],
    openai_compat: [
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.1",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4o",
      "gpt-4o-mini",
      "deepseek-chat",
      "deepseek-reasoner"
    ],
    "openai-compatible": [
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.1",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4o",
      "gpt-4o-mini",
      "deepseek-chat",
      "deepseek-reasoner"
    ]
  };

  function normalizeProvider(raw) {
    const v = (raw || "").toString().toLowerCase();
    if (v.includes("gemini")) return "gemini";
    if (v.includes("anthropic") || v.includes("claude")) return "anthropic";
    if (v.includes("openai")) return "openai";
    if (BUILTIN_MODELS && BUILTIN_MODELS[v]) return v;
    return "openai";
  }


  const {
    uuid,
    loadState,
    saveState,
    getActiveConnection,
    setActiveConnection,
    ensureInitialConnection,
  } = window.LLMHubState;

  let state = ensureInitialConnection(loadState());
  const els = {};

  function renderConnections() {
    const listEl = els.connectionList;
    const activeConn = getActiveConnection(state);
    listEl.innerHTML = "";

    if (!state.connections.length) {
      listEl.classList.add("empty-hint");
      listEl.innerHTML =
        '<div class="empty-text">还没有连接，先添加一个吧。</div>';
      if (els.connectionEditor) {
        els.connectionEditor.classList.add("hidden");
      }
      if (els.connectionEmptyHint) {
        if (els.connectionEmptyHint) els.connectionEmptyHint.style.display = "block";
      }
      return;
    }
    listEl.classList.remove("empty-hint");

    state.connections.forEach((conn) => {
      const item = document.createElement("div");
      item.className = "list-item";
      if (activeConn && activeConn.id === conn.id) item.classList.add("active");
      item.dataset.id = conn.id;

      const title = document.createElement("div");
      title.className = "list-item-title";
      title.textContent = conn.name;

      const sub = document.createElement("div");
      sub.className = "list-item-sub";
      sub.textContent =
        conn.provider.toUpperCase() +
        " · " +
        (conn.defaultModel || "未设置模型");

      const actions = document.createElement("div");
      actions.className = "list-item-actions";

      const useBtn = document.createElement("button");
      useBtn.className = "small-button";
      useBtn.textContent = "设为当前";
      useBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setActiveConnection(state, conn.id);
        saveState(state);
        renderConnections();
      });

      const editBtn = document.createElement("button");
      editBtn.className = "small-button";
      editBtn.textContent = "编辑";
      editBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openConnectionEditor(conn);
      });

      const delBtn = document.createElement("button");
      delBtn.className = "small-button";
      delBtn.textContent = "删除";
      delBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        deleteConnection(conn.id);
      });

      actions.appendChild(useBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      item.appendChild(title);
      item.appendChild(sub);
      item.appendChild(actions);
      item.addEventListener("click", () => openConnectionEditor(conn));

      listEl.appendChild(item);
    });
  }

  function updateBaseUrlPlaceholder() {
    const provider = els.connProviderInput.value;
    const input = els.connBaseUrlInput;
    const hint = els.connBaseUrlHint;
    if (provider === "openai") {
      if (!input.value) input.value = "https://api.openai.com/v1";
      hint.textContent =
        "OpenAI 官方 / DeepSeek / 公益中转：一般都是 OpenAI 兼容 /v1/chat/completions 接口。";
    } else if (provider === "gemini") {
      if (!input.value)
        input.value = "https://generativelanguage.googleapis.com/v1beta";
      hint.textContent =
        "Gemini 官方：用 Generative Language API，后面会自动拼 /models/xxx:generateContent。";
    } else if (provider === "anthropic") {
      if (!input.value) input.value = "https://api.anthropic.com/v1";
      hint.textContent =
        "Claude 官方：使用 /v1/messages 接口，自动加 anthropic-version 头。";
    }
  }

  function openModelPicker() {
    if (!els.modelPickerOverlay) return;
    buildCustomModelChips();
    // 预选：如果当前输入框里已有模型名，就高亮同名按钮
    const current = (els.connDefaultModelInput ? els.connDefaultModelInput.value : "").trim();
    selectedModelName = current || "";
    highlightSelectedChip(selectedModelName);
    els.modelPickerOverlay.classList.remove("hidden");
  }

  function closeModelPicker() {
    if (!els.modelPickerOverlay) return;
    els.modelPickerOverlay.classList.add("hidden");
  }

  let selectedModelName = "";

  function buildCustomModelChips() {
    if (!els.modelPickerCustomList) return;
    const raw = els.connModelListInput ? (els.connModelListInput.value || "") : "";
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    els.modelPickerCustomList.innerHTML = "";
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty-text small";
      empty.textContent = "（你还没填“可选模型列表”）";
      els.modelPickerCustomList.appendChild(empty);
      return;
    }

    list.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "model-chip";
      btn.dataset.model = name;
      btn.textContent = name;
      els.modelPickerCustomList.appendChild(btn);
    });
  }

  function highlightSelectedChip(name) {
    if (!els.modelPickerOverlay) return;
    const chips = els.modelPickerOverlay.querySelectorAll(".model-chip");
    chips.forEach((c) => c.classList.remove("selected"));
    if (!name) return;
    chips.forEach((c) => {
      const v = (c.dataset.model || c.textContent || "").trim();
      if (v === name) c.classList.add("selected");
    });
  }

  function pickModelFromChip(target) {
    const v = (target.dataset.model || target.textContent || "").trim();
    if (!v) return;
    selectedModelName = v;
    highlightSelectedChip(selectedModelName);
  }

  function openConnectionEditor(conn) {
    if (els.connectionEmptyHint) els.connectionEmptyHint.style.display = "none";
    els.connectionEditor.classList.remove("hidden");
    els.connectionTestResult.textContent = "";
    if (conn) {
      els.connectionEditor.dataset.editId = conn.id;
      els.connectionEditorTitle.textContent = "编辑连接";
      els.connNameInput.value = conn.name || "";
      els.connProviderInput.value = conn.provider || "openai";
      els.connBaseUrlInput.value = conn.baseUrl || "";
      els.connApiKeyInput.value = conn.apiKey || "";
      els.connDefaultModelInput.value = conn.defaultModel || "";
      els.connModelListInput.value = (conn.modelList || []).join(",");
      updateBaseUrlPlaceholder();
    } else {
      delete els.connectionEditor.dataset.editId;
      els.connectionEditorTitle.textContent = "新建连接";
      els.connNameInput.value = "";
      els.connProviderInput.value = "openai";
      els.connBaseUrlInput.value = "";
      els.connApiKeyInput.value = "";
      els.connDefaultModelInput.value = "";
      els.connModelListInput.value = "";
      updateBaseUrlPlaceholder();
    }
  }

  function closeConnectionEditor() {
    els.connectionEditor.classList.add("hidden");
    els.connectionTestResult.textContent = "";
    if (!state.connections.length) {
      if (els.connectionEmptyHint) els.connectionEmptyHint.style.display = "block";
    }
  }

  function collectConnectionFromEditor() {
    const name = els.connNameInput.value.trim();
    const provider = els.connProviderInput.value;
    const baseUrl = els.connBaseUrlInput.value.trim();
    const apiKey = els.connApiKeyInput.value.trim();
    const defaultModel = els.connDefaultModelInput.value.trim();
    const modelListRaw = els.connModelListInput.value.trim();

    if (!name || !provider || !apiKey) {
      window.alert("名称 / 提供商 / API Key 不能为空。");
      return null;
    }

    const modelList = modelListRaw
      ? modelListRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return { name, provider, baseUrl, apiKey, defaultModel, modelList };
  }

  async function testConnection(connPartial) {
    const provider = connPartial.provider;
    const baseUrl = connPartial.baseUrl;
    const apiKey = connPartial.apiKey;
    
    // 按 provider 选择合理的测试 fallback 模型
    let fallbackModel = "gpt-4o-mini";
    const p = (provider || "").toLowerCase();
    if (p.includes("anthropic") || p.includes("claude")) {
      fallbackModel = "claude-haiku-4-5-20251001";
    } else if (p.includes("gemini")) {
      fallbackModel = "gemini-2.5-flash";
    } else if (p.includes("deepseek")) {
      fallbackModel = "deepseek-chat";
    }
    const model = connPartial.defaultModel || fallbackModel;

    const messages = [
      { role: "user", content: "简单回复一个“ok”，我在测试 API 是否连通。" },
    ];

    try {
      const reply = await callLLM(
        {
          id: "test",
          name: connPartial.name,
          provider,
          baseUrl,
          apiKey,
          defaultModel: model,
          modelList: connPartial.modelList || [],
        },
        messages,
        ""
      );
      return { ok: true, text: reply.slice(0, 100) };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  async function handleTestConnectionClick() {
    const connPartial = collectConnectionFromEditor();
    if (!connPartial) return;
    els.connectionTestResult.className = "test-result testing";
    els.connectionTestResult.textContent = "测试中…";
    try {
      const result = await testConnection(connPartial);
      if (result.ok) {
        els.connectionTestResult.className = "test-result success";
        els.connectionTestResult.textContent =
          "测试成功，模型回复：" + result.text;
      } else {
        els.connectionTestResult.className = "test-result error";
        els.connectionTestResult.textContent = "测试失败：" + result.error;
      }
    } catch (e) {
      els.connectionTestResult.className = "test-result error";
      els.connectionTestResult.textContent =
        "测试异常：" + (e.message || String(e));
    }
  }

  function handleSaveConnection() {
    const editId = els.connectionEditor.dataset.editId;
    const connPartial = collectConnectionFromEditor();
    if (!connPartial) return;

    if (editId) {
      const idx = state.connections.findIndex((c) => c.id === editId);
      if (idx >= 0) {
        state.connections[idx] = Object.assign(
          {},
          state.connections[idx],
          connPartial
        );
      }
    } else {
      const id = uuid();
      state.connections.push({ id, ...connPartial });
      if (!state.activeConnectionId) {
        state.activeConnectionId = id;
      }
    }
    saveState(state);
    renderConnections();
    closeConnectionEditor();
    // 自动同步
    if (window.LLMHubSync && window.LLMHubSync.autoSync) {
      window.LLMHubSync.autoSync();
    }
  }

  function deleteConnection(id) {
    const inUse = state.chats.some((c) => c.connectionId === id);
    if (inUse) {
      if (!window.confirm("这个连接在一些会话里正在使用，确定要删除吗？")) {
        return;
      }
    }
    state.connections = state.connections.filter((c) => c.id !== id);
    if (state.activeConnectionId === id) {
      state.activeConnectionId = state.connections[0]
        ? state.connections[0].id
        : null;
    }
    state.chats.forEach((c) => {
      if (c.connectionId === id) c.connectionId = state.activeConnectionId;
    });
    saveState(state);
    renderConnections();
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

    const temperature = typeof gen.temperature === "number" ? gen.temperature : 0.7;
    const maxTokens = typeof gen.maxTokens === "number" ? Math.round(gen.maxTokens) : 4096;
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
        body: JSON.stringify((() => {
          const body = {
            model,
            messages: bodyMessages,
            temperature,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
          };
          // GPT-5 系列用 max_completion_tokens 替代 max_tokens
          if (model && (model.startsWith("gpt-5") || model.startsWith("o3") || model.startsWith("o4"))) {
            body.max_completion_tokens = maxTokens;
          } else {
            body.max_tokens = maxTokens;
          }
          return body;
        })()),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("OpenAI 兼容接口错误：" + resp.status + " " + text);
      }
      const data = await resp.json();
      console.log("[连接测试] 原始响应:", JSON.stringify(data).slice(0, 500));
      const choice = data.choices && data.choices[0];
      // GPT-5 系列可能用 output 而不是 choices
      if (!choice || !choice.message) {
        // 尝试从其他位置提取文本
        const fallbackText = data.output_text 
          || data.output?.[0]?.content?.[0]?.text
          || data.content?.[0]?.text
          || null;
        if (fallbackText) {
          return fallbackText.trim();
        }
        throw new Error("响应格式异常。原始响应: " + JSON.stringify(data).slice(0, 300));
      }
      // GPT-5 系列可能 content 为 null，文本在 reasoning_content 或 refusal 中
      const msg = choice.message;
      const text = msg.content || msg.reasoning_content || msg.refusal || "";
      if (!text) {
        throw new Error("响应格式异常（content 为空）。\n原始响应: " + JSON.stringify(data).slice(0, 300));
      }
      return text.trim();
    }

    if (provider === "gemini") {
      // 版本检测
      const ml = (model || "").toLowerCase();
      let apiVersion = "v1beta"; // 默认
      if (ml.includes("2.5") && !ml.includes("exp") && !ml.includes("preview")) {
        apiVersion = "v1";
      } else if (ml.includes("1.5") || ml.includes("1.0")) {
        apiVersion = "v1";
      }
      
      let safeBase = (baseUrl || `https://generativelanguage.googleapis.com/${apiVersion}`).replace(/\/$/, "");
      if (!safeBase.match(/\/v1(beta)?$/)) {
        safeBase += "/" + apiVersion;
      }
      const url = safeBase + "/models/" + encodeURIComponent(model) + ":generateContent?key=" + apiKey;

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

  function initDomRefs() {
    // 默认模型下拉选择
    const defaultModelSelect = document.getElementById('defaultModelSelect');
    if (defaultModelSelect) {
      defaultModelSelect.addEventListener('change', () => {
        const val = defaultModelSelect.value;
        if (val && els.connDefaultModelInput) {
          els.connDefaultModelInput.value = val;
        }
        defaultModelSelect.value = '';
      });
    }
    els.connectionList = document.getElementById("connectionList");
    els.addConnectionButton = document.getElementById("addConnectionButton");
    els.connectionEditor = document.getElementById("connectionEditor");
    els.connectionEditorTitle =
      document.getElementById("connectionEditorTitle");
    els.connNameInput = document.getElementById("connNameInput");
    els.connProviderInput = document.getElementById("connProviderInput");
    els.connBaseUrlInput = document.getElementById("connBaseUrlInput");
    els.connBaseUrlHint = document.getElementById("connBaseUrlHint");
    els.connApiKeyInput = document.getElementById("connApiKeyInput");
    els.connDefaultModelInput =
      document.getElementById("connDefaultModelInput");
    els.connModelListInput = document.getElementById("connModelListInput");
    els.testConnectionButton =
      document.getElementById("testConnectionButton");
    els.saveConnectionButton = document.getElementById("saveConnectionButton");
    els.cancelConnectionEditButton = document.getElementById(
      "cancelConnectionEditButton"
    );
    els.connectionTestResult = document.getElementById(
      "connectionTestResult"
    );
    els.connectionEmptyHint =
      document.getElementById("connectionEmptyHint");

    els.openModelPickerButton =
      document.getElementById("openModelPickerButton");
    els.modelPickerOverlay = document.getElementById("modelPickerOverlay");
    els.modelPickerCustomList = document.getElementById("modelPickerCustomList");
    els.modelPickerCancelButton = document.getElementById(
      "modelPickerCancelButton"
    );
    els.modelPickerConfirmButton = document.getElementById(
      "modelPickerConfirmButton"
    );
    els.closeModelPickerButton = document.getElementById(
      "closeModelPickerButton"
    );
  }

  function initEventListeners() {
    if (els.addConnectionButton) {
      els.addConnectionButton.addEventListener("click", () =>
        openConnectionEditor(null)
      );
    }
    if (els.connProviderInput) {
      els.connProviderInput.addEventListener("change", () => {
        updateBaseUrlPlaceholder();
      });
    }
    if (els.testConnectionButton) {
      els.testConnectionButton.addEventListener(
        "click",
        handleTestConnectionClick
      );
    }
    if (els.saveConnectionButton) {
      els.saveConnectionButton.addEventListener("click", handleSaveConnection);
    }
    if (els.cancelConnectionEditButton) {
      els.cancelConnectionEditButton.addEventListener(
        "click",
        closeConnectionEditor
      );
    }

    if (els.openModelPickerButton) {
      els.openModelPickerButton.addEventListener("click", openModelPicker);
    }
    if (els.modelPickerCancelButton) {
      els.modelPickerCancelButton.addEventListener("click", closeModelPicker);
    }
    if (els.closeModelPickerButton) {
      els.closeModelPickerButton.addEventListener("click", closeModelPicker);
    }
    if (els.modelPickerOverlay) {
      els.modelPickerOverlay.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button.model-chip") : null;
        if (!btn) return;
        pickModelFromChip(btn);
      });
    }

    if (els.modelPickerConfirmButton) {
      els.modelPickerConfirmButton.addEventListener("click", () => {
        if (!selectedModelName) {
          window.alert("先点一个模型（如果列表里没有，就关闭弹窗去下面手动输入）。");
          return;
        }
        if (els.connDefaultModelInput) {
          els.connDefaultModelInput.value = selectedModelName;
        }
        closeModelPicker();
      });
    }
  }


  // 初始化
  function init() {
    initDomRefs();
    initEventListeners();
    renderConnections();
    updateBaseUrlPlaceholder();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 导出给其他模块用
  window.ConnectionHelper = {
    getConnections: () => state.connections || [],
    callLLM
  };
})();
