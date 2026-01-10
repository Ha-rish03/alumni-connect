import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Users, 
  LogOut, 
  Search,
  Bell,
  Settings,
  Building,
  MessageCircle,
  UserPlus,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConnectionRequests } from '@/components/ConnectionRequests';
import { ConnectionsList } from '@/components/ConnectionsList';
import { ChatWindow } from '@/components/ChatWindow';

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
    
    // Get all student user_ids
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

  const filteredProfiles = studentProfiles.filter(profile => 
    profile.user_id !== user?.id &&
    (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.department?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getConnectionStatus = (profileUserId: string) => {
    if (acceptedConnections.has(profileUserId)) return 'connected';
    if (pendingConnections.has(profileUserId)) return 'pending';
    return 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Alumni Portal</span>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Alumni</Badge>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex relative">
              <Bell className="w-5 h-5" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="w-12 h-12 border-2 border-amber-500/20">
              <AvatarImage src={currentProfile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                {currentProfile ? getInitials(currentProfile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {currentProfile?.full_name || 'Alumni'}!
              </h1>
              <p className="text-muted-foreground">Help students with mentorship and guidance</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft animate-fade-up border-amber-200/50" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{studentProfiles.length}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up border-red-200/50" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <UserPlus className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequestsCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up border-green-200/50" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedConnections.size}</p>
                  <p className="text-sm text-muted-foreground">Mentees Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="requests" className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="requests" className="gap-2 relative">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card className="shadow-elevated border-amber-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                  Connection Requests
                </CardTitle>
                <CardDescription>
                  Students who want to connect with you for mentorship
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionRequests onConnectionAccepted={handleConnectionAccepted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="shadow-elevated border-amber-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  Student Directory
                </CardTitle>
                <CardDescription>
                  View students in the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading students...
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No students found matching your search' : 'No students available yet.'}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile) => {
                      const status = getConnectionStatus(profile.user_id);
                      return (
                        <Card key={profile.id} className="hover:shadow-soft transition-shadow duration-200 border-amber-100/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback className="bg-amber-100 text-amber-600">
                                  {getInitials(profile.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{profile.full_name}</h3>
                                <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 mb-1">
                                  Student
                                </Badge>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {profile.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {profile.department}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-3">
                                  {status === 'connected' ? (
                                    <Badge className="bg-green-600">Mentee</Badge>
                                  ) : status === 'pending' ? (
                                    <Badge variant="secondary">Request Pending</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Chat with your connected students
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
