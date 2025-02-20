<div style="text-align: center;">
  <img src="https://github.com/user-attachments/assets/a95cd07f-9a2f-4520-b183-dfa7b7eb0f1d" alt="Logo-preview" width="500" height="450" />
  <img src="https://github.com/user-attachments/assets/034e7b1a-f27f-4437-b583-bfadd9f93495" alt="icon" width="450" height="450" />
</div>

---

# AI Summarizer Dot Extension

This browser extension adds a fluorescent dot to web pages, which when clicked, summarizes the content of the current page using the Gemini API. Users can customize various aspects of the summarization through an intuitive settings page.

## Features

- **Fluorescent Dot**: A movable dot that triggers summarization.
- **Summarization**: Utilizes the Gemini API to summarize the content of the current web page.
- **Customizable Settings**: Options to customize the prompt, output tokens, temperature, and theme (light/dark).
- **Modern UI**: Attractive fonts and animations enhance user experience.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-repo/ai-summarizer-dot-extension.git
   ```

2. **Navigate to the Extension Folder**:

   ```bash
   cd ai-summarizer-dot-extension
   ```

3. **Load the Extension**:
   - Open `chrome://extensions/` in your browser.
   - Enable **Developer mode**.
   - Click **"Load unpacked"** and select the extension folder.

## Usage

1. **Activate the Extension**:
   - Click on the extension icon in the browser toolbar to open the settings page.
   - Enter your Gemini API key.
   - Customize the summarization settings as desired.

2. **Summarize a Web Page**:
   - Navigate to any web page.
   - Click the fluorescent dot to summarize the content of the current page.
   - A summary will be displayed in a popup.

## Settings

- **API Key**: Enter your Gemini API key.
- **Theme**: Choose between light and dark themes.
- **Custom Prompt**: (Optional) Provide a custom prompt for the summarization.
- **Max Output Tokens**: Adjust the maximum number of tokens in the output.
- **Temperature**: Set the temperature parameter for the summarization.

## File Structure

```
ai-summarizer-dot-extension/
├── background.js
├── content.js
├── options.html
├── options.js
├── styles.css
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── fonts/
│   ├── Poppins-Regular.woff2
│   ├── Poppins-Medium.woff2
│   └── Poppins-SemiBold.woff2
└── README.md
```

## Credits

This project was created and maintained by **Chetanya Singh**.

---

### Example Code and Configurations

#### `manifest.json`

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

#### `background.js`

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    console.log('Received summarize request');
    getSummary(request.url)
      .then((summary) => {
        console.log('Summary obtained:', summary);
        // Send the summary back to the content script
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
    return true; // Keep the message channel open for sendResponse
  }
});

async function getSummary(pageUrl) {
  console.log('Starting getSummary');
  const apiKey = await getApiKey();
  console.log('API Key:', apiKey);

  if (!apiKey) {
    throw new Error('API key not set. Please enter your API key in the extension settings.');
  }

  // Retrieve custom settings from storage
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(
      ['customPrompt'],
      (data) => {
        resolve(data);
      }
    );
  });

  const customPrompt = settings.customPrompt || `Please summarize the content of this URL: ${pageUrl}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: customPrompt }],
      },
    ],
  };

  console.log('Sending request to API:', endpoint);
  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error(`Failed to parse JSON: ${jsonError.message}`);
    }

    console.log('API Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      let summary;

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        summary = data.candidates[0].content.parts[0].text;
      } else if (data.contents && data.contents[0] && data.contents[0].parts && data.contents[0].parts[0]) {
        summary = data.contents[0].parts[0].text;
      }

      if (summary) {
        console.log('Summary received:', summary);
        return summary;
      } else {
        console.error('Could not extract summary from API response');
        throw new Error('Unexpected API response format.');
      }
    } else {
      console.error('API Error:', data.error || data);
      throw new Error(data.error?.message || 'API request failed');
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    throw new Error(`An error occurred: ${error.message}`);
  }
}

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('geminiApiKey', (data) => {
      console.log('Retrieved API Key:', data.geminiApiKey);
      resolve(data.geminiApiKey);
    });
  });
}
```

#### `content.js`

```javascript
// content.js

// Create the dot element
const dot = document.createElement('div');
dot.id = 'ai-summarizer-dot';
dot.classList.add('fluent-dot');
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
chrome.runtime
