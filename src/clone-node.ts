import { createImage, toArray, svgToDataURL } from './utils';
import clonePseudoElements from './clone-pseudo-elements';

async function cloneSingleNode(
  nativeNode: HTMLCanvasElement | SVGElement | HTMLElement,
) {
  if (nativeNode instanceof HTMLCanvasElement) {
    const dataURL = nativeNode.toDataURL();

    if (dataURL === 'data:,') {
      return nativeNode.cloneNode(false) as HTMLElement;
    }

    return createImage(dataURL);
  }

  if (nativeNode.tagName && nativeNode.tagName.toLowerCase() === 'svg') {
    const svg = nativeNode as SVGElement;
    const svgDataUrl = await svgToDataURL(svg);
    return createImage(svgDataUrl);
  }

  return nativeNode.cloneNode(false) as HTMLElement;
}

async function cloneChildren(
  nativeNode: HTMLElement,
  clonedNode: HTMLElement,
  filter?: Function,
) {
  const children = toArray<HTMLElement>(nativeNode.childNodes);
  if (children.length === 0) {
    return clonedNode;
  }

  // clone children in order
  return children
    .reduce(
      (done, child) =>
        done
          .then(() => cloneNode(child, filter))
          .then((clonedChild: HTMLElement | null) => {
            if (clonedChild) {
              clonedNode.appendChild(clonedChild);
            }
          }),
      Promise.resolve(),
    )
    .then(() => clonedNode);
}

function cloneCssStyle(nativeNode: HTMLElement, clonedNode: HTMLElement) {
  const source = window.getComputedStyle(nativeNode);
  const target = clonedNode.style;

  if (source.cssText) {
    target.cssText = source.cssText;
  } else {
    toArray<string>(source).forEach((name) => {
      target.setProperty(
        name,
        source.getPropertyValue(name),
        source.getPropertyPriority(name),
      );
    });
  }
}

function cloneInputValue(nativeNode: HTMLElement, clonedNode: HTMLElement) {
  if (nativeNode instanceof HTMLTextAreaElement) {
    clonedNode.innerHTML = nativeNode.value;
  }

  if (nativeNode instanceof HTMLInputElement) {
    clonedNode.setAttribute('value', nativeNode.value);
  }
}

async function decorate(
  nativeNode: HTMLElement,
  clonedNode: HTMLElement,
) {
  if (!(clonedNode instanceof Element)) {
    return clonedNode;
  }

  await cloneCssStyle(nativeNode, clonedNode);
  await clonePseudoElements(nativeNode, clonedNode);
  await cloneInputValue(nativeNode, clonedNode);

  return clonedNode;
}

export default async function cloneNode(
  domNode: HTMLElement,
  filter?: Function,
  isRoot?: boolean,
) {
  if (!isRoot && filter && !filter(domNode)) {
    return null;
  }

  let cloned = await cloneSingleNode(domNode);
  cloned = await cloneChildren(domNode, cloned, filter);
  cloned = await decorate(domNode, cloned);

  return cloned;
}
