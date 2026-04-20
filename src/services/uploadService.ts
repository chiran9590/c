import { supabase } from '../lib/supabase';

export interface UploadData {
  club_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export class UploadService {
  private cloudflareWorkerUrl: string;

  constructor() {
    this.cloudflareWorkerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
  }

  // Upload file to Cloudflare R2 and store metadata in Supabase
  async uploadFile(clubId: string, file: File): Promise<UploadResponse> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create folder path for club
      const clubFolder = `club-${clubId}`;
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${clubFolder}/${fileName}`;

      // Upload to Cloudflare R2 via worker
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', filePath);

      const uploadResponse = await fetch(`${this.cloudflareWorkerUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return { success: false, error: `Upload failed: ${errorText}` };
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || 'Upload failed' };
      }

      // Store metadata in Supabase
      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{
          club_id: clubId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id
        }]);

      if (dbError) {
        return { success: false, error: `Database error: ${dbError.message}` };
      }

      return { 
        success: true, 
        fileUrl: uploadResult.fileUrl || `${this.cloudflareWorkerUrl}/files/${filePath}`
      };

    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed due to network error' };
    }
  }

  // Get all uploads for a club
  async getClubUploads(clubId: string): Promise<{ uploads: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        return { uploads: null, error: error.message };
      }

      return { uploads: data, error: null };
    } catch (error) {
      return { uploads: null, error: 'Failed to fetch uploads' };
    }
  }

  // Get all uploads (admin only)
  async getAllUploads(): Promise<{ uploads: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          clubs (
            name
          ),
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { uploads: null, error: error.message };
      }

      return { uploads: data, error: null };
    } catch (error) {
      return { uploads: null, error: 'Failed to fetch uploads' };
    }
  }

  // Delete upload
  async deleteUpload(uploadId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get upload details first
      const { data: uploadData, error: fetchError } = await supabase
        .from('uploads')
        .select('file_path')
        .eq('id', uploadId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Delete from Cloudflare R2
      const deleteResponse = await fetch(`${this.cloudflareWorkerUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: uploadData.file_path }),
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.warn('Failed to delete file from Cloudflare:', errorText);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', uploadId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to delete upload' };
    }
  }

  // Get file URL for download/viewing
  getFileUrl(filePath: string): string {
    return `${this.cloudflareWorkerUrl}/files/${filePath}`;
  }
}

export const uploadService = new UploadService();
