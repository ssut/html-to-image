import cloneNode from './clone-node';
import embedWebFonts from './embed-web-fonts';
import embedImages from './embed-images';
import createSvgDataURL from './create-svg-data-url';
import applyStyleWithOptions from './apply-style-with-options';
import {
  createImage,
  delay,
  canvasToBlob,
  getNodeWidth,
  getNodeHeight,
  getPixelRatio,
} from './utils';

export type OptionsType = {
  /**
   * A function taking DOM node as argument. Should return `true`
   * if passed node should be included in the output. Excluding
   * node means excluding it's children as well.
   */
  filter?: (domNode: HTMLElement) => boolean;
  width?: number;
  height?: number;
  style?: Object;
  /**
   * A number between `0` and `1` indicating image quality (e.g. 0.92 => 92%)
   * of the JPEG image.
   */
  quality?: number;
  /**
   * A string value for the background color, any valid CSS color value.
   */
  backgroundColor?: string;
  /**
   * Set to `true` to append the current time as a query string to URL
   * requests to enable cache busting.
   */
  cacheBust?: boolean;
  /**
   * A data URL for a placeholder image that will be used when fetching
   * an image fails. Defaults to an empty string and will render empty
   * areas for failed images.
   */
  imagePlaceholder?: string;
};

function getImageSize(domNode: HTMLElement, options: OptionsType = {}) {
  const width = options.width || getNodeWidth(domNode);
  const height = options.height || getNodeHeight(domNode);
  return { width, height };
}

export async function toSvgDataURL(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<string> {
  const { width, height } = getImageSize(domNode, options);

  let clonedNode = (await cloneNode(domNode, options.filter, true))!;

  // embed web fonts
  clonedNode = await embedWebFonts(clonedNode, options);

  // embed images
  clonedNode = await embedImages(clonedNode, options);

  // apply styles
  clonedNode = await applyStyleWithOptions(clonedNode, options);

  // create svgDataURL
  const svgDataURL = await createSvgDataURL(clonedNode, width, height);

  return svgDataURL;
}

export async function toCanvas(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<HTMLCanvasElement> {
  const svgDataURL = await toSvgDataURL(domNode, options);
  const image = await createImage(svgDataURL);

  await delay(100);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const ratio = getPixelRatio();
  const { width, height } = getImageSize(domNode, options);

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}`;
  canvas.style.height = `${height}`;
  context.scale(ratio, ratio);

  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(image, 0, 0);

  return canvas;
}

export async function toPixelData(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<Uint8ClampedArray> {
  const { width, height } = getImageSize(domNode, options);
  const canvas = await toCanvas(domNode, options);

  const pixelData = canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
  return pixelData;
}

export async function toPng(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<string> {
  const canvas = await toCanvas(domNode, options);

  const pngDataURL = canvas.toDataURL();
  return pngDataURL;
}

export async function toJpeg(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<string> {
  const canvas = await toCanvas(domNode, options);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', options.quality || 1);
  return jpegDataUrl;
}

export async function toBlob(
  domNode: HTMLElement,
  options: OptionsType = {},
): Promise<Blob | null> {
  const canvas = await toCanvas(domNode, options);

  return canvasToBlob(canvas);
}

export default {
  toSvgDataURL,
  toCanvas,
  toPixelData,
  toPng,
  toJpeg,
  toBlob,
};
