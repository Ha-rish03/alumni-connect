import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No connections yet"
        description="Connect with alumni or students to start chatting. Your conversations will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection, index) => (
        <Card 
          key={connection.id} 
          className={cn(
            "group cursor-pointer transition-all duration-200 animate-fade-up",
            "hover:shadow-md hover:border-primary/20 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => onSelectConnection(connection.id, connection.other_user)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={connection.other_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                      {connection.other_user?.full_name ? getInitials(connection.other_user.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {connection.other_user?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {connection.other_user?.current_position}
                    {connection.other_user?.current_company && (
                      <span className="text-muted-foreground/70"> at {connection.other_user.current_company}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
