(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SiteRich = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const containers = new Set(['p','strong','em','u','ul','ol','li','blockquote','h2','h3','a','code','pre']);
  function safeLink(value) {
    const link = String(value || '').trim();
    return /^(https?:\/\/|mailto:|#)/i.test(link) && !/[\u0000-\u0020]/.test(link) ? link : '';
  }
  function normalize(nodes, assetIds) {
    let count = 0;
    function walk(list, depth) {
      if (!Array.isArray(list) || depth > 24) throw new Error('正文格式无效。');
      return list.map(node => {
        if (++count > 12000) throw new Error('正文过长。');
        if (typeof node === 'string') {
          if (node.length > 100000) throw new Error('段落过长。');
          return node;
        }
        if (!node || typeof node !== 'object') throw new Error('正文格式无效。');
        if (node.tag === 'br') return {tag:'br'};
        if (node.tag === 'math') return {tag:'math', tex:String(node.tex || '').slice(0, 10000), display:Boolean(node.display)};
        if (['image','video','audio','attachment'].includes(node.tag)) {
          if (!assetIds.has(node.assetId)) throw new Error('附件不存在，请重新上传。');
          return {tag:node.tag, assetId:node.assetId, alt:String(node.alt || '').slice(0, 300)};
        }
        if (!containers.has(node.tag)) throw new Error('正文包含不支持的格式。');
        const clean = {tag:node.tag, children:walk(node.children || [], depth + 1)};
        if (node.tag === 'a') {
          clean.href = safeLink(node.href);
          if (!clean.href) throw new Error('链接须为完整的网址或邮箱链接。');
        }
        return clean;
      });
    }
    return walk(nodes, 0);
  }
  function render(nodes, assets, language = 'zh', editor = false) {
    const assetMap = new Map((assets || []).map(asset => [asset.id, asset]));
    const walk = list => (list || []).map(node => {
      if (typeof node === 'string') return escape(node);
      if (node.tag === 'br') return '<br>';
      if (node.tag === 'math') {
        return '<span class="math-source' + (node.display ? ' math-display' : '') + '" data-tex="' + escape(node.tex) + '" data-display="' + node.display + '"' + (editor ? ' contenteditable="false"' : '') + '>' + escape(node.tex) + '</span>';
      }
      if (['image','video','audio','attachment'].includes(node.tag)) {
        const asset = assetMap.get(node.assetId);
        if (!asset) return '';
        const href = escape(asset.url || ('uploads/' + asset.id + asset.extension));
        let inner;
        if (node.tag === 'image') inner = '<img src="' + href + '" alt="' + escape(node.alt) + '" loading="lazy">';
        else if (node.tag === 'video' || node.tag === 'audio') inner = '<' + node.tag + ' controls preload="metadata" src="' + href + '"></' + node.tag + '>';
        else inner = '<a href="' + href + '" download="' + escape(asset.name) + '">' + escape(node.alt || asset.name) + '</a>';
        if (!editor) return inner;
        return '<span class="editor-media" contenteditable="false" data-asset="' + escape(asset.id) + '" data-kind="' + node.tag + '" data-alt="' + escape(node.alt) + '">' + inner + '<button type="button" class="remove-media" aria-label="移除附件">×</button></span>';
      }
      if (!containers.has(node.tag)) return '';
      const attributes = node.tag === 'a' ? ' href="' + escape(safeLink(node.href)) + '" rel="noopener noreferrer"' : '';
      return '<' + node.tag + attributes + '>' + walk(node.children) + '</' + node.tag + '>';
    }).join('');
    return walk(nodes);
  }
  function plain(nodes) {
    return (nodes || []).map(node => typeof node === 'string' ? node : node.tag === 'math' ? node.tex : node.children ? plain(node.children) : '').join(' ');
  }
  function hasContent(nodes) { return plain(nodes).trim().length > 0 || (nodes || []).some(node => typeof node === 'object' && (node.assetId || hasContent(node.children))); }
  function serialize(element) {
    function walk(parent) {
      return Array.from(parent.childNodes).flatMap(node => {
        if (node.nodeType === 3) return [node.textContent];
        if (node.nodeType !== 1) return [];
        if (node.dataset.tex !== undefined) return [{tag:'math', tex:node.dataset.tex, display:node.dataset.display === 'true'}];
        if (node.dataset.asset) return [{tag:node.dataset.kind, assetId:node.dataset.asset, alt:node.dataset.alt || ''}];
        let tag = node.tagName.toLowerCase();
        if (tag === 'b') tag = 'strong';
        if (tag === 'i') tag = 'em';
        if (tag === 'div') tag = 'p';
        if (tag === 'br') return [{tag:'br'}];
        if (!containers.has(tag)) return walk(node);
        const result = {tag, children:walk(node)};
        if (tag === 'a') {
          result.href = safeLink(node.getAttribute('href'));
          if (!result.href) return result.children;
        }
        return [result];
      });
    }
    return walk(element);
  }
  function typeset(element) {
    if (!globalThis.katex) return;
    element.querySelectorAll('.math-source').forEach(node => {
      try { globalThis.katex.render(node.dataset.tex, node, {throwOnError:false, displayMode:node.dataset.display === 'true', trust:false, strict:'warn'}); }
      catch (_) { node.textContent = node.dataset.tex; }
    });
  }
  return {escape, safeLink, normalize, render, plain, hasContent, serialize, typeset};
});
