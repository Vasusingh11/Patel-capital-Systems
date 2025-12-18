// Authentication utilities for Patel Capital System

const AUTH_STORAGE_KEY = 'PatelCapitalAuth';
const USERS_STORAGE_KEY = 'PatelCapitalUsers';

// Default admin credentials
const DEFAULT_ADMIN = {
  id: 'admin-001',
  email: 'admin@patel-capital.net',
  password: 'PatelPassword1234', // In production, this should be hashed
  role: 'admin',
  name: 'Patel Capital Admin',
  createdAt: new Date().toISOString()
};

// Initialize users in localStorage if not exists
export const initializeAuth = () => {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  if (!users) {
    const defaultUsers = [DEFAULT_ADMIN];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
};

// Get all users
export const getUsers = () => {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  return users ? JSON.parse(users) : [DEFAULT_ADMIN];
};

// Save users
const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Login function
export const login = (email, password) => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Don't store password in session
    const { password: _, ...userWithoutPassword } = user;
    const authData = {
      ...userWithoutPassword,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    return { success: true, user: authData };
  }
  
  return { success: false, error: 'Invalid email or password' };
};

// Logout function
export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// Get current user
export const getCurrentUser = () => {
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  return authData ? JSON.parse(authData) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

// Add new user (admin only)
export const addUser = (userData) => {
  if (!isAdmin()) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }
  
  const users = getUsers();
  
  // Check if email already exists
  if (users.some(u => u.email === userData.email)) {
    return { success: false, error: 'Email already exists' };
  }
  
  const newUser = {
    id: `user-${Date.now()}`,
    ...userData,
    createdAt: new Date().toISOString(),
    createdBy: getCurrentUser().id
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return { success: true, user: newUser };
};

// Update user
export const updateUser = (userId, updates) => {
  if (!isAdmin()) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'User not found' };
  }
  
  // Prevent removing admin role from default admin
  if (users[userIndex].id === 'admin-001' && updates.role !== 'admin') {
    return { success: false, error: 'Cannot modify default admin role' };
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  
  return { success: true, user: users[userIndex] };
};

// Delete user
export const deleteUser = (userId) => {
  if (!isAdmin()) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }
  
  // Prevent deleting default admin
  if (userId === 'admin-001') {
    return { success: false, error: 'Cannot delete default admin' };
  }
  
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length === users.length) {
    return { success: false, error: 'User not found' };
  }
  
  saveUsers(filteredUsers);
  return { success: true };
};

// Change password
export const changePassword = (oldPassword, newPassword) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const users = getUsers();
  const user = users.find(u => u.id === currentUser.id);
  
  if (!user || user.password !== oldPassword) {
    return { success: false, error: 'Incorrect password' };
  }
  
  user.password = newPassword;
  saveUsers(users);
  
  return { success: true };
};
