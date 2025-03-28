
---

# AI Summarizer Dot

![Extension Icon](icons/icon48.png)

**A Chrome extension that summarizes web pages using the Gemini API, featuring a sleek draggable dot and customizable settings.**

---

## Overview

**AI Summarizer Dot** is a powerful and user-friendly Chrome extension designed to provide quick summaries of web pages. With a single click on a glowing, draggable dot, users can generate concise summaries powered by the Gemini API from Google. The extension supports markdown formatting (bold, italics, lists), offers light/dark themes, and includes an options page for customization. Whether you're a student, researcher, or casual reader, this tool streamlines your browsing experience.

**Created by:** Chetanya Singh

---

## Features

- **Instant Summaries**: Click the fluorescent dot to summarize the current webpage.
- **Draggable Interface**: Move the dot anywhere on the page for convenience.
- **Markdown Support**: Renders bold, italics, bullet points, and numbered lists from API responses.
- **Customizable Settings**: Adjust API key, theme, and prompt via the options page.
- **Word-by-Word Animation**: Summaries appear dynamically for an engaging experience.
- **Light/Dark Themes**: Adapts to your preferred visual style.
- **Open Source**: Fully documented and customizable for developers.

---

## Installation

1. **Clone or Download**:
   - Clone this repository or download the ZIP file:
     ```bash
     git clone https://github.com/yourusername/ai-summarizer-dot.git
     ```
2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" (top-right toggle).
   - Click "Load unpacked" and select the folder containing the extension files.
3. **Set API Key**:
   - Click the extension icon, go to "Options," and enter your Gemini API key (get one from [Google's API Console](https://console.cloud.google.com/apis/)).
4. **Start Using**:
   - Visit any webpage, click the dot, and enjoy your summary!

---

## File Structure

```
ai-summarizer-dot/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── fonts/
│   ├── Poppins-Regular.woff2
│   ├── Poppins-Medium.woff2
│   └── Poppins-SemiBold.woff2
├── background.js
├── content.js
├── manifest.json
├── options.html
├── options.js
├── styles.css
└── README.md
```

---

## Code Breakdown

Below is a detailed explanation of each file and every significant line of code, making it easy for anyone to understand and modify the extension.

### `manifest.json`
The manifest file defines the extension’s metadata, permissions, and structure.

```json
{
  "manifest_version": 3,
  "name": "AI Summarizer Dot",
  "version": "2.1",
  "description": "Summarizes web pages using the Gemini API.",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "https://generativelanguage.googleapis.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "options_page": "options.html",
  "action": {
    "default_title": "AI Summarizer Settings",
    "default_icon": "icons/icon48.png"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- `"manifest_version": 3`: Uses Chrome’s Manifest V3 for modern extension standards.
- `"name"`, `"version"`, `"description"`: Basic metadata for the extension.
- `"permissions"`: 
  - `"activeTab"`: Access the current tab when the dot is clicked.
  - `"scripting"`: Inject scripts into pages.
  - `"storage"`: Store API key and settings.
- `"host_permissions"`: Allows API calls to Google’s Gemini endpoint.
- `"background"`: Defines `background.js` as the service worker for handling API requests.
- `"content_scripts"`: Runs `content.js` and applies `styles.css` on all URLs (`<all_urls>`).
- `"options_page"`: Links to `options.html` for settings.
- `"action"`: Sets the extension’s toolbar title and icon.
- `"icons"`: Provides icons in various sizes for display in Chrome.

---

### `background.js`
The background script handles API requests and communication.

```javascript
let cachedApiKey = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    console.log('Received summarize request');
    getSummary(request.url)
      .then((summary) => {
        console.log('Summary obtained:', summary);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'displaySummary',
          summary,
        });
        sendResponse({ status: 'success' });
      })
      .catch((error) => {
        console.error('Error obtaining summary:', error);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'displaySummary',
          summary: `Error: ${error.message}`,
        });
        sendResponse({ status: 'error' });
      });
    return true;
  }
});

