// options.js (Updated for Security & Icon Addition)

document.addEventListener('DOMContentLoaded', async () => {
  const iconElement = document.getElementById('extensionIcon');
  iconElement.src = chrome.runtime.getURL('icon.png'); // Load extension icon

  try {
    const data = await chrome.storage.sync.get([
      'geminiApiKey', 'selectedTheme', 'customPrompt', 'maxTokens', 'temperature'
    ]);
    
    if (data.geminiApiKey) {
      document.getElementById('apiKey').value = await decryptData(data.geminiApiKey);
    }
    document.getElementById('themeSelect').value = data.selectedTheme || 'light';
    document.getElementById('promptInput').value = data.customPrompt || '';
    document.getElementById('maxTokens').value = data.maxTokens || 256;
    document.getElementById('temperature').value = data.temperature || 0.7;
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  // Add Ripple Effect to Button
  document.querySelectorAll('.ripple').forEach((button) => {
    button.addEventListener('click', createRippleEffect);
  });
});

// Secure Save Function
document.getElementById('saveButton').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const selectedTheme = document.getElementById('themeSelect').value;
  const customPrompt = document.getElementById('promptInput').value.trim();
  const maxTokens = parseInt(document.getElementById('maxTokens').value) || 256;
  const temperature = parseFloat(document.getElementById('temperature').value) || 0.7;

  if (apiKey) {
    const encryptedKey = await encryptData(apiKey);
    await chrome.storage.sync.set({
      geminiApiKey: encryptedKey,
      selectedTheme,
      customPrompt,
      maxTokens,
      temperature,
    });
    alert('Settings saved securely!');
  } else {
    alert('Please enter a valid API key.');
  }
});

// Encryption Function
async function encryptData(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.stringify({ iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encryptedData)) });
}

// Decryption Function
async function decryptData(encryptedJson) {
  try {
    const { iv, encrypted } = JSON.parse(encryptedJson);
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(encrypted));
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return ''; // Prevent leaking sensitive data
  }
}

// Ripple Effect Function
function createRippleEffect(event) {
  const circle = document.createElement('span');
  circle.classList.add('ripple-effect');
  this.appendChild(circle);

  const diameter = Math.max(this.clientWidth, this.clientHeight);
  circle.style.width = circle.style.height = `${diameter}px`;

  const rect = this.getBoundingClientRect();
  circle.style.left = `${event.clientX - rect.left - diameter / 2}px`;
  circle.style.top = `${event.clientY - rect.top - diameter / 2}px`;

  circle.addEventListener('animationend', () => circle.remove());
}
