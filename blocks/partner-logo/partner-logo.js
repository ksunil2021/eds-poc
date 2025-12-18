import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const logosGrid = document.createElement('div');
  logosGrid.className = 'partner-logos';

  const filtersWrapper = document.createElement('div');
  filtersWrapper.className = 'partner-filters';

  const allTags = new Set();
  const logoItems = [];
  const activeFilters = new Set();

  [...block.children].forEach((item) => {
    const img = item.querySelector('img');
    const imgSrc = img?.src || '';
    const link = item.querySelector('a')?.href || '#';
    const tags = [...item.querySelectorAll('p')]
      .flatMap((p) => p.textContent.split(','))
      .map((t) => t.trim())
      .filter((t) => t && !/^https?:\/\//i.test(t));
    tags.forEach((t) => allTags.add(t));

    const div = document.createElement('div');
    div.className = 'partner-logo-item';
    div.dataset.tags = tags.join(',');
    moveInstrumentation(item, div);

    const anchor = document.createElement('a');
    anchor.href = link;
    const newImg = document.createElement('img');
    newImg.src = imgSrc;
    newImg.alt = 'Partner logo';
    if (img) {
      moveInstrumentation(img, newImg);
    }
    anchor.appendChild(newImg);
    div.appendChild(anchor);

    logosGrid.appendChild(div);
    logoItems.push(div);
  });

  const updateDisplay = () => {
    logoItems.forEach((item) => {
      const itemTags = item.dataset.tags.split(',');
      item.style.display = activeFilters.size === 0
      || [...activeFilters].some((tag) => itemTags.includes(tag)) ? '' : 'none';
    });
  };

  const createFilterButton = (label, isAll = false) => {
    const btn = document.createElement('button');
    btn.className = 'partner-filter-btn';
    btn.innerHTML = `<span>${label}</span>`;
    if (isAll) btn.dataset.all = true;

    btn.addEventListener('click', () => {
      if (isAll) {
        activeFilters.clear();
        filtersWrapper.querySelectorAll('.partner-filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        btn.classList.toggle('active');
        activeFilters[activeFilters.has(label) ? 'delete' : 'add'](label);
        filtersWrapper.querySelector('[data-all]').classList.remove('active');
      }
      updateDisplay();
    });

    return btn;
  };

  const allBtn = createFilterButton('All', true);
  allBtn.classList.add('active');
  filtersWrapper.append(allBtn, ...[...allTags].sort().map((tag) => createFilterButton(tag)));

  block.innerHTML = '';
  block.append(filtersWrapper, logosGrid);
  updateDisplay();
}
