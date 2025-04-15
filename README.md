# Media Gallery - Azure Blob Storage (COM682 Coursework 2 Part 2)

![Media Gallery Banner](https://github.com/kelcho-spense/Image_Gallery_Azure_Blob_storage-Educator_Developer_Blog-/assets/57180726/38761210-2d3f-4f48-b54f-d923c43b6773)

A modern, cloud-native media gallery application built with React and Azure Blob Storage. This application allows users to upload, view, and manage various media types including images, videos, and audio files. Developed as part of the COM682 Cloud Native Development module assessment.

## Features

- **Multi-media Support**: Upload and view images, videos, and audio files
- **Cloud Storage**: Leverages Azure Blob Storage for scalable, reliable cloud storage
- **Modern UI**: Clean, responsive design with dark/light mode support
- **Drag & Drop**: Easy file uploading with drag and drop functionality
- **Media Preview**: Preview images, videos, and audio files before uploading
- **Accessibility**: Built with accessibility in mind
- **Error Handling**: Robust error handling with user-friendly notifications
- **Optimized Performance**: Code optimized for efficiency and maintainability
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Interactive UI**: Engaging user interface with modern design elements

## Technology Stack

- **Frontend**: React.js with modern hooks and functional components
- **Styling**: CSS with custom properties for theming
- **Cloud Storage**: Azure Blob Storage
- **Build Tool**: Vite for fast development and optimized production builds

## Azure Blob Storage Integration

This application demonstrates how to integrate Azure Blob Storage into a React application. Azure Blob Storage is a cloud-based object storage solution that enables developers to store and manage unstructured data such as:

- Images and photos
- Video and audio files
- Documents and logs
- Backups and archives

The application uses the `@azure/storage-blob` SDK to interact with Azure Blob Storage, providing a seamless experience for uploading, viewing, and deleting media files.

## Prerequisites

1. **Azure Account**: You'll need an Azure subscription. Students can get free credits through [Azure for Students](https://azure.microsoft.com/en-us/free/students/)
2. **Azure Storage Account**: Create a storage account in the Azure Portal
3. **Node.js**: Version 14.x or higher
4. **npm or yarn**: For package management

## Setup and Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kelcho-spense/Image_Gallery_Azure_Blob_storage-Educator_Developer_Blog-.git
   cd Image_Gallery_Azure_Blob_storage-Educator_Developer_Blog-
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure Azure Storage**

   - Create a `.env` file in the root directory (use `.env.example` as a template)
   - Add your Azure Storage account name and SAS token

   ```
   VITE_STORAGE_ACCOUNT=yourstorageaccountname
   VITE_STORAGE_SAS=yoursastoken
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the application**
   - Navigate to `http://localhost:5173/` in your browser

## Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and other assets
│   ├── components/      # React components
│   │   ├── AppHeader.jsx           # Application header with theme toggle
│   │   ├── DeleteConfirmation.jsx  # Confirmation dialog for file deletion
│   │   ├── ErrorBoundary.jsx       # Error boundary for catching runtime errors
│   │   ├── Loading.jsx             # Loading indicator component
│   │   ├── MediaCard.jsx           # Individual media item card component
│   │   ├── MediaGallery.jsx        # Main gallery component for displaying media
│   │   ├── ToastManager.jsx        # Toast notification system
│   │   ├── Toast.jsx               # Individual toast notification component
│   │   ├── UploadForm.jsx          # Form for uploading media files
│   │   └── VideoPlayer.jsx         # Video player component with custom controls
│   ├── config/          # Configuration files
│   │   └── azure.js     # Azure Blob Storage configuration
│   ├── hooks/           # Custom React hooks
│   │   ├── useAzureStorage.js  # Hook for Azure Blob Storage operations
│   │   ├── useFileHandler.js   # Hook for file handling and validation
│   │   ├── useThemeMode.js     # Hook for managing dark/light theme
│   │   └── useToast.js         # Hook for toast notifications
│   ├── styles/          # CSS files for components
│   │   ├── deleteConfirmation.css  # Styles for delete confirmation dialog
│   │   ├── errorBoundary.css      # Styles for error boundary component
│   │   ├── index.css              # CSS imports for all component styles
│   │   └── toast.css              # Styles for toast notifications
│   ├── utils/           # Utility functions
│   │   └── fileUtils.js  # File handling utilities
│   ├── App.jsx          # Main application component
│   ├── App.css          # Main application styles
│   ├── index.css        # Global styles and CSS variables
│   └── main.jsx         # Application entry point
├── .env.example         # Example environment variables
├── package.json         # Project dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Azure Storage Setup Guide

1. **Create an Azure Storage Account**

   - Go to the [Azure Portal](https://portal.azure.com/)
   - Create a new Storage Account
   - Choose the appropriate subscription, resource group, and region

2. **Create Containers**

   - In your Storage Account, navigate to "Containers"
   - Create three containers: `myimages`, `myvideos`, and `myaudio`
   - Set the public access level to "Blob" for each container

3. **Configure CORS Settings**

   - In your Storage Account, navigate to "Resource sharing (CORS)" under Settings
   - Add a new CORS rule for Blob service with the following settings:
     - Allowed origins: `*` (or your application domain)
     - Allowed methods: Select all methods
     - Allowed headers: `*`
     - Exposed headers: `*`
     - Max age: `86400`
   - This will allow your application to access the Azure Blob Storage from your local development environment

4. **Generate a SAS Token**

   - In your Storage Account, navigate to "Shared access signature"
   - Configure the SAS with the following permissions: Read, Write, Delete, List, Create
   - Set an appropriate expiry time
   - Generate the SAS token and copy it (without the leading '?')

5. **Configure the Application**
   - Add the Storage Account name and SAS token to your `.env` file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Optimizations and Best Practices

This project has been optimized for the COM682 Cloud Native Development assessment with the following improvements:

1. **Code Optimization**:

   - Removed unnecessary files and components (CorsErrorMessage, ErrorMessage, fileIcons, filePreview, etc.)
   - Consolidated utility functions into a single fileUtils.js file
   - Improved error handling with a centralized toast notification system
   - Enhanced component structure with clear separation of concerns
   - Removed duplicate code and redundant CSS files

2. **Performance Enhancements**:

   - Optimized Azure Blob Storage operations with proper error handling
   - Improved media loading and rendering with lazy loading for images
   - Enhanced state management with custom React hooks
   - Optimized file preview generation with proper cleanup to prevent memory leaks
   - Improved video and audio playback with better browser compatibility

3. **UI/UX Improvements**:

   - Refined delete confirmation dialog with improved z-index management
   - Enhanced media preview functionality for all file types (images, videos, audio)
   - Improved accessibility features with proper ARIA labels and semantic HTML
   - Optimized responsive design for all screen sizes
   - Added dark/light mode support with system preference detection

4. **Documentation**:
   - Comprehensive README with detailed setup instructions
   - Detailed code comments with JSDoc annotations
   - Clear project structure documentation
   - Improved component documentation with PropTypes validation

## Acknowledgments

- This project was created as part of the COM682 Cloud Native Development module assessment
- Thanks to the Azure team for providing excellent documentation and SDKs
