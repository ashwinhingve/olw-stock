'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface DirectPermissionCheckProps {
  permission: string;
  children: ReactNode;
}

export default function DirectPermissionCheck({ permission, children }: DirectPermissionCheckProps) {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (status !== 'authenticated') {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        // Call the permissions API directly
        const response = await fetch('/api/auth/permissions');
        
        // Check for non-200 response status
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API returned error ${response.status}: ${errorText}`);
          setError(`Server returned ${response.status} ${response.statusText}. This may be due to a server error or network issue.`);
          setHasPermission(false);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();

        console.log(`DirectPermissionCheck: Checking for permission '${permission}'`, data);
        
        if (data.success) {
          // If user is a store_admin, always grant access
          if (data.isStoreAdmin) {
            console.log('User is store_admin, granting access');
            setHasPermission(true);
          } else {
            // Otherwise check specific permission
            const hasRequiredPermission = data.permissions.includes(permission);
            console.log(`Permission check result: ${hasRequiredPermission}`);
            setHasPermission(hasRequiredPermission);
          }
        } else {
          setError('Failed to fetch permissions');
          setHasPermission(false);
        }
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError('Error checking permissions');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [permission, status]);

  if (isLoading) {
    return <div>Checking permissions...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <h3 className="font-medium text-red-900 text-lg">Permission Check Error</h3>
        <p className="text-red-800 mb-2">{error}</p>
        <div className="text-sm bg-red-100 p-2 rounded">
          <p className="font-medium">Troubleshooting steps:</p>
          <ol className="list-decimal ml-5 mt-1 space-y-1">
            <li>Check if you're logged in correctly</li>
            <li>Try refreshing the page</li>
            <li>Make sure the server is running properly</li>
            <li>Contact your administrator if the issue persists</li>
          </ol>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <h3 className="font-medium text-red-900 text-lg">Access Denied</h3>
        <p className="text-red-800">
          You do not have permission to access this feature. Please contact a Store Admin for assistance.
        </p>
      </div>
    );
  }

  return <>{children}</>;
} 