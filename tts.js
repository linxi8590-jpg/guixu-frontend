// ========== TTS 语音配置模块 ==========
(function() {
  const { loadState, saveState } = window.LLMHubState;

  let els = {};

  function getState() {
    return loadState();
  }

  function initRefs() {
    els = {
      typeSelect: document.getElementById("ttsTypeSelect"),
      configFields: document.getElementById("ttsConfigFields"),
      urlInput: document.getElementById("ttsUrlInput"),
      urlHint: document.getElementById("ttsUrlHint"),
      keyInput: document.getElementById("ttsKeyInput"),
      modelInput: document.getElementById("ttsModelInput"),
      modelHint: document.getElementById("ttsModelHint"),
      voiceSelect: document.getElementById("ttsVoiceSelect"),
      voiceInput: document.getElementById("ttsVoiceInput"),
      voiceHint: document.getElementById("ttsVoiceHint"),
      saveButton: document.getElementById("saveTtsButton"),
      testButton: document.getElementById("testTtsButton"),
      clearButton: document.getElementById("clearTtsButton"),
    };
  }

  const voiceOptions = {
    openai: [
      { value: 'alloy', label: 'Alloy（中性）' },
      { value: 'echo', label: 'Echo（男声）' },
      { value: 'fable', label: 'Fable（英式）' },
      { value: 'onyx', label: 'Onyx（低沉）' },
      { value: 'nova', label: 'Nova（女声）' },
      { value: 'shimmer', label: 'Shimmer（温柔）' },
    ],
    edge: [
      { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女声）' },
      { value: 'zh-CN-YunxiNeural', label: '云希（男声）' },
      { value: 'zh-CN-YunjianNeural', label: '云健（男声）' },
      { value: 'zh-CN-XiaoyiNeural', label: '晓艺（女声）' },
    ],
    fish: []
  };

  function loadConfig() {
    const config = getState().ttsConfig || {};
    
    if (els.typeSelect) els.typeSelect.value = config.type || '';
    if (els.urlInput) els.urlInput.value = config.url || '';
    if (els.keyInput) els.keyInput.value = config.apiKey || '';
    if (els.modelInput) els.modelInput.value = config.model || '';
    if (els.voiceInput) els.voiceInput.value = config.voice || '';
    
    updateFieldsVisibility();
  }

  function updateFieldsVisibility() {
    const type = els.typeSelect?.value;
    
    if (!type) {
      els.configFields?.classList.add('hidden');
      return;
    }
    
    els.configFields?.classList.remove('hidden');
    
    // 更新提示和默认值
    if (type === 'openai') {
      if (els.urlHint) els.urlHint.textContent = '默认 OpenAI 官方，可填中转地址';
      if (els.modelHint) els.modelHint.textContent = '可用: tts-1, tts-1-hd';
      if (!els.urlInput.value) els.urlInput.value = 'https://api.openai.com/v1';
      if (!els.modelInput.value) els.modelInput.value = 'tts-1';
    } else if (type === 'edge') {
      if (els.urlHint) els.urlHint.textContent = 'Edge TTS 代理服务地址';
      if (els.modelHint) els.modelHint.textContent = '一般不需要填';
      if (els.voiceHint) els.voiceHint.textContent = '微软 Edge 语音';
    } else if (type === 'fish') {
      if (els.urlHint) els.urlHint.textContent = 'Fish Audio API 地址';
      if (els.modelHint) els.modelHint.textContent = '留空使用默认';
      if (!els.urlInput.value) els.urlInput.value = 'https://api.fish.audio/v1';
      if (els.voiceHint) els.voiceHint.textContent = '填写 reference_id';
    }
    
    // 更新声音下拉选项
    updateVoiceOptions(type);
  }

  function updateVoiceOptions(type) {
    if (!els.voiceSelect) return;
    
    const options = voiceOptions[type] || [];
    els.voiceSelect.innerHTML = '<option value="">-- 快捷选择 --</option>';
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      els.voiceSelect.appendChild(option);
    });
  }

  function saveConfig() {
    const type = els.typeSelect?.value || '';
    const config = {
      enabled: !!type,  // 有选择类型就算启用
      type: type,
      url: els.urlInput?.value.trim() || '',
      apiKey: els.keyInput?.value.trim() || '',
      model: els.modelInput?.value.trim() || '',
      voice: els.voiceInput?.value.trim() || '',
      autoPlay: false,
    };
    
    saveState({ ttsConfig: config });
    showResult('✅ TTS 配置已保存', 'success');
  }

  function clearConfig() {
    if (!confirm('确定清除 TTS 配置？')) return;
    
    saveState({ ttsConfig: { enabled: false } });
    loadConfig();
    showResult('已清除', '');
  }

  function showResult(msg, type) {
    // 简单用alert，或者可以加个result显示区域
    if (type === 'success') {
      console.log('[TTS]', msg);
    }
    alert(msg);
  }

  async function testConnection() {
    const type = els.typeSelect?.value;
    const apiKey = els.keyInput?.value.trim();
    const voice = els.voiceInput?.value.trim();
    const url = els.urlInput?.value.trim();
    const model = els.modelInput?.value.trim();

    if (!type) {
      alert('请选择 API 类型');
      return;
    }
    if (!voice) {
      alert('请填写声音');
      return;
    }

    try {
      const testText = '你好，这是一段测试语音。';
      const audioBlob = await callTtsApi(type, url, apiKey, model, voice, testText);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      alert('✅ 测试成功！正在播放...');
    } catch (err) {
      console.error('TTS测试失败:', err);
      alert('❌ 测试失败: ' + err.message);
    }
  }

  async function callTtsApi(type, url, apiKey, model, voice, text) {
    let fetchUrl, headers, body;

    switch (type) {
      case 'openai':
        fetchUrl = `${url || 'https://api.openai.com/v1'}/audio/speech`;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = JSON.stringify({
          model: model || 'tts-1',
          input: text,
          voice: voice || 'alloy'
        });
        break;

      case 'edge':
        // Edge TTS 需要代理服务
        fetchUrl = url || 'https://api.777903.xyz/edge-tts';
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify({
          text: text,
          voice: voice || 'zh-CN-XiaoxiaoNeural'
        });
        break;

      case 'fish':
        fetchUrl = `${url || 'https://api.fish.audio'}/v1/tts`;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = JSON.stringify({
          text: text,
          reference_id: voice
        });
        break;

      default:
        throw new Error('未知的 TTS 类型');
    }

    const resp = await fetch(fetchUrl, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API错误 ${resp.status}: ${errText.substring(0, 100)}`);
    }

    return await resp.blob();
  }

  function initEventListeners() {
    if (els.typeSelect) {
      els.typeSelect.addEventListener('change', updateFieldsVisibility);
    }
    if (els.voiceSelect) {
      els.voiceSelect.addEventListener('change', () => {
        if (els.voiceSelect.value && els.voiceInput) {
          els.voiceInput.value = els.voiceSelect.value;
        }
      });
    }
    if (els.saveButton) {
      els.saveButton.addEventListener('click', saveConfig);
    }
    if (els.testButton) {
      els.testButton.addEventListener('click', testConnection);
    }
    if (els.clearButton) {
      els.clearButton.addEventListener('click', clearConfig);
    }
  }

  function init() {
    initRefs();
    initEventListeners();
    loadConfig();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出给 chat.js 使用
  window.TtsHelper = {
    callTtsApi,
    getConfig: () => getState().ttsConfig || {}
  };
})();
