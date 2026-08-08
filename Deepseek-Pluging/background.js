chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START') {
    startProcess();
  } else if (message.action === 'STOP') {
    stopProcess();
  } else if (message.action === 'TIME_UP') {
    // Triggered by content.js after the interval
    chrome.storage.local.get('isRunning', (res) => {
      if (res.isRunning) {
        processNextPrompt();
      }
    });
  }
});

function startProcess() {
  stopProcess(); // Clear existing
  
  chrome.storage.local.get(['promptsArray', 'currentIndex', 'isRunning'], (result) => {
    if (!result.isRunning || !result.promptsArray) return;
    
    if (result.currentIndex >= result.promptsArray.length) {
      chrome.storage.local.set({ isRunning: false, nextRunTime: 0 });
      return;
    }

    processNextPrompt(); 
  });
}

function stopProcess() {
  chrome.storage.local.set({ nextRunTime: 0 });
}

function processNextPrompt() {
  chrome.storage.local.get(['promptsArray', 'currentIndex', 'interval', 'isRunning'], async (result) => {
    if (!result.isRunning || result.currentIndex >= result.promptsArray.length) {
      stopProcess();
      chrome.storage.local.set({ isRunning: false, nextRunTime: 0 });
      return;
    }

    const currentPrompt = result.promptsArray[result.currentIndex];
    
    const tabs = await chrome.tabs.query({ url: "*://chat.deepseek.com/*" });
    
    if (tabs.length === 0) {
      console.log("No DeepSeek tab found. Stopping.");
      chrome.storage.local.set({ isRunning: false, nextRunTime: 0 });
      return;
    }

    const activeTabs = await chrome.tabs.query({ url: "*://chat.deepseek.com/*", active: true });
    const targetTab = activeTabs.length > 0 ? activeTabs[0] : tabs[0];

    chrome.tabs.sendMessage(targetTab.id, { 
      action: "EXECUTE_PROMPT", 
      prompt: currentPrompt,
      interval: result.interval
    }, (response) => {
      const nextIndex = result.currentIndex + 1;
      const nextRunTime = Date.now() + (result.interval * 1000);
      chrome.storage.local.set({ currentIndex: nextIndex, nextRunTime: nextRunTime });

      if (chrome.runtime.lastError) {
        console.error("Content script error:", chrome.runtime.lastError);
        injectContentScript(targetTab.id, currentPrompt, result.interval);
      }
    });
  });
}

async function injectContentScript(tabId, currentPrompt, interval) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { 
        action: "EXECUTE_PROMPT", 
        prompt: currentPrompt,
        interval: interval
      }, () => {
        chrome.storage.local.get(['currentIndex', 'interval'], (res) => {
          const nextIndex = res.currentIndex + 1;
          const nextRunTime = Date.now() + (res.interval * 1000);
          chrome.storage.local.set({ currentIndex: nextIndex, nextRunTime: nextRunTime });
        });
      });
    }, 500);
  } catch (err) {
    console.error("Failed to inject script:", err);
    chrome.storage.local.set({ isRunning: false, nextRunTime: 0 });
  }
}
