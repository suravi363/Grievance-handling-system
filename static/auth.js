document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken'));
        return cookie ? cookie.split('=')[1] : null;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            alert("CSRF token not found. Please refresh the page.");
            return;
        }

        const response = await fetch('/users/login/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            alert("Login failed: Server returned invalid response.");
            console.error("Response parsing error:", e);
            return;
        }

        if (response.ok) {
            alert("Login successful!");
            localStorage.setItem("userEmail", username);
            if (result.role === 'admin') {
                window.location.href = "/admin-dashboard/";
            } else if (result.role === 'employee') {
                window.location.href = "/employee/";
            } else {
                window.location.href = "/dashboard/";
            }
        } else {
            alert("Login failed: " + (result.message || "Unknown error"));
            console.error("Login error:", result);
        }
    });
});