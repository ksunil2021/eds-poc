export default async function decorate(block) {
  const [quotation] = [...block.children];
  const blockquote = document.createElement('div');
  blockquote.classList.add('block-container');

  // decorate quotation
  quotation.className = 'quote-quotation';
  const [image, quoteText, brandName, clientName] = [...quotation.children];
  image.classList.add('quote-image');
  quoteText.classList.add('quote-text');
  blockquote.append(image);

  if (brandName) {
    brandName.classList.add('quote-brand');
    quoteText.append(brandName);
  }
  if (clientName) {
    clientName.classList.add('quote-client');
    quoteText.append(clientName);
  }

  blockquote.append(quoteText);

  // cleanup & append
  block.innerHTML = '';
  block.append(blockquote);
}
