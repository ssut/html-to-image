import getBlobFromURL from './get-blob-from-url';
import { isDataUrl, toDataURL, getMimeType } from './utils';
import { OptionsType } from './index';

const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;

function resolveUrl(url: string, baseUrl: string | null) {
  // url is absolute already
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }

  // url is absolute already, without protocol
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }

  // dataURI, mailto:, tel:, etc.
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }

  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement('base');
  const a = doc.createElement('a');

  doc.head!.appendChild(base);
  doc.body.appendChild(a);

  if (baseUrl) {
    base.href = baseUrl;
  }

  a.href = url;

  return a.href;
}

function escape(url: string) {
  return url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}

function urlToRegex(url: string) {
  return new RegExp(`(url\\(['"]?)(${escape(url)})(['"]?\\))`, 'g');
}

function parseURLs(str: string) {
  const result: string[] = [];

  str.replace(URL_REGEX, (raw, quotation, url) => {
    result.push(url);
    return raw;
  });

  return result.filter((url) => !isDataUrl(url));
}

async function embed(
  cssString: string,
  resourceURL: string,
  baseURL: string | null,
  options: OptionsType,
) {
  const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;

  const data = await getBlobFromURL(resolvedURL, options);
  const dataURL = toDataURL(data!, getMimeType(resourceURL));

  try {
    return cssString.replace(urlToRegex(resourceURL), `$1${dataURL}$3`);
  } catch {
    return resolvedURL;
  }
}

export function shouldEmbed(string: string) {
  return string.search(URL_REGEX) !== -1;
}

export default async function embedResources(
  cssString: string,
  baseUrl: string | null,
  options: any,
) {
  if (!shouldEmbed(cssString)) {
    return cssString;
  }

  const urls = parseURLs(cssString);

  return urls.reduce(
    (done, url) => done.then((ret) => embed(ret, url, baseUrl, options)),
    Promise.resolve(cssString),
  );
}
