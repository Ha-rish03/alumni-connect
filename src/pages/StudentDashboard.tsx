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
  Sparkles,
  Briefcase
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ConnectionRequests } from '@/components/ConnectionRequests';
import { ConnectionsList } from '@/components/ConnectionsList';
import { ChatWindow } from '@/components/ChatWindow';
import { ProfileCard } from '@/components/ProfileCard';
import { StatsCard } from '@/components/StatsCard';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProfileCardSkeleton } from '@/components/ui/skeleton-card';
import { JobPostingsList } from '@/components/JobPostingsList';

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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [alumniProfiles, setAlumniProfiles] = useState<ProfileWithRole[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  const [acceptedConnections, setAcceptedConnections] = useState<Set<string>>(new Set());
  const [connectionsRefresh, setConnectionsRefresh] = useState(0);
  const [activeChat, setActiveChat] = useState<{
    connectionId: string;
    otherUser: { user_id: string; full_name: string; avatar_url: string | null };
  } | null>(null);
  const [sendingConnection, setSendingConnection] = useState<string | null>(null);
  const [jobsCount, setJobsCount] = useState(0);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchAlumniProfiles();
      fetchConnectionStatus();
      fetchJobsCount();
    }
  }, [user]);

  const fetchJobsCount = async () => {
    const { count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    setJobsCount(count || 0);
  };

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

  const fetchAlumniProfiles = async () => {
    setIsLoadingData(true);
    
    const { data: alumniRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'alumni');

    if (alumniRoles && alumniRoles.length > 0) {
      const alumniUserIds = alumniRoles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', alumniUserIds)
        .order('created_at', { ascending: false });

      if (profiles) {
        setAlumniProfiles(profiles.map(p => ({ ...p, role: 'alumni' as const })));
      }
    } else {
      setAlumniProfiles([]);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;

    setSendingConnection(receiverId);
    const { error } = await supabase
      .from('connections')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } else {
      toast.success('Connection request sent!');
      setPendingConnections(prev => new Set([...prev, receiverId]));
    }
    setSendingConnection(null);
  };

  const handleConnectionAccepted = () => {
    setConnectionsRefresh(prev => prev + 1);
    fetchConnectionStatus();
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
      const profile = alumniProfiles.find(p => p.user_id === userId);
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

  const filteredProfiles = alumniProfiles.filter(profile => 
    profile.user_id !== user?.id &&
    (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.current_company?.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center animate-pulse-glow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30">
      {/* Header */}
      <header className="border-b glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Student Portal
            </span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
              <Input
                type="text"
                placeholder="Search alumni by name, department, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-blue-200 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-blue-50 hover:text-blue-600">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-blue-50 hover:text-blue-600">
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
          name={currentProfile?.full_name || 'Student'}
          avatarUrl={currentProfile?.avatar_url || null}
          role="student"
          subtitle="Connect with alumni and grow your professional network"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={Users}
            value={alumniProfiles.length}
            label="Available Alumni"
            variant="blue"
            index={0}
          />
          <StatsCard
            icon={UserPlus}
            value={acceptedConnections.size}
            label="My Connections"
            variant="green"
            index={1}
          />
          <StatsCard
            icon={MessageCircle}
            value={pendingConnections.size}
            label="Pending Requests"
            variant="purple"
            index={2}
          />
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="jobs" className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <TabsList className="grid w-full grid-cols-4 mb-6 p-1 bg-muted/50">
            <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
              {jobsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {jobsCount > 9 ? '9+' : jobsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="alumni" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Alumni</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
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

          <TabsContent value="jobs">
            <Card className="shadow-elevated border-amber-100/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </div>
                  Job & Internship Opportunities
                  {jobsCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                      {jobsCount} available
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Explore career opportunities posted by alumni in your network
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <JobPostingsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alumni">
            <Card className="shadow-elevated border-blue-100/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  Alumni Network
                  <Badge variant="secondary" className="ml-2">
                    {filteredProfiles.length} available
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Connect with alumni for mentorship, career guidance, and professional growth
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
                    icon={searchQuery ? Search : Users}
                    title={searchQuery ? "No alumni found" : "No alumni available yet"}
                    description={searchQuery 
                      ? "Try adjusting your search terms or browse all alumni" 
                      : "Be the first to connect when alumni join the platform!"
                    }
                    variant="student"
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
                        role="alumni"
                        connectionStatus={getConnectionStatus(profile.user_id)}
                        onConnect={() => sendConnectionRequest(profile.user_id)}
                        onMessage={() => startChatWithUser(profile.user_id)}
                        isConnecting={sendingConnection === profile.user_id}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  Connection Requests
                </CardTitle>
                <CardDescription>
                  Review responses from alumni you've reached out to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionRequests onConnectionAccepted={handleConnectionAccepted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  Messages
                </CardTitle>
                <CardDescription>
                  Chat with your connected alumni mentors
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

export default StudentDashboard;
