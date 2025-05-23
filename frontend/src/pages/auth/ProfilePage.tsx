import React, { useState } from 'react';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Alert from '../../components/ui/Alert';

const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords if being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await axios.put(`${apiUrl}/users/me`, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
      });

      // Update token if needed
      if (response.data.token) {
        login(response.data.token);
      }

      setSuccess('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Your Profile"
        subtitle="Manage your account information"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            {success && <Alert type="success" message={success} className="mb-4" />}
            {error && <Alert type="error" message={error} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <TextField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Leave blank to keep your current password
                </p>

                <TextField
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Minimum 8 characters"
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-4 text-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-3xl mx-auto mb-4">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-lg font-medium text-gray-900">{user?.name || 'User'}</h3>
              <p className="text-sm text-gray-600">{user?.email || ''}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {user?.is_admin ? 'Administrator' : 'Standard User'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
