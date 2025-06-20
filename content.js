chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getUsername") {
        const possibleInputs = document.querySelectorAll(
            "input[type='email'], input[name*='email'], input[name*='user'], input[id*='email'], input[id*='user']"
        );

        let username = "";
        for (const input of possibleInputs) {
            if (input.value.trim() !== "") {
                username = input.value.trim();
                break;
            }
        }

        sendResponse({ username });
        return true;
    }

    if (message.action === "fillPassword") {
        const passInput = document.querySelector("input[type='password']");
        if (passInput) {
            passInput.value = message.password;
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        sendResponse();
    }
});

(function () {
    function createPasswordPrompt() {
        if (document.getElementById("pwgen-prompt")) return;
        const prompt = document.createElement("div");
        prompt.id = "pwgen-prompt";
        prompt.style.position = "fixed";
        prompt.style.top = "20px";
        prompt.style.right = "20px";
        prompt.style.zIndex = "999999";
        prompt.style.background = "gold";
        prompt.style.padding = "10px";
        prompt.style.color = "black";
        prompt.innerHTML = `
            <div>
                <span>Generate a secure password?</span><br><br>
                <button id="pwgen-open">Open Generator</button>
                <button id="pwgen-close">Close</button>
            </div>
        `;
        document.body.appendChild(prompt);

        document.getElementById("pwgen-open").onclick = () => {
            chrome.runtime.sendMessage({ action: "open_popup" });
            prompt.remove();
        };
        document.getElementById("pwgen-close").onclick = () => {
            prompt.remove();
        };
    }

    function isSignupPage() {
        const url = window.location.href.toLowerCase();
        const urlKeywords = ['signup', 'sign-up', 'sign_up', 'join', 'create'];
        return urlKeywords.some(keyword => url.includes(keyword));
    }

    function urlChanged() {
        // Remove old prompt if present
        const oldPrompt = document.getElementById("pwgen-prompt");
        if (oldPrompt) oldPrompt.remove();

        if (isSignupPage()) {
            createPasswordPrompt();
        }
    }

    // Initial check
    urlChanged();

    // Listen for popstate (back/forward)
    window.addEventListener('popstate', urlChanged);

    // Patch pushState and replaceState to detect SPA navigation
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;
    history.pushState = function () {
        origPushState.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
    };
    history.replaceState = function () {
        origReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
    };
    window.addEventListener('locationchange', urlChanged);

    // Fallback: polling for URL changes
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            urlChanged();
        }
    }, 500);
})();