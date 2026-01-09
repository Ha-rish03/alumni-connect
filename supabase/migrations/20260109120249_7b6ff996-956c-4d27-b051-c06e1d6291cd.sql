-- Create connections table for connection requests
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Connections policies
CREATE POLICY "Users can view their own connections"
ON public.connections
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send connection requests"
ON public.connections
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update connection status"
ON public.connections
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Messages policies
CREATE POLICY "Users can view messages in their connections"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE connections.id = messages.connection_id 
    AND (connections.sender_id = auth.uid() OR connections.receiver_id = auth.uid())
    AND connections.status = 'accepted'
  )
);

CREATE POLICY "Users can send messages in accepted connections"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE connections.id = connection_id 
    AND (connections.sender_id = auth.uid() OR connections.receiver_id = auth.uid())
    AND connections.status = 'accepted'
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create updated_at trigger for connections
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();