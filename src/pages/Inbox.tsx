import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Send, Plus, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ConversationRole = 'client' | 'consultant';

interface CordadaConversationTarget {
  cordada_id: string;
  cordada_title: string;
  other_user_id: string;
  other_user_name: string;
  role: ConversationRole;
}

interface Conversation extends CordadaConversationTarget {
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface CordadaMessage {
  id: string;
  cordada_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Inbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<CordadaMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // New conversation dialog
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<CordadaConversationTarget[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('');
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadAll();
    const channel = supabase
      .channel('cordada-messages-inbox')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cordada_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          void fetchConversations(availableTargets);
          if (selectedConversation) {
            void fetchMessages(selectedConversation.cordada_id, selectedConversation.other_user_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAll = async () => {
    const targets = await fetchAvailableTargets();
    setAvailableTargets(targets);
    await fetchConversations(targets);
  };

  const fetchAvailableTargets = async (): Promise<CordadaConversationTarget[]> => {
    if (!user) return [];
    setLoadingTargets(true);
    const targets: CordadaConversationTarget[] = [];

    try {
      // As client: cordadas I own + their members
      const { data: myCordadas } = await supabase
        .from('cordadas')
        .select('id, title')
        .eq('client_id', user.id);

      if (myCordadas && myCordadas.length > 0) {
        const ids = myCordadas.map((c) => c.id);
        const { data: mems } = await supabase
          .from('cordada_members')
          .select('cordada_id, consultant:consultant_applications(user_id, full_name)')
          .in('cordada_id', ids);

        (mems || []).forEach((m: any) => {
          const cordada = myCordadas.find((c) => c.id === m.cordada_id);
          const ca = m.consultant;
          if (!cordada || !ca?.user_id) return;
          targets.push({
            cordada_id: cordada.id,
            cordada_title: cordada.title,
            other_user_id: ca.user_id,
            other_user_name: ca.full_name || 'Consultor',
            role: 'client',
          });
        });
      }

      // As consultant: cordadas I'm a member of + their client
      const { data: appRows } = await supabase.rpc('get_my_consultant_application');
      const app = Array.isArray(appRows) ? appRows[0] : null;

      if (app?.id) {
        const { data: myMems } = await supabase
          .from('cordada_members')
          .select('cordada:cordadas(id, title, client_id, client_name, client_company)')
          .eq('consultant_id', app.id);

        (myMems || []).forEach((m: any) => {
          const c = m.cordada;
          if (!c?.id || !c?.client_id) return;
          targets.push({
            cordada_id: c.id,
            cordada_title: c.title,
            other_user_id: c.client_id,
            other_user_name: c.client_company || c.client_name || 'Cliente',
            role: 'consultant',
          });
        });
      }
    } catch (error) {
      console.error('Error fetching conversation targets:', error);
    }

    setLoadingTargets(false);
    return targets;
  };

  const fetchConversations = async (targets: CordadaConversationTarget[]) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cordada_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cordada messages:', error);
      setLoading(false);
      return;
    }

    const targetMap = new Map<string, CordadaConversationTarget>();
    targets.forEach((t) => targetMap.set(`${t.cordada_id}-${t.other_user_id}`, t));

    const convMap = new Map<string, Conversation>();
    (data || []).forEach((msg) => {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      const key = `${msg.cordada_id}-${otherId}`;

      if (!convMap.has(key)) {
        const target = targetMap.get(key);
        convMap.set(key, {
          cordada_id: msg.cordada_id,
          cordada_title: target?.cordada_title || 'Cordada',
          other_user_id: otherId,
          other_user_name: target?.other_user_name || 'Usuario',
          role: target?.role || 'client',
          last_message: msg.message,
          last_message_at: msg.created_at,
          unread_count: 0,
        });
      }

      const conv = convMap.get(key)!;
      if (!msg.is_read && msg.recipient_id === user.id) {
        conv.unread_count++;
      }
    });

    setConversations(Array.from(convMap.values()));
    setLoading(false);
  };

  const fetchMessages = async (cordadaId: string, otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('cordada_messages')
      .select('*')
      .eq('cordada_id', cordadaId)
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as CordadaMessage[]);

      await supabase
        .from('cordada_messages')
        .update({ is_read: true })
        .eq('cordada_id', cordadaId)
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    void fetchMessages(conv.cordada_id, conv.other_user_id);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const trimmed = newMessage.trim();
    if (trimmed.length > 10000) {
      toast({
        title: 'Mensaje demasiado largo',
        description: 'El máximo son 10.000 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('cordada_messages').insert({
      cordada_id: selectedConversation.cordada_id,
      sender_id: user.id,
      recipient_id: selectedConversation.other_user_id,
      message: trimmed,
    });

    if (error) {
      toast({
        title: 'No se pudo enviar el mensaje',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setNewMessage('');
    void fetchMessages(selectedConversation.cordada_id, selectedConversation.other_user_id);
    void fetchConversations(availableTargets);
  };

  const handleStartNewConversation = () => {
    if (!user || !selectedTargetKey) return;

    const target = availableTargets.find(
      (t) => `${t.cordada_id}-${t.other_user_id}` === selectedTargetKey
    );
    if (!target) return;

    const existing = conversations.find(
      (c) => c.cordada_id === target.cordada_id && c.other_user_id === target.other_user_id
    );

    if (existing) {
      setSelectedConversation(existing);
      void fetchMessages(existing.cordada_id, existing.other_user_id);
    } else {
      const placeholder: Conversation = {
        ...target,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      };
      setSelectedConversation(placeholder);
      setMessages([]);
    }

    setShowNewConversation(false);
    setSelectedTargetKey('');
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

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.cordada_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTargetsFiltered = availableTargets.filter(
    (t) =>
      !conversations.some(
        (c) => c.cordada_id === t.cordada_id && c.other_user_id === t.other_user_id
      )
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex h-full gap-4">
          {/* Conversations List */}
          <Card className="w-full md:w-96 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Inbox
                </CardTitle>
                <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Nueva
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Nueva Conversación
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Elige una cordada para iniciar una conversación con el cliente o consultor asociado.
                      </p>
                      {loadingTargets ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Cargando cordadas...
                        </div>
                      ) : availableTargets.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No tienes cordadas con contrapartes disponibles.
                        </div>
                      ) : availableTargetsFiltered.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Ya tienes conversaciones con todas las contrapartes de tus cordadas.
                        </div>
                      ) : (
                        <>
                          <Select value={selectedTargetKey} onValueChange={setSelectedTargetKey}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una cordada" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border">
                              {availableTargetsFiltered.map((t) => {
                                const key = `${t.cordada_id}-${t.other_user_id}`;
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{t.cordada_title}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {t.role === 'client'
                                          ? `Consultor: ${t.other_user_name}`
                                          : `Cliente: ${t.other_user_name}`}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handleStartNewConversation}
                            disabled={!selectedTargetKey}
                            className="w-full"
                          >
                            Iniciar Conversación
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                  <p className="text-muted-foreground mb-3">
                    {searchTerm ? 'No se encontraron conversaciones' : 'No tienes mensajes aún'}
                  </p>
                  {!searchTerm && availableTargets.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowNewConversation(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Iniciar conversación
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <button
                      key={`${conv.cordada_id}-${conv.other_user_id}`}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?.cordada_id === conv.cordada_id &&
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
                            {conv.cordada_title}
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
                        {selectedConversation.cordada_title}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        Inicia la conversación enviando un mensaje
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
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
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender_id === user?.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      maxLength={10000}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
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
                <p className="text-muted-foreground mb-4">
                  Elige una conversación de la lista o inicia una nueva
                </p>
                {availableTargets.length > 0 && (
                  <Button variant="outline" onClick={() => setShowNewConversation(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva conversación
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inbox;
