/**
 * Base64 Demo Component
 * Demonstrates the application's ability to handle base64-encoded images
 */

import { useState } from 'react';
import { base64ToFile } from '../utils/fileUtils';
import { useToast } from '../hooks/useToast';

const Base64Demo = ({ onUpload }) => {
  const [base64Input, setBase64Input] = useState('');
  const [filename, setFilename] = useState('base64_image');
  const { showErrorToast, showSuccessToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!base64Input.trim()) {
      showErrorToast('Please enter a base64 image string');
      return;
    }

    // Ensure the input is a valid base64 data URI
    let dataUri = base64Input.trim();
    let isRawBase64 = false;

    // Check if it's already a data URI
    if (!dataUri.startsWith('data:')) {
      isRawBase64 = true;
      // Check if it's a valid base64 string
      try {
        // Test if it's valid base64 by trying to decode a small part
        // This will throw an error if it's not valid base64
        const testPart = dataUri.substring(0, Math.min(100, dataUri.length));
        atob(testPart);

        // If we get here, it's valid base64, so add the data URI prefix
        dataUri = `data:image/png;base64,${dataUri}`;
        console.log('Converted to data URI:', dataUri.substring(0, 50) + '...');
      } catch (error) {
        console.error('Base64 validation error:', error);
        showErrorToast('Invalid base64 string format. Please provide a valid base64 encoded image.');
        return;
      }
    }

    console.log('Processing base64 string:', isRawBase64 ? 'Raw base64' : 'Data URI');

    // Convert base64 to File
    const file = base64ToFile(dataUri, filename);

    if (!file) {
      showErrorToast('Failed to convert base64 to file. The base64 string may be invalid or corrupted.');
      return;
    }

    // Upload the file
    const success = await onUpload(file);

    if (success) {
      showSuccessToast('Base64 image uploaded successfully!');
      setBase64Input('');
      setFilename('base64_image');
    }
  };

  return (
    <div className="base64-demo">
      <h3>Base64 Image Upload Demo</h3>
      <div className="info-box">
        <p>
          <strong>Instructions:</strong> Paste a base64-encoded image string below. You can include the
          data URI prefix (<code>data:image/jpeg;base64,</code>) or just the base64 string itself.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="filename">Filename:</label>
          <input
            type="text"
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Enter filename (without extension)"
          />
          <small className="form-hint">Extension will be added automatically based on the image type</small>
        </div>
        <div className="form-group">
          <label htmlFor="base64Input">Base64 Image Data:</label>
          <textarea
            id="base64Input"
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
            placeholder="Paste base64 image data here (data:image/... or just the base64 string)"
            rows={5}
          />
          <small className="form-hint">For example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...</small>
        </div>
        <button type="submit" className="btn-primary">
          Upload Base64 Image
        </button>
      </form>

      {base64Input && (
        <div className="preview">
          <h4>Preview:</h4>
          {base64Input.startsWith('data:image/') ? (
            <div className="image-preview-container">
              <img
                src={base64Input}
                alt="Base64 Preview"
                style={{ maxWidth: '100%', maxHeight: '200px' }}
                onError={(e) => {
                  console.error('Image preview error with data URI');
                  e.target.style.display = 'none';
                  showErrorToast('Invalid image data. Cannot preview.');
                }}
              />
            </div>
          ) : base64Input.length > 50 ? (
            <div className="image-preview-container">
              <p className="preview-note">Attempting to preview with added data URI prefix...</p>
              <img
                src={`data:image/jpeg;base64,${base64Input}`}
                alt="Base64 Preview (JPEG)"
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'none' }}
                onLoad={(e) => {
                  console.log('JPEG preview loaded successfully');
                  e.target.style.display = 'block';
                }}
                onError={(e) => {
                  console.error('JPEG preview failed, trying PNG');
                  // Keep hidden, will try PNG next
                }}
              />
              <img
                src={`data:image/png;base64,${base64Input}`}
                alt="Base64 Preview (PNG)"
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'none' }}
                onLoad={(e) => {
                  console.log('PNG preview loaded successfully');
                  e.target.style.display = 'block';
                }}
                onError={(e) => {
                  console.error('PNG preview failed, trying GIF');
                  // Keep hidden, will try GIF next
                }}
              />
              <img
                src={`data:image/gif;base64,${base64Input}`}
                alt="Base64 Preview (GIF)"
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'none' }}
                onLoad={(e) => {
                  console.log('GIF preview loaded successfully');
                  e.target.style.display = 'block';
                }}
                onError={(e) => {
                  console.error('All image format previews failed');
                  showErrorToast('Cannot preview. The base64 string may be invalid or not an image format.');
                }}
              />
            </div>
          ) : (
            <p>Enter a longer base64 string to see a preview</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Base64Demo;
