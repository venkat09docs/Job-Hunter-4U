import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertCircle } from 'lucide-react';

interface VideoEmbedComponentProps {
  videoUrl: string;
  onChange: (url: string) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
}

export const VideoEmbedComponent: React.FC<VideoEmbedComponentProps> = ({
  videoUrl,
  onChange,
  duration,
  onDurationChange
}) => {
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube URL patterns
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1`;
    }

    // Vimeo URL patterns
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
    }

    // Loom URL patterns
    const loomRegex = /(?:https?:\/\/)?(?:www\.)?(?:loom\.com\/share\/)([a-zA-Z0-9]+)/;
    const loomMatch = url.match(loomRegex);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
    }

    // Return original URL if no pattern matches (direct embed)
    return url;
  };

  const isValidVideoUrl = (url: string) => {
    if (!url) return false;
    
    const patterns = [
      /youtube\.com\/watch\?v=/,
      /youtu\.be\//,
      /youtube\.com\/embed\//,
      /vimeo\.com\/[0-9]+/,
      /loom\.com\/share\//,
      /\.mp4$/,
      /\.webm$/,
      /\.ogg$/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="video-url">Video URL</Label>
          <Input
            id="video-url"
            type="url"
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            value={videoUrl}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Supports YouTube, Vimeo, Loom, and direct video file URLs
          </p>
        </div>
        
        {onDurationChange && (
          <div>
            <Label htmlFor="video-duration">Duration (minutes)</Label>
            <Input
              id="video-duration"
              type="number"
              placeholder="15"
              value={duration || ''}
              onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
              className="mt-1"
              min="0"
            />
          </div>
        )}
      </div>

      {videoUrl && !isValidVideoUrl(videoUrl) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please enter a valid video URL. Supported platforms: YouTube, Vimeo, Loom, or direct video file links.
          </AlertDescription>
        </Alert>
      )}

      {embedUrl && isValidVideoUrl(videoUrl) && (
        <div 
          className="space-y-2"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
        >
          <Label>Video Preview</Label>
          <div 
            className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          >
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
              title="Video Preview"
              style={{ 
                border: 'none'
              }}
            />
            {/* Strategic overlays matching CourseContentView */}
            <div 
              className="absolute"
              style={{
                top: '10px',
                left: '10px',
                width: '120px',
                height: '50px',
                zIndex: 1000,
                background: 'transparent',
                pointerEvents: 'auto'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute"
              style={{
                top: '10px',
                right: '10px',
                width: '60px',
                height: '60px',
                zIndex: 1000,
                background: 'transparent',
                pointerEvents: 'auto'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute"
              style={{
                bottom: '10px',
                right: '60px',
                width: '150px',
                height: '50px',
                zIndex: 1000,
                background: 'transparent',
                pointerEvents: 'auto'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute"
              style={{
                bottom: '55px',
                right: '10px',
                width: '200px',
                height: '40px',
                zIndex: 1000,
                background: 'transparent',
                pointerEvents: 'auto'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              iframe {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
              }
            `
          }} />
        </div>
      )}

      {!videoUrl && (
        <div className="flex items-center justify-center aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <Play className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Enter a video URL to see preview</p>
          </div>
        </div>
      )}
    </div>
  );
};