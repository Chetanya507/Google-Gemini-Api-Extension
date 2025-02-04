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
