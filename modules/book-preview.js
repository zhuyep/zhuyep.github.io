export function legacyBookPreviewUrl(value,origin){
  try{const url=new URL(value,origin);if(url.origin!==origin||url.pathname!=='/api/books/preview')return '';url.pathname='/api/books/download';return url.href}catch{return ''}
}
export function createBookPreview(signal) {
  const dialog=document.createElement('dialog');
  dialog.className='book-preview-dialog';
  dialog.setAttribute('aria-label','资料在线预览');
  dialog.innerHTML='<header><h2></h2><a class="secondary-button" hidden>下载 PDF</a><button type="button" aria-label="关闭预览">×</button></header><p class="book-preview-status" role="status">正在打开全文……</p><iframe title="PDF 在线预览" hidden></iframe><footer><span>PDF 在线阅读</span><a target="_blank" rel="noopener noreferrer">打开来源页面 ↗</a></footer>';
  document.body.append(dialog);
  let active,objectUrl='',version=0;
  const frame=dialog.querySelector('iframe'),status=dialog.querySelector('[role=status]'),download=dialog.querySelector('header a');
  function reset(){version++;active?.abort();frame.removeAttribute('src');frame.hidden=true;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl='';download.hidden=true;}
  dialog.addEventListener('close',reset);
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  signal.addEventListener('abort',()=>{reset();dialog.close();dialog.remove()},{once:true});
  return async ({url,title,sourceUrl})=>{
    reset();if(signal.aborted)return;
    const current=version;active=new AbortController();
    dialog.querySelector('h2').textContent=title||'PDF 在线预览';
    const source=dialog.querySelector('footer a');source.hidden=true;
    try{const value=new URL(sourceUrl);if(value.protocol==='https:'&&!value.username&&!value.password){source.href=value.href;source.hidden=false}}catch{}
    status.hidden=false;status.textContent='正在读取公开全文……';if(!dialog.open)dialog.showModal();
    try{
      let response=await fetch(url,{signal:active.signal,cache:'no-store'});
      if(response.status===404){const fallback=legacyBookPreviewUrl(url,location.origin);if(fallback)response=await fetch(fallback,{signal:active.signal,cache:'no-store'});}
      if(!response.ok){const error=await response.json();throw Error(error.error||'暂时无法打开全文')}
      if(!response.headers.get('content-type')?.includes('application/pdf'))throw Error('来源没有返回可预览的 PDF');
      const blob=await response.blob();
      if(signal.aborted||current!==version)return;
      objectUrl=URL.createObjectURL(blob);frame.src=objectUrl;frame.title=title+' · PDF 在线预览';frame.hidden=false;
      download.href=objectUrl;download.download=(title||'资料').replace(/[\\/]/g,'-')+'.pdf';download.hidden=false;status.hidden=true;
    }catch(error){if(error.name!=='AbortError'&&current===version&&!signal.aborted)status.textContent=error.message+'。可以打开来源页面继续阅读。'}
  };
}
