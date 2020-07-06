import { toArray, isDataUrl, toDataURL, getMimeType } from './utils';
import getBlobFromURL from './get-blob-from-url';
import embedResources from './embed-resources';
import { OptionsType } from './index';

function embedBackground(
  clonedNode: HTMLElement,
  options: OptionsType
): Promise<HTMLElement> {
  const background = clonedNode.style.getPropertyValue('background');
  if (!background) {
    return Promise.resolve(clonedNode);
  }

  return Promise.resolve(background)
    .then((cssString) => embedResources(cssString, null, options))
    .then((cssString) => {
      clonedNode.style.setProperty(
        'background',
        cssString,
        clonedNode.style.getPropertyPriority('background')
      );

      return clonedNode;
    });
}

async function embedImageNode(
  clonedNode: HTMLElement,
  options: OptionsType
): Promise<HTMLElement> {
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

const a = {
  total: 0,
  count: 0,
};

async function embedChildren(
  clonedNode: HTMLElement,
  options: Object
): Promise<HTMLElement> {
  const children = toArray<HTMLElement>(clonedNode.childNodes);

  // let resp: any;
  // for (const a of children) {
  //   console.info(a);
  //   await embedImages(a, options);
  //   console.info(a, 'DONE');
  // }

  const deferreds = children.map((child) => embedImages(child, options));

  // a.total += 1
  // console.info(a.count, a.total)
  const resp = await Promise.all(deferreds).then(() => clonedNode);
  // a.count += 1

  console.info(a.count, a.total);

  return resp;
}

export default async function embedImages(
  clonedNode: HTMLElement,
  options: Object
): Promise<HTMLElement> {
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
