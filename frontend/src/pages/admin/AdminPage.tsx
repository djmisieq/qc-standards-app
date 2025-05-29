import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect non-admin users
    if (user && !user.is_admin) {
      navigate('/');
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await axios.get(`${apiUrl}/users`);
        setUsers(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      await axios.put(`${apiUrl}/users/${userId}`, {
        is_admin: !currentStatus
      });

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_admin: !currentStatus } 
            : user
        )
      );
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage users and system settings"
      />

      {error && <Alert type="error" message={error} className="mb-4" />}

      <Card>
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="hidden py-2 px-4 text-left sm:table-cell">ID</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Admin</th>
                <th className="hidden py-2 px-4 text-left md:table-cell">Created</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="hidden py-2 px-4 sm:table-cell">{user.id}</td>
                  <td className="py-2 px-4">{user.name}</td>
                  <td className="py-2 px-4">{user.email}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.is_admin ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="hidden py-2 px-4 md:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-4">
                    <Button
                      size="small"
                      variant={user.is_admin ? "outlined" : "filled"}
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold">{users.filter(u => u.is_admin).length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Templates</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Checklists</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">System Maintenance</h2>
          <div className="space-y-4">
            <Button variant="outlined" className="w-full">
              Export Database Backup
            </Button>
            <Button variant="outlined" className="w-full">
              Synchronize Offline Data
            </Button>
            <Button variant="outlined" className="w-full">
              Clear Cache
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
