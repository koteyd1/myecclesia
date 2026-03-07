// Enhanced image validation utilities

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic number (file signature) validation
const MAGIC_NUMBERS = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
};

export const validateImageFile = async (file: File): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // Basic file validation
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images only');
  }
  
  // Magic number validation
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const isValidMagicNumber = Object.entries(MAGIC_NUMBERS).some(([mimeType, signature]) => {
      if (file.type === mimeType) {
        return signature.every((byte, index) => bytes[index] === byte);
      }
      return false;
    });
    
    if (!isValidMagicNumber && file.type !== 'image/gif') {
      // Note: GIF validation is more complex, so we skip it for now
      errors.push('File appears to be corrupted or not a valid image');
    }
  } catch (error) {
    errors.push('Unable to validate file integrity');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove or replace dangerous characters
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .slice(0, 100); // Limit length
};