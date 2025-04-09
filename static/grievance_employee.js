document.addEventListener("DOMContentLoaded", () => {
    const grievanceList = document.getElementById("grievanceList");
    const filterInput = document.getElementById("filterInput");
    const submittedCount = document.getElementById("submittedCount");
    const resolvedCount = document.getElementById("resolvedCount");
    const closedCount = document.getElementById("closedCount");
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");
    const sidebarLinks = document.querySelectorAll(".sidebar ul li a");

    console.log("Employee dashboard loaded");
    console.log("Grievance list element:", grievanceList ? "Found" : "Not found");
    console.log("Filter input element:", filterInput ? "Found" : "Not found");

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken'));
        return cookie ? cookie.split('=')[1] : null;
    }

    // Check login status
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
                if (userName) {
                    userName.textContent = data[0]?.user__username || localStorage.getItem("userEmail") || "Employee";
                }
                fetchGrievances(); // Fetch grievances regardless of userName
            }
        })
        .catch(error => console.error("Initial fetch error:", error));

    // Sidebar handlers
    if (sidebarLinks.length > 0) {
        sidebarLinks.forEach(link => {
            console.log("Binding link:", link.textContent);
            link.addEventListener("click", (event) => {
                const text = link.textContent.trim();
                console.log("Sidebar clicked:", text);
                if (text === "Grievances") {
                    event.preventDefault();
                    console.log("Fetching grievances for Grievances");
                    fetchGrievances();
                } else if (text === "Settings") {
                    event.preventDefault();
                    alert("Settings page coming soon!");
                } else if (text === "Home") {
                    event.preventDefault();
                } else if (text === "Logout") {
                    event.preventDefault();
                    logoutUser();
                }
            });
        });
    } else {
        console.error("No sidebar links found");
    }

    // Logout function
    function logoutUser() {
        console.log("Logout clicked");
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            alert("CSRF token not found.");
            return;
        }
        fetch('/users/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                console.log("Logout successful");
                alert("Logged out successfully!");
                localStorage.removeItem("userEmail");
                window.location.href = "/";
            } else {
                console.error("Logout failed:", response.status);
                alert("Logout failed.");
            }
        })
        .catch(error => {
            console.error("Logout error:", error);
            alert("Logout error: " + error.message);
        });
    }

    if (logoutButton) {
        console.log("Logout button found");
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();
            logoutUser();
        });
    } else {
        console.error("Logout button not found");
    }

    // Filter input
    if (filterInput) {
        filterInput.addEventListener("input", () => {
            const filter = filterInput.value.toLowerCase();
            const items = grievanceList.getElementsByTagName("li");
            Array.from(items).forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(filter) ? "" : "none";
            });
        });
    } else {
        console.warn("filterInput not found; filtering disabled");
    }

    async function updateStatus(grievanceId, newStatus) {
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            alert("CSRF token not found. Please refresh the page or log in again.");
            return;
        }

        console.log(`Updating grievance ${grievanceId} to ${newStatus}`);
        try {
            const response = await fetch('/grievances/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ id: grievanceId, status: newStatus })
            });

            const result = await response.json();
            console.log("Server response:", result);

            if (response.ok) {
                alert("Status updated successfully!");
                fetchGrievances();
            } else {
                alert("Error: " + result.message);
                console.error(`Failed with status ${response.status}: ${result.message}`);
            }
        } catch (error) {
            alert("Network error: " + error.message);
            console.error("Update status error:", error);
        }
    }

    async function fetchGrievances() {
        try {
            const response = await fetch('/grievances/list/', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error("Failed to fetch grievances: " + response.statusText);
            }
            const grievances = await response.json();
            console.log("Fetched grievances:", grievances);

            if (!grievanceList) {
                console.error("grievanceList element not found");
                return;
            }

            grievanceList.innerHTML = "";
            let submitted = 0, resolved = 0, inProgress = 0;

            if (!grievances || grievances.length === 0) {
                console.log("No grievances to display");
                grievanceList.innerHTML = "<li>No grievances available.</li>";
                submittedCount.textContent = "0";
                resolvedCount.textContent = "0";
                closedCount.textContent = "0";
                return;
            }

            grievances.forEach(grievance => {
                console.log("Rendering grievance:", grievance.id, grievance.title);
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${grievance.category}</strong> - ${grievance.title}: ${grievance.description} 
                    <br> <small>Status: ${grievance.status} | User: ${grievance.user__username}</small>
                    <br>
                    <button class="grievance-button" onclick="window.updateStatus(${grievance.id}, 'In Progress')">In Progress</button>
                    <button class="grievance-button" onclick="window.updateStatus(${grievance.id}, 'Resolved')">Resolve</button>
                `;
                grievanceList.appendChild(li);

                if (grievance.status === "Pending") submitted++;
                else if (grievance.status === "Resolved") resolved++;
                else if (grievance.status === "In Progress") inProgress++;
            });

            if (submittedCount) submittedCount.textContent = submitted;
            if (resolvedCount) resolvedCount.textContent = resolved;
            if (closedCount) closedCount.textContent = inProgress;
        } catch (error) {
            console.error("Fetch grievances error:", error);
            if (grievanceList) {
                grievanceList.innerHTML = "<li>Error loading grievances.</li>";
            }
            if (submittedCount) submittedCount.textContent = "0";
            if (resolvedCount) resolvedCount.textContent = "0";
            if (closedCount) closedCount.textContent = "0";
            alert("Error fetching grievances: " + error.message);
        }
    }

    window.updateStatus = updateStatus;
    fetchGrievances(); // Initial fetch
});