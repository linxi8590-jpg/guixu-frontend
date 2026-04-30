// ========== 生图模型配置模块 ==========
(function() {
  const { loadState, saveState } = window.LLMHubState;

  let els = {};
  let editingId = null;

  function getState() {
    return loadState();
  }

  function initRefs() {
    els = {
      addButton: document.getElementById("addImageGenButton"),
      list: document.getElementById("imageGenList"),
      editor: document.getElementById("imageGenEditor"),
      editorTitle: document.getElementById("imageGenEditorTitle"),
      nameInput: document.getElementById("imageGenNameInput"),
      typeSelect: document.getElementById("imageGenTypeSelect"),
      urlInput: document.getElementById("imageGenUrlInput"),
      urlHint: document.getElementById("imageGenUrlHint"),
      keyInput: document.getElementById("imageGenKeyInput"),
      modelSelect: document.getElementById("imageGenModelSelect"),
      modelInput: document.getElementById("imageGenModelInput"),
      modelHint: document.getElementById("imageGenModelHint"),
      sizeInput: document.getElementById("imageGenSizeInput"),
      saveButton: document.getElementById("saveImageGenButton"),
      testButton: document.getElementById("testImageGenButton"),
      cancelButton: document.getElementById("cancelImageGenButton"),
      deleteButton: document.getElementById("deleteImageGenButton"),
      testResult: document.getElementById("imageGenTestResult"),
    };
  }

  function updateHints() {
    const apiType = els.typeSelect?.value || 'openai';
    
    if (apiType === 'openai') {
      if (els.urlInput && !els.urlInput.value) {
        els.urlInput.placeholder = 'https://api.openai.com/v1';
      }
      if (els.urlHint) els.urlHint.textContent = '不需要加 /images/generations，只填基础地址';
      if (els.modelInput) els.modelInput.placeholder = 'gpt-image-1';
      if (els.modelHint) els.modelHint.textContent = '常见模型：gpt-image-1, dall-e-3, flux-pro-1.1-ultra';
    } else if (apiType === 'gemini-imagen') {
      if (els.urlInput && !els.urlInput.value) {
        els.urlInput.value = 'https://generativelanguage.googleapis.com/v1beta';
      }
      if (els.urlHint) els.urlHint.textContent = 'Gemini API 地址';
      if (els.modelInput) els.modelInput.placeholder = 'imagen-4.0-generate-001';
      if (els.modelHint) els.modelHint.textContent = '可用：imagen-4.0-generate-001, imagen-4.0-fast-generate-001, imagen-4.0-ultra-generate-001';
    } else if (apiType === 'gemini-native') {
      if (els.urlInput && !els.urlInput.value) {
        els.urlInput.value = 'https://generativelanguage.googleapis.com/v1beta';
      }
      if (els.urlHint) els.urlHint.textContent = 'Gemini API 地址';
      if (els.modelInput) els.modelInput.placeholder = 'gemini-2.5-flash-image';
      if (els.modelHint) els.modelHint.textContent = '可用：gemini-2.5-flash-image, gemini-3.1-flash-image-preview, gemini-3-pro-image-preview';
    } else if (apiType === 'bfl') {
      if (els.urlInput && !els.urlInput.value) {
        els.urlInput.value = 'https://api.bfl.ai';
      }
      if (els.urlHint) els.urlHint.textContent = 'BFL API 地址（走代理）';
      if (els.modelInput) els.modelInput.placeholder = 'flux-pro-1.1';
      if (els.modelHint) els.modelHint.textContent = '可用：flux-pro-1.1, flux-pro-1.1-ultra, flux-dev';
    }
  }

  function renderList() {
    if (!els.list) return;
    
    const list = getState().imageGenConfigs || [];
    
    if (!list.length) {
      els.list.innerHTML = '<div class="empty-text">还没有生图模型，点击上方"添加"按钮。</div>';
      return;
    }

    const typeLabels = {
      'openai': 'OpenAI',
      'gemini-imagen': 'Imagen',
      'gemini-native': 'Gemini原生',
      'bfl': 'BFL/Flux'
    };

    els.list.innerHTML = list.map(cfg => `
      <div class="mcp-server-item">
        <div class="mcp-server-info">
          <div class="mcp-server-name">🎨 ${cfg.name}</div>
          <div class="mcp-server-url">${typeLabels[cfg.apiType] || 'OpenAI'} · ${cfg.model}</div>
        </div>
        <div class="mcp-server-actions">
          <button class="small-button imagegen-edit-btn" data-id="${cfg.id}">编辑</button>
          <button class="ghost-button small imagegen-delete-btn" data-id="${cfg.id}">删除</button>
        </div>
      </div>
    `).join('');
  }

  function openEditor(id) {
    editingId = id || null;
    
    if (els.editorTitle) {
      els.editorTitle.textContent = id ? '编辑生图模型' : '添加生图模型';
    }
    if (els.testResult) {
      els.testResult.classList.add('hidden');
      els.testResult.textContent = '';
    }
    
    if (id) {
      const cfg = (getState().imageGenConfigs || []).find(c => c.id === id);
      if (cfg) {
        if (els.nameInput) els.nameInput.value = cfg.name || '';
        if (els.typeSelect) els.typeSelect.value = cfg.apiType || 'openai';
        if (els.urlInput) els.urlInput.value = cfg.baseUrl || '';
        if (els.keyInput) els.keyInput.value = cfg.apiKey || '';
        if (els.modelInput) els.modelInput.value = cfg.model || '';
        if (els.sizeInput) els.sizeInput.value = cfg.size || '';
        if (els.deleteButton) els.deleteButton.classList.remove('hidden');
      }
    } else {
      if (els.nameInput) els.nameInput.value = '';
      if (els.typeSelect) els.typeSelect.value = 'openai';
      if (els.urlInput) els.urlInput.value = '';
      if (els.keyInput) els.keyInput.value = '';
      if (els.modelInput) els.modelInput.value = '';
      if (els.sizeInput) els.sizeInput.value = '';
      if (els.deleteButton) els.deleteButton.classList.add('hidden');
    }
    
    updateHints();
    if (els.editor) els.editor.classList.remove('hidden');
  }

  function closeEditor() {
    if (els.editor) els.editor.classList.add('hidden');
    editingId = null;
  }

  function saveConfig() {
    const name = els.nameInput?.value.trim();
    const apiType = els.typeSelect?.value || 'openai';
    const baseUrl = (els.urlInput?.value || '').trim().replace(/\/+$/, '');
    const apiKey = els.keyInput?.value.trim();
    const model = els.modelInput?.value.trim();
    const size = els.sizeInput?.value.trim();

    if (!name || !apiKey || !model) {
      alert('名称、API Key、模型不能为空');
      return;
    }

    const state = getState();
    let configs = state.imageGenConfigs || [];

    if (editingId) {
      configs = configs.map(c => 
        c.id === editingId ? { ...c, name, apiType, baseUrl, apiKey, model, size } : c
      );
    } else {
      configs.push({
        id: 'img_' + Date.now(),
        name,
        apiType,
        baseUrl,
        apiKey,
        model,
        size
      });
    }

    saveState({ imageGenConfigs: configs });
    closeEditor();
    renderList();
  }

  function deleteConfig(id) {
    if (!confirm('确定删除这个生图模型？')) return;
    
    const state = getState();
    const configs = (state.imageGenConfigs || []).filter(c => c.id !== id);
    saveState({ imageGenConfigs: configs });
    closeEditor();
    renderList();
  }

  function showTestResult(msg, type) {
    if (!els.testResult) return;
    els.testResult.textContent = msg;
    els.testResult.className = 'test-result ' + (type || '');
    els.testResult.classList.remove('hidden');
  }

  async function testConnection() {
    const apiType = els.typeSelect?.value || 'openai';
    const baseUrl = (els.urlInput?.value || '').trim().replace(/\/+$/, '');
    const apiKey = els.keyInput?.value.trim();
    const model = els.modelInput?.value.trim();
    const size = els.sizeInput?.value.trim() || '1024x1024';

    if (!apiKey || !model) {
      showTestResult('❌ 请填写 API Key 和模型', 'error');
      return;
    }

    showTestResult('🔄 正在测试...', 'testing');
    const testPrompt = 'A cute cat sitting on a windowsill, soft lighting';

    try {
      let url, headers, body, respData, hasImage = false;

      if (apiType === 'openai') {
        url = `${baseUrl || 'https://api.openai.com'}/v1/images/generations`;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = JSON.stringify({
          model: model,
          prompt: testPrompt,
          size: size,
          n: 1
        });

        const resp = await fetch(url, { method: 'POST', headers, body });
        const respText = await resp.text();
        if (!resp.ok) throw new Error(`API错误 ${resp.status}: ${respText.substring(0, 100)}`);
        respData = JSON.parse(respText);
        hasImage = respData.data?.[0]?.url || respData.data?.[0]?.b64_json;

      } else if (apiType === 'gemini-imagen') {
        // 走代理服务器
        const proxyBase = 'https://api.777903.xyz';
        url = `${proxyBase}/imagen/generate`;
        headers = {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        };
        body = JSON.stringify({
          model: model,
          prompt: testPrompt,
          config: { numberOfImages: 1 }
        });

        const resp = await fetch(url, { method: 'POST', headers, body });
        const respText = await resp.text();
        if (!resp.ok) throw new Error(`API错误 ${resp.status}: ${respText.substring(0, 100)}`);
        respData = JSON.parse(respText);
        hasImage = respData.predictions?.[0]?.bytesBase64Encoded;

      } else if (apiType === 'gemini-native') {
        // 走代理服务器
        const proxyBase = 'https://api.777903.xyz';
        url = `${proxyBase}/imagen/native`;
        headers = {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        };
        body = JSON.stringify({
          model: model,
          prompt: testPrompt
        });

        const resp = await fetch(url, { method: 'POST', headers, body });
        const respText = await resp.text();
        if (!resp.ok) throw new Error(`API错误 ${resp.status}: ${respText.substring(0, 100)}`);
        respData = JSON.parse(respText);
        const parts = respData.candidates?.[0]?.content?.parts || [];
        hasImage = parts.some(p => p.inlineData?.data);

      } else if (apiType === 'bfl') {
        // BFL 前端直连（含轮询）
        const [w, h] = (size || '1024x768').split('x').map(Number);
        const submitUrl = `https://api.bfl.ai/v1/${model}`;
        const submitResp = await fetch(submitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Key': apiKey
          },
          body: JSON.stringify({
            prompt: testPrompt,
            width: w || 1024,
            height: h || 768
          })
        });
        if (!submitResp.ok) {
          const t = await submitResp.text();
          throw new Error(`提交失败 ${submitResp.status}: ${t.substring(0, 100)}`);
        }
        const submitData = await submitResp.json();
        const pollingUrl = submitData.polling_url;
        if (!pollingUrl) throw new Error('未返回 polling_url');
        
        // 测试时只轮询 10 秒
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const pollResp = await fetch(pollingUrl, {
            headers: { 'X-Key': apiKey, 'accept': 'application/json' }
          });
          if (!pollResp.ok) continue;
          respData = await pollResp.json();
          if (respData.status === 'Ready') {
            hasImage = respData.result?.sample;
            break;
          }
          if (respData.status === 'Error' || respData.status === 'Failed') {
            throw new Error('生成失败: ' + (respData.error || respData.status));
          }
        }
        if (!hasImage) throw new Error('生成超时（测试期 10 秒未完成，正常使用会等待更久）');
      }

      if (hasImage) {
        showTestResult('✅ 测试成功！生成了图片', 'success');
      } else {
        showTestResult('⚠️ 请求成功但未返回图片数据', 'error');
        console.log('[生图测试] 完整响应:', respData);
      }
    } catch (err) {
      console.error('[生图测试] 失败:', err);
      showTestResult('❌ ' + err.message, 'error');
    }
  }

  function initEventListeners() {
    if (els.addButton) {
      els.addButton.addEventListener('click', () => openEditor(null));
    }
    if (els.saveButton) {
      els.saveButton.addEventListener('click', saveConfig);
    }
    if (els.cancelButton) {
      els.cancelButton.addEventListener('click', closeEditor);
    }
    if (els.testButton) {
      els.testButton.addEventListener('click', testConnection);
    }
    if (els.deleteButton) {
      els.deleteButton.addEventListener('click', () => {
        if (editingId) deleteConfig(editingId);
      });
    }
    if (els.typeSelect) {
      els.typeSelect.addEventListener('change', updateHints);
    }
    if (els.modelSelect) {
      els.modelSelect.addEventListener('change', () => {
        if (els.modelSelect.value && els.modelInput) {
          els.modelInput.value = els.modelSelect.value;
        }
      });
    }
    if (els.list) {
      els.list.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('imagegen-edit-btn')) {
          openEditor(target.dataset.id);
        } else if (target.classList.contains('imagegen-delete-btn')) {
          deleteConfig(target.dataset.id);
        }
      });
    }
  }

  function init() {
    initRefs();
    initEventListeners();
    renderList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出给 chat.js 使用
  window.ImageGenHelper = {
    getConfigs: () => getState().imageGenConfigs || [],
    getDefaultConfig: () => (getState().imageGenConfigs || [])[0] || null,
    
    generateImage: async (prompt, configId, options = {}) => {
      const configs = getState().imageGenConfigs || [];
      const cfg = configId ? configs.find(c => c.id === configId) : configs[0];
      if (!cfg) throw new Error('没有配置生图模型');

      const apiType = cfg.apiType || 'openai';
      const size = options.size || cfg.size || '1024x1024';

      if (apiType === 'openai') {
        const url = `${cfg.baseUrl || 'https://api.openai.com'}/v1/images/generations`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey}`
          },
          body: JSON.stringify({
            model: cfg.model,
            prompt: prompt,
            size: size,
            n: options.n || 1
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`生图失败 ${resp.status}: ${errText.substring(0, 100)}`);
        }
        const data = await resp.json();
        return data.data?.[0]?.url || data.data?.[0]?.b64_json;

      } else if (apiType === 'bfl') {
        // BFL 前端直连（云服务器无法访问 api.bfl.ai，所以不能走后端代理）
        // 流程：1) POST 提交任务 2) 轮询 polling_url 直到 Ready
        const [w, h] = size.split('x').map(Number);
        const submitUrl = `https://api.bfl.ai/v1/${cfg.model}`;
        const submitResp = await fetch(submitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Key': cfg.apiKey
          },
          body: JSON.stringify({
            prompt: prompt,
            width: w || 1024,
            height: h || 768
          })
        });
        if (!submitResp.ok) {
          const errText = await submitResp.text();
          throw new Error(`BFL 提交失败 ${submitResp.status}: ${errText.substring(0, 100)}`);
        }
        const submitData = await submitResp.json();
        const pollingUrl = submitData.polling_url;
        if (!pollingUrl) throw new Error('BFL 未返回 polling_url');
        
        // 轮询，最多 60 次（约 60 秒）
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const pollResp = await fetch(pollingUrl, {
            headers: { 'X-Key': cfg.apiKey, 'accept': 'application/json' }
          });
          if (!pollResp.ok) continue;
          const pollData = await pollResp.json();
          if (pollData.status === 'Ready') {
            return pollData.result?.sample || null;
          }
          if (pollData.status === 'Error' || pollData.status === 'Failed') {
            throw new Error('BFL 生成失败: ' + (pollData.error || pollData.status));
          }
        }
        throw new Error('BFL 生成超时');

      } else if (apiType === 'gemini-imagen') {
        // 走代理服务器
        const proxyBase = 'https://api.777903.xyz';
        const url = `${proxyBase}/imagen/generate`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': cfg.apiKey
          },
          body: JSON.stringify({
            model: cfg.model,
            prompt: prompt,
            config: { numberOfImages: 1 }
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`生图失败 ${resp.status}: ${errText.substring(0, 100)}`);
        }
        const data = await resp.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        return b64 ? `data:image/png;base64,${b64}` : null;

      } else if (apiType === 'gemini-native') {
        // 走代理服务器
        const proxyBase = 'https://api.777903.xyz';
        const url = `${proxyBase}/imagen/native`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': cfg.apiKey
          },
          body: JSON.stringify({
            model: cfg.model,
            prompt: prompt
          })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`生图失败 ${resp.status}: ${errText.substring(0, 100)}`);
        }
        const data = await resp.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find(p => p.inlineData?.data);
        if (imgPart) {
          const mime = imgPart.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${imgPart.inlineData.data}`;
        }
        return null;
      }

      throw new Error('不支持的生图类型: ' + apiType);
    }
  };
})();
