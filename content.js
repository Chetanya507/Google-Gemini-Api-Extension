// content.js

// Create the dot element
const dot = document.createElement('div');
dot.id = 'ai-summarizer-dot';
dot.classList.add('fluent-dot');

// Set initial position to bottom-right corner
dot.style.position = 'fixed';
dot.style.right = '20px';
dot.style.bottom = '20px';
dot.style.left = 'auto'; // Ensure left is auto
dot.style.top = 'auto'; // Ensure top is auto

document.body.appendChild(dot);

// Variables for dragging
let isDragging = false;
let startX, startY, startDotX, startDotY;

dot.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startDotX = dot.offsetLeft;
  startDotY = dot.offsetTop;

  // Prevent default behavior to avoid text selection
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    dot.style.left = startDotX + dx + 'px';
    dot.style.top = startDotY + dy + 'px';
    dot.style.right = 'auto'; // Reset right property
    dot.style.bottom = 'auto'; // Reset bottom property
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
  }
});

// Add click event to the dot
dot.addEventListener('click', () => {
  displayPopup('Summarizing, please wait...');

  // Capture the URL of the current webpage
  const pageUrl = window.location.href;

  // Send a message to the background script with the URL
  chrome.runtime.sendMessage({ action: 'summarize', url: pageUrl }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      displayPopup(`Error: ${chrome.runtime.lastError.message}`);
    } else {
      console.log('Message sent successfully:', response);
    }
  });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  console.log('Message received in content script:', request);
  if (request.action === 'displaySummary') {
    displayPopup(request.summary);
  }
});

// Function to display the popup with word-by-word animation
function displayPopup(summary) {
  console.log('Displaying summary:', summary);

  let popup = document.getElementById('ai-summarizer-popup');
  let content = document.getElementById('ai-summarizer-content');
  let closeButton = document.getElementById('ai-summarizer-close-button');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'ai-summarizer-popup';
    popup.classList.add('summary-popup');

    // Create the close button
    closeButton = document.createElement('span');
    closeButton.id = 'ai-summarizer-close-button';
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '×';

    // Create the content container
    content = document.createElement('div');
    content.id = 'ai-summarizer-content';
    content.classList.add('popup-content');

    // Append elements to the popup
    popup.appendChild(closeButton);
    popup.appendChild(content);

    // Append the popup to the body
    document.body.appendChild(popup);

    // Add event listener to close the popup
    closeButton.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }

  // Clear previous content and show the popup
  content.innerText = '';
  popup.style.display = 'block';

  // Apply the selected theme
  chrome.storage.sync.get('selectedTheme', (data) => {
    const theme = data.selectedTheme || 'light';
    popup.setAttribute('data-theme', theme);
  });

  // If the summary is an error or status message, display it immediately
  if (summary.startsWith('Error:') || summary === 'Summarizing, please wait...') {
    content.innerText = summary;
    return;
  }

  // Split the summary into words
  const words = summary.split(' ');
  let wordIndex = 0;

  // Function to append words with a delay
  function typeWord() {
    if (wordIndex < words.length) {
      content.innerText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
      wordIndex++;
      // Scroll to the bottom of the content if it overflows
      content.scrollTop = content.scrollHeight;
      setTimeout(typeWord, 100); // Adjust delay (in milliseconds) as needed
    }
  }

  // Start the typing animation
  typeWord();
}