document.addEventListener("DOMContentLoaded", () => {
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
    const sidebarLinks = document.querySelectorAll(".sidebar ul li a");

    console.log("User dashboard loaded");

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken'));
        return cookie ? cookie.split('=')[1] : null;
    }

    // Sidebar handlers
    sidebarLinks.forEach(link => {
        console.log("Binding link:", link.textContent);
        link.addEventListener("click", (event) => {
            const text = link.textContent.trim();
            console.log("Sidebar clicked:", text);
            if (text === "My Grievances") {
                event.preventDefault();
                console.log("Fetching grievances for My Grievances");
                fetchGrievances();
            } else if (text === "Settings") {
                event.preventDefault();
                alert("Settings page coming soon!");
            } else if (text === "Home") {
                event.preventDefault();
            }
        });
    });

    if (logoutButton) {
        console.log("Logout button found");
        logoutButton.addEventListener("click", async (event) => {
            event.preventDefault();
            console.log("Logout clicked");
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                alert("CSRF token not found.");
                return;
            }
            try {
                const response = await fetch('/users/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'include'
                });
                if (response.ok) {
                    console.log("Logout successful");
                    alert("Logged out successfully!");
                    localStorage.removeItem("userEmail");
                    window.location.href = "/";
                } else {
                    console.error("Logout failed:", response.status);
                    alert("Logout failed.");
                }
            } catch (error) {
                console.error("Logout error:", error);
                alert("Logout error: " + error.message);
            }
        });
    } else {
        console.error("Logout button not found");
    }

    fetch('/grievances/list/', { method: 'GET', credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                alert("User not logged in. Please log in first.");
                window.location.href = "/";
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                userName.textContent = data[0]?.user__username || localStorage.getItem("userEmail") || "User";
                fetchGrievances();
            }
        })
        .catch(error => console.error("Initial fetch error:", error));

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
            alert("CSRF token not found.");
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
            console.log("Grievance submitted:", result);
            alert("Grievance submitted successfully!");
            issueType.value = "";
            grievanceTitle.value = "";
            grievanceDescription.value = "";
            fetchGrievances(); // Refresh immediately
        } else {
            console.error("Submit error:", result.message);
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

    async function fetchGrievances() {
        try {
            const response = await fetch('/grievances/list/', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error("Failed to fetch grievances: " + response.statusText);
            const grievances = await response.json();
            console.log("Fetched grievances:", grievances);
            grievanceList.innerHTML = "";
            let submitted = 0, resolved = 0, inProgress = 0;

            grievances.forEach(grievance => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${grievance.category}</strong> - ${grievance.title}: ${grievance.description} 
                    <br> <small>Status: ${grievance.status}</small>
                    ${grievance.status === 'Resolved' ? `<br><a href="/feedback/?grievance_id=${grievance.id}">Provide Feedback</a>` : ''}
                `;
                grievanceList.appendChild(li);

                if (grievance.status === "Pending") submitted++;
                else if (grievance.status === "Resolved") resolved++;
                else if (grievance.status === "In Progress") inProgress++;
            });

            submittedCount.textContent = submitted;
            resolvedCount.textContent = resolved;
            closedCount.textContent = inProgress;
        } catch (error) {
            console.error("Fetch grievances error:", error);
            alert("Error fetching grievances: " + error.message);
        }
    }
});