import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  other_user?: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    current_position: string | null;
    current_company: string | null;
  };
}

interface ConnectionsListProps {
  onSelectConnection: (connectionId: string, otherUser: Connection['other_user']) => void;
  refreshTrigger?: number;
}

export const ConnectionsList = ({ onSelectConnection, refreshTrigger }: ConnectionsListProps) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
      return;
    }

    // Get all user IDs that are not the current user
    const otherUserIds = data.map(c => 
      c.sender_id === user.id ? c.receiver_id : c.sender_id
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, current_position, current_company')
      .in('user_id', otherUserIds);

    const connectionsWithProfiles = data.map(conn => {
      const otherUserId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id;
      return {
        ...conn,
        other_user: profiles?.find(p => p.user_id === otherUserId)
      };
    });

    setConnections(connectionsWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchConnections();
  }, [user, refreshTrigger]);

  if (loading) {
    return <div className="text-muted-foreground">Loading connections...</div>;
  }

  if (connections.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No connections yet</p>
          <p className="text-sm mt-1">Connect with alumni or students to start chatting</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection) => (
        <Card 
          key={connection.id} 
          className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
          onClick={() => onSelectConnection(connection.id, connection.other_user)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={connection.other_user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {connection.other_user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{connection.other_user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {connection.other_user?.current_position}
                    {connection.other_user?.current_company && ` at ${connection.other_user.current_company}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
