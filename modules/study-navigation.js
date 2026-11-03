const SECTIONS = [['search', '#books/search', '资料搜索'], ['wiki', '#books/wiki', 'Wiki 资料库'], ['library', '#books/library', '言库']];
export function studyHeader(view) {
  return `<header class="book-heading study-heading"><span class="book-room-name">凯卷有益</span><nav class="book-modules" aria-label="书房模块">${SECTIONS.map(([key, href, name]) => `<a href="${href}"${view === key ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav></header>`;
}
export function bookRoomShell(markup, hash = typeof location === 'undefined' ? '#books' : location.hash) {
  const view = hash.split('?')[0] === '#books/wiki' ? 'wiki' : 'search';
  return markup.replace(/<header class="book-heading">[\s\S]*?<\/header>/, studyHeader(view));
}
export function libraryRoomShell(markup) {
  return `<section class="book-room book-room-library" aria-label="书房 · 言库">${studyHeader('library')}${markup}</section>`;
}
