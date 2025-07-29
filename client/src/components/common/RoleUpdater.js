import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// This component will refresh user permissions when navigating between pages or when roles are updated
const RoleUpdater = () => {
  const { refreshUserPermissions, userRole, user } = useAuth();
  const location = useLocation();
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(
    localStorage.getItem('role_update_timestamp') || '0'
  );

  // Check for role updates when location changes
  useEffect(() => {
    const updatePermissions = async () => {
      await refreshUserPermissions();
    };
    
    updatePermissions();
    
    // We only want this to run when the pathname changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Add a timer to periodically check for role updates
  useEffect(() => {
    // Check if there's a new role update timestamp in localStorage
    const checkForRoleUpdates = () => {
      const currentUpdateTime = localStorage.getItem('role_update_timestamp') || '0';
      
      // If there's a newer timestamp, refresh permissions
      if (currentUpdateTime !== lastUpdateTimestamp) {
        setLastUpdateTimestamp(currentUpdateTime);
        refreshUserPermissions();
        console.log('Role data refreshed due to role update');
      }
    };
    
    // Check immediately on component mount
    checkForRoleUpdates();
    
    // Set up a periodic check every 5 seconds (reduced from 15s for more responsiveness)
    const intervalId = setInterval(checkForRoleUpdates, 5000);
    
    // Additional event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'role_update_timestamp') {
        refreshUserPermissions();
        console.log('Role data refreshed due to storage event');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [lastUpdateTimestamp, refreshUserPermissions]);

  // Listen for broadcast channel messages for role updates
  useEffect(() => {
    // Set up a broadcast channel to receive role update notifications
    const channel = new BroadcastChannel('role_updates');
    
    channel.onmessage = async (event) => {
      if (event.data.type === 'role_updated') {
        console.log('Role update notification received via BroadcastChannel');
        await refreshUserPermissions();
        setLastUpdateTimestamp(event.data.timestamp || Date.now().toString());
      }
    };
    
    return () => {
      channel.close();
    };
  }, [refreshUserPermissions]);

  // Debug - show current role permissions in console
  useEffect(() => {
    if (userRole && user) {
      // Log current permissions to help debugging
      console.log(`Current role for ${user.username}: ${userRole.role_name}, role_id: ${userRole.role_id}`);
      console.log('Current permissions:', {
        dashboard: userRole.access_dashboard,
        userProfile: userRole.access_user_profile,
        testManagement: userRole.access_test_management,
        categoryManagement: userRole.access_category_management,
        testAssignment: userRole.access_test_assignment,
        supervisorTests: userRole.access_supervisor_tests,
        candidateTests: userRole.access_candidate_tests,
        myTests: userRole.access_my_tests,
        results: userRole.access_results
      });
    }
  }, [userRole, user]);

  // Force refresh on component mount
  useEffect(() => {
    const forceRefresh = async () => {
      console.log('RoleUpdater: Forcing permission refresh on component mount');
      localStorage.removeItem('userRole'); // Clear cached role data
      await refreshUserPermissions();
      console.log('RoleUpdater: Permission refresh complete');
    };
    
    forceRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component doesn't render anything
  return null;
};

export default RoleUpdater; 