import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentDashboard from './StudentDashboard';
import AlumniDashboard from './AlumniDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<'student' | 'alumni' | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    setIsLoadingRole(true);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData) {
      setUserRole(roleData.role as 'student' | 'alumni');
    }
    setIsLoadingRole(false);
  };

  if (loading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render the appropriate dashboard based on role
  if (userRole === 'alumni') {
    return <AlumniDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;
