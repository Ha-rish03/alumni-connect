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
  Briefcase, 
  LogOut, 
  Search,
  Bell,
  Settings,
  Building,
  MessageCircle,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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

  const fetchAlumniProfiles = async () => {
    setIsLoadingData(true);
    
    // Get all alumni user_ids
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

  const filteredProfiles = alumniProfiles.filter(profile => 
    profile.user_id !== user?.id &&
    (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.current_company?.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <div className="p-2 rounded-xl bg-blue-600">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Student Portal</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Student</Badge>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search alumni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="w-5 h-5" />
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
            <Avatar className="w-12 h-12 border-2 border-blue-500/20">
              <AvatarImage src={currentProfile?.avatar_url || ''} />
              <AvatarFallback className="bg-blue-600 text-white">
                {currentProfile ? getInitials(currentProfile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {currentProfile?.full_name || 'Student'}!
              </h1>
              <p className="text-muted-foreground">Connect with alumni and grow your network</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft animate-fade-up border-blue-200/50" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{alumniProfiles.length}</p>
                  <p className="text-sm text-muted-foreground">Available Alumni</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up border-green-200/50" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedConnections.size}</p>
                  <p className="text-sm text-muted-foreground">My Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up border-purple-200/50" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingConnections.size}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="alumni" className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="alumni" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Alumni</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alumni">
            <Card className="shadow-elevated border-blue-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Alumni Network
                </CardTitle>
                <CardDescription>
                  Connect with alumni for mentorship and career guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading alumni...
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No alumni found matching your search' : 'No alumni available yet.'}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile) => {
                      const status = getConnectionStatus(profile.user_id);
                      return (
                        <Card key={profile.id} className="hover:shadow-soft transition-shadow duration-200 border-blue-100/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {getInitials(profile.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{profile.full_name}</h3>
                                <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 mb-1">
                                  Alumni
                                </Badge>
                                {profile.current_position && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {profile.current_position}
                                  </p>
                                )}
                                {profile.current_company && (
                                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                    <Building className="w-3 h-3" />
                                    <span className="truncate">{profile.current_company}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {profile.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {profile.department}
                                    </Badge>
                                  )}
                                  {profile.graduation_year && (
                                    <Badge variant="secondary" className="text-xs">
                                      Class of {profile.graduation_year}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-3">
                                  {status === 'connected' ? (
                                    <Badge className="bg-green-600">Connected</Badge>
                                  ) : status === 'pending' ? (
                                    <Badge variant="secondary">Request Sent</Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => sendConnectionRequest(profile.user_id)}
                                      disabled={sendingConnection === profile.user_id}
                                    >
                                      {sendingConnection === profile.user_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <UserPlus className="w-4 h-4 mr-1" />
                                          Connect
                                        </>
                                      )}
                                    </Button>
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

          <TabsContent value="requests">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Connection Requests</CardTitle>
                <CardDescription>
                  Review responses from alumni
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
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Chat with your connected alumni
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
