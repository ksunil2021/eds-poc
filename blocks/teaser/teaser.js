import { createOptimizedPicture, decorateButtons } from '../../scripts/aem.js';

export default function decorate(block) {
  if (!block || block.querySelector('.teaser-content')) return;

  decorateButtons(block);

  const mediaWrapper = document.createElement('div');
  mediaWrapper.className = 'teaser-media';

  const images = [...block.querySelectorAll('picture img, img')];
  const allLinks = [...block.querySelectorAll('a[href]')];

  const videoLink = allLinks.find(
    (a) => /\.(mp4)$/i.test(a.href) || /\/adobe\/assets\/urn:aaid:aem:/i.test(a.href)
  );

  const gif = images.find((img) => /\.gif$/i.test(img.currentSrc || img.src))?.cloneNode(true);
  const primary = images.find((img) => !/\.gif$/i.test(img.currentSrc || img.src))?.cloneNode(true);

  const handleError = (el, fallback) =>
    el.addEventListener('error', () => {
      el.remove();
      fallback?.();
    });

  const getVideoSrc = (url = '') => {
    if (!url.includes('/adobe/assets/urn:aaid:aem:')) {
      return /\.(mp4)$/i.test(url) ? url : '';
    }
    if (url.includes('/renditions/original/as/')) return url;
    if (url.includes('/as/')) return url.replace('/as/', '/renditions/original/as/');
    return `${url}/renditions/original/as/video.mp4`;
  };

  const createFallbackImage = () => {
    if (primary?.src) {
      const pic = createOptimizedPicture(primary.src, primary.alt || '');
      pic.classList.add('teaser-picture', 'fade-in', 'is-visible');
      mediaWrapper.append(pic);
    }
  };

  const renderVideo = () => {
    if (!videoLink?.href) return false;

    const videoSrc = getVideoSrc(videoLink.href);
    if (!videoSrc) return false;

    const video = Object.assign(document.createElement('video'), {
      className: 'teaser-video fade-in',
      src: videoSrc,
      playsInline: true,
      muted: true,
      loop: true,
      autoplay: true,
      preload: 'auto',
    });

    video.setAttribute('aria-label', 'Teaser video');
    video.addEventListener('loadeddata', () =>
      video.play().catch(() => (video.controls = true))
    );

    handleError(video, createFallbackImage);
    mediaWrapper.append(video);
    videoLink.closest('p')?.remove();
    return true;
  };

  const renderGif = () => {
    if (!gif?.src) return false;

    const g = Object.assign(document.createElement('img'), {
      src: gif.src,
      alt: gif.alt || '',
      className: 'teaser-gif fade-in',
    });

    g.onload = () => g.classList.add('is-visible');
    handleError(g);
    mediaWrapper.append(g);
    return true;
  };

  const renderImage = () => {
    if (!primary?.src) return false;

    const pic = createOptimizedPicture(primary.src, primary.alt || '');
    pic.classList.add('teaser-picture', 'fade-in', 'is-visible');
    mediaWrapper.append(pic);
    return true;
  };

  (videoLink && renderVideo()) ||
    (gif && renderGif()) ||
    (primary && renderImage()) ||
    createFallbackImage();

  images.forEach((img) => {
    const picture = img.closest('picture');
    const para = img.closest('p');
    picture?.remove() ||
      (para && para.children.length === 1 && !para.textContent.trim()
        ? para.remove()
        : img.remove());
  });

  const content = document.createElement('div');
  content.className = 'teaser-content';

  const text = document.createElement('div');
  text.className = 'teaser-text';

  const heading = block.querySelector('h1,h2,h3,h4,h5,h6');
  if (heading) {
    heading.classList.add('teaser-title');
    text.append(heading);
  }

  block.querySelectorAll('p:not(:has(a))').forEach((p) => {
    text.append(p);
  });

  let targetUrl;
  const buttonLink = allLinks.find((a) => !a.closest('.teaser-media'));
  const buttonPara = buttonLink?.closest('p');

  if (buttonLink) {
    const href = buttonLink.getAttribute('href')?.trim();
    const textContent = buttonLink.textContent?.trim();

    if (href) {
      targetUrl = href;
    }

    if (href && textContent && buttonLink.classList.contains('button')) {
      text.append(buttonPara);
    } else {
      buttonPara?.remove();
    }
  }

  content.append(text);
  block.replaceChildren(mediaWrapper, content);

  block.querySelectorAll('a[href]').forEach((link) => {
    try {
      const linkURL = new URL(link.href);
      if (linkURL.origin === window.location.origin) {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      } else {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      }
    } catch (e) { }
  });

  const isAlignedVariation =
    block.classList.contains('media-left-aligned') ||
    block.classList.contains('media-right-aligned');

  if (targetUrl && !isAlignedVariation) {
    [block.querySelector('.teaser-media'), block.querySelector('.teaser-title')].forEach((el) => {
      if (!el) return;

      el.tabIndex = 0;
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        window.location.href = targetUrl;
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.location.href = targetUrl;
        }
      });
    });
  }
}
