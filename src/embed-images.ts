import { toArray, isDataUrl, toDataURL, getMimeType } from './utils';
import getBlobFromURL from './get-blob-from-url';
import embedResources from './embed-resources';
import { OptionsType } from './index';

async function embedBackground(
  clonedNode: HTMLElement,
  options: OptionsType,
) {
  const background = clonedNode.style.getPropertyValue('background');
  if (!background) {
    return clonedNode;
  }

  const cssString = await embedResources(background, null, options);

  clonedNode.style.setProperty(
    'background',
    cssString,
    clonedNode.style.getPropertyPriority('background'),
  );

  return clonedNode;
}

async function embedImageNode(
  clonedNode: HTMLElement,
  options: OptionsType,
) {
  if (!(clonedNode instanceof HTMLImageElement) || isDataUrl(clonedNode.src)) {
    return clonedNode;
  }

  const data = await getBlobFromURL(clonedNode.currentSrc, options);
  const dataURL = toDataURL(data!, getMimeType(clonedNode.currentSrc));
  const node = await new Promise<HTMLElement>((resolve, reject) => {
    clonedNode.addEventListener('load', () => resolve(clonedNode));
    clonedNode.addEventListener('abort', reject);
    clonedNode.addEventListener('error', reject);

    clonedNode.src = dataURL;
  });

  return node;
}

async function embedChildren(
  clonedNode: HTMLElement,
  options: Object,
) {
  const children = toArray<HTMLElement>(clonedNode.childNodes);

  const deferreds = children.map((child) => embedImages(child, options));
  const resp = await Promise.all(deferreds).then(() => clonedNode);

  return resp;
}

export default async function embedImages(
  clonedNode: HTMLElement,
  options: Object,
) {
  if (!(clonedNode instanceof Element)) {
    return clonedNode;
  }

  if (clonedNode.hasAttribute('srcset')) {
    clonedNode.removeAttribute('srcset');
  }

  let node = await embedBackground(clonedNode, options);
  node = await embedImageNode(node, options);
  node = await embedChildren(node, options);

  return node;
}
