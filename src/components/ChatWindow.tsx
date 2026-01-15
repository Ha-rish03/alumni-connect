import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  connectionId: string;
  otherUser: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
  };
  onBack: () => void;
}

export const ChatWindow = ({ connectionId, otherUser, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-elevated">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-background/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {getInitials(otherUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
          </div>
          <div>
            <p className="font-semibold">{otherUser.full_name}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-muted/20 to-transparent">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 animate-float">
                  <Sparkles className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-muted-foreground font-medium">No messages yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Say hello and start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 animate-fade-up",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    {!isOwn && showAvatar && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage src={otherUser.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(otherUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8" />}
                    
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isOwn
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md"
                          : "bg-white border border-border/50 rounded-bl-md"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1 text-right",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border-muted-foreground/20 focus:border-primary/50"
              disabled={sending}
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()}
              className="px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
