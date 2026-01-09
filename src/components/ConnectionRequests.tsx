import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    avatar_url: string | null;
    current_position: string | null;
    current_company: string | null;
  };
}

interface ConnectionRequestsProps {
  onConnectionAccepted?: () => void;
}

export const ConnectionRequests = ({ onConnectionAccepted }: ConnectionRequestsProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    // Fetch sender profiles
    const senderIds = data.map(c => c.sender_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, current_position, current_company')
      .in('user_id', senderIds);

    const requestsWithProfiles = data.map(conn => ({
      ...conn,
      sender_profile: profiles?.find(p => p.user_id === conn.sender_id)
    }));

    setRequests(requestsWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      toast.error('Failed to update connection');
      return;
    }

    toast.success(status === 'accepted' ? 'Connection accepted!' : 'Connection rejected');
    fetchRequests();
    if (status === 'accepted' && onConnectionAccepted) {
      onConnectionAccepted();
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No pending connection requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id} className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {request.sender_profile?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.sender_profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.sender_profile?.current_position} 
                    {request.sender_profile?.current_company && ` at ${request.sender_profile.current_company}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResponse(request.id, 'accepted')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleResponse(request.id, 'rejected')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
