# 🔐 Authentication System Guide

## Overview
The Patel Capital Investment Management System now includes a complete authentication system with role-based access control.

## Default Credentials

### Administrator Account
- **Email**: `admin@patel-capital.net`
- **Password**: `PatelPassword1234`
- **Role**: Administrator

**⚠️ IMPORTANT**: Change this password after first login in a production environment!

## User Roles

### Administrator
Admins have full access to all features:
- ✅ View and manage all companies
- ✅ Add new companies
- ✅ View and manage all investors
- ✅ Generate statements
- ✅ **Create new users**
- ✅ **Manage existing users**
- ✅ **Delete users** (except default admin)
- ✅ Import/Export data

### Regular User
Users have limited access:
- ✅ View companies
- ✅ View and manage investors
- ✅ Generate statements
- ✅ Import/Export data
- ❌ Cannot create new users
- ❌ Cannot add new companies
- ❌ Cannot access User Management section

## Features

### 1. Secure Login
- Email and password authentication
- Session persistence in localStorage
- Automatic redirect to login when logged out

### 2. User Management (Admin Only)
Access via the "Users" tab in the navigation bar.

**Add New Users:**
1. Click "Add User" button
2. Enter user details:
   - Full Name
   - Email Address
   - Password
   - Role (User or Administrator)
3. Click "Add User"

**Edit Users:**
1. Click the edit (✏️) button next to any user
2. Modify user details
3. Leave password blank to keep current password
4. Click "Update User"

**Delete Users:**
1. Click the delete (🗑️) button next to any user
2. Confirm deletion
3. Note: Default admin cannot be deleted

### 3. Company Management (Admin Only)
Admins can add new investment companies:

1. Go to "Companies" tab
2. Click "Add Company" button
3. Enter company name and default interest rate
4. Click "Add Company"

### 4. Session Management
- Sessions persist across browser refreshes
- Click "Logout" button to end session
- User info displayed in header

## Security Features

### Current Implementation
- ✅ Password-protected access
- ✅ Role-based permissions
- ✅ Session management
- ✅ Protected admin routes
- ✅ User activity tracking

### Production Recommendations
1. **Password Hashing**: Implement bcrypt or similar for password encryption
2. **HTTPS Only**: Ensure all traffic is encrypted
3. **Strong Passwords**: Enforce password complexity requirements
4. **Session Timeouts**: Implement automatic logout after inactivity
5. **Two-Factor Authentication**: Consider adding 2FA for admin accounts
6. **Audit Logging**: Track all user actions

## Data Storage

### LocalStorage Structure
```javascript
// Authentication Data
PatelCapitalAuth: {
  id: "user-id",
  email: "user@example.com",
  name: "User Name",
  role: "admin" | "user",
  loginTime: "ISO-8601-timestamp"
}

// Users Database
PatelCapitalUsers: [
  {
    id: "user-id",
    email: "user@example.com",
    password: "password", // Should be hashed in production
    name: "User Name",
    role: "admin" | "user",
    createdAt: "ISO-8601-timestamp",
    createdBy: "creator-user-id"
  }
]
```

## Quick Start

### 1. Start the Application
```bash
npm start
```

### 2. Login with Default Admin
- Email: `admin@patel-capital.net`
- Password: `PatelPassword1234`

### 3. Create Your First User
1. Click "Users" tab
2. Click "Add User"
3. Fill in details
4. Select role
5. Click "Add User"

### 4. Add a New Company (Admin Only)
1. Go to "Companies" tab
2. Click "Add Company"
3. Enter company name and rate
4. Click "Add Company"

## Troubleshooting

### Can't Login
- Verify email and password are correct
- Check browser console for errors
- Clear browser cache and try again
- Ensure JavaScript is enabled

### Forgot Password
- Contact administrator to reset password
- Admin can edit user and set new password

### Lost Admin Access
- Default admin credentials are hardcoded
- Login with: admin@patel-capital.net / PatelPassword1234
- Create new admin user if needed

## Best Practices

### For Administrators
1. ✅ Change default admin password immediately
2. ✅ Create separate admin accounts for each administrator
3. ✅ Regularly review user list
4. ✅ Remove inactive users
5. ✅ Use strong, unique passwords
6. ✅ Export data regularly as backup

### For Users
1. ✅ Use strong passwords
2. ✅ Logout when finished
3. ✅ Don't share credentials
4. ✅ Report suspicious activity
5. ✅ Export important data regularly

---

**🔒 Security is a continuous process. Regularly review and update security measures.**
