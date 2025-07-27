import { useState } from 'react';
import { useToolChats } from '@/hooks/useToolChats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageSquare, Plus, Trash2, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolChatSidebarProps {
  toolId: string;
  currentMessages?: any[];
  onLoadChat?: (messages: any[]) => void;
}

export const ToolChatSidebar = ({ toolId, currentMessages = [], onLoadChat }: ToolChatSidebarProps) => {
  const { chats, loading, createChat, deleteChat, updateChat } = useToolChats(toolId);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a chat title',
        variant: 'destructive'
      });
      return;
    }

    const result = await createChat(newChatTitle, currentMessages);
    if (result) {
      setNewChatTitle('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleLoadChat = (chat: any) => {
    if (onLoadChat) {
      onLoadChat(chat.messages || []);
    }
  };

  const handleEditChat = async (chatId: string) => {
    if (!editTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid title',
        variant: 'destructive'
      });
      return;
    }

    await updateChat(chatId, { title: editTitle });
    setEditingChat(null);
    setEditTitle('');
  };

  const startEdit = (chat: any) => {
    setEditingChat(chat.id);
    setEditTitle(chat.title);
  };

  const cancelEdit = () => {
    setEditingChat(null);
    setEditTitle('');
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Chat History</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter chat title..."
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChat}>
                    Save Chat
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No saved chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {editingChat === chat.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleEditChat(chat.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="h-8"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEditChat(chat.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => handleLoadChat(chat)}
                        >
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">{chat.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(chat.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(chat)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{chat.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteChat(chat.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};