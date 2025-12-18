export default function decorate(block) {
  const section = block.closest('.section');
  if (!section) return;

  const defaultContentWrapper = section.querySelector('.default-content-wrapper');
  if (!defaultContentWrapper) return;

  const headings = defaultContentWrapper.querySelectorAll('h1, h2, h3, h4');
  if (headings.length === 0) return;
  const ul = document.createElement('ul');

  headings.forEach((heading) => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;

    const li = document.createElement('li');
    li.appendChild(link);
    ul.appendChild(li);
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Anchor Navigation');
  nav.appendChild(ul);
  block.replaceChildren(nav);

  function setActive(link) {
    ul.querySelectorAll('li.active').forEach((li) => {
      li.classList.remove('active');
      li.querySelector('a').removeAttribute('aria-current');
    });

    link.parentElement.classList.add('active');
    link.setAttribute('aria-current', 'location');
  }

  const { hash } = window.location;
  if (hash) {
    const activeLink = ul.querySelector(`li a[href="${hash}"]`);
    if (activeLink) {
      setActive(activeLink);
    }
  }

  ul.addEventListener('click', (event) => {
    const { target } = event;
    if (target.tagName === 'A') {
      setActive(target);
    }
  });
}
