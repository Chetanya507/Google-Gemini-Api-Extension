// options.js

document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const selectedTheme = document.getElementById('themeSelect').value;
  const customPrompt = document.getElementById('promptInput').value.trim();
  const maxTokens = parseInt(document.getElementById('maxTokens').value) || 256;
  const temperature = parseFloat(document.getElementById('temperature').value) || 0.7;

  if (apiKey) {
    chrome.storage.sync.set(
      {
        geminiApiKey: apiKey,
        selectedTheme: selectedTheme,
        customPrompt: customPrompt,
        maxTokens: maxTokens,
        temperature: temperature,
      },
      () => {
        alert('Settings saved successfully!');
        console.log('Settings saved:', {
          apiKey,
          selectedTheme,
          customPrompt,
          maxTokens,
          temperature,
        });
      }
    );
  } else {
    alert('Please enter a valid API key.');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(
    ['geminiApiKey', 'selectedTheme', 'customPrompt', 'maxTokens', 'temperature'],
    (data) => {
      if (data.geminiApiKey) {
        document.getElementById('apiKey').value = data.geminiApiKey;
        console.log('Loaded API key.');
      }
      if (data.selectedTheme) {
        document.getElementById('themeSelect').value = data.selectedTheme;
        console.log('Loaded selected theme.');
      }
      if (data.customPrompt) {
        document.getElementById('promptInput').value = data.customPrompt;
        console.log('Loaded custom prompt.');
      }
      if (data.maxTokens) {
        document.getElementById('maxTokens').value = data.maxTokens;
        console.log('Loaded max output tokens.');
      }
      if (data.temperature) {
        document.getElementById('temperature').value = data.temperature;
        console.log('Loaded temperature.');
      }
    }
  );

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
