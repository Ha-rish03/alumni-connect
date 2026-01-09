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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
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
      fetchProfiles();
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

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData) {
      setUserRole(roleData.role);
    }
  };

  const fetchProfiles = async () => {
    setIsLoadingData(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProfiles(data);
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

  const filteredProfiles = profiles.filter(profile => 
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
            <div className="p-2 rounded-xl gradient-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Alumni Tracker</span>
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
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={currentProfile?.avatar_url || ''} />
              <AvatarFallback className="gradient-primary text-primary-foreground">
                {currentProfile ? getInitials(currentProfile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {currentProfile?.full_name || 'User'}!
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {userRole || 'Member'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-soft animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profiles.length}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/20">
                  <GraduationCap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profiles.filter(p => p.graduation_year).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Alumni</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profiles.filter(p => p.current_company).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Employed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <MessageCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedConnections.size}</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="directory" className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="directory" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Directory</span>
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

          <TabsContent value="directory">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Alumni Directory</CardTitle>
                <CardDescription>
                  Browse and connect with fellow students and alumni
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading directory...
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No results found' : 'No other members yet.'}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile) => {
                      const status = getConnectionStatus(profile.user_id);
                      return (
                        <Card key={profile.id} className="hover:shadow-soft transition-shadow duration-200">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(profile.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{profile.full_name}</h3>
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
                                    <Badge variant="secondary">Pending</Badge>
                                  ) : (
                                    <Button
                                      size="sm"
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
                  Review and respond to connection requests from other members
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
                  Chat with your connections
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
                    onSelectConnection={handleSelectConnection}
                    refreshTrigger={connectionsRefresh}
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

export default Dashboard;
