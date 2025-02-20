// contentScript.js

document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "displaySummary") {
            displaySummary(message.summary);
        }
    });
});

function displaySummary(summary) {
    let summaryPopup = document.createElement("div");
    summaryPopup.className = "summary-popup";
    summaryPopup.setAttribute("data-theme", "light");
    summaryPopup.innerHTML = `
        <span class="close-button">&times;</span>
        <div class="popup-content">${convertMarkdownToHTML(summary)}</div>
    `;

    document.body.appendChild(summaryPopup);

    document.querySelector(".close-button").addEventListener("click", () => {
        summaryPopup.remove();
    });
}

function convertMarkdownToHTML(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>") // Bold (**text**)
        .replace(/\*([^*]+)\*/g, "<i>$1</i>") // Italic (*text*)
        .replace(/\*\*\*([^*]+)\*\*\*/g, "<b><i>$1</i></b>") // Bold & Italic (***text***)
        .replace(/__(.*?)__/g, "<b>$1</b>") // Alternative bold (__text__)
        .replace(/_(.*?)_/g, "<i>$1</i>"); // Alternative italic (_text_)
}
