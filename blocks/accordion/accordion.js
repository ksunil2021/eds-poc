import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const originalHTML = block.innerHTML;

  const getVideoSrc = (url = '') => {
    if (!url) return '';
    if (!url.includes('/adobe/assets/urn:aaid:aem:')) return url.endsWith('.mp4') ? url : '';

    if (url.includes('/renditions/original/as/')) return url;
    if (url.includes('/as/')) return url.replace('/as/', '/renditions/original/as/');
    return `${url}/renditions/original/as/video.mp4`;
  };

  const createVideo = (src) => {
    const v = document.createElement('video');
    Object.assign(v, {
      className: 'accordion-media-video fade-in',
      src: getVideoSrc(src),
      playsInline: true,
      muted: true,
      loop: true,
      autoplay: true,
      preload: 'auto',
    });
    v.addEventListener('loadeddata', () => v.play().catch(() => { v.controls = true; }));
    return v;
  };

  const createMedia = (media) => {
    if (media.videoLink) return createVideo(media.videoLink.href);
    if (media.gif) {
      return Object.assign(new Image(), {
        src: media.gif.src,
        alt: media.gif.alt || '',
        className: 'accordion-media-gif fade-in',
      });
    }
    if (media.img) {
      const pic = createOptimizedPicture(media.img.src, media.img.alt || '');
      pic.classList.add('accordion-media-image', 'fade-in', 'is-visible');
      return pic;
    }
    return null;
  };

  const wrapBodyContent = () => {
    block.querySelectorAll('.accordion-item-body').forEach((body) => {
      const p = body.querySelector('p:not(:has(picture)):not(.accordion-caption)');
      const ul = body.querySelector('ul');
      if (!p && !ul) return;

      const wrap = document.createElement('div');
      wrap.className = 'my-wrapper';
      if (p) wrap.append(p);
      if (ul) wrap.append(ul);
      body.prepend(wrap);
    });
  };

  const collectMedia = (body) => {
    const videoLink = body.querySelector('a[href$=".mp4"], a[href*="/adobe/assets/urn:aaid:aem:"]');
    const gif = body.querySelector('img[src$=".gif"]');
    const imgWrapper = body.querySelector('p:has(picture)');
    const img = imgWrapper?.querySelector('img');
    const viewMore = body.querySelector('a.button, .button-container a');

    let caption = body.querySelector('p.accordion-caption');
    if (!caption) {
      caption = [...body.querySelectorAll('p')].find(
        (p) => !p.querySelector('picture')
          && !p.contains(viewMore)
          && !p.contains(videoLink)
          && p !== imgWrapper
          && p.textContent.trim()
          && p.textContent !== 'SUB HEADER',
      );
    }

    [imgWrapper, gif, videoLink, viewMore?.closest('p'), caption].forEach((el) => el?.remove());

    return {
      img, gif, videoLink, viewMore, captionPara: caption,
    };
  };

  const init = () => {
    const isMobile = window.matchMedia('(max-width: 599px)').matches;

    block.parentElement.querySelector('.accordion-media-container')?.remove();
    block.innerHTML = originalHTML;

    const accordions = [...block.children].map((row, i) => {
      const [label, body] = row.children;

      const details = document.createElement('details');
      details.className = 'accordion-item';
      details.dataset.mediaIndex = i;

      const summary = document.createElement('summary');
      summary.className = 'accordion-item-label';
      summary.append(...label.childNodes);

      body.className = 'accordion-item-body';
      details.append(summary, body);
      row.replaceWith(details);

      return { details, media: collectMedia(body) };
    });

    wrapBodyContent();

    accordions.forEach(({ details }, i) => {
      details.querySelector('summary').addEventListener('click', () => {
        const open = details.hasAttribute('open');
        accordions.forEach((a) => {
          if (a.details !== details) a.details.removeAttribute('open');
        });
        if (open) (accordions[i + 1] || accordions[0]).details.setAttribute('open', '');
      });
    });

    if (!isMobile) {
      const container = document.createElement('div');
      container.className = 'accordion-media-container';

      const mediaWrapper = document.createElement('div');
      mediaWrapper.className = 'accordion-image-wrapper';

      const mediaInfo = document.createElement('div');
      mediaInfo.className = 'accordion-media-info';

      container.append(mediaWrapper, mediaInfo);
      block.parentElement.insertBefore(container, block.nextSibling);

      const updateMedia = (media) => {
        mediaWrapper.innerHTML = '';
        mediaInfo.innerHTML = '';

        const mediaEl = createMedia(media);
        if (mediaEl) mediaWrapper.append(mediaEl);

        if (media.captionPara) {
          const cap = media.captionPara.cloneNode(true);
          cap.classList.add('accordion-caption');
          mediaInfo.append(cap);
        }

        if (media.viewMore) {
          const btn = media.viewMore.cloneNode(true);
          const wrap = document.createElement('div');
          wrap.className = 'button-container';
          wrap.append(btn);
          mediaWrapper.append(wrap);
        }
      };

      accordions.forEach(({ details, media }) => {
        details.querySelector('summary').addEventListener('click', () => {
          setTimeout(() => {
            if (details.hasAttribute('open')) updateMedia(media);
          }, 0);
        });
      });

      accordions[0].details.setAttribute('open', '');
      updateMedia(accordions[0].media);
      return;
    }

    accordions.forEach(({ details, media }, index) => {
      const body = details.querySelector('.accordion-item-body');

      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'accordion-image-wrapper';

      const mediaEl = createMedia(media);
      if (mediaEl) mediaDiv.append(mediaEl);

      if (media.viewMore) {
        const btn = media.viewMore.cloneNode(true);
        const wrap = document.createElement('div');
        wrap.className = 'button-container';
        wrap.append(btn);
        mediaDiv.append(wrap);
      }

      body.append(mediaDiv);

      if (media.captionPara) {
        const cap = media.captionPara.cloneNode(true);
        cap.classList.add('accordion-caption');
        body.append(cap);
      }

      if (index === 0) details.setAttribute('open', '');
    });
  };

  init();

  let currentMode = window.matchMedia('(max-width: 599px)').matches ? 'mobile' : 'desktop';
  window.addEventListener('resize', () => {
    const newMode = window.matchMedia('(max-width: 599px)').matches ? 'mobile' : 'desktop';
    if (newMode !== currentMode) {
      currentMode = newMode;
      requestAnimationFrame(init);
    }
  });
}
