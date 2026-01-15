import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, UserPlus, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

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
    department: string | null;
  };
}

interface ConnectionRequestsProps {
  onConnectionAccepted?: () => void;
}

export const ConnectionRequests = ({ onConnectionAccepted }: ConnectionRequestsProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    const senderIds = data.map(c => c.sender_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, current_position, current_company, department')
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
    setProcessingId(connectionId);
    
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      toast.error('Failed to update connection');
      setProcessingId(null);
      return;
    }

    toast.success(
      status === 'accepted' 
        ? '🎉 Connection accepted! You can now message each other.' 
        : 'Connection request declined'
    );
    
    fetchRequests();
    setProcessingId(null);
    
    if (status === 'accepted' && onConnectionAccepted) {
      onConnectionAccepted();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="w-10 h-10 bg-muted rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No pending requests"
        description="When students send you connection requests, they'll appear here. Check back soon!"
        variant="alumni"
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request, index) => (
        <Card 
          key={request.id} 
          className={cn(
            "overflow-hidden animate-fade-up transition-all duration-200",
            "hover:shadow-md border-amber-100/50",
            processingId === request.id && "opacity-50 pointer-events-none"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-transparent to-transparent pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                    <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
                      {request.sender_profile?.full_name ? getInitials(request.sender_profile.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 ring-2 ring-white">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{request.sender_profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {request.sender_profile?.current_position || request.sender_profile?.department || 'Student'}
                    {request.sender_profile?.current_company && ` at ${request.sender_profile.current_company}`}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(request.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  onClick={() => handleResponse(request.id, 'accepted')}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md transition-transform hover:scale-105"
                  disabled={processingId === request.id}
                >
                  <Check className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleResponse(request.id, 'rejected')}
                  className="h-10 w-10 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-transform hover:scale-105"
                  disabled={processingId === request.id}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
