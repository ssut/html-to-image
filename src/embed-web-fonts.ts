import { toArray } from './utils';
import embedResources, { shouldEmbed } from './embed-resources';

function parseCSS(source: string) {
  if (source === undefined) {
    return [];
  }

  let cssText = source;
  const css = [];
  const cssKeyframeRegex = '((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})';
  const combinedCSSRegex =
    '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
    '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})'; // to match css & media queries together
  const cssCommentsRegex = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)', 'gi');

  // strip out comments
  cssText = cssText.replace(cssCommentsRegex, '');

  const keyframesRegex = new RegExp(cssKeyframeRegex, 'gi');
  let arr;
  while (true) {
    arr = keyframesRegex.exec(cssText);
    if (arr === null) {
      break;
    }
    css.push(arr[0]);
  }
  cssText = cssText.replace(keyframesRegex, '');

  // unified regex
  const unified = new RegExp(combinedCSSRegex, 'gi');
  while (true) {
    arr = unified.exec(cssText);
    if (arr === null) {
      break;
    }
    css.push(arr[0]);
  }

  return css;
}

async function fetchCSS(url: string, sheet: StyleSheet): Promise<any> {
  const res = await fetch(url);

  try {
    return {
      url,
      cssText: await res.text(),
    };
  } catch (e) {
    console.warn('Failed to fetch CSS:', url, String(e));
  }
}

async function embedFonts(data: any) {
  const resolved = (await data.cssText) as string;

  let cssText = resolved;

  const regexUrlFind = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocations = cssText.match(/url\([^)]+\)/g) || [];
  const fontLoadedPromises = fontLocations.map(async (location: string) => {
    let url = location.replace(regexUrlFind, '$1');
    if (!url.startsWith('https://')) {
      const source = data.url;
      url = new URL(url, source).href;
    }

    try {
      const res = await fetch(url);
      const blob = await res.blob();

      return await new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('error', reject);
        reader.addEventListener('load', (res: Event) => {
          // Side Effect
          cssText = cssText.replace(location, `url(${reader.result})`);
          resolve([location, reader.result]);
        });
        reader.readAsDataURL(blob);
      });
    } catch {}
  });

  await Promise.all(fontLoadedPromises);
  return cssText;
}

async function getCssRules(styleSheets: CSSStyleSheet[]) {
  const ret: CSSStyleRule[] = [];
  const promises: Promise<number | void>[] = [];

  // First loop inlines imports
  for (const sheet of styleSheets) {
    if ('cssRules' in sheet) {
      try {
        toArray<CSSRule>(sheet.cssRules).forEach((item: CSSRule) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            promises.push(
              fetchCSS((item as CSSImportRule).href, sheet)
                .then(embedFonts)
                .then((cssText: any) => {
                  const parsed = parseCSS(cssText);
                  parsed.forEach((rule: any) => {
                    sheet.insertRule(rule, sheet.cssRules.length);
                  });
                })
                .catch((e) => {
                  console.warn('Error loading remote css', String(e));
                }),
            );
          }
        });
      } catch (e) {
        const inline =
          styleSheets.find((a) => a.href === null) || document.styleSheets[0];

        if (sheet.href !== null) {
          promises.push(
            fetchCSS(sheet.href, inline)
              .then(embedFonts)
              .then((cssText: any) => {
                const parsed = parseCSS(cssText);
                parsed.forEach((rule: any) => {
                  (inline as CSSStyleSheet).insertRule(
                    rule,
                    sheet.cssRules.length,
                  );
                });
              })
              .catch((e) => {
                console.warn('Error loading remote stylesheet', String(e));
              }),
          );
        }
        console.warn('Error inlining remote css file', String(e));
      }
    }
  }

  await Promise.all(promises);

  for (const sheet of styleSheets) {
    if ('cssRules' in sheet) {
      try {
        toArray<CSSStyleRule>(sheet.cssRules).forEach((item: CSSStyleRule) => {
          ret.push(item);
        });
      } catch (e) {
        console.warn(
          `Error while reading CSS rules from ${sheet.href}`,
          String(e),
        );
      }
    }
  }

  return ret;
}

function getWebFontRules(cssRules: CSSStyleRule[]) {
  return cssRules
    .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
    .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
}

export async function parseWebFontRules(clonedNode: HTMLElement) {
  if (!clonedNode.ownerDocument) {
    throw new Error('Provided element is not within a Document');
  }

  const styleSheets = toArray(clonedNode.ownerDocument.styleSheets);
  const cssRules = await getCssRules(styleSheets);
  const webFontRules = await getWebFontRules(cssRules);

  return webFontRules;
}

export default async function embedWebFonts(
  clonedNode: HTMLElement,
  options: any,
) {
  const rules = await parseWebFontRules(clonedNode);
  const cssStrings = await Promise.all(
    rules.map((rule) => {
      const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;

      return embedResources(rule.cssText, baseUrl, options);
    }),
  );

  const cssString = cssStrings.join('\n');

  const styleNode = document.createElement('style');
  const sytleContent = document.createTextNode(cssString);

  styleNode.appendChild(sytleContent);

  if (clonedNode.firstChild) {
    clonedNode.insertBefore(styleNode, clonedNode.firstChild);
  } else {
    clonedNode.appendChild(styleNode);
  }

  return clonedNode;
}
