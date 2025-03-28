const dot = document.createElement('div');
dot.id = 'ai-summarizer-dot';
dot.classList.add('fluent-dot');

dot.style.position = 'fixed';
dot.style.right = '20px';
dot.style.bottom = '20px';
dot.style.left = 'auto';
dot.style.top = 'auto';

document.body.appendChild(dot);

let isDragging = false;
let startX, startY, startDotX, startDotY;

dot.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startDotX = dot.offsetLeft;
  startDotY = dot.offsetTop;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dot.style.left = startDotX + dx + 'px';
    dot.style.top = startDotY + dy + 'px';
    dot.style.right = 'auto';
    dot.style.bottom = 'auto';
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) isDragging = false;
});

dot.addEventListener('click', () => {
  displayPopup('Summarizing, please wait...');
  const pageUrl = window.location.href;
  chrome.runtime.sendMessage({ action: 'summarize', url: pageUrl }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      displayPopup(`Error: ${chrome.runtime.lastError.message}`);
    } else {
      console.log('Message sent successfully:', response);
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  console.log('Message received in content script:', request);
  if (request.action === 'displaySummary') {
    displayPopup(request.summary);
  }
});

// Function to parse markdown and convert to HTML
function parseMarkdown(text) {
  let lines = text.split('\n');
  let html = '';
  let inUnorderedList = false;
  let inOrderedList = false;

  lines.forEach((line, index) => {
    line = line.trim();

    // Handle unordered lists (- or * at start)
    if (line.match(/^[-*]\s+(.+)/)) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          html += '</ol>';
          inOrderedList = false;
        }
        html += '<ul>';
        inUnorderedList = true;
      }
      const content = line.replace(/^[-*]\s+(.+)/, '$1');
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    }
    // Handle ordered lists (1. 2. etc.)
    else if (line.match(/^\d+\.\s+(.+)/)) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          html += '</ul>';
          inUnorderedList = false;
        }
        html += '<ol>';
        inOrderedList = true;
      }
      const content = line.replace(/^\d+\.\s+(.+)/, '$1');
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    }
    // Regular line
    else {
      if (inUnorderedList) {
        html += '</ul>';
        inUnorderedList = false;
      }
      if (inOrderedList) {
        html += '</ol>';
        inOrderedList = false;
      }
      if (line) {
        html += `<p>${parseInlineMarkdown(line)}</p>`;
      }
    }

    // Add line break if not the last line and not part of a list
    if (index < lines.length - 1 && !inUnorderedList && !inOrderedList && line) {
      html += '<br>';
    }
  });

  // Close any open lists
  if (inUnorderedList) html += '</ul>';
  if (inOrderedList) html += '</ol>';

  return html;
}

// Function to parse inline markdown (bold, italics)
function parseInlineMarkdown(text) {
  let html = text;
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>'); // Bold + Italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');           // Bold
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');              // Italics
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');                // Italics with underscore
  return html;
}

function displayPopup(summary) {
  console.log('Displaying summary:', summary);

  let popup = document.getElementById('ai-summarizer-popup');
  let content = document.getElementById('ai-summarizer-content');
  let closeButton = document.getElementById('ai-summarizer-close-button');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'ai-summarizer-popup';
    popup.classList.add('summary-popup');

    closeButton = document.createElement('span');
    closeButton.id = 'ai-summarizer-close-button';
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '×';

    content = document.createElement('div');
    content.id = 'ai-summarizer-content';
    content.classList.add('popup-content');

    popup.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);

    closeButton.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }

  content.innerHTML = '';
  popup.style.display = 'block';

  chrome.storage.sync.get('selectedTheme', (data) => {
    const theme = data.selectedTheme || 'light';
    popup.setAttribute('data-theme', theme);
  });

  if (summary.startsWith('Error:') || summary === 'Summarizing, please wait...') {
    content.innerText = summary;
    return;
  }

  // Split summary into lines for structural formatting
  const lines = summary.split('\n').filter(line => line.trim());
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex < lines.length) {
      const line = lines[lineIndex];
      let lineHtml = '';

      // Handle bullet points or numbered lists
      if (line.match(/^[-*]\s+(.+)/)) {
        lineHtml = `<li>${parseInlineMarkdown(line.replace(/^[-*]\s+(.+)/, '$1'))}</li>`;
        if (lineIndex === 0 || !lines[lineIndex - 1].match(/^[-*]\s+(.+)/)) {
          lineHtml = '<ul>' + lineHtml;
        }
        if (lineIndex === lines.length - 1 || !lines[lineIndex + 1].match(/^[-*]\s+(.+)/)) {
          lineHtml += '</ul>';
        }
      } else if (line.match(/^\d+\.\s+(.+)/)) {
        lineHtml = `<li>${parseInlineMarkdown(line.replace(/^\d+\.\s+(.+)/, '$1'))}</li>`;
        if (lineIndex === 0 || !lines[lineIndex - 1].match(/^\d+\.\s+(.+)/)) {
          lineHtml = '<ol>' + lineHtml;
        }
        if (lineIndex === lines.length - 1 || !lines[lineIndex + 1].match(/^\d+\.\s+(.+)/)) {
          lineHtml += '</ol>';
        }
      } else {
        lineHtml = `<p>${parseInlineMarkdown(line)}</p>`;
      }

      content.innerHTML += lineHtml;
      lineIndex++;
      content.scrollTop = content.scrollHeight;
      setTimeout(typeLine, 200); // 200ms delay per line (adjust as needed)
    }
  }

  typeLine();
}