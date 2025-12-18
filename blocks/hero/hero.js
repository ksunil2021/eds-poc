import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { createBreadcrumb } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const hero = block.querySelector('.hero > div');
  if (!hero) return;
  hero.className = 'hero-content-wrapper';

  const heroWrapper = document.querySelector('.hero-wrapper');
  const isSplitVariation = heroWrapper?.querySelector('.split-media-left, .split-media-right');

  const teaserContent = hero.querySelector('div > div');
  if (!teaserContent) return;
  teaserContent.className = 'hero-teaser-content';

  // Extract all content divs from the block
  const allDivs = [...block.children];
  
  // Parse content structure
  let imageDiv = null;
  let eyebrowText = '';
  let titleText = '';
  let descriptionText = '';
  let primaryButtonText = '';
  let secondaryButtonText = '';

  allDivs.forEach((div) => {
    const img = div.querySelector('img');
    const videoLink = div.querySelector('a[href*=".mp4"], a[href*="/adobe/assets/urn:aaid:aem:"]');
    const textContent = div.textContent?.trim();
    const aueLabel = div.querySelector('[data-aue-label]')?.getAttribute('data-aue-label');

    if (img && !videoLink) {
      imageDiv = div;
    } else if (aueLabel === 'Eyebrow text' || (!eyebrowText && textContent && !imageDiv)) {
      eyebrowText = textContent;
    } else if (aueLabel === 'Title' || (!titleText && textContent && eyebrowText)) {
      titleText = textContent;
    } else if (aueLabel === 'Description' || (!descriptionText && textContent && titleText)) {
      descriptionText = textContent;
    } else if (aueLabel === 'Primary Button Text' || (!primaryButtonText && textContent && descriptionText)) {
      primaryButtonText = textContent;
    } else if (aueLabel === 'Secondary Button Text' || (!secondaryButtonText && textContent && primaryButtonText)) {
      secondaryButtonText = textContent;
    }
  });

  // Find images and video
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
    if (isSplitVariation) {
      teaserContent.append(pic);
    } else {
      hero.append(pic);
    }
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

    const video = Object.assign(document.createElement('video'), {
      className: 'teaser-video fade-in',
      src: videoSrc,
      playsInline: true,
      muted: true,
      loop: true,
      autoplay: true,
      controlsList: 'nofullscreen nodownload',
      preload: 'auto',
    });

    if (primary) {
      video.setAttribute('poster', primary.src);
    }

    video.setAttribute('aria-label', 'Teaser video');
    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {
        video.controls = false;
      });
      video.classList.add('is-visible');
    });

    const playIcon = document.createElement('img');
    playIcon.src = '/icons/pause_icon.svg';
    playIcon.className = 'text-media-play-icon';
    playIcon.alt = 'Pause';

    playIcon.addEventListener('click', () => {
      if (video.paused || video.ended) {
        video.play();
        playIcon.src = '/icons/pause_icon.svg';
        playIcon.alt = 'Pause';
      } else {
        video.pause();
        playIcon.src = '/icons/play_icon.svg';
        playIcon.alt = 'Play';
      }
    });

    const soundIcon = document.createElement('img');
    soundIcon.src = '/icons/mute_icon.svg';
    soundIcon.className = 'text-media-sound-icon';
    soundIcon.alt = 'Mute';

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

  // Render media (video, gif, or image)
  const rendered = (videoLink && renderVideo())
    || (gif && renderGif())
    || (primary && renderImage());
  
  if (!rendered) fallbackImage();

  // Clean up old images from DOM
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

  // Build hero text content
  const heroText = document.createElement('div');
  heroText.className = 'hero-text';

  // Add empty paragraph for spacing if needed
  const emptyP = document.createElement('p');
  heroText.appendChild(emptyP);

  // Add eyebrow text
  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.textContent = eyebrowText;
    heroText.appendChild(eyebrow);
  }

  // Add title
  if (titleText) {
    const title = document.createElement('h1');
    title.textContent = titleText;
    // Create ID from title
    const titleId = titleText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    title.id = titleId;
    heroText.appendChild(title);
  }

  // Add description
  if (descriptionText) {
    const description = document.createElement('p');
    description.textContent = descriptionText;
    heroText.appendChild(description);
  }

  // Add primary button
  if (primaryButtonText) {
    const primaryBtnContainer = document.createElement('p');
    primaryBtnContainer.className = 'button-container primary-btn';
    
    const primaryLink = document.createElement('a');
    primaryLink.href = 'https://www.wwt.com/';
    primaryLink.title = primaryButtonText;
    primaryLink.className = 'button';
    primaryLink.textContent = primaryButtonText;
    
    primaryBtnContainer.appendChild(primaryLink);
    heroText.appendChild(primaryBtnContainer);
  }

  // Add secondary button
  if (secondaryButtonText) {
    const secondaryBtnContainer = document.createElement('p');
    secondaryBtnContainer.className = 'button-container secondary-btn';
    
    const em = document.createElement('em');
    const secondaryLink = document.createElement('a');
    secondaryLink.href = 'https://www.wwt.com/';
    secondaryLink.title = secondaryButtonText;
    secondaryLink.className = 'button secondary';
    secondaryLink.textContent = secondaryButtonText;
    
    em.appendChild(secondaryLink);
    secondaryBtnContainer.appendChild(em);
    heroText.appendChild(secondaryBtnContainer);
  }

  // Clear existing content and append hero text
  teaserContent.innerHTML = '';
  teaserContent.appendChild(heroText);

  // Add breadcrumbs if needed
  const hasRenderedBreadcrumbs = document.querySelector('.breadcrumbs');
  if (getMetadata('breadcrumbs').toLowerCase() === 'true' && !hasRenderedBreadcrumbs) {
    const breadcrumbsWrapper = document.createElement('div');
    breadcrumbsWrapper.className = 'breadcrumbs-wrapper';
    
    const nav = document.createElement('nav');
    nav.className = 'breadcrumbs';
    nav.appendChild(createBreadcrumb());
    
    breadcrumbsWrapper.appendChild(nav);
    
    // Insert after hero-wrapper
    heroWrapper.insertAdjacentElement('afterend', breadcrumbsWrapper);
  }
}