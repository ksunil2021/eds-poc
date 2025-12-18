export default function decorate(block) {
  // Add the custom-list class to the main block
  block.classList.add('custom-list');
  
  // Find primary image for bullets
  const images = [...block.querySelectorAll('picture img')];
  const primaryImage = images.find((img) => {
    const src = img.src || '';
    // Filter out user icons or default icons
    return !src.includes('user.svg') && !src.includes('icons/user');
  });
  
  // Get the picture element that contains our primary image
  let primaryPicture = primaryImage ? primaryImage.closest('picture') : null;
  
  // If no suitable image found, use the first image as fallback
  if (!primaryPicture && images.length > 0) {
    primaryPicture = images[0].closest('picture');
  }
  
  // Process each row
  [...block.children].forEach((row) => {
    // Get the first element which contains the content
    const firstElement = row.firstElementChild;
    
    if (firstElement) {
      // Find all UL elements in this row
      const ulElements = firstElement.tagName === 'UL' ? 
                        [firstElement] : 
                        [...firstElement.querySelectorAll('ul')];
      
      if (ulElements.length > 0) {
        // Process each UL element found
        ulElements.forEach((ulElement) => {
          // Process each list item in this UL
          [...ulElement.children].forEach((li) => {
            // Create bullet container
            const bulletDiv = document.createElement('div');
            bulletDiv.className = 'custom-list-bullet';
            
            // Clone the primary image if available
            if (primaryPicture) {
              const imgClone = primaryPicture.cloneNode(true);
              bulletDiv.appendChild(imgClone);
            }
            
            // Insert the bullet at the beginning of the list item
            li.insertBefore(bulletDiv, li.firstChild);
            
            // Add custom-list-item class to the list item
            li.classList.add('custom-list-item');
            
            // Create content container for the list item content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'custom-list-content';
            
            // Move all children except the bullet to the content div
            while (li.childNodes.length > 1) {
              // Skip the first child (which is the bullet)
              contentDiv.appendChild(li.childNodes[1]);
            }
            
            // Add the content div back to the list item
            li.appendChild(contentDiv);
          });
        });
      } else {
        // If no UL found, create a simple list structure
        const ul = document.createElement('ul');
        ul.className = 'custom-list-container';
        
        // Create a list item
        const listItem = document.createElement('li');
        listItem.className = 'custom-list-item';
        
        // Create bullet container
        const bulletDiv = document.createElement('div');
        bulletDiv.className = 'custom-list-bullet';
        
        // Add primary image to bullet if available
        if (primaryPicture) {
          const imgClone = primaryPicture.cloneNode(true);
          bulletDiv.appendChild(imgClone);
        }
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'custom-list-content';
        
        // Move content to the content div
        firstElement.querySelectorAll('p:not(.button-container)').forEach((p) => contentDiv.append(p));
        //contentDiv.append(firstElement.querySelectorAll('p'));
        
        // Assemble the list item
        listItem.appendChild(bulletDiv);
        listItem.appendChild(contentDiv);
        
        // Add to the list
        ul.appendChild(listItem);
        
        // Replace row content with the new structure
        row.replaceChildren(ul);
      }
    }
  });
  
  // Remove the original primary image from the block to avoid duplication
  if (primaryPicture && primaryPicture.parentElement) {
    primaryPicture.parentElement.removeChild(primaryPicture);
  }
  const abutton = block.querySelector('a');
  if(abutton){
    abutton.remove();
  }
}
