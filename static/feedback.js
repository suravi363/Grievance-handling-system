document.addEventListener("DOMContentLoaded", () => {
    const feedbackForm = document.getElementById("feedbackForm");
    const grievanceTitle = document.getElementById("grievanceTitle");
    const urlParams = new URLSearchParams(window.location.search);
    const grievanceId = urlParams.get('grievance_id');

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken'));
        return cookie ? cookie.split('=')[1] : null;
    }

    // Fetch grievance title
    fetch(`/grievances/list/`, { credentials: 'include' })
        .then(response => response.json())
        .then(grievances => {
            const grievance = grievances.find(g => g.id == grievanceId);
            grievanceTitle.textContent = grievance ? grievance.title : "Unknown Grievance";
        });

    feedbackForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const rating = document.getElementById("rating").value;
        const comment = document.getElementById("comment").value;
        const csrfToken = getCsrfToken();

        if (!csrfToken) {
            alert("CSRF token not found. Please refresh the page.");
            return;
        }

        const response = await fetch('/grievances/submit_feedback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ grievance_id: grievanceId, rating, comment })
        });
        const result = await response.json();

        if (response.ok) {
            alert("Feedback submitted successfully! A confirmation email has been sent.");
            window.location.href = "/dashboard/";
        } else {
            alert("Error: " + result.message);
        }
    });
});