import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Shield, User } from 'lucide-react';
import { getUsers, addUser, updateUser, deleteUser } from '../utils/auth';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setError('');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (editingUser) {
      const updates = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      if (formData.password) {
        updates.password = formData.password;
      }
      
      const result = updateUser(editingUser.id, updates);
      if (result.success) {
        loadUsers();
        setShowModal(false);
      } else {
        setError(result.error);
      }
    } else {
      if (!formData.password) {
        setError('Password is required for new users');
        return;
      }
      
      const result = addUser(formData);
      if (result.success) {
        loadUsers();
        setShowModal(false);
      } else {
        setError(result.error);
      }
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = deleteUser(userId);
      if (result.success) {
        loadUsers();
      } else {
        alert(result.error);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-2">Manage system users and permissions</p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-purple-600" />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      title="Edit User"
                    >
                      <Edit size={16} />
                    </button>
                    {user.id !== 'admin-001' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editingUser && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={editingUser?.id === 'admin-001'}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {editingUser?.id === 'admin-001' && (
                    <p className="text-xs text-gray-500 mt-1">Default admin role cannot be changed</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
