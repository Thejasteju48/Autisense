import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * Video Upload Component
 * Handles pre-recorded video uploads with validation
 */
const VideoUploader = ({ 
  screeningId,
  onComplete,
  onBack 
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const MIN_DURATION = 120; // 2 minutes
  const MAX_DURATION = 300; // 5 minutes
  const ACCEPTED_FORMATS = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];

  // Validate video file
  const validateVideo = (file) => {
    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Invalid file format. Please upload MP4, WebM, AVI, or MOV files.';
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    
    return null;
  };

  // Get video duration
  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    setError(null);
    
    // Validate file
    const validationError = validateVideo(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      // Get video duration
      const duration = await getVideoDuration(file);
      setVideoDuration(duration);
      
      // Check duration
      if (duration < MIN_DURATION) {
        setError(`Video must be at least ${MIN_DURATION / 60} minutes long. Current: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`);
        return;
      }
      
      if (duration > MAX_DURATION) {
        setError(`Video should not exceed ${MAX_DURATION / 60} minutes. Current: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`);
        return;
      }
      
      setSelectedFile(file);
    } catch (err) {
      console.error('Error getting video duration:', err);
      setError('Failed to read video file. Please try another file.');
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Upload video to backend
  const handleUpload = async () => {
    if (!selectedFile || !screeningId) {
      setError('No file selected or screening ID missing');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('screeningId', screeningId);

      console.log('📤 Uploading video:', {
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        duration: `${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}`,
        screeningId
      });

      const response = await axios.post(
        `${BACKEND_URL}/api/screenings/${screeningId}/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      console.log('✅ Video uploaded successfully:', response.data);

      // Call onComplete with video data
      if (onComplete) {
        onComplete({
          videoSource: 'pre-recorded',
          videoData: response.data.videoData || response.data.features
        });
      }
    } catch (err) {
      console.error('❌ Video upload failed:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to upload video. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setVideoDuration(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Video
        </h2>
        <p className="text-lg text-gray-600">
          Select a pre-recorded video for behavioral analysis
        </p>
      </div>

      {/* Upload Area */}
      {!selectedFile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/avi,video/quicktime"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <CloudArrowUpIcon className={`
            w-16 h-16 mx-auto mb-4 transition-colors
            ${isDragging ? 'text-blue-500' : 'text-gray-400'}
          `} />

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isDragging ? 'Drop video here' : 'Drag and drop your video'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            or
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Files
          </button>

          <div className="mt-6 text-sm text-gray-500 space-y-1">
            <p>Accepted formats: MP4, WebM, AVI, MOV</p>
            <p>Duration: {MIN_DURATION / 60}-{MAX_DURATION / 60} minutes</p>
            <p>Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB</p>
          </div>
        </motion.div>
      ) : (
        /* Selected File Info */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentIcon className="w-8 h-8 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate mb-1">
                  {selectedFile.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Size: {formatFileSize(selectedFile.size)}</p>
                  <p>Duration: {formatDuration(videoDuration)}</p>
                  <p>Type: {selectedFile.type.split('/')[1].toUpperCase()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClear}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-blue-600 h-2 rounded-full transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload & Analyze
                </>
              )}
            </button>

            <button
              onClick={onBack}
              disabled={isUploading}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex gap-3">
          <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">Video Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Child's face should be clearly visible</li>
              <li>Good lighting throughout the video</li>
              <li>Stable camera position at eye level</li>
              <li>Natural behavior (avoid prompting)</li>
              <li>3-4 minutes duration recommended</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoUploader;
