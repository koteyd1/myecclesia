import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image, Video, Info, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateImageFile, sanitizeFileName } from '@/utils/imageValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface EventMediaUploadProps {
  currentImageUrl?: string;
  onImageUrlChange: (url: string) => void;
  additionalMedia?: MediaItem[];
  onAdditionalMediaChange?: (media: MediaItem[]) => void;
  label?: string;
}

const RECOMMENDED_DIMENSIONS = {
  width: 1200,
  height: 630,
  aspectRatio: '1.91:1'
};

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export function EventMediaUpload({ 
  currentImageUrl, 
  onImageUrlChange, 
  additionalMedia = [],
  onAdditionalMediaChange,
  label = "Event Image"
}: EventMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { toast } = useToast();

  const validateVideoFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Invalid video format. Please upload MP4, WebM, or MOV files.' };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return { isValid: false, error: 'Video file must be less than 50MB.' };
    }
    return { isValid: true };
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    isMainImage: boolean = true
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedMedia: MediaItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `${file.name} is not a valid image or video file.`
          });
          continue;
        }

        // Validate based on type
        if (isImage) {
          const validation = await validateImageFile(file);
          if (!validation.isValid) {
            toast({
              variant: "destructive",
              title: "Invalid image",
              description: validation.errors[0]
            });
            continue;
          }
        } else if (isVideo) {
          const validation = validateVideoFile(file);
          if (!validation.isValid) {
            toast({
              variant: "destructive",
              title: "Invalid video",
              description: validation.error
            });
            continue;
          }
        }

        // Upload file
        const fileExt = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
        const sanitizedBaseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
        const fileName = `${sanitizedBaseName}_${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const folder = isVideo ? 'videos' : 'images';
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        if (isMainImage && i === 0) {
          onImageUrlChange(publicUrl);
        } else {
          uploadedMedia.push({
            url: publicUrl,
            type: isVideo ? 'video' : 'image'
          });
        }
      }

      // Add additional media if any
      if (uploadedMedia.length > 0 && onAdditionalMediaChange) {
        onAdditionalMediaChange([...additionalMedia, ...uploadedMedia]);
      }

      toast({
        title: "Success!",
        description: `${files.length} file(s) uploaded successfully.`
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Failed to upload: ${error?.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveMainImage = () => {
    onImageUrlChange('');
  };

  const handleRemoveAdditionalMedia = (index: number) => {
    if (onAdditionalMediaChange) {
      const updated = additionalMedia.filter((_, i) => i !== index);
      onAdditionalMediaChange(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dimension Guidelines */}
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong className="block mb-1">Recommended Image Dimensions:</strong>
          <span className="text-muted-foreground">
            {RECOMMENDED_DIMENSIONS.width} × {RECOMMENDED_DIMENSIONS.height} pixels 
            (aspect ratio {RECOMMENDED_DIMENSIONS.aspectRatio})
          </span>
          <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
            <li>Images: JPEG, PNG, WebP, GIF (max 5MB)</li>
            <li>Videos: MP4, WebM, MOV (max 50MB)</li>
            <li>Use landscape orientation for best display</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Main Event Image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          {label} (Main/Featured)
        </Label>
        
        <div className="flex gap-2">
          <Input
            type="url"
            value={currentImageUrl || ''}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => document.getElementById('main-image-upload')?.click()}
            >
              {isUploading ? (
                uploadProgress || "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            
            {currentImageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveMainImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {currentImageUrl && (
          <div className="mt-2 relative inline-block">
            <img 
              src={currentImageUrl} 
              alt="Main event image preview" 
              className="w-40 h-24 object-cover rounded-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              Main Image
            </span>
          </div>
        )}

        <input
          id="main-image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, true)}
          className="hidden"
        />
      </div>

      {/* Additional Images & Videos */}
      {onAdditionalMediaChange && (
        <div className="space-y-2 pt-4 border-t">
          <Label className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Additional Images & Videos (Optional)
          </Label>
          
          <p className="text-sm text-muted-foreground">
            Add more photos or videos to showcase your event. You can upload multiple files at once.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => document.getElementById('additional-media-upload')?.click()}
              className="flex-1 sm:flex-initial"
            >
              <Image className="h-4 w-4 mr-2" />
              Add Images
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => document.getElementById('video-upload')?.click()}
              className="flex-1 sm:flex-initial"
            >
              <Video className="h-4 w-4 mr-2" />
              Add Videos
            </Button>
          </div>

          <input
            id="additional-media-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, false)}
            className="hidden"
          />
          
          <input
            id="video-upload"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => handleFileUpload(e, false)}
            className="hidden"
          />

          {/* Media Grid */}
          {additionalMedia.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
              {additionalMedia.map((media, index) => (
                <div key={index} className="relative group">
                  {media.type === 'image' ? (
                    <img 
                      src={media.url} 
                      alt={`Event media ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded-lg border flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveAdditionalMedia(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded capitalize">
                    {media.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warning for dimension mismatch */}
      {currentImageUrl && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          Images not matching recommended dimensions may be cropped or stretched in some views.
        </p>
      )}
    </div>
  );
}
