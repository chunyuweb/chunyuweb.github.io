"use strict";
(() => {
  const translations = {
    zh: {
      siteName:"张淳钰",copyright:"© 2026 chunyuzhang",switchLanguage:"英文版",skip:"跳到正文",mainNavigation:"主导航",
      navProfile:"个人",navUpdates:"动态",navRepository:"文件仓库",updatesHeading:"动态",noUpdates:"暂无动态。",monthlyArchive:"按月归档",
      profileHeading:"个人简介",interestsEmpty:"兴趣简介尚未填写。",emailLabel:"邮箱：",cvLabel:"简历：",cvEmpty:"尚未上传。",cvDownload:"下载简历",
      repositoryHeading:"文件仓库",research:"研究",code:"代码",slides:"幻灯片",other:"其他",noFiles:"暂无文件。",download:"下载",history:"历史版本",version:"版本",
      archiveHeading:"月度归档",noArchives:"暂无归档。",titleUpdates:"动态 · 张淳钰",titleProfile:"个人简介 · 张淳钰",titleRepository:"文件仓库 · 张淳钰",titleArchive:"月度归档 · 张淳钰",titlePost:"动态 · 张淳钰",
      descriptionUpdates:"张淳钰的个人动态。",descriptionProfile:"张淳钰的个人简介与简历。",descriptionRepository:"张淳钰的研究、代码、幻灯片及其他文件。",descriptionArchive:"张淳钰的动态月度归档。",descriptionPost:"张淳钰的个人动态。",
      back:"返回动态",readMore:"阅读全文",missing:"未找到这条动态。",preview:"内容预览，尚未发布。",previewError:"预览已失效，请回到管理页面重新预览。",untitled:"未填写标题",allMonths:"所有月份"
    },
    en: {
      siteName:"Chunyu Zhang",copyright:"© 2026 chunyuzhang",switchLanguage:"Chinese",skip:"Skip to content",mainNavigation:"Main navigation",
      navProfile:"About",navUpdates:"Updates",navRepository:"Files",updatesHeading:"Updates",noUpdates:"No updates yet.",monthlyArchive:"Monthly archive",
      profileHeading:"About",interestsEmpty:"An introduction has not been added yet.",emailLabel:"Email:",cvLabel:"CV:",cvEmpty:"Not uploaded yet.",cvDownload:"Download CV",
      repositoryHeading:"Files",research:"Research",code:"Code",slides:"Slides",other:"Other",noFiles:"No files yet.",download:"Download",history:"Previous versions",version:"Version",
      archiveHeading:"Archive",noArchives:"No archived entries yet.",titleUpdates:"Updates · Chunyu Zhang",titleProfile:"About · Chunyu Zhang",titleRepository:"Files · Chunyu Zhang",titleArchive:"Archive · Chunyu Zhang",titlePost:"Update · Chunyu Zhang",
      descriptionUpdates:"Updates from Chunyu Zhang.",descriptionProfile:"About Chunyu Zhang.",descriptionRepository:"Research, code, slides and other files by Chunyu Zhang.",descriptionArchive:"Monthly archive of updates from Chunyu Zhang.",descriptionPost:"An update from Chunyu Zhang.",
      back:"Back to updates",readMore:"Read more",missing:"This update could not be found.",preview:"Content preview. Not published.",previewError:"Preview has expired. Open a new preview from the editor.",untitled:"Untitled",allMonths:"All months"
    }
  };
  const E=SiteRich.escape;
  const page=document.body.dataset.page;
  const storageKey="chunyuzhang.language";
  const params=new URLSearchParams(location.search);
  let content=window.siteContent || {profile:{},updates:[],files:[],assets:[]};
  let previewFailed=false;
  let language=['zh','en'].includes(params.get('lang')) ? params.get('lang') : undefined;
  try {if (!language) language=localStorage.getItem(storageKey);} catch (_) {}
  if (!['zh','en'].includes(language)) language=((navigator.languages?.[0] || navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en");
  function dateLabel(date) {
    return new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
  }
  function monthLabel(month) {
    return new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en-US',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(month+'-01T00:00:00Z'));
  }
  function pageLink(file,values={}) {
    const url=new URL(file,location.href);
    Object.entries(values).forEach(([key,value])=>url.searchParams.set(key,value));
    url.searchParams.set('lang',language);
    return url.pathname+url.search+url.hash;
  }
  function summary(nodes) {
    const walk=list=>(list || []).map(node=>{
      if (typeof node==='string') return node;
      if (node.tag==='br') return ' ';
      if (!node.children) return '';
      return walk(node.children)+(['p','li','blockquote','h2','h3','pre'].includes(node.tag)?' ':'');
    }).join('');
    const value=walk(nodes).replace(/\s+/g,' ').trim();
    if (language==='zh') {
      const characters=Array.from(value);
      return characters.length>140 ? characters.slice(0,140).join('')+'…' : value;
    }
    const words=value.split(/\s+/).filter(Boolean);
    return words.length>55 ? words.slice(0,55).join(' ')+'…' : value;
  }
  function assetInfo(id) {
    const asset=(content.assets || []).find(item=>item.id===id);
    if (!asset) return '';
    const format=String(asset.extension || '').replace(/^\./,'').toUpperCase();
    const size=Number(asset.size);
    let sizeLabel='';
    if (Number.isFinite(size) && size>0) {
      const divisor=size>=1000000?1000000:size>=1000?1000:1;
      sizeLabel=new Intl.NumberFormat(language==='zh'?'zh-CN':'en-US',{maximumFractionDigits:1}).format(size/divisor)+' '+(divisor===1000000?'MB':divisor===1000?'kB':'B');
    }
    return [format,sizeLabel].filter(Boolean).join(' · ');
  }
  function assetLink(id,label) {
    const asset=(content.assets || []).find(item=>item.id===id);
    return asset ? '<a href="'+E(asset.url)+'" download="'+E(asset.name)+'">'+E(label)+'</a>' : '';
  }
  function postHtml(post,detail=false) {
    const title=post.title[language] || translations[language].untitled;
    const excerpt=summary(post.body[language]);
    const body=detail ? '<div class="rich-content">'+SiteRich.render(post.body[language],content.assets,language)+'</div>' : (excerpt ? '<p class="entry-summary">'+E(excerpt)+'</p>' : '')+'<a class="read-more" href="'+E(pageLink('post.html',{id:post.id}))+'">'+E(translations[language].readMore)+'</a>';
    return '<article class="update-entry"><'+(detail?'h1':'h2')+'>'+(detail?E(title):'<a href="'+E(pageLink('post.html',{id:post.id}))+'">'+E(title)+'</a>')+'</'+(detail?'h1':'h2')+'><time class="entry-date" datetime="'+E(post.date)+'">'+E(dateLabel(post.date))+'</time>'+body+'</article>';
  }
  function renderContent() {
    const words=translations[language];
    let html='';
    if (params.has('preview')) html+='<p class="preview-banner">'+E(previewFailed?words.previewError:words.preview)+'</p>';
    if (page==='updates') {
      html+=content.updates?.length ? content.updates.slice(0,5).map(item=>postHtml(item)).join('') : '<p class="empty">'+E(words.noUpdates)+'</p>';
      html+='<a class="archive-link" href="'+E(pageLink('archive.html'))+'">'+E(words.monthlyArchive)+'</a>';
    } else if (page==='profile') {
      const intro=content.profile?.introduction?.[language];
      html+=SiteRich.hasContent(intro) ? '<div class="rich-content">'+SiteRich.render(intro,content.assets,language)+'</div>' : '<p class="empty">'+E(words.interestsEmpty)+'</p>';
      html+='<p class="profile-line">'+E(words.emailLabel)+' <a href="mailto:chunyuzhang022@gmail.com">chunyuzhang022@gmail.com</a></p>';
      const cv=assetLink(content.profile?.cv,words.cvDownload);
      if (cv) html+='<p class="profile-line">'+E(words.cvLabel)+' '+cv+'</p>';
    } else if (page==='repository') {
      ['research','code','slides','other'].forEach(category=>{
        const files=(content.files || []).filter(item=>item.category===category);
        html+='<section class="file-category" id="'+category+'" aria-labelledby="'+category+'-heading"><h2 id="'+category+'-heading">'+E(words[category])+'</h2>';
        if (!files.length) html+='<p class="empty">'+E(words.noFiles)+'</p>';
        files.forEach(item=>{
          const latest=item.versions.at(-1);
          const info=assetInfo(latest.assetId);
          html+='<div class="file-entry"><p class="file-line"><time class="file-date" datetime="'+E(latest.date)+'">'+E(dateLabel(latest.date))+'</time><span aria-hidden="true">—</span><span class="file-title">'+E(item.title[language])+'</span>'+(info?'<span class="file-meta">· '+E(info)+'</span>':'')+'<span class="file-download">· '+assetLink(latest.assetId,words.download)+'</span></p>';
          if (item.description[language]) html+='<p class="file-description">'+E(item.description[language]).replace(/\n/g,'<br>')+'</p>';
          if (latest.note?.[language]) html+='<p class="file-version-note">'+E(latest.note[language])+'</p>';
          if (item.versions.length>1) {
            html+='<details class="file-history"><summary>'+E(words.history)+'</summary><ul>';
            item.versions.slice(0,-1).reverse().forEach(version=>{html+='<li>'+E(dateLabel(version.date))+' · '+assetLink(version.assetId,words.download)+' '+E(version.note?.[language] || '')+'</li>';});
            html+='</ul></details>';
          }
          html+='</div>';
        });
        html+='</section>';
      });
    } else if (page==='archive') {
      html+='<h1>'+E(words.archiveHeading)+'</h1>';
      const month=params.get('month');
      const months=[...new Set((content.updates || []).map(item=>item.date.slice(0,7)))].sort().reverse();
      if (!months.length) html+='<p class="empty">'+E(words.noArchives)+'</p>';
      if (month) html+='<p><a href="'+E(pageLink('archive.html'))+'">'+E(words.allMonths)+'</a></p>';
      months.filter(item=>!month||item===month).forEach(item=>{
        const entries=content.updates.filter(post=>post.date.startsWith(item));
        html+='<section class="archive-month"><h2><a href="'+E(pageLink('archive.html',{month:item}))+'">'+E(monthLabel(item))+'</a> <span class="archive-count">('+entries.length+')</span></h2><ul class="archive-list">';
        entries.forEach(post=>{html+='<li><time datetime="'+post.date+'">'+E(dateLabel(post.date))+'</time> — <a href="'+E(pageLink('post.html',{id:post.id}))+'">'+E(post.title[language])+'</a></li>';});
        html+='</ul></section>';
      });
    } else if (page==='post') {
      const post=content.updates?.find(item=>item.id===params.get('id'));
      html+=post ? postHtml(post,true) : '<p class="empty">'+E(words.missing)+'</p>';
      html+='<a class="archive-link" href="'+E(pageLink('index.html'))+'">'+E(words.back)+'</a>';
      if (post) document.title=(post.title[language] || words.untitled)+' · '+words.siteName;
    }
    const main=document.querySelector('main');
    main.innerHTML=html;
    SiteRich.typeset(main);
  }
  function renderLanguage() {
    const words=translations[language];
    document.documentElement.lang=language;
    document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=words[node.dataset.i18n];});
    document.querySelectorAll('[data-i18n-aria]').forEach(node=>{node.setAttribute('aria-label',words[node.dataset.i18nAria]);});
    document.querySelector('.language-switch').dataset.language=language==='zh'?'en':'zh';
    document.querySelectorAll('.site-name,.main-nav a').forEach(node=>{
      const url=new URL(node.getAttribute('href'),location.href);
      url.searchParams.set('lang',language);
      node.setAttribute('href',url.pathname+url.search+url.hash);
    });
    const capitalized=page[0].toUpperCase()+page.slice(1);
    document.title=words['title'+capitalized];
    document.querySelector('meta[name="description"]').content=words['description'+capitalized];
    renderContent();
  }
  document.querySelector('.language-switch').addEventListener('click',()=>{
    language=language==='zh'?'en':'zh';
    try {localStorage.setItem(storageKey,language);} catch (_) {}
    const url=new URL(location.href);
    url.searchParams.set('lang',language);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    renderLanguage();
  });
  renderLanguage();
  if (params.has('preview')) {
    fetch('/api/preview?token='+encodeURIComponent(params.get('preview'))).then(response=>{if (!response.ok) throw new Error();return response.json();}).then(data=>{content=data;renderLanguage();}).catch(()=>{previewFailed=true;renderLanguage();});
  }
})();
