// ========== MCP 服务器管理模块 ==========
(function() {
  const { loadState, saveState } = window.LLMHubState;
  
  let els = {};
  let editingMcpId = null;

  function getState() {
    return loadState();
  }

  function initRefs() {
    els = {
      mcpServerList: document.getElementById("mcpServerList"),
      mcpEditor: document.getElementById("mcpEditor"),
      mcpEditorTitle: document.getElementById("mcpEditorTitle"),
      mcpNameInput: document.getElementById("mcpNameInput"),
      mcpUrlInput: document.getElementById("mcpUrlInput"),
      mcpTokenInput: document.getElementById("mcpTokenInput"),
      addMcpButton: document.getElementById("addMcpButton"),
      saveMcpButton: document.getElementById("saveMcpButton"),
      cancelMcpButton: document.getElementById("cancelMcpButton"),
      deleteMcpButton: document.getElementById("deleteMcpButton"),
      testMcpButton: document.getElementById("testMcpButton"),
    };
  }

  function renderMcpServers() {
    const listEl = els.mcpServerList;
    if (!listEl) return;
    
    const state = getState();
    const servers = state.mcpServers || [];
    listEl.innerHTML = "";

    if (!servers.length) {
      listEl.innerHTML = '<div class="empty-text">还没有 MCP 服务器，点击上方"添加"按钮。</div>';
      return;
    }

    servers.forEach((server) => {
      const item = document.createElement("div");
      item.className = "mcp-server-item";
      item.innerHTML = `
        <div class="mcp-server-info">
          <div class="mcp-server-name">${server.name || "未命名"}</div>
          <div class="mcp-server-url">${server.url || ""}</div>
          <div class="mcp-server-tools" id="mcp-tools-${server.id}">
            ${server.enabled !== false ? '<span class="loading-tools">加载工具中...</span>' : '<span class="mcp-disabled">已禁用</span>'}
          </div>
        </div>
        <div class="mcp-server-actions">
          <label class="toggle-switch small">
            <input type="checkbox" ${server.enabled !== false ? "checked" : ""} data-id="${server.id}" class="mcp-toggle">
            <span class="toggle-slider"></span>
          </label>
          <button class="small-button mcp-edit-btn" data-id="${server.id}">编辑</button>
          <button class="ghost-button small mcp-delete-btn" data-id="${server.id}">删除</button>
        </div>
      `;
      listEl.appendChild(item);

      if (server.enabled !== false) {
        fetchMcpTools(server);
      }
    });
  }

  async function fetchMcpTools(server) {
    const toolsEl = document.getElementById(`mcp-tools-${server.id}`);
    if (!toolsEl) return;

    try {
      let baseUrl;
      const url = new URL(server.url);
      if (url.pathname.endsWith('/sse')) {
        baseUrl = server.url.replace(/\/sse$/, '');
      } else {
        baseUrl = server.url;
      }
      
      const toolsUrl = `${baseUrl}/mcp/tools`;
      const headers = {};
      if (server.token) {
        headers['x-memory-token'] = server.token;
      }
      
      const resp = await fetch(toolsUrl, { headers });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const data = await resp.json();
      const tools = data.tools || data || [];
      
      if (Array.isArray(tools) && tools.length > 0) {
        const toolNames = tools.map(t => t.name || t).slice(0, 5);
        const more = tools.length > 5 ? ` +${tools.length - 5}` : '';
        toolsEl.innerHTML = `<span class="mcp-tools-list">🔧 ${toolNames.join(', ')}${more}</span>`;
      } else {
        toolsEl.innerHTML = '<span class="mcp-no-tools">无工具</span>';
      }
    } catch (e) {
      console.warn("获取MCP工具失败:", e);
      toolsEl.innerHTML = '<span class="mcp-error">连接失败</span>';
    }
  }

  function openMcpEditor(serverId) {
    const state = getState();
    if (serverId) {
      editingMcpId = serverId;
      const server = (state.mcpServers || []).find(s => s.id === serverId);
      if (server) {
        els.mcpEditorTitle.textContent = "编辑 MCP 服务器";
        els.mcpNameInput.value = server.name || "";
        els.mcpUrlInput.value = server.url || "";
        els.mcpTokenInput.value = server.token || "";
        els.deleteMcpButton.classList.remove("hidden");
      }
    } else {
      editingMcpId = null;
      els.mcpEditorTitle.textContent = "添加 MCP 服务器";
      els.mcpNameInput.value = "";
      els.mcpUrlInput.value = "";
      els.mcpTokenInput.value = "";
      els.deleteMcpButton.classList.add("hidden");
    }
    els.mcpEditor.classList.remove("hidden");
  }

  function closeMcpEditor() {
    els.mcpEditor.classList.add("hidden");
    editingMcpId = null;
  }

  async function testMcpConnection() {
    const url = els.mcpUrlInput.value.trim();
    const token = els.mcpTokenInput.value.trim();
    
    if (!url) {
      alert("请输入 SSE 地址");
      return;
    }

    try {
      let baseUrl;
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/sse')) {
        baseUrl = url.replace(/\/sse$/, '');
      } else {
        baseUrl = url;
      }
      
      const headers = {};
      if (token) {
        headers['x-memory-token'] = token;
      }
      
      const resp = await fetch(`${baseUrl}/mcp/tools`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        const tools = data.tools || data || [];
        alert(`✅ 连接成功！发现 ${tools.length} 个工具`);
      } else {
        alert(`❌ 连接失败: HTTP ${resp.status}`);
      }
    } catch (e) {
      alert(`❌ 连接失败: ${e.message}`);
    }
  }

  function saveMcpServer() {
    const name = els.mcpNameInput.value.trim();
    const url = els.mcpUrlInput.value.trim();
    const token = els.mcpTokenInput.value.trim();

    if (!name || !url) {
      alert("名称和 SSE 地址不能为空");
      return;
    }

    const state = getState();
    let servers = state.mcpServers || [];

    if (editingMcpId) {
      servers = servers.map(s => 
        s.id === editingMcpId ? { ...s, name, url, token } : s
      );
    } else {
      servers.push({
        id: "mcp_" + Date.now(),
        name,
        url,
        token,
        enabled: true
      });
    }

    saveState({ mcpServers: servers });
    closeMcpEditor();
    renderMcpServers();
  }

  function deleteMcpServer(serverId) {
    if (!confirm("确定删除这个 MCP 服务器？")) return;
    
    const state = getState();
    const servers = (state.mcpServers || []).filter(s => s.id !== serverId);
    saveState({ mcpServers: servers });
    closeMcpEditor();
    renderMcpServers();
  }

  function toggleMcpServer(serverId, enabled) {
    const state = getState();
    const servers = (state.mcpServers || []).map(s =>
      s.id === serverId ? { ...s, enabled } : s
    );
    saveState({ mcpServers: servers });
    renderMcpServers();
  }

  function initEventListeners() {
    if (els.addMcpButton) {
      els.addMcpButton.addEventListener("click", () => openMcpEditor(null));
    }
    if (els.saveMcpButton) {
      els.saveMcpButton.addEventListener("click", saveMcpServer);
    }
    if (els.cancelMcpButton) {
      els.cancelMcpButton.addEventListener("click", closeMcpEditor);
    }
    if (els.testMcpButton) {
      els.testMcpButton.addEventListener("click", testMcpConnection);
    }
    if (els.deleteMcpButton) {
      els.deleteMcpButton.addEventListener("click", () => {
        if (editingMcpId) deleteMcpServer(editingMcpId);
      });
    }

    if (els.mcpServerList) {
      els.mcpServerList.addEventListener("click", (e) => {
        const target = e.target;
        if (target.classList.contains("mcp-edit-btn")) {
          openMcpEditor(target.dataset.id);
        } else if (target.classList.contains("mcp-delete-btn")) {
          deleteMcpServer(target.dataset.id);
        }
      });
      
      els.mcpServerList.addEventListener("change", (e) => {
        if (e.target.classList.contains("mcp-toggle")) {
          toggleMcpServer(e.target.dataset.id, e.target.checked);
        }
      });
    }
  }

  function init() {
    initRefs();
    initEventListeners();
    renderMcpServers();
  }

  // 页面加载后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 导出给其他模块用
  window.McpHelper = {
    getServers: () => getState().mcpServers || [],
    refresh: renderMcpServers
  };
})();
