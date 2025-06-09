chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTabUrl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            console.log("Active tab URL (background.js):", activeTab.url);
            sendResponse({ url: activeTab.url });
        });
        return true;
    }
});
