chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTabUrl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            console.log("Active tab URL (background.js):", activeTab.url);
            sendResponse({ url: activeTab.url });
        });
        return true;
    }

    if (message.action === "getUsername") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                    function: () => {
                        console.log("Executing injected script to find username!");
                        const possibleInputs = document.querySelectorAll(
                            // prefers email over username
                            "input[type='email'], input[name*='email'], input[name*='user'],input[id*='email'], input[id*='user']"
                        );

                        let username = "";
                        for (const input of possibleInputs) {
                            if (input.value.trim() !== "") {
                                username = input.value.trim();
                                break;
                            }
                        }

                        return username;
                    }
                },
                (results) => {
                    const username = results?.[0]?.result || "";
                    sendResponse({ username: username });
                }
            );
        });
        return true;
    }

    if (message.action === "savePassword") {
        const { website, username, password } = message.data;
        const date = new Date();
        const fileName = date.toISOString().replace(/[:.]/g, "-");
        const fileContent = `${website} - ${username} - ${password}`;

        chrome.storage.local.set({ [fileName]: fileContent }, () => {
            console.log("Saved:", { [fileName]: fileContent });
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === "getAllPasswords") {
        chrome.storage.local.get(null, (data) => {
            sendResponse({ data: data || {} });
        });
        return true;
    }

});