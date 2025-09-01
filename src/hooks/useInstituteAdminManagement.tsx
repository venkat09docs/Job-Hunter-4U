import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';

interface ManagedInstitute {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface InstituteAdminData {
  managedInstitutes: ManagedInstitute[];
  primaryInstitute: ManagedInstitute | null;
  isValidInstituteAdmin: boolean;
}

export const useInstituteAdminManagement = () => {
  const [adminData, setAdminData] = useState<InstituteAdminData>({
    managedInstitutes: [],
    primaryInstitute: null,
    isValidInstituteAdmin: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isInstituteAdmin } = useRole();

  useEffect(() => {
    if (user && isInstituteAdmin !== null) {
      if (isInstituteAdmin) {
        fetchManagedInstitutes();
      } else {
        // Not an institute admin, clear data
        setAdminData({
          managedInstitutes: [],
          primaryInstitute: null,
          isValidInstituteAdmin: false
        });
        setLoading(false);
      }
    }
  }, [user, isInstituteAdmin]);

  const fetchManagedInstitutes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏢 Fetching managed institutes for admin:', user.id);

      // Fetch institute admin assignments with institute details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('institute_admin_assignments')
        .select(`
          institute_id,
          is_active,
          assigned_at,
          institutes:institute_id (
            id,
            name,
            code,
            description,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assignmentsError) {
        throw assignmentsError;
      }

      console.log('📋 Institute admin assignments found:', assignments?.length || 0);

      // Process and validate assignments
      const managedInstitutes: ManagedInstitute[] = [];
      
      if (assignments && assignments.length > 0) {
        for (const assignment of assignments) {
          const institute = assignment.institutes;
          if (institute && institute.is_active) {
            managedInstitutes.push({
              id: institute.id,
              name: institute.name,
              code: institute.code,
              description: institute.description || undefined
            });
          }
        }
      }

      const primaryInstitute = managedInstitutes.length > 0 ? managedInstitutes[0] : null;
      
      console.log('✅ Successfully loaded managed institutes:', {
        count: managedInstitutes.length,
        institutes: managedInstitutes.map(i => ({ id: i.id, name: i.name })),
        primary: primaryInstitute ? `${primaryInstitute.name} (${primaryInstitute.code})` : null
      });

      setAdminData({
        managedInstitutes,
        primaryInstitute,
        isValidInstituteAdmin: managedInstitutes.length > 0
      });

    } catch (error: any) {
      console.error('❌ Error fetching managed institutes:', error);
      setError(error.message || 'Failed to load managed institutes');
      setAdminData({
        managedInstitutes: [],
        primaryInstitute: null,
        isValidInstituteAdmin: false
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserInInstitute = (userId: string): boolean => {
    // This would need to be implemented with a separate query
    // For now, we rely on RLS policies to filter the data
    return true;
  };

  return {
    ...adminData,
    loading,
    error,
    refreshManagedInstitutes: fetchManagedInstitutes,
    checkUserInInstitute
  };
};