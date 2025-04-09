document.addEventListener("DOMContentLoaded", () => {
    const grievanceList = document.getElementById("grievanceList");
    const filterInput = document.getElementById("filterInput");
    const submittedCount = document.getElementById("submittedCount");
    const resolvedCount = document.getElementById("resolvedCount");
    const closedCount = document.getElementById("closedCount");
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");
    const downloadCsvButton = document.getElementById("downloadCsv");
    const filterForm = document.getElementById("filterForm");
    const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
    let chartInstance = null; // Store chart instance

    console.log("Admin dashboard loaded");

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
            if (text === "Grievances") {
                event.preventDefault();
                console.log("Fetching grievances for Grievances");
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
                userName.textContent = data[0]?.user__username || localStorage.getItem("userEmail") || "Admin";
                fetchGrievances();
            }
        })
        .catch(error => console.error("Initial fetch error:", error));

    filterInput.addEventListener("input", () => {
        const filter = filterInput.value.toLowerCase();
        const items = grievanceList.getElementsByTagName("li");
        Array.from(items).forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? "" : "none";
        });
    });

    downloadCsvButton.addEventListener("click", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const response = await fetch(`/grievances/export_csv/?${urlParams.toString()}`, { credentials: 'include' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'grievances.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    });

    filterForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const category = document.getElementById("grievanceType").value;
        const status = document.getElementById("status").value;

        const params = new URLSearchParams({ start_date: startDate, end_date: endDate, category, status }).toString();
        window.history.pushState({}, '', `/admin-dashboard/?${params}`);
        await fetchGrievances();
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
                    <br> <small>Status: ${grievance.status} | User: ${grievance.user__username}</small>
                `;
                grievanceList.appendChild(li);

                if (grievance.status === "Pending") submitted++;
                else if (grievance.status === "Resolved") resolved++;
                else if (grievance.status === "In Progress") inProgress++;
            });

            submittedCount.textContent = submitted;
            resolvedCount.textContent = resolved;
            closedCount.textContent = inProgress;

            const statusCounts = { Pending: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
            grievances.forEach(g => statusCounts[g.status]++);

            const ctx = document.getElementById('grievanceChart').getContext('2d');
            if (chartInstance) {
                chartInstance.destroy(); // Destroy previous chart
            }
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{
                        label: 'Grievance Status',
                        data: Object.values(statusCounts),
                        backgroundColor: ['#ffeb3b', '#2196f3', '#4caf50', '#9e9e9e']
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });

            const metricsResponse = await fetch('/grievances/efficiency_metrics/', { credentials: 'include' });
            const metrics = await metricsResponse.json();
            console.log(`Efficiency: ${metrics.efficiency}% (Resolved: ${metrics.resolved}, Total: ${metrics.total})`);
        } catch (error) {
            console.error("Fetch grievances error:", error);
            alert("Error fetching grievances: " + error.message);
        }
    }
});