import React, { useState, useEffect, useRef } from 'react';
import { Upload, Folder, AlertCircle, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';
import { cloudflareR2Service, UploadProgress, UploadOptions, BatchUploadOptions } from '../services/cloudflareR2Service';

interface Club {
  id: string;
  club_name: string;
  created_at: string;
}

const UploadSection: React.FC = () => {
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
  const [folderStatus, setFolderStatus] = useState<{ exists: boolean; checking: boolean }>({ exists: false, checking: false });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) {
      checkFolderExists();
    }
  }, [selectedClub]);

  const checkFolderExists = async () => {
    if (!selectedClub) return;
    
    try {
      setFolderStatus({ exists: false, checking: true });
      const result = await cloudflareR2Service.checkFolderExists(selectedClub);
      
      if (result.error) {
        console.error('Folder check failed:', result.error);
        setFolderStatus({ exists: false, checking: false });
        return;
      }
      
      setFolderStatus({ exists: result.exists, checking: false });
      
      if (!result.exists) {
        showSuccess('Folder Status', `No folder found for ${selectedClub}. It will be created during upload.`);
      } else {
        showSuccess('Folder Status', `Folder exists for ${selectedClub} in Cloudflare R2.`);
      }
    } catch (error) {
      console.error('Folder check error:', error);
      setFolderStatus({ exists: false, checking: false });
    }
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name, created_at')
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
      console.log(`Starting upload of ${files.length} files to club: ${selectedClub}`);
      
      // Check if folder exists, create if it doesn't
      if (!folderStatus.exists) {
        console.log(`Creating folder for ${selectedClub} as it doesn't exist`);
        const createResult = await cloudflareR2Service.createFolder(selectedClub);
        
        if (createResult.error) {
          showError('Folder Creation Failed', createResult.error);
          return;
        }
        
        showSuccess('Folder Created', `Folder created for ${selectedClub}`);
      }
      
      const options: BatchUploadOptions = {
        clubName: selectedClub,
        batchSize: 50,
        maxConcurrent: 3,
        onProgress: (progress) => {
          console.log('Upload progress:', progress);
          setTilesProgress(progress);
        },
        signal: abortController.signal,
      };

      const result = await cloudflareR2Service.uploadTiles(files, options);
      console.log('Upload result:', result);

      if (result.success) {
        showSuccess('Success', `${result.uploaded} tiles uploaded successfully to ${selectedClub}/tiles/`);
        setTilesFolder(null);
        setTilesProgress(null);
      } else {
        console.error('Upload failed:', result.error);
        showError('Upload Failed', result.error || 'Failed to upload tiles');
      }
    } catch (error) {
      console.error('Tiles upload error:', error);
      showError('Upload Error', 'Failed to upload tiles - Check Cloudflare Worker configuration');
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
        <h1 className="text-3xl font-bold text-gray-900">Upload Section</h1>
        <p className="text-gray-600 mt-2">Upload metadata and tiles to Cloudflare R2 storage</p>
      </div>

      {/* 1. SELECT CLUB */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Club</h2>
        
        <div className="flex items-center">
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
          >
            <option value="">Select a club...</option>
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
        
        {selectedClub && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {folderStatus.checking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : folderStatus.exists ? (
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
              ) : (
                <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {folderStatus.checking 
                    ? 'Checking folder status...' 
                    : folderStatus.exists 
                      ? `Folder exists for ${selectedClub}` 
                      : `Folder will be created for ${selectedClub}`
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Cloudflare R2: maptiles/{selectedClub}/
                </p>
              </div>
            </div>
          </div>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiles Upload (Folder)</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tiles Folder
            </label>
            <div className="relative">
              <input
                type="file"
                ref={(el) => {
                  if (el) {
                    el.setAttribute('webkitdirectory', '');
                    el.setAttribute('multiple', 'true');
                  }
                }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setTilesFolder(files);
                    setErrors({});
                  }
                }}
                className="block w-full text-sm text-gray-900 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:pl-4"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Folder className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Accepts large number of images (~4500 files) - Select entire folder
            </p>
            {tilesFolder && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Folder className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Folder Selected: {tilesFolder.length} files ready for upload
                    </p>
                    <p className="text-xs text-green-600">
                      Files will be uploaded to: {selectedClub || 'selected club'}/tiles/
                    </p>
                  </div>
                </div>
              </div>
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

export default UploadSection;
