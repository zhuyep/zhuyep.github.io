export const navPage = page => page === 'library' ? 'books' : page === 'video' ? 'games' : page;
export const routeHash = page => page === 'library' ? '#books/library' : '#' + page;
export function readingHash(key) {
  const [kind, ...id] = key.split(':');
  if (!['intel', 'block'].includes(kind) || !id.join(':')) throw Error('阅读标识无效');
  return (kind === 'intel' ? '#intel' : '#books/library') + '/' + encodeURIComponent(id.join(':'));
}
export function parseRoute(hash) {
  const value = hash.replace(/^#/, ''), [section, ...tail] = value.split('/');
  const nestedLibrary = section === 'books' && tail[0] === 'library';
  const page = nestedLibrary ? 'library' : ['today', 'intel', 'library', 'games', 'video', 'books'].includes(section) ? section : 'today';
  const ids = nestedLibrary ? tail.slice(1) : tail;
  if (ids.length && ['intel', 'library'].includes(page)) {
    try {
      const id = decodeURIComponent(ids.join('/'));
      if (!id) throw Error('阅读标识为空');
      return {page, key: (page === 'intel' ? 'intel:' : 'block:') + id};
    } catch {return {page, key: null, invalid: true};}
  }
  return {page, key: null};
}
