import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateImageFile, sanitizeFileName } from '@/utils/imageValidation';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUrlChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({ 
  currentImageUrl, 
  onImageUrlChange, 
  label = "Image",
  placeholder = "https://example.com/image.jpg"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced security validation
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validation.errors[0]
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const sanitizedBaseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
      const fileName = `${sanitizedBaseName}_${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      onImageUrlChange(publicUrl);

      toast({
        title: "Success!",
        description: "Image uploaded successfully."
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Failed to upload image: ${error?.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUrlChange('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <Input
          type="url"
          value={currentImageUrl || ''}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
          >
            {isUploading ? (
              "Uploading..."
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
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {currentImageUrl && (
        <div className="mt-2">
          <img 
            src={currentImageUrl} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-md border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <input
        id={`file-upload-${label}`}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <p className="text-sm text-muted-foreground">
        Upload an image file (max 5MB) or enter a URL manually
      </p>
    </div>
  );
}