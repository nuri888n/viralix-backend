import { useState, useRef, createElement } from 'react';
import Layout from '../components/Layout';
import { uploadContent } from '../lib/api';
import { Upload, Calendar, Image, Video, FileText } from 'lucide-react';

export default function Content() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'Twitter' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'linkedin', name: 'LinkedIn' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadSuccess(false);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || selectedPlatforms.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caption', caption);
      formData.append('platforms', JSON.stringify(selectedPlatforms));

      if (scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        formData.append('scheduledAt', scheduledDateTime.toISOString());
      }

      await uploadContent(formData);
      setUploadSuccess(true);

      // Reset form
      setSelectedFile(null);
      setCaption('');
      setScheduledDate('');
      setScheduledTime('');
      setSelectedPlatforms([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Content Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Upload and schedule your social media content
            </p>
          </div>
        </div>

        <div className="mt-8">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Content</h3>

              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media File
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-3">
                        {createElement(getFileIcon(selectedFile), { className: "h-8 w-8 text-gray-400" })}
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900">Click to upload</p>
                          <p className="text-sm text-gray-500">PNG, JPG, MP4 up to 10MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Write your caption here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Platforms
                  </label>
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <label key={platform.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={() => handlePlatformToggle(platform.id)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{platform.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Schedule Date (optional)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="date"
                        id="date"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                      Schedule Time (optional)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="time"
                        id="time"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {uploadSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">Content uploaded successfully!</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!selectedFile || selectedPlatforms.length === 0 || uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : scheduledDate && scheduledTime ? 'Schedule Post' : 'Post Now'}
                </button>
              </div>
            </div>
          </form>

          {/* Recent Posts */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Posts
              </h3>
              <div className="text-sm text-gray-500">
                <p>No recent posts yet. Upload your first content above!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}