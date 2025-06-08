const generateButton = document.getElementById("generateButton");

let selectedPassword = "";

generateButton.addEventListener("click", function () {
    let passwordLengthInput = document.getElementById("passwordLength");
    let passwordLength = passwordLengthInput.value;

    if (passwordLength < 8) {
        passwordLength = 8;
        passwordLengthInput.value = 8;
    }
    if (passwordLength > 32) {
        passwordLength = 32;
        passwordLengthInput.value = 32;
    }

    let nrPasswordsInput = document.getElementById("nrPasswords");
    let nrPasswords = nrPasswordsInput.value;

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

    function getRandomChar(str) {
        return str[Math.floor(Math.random() * str.length)];
    }

    function shuffleString(str) {
        const arr = str.split("");
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join("");
    }

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
        passwordDiv.appendChild(copyButton);

        generatedPasswords.appendChild(passwordDiv);
    }
});
