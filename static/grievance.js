document.addEventListener("DOMContentLoaded", async () => {
    const grievanceForm = document.getElementById("grievanceForm");
    const issueType = document.getElementById("issueType");
    const grievanceTitle = document.getElementById("grievanceTitle");
    const grievanceDescription = document.getElementById("grievanceDescription");
    const grievanceList = document.getElementById("grievanceList");
    const filterInput = document.getElementById("filterInput");
    const submittedCount = document.getElementById("submittedCount");
    const resolvedCount = document.getElementById("resolvedCount");
    const closedCount = document.getElementById("closedCount");
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken'));
        return cookie ? cookie.split('=')[1] : null;
    }

    const checkLoginResponse = await fetch('/grievances/list/', {
        method: 'GET',
        credentials: 'include'
    });
    if (!checkLoginResponse.ok) {
        alert("User not logged in. Please log in first.");
        window.location.href = "/";
        return;
    }

    userName.textContent = localStorage.getItem("userEmail") || "User";

    grievanceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const category = issueType.value;
        const title = grievanceTitle.value.trim();
        const description = grievanceDescription.value.trim();

        if (!category || !title || !description) {
            alert("Please fill out all fields.");
            return;
        }

        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            alert("CSRF token not found. Please refresh the page or log in again.");
            return;
        }

        const response = await fetch('/grievances/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ category, description, title })
        });
        const result = await response.json();

        if (response.ok) {
            alert("Grievance submitted successfully!");
            issueType.value = "";
            grievanceTitle.value = "";
            grievanceDescription.value = "";
            fetchGrievances();
        } else {
            alert("Error: " + result.message);
        }
    });

    filterInput.addEventListener("input", () => {
        const filter = filterInput.value.toLowerCase();
        const items = grievanceList.getElementsByTagName("li");
        Array.from(items).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? "" : "none";
        });
    });

    logoutButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const csrfToken = getCsrfToken();
        const response = await fetch('/users/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include'
        });
        if (response.ok) {
            alert("Logged out successfully!");
            localStorage.removeItem("userEmail");
            window.location.href = "/";
        } else {
            alert("Logout failed.");
        }
    });

    async function fetchGrievances() {
        const response = await fetch('/grievances/list/', {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const grievances = await response.json();
            grievanceList.innerHTML = "";
            let submitted = 0, resolved = 0, inProgress = 0;

            grievances.forEach(grievance => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${grievance.category}</strong> - ${grievance.title}: ${grievance.description} <br> <small>Status: ${grievance.status}</small>`;
                grievanceList.appendChild(li);

                if (grievance.status === "Pending") submitted++;
                else if (grievance.status === "Resolved") resolved++;
                else if (grievance.status === "In Progress") inProgress++;
            });

            submittedCount.textContent = submitted;
            resolvedCount.textContent = resolved;
            closedCount.textContent = inProgress;
        } else {
            console.error("Failed to fetch grievances:", response.statusText);
        }
    }

    await fetchGrievances();
});