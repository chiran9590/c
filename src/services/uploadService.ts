import { supabase } from '../lib/supabase';

export interface UploadRecord {
  id: string;
  club_id: string;
  file_name: string;
  file_key: string;
  file_url: string;
  uploaded_at: string;
  clubs?: {
    club_name: string;
    slug: string;
  };
}

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
}

export class UploadService {
  private signingServerUrl: string;

  constructor() {
    this.signingServerUrl = import.meta.env.VITE_SIGNING_SERVER_URL || 'http://localhost:4000';
  }

  private sanitizeBaseFileName(fileName: string): string {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    return withoutExt.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private async getClubSlug(clubId: string): Promise<{ slug: string | null; error: string | null }> {
    const { data, error } = await supabase
      .from('clubs')
      .select('slug')
      .eq('id', clubId)
      .single();

    if (error) {
      return { slug: null, error: error.message };
    }

    return { slug: data.slug, error: null };
  }

  async uploadPngTile(clubId: string, file: File): Promise<UploadResponse> {
    try {
      if (file.type !== 'image/png') {
        return { success: false, error: 'Only PNG files are allowed.' };
      }

      const { slug, error: slugError } = await this.getClubSlug(clubId);
      if (slugError || !slug) {
        return { success: false, error: slugError || 'Failed to resolve club slug.' };
      }

      const timestamp = Date.now();
      const safeName = this.sanitizeBaseFileName(file.name) || 'tile';
      const key = `${slug}/${timestamp}-${safeName}.png`;

      const signResponse = await fetch(`${this.signingServerUrl}/api/r2-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          contentType: 'image/png'
        })
      });

      if (!signResponse.ok) {
        const body = await signResponse.json().catch(() => null);
        return { success: false, error: body?.error || 'Failed to sign upload URL.' };
      }

      const { presignedUrl, publicUrl } = await signResponse.json();

      if (!presignedUrl || !publicUrl) {
        return { success: false, error: 'Signing server returned invalid response.' };
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        return { success: false, error: 'Failed uploading tile to R2.' };
      }

      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{
          club_id: clubId,
          file_name: file.name,
          file_key: key,
          file_url: publicUrl
        }]);

      if (dbError) {
        return { success: false, error: `Database error: ${dbError.message}` };
      }

      return { 
        success: true, 
        fileUrl: publicUrl,
        fileKey: key
      };

    } catch {
      return { success: false, error: 'Upload failed due to network error' };
    }
  }

  async getRecentUploads(limit = 20): Promise<{ uploads: UploadRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          clubs (
            club_name,
            slug
          )
        `)
        .order('uploaded_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { uploads: null, error: error.message };
      }

      return { uploads: data as UploadRecord[], error: null };
    } catch {
      return { uploads: null, error: 'Failed to fetch uploads' };
    }
  }

  async getClubUploads(clubId: string): Promise<{ uploads: UploadRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          clubs (
            club_name,
            slug
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        return { uploads: null, error: error.message };
      }

      return { uploads: data as UploadRecord[], error: null };
    } catch {
      return { uploads: null, error: 'Failed to fetch uploads' };
    }
  }
}

export const uploadService = new UploadService();
