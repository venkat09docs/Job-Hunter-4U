import { useState, useEffect } from 'react';
import { useToolChats } from '@/hooks/useToolChats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Trash2, FileText, Edit2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolNotesSidebarProps {
  toolId: string;
}

export const ToolNotesSidebar = ({ toolId }: ToolNotesSidebarProps) => {
  const { chats: toolChats, loading, createChat: createToolChat, updateChat: updateToolChat, deleteChat: deleteToolChat } = useToolChats(toolId);
  const { toast } = useToast();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.messages[0]?.content || '');
    }
  }, [selectedNote]);

  useEffect(() => {
    if (editingNote) {
      setNoteTitle(editingNote.title);
      setNoteContent(editingNote.messages[0]?.content || '');
    }
  }, [editingNote]);

  const handleCreateNote = () => {
    setIsCreating(true);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both title and content',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isCreating) {
        await createToolChat(noteTitle, [{ 
          id: Date.now().toString(),
          type: 'user',
          content: noteContent,
          timestamp: new Date().toISOString()
        }]);
        setIsCreating(false);
      } else if (selectedNote) {
        await updateToolChat(selectedNote.id, { 
          title: noteTitle,
          messages: [{ 
            id: Date.now().toString(),
            type: 'user',
            content: noteContent,
            timestamp: new Date().toISOString()
          }]
        });
      }
      
      setIsEditing(false);
      setSelectedNote(null);
      setNoteTitle('');
      setNoteContent('');
      toast({
        title: 'Success',
        description: 'Note saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteToolChat(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setNoteTitle('');
        setNoteContent('');
        setIsEditing(false);
      }
      toast({
        title: 'Success',
        description: 'Note deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  const handleSelectNote = (note: any) => {
    setViewingNote(note);
    setIsViewDialogOpen(true);
  };

  const handleViewNote = (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingNote(note);
    setIsViewDialogOpen(true);
  };

  const handleEditNote = (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(note);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both title and content',
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateToolChat(editingNote.id, { 
        title: noteTitle,
        messages: [{ 
          id: Date.now().toString(),
          type: 'user',
          content: noteContent,
          timestamp: new Date().toISOString()
        }]
      });
      
      setIsEditDialogOpen(false);
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      toast({
        title: 'Success',
        description: 'Note updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive'
      });
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  return (
    <div className="w-full lg:w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Notes</h3>
          <Button
            size="sm"
            onClick={handleCreateNote}
            disabled={isEditing}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Note
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Save your thoughts and references for this tool
        </p>
      </div>

      {/* Notes List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading notes...
              </div>
            ) : toolChats.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-xs">Create your first note</p>
              </div>
            ) : (
              toolChats.map((note) => (
                 <Card 
                   key={note.id} 
                   className={`cursor-pointer transition-colors hover:bg-accent group ${
                     selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                   }`}
                   onClick={() => handleSelectNote(note)}
                 >
                   <CardHeader className="p-3">
                     <div className="flex items-start justify-between">
                       <div className="flex-1 min-w-0">
                         <CardTitle className="text-sm font-medium truncate">
                           {note.title}
                         </CardTitle>
                         <p className="text-xs text-muted-foreground mt-1">
                           {new Date(note.created_at).toLocaleDateString()}
                         </p>
                       </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleEditNote(note, e)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <Trash2 className="w-3 h-3" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Note</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to delete this note? This action cannot be undone.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </div>
                     </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Note Creator */}
        {isCreating && (
          <div className="border-t bg-background p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">New Note</h4>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Write your notes here... You can copy and paste content from chats or add your own thoughts."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[120px] text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  className="flex-1"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNoteTitle('');
                    setNoteContent('');
                    setSelectedNote(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {viewingNote?.title}
            </DialogTitle>
            {viewingNote && (
              <p className="text-sm text-muted-foreground">
                Created: {new Date(viewingNote.created_at).toLocaleDateString()}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-4">
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="bg-muted/50 p-6 rounded-md border mr-4">
                <p className="text-base whitespace-pre-wrap leading-relaxed">
                  {viewingNote?.messages[0]?.content || 'No content'}
                </p>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Edit Note</DialogTitle>
            {editingNote && (
              <p className="text-sm text-muted-foreground">
                Created: {new Date(editingNote.created_at).toLocaleDateString()}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-4 space-y-4">
            <Input
              placeholder="Note title..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="text-base flex-shrink-0"
            />
            <div className="flex-1 overflow-hidden">
              <Textarea
                placeholder="Write your notes here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full h-full resize-none text-base leading-relaxed p-4"
                style={{ height: 'calc(60vh - 120px)', minHeight: '300px' }}
              />
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-3 pt-4 border-t">
            <Button onClick={handleSaveEditNote} className="flex-1 h-11">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleCloseEditDialog} className="h-11 px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};