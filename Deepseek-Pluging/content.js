chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "EXECUTE_PROMPT") {
    executePrompt(message.prompt)
      .then(() => {
        sendResponse({ success: true });
        scheduleNextInContent(message.interval);
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.toString() });
        scheduleNextInContent(message.interval);
      });
    return true; 
  }
});

function scheduleNextInContent(intervalSeconds) {
  if (!intervalSeconds) return;
  // This timer runs inside the webpage, so it never goes to sleep!
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: "TIME_UP" });
  }, intervalSeconds * 1000);
}

async function executePrompt(promptText) {
  return new Promise((resolve, reject) => {
    const inputElement = document.getElementById('chat-input') 
                      || document.querySelector('textarea[placeholder*="Message"]') 
                      || document.querySelector('textarea');
    
    if (!inputElement) {
      console.error("DeepSeek Auto Prompter: Could not find input field.");
      reject("Input field not found");
      return;
    }

    if (inputElement.tagName.toLowerCase() === 'textarea') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, promptText);
      } else {
        inputElement.value = promptText;
      }
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      inputElement.textContent = promptText;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      let sendBtn = document.querySelector('[aria-label="Send"]') || document.querySelector('[aria-label*="send" i]');
      
      if (!sendBtn) {
         const svgs = document.querySelectorAll('svg');
         for (let i = svgs.length - 1; i >= 0; i--) {
           const svg = svgs[i];
           const btn = svg.closest('button, div[role="button"], div[class*="send"], div[class*="button"]');
           if (btn && btn.closest('form, div') && getComputedStyle(btn).display !== 'none') {
             sendBtn = btn;
             break;
           }
         }
      }

      if (sendBtn) {
        sendBtn.click();
        console.log("DeepSeek Auto Prompter: Prompt sent via button click.");
      } else {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        console.log("DeepSeek Auto Prompter: Simulated Enter keypress.");
      }
      
      resolve();
    }, 800); 
  });
}
