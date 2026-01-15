import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Users, 
  LogOut, 
  Search,
  Bell,
  Settings,
  MessageCircle,
  UserPlus,
  Briefcase,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConnectionRequests } from '@/components/ConnectionRequests';
import { ConnectionsList } from '@/components/ConnectionsList';
import { ChatWindow } from '@/components/ChatWindow';
import { ProfileCard } from '@/components/ProfileCard';
import { StatsCard } from '@/components/StatsCard';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProfileCardSkeleton } from '@/components/ui/skeleton-card';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  graduation_year: number | null;
  department: string | null;
  current_company: string | null;
  current_position: string | null;
  avatar_url: string | null;
}

interface ProfileWithRole extends Profile {
  role?: 'student' | 'alumni';
}

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [studentProfiles, setStudentProfiles] = useState<ProfileWithRole[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  const [acceptedConnections, setAcceptedConnections] = useState<Set<string>>(new Set());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [connectionsRefresh, setConnectionsRefresh] = useState(0);
  const [activeChat, setActiveChat] = useState<{
    connectionId: string;
    otherUser: { user_id: string; full_name: string; avatar_url: string | null };
  } | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchStudentProfiles();
      fetchConnectionStatus();
      fetchPendingRequestsCount();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setCurrentProfile(profileData);
    }
  };

  const fetchStudentProfiles = async () => {
    setIsLoadingData(true);
    
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (studentRoles && studentRoles.length > 0) {
      const studentUserIds = studentRoles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentUserIds)
        .order('created_at', { ascending: false });

      if (profiles) {
        setStudentProfiles(profiles.map(p => ({ ...p, role: 'student' as const })));
      }
    } else {
      setStudentProfiles([]);
    }
    
    setIsLoadingData(false);
  };

  const fetchConnectionStatus = async () => {
    if (!user) return;

    const { data: connections } = await supabase
      .from('connections')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (connections) {
      const pending = new Set<string>();
      const accepted = new Set<string>();

      connections.forEach(conn => {
        const otherUserId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id;
        if (conn.status === 'pending') {
          pending.add(otherUserId);
        } else if (conn.status === 'accepted') {
          accepted.add(otherUserId);
        }
      });

      setPendingConnections(pending);
      setAcceptedConnections(accepted);
    }
  };

  const fetchPendingRequestsCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    setPendingRequestsCount(count || 0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleConnectionAccepted = () => {
    setConnectionsRefresh(prev => prev + 1);
    fetchConnectionStatus();
    fetchPendingRequestsCount();
  };

  const handleSelectConnection = (connectionId: string, otherUser: any) => {
    if (otherUser) {
      setActiveChat({ connectionId, otherUser });
    }
  };

  const startChatWithUser = async (userId: string) => {
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
      .maybeSingle();

    if (connection) {
      const profile = studentProfiles.find(p => p.user_id === userId);
      if (profile) {
        setActiveChat({
          connectionId: connection.id,
          otherUser: {
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        });
      }
    }
  };

  const filteredProfiles = studentProfiles.filter(profile => 
    profile.user_id !== user?.id &&
    (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.department?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getConnectionStatus = (profileUserId: string): "none" | "pending" | "connected" => {
    if (acceptedConnections.has(profileUserId)) return 'connected';
    if (pendingConnections.has(profileUserId)) return 'pending';
    return 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center animate-pulse-glow">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/30">
      {/* Header */}
      <header className="border-b glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Alumni Portal
            </span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
              <Input
                type="text"
                placeholder="Search students by name, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-amber-200 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden sm:flex relative hover:bg-amber-50 hover:text-amber-600">
              <Bell className="w-5 h-5" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce-subtle">
                  {pendingRequestsCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-amber-50 hover:text-amber-600">
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <WelcomeHeader
          name={currentProfile?.full_name || 'Alumni'}
          avatarUrl={currentProfile?.avatar_url || null}
          role="alumni"
          subtitle="Guide the next generation of professionals"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={Users}
            value={studentProfiles.length}
            label="Students"
            variant="amber"
            index={0}
          />
          <StatsCard
            icon={UserPlus}
            value={pendingRequestsCount}
            label="Pending Requests"
            variant="red"
            index={1}
          />
          <StatsCard
            icon={UserCheck}
            value={acceptedConnections.size}
            label="Mentees Connected"
            variant="green"
            index={2}
          />
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="requests" className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50">
            <TabsTrigger value="requests" className="gap-2 relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {acceptedConnections.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {acceptedConnections.size}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card className="shadow-elevated border-amber-100/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  Connection Requests
                  {pendingRequestsCount > 0 && (
                    <Badge className="ml-2 bg-red-500 hover:bg-red-500 animate-pulse">
                      {pendingRequestsCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Students who want to connect with you for mentorship and guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ConnectionRequests onConnectionAccepted={handleConnectionAccepted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="shadow-elevated border-amber-100/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  Student Directory
                  <Badge variant="secondary" className="ml-2">
                    {filteredProfiles.length} students
                  </Badge>
                </CardTitle>
                <CardDescription>
                  View and connect with students in the network
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {isLoadingData ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <ProfileCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <EmptyState
                    icon={searchQuery ? Search : GraduationCap}
                    title={searchQuery ? "No students found" : "No students available yet"}
                    description={searchQuery 
                      ? "Try adjusting your search terms" 
                      : "Students will appear here when they join the platform"
                    }
                    variant="alumni"
                    action={searchQuery ? (
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Clear Search
                      </Button>
                    ) : undefined}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile, index) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        role="student"
                        connectionStatus={getConnectionStatus(profile.user_id)}
                        onMessage={() => startChatWithUser(profile.user_id)}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  Messages
                </CardTitle>
                <CardDescription>
                  Chat with your connected student mentees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeChat ? (
                  <ChatWindow
                    connectionId={activeChat.connectionId}
                    otherUser={activeChat.otherUser}
                    onBack={() => setActiveChat(null)}
                  />
                ) : (
                  <ConnectionsList
                    key={connectionsRefresh}
                    onSelectConnection={handleSelectConnection}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AlumniDashboard;
