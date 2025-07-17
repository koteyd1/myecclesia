import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setUploadedUrl(data.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (uploadedUrl) {
      await navigator.clipboard.writeText(uploadedUrl);
      toast.success('URL copied to clipboard!');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Upload
        </CardTitle>
        <CardDescription>
          Upload your loader.io verification file or any other file to the server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>

        {uploadedUrl && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" />
              Upload Successful
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Public URL:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={uploadedUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this URL for loader.io verification or anywhere you need to reference the file
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">For loader.io verification:</p>
            <p>1. Upload your verification file here</p>
            <p>2. Copy the public URL</p>
            <p>3. Use this URL in loader.io to verify your domain</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};