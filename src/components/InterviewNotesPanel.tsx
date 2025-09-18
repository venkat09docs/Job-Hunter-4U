import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useInterviewNotes, type InterviewNote } from "@/hooks/useInterviewNotes";

interface InterviewNotesPanelProps {
  className?: string;
}

export const InterviewNotesPanel = ({ className = "" }: InterviewNotesPanelProps) => {
  const { notes, createNote, updateNote, deleteNote, isCreating, isUpdating, isDeleting } = useInterviewNotes();
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleStartEdit = (note: InterviewNote) => {
    setEditingNote(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || "");
  };

  const handleSaveEdit = () => {
    if (editingNote && editTitle.trim()) {
      updateNote({
        id: editingNote,
        title: editTitle.trim(),
        content: editContent,
      });
      setEditingNote(null);
      setEditTitle("");
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleAddNote = () => {
    if (newTitle.trim()) {
      createNote({
        title: newTitle.trim(),
        content: newContent,
      });
      setNewTitle("");
      setNewContent("");
      setShowAddForm(false);
    }
  };

  const handleCancelAdd = () => {
    setNewTitle("");
    setNewContent("");
    setShowAddForm(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex flex-col h-full bg-card border-l ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Interview Notes</h3>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={showAddForm}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {/* Add Note Form */}
          {showAddForm && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <Input
                  placeholder="Note title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-sm"
                />
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your note here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleAddNote}
                    size="sm"
                    disabled={!newTitle.trim() || isCreating}
                    className="flex-1"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelAdd}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes List */}
          {notes.map((note) => (
            <Card key={note.id} className="bg-background">
              <CardHeader className="pb-2">
                {editingNote === note.id ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-sm font-medium"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {note.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleStartEdit(note)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => deleteNote(note.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editingNote === note.id ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] text-sm resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={handleSaveEdit}
                        size="sm"
                        disabled={!editTitle.trim() || isUpdating}
                        className="flex-1"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {note.content && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTime(note.created_at)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          {notes.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No notes yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first note
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};