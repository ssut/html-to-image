/* tslint:disable:max-line-length */

import { getDataURLContent } from './utils'
import { OptionsType } from './index'

// KNOWN ISSUE
// -----------
// Can not handle redirect-url, such as when access 'http://something.com/avatar.png'
// will redirect to 'http://something.com/65fc2ffcc8aea7ba65a1d1feda173540'

export default async function getBlobFromURL(
  url: string,
  options: OptionsType
): Promise<string | null> {
  // cache bypass so we dont have CORS issues with cached images
  // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
  if (options.cacheBust) {
    url += (/\?/.test(url) ? "&" : "?") + new Date().getTime(); // tslint:disable-line
  }

  const failed = (reason: any) => {
    let placeholder = "";
    if (options.imagePlaceholder) {
      const split = options.imagePlaceholder.split(/,/);
      if (split && split[1]) {
        placeholder = split[1];
      }
    }

    let msg = `Failed to fetch resource: ${url}`;

    if (reason) {
      msg = typeof reason === "string" ? reason : reason.message;
    }

    if (msg) {
      console.error(msg);
    }

    return placeholder;
  };

  try {
    const resp = await window.fetch(`${url}?${Date.now()}`, {
      method: 'GET',
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
    });

    const blob = await resp.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener('error', reject);
      reader.addEventListener('abort', reject);
      reader.addEventListener('load', () => resolve(reader.result as string), false);

      reader.readAsDataURL(blob);
    });

    const content = getDataURLContent(dataUrl);

    return content;
  } catch (e) {
    return failed(e);
  }
}
