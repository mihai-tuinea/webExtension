document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchPasswords").addEventListener("input", search);

    chrome.runtime.sendMessage({ action: "getAllPasswords" }, (response) => {
        const passwordsList = document.getElementById("passwordsList");
        passwordsList.innerHTML = "";

        const passwords = response.data;
        if (Object.keys(passwords).length === 0) {
            passwordsList.textContent = "No saved passwords.";
            return;
        }


        // test code
        for (const [fileName, fileContent] of Object.entries(passwords)) {
            const entry = document.createElement("li");
            entry.classList.add("savedEntry");

            const [website, username, password] = fileContent.split(" - ");
            const websiteP = document.createElement("p");
            websiteP.textContent = website;
            entry.appendChild(websiteP);
            entry.dataset.website = website.toLowerCase();

            const usernameP = document.createElement("P");
            if (username === "")
                usernameP.textContent = "(no username)";
            else
                usernameP.textContent = username;
            entry.appendChild(usernameP);

            const passwordP = document.createElement("p");
            passwordP.textContent = password;
            entry.appendChild(passwordP)

            const buttonContainer = document.createElement("div");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                chrome.runtime.sendMessage(
                    { action: "deletePassword", fileName: fileName },
                    (response) => {
                        if (response.success) {
                            entry.remove();
                        } else {
                            console.error("Failed to delete");
                        }
                    }
                );
            });
            buttonContainer.appendChild(deleteButton);
            entry.appendChild(buttonContainer);

            passwordsList.appendChild(entry);
        }
    });
});


function search() {
    const entries = document.querySelectorAll(".savedEntry");
    const input = document.getElementById("searchPasswords").value.toLowerCase();

    entries.forEach((entry) => {
        const website = entry.dataset.website || "";
        if (website.includes(input) || input === "") {
            entry.style.display = "";
        }
        else {
            entry.style.display = "none";
        }
    })
}