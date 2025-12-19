import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
async function fetchCropConfig() {
  window.cropConfig = window.cropConfig || {};
  if (!window.cropConfig['block-config']) {
    window.cropConfig['block-config'] = new Promise((resolve) => {
      fetch('/block-image-config/block-config.json')
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const config = {};
          // Convert to BLOCK_IMAGE_CROP_SIZES format
          json.data
            .filter((item) => item.Key && item.Large && item.Small)
            .forEach((item) => {
              config[item.Key] = {
                large: item.Large,
                small: item.Small,
              };
            });
          window.cropConfig['block-config'] = config;
          resolve(window.cropConfig['block-config']);
        })
        .catch(() => {
          // error loading config
          window.cropConfig['block-config'] = {};
          resolve(window.cropConfig['block-config']);
        });
    });
  }
  return window.cropConfig['block-config'];
}
/**
 * Gets the extension of a URL.
 * @param {string} url The URL
 * @returns {string} The extension
 */
function getUrlExtension(url) {
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

/**
 * Convert Image anchor tag into picture tag (delivery url).
 * @param {Element} block The block element
 */
export async function decorateDMImages(block) {
  // Fetch block configuration from DA spreadsheet
  const blockImageCropSizes = await fetchCropConfig();

  // Determine block name and get crop sizes
  const blockName = block.dataset.blockName || block.classList[0] || 'default';
  const cropSizes = blockImageCropSizes[blockName] || blockImageCropSizes.default;
  const large = cropSizes?.large;
  const small = cropSizes?.small;

  block.querySelectorAll('a[href^="https://delivery-p"], a[href*="assets.eplusits.com"]:not([href*="/original/"])').forEach((a) => {
    const url = new URL(a.href);
    const ext = getUrlExtension(a.href);
    if (url.hostname.endsWith('.adobeaemcloud.com') && (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase()))) {
      const pic = document.createElement('picture');

      // Desktop (>= 900px) - WebP
      const sourceDesktopWebp = document.createElement('source');
      sourceDesktopWebp.type = 'image/webp';
      sourceDesktopWebp.srcset = `${url}?smartcrop=${large}`;
      sourceDesktopWebp.media = '(min-width: 900px)';

      // Desktop (>= 900px) - Fallback
      const sourceDesktopFallback = document.createElement('source');
      sourceDesktopFallback.srcset = `${url}?smartcrop=${large}`;
      sourceDesktopFallback.media = '(min-width: 900px)';

      // Tablet (>= 600px) - WebP
      const sourceTabletWebp = document.createElement('source');
      sourceTabletWebp.type = 'image/webp';
      sourceTabletWebp.srcset = `${url}?smartcrop=${small}`;
      sourceTabletWebp.media = '(min-width: 600px)';

      // Tablet (>= 600px) - Fallback
      const sourceTabletFallback = document.createElement('source');
      sourceTabletFallback.srcset = `${url}?smartcrop=${small}`;
      sourceTabletFallback.media = '(min-width: 600px)';

      // Mobile (< 600px) - fallback img
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = `${url}?smartcrop=${small}`;
      if (a.title) {
        img.setAttribute('alt', a.title);
      }

      pic.appendChild(sourceDesktopWebp);
      pic.appendChild(sourceDesktopFallback);
      pic.appendChild(sourceTabletWebp);
      pic.appendChild(sourceTabletFallback);
      pic.appendChild(img);
      a.replaceWith(pic);
    }
  });
}
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
