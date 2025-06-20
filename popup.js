document.addEventListener("DOMContentLoaded", () => {
    const generateButton = document.getElementById("generateButton");
    if (!generateButton) {
        console.warn("generateButton not found!");
        return;
    }

    let selectedPassword = "";

    // LFSR Setup
    function createLFSR(seed) {
        let lfsr = seed & 0xFFFF;

        return function next() {
            let lsb = lfsr & 1;
            lfsr >>= 1;
            if (lsb === 1) {
                lfsr ^= 0xB400; // Polynomial: x^16 + x^14 + x^13 + x^11 + 1
            }
            return lfsr / 0xFFFF;
        };
    }

    function getRandomSeed() {
        const array = new Uint16Array(1);
        window.crypto.getRandomValues(array);
        return array[0];
    }

    const lfsr = createLFSR(getRandomSeed());


    function getRandomChar(str) {
        return str[Math.floor(lfsr() * str.length)];
    }

    function shuffleString(str) {
        const arr = str.split("");
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(lfsr() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join("");
    }

    generateButton.addEventListener("click", function () {
        let passwordLengthInput = document.getElementById("passwordLength");
        let passwordLength = parseInt(passwordLengthInput.value);

        if (passwordLength < 8) {
            passwordLength = 8;
            passwordLengthInput.value = 8;
        }
        if (passwordLength > 32) {
            passwordLength = 32;
            passwordLengthInput.value = 32;
        }

        let nrPasswordsInput = document.getElementById("nrPasswords");
        let nrPasswords = parseInt(nrPasswordsInput.value);

        if (nrPasswords < 1) {
            nrPasswords = 1;
            nrPasswordsInput.value = 1;
        }
        if (nrPasswords > 5) {
            nrPasswords = 5;
            nrPasswordsInput.value = 5;
        }

        const useDigits = document.getElementById("useDigits").checked;
        const useSymbols = document.getElementById("useSymbols").checked;

        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        letters = shuffleString(letters);
        let digits = "0123456789";
        digits = shuffleString(digits);
        let symbols = "!@#$%^&*()_+=[]{}|;:,.<>?";
        symbols = shuffleString(symbols);

        const generatedPasswords = document.getElementById("generatedPasswords");
        generatedPasswords.innerHTML = "";

        for (let i = 0; i < nrPasswords; i++) {
            let pass = "";
            let pool = letters;

            for (let j = 0; j < 2; j++) {
                pass += getRandomChar(letters);
            }

            if (useDigits) {
                pool += digits;
                for (let j = 0; j < 2; j++) {
                    pass += getRandomChar(digits);
                }
            }

            if (useSymbols) {
                pool += symbols;
                for (let j = 0; j < 2; j++) {
                    pass += getRandomChar(symbols);
                }
            }

            pool = shuffleString(pool);

            while (pass.length < passwordLength) {
                pass += getRandomChar(pool);
            }

            pass = shuffleString(pass);

            const passwordDiv = document.createElement("div");
            passwordDiv.classList.add("password");
            passwordDiv.textContent = pass;

            const copyButton = document.createElement("button");
            copyButton.textContent = "Copy";
            copyButton.addEventListener("click", function () {
                navigator.clipboard.writeText(pass).then(() => {
                    selectedPassword = pass;

                    copyButton.textContent = "Copied!";
                    setTimeout(() => {
                        copyButton.textContent = "Copy";
                    }, 2000);

                    const saveButtonContainer = document.getElementById("saveButtonContainer");
                    saveButtonContainer.innerHTML = "";
                    const saveButton = document.createElement("button");
                    saveButton.textContent = "Save Password";
                    saveButton.addEventListener("click", () => {
                        chrome.runtime.sendMessage({ action: "getActiveTabUrl" }, (urlResponse) => {
                            const urlObj = new URL(urlResponse.url);
                            const website = urlObj.hostname;

                            chrome.runtime.sendMessage({ action: "getUsername" }, (usernameResponse) => {
                                const username = usernameResponse.username;

                                chrome.runtime.sendMessage({
                                    action: "savePassword",
                                    data: {
                                        website: website,
                                        username: username,
                                        password: selectedPassword
                                    }
                                }, (response) => {
                                    if (response.success) {
                                        saveButton.textContent = "Saved!";
                                        saveButton.disabled = true;
                                    }
                                });

                                chrome.runtime.sendMessage({ action: "fillPassword", password: selectedPassword });
                            });
                        });
                    });

                    saveButtonContainer.appendChild(saveButton);
                });
            });

            passwordDiv.appendChild(copyButton);
            generatedPasswords.appendChild(passwordDiv);
        }
    });
});
