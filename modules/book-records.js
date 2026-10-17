// Shared by the browser and server: an unknown later record must not erase known file metadata.
const known = value => ['submittedVersion', 'acceptedVersion', 'publishedVersion'].includes(value);
export function mergeBookFiles(files) {
  const merged = new Map();
  for (const file of files) {
    const previous = merged.get(file.url);
    const versions = [...new Set([...(previous?.versions || []), ...(file.versions || []), previous?.version, file.version].filter(known))];
    const format = previous?.format && previous.format !== 'file' ? previous.format : file.format;
    merged.set(file.url, {...(previous || file), format, versions,
      ...(previous?.source || file.source ? {source: previous?.source || file.source, sourceId: previous?.sourceId || file.sourceId} : {}),
      version: versions.length > 1 ? 'conflict' : versions[0] || 'unknown'});
  }
  return [...merged.values()];
}
