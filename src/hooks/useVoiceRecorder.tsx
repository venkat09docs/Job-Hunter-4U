import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const useVoiceRecorder = ({ onTranscriptionComplete }: UseVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting voice recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Try to get the best supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);

      toast({
        title: "🎤 Recording...",
        description: "Speak clearly and record for at least 2 seconds for best results.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      
      if (recordingDuration < 1500) {
        toast({
          title: "⚠️ Recording too short",
          description: "Please record for at least 2 seconds for accurate transcription.",
          variant: "destructive",
        });
        // Still stop the recording and clean up
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        return;
      }
      
      console.log(`🛑 Stopping recording after ${recordingDuration}ms...`);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Processing...",
        description: "Converting your speech to text...",
      });
    }
  }, [isRecording, toast]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      console.log('🔄 Converting audio to base64...');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      
      console.log('🤖 Sending to voice-to-text API...');

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('❌ Voice-to-text error:', error);
        throw error;
      }

      if (data?.text) {
        console.log('✅ Transcription received:', data.text);
        
        // Only show success if we got meaningful text (not just "you")
        if (data.text.trim().toLowerCase() === 'you') {
          toast({
            title: "⚠️ Poor audio quality",
            description: "Try speaking louder and closer to the microphone for at least 2-3 seconds.",
            variant: "destructive",
          });
        } else {
          onTranscriptionComplete(data.text);
          toast({
            title: "✅ Transcription complete",
            description: `"${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
          });
        }
      } else {
        throw new Error('No transcription received');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription failed",
        description: "Could not convert speech to text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};