async function getSummary(pageUrl) {
  console.log('Starting getSummary');
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not set. Please enter your API key in the extension settings.');
  }

  const settings = await chrome.storage.sync.get(['customPrompt']);
  const customPrompt = settings.customPrompt || `Please summarize the content of this URL: ${pageUrl}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: customPrompt }],
      },
    ],
  };

  console.log('Sending request to API:', endpoint);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) {
      throw new Error('Unexpected API response format.');
    }

    console.log('Summary received:', summary);
    return summary;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const data = await chrome.storage.sync.get('geminiApiKey');
  cachedApiKey = data.geminiApiKey;
  console.log('Retrieved API Key:', cachedApiKey);
  return cachedApiKey;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.geminiApiKey) {
    cachedApiKey = changes.geminiApiKey.newValue;
    console.log('API Key updated in cache:', cachedApiKey);
  }
});
```

- `let cachedApiKey = null`: Caches the API key to avoid repeated storage calls.
- `chrome.runtime.onMessage.addListener`: Listens for messages from `content.js`.
- `if (request.action === 'summarize')`: Checks if the message is a summary request.
- `getSummary(request.url)`: Calls the summary function with the page URL.
- `.then((summary) => ...)`: Sends the summary back to the content script.
- `.catch((error) => ...)`: Handles errors and sends them back.
- `return true`: Keeps the message channel open for async responses.
- `async function getSummary(pageUrl)`: Fetches the summary from the Gemini API.
- `const apiKey = await getApiKey()`: Gets the cached or stored API key.
- `if (!apiKey)`: Throws an error if no key is set.
- `const settings = await chrome.storage.sync.get(['customPrompt'])`: Retrieves the custom prompt.
- `const customPrompt = ...`: Uses the custom prompt or a default one with the URL.
- `const endpoint = ...`: Constructs the API URL with the key.
- `const requestBody = ...`: Prepares the JSON payload for the API.
- `const response = await fetch(...)`: Makes the POST request to the API.
- `if (!response.ok)`: Checks for HTTP errors and throws them.
- `const data = await response.json()`: Parses the API response.
- `const summary = data.candidates?.[0]?.content?.parts?.[0]?.text`: Extracts the summary text.
- `if (!summary)`: Throws an error if the response format is unexpected.
- `async function getApiKey()`: Retrieves or caches the API key.
- `chrome.storage.onChanged.addListener`: Updates the cached key if it changes.

---

### `content.js`
The content script manages the dot and popup display.

```javascript
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
        if (inOrderedList) {
          html += '</ol>';
          inOrderedList = false;
        }
        html += '<ul>';
        inUnorderedList = true;
      }
      const content = line.replace(/^[-*]\s+(.+)/, '$1');
      html += `<li>${parseInlineMarkdown(content)}</li>`;
    } else if (line.match(/^\d+\.\s+(.+)/)) {
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
    } else {
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

  const lines = summary.split('\n').filter(line => line.trim());
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex < lines.length) {
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
      setTimeout(typeLine, 200);
    }
  }

  typeLine();
}
```

- `const dot = document.createElement('div')`: Creates the dot element.
- `dot.id`, `dot.classList.add`: Sets its ID and CSS class.
- `dot.style.position = 'fixed'`: Positions it fixed on the page.
- `dot.style.right`, etc.: Places it in the bottom-right corner initially.
- `document.body.appendChild(dot)`: Adds the dot to the page.
- `let isDragging = false`: Tracks if the dot is being dragged.
- `dot.addEventListener('mousedown', ...)`: Starts dragging, records initial positions.
- `document.addEventListener('mousemove', ...)`: Updates dot position during drag.
- `document.addEventListener('mouseup', ...)`: Stops dragging.
- `dot.addEventListener('click', ...)`: Triggers summarization on click.
- `chrome.runtime.sendMessage`: Sends the URL to `background.js`.
- `chrome.runtime.onMessage.addListener`: Listens for the summary response.
- `function parseMarkdown(text)`: Converts markdown (lists, paragraphs) to HTML.
- `function parseInlineMarkdown(text)`: Handles inline styles (bold, italics).
- `function displayPopup(summary)`: Displays the summary in a popup.
- `if (!popup)`: Creates the popup if it doesn’t exist.
- `content.innerHTML = ''`: Clears previous content.
- `popup.style.display = 'block'`: Shows the popup.
- `chrome.storage.sync.get('selectedTheme', ...)`: Applies the selected theme.
- `if (summary.startsWith('Error:') ...)`: Displays plain text for errors.
- `const lines = summary.split('\n')`: Splits summary into lines.
- `function typeLine()`: Animates the summary line-by-line with formatting.

---

### `options.html`
The settings page for user customization.

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Summarizer Extension Settings</title>
  <style>
    /* Inline CSS for simplicity - see original for details */
  </style>
