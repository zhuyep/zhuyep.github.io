const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loopback=host=>['localhost','127.0.0.1','[::1]'].includes(host);
const bilingual=value=>{const m=String(value).match(/^(.+?) \/ ([A-Za-z].*)$/);return m&&/[\u3400-\u9fff]/.test(m[1])?m:null};
const paired=(value,cls='wiki-label-en')=>{const m=bilingual(value);return m?`${esc(m[1])}<span class="${cls}" lang="en">${esc(m[2])}</span>`:esc(value)};
export function wikiHref(value,{wikiUrl,topics=[],home}={}){
  try{
    if(/^#books\/(?:wiki|search)(?:\?[^\s<>]*)?$/.test(value))return value;
    if(value.startsWith('/assets/wiki/')){const decoded=decodeURIComponent(value);if(decoded.split('/').some(p=>p==='.'||p==='..')||/[\u0000-\u001f\\]/.test(decoded))return '';return value}
    const url=new URL(value);
    if(url.username||url.password)return '';
    if(url.href===wikiUrl||url.href===home?.url)return '#books/wiki';
    const topic=topics.find(t=>t.url===url.href);
    if(topic)return '#books/wiki?page='+encodeURIComponent(topic.id);
    if(url.protocol==='https:'||(url.protocol==='http:'&&loopback(url.hostname)&&loopback(new URL(wikiUrl).hostname)))return url.href;
  }catch{}
  return '';
}
// Render the Markdown used by the Wiki without accepting HTML or loading embedded resources.
export function renderWikiMarkdown(markdown,context={}){
  function inline(value,depth=0){
    if(depth>3)return esc(value);
    const pattern=/!?\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`|_([^_\n]+)_/g;
    let html='',end=0;
    for(const m of value.matchAll(pattern)){
      html+=esc(value.slice(end,m.index));end=m.index+m[0].length;
      if(m[1]){const href=wikiHref(m[2],context);html+=href?`<a href="${esc(href)}" ${href.startsWith('#books/')?'':'target="_blank" rel="noopener noreferrer"'}>${paired(m[1])}</a>`:esc(m[1]);}
      else if(m[3])html+='<strong>'+paired(m[3])+'</strong>';
      else if(m[4])html+='<code>'+esc(m[4])+'</code>';
      else html+='<em>'+esc(m[5])+'</em>';
    }
    return html+esc(value.slice(end));
  }
  const lines=String(markdown).replace(/\r/g,'').split('\n'),headings=[];let html='',i=0;
  const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  while(i<lines.length){
    const line=lines[i];
    if(!line.trim()){i++;continue}
    if(/^```/.test(line)){const code=[];i++;while(i<lines.length&&!/^```/.test(lines[i]))code.push(lines[i++]);i++;html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';continue}
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){i++;if(heading[1].length===1)continue;const id='wiki-section-'+headings.length;const title=heading[2].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');headings.push({id,title,level:heading[1].length});html+=`<h${heading[1].length} id="${id}">${bilingual(heading[2])?paired(heading[2],'wiki-heading-en'):inline(heading[2])}</h${heading[1].length}>`;continue}
    if(line.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
      const header=cells(line);i+=2;html+='<div class="wiki-table-scroll"><table><thead><tr>'+header.map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>';
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){html+='<tr>'+cells(lines[i++]).map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>'}html+='</tbody></table></div>';continue;
    }
    if(/^\s*([-*]|\d+\.)\s+/.test(line)){
      const ordered=/^\s*\d+\./.test(line),tag=ordered?'ol':'ul',pattern=ordered?/^\s*\d+\.\s+/:/^\s*[-*]\s+/;html+='<'+tag+'>';
      while(i<lines.length&&pattern.test(lines[i]))html+='<li>'+inline(lines[i++].replace(pattern,''))+'</li>';html+='</'+tag+'>';continue;
    }
    if(/^>\s?/.test(line)){const quote=[];while(i<lines.length&&/^>/.test(lines[i]))quote.push(lines[i++].replace(/^>\s?/,''));html+='<blockquote>'+inline(quote.join(' '))+'</blockquote>';continue}
    const paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(#{1,6}\s|\s*([-*]|\d+\.)\s|>|```)/.test(lines[i]))paragraph.push(lines[i++]);const text=paragraph.join(' '),english=text.match(/^_([A-Za-z0-9][^_\n]*)_$/);html+=english?'<p class="wiki-en" lang="en">'+inline(english[1])+'</p>':'<p>'+inline(text)+'</p>';
  }
  return {html,headings};
}
