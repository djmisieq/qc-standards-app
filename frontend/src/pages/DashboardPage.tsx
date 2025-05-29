import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          QC Standards Application Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <Link to="/templates" className="block h-full">
            <div className="p-4">
              <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-blue-500 text-white mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 sm:h-8 sm:w-8" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">QC Templates</h3>
              <p className="mt-2 text-gray-600">
                Create and manage quality control templates for various processes
              </p>
            </div>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link to="/checklists" className="block h-full">
            <div className="p-4">
              <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-green-500 text-white mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 sm:h-8 sm:w-8" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">QC Checklists</h3>
              <p className="mt-2 text-gray-600">
                View and execute quality control checklists for your products
              </p>
            </div>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link to="/profile" className="block h-full">
            <div className="p-4">
              <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-purple-500 text-white mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 sm:h-8 sm:w-8" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
              <p className="mt-2 text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
          </Link>
        </Card>

        {user?.is_admin && (
          <Card className="hover:shadow-lg transition-shadow">
            <Link to="/admin" className="block h-full">
              <div className="p-4">
                <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-red-500 text-white mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 sm:h-8 sm:w-8" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Admin</h3>
                <p className="mt-2 text-gray-600">
                  Manage users and system settings
                </p>
              </div>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
