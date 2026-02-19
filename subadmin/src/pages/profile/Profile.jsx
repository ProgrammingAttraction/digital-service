import React, { useState, useContext } from 'react';
import { 
  User, 
  Shield,
  Mail,
  Calendar, 
  Save, 
  Lock,
  CheckCircle,
  Edit,
  Key,
  RefreshCw,
  Users,
  Activity,
  Settings,
  Bell,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { useDashboard } from '../../context/DashboardContext';

function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Use DashboardContext
  const { 
    adminProfile, 
    profileLoading, 
    fetchAdminProfile, 
    updateAdminProfile, 
    changeAdminPassword,
    getAdminRoleBadgeColor,
    formatDate,
    getProfileImageUrl
  } =useDashboard();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Update form data when profile is loaded
  React.useEffect(() => {
    if (adminProfile) {
      setFormData({
        username: adminProfile.username || '',
        email: adminProfile.email || ''
      });
    }
  }, [adminProfile]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateAdminProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Error is already handled in the provider
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!passwordData.currentPassword) {
      toast.error('Current password is required!');
      return;
    }
    
    if (!passwordData.newPassword) {
      toast.error('New password is required!');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    try {
      await changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      // Error is already handled in the provider
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  // Show loading state
  if (profileLoading && !adminProfile) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        <main className="min-h-[91vh] bg-gray-50 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-700">Loading admin profile...</h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />

      <main className="min-h-[91vh] bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto space-y-6">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Profile</h1>
              <p className="text-gray-600 text-[13px] md:text-[15px]">Manage your admin account settings and security</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Profile Overview */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors cursor-pointer duration-150 text-sm ${
                        isEditing 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border-[1px] border-red-500' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-[1px] border-blue-500'
                      }`}
                    >
                      <Edit size={16} className="mr-2" />
                      {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 bg-theme_color2 text-white rounded-lg hover:bg-theme_color2 transition-colors duration-150"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                          <img 
                            src={getProfileImageUrl()} 
                            alt="Admin Profile" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">{adminProfile?.username || 'Admin'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getAdminRoleBadgeColor(adminProfile?.role)}`}>
                              {adminProfile?.role || 'admin'}
                            </span>
                            {adminProfile?.isActive && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                                <Activity size={12} className="mr-1" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center text-gray-600">
                            <Mail size={18} className="mr-3 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="text-gray-800">{adminProfile?.email || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Calendar size={18} className="mr-3 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Member Since</p>
                              <p className="text-gray-800">{formatDate(adminProfile?.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Calendar size={18} className="mr-3 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Last Updated</p>
                              <p className="text-gray-800">{formatDate(adminProfile?.updatedAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Shield size={18} className="mr-3 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Account ID</p>
                              <p className="text-xs text-gray-800 font-mono truncate">{adminProfile?._id || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                    <button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors duration-150 text-sm ${
                        isChangingPassword 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border-[1px] border-red-500' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-[1px] border-blue-500'
                      }`}
                    >
                      <Key size={16} className="mr-2" />
                      {isChangingPassword ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {isChangingPassword ? (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="text-xs text-gray-500 mb-4">
                          <p className="font-medium mb-1">Password requirements:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>At least 6 characters long</li>
                            <li>Should contain letters and numbers</li>
                            <li>Should not be easily guessable</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 bg-theme_color2 cursor-pointer text-white rounded-lg hover:bg-theme_color2 transition-colors duration-150"
                        >
                          <Lock size={16} className="mr-2" />
                          Update Password
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <Shield className="text-blue-500 mr-3" size={24} />
                          <div>
                            <h4 className="font-medium text-blue-800">Account Security Status</h4>
                            <p className="text-sm text-blue-600 mt-1">
                              Your account is secured with hashed password storage and role-based access control.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Password Last Changed</span>
                            <span className="text-xs text-gray-500">Auto-detected</span>
                          </div>
                          <p className="text-gray-800">{formatDate(adminProfile?.updatedAt)}</p>
                        </div>
                        
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Login Session</span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">You are currently logged in</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Info */}
            <div className="space-y-6">
              
              {/* Account Status Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">Account Status</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${adminProfile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {adminProfile?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role Level</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getAdminRoleBadgeColor(adminProfile?.role)}`}>
                        {adminProfile?.role?.toUpperCase() || 'ADMIN'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account Created</span>
                      <span className="text-sm text-gray-800">{formatDate(adminProfile?.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center text-green-600">
                      <CheckCircle size={16} className="mr-2" />
                      <span className="text-sm font-medium">Account Verified</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Your account has full admin privileges and access to all system features.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">Quick Actions</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                      <Settings size={18} className="mr-3 text-gray-400" />
                      <span className="text-sm">Account Settings</span>
                    </button>
                    
                    <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                      <Bell size={18} className="mr-3 text-gray-400" />
                      <span className="text-sm">Notification Settings</span>
                    </button>
                    
                    <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                      <Users size={18} className="mr-3 text-gray-400" />
                      <span className="text-sm">Manage Admins</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                    >
                      <LogOut size={18} className="mr-3" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;