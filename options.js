// options.js (Updated with Improved Security and Icon Support)

document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey || apiKey.length < 20) { // Basic validation check
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
    } else {
      console.warn('No API key found in storage.');
    }
  });

  // Adding Extension Icon Support
  const icon = document.createElement('img');
  icon.src = 'icon48.png'; // Ensure this file exists in the extension folder
  icon.alt = 'Extension Icon';
  icon.style.width = '48px';
  icon.style.height = '48px';
  icon.style.display = 'block';
  icon.style.margin = '10px auto';
  document.body.prepend(icon);

  // Add Ripple Effect to Button
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
