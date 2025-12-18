import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { createBreadcrumb } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const hero = block.querySelector('.hero > div');
  if (!hero) return;
  hero.className = 'hero-content-wrapper';

  const heroWrapper = document.querySelector('.hero-wrapper');
  const isSplitVariation = heroWrapper.querySelector('.split-media-left, .split-media-right');

  const teaserContent = hero.querySelector('div > div');
  teaserContent.className = 'hero-teaser-content';

  const images = [...block.querySelectorAll('picture img, img')];
  const videoLink = [...block.querySelectorAll('a[href]')].find(
    (a) => /\.(mp4)$/i.test(a.href) || /\/adobe\/assets\/urn:aaid:aem:/i.test(a.href),
  );

  const gif = images.find((img) => /\.gif$/i.test(img.currentSrc || img.src))?.cloneNode(true) || null;
  const primary = images.find((img) => !/\.gif$/i.test(img.currentSrc || img.src))?.cloneNode(true) || null;

  const fallbackImage = () => {
    if (!primary?.src) return;
    const pic = createOptimizedPicture(primary.src, primary.alt || '');
    pic.classList.add('teaser-picture', 'fade-in', 'is-visible');
    teaserContent.append(pic);
  };

  const onError = (el, msg) => {
    el.addEventListener('error', () => {
      console.warn(msg);
      el.remove();
      fallbackImage();
    });
  };

  const getVideoSrc = (url = '') => {
    if (!url) return '';
    if (url.includes('/adobe/assets/urn:aaid:aem:')) {
      if (url.includes('/renditions/original/as/')) return url;
      if (url.includes('/as/')) return url.replace('/as/', '/renditions/original/as/');
      return `${url}/renditions/original/as/video.mp4`;
    }
    return /\.(mp4)$/i.test(url) ? url : '';
  };

  const renderVideo = () => {
    if (!videoLink?.href) return false;

    const videoSrc = getVideoSrc(videoLink.href);
    if (!videoSrc) return false;

    let regularImg = null;
    const allImages = [...block.querySelectorAll('picture img, img')];
    allImages.forEach((img) => {
      if (!img) return;
      if (!regularImg) regularImg = img;
    });


    const video = Object.assign(document.createElement('video'), {
      className: 'teaser-video fade-in',
      src: videoSrc,
      playsInline: true,
      muted: false,
      loop: true,
      autoplay: false,
      controlsList: 'nofullscreen nodownload',
      preload: 'auto',
    });

    if (regularImg) {
      video.setAttribute('poster', regularImg.src);
    }


    video.setAttribute('aria-label', 'Teaser video');
    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {
        video.controls = false;
      });
      video.classList.add('is-visible');
    });

    const playIcon = document.createElement('img');
    playIcon.src = '/icons/pause_icon.svg'; // Or .svg, .jpg, etc.
    playIcon.className = 'text-media-play-icon';
    playIcon.alt = 'Play';

    playIcon.addEventListener('click', () => {
      if (video.paused || video.ended) {
        video.play();
        playIcon.src = '/icons/play_icon.svg';
        playIcon.alt = 'Play';
      } else {
        video.pause();
        playIcon.src = '/icons/pause_icon.svg';
        playIcon.alt = 'Pause';
      }
    });

    // Create a new image element
    const soundIcon = document.createElement('img');
    soundIcon.src = '/icons/sound_icon.svg'; // Or .svg, .jpg, etc.
    soundIcon.className = 'text-media-sound-icon';
    soundIcon.alt = 'Sound';

    soundIcon.addEventListener('click', () => {
      if (video.muted) {
        video.muted = false;
        soundIcon.src = '/icons/sound_icon.svg';
        soundIcon.alt = 'Sound';
      } else {
        video.muted = true;
        soundIcon.src = '/icons/mute_icon.svg';
        soundIcon.alt = 'Mute';
      }
    });

    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add('video-wrapper');

    // Add the arrow icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'controls-btn-wrapper';
    iconDiv.appendChild(playIcon);
    iconDiv.appendChild(soundIcon);

    onError(video, 'Video failed — showing fallback image');
    videoWrapper.appendChild(video);
    videoWrapper.appendChild(iconDiv);

    if (isSplitVariation) {
      teaserContent.append(videoWrapper);
    } else {
      hero.append(videoWrapper);
    }

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
    onError(g, 'GIF failed — showing fallback image');
    if (isSplitVariation) {
      teaserContent.append(g);
    } else {
      hero.append(g);
    }

    return true;
  };

  const renderImage = () => {
    if (!primary?.src) return false;

    const pic = createOptimizedPicture(primary.src, primary.alt || '');
    pic.classList.add('teaser-picture', 'fade-in', 'is-visible');
    if (isSplitVariation) {
      teaserContent.append(pic);
    } else {
      hero.append(pic);
    }

    return true;
  };

  const rendered = (videoLink && renderVideo())
    || (gif && renderGif())
    || (primary && renderImage());
  if (!rendered) fallbackImage();

  images.forEach((img) => {
    const picture = img.closest('picture');
    const para = img.closest('p');
    if (picture) {
      picture.remove();
    } else if (para && para.children.length === 1 && !para.textContent.trim()) {
      para.remove();
    } else {
      img.remove();
    }
  });

  const heroText = document.createElement('div');
  heroText.className = 'hero-text';

  const text = teaserContent.querySelectorAll('p:not(:has(picture)), h1, h4');
  const buttons = teaserContent.querySelectorAll('.button-container');

  text.forEach((p) => {
    if (!p.classList.contains('button-container')) {
      heroText.appendChild(p);
    }
  });

  try {
    if (buttons && buttons.length > 0) {
      const [primaryBtn, secondaryBtn] = buttons;
      if (primaryBtn) {
        const primaryLink = primaryBtn.querySelector('a');
        const primaryHref = primaryLink?.href;
        const primaryText = primaryLink?.textContent?.trim();

        if (primaryLink && primaryHref && primaryText) {
          primaryBtn.classList.add('primary-btn');
          heroText.appendChild(primaryBtn);
        } else {
          primaryBtn.remove();
        }
      }
      if (secondaryBtn) {
        const secondaryLink = secondaryBtn.querySelector('a');
        const secondaryHref = secondaryLink?.href;
        const secondaryText = secondaryLink?.textContent?.trim();

        if (secondaryLink && secondaryHref && secondaryText) {
          secondaryBtn.classList.add('secondary-btn');
          heroText.appendChild(secondaryBtn);
        } else {
          secondaryBtn.remove();
        }
      }
    }
  } catch (error) {
    console.error('Error processing buttons:', error);
  }

  teaserContent.appendChild(heroText);

  const hasRenderedBreadcrumbs = document.querySelector('.breadcrumbs');
  if (getMetadata('breadcrumbs').toLowerCase() === 'true' && !hasRenderedBreadcrumbs) {
    const breadcrumbs = document.createElement('div');
    breadcrumbs.append(createBreadcrumb());
    heroWrapper.append(breadcrumbs);
  }
}
