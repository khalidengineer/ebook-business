document.addEventListener('DOMContentLoaded', () => {
  const promptsTextArea = document.getElementById('prompts');
  const intervalInput = document.getElementById('interval');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusText = document.getElementById('statusText');
  const progressText = document.getElementById('progressText');
  const statusList = document.getElementById('statusList');
  const errorMsg = document.getElementById('errorMsg');
  const countdownText = document.getElementById('countdownText');

  let countdownTimer = null;

  // Load saved state
  chrome.storage.local.get(['promptsText', 'interval', 'isRunning', 'promptsArray', 'currentIndex', 'nextRunTime'], (result) => {
    if (result.promptsText) promptsTextArea.value = result.promptsText;
    if (result.interval) intervalInput.value = result.interval;
    updateUI(result.isRunning, result.promptsArray, result.currentIndex, result.nextRunTime);
  });

  // Listen for background state changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      chrome.storage.local.get(['isRunning', 'promptsArray', 'currentIndex', 'nextRunTime'], (result) => {
        updateUI(result.isRunning, result.promptsArray, result.currentIndex, result.nextRunTime);
      });
    }
  });

  startBtn.addEventListener('click', () => {
    errorMsg.style.display = 'none';
    const text = promptsTextArea.value.trim();
    if (!text) {
      errorMsg.textContent = 'Please enter at least one prompt.';
      errorMsg.style.display = 'block';
      return;
    }

    const interval = parseInt(intervalInput.value, 10);
    if (isNaN(interval) || interval < 1) {
      errorMsg.textContent = 'Interval must be at least 1 second.';
      errorMsg.style.display = 'block';
      return;
    }

    const promptsArray = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);

    chrome.storage.local.get(['currentIndex'], (res) => {
      // Start from where we left off, unless we finished all prompts
      let startIdx = res.currentIndex || 0;
      if (startIdx >= promptsArray.length) {
        startIdx = 0;
      }
      
      chrome.storage.local.set({
        promptsText: text,
        interval: interval,
        promptsArray: promptsArray,
        currentIndex: startIdx,
        isRunning: true,
        nextRunTime: 0
      }, () => {
        chrome.runtime.sendMessage({ action: 'START' });
      });
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.storage.local.set({ isRunning: false, nextRunTime: 0 }, () => {
      chrome.runtime.sendMessage({ action: 'STOP' });
    });
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isRunning'], (result) => {
      if (result.isRunning) {
        errorMsg.textContent = 'Please stop first to reset.';
        errorMsg.style.display = 'block';
        return;
      }
      errorMsg.style.display = 'none';
      
      // Clear the text area
      promptsTextArea.value = '';
      
      // Clear everything from storage so it starts fresh
      chrome.storage.local.set({ 
        currentIndex: 0, 
        nextRunTime: 0,
        promptsText: '',
        promptsArray: []
      });
    });
  });

  function updateUI(isRunning, promptsArray, currentIndex, nextRunTime) {
    if (isRunning) {
      startBtn.disabled = true;
      startBtn.style.opacity = '0.5';
      stopBtn.disabled = false;
      stopBtn.style.opacity = '1';
      resetBtn.disabled = true;
      resetBtn.style.opacity = '0.5';
      
      promptsTextArea.disabled = true;
      intervalInput.disabled = true;
      statusText.textContent = 'Running...';
      statusText.style.color = '#27ae60';
      
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        if (!nextRunTime) {
          countdownText.textContent = '';
          return;
        }
        const remaining = Math.ceil((nextRunTime - Date.now()) / 1000);
        if (remaining > 0) {
          countdownText.textContent = `(Next in ${remaining}s)`;
        } else {
          countdownText.textContent = '';
        }
      }, 1000);
    } else {
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      stopBtn.disabled = true;
      stopBtn.style.opacity = '0.5';
      resetBtn.disabled = false;
      resetBtn.style.opacity = '1';
      
      promptsTextArea.disabled = false;
      intervalInput.disabled = false;
      statusText.textContent = 'Idle';
      statusText.style.color = '#7f8c8d';
      countdownText.textContent = '';
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }

    if (promptsArray && promptsArray.length > 0) {
      const current = Math.min(currentIndex || 0, promptsArray.length);
      progressText.textContent = `${current}/${promptsArray.length}`;
      
      statusList.innerHTML = '';
      promptsArray.forEach((prompt, index) => {
        const li = document.createElement('li');
        const displayPrompt = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
        li.textContent = `${index + 1}. ${displayPrompt}`;
        
        if (index < (currentIndex || 0)) {
          li.className = 'done';
        } else if (index === (currentIndex || 0) && isRunning) {
          li.className = 'active';
          li.textContent += ' (Processing...)';
        } else {
          li.className = 'pending';
        }
        statusList.appendChild(li);
      });
    } else {
      progressText.textContent = '0/0';
      statusList.innerHTML = '';
    }
  }
});
