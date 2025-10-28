import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Stop all tracks
          const tracks = mediaRecorderRef.current?.stream.getTracks() || [];
          tracks.forEach(track => track.stop());

          // Create blob from recorded chunks
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob created, size:', audioBlob.size);

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              console.log('Sending audio to transcription service...');
              const { data, error } = await supabase.functions.invoke('voice-to-text-assignment', {
                body: { audio: base64Audio }
              });

              if (error) {
                throw error;
              }

              console.log('Transcription received:', data.text);
              setIsProcessing(false);
              resolve(data.text);
            } catch (error) {
              console.error('Error transcribing audio:', error);
              toast({
                title: 'Transcription Error',
                description: 'Failed to convert speech to text. Please try again.',
                variant: 'destructive',
              });
              setIsProcessing(false);
              resolve(null);
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: 'Error',
            description: 'Failed to process audio recording.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
    chunksRef.current = [];
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
