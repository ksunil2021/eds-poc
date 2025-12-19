export default async function decorate(block) {
  const rows = [...block.children];

  // Extract content from row structure (each row has a cell div)
  const imageRow = rows[0]?.querySelector('a');
  const quoteTextRow = rows[1]?.querySelector('p');
  const brandNameRow = rows[2]?.querySelector('p');
  const clientNameRow = rows[3]?.querySelector('p');

  // Create block container
  const blockContainer = document.createElement('div');
  blockContainer.classList.add('block-container');

  // Create and populate quote-image div
  const quoteImage = document.createElement('div');
  const image = document.createElement('picture');
  image.setAttribute('href', imageRow);
  quoteImage.classList.add('quote-image');
  if (imageRow) {
    quoteImage.append(image);
  }
  blockContainer.append(quoteImage);

  // Create and populate quote-text div
  const quoteText = document.createElement('div');
  quoteText.classList.add('quote-text');

  // Format quote text with quotes and italics
  if (quoteTextRow) {
    const quoteP = document.createElement('p');
    quoteP.innerHTML = `"<em>${quoteTextRow.textContent}</em>"`;
    quoteText.append(quoteP);
  }

  // Format brand name with bold
  if (brandNameRow) {
    const brandP = document.createElement('p');
    brandP.innerHTML = `<strong>${brandNameRow.textContent}</strong>`;
    quoteText.append(brandP);
  }

  // Add client name as plain text
  if (clientNameRow) {
    const clientP = document.createElement('p');
    clientP.textContent = clientNameRow.textContent;
    quoteText.append(clientP);
  }

  blockContainer.append(quoteText);

  // Cleanup & append
  block.innerHTML = '';
  block.append(blockContainer);
}
