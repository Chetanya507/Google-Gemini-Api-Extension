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

function parseMarkdown(text) {
  let lines = text.split('\n');
  let html = '';
  let inUnorderedList = false;
  let inOrderedList = false;

  lines.forEach((line, index) => {
    line = line.trim();
    if (line.match(/^[-*]\s+(.+)/)) {
      if (!inUnorderedList) {
        if (inOrderedList) html += '</ol>';
        html += '<ul>';
        inUnorderedList = true;
      }
      const content = line.replace(/^[-*]\s+(.+)/, '$1');
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    } else if (line.match(/^\d+\.\s+(.+)/)) {
      if (!inOrderedList) {
        if (inUnorderedList) html += '</ul>';
        html += '<ol>';
        inOrderedList = true;
      }
      const content = line.replace(/^\d+\.\s+(.+)/, '$1');
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    } else {
      if (inUnorderedList) html += '</ul>';
      if (inOrderedList) html += '</ol>';
      if (line) html += `<p>${parseInlineMarkdown(line)}</p>`;
      inUnorderedList = false;
      inOrderedList = false;
    }
    if (index < lines.length - 1 && !inUnorderedList && !inOrderedList && line) {
      html += '<br>';
    }
  });

  if (inUnorderedList) html += '</ul>';
  if (inOrderedList) html += '</ol>';
  return html;
}

function parseInlineMarkdown(text) {
  let html = text;
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');
  return html;
}

let animationTimeout = null;

function displayPopup(summary) {
  console.log('Displaying summary:', summary);

  let popup = document.getElementById('ai-summarizer-popup');
  let content = document.getElementById('ai-summarizer-content');
  let closeButton = document.getElementById('ai-summarizer-close-button');
  let stopButton = document.getElementById('ai-summarizer-stop-button');
  let regenerateButton = document.getElementById('ai-summarizer-regenerate-button');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'ai-summarizer-popup';
    popup.classList.add('summary-popup');

    closeButton = document.createElement('span');
    closeButton.id = 'ai-summarizer-close-button';
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '×';

    stopButton = document.createElement('button');
    stopButton.id = 'ai-summarizer-stop-button';
    stopButton.classList.add('control-button');
    stopButton.innerText = 'Stop';

    regenerateButton = document.createElement('button');
    regenerateButton.id = 'ai-summarizer-regenerate-button';
    regenerateButton.classList.add('control-button');
    regenerateButton.innerText = 'Regenerate';

    content = document.createElement('div');
    content.id = 'ai-summarizer-content';
    content.classList.add('popup-content');

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(regenerateButton);

    popup.appendChild(closeButton);
    popup.appendChild(buttonContainer);
    popup.appendChild(content);
    document.body.appendChild(popup);

    closeButton.addEventListener('click', () => {
      if (animationTimeout) clearTimeout(animationTimeout);
      popup.style.display = 'none';
    });

    stopButton.addEventListener('click', () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
        stopButton.style.opacity = '0.5';
        stopButton.disabled = true;
      }
    });

    regenerateButton.addEventListener('click', () => {
      if (animationTimeout) clearTimeout(animationTimeout);
      content.innerHTML = '';
      stopButton.style.opacity = '1';
      stopButton.disabled = false;
      regenerateButton.style.opacity = '0.5';
      regenerateButton.disabled = true;
      displayPopup('Summarizing, please wait...');
      const pageUrl = window.location.href;
      chrome.runtime.sendMessage({ action: 'summarize', url: pageUrl }, (response) => {
        regenerateButton.style.opacity = '1';
        regenerateButton.disabled = false;
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          displayPopup(`Error: ${chrome.runtime.lastError.message}`);
        }
      });
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
    stopButton.style.display = 'none';
    regenerateButton.style.display = summary.startsWith('Error:') ? 'inline-block' : 'none';
    return;
  }

  stopButton.style.display = 'inline-block';
  stopButton.style.opacity = '1';
  stopButton.disabled = false;
  regenerateButton.style.display = 'inline-block';
  regenerateButton.style.opacity = '1';
  regenerateButton.disabled = false;

  const lines = summary.split('\n').filter(line => line.trim());
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex < lines.length && animationTimeout !== null) {
      const line = lines[lineIndex];
      let lineHtml = '';
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
      animationTimeout = setTimeout(typeLine, 200);
    }
  }

  if (animationTimeout) clearTimeout(animationTimeout);
  animationTimeout = setTimeout(typeLine, 200);
}