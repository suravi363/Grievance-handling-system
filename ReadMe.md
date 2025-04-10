# Grievance Handling System

A Django-based web application designed to manage grievances efficiently, with role-based dashboards for users, employees, and admins. This project allows users to submit grievances, employees to update their statuses, and admins to oversee all activities.

## Features

- **Role-Based Access**:
  - **Users**: Submit grievances and view their status.
  - **Employees**: Submit grievances and update statuses (Pending, In Progress, Resolved).
  - **Admins**: View all grievances across the system.
- **Grievance Management**: Categorize, title, and describe grievances with real-time status tracking.
- **Responsive UI**: Clean dashboards with filtering and stats for submitted, resolved, and in-progress grievances.
- **RESTful API**: Backend powered by Django REST Framework for seamless data handling.


## Prerequisites

- **Python 3.x**: Ensure Python is installed globally (`python --version`).
- **Git**: For cloning the repository (`git --version`).
- **Dependencies**: Django and Django REST Framework (installed globally).

## Setup Instructions

### 1. Clone the Repository
```
git clone https://github.com/Springboard-Internship-2024/Grievance-Handling-System_Feb_2025.git
cd Grievance-Handling-System_Feb_2025
git checkout suravi
```

### 2. Install Dependencies
Install required Python packages globally
```
pip install django djangorestframework
```

If pip isn’t recognized, use:
```
python -m pip install django djangorestframework
```

### 3. Apply Migrations
Set up the database (uses the included db.sqlite3):
```
python manage.py migrate
```

### 4. Run the Server
Start the Django development server:
```
python manage.py runserver
```
Access at http://localhost:8000/.

## Usage
### Default Users
- Admin: Username: admin, Password: admin123 (Dashboard: /admin-dashboard/)
- Employee: Username: employee1, Password: emp123 (Dashboard: /employee/)
- User: Username: user1, Password: user123 (Dashboard: /dashboard/)

### Features by Role
- Login: Visit http://localhost:8000/ and enter credentials.
- admin/admin123 → http://localhost:8000/admin-dashboard/
- employee1/emp123 → http://localhost:8000/employee/
- regular user → http://localhost:8000/dashboard/
  
**User Dashboard:**
- Submit grievances (e.g., Technical, Billing).
- View your grievances with status.

**Employee Dashboard:**
- Submit grievances.
- Update statuses (In Progress, Resolved) for your grievances.

**Admin Dashboard:**
- View all grievances system-wide.

## Follow me
[Linkedin](https://www.linkedin.com/in/suravi-s-thatha/)
