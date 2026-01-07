import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, MessageSquare, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  projects: {
    title: string;
  } | null;
  sender: {
    full_name: string;
  } | null;
}

interface Conversation {
  project_id: string;
  project_title: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const Inbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
        },
        (payload) => {
          const newMsg = payload.new as ProjectMessage;
          if (newMsg.sender_id === user?.id || newMsg.recipient_id === user?.id) {
            fetchConversations();
            if (selectedConversation) {
              fetchMessages(selectedConversation.project_id, selectedConversation.other_user_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    if (!user) return;

    // Get messages where user is sender or recipient
    const { data, error } = await supabase
      .from('project_messages')
      .select(`
        id,
        project_id,
        sender_id,
        recipient_id,
        message,
        is_read,
        created_at,
        projects (title)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Group by project and other user
      const convMap = new Map<string, Conversation>();
      
      for (const msg of data) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const key = `${msg.project_id}-${otherId}`;
        
        if (!convMap.has(key)) {
          // Fetch other user's name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', otherId)
            .maybeSingle();

          convMap.set(key, {
            project_id: msg.project_id,
            project_title: msg.projects?.title || 'Proyecto',
            other_user_id: otherId,
            other_user_name: profile?.full_name || 'Usuario',
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }

        const conv = convMap.get(key)!;
        if (!msg.is_read && msg.recipient_id === user.id) {
          conv.unread_count++;
        }
      }

      setConversations(Array.from(convMap.values()));
    }
    setLoading(false);
  };

  const fetchMessages = async (projectId: string, otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('project_messages')
      .select(`
        *,
        projects (title)
      `)
      .eq('project_id', projectId)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as ProjectMessage[]);

      // Mark as read
      await supabase
        .from('project_messages')
        .update({ is_read: true })
        .eq('project_id', projectId)
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user.id);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.project_id, conv.other_user_id);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    await supabase.from('project_messages').insert({
      project_id: selectedConversation.project_id,
      sender_id: user.id,
      recipient_id: selectedConversation.other_user_id,
      message: newMessage.trim(),
    });

    setNewMessage('');
    fetchMessages(selectedConversation.project_id, selectedConversation.other_user_id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex h-full gap-4">
          {/* Conversations List */}
          <Card className="w-full md:w-96 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Inbox
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron conversaciones' : 'No tienes mensajes aún'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <button
                      key={`${conv.project_id}-${conv.other_user_id}`}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?.project_id === conv.project_id &&
                        selectedConversation?.other_user_id === conv.other_user_id
                          ? 'bg-muted'
                          : ''
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(conv.other_user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate">
                              {conv.other_user_name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conv.last_message_at)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.project_title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="hidden md:flex flex-1 flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(selectedConversation.other_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.other_user_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.project_title}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button variant="gold" size="icon" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-muted-foreground">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inbox;
