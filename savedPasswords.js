document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({ action: "getAllPasswords" }, (response) => {
        const savedPasswordsContainer = document.getElementById("savedPasswords");
        savedPasswordsContainer.innerHTML = "";

        const passwords = response.data;
        if (Object.keys(passwords).length === 0) {
            savedPasswordsContainer.textContent = "No saved passwords.";
            return;
        }


        // test code
        for (const [fileName, fileContent] of Object.entries(passwords)) {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("saved-entry");

            const title = document.createElement("h3");
            title.textContent = fileName;
            entryDiv.appendChild(title);

            const content = document.createElement("p");
            content.textContent = fileContent;
            entryDiv.appendChild(content);

            savedPasswordsContainer.appendChild(entryDiv);
        }
    });
});