</head>
<body>
  <div class="container">
    <h1>Extension Settings</h1>
    <label for="apiKey">Gemini API Key:</label>
    <input type="text" id="apiKey" placeholder="Enter your API key">
    <label for="themeSelect">Choose Theme:</label>
    <select id="themeSelect">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <label for="promptInput">Custom Prompt:</label>
    <textarea id="promptInput" placeholder="Enter a custom prompt for the AI (optional)" rows="3"></textarea>
    <label for="maxTokens">Max Output Tokens:</label>
    <input type="number" id="maxTokens" value="256" min="1" max="1024">
    <label for="temperature">Temperature:</label>
    <input type="number" id="temperature" value="0.7" min="0" max="1" step="0.1">
    <button id="saveButton" class="ripple">Save Settings</button>
  </div>
  <script src="options.js"></script>
</body>
</html>
```

- `<!DOCTYPE html>`: Declares an HTML5 document.
- `<title>`: Sets the page title.
- `<style>`: Defines inline CSS (omitted here for brevity).
- `<div class="container">`: Wraps the settings form.
- `<h1>`: Displays the heading.
- `<label>` and `<input>`: Fields for API key, theme, prompt, tokens, and temperature.
- `<button id="saveButton">`: Saves the settings.
- `<script src="options.js">`: Links to the script.

---

### `options.js`
Handles saving and loading settings.

```javascript
document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey || apiKey.length < 20) {
    alert('Please enter a valid API key.');
    return;
  }
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    chrome.storage.sync.get(['geminiApiKey'], (data) => {
      if (data.geminiApiKey === apiKey) {
        alert('Settings saved successfully!');
        console.log('API Key stored successfully:', data.geminiApiKey);
      } else {
        alert('Failed to save API key. Please try again.');
        console.error('Storage mismatch:', data);
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['geminiApiKey'], (data) => {
    if (data.geminiApiKey) {
      document.getElementById('apiKey').value = data.geminiApiKey;
      console.log('Loaded API key:', data.geminiApiKey);
    }
  });
  const icon = document.createElement('img');
  icon.src = 'icon48.png';
  icon.alt = 'Extension Icon';
  icon.style.width = '48px';
  icon.style.height = '48px';
  icon.style.display = 'block';
  icon.style.margin = '10px auto';
  document.body.prepend(icon);
  const buttons = document.querySelectorAll('.ripple');
  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      circle.classList.add('ripple-effect');
      this.appendChild(circle);
      const diameter = Math.max(this.clientWidth, this.clientHeight);
      circle.style.width = circle.style.height = `${diameter}px`;
      const rect = this.getBoundingClientRect();
      circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
      circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
      circle.addEventListener('animationend', () => {
        circle.remove();
      });
    });
  });
});
```

- `document.getElementById('saveButton').addEventListener`: Listens for save button clicks.
- `const apiKey = ...`: Gets the API key input.
- `if (!apiKey || apiKey.length < 20)`: Validates the key.
- `chrome.storage.sync.set`: Saves the key.
- `chrome.storage.sync.get`: Verifies it was saved.
- `document.addEventListener('DOMContentLoaded', ...)`: Runs when the page loads.
- `chrome.storage.sync.get(['geminiApiKey'], ...)`: Loads the saved key.
- `const icon = ...`: Adds the extension icon to the page.
- `const buttons = ...`: Adds a ripple effect to the save button.

---

### `styles.css`
Styles the dot and popup (abridged for brevity).

```css
@font-face { /* Defines Poppins font */ }
.fluent-dot { /* Styles the dot with glow and rotation */ }
.summary-popup { /* Styles the popup with animation */ }
.popup-content { /* Formats the content area */ }
.close-button { /* Styles the close button */ }
.summary-popup[data-theme="light"] { /* Light theme styles */ }
.summary-popup[data-theme="dark"] { /* Dark theme styles */ }
.summary-popup ul, .summary-popup ol { /* List styling */ }
.summary-popup li { /* List item styling */ }
.summary-popup p { /* Paragraph styling */ }
```

- Defines the Poppins font and styles for the dot, popup, and themes.

---

## Credits

**Created by Chetanya Singh**  
A passionate developer bringing innovative tools to enhance your browsing experience.

---

## Contributing

Feel free to fork this repository, submit issues, or send pull requests. Contributions are welcome!

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---