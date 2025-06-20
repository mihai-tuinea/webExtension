// encryption functions

function encode(str) {
    return new TextEncoder().encode(str);
}

function decode(buffer) {
    return new TextDecoder().decode(buffer);
}

function toBase64(buffer) {
    return btoa(String.fromCharCode(...buffer));
}

function fromBase64(base64) {
    return new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
}

async function deriveKey(fileName) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encode(fileName),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encode("static-salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptPassword(password, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encode(password)
    );

    return {
        iv: toBase64(iv),
        ciphertext: toBase64(new Uint8Array(encrypted))
    };
}

async function decryptPassword(encryptedData, key) {
    const iv = fromBase64(encryptedData.iv);
    const ciphertext = fromBase64(encryptedData.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );

    return decode(decrypted);
}

// message listener

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTabUrl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            sendResponse({ url: activeTab.url });
        });
        return true;
    }

    if (message.action === "getUsername") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab || !tab.id) {
                sendResponse({ username: "" });
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: "getUsername" }, (response) => {
                sendResponse(response);
            });
        });

        return true;
    }


    if (message.action === "savePassword") {
        const { website, username, password } = message.data;
        const date = new Date();
        const fileName = date.toISOString().replace(/[:.]/g, "-");

        deriveKey(fileName).then((key) => {
            encryptPassword(password, key).then((encrypted) => {
                const encryptedJson = JSON.stringify(encrypted);
                const fileContent = `${website}\n${username}\n${encryptedJson}`;

                chrome.storage.local.set({ [fileName]: fileContent }, () => {
                    console.log("Encrypted and saved:", { [fileName]: fileContent });
                    sendResponse({ success: true });
                });
            }).catch((err) => {
                console.error("Encryption failed:", err);
                sendResponse({ success: false });
            });
        });

        return true;
    }

    if (message.action === "getAllPasswords") {
        chrome.storage.local.get(null, async (data) => {
            const result = {};

            for (const [fileName, content] of Object.entries(data)) {
                const [website, username, encryptedJson] = content.split("\n");
                try {
                    const encryptedData = JSON.parse(encryptedJson);
                    const key = await deriveKey(fileName);
                    const decryptedPassword = await decryptPassword(encryptedData, key);
                    result[fileName] = `${website} - ${username} - ${decryptedPassword}`;
                } catch (err) {
                    console.warn(`Failed to decrypt password for ${fileName}:`, err);
                    result[fileName] = `${website} - ${username} - (decryption failed)`;
                }
            }

            sendResponse({ data: result });
        });

        return true;
    }

    if (message.action === "deletePassword") {
        const fileName = message.fileName;
        chrome.storage.local.remove(fileName, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === "open_popup") {
        chrome.action.openPopup();
        sendResponse();
        return true;
    }

    if (message.action === "fillPassword") {
        const password = message.password;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab || !tab.id) {
                sendResponse({ password: "" });
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: "fillPassword", password: password }, (response) => {
                sendResponse(response);
            });
        });
        sendResponse();
        return true;
    }
});
