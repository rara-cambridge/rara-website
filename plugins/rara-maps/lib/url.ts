// URL-mangling utilities

const PLACEHOLDER: string = '%{RARA_MAPS}';

export function absUrl(url: string): string {
  if (url.startsWith(PLACEHOLDER)) {
    return raraMapsData.baseUrl + url.slice(PLACEHOLDER.length);
  }
  return url;
}
