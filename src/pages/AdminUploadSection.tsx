import React, { useState, useEffect, useRef } from 'react';
import { Upload, Folder, AlertCircle, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';
import { cloudflareR2Service, UploadProgress, UploadOptions, BatchUploadOptions } from '../services/cloudflareR2Service';

interface Club {
  id: string;
  club_name: string;
  slug: string;
  created_at: string;
}

const AdminUploadSection: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [tilesFolder, setTilesFolder] = useState<FileList | null>(null);
  const [metadataProgress, setMetadataProgress] = useState<UploadProgress | null>(null);
  const [tilesProgress, setTilesProgress] = useState<UploadProgress | null>(null);
  const [uploadingMetadata, setUploadingMetadata] = useState(false);
  const [uploadingTiles, setUploadingTiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name, slug, created_at')
        .order('club_name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      showError('Error', 'Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataUpload = async () => {
    if (!metadataFile || !selectedClub) return;

    try {
      setUploadingMetadata(true);
      setErrors({});

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const options: UploadOptions = {
        clubName: selectedClub,
        onProgress: (progress) => setMetadataProgress(progress),
        signal: abortController.signal,
      };

      const result = await cloudflareR2Service.uploadMetadata(metadataFile, options);

      if (result.success) {
        showSuccess('Success', 'Metadata uploaded successfully');
        setMetadataFile(null);
        setMetadataProgress(null);
      } else {
        showError('Upload Failed', result.error || 'Failed to upload metadata');
      }
    } catch (error) {
      console.error('Metadata upload error:', error);
      showError('Upload Error', 'Failed to upload metadata');
    } finally {
      setUploadingMetadata(false);
    }
  };

  const handleTilesUpload = async () => {
    if (!tilesFolder || !selectedClub) return;

    try {
      setUploadingTiles(true);
      setErrors({});

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const files = Array.from(tilesFolder);
      
      const options: BatchUploadOptions = {
        clubName: selectedClub,
        batchSize: 50,
        maxConcurrent: 3,
        onProgress: (progress) => setTilesProgress(progress),
        signal: abortController.signal,
      };

      const result = await cloudflareR2Service.uploadTiles(files, options);

      if (result.success) {
        showSuccess('Success', `${result.uploaded} tiles uploaded successfully`);
        setTilesFolder(null);
        setTilesProgress(null);
      } else {
        showError('Upload Failed', result.error || 'Failed to upload tiles');
      }
    } catch (error) {
      console.error('Tiles upload error:', error);
      showError('Upload Error', 'Failed to upload tiles');
    } finally {
      setUploadingTiles(false);
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadingMetadata(false);
    setUploadingTiles(false);
    setMetadataProgress(null);
    setTilesProgress(null);
  };

  const formatTime = (seconds: number): string => {
    return cloudflareR2Service.formatTimeRemaining(seconds);
  };

  const ProgressBar = ({ progress }: { progress: UploadProgress | null }) => {
    if (!progress) return null;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{progress.percentage.toFixed(1)}%</span>
          <span>{formatTime(progress.timeRemaining)} remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Tiles</h1>
        <p className="text-gray-600 mt-2">Upload PNG map tiles for a golf club to Cloudflare R2 storage</p>
      </div>

      {/* 1. SELECT GOLF CLUB */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Golf Club</h2>
        
        <div className="flex items-center">
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
          >
            <option value="">Select a golf club...</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.club_name}>
                {club.club_name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1 pointer-events-none" />
        </div>
        
        {errors.club && (
          <p className="mt-2 text-sm text-red-600">{errors.club}</p>
        )}
      </div>

      {/* 2. METADATA UPLOAD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Metadata Upload (File)</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Metadata File
            </label>
            <input
              type="file"
              accept=".json,.txt"
              onChange={(e) => setMetadataFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Accepts JSON or text files
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleMetadataUpload}
              disabled={!metadataFile || !selectedClub || uploadingMetadata}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingMetadata ? 'Uploading...' : 'Upload Metadata'}
            </button>
            
            {uploadingMetadata && (
              <button
                onClick={cancelUpload}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Cancel
              </button>
            )}
          </div>

          <ProgressBar progress={metadataProgress} />
        </div>
      </div>

      {/* 3. TILES UPLOAD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Tiles (Folder)</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tiles Folder
            </label>
            <input
              type="file"
              {...({ directory: '', multiple: true } as any)}
              onChange={(e) => setTilesFolder(e.target.files)}
              className="block w-full text-sm text-gray-900 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Accepts large number of images (~4500 files)
            </p>
            {tilesFolder && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {tilesFolder.length} files
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleTilesUpload}
              disabled={!tilesFolder || !selectedClub || uploadingTiles}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingTiles ? 'Uploading...' : 'Upload Tiles'}
            </button>
            
            {uploadingTiles && (
              <button
                onClick={cancelUpload}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Cancel
              </button>
            )}
          </div>

          <ProgressBar progress={tilesProgress} />
        </div>
      </div>

      {/* Error Display */}
      {errors.files && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{errors.files}</p>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {!selectedClub && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-800">Please select a club before uploading</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUploadSection;
