/**
 * Azure Blob Storage Configuration
 * This file contains the configuration for Azure Blob Storage
 */

import { BlobServiceClient } from '@azure/storage-blob';

// Media container configuration
export const CONTAINER_CONFIG = {
  images: {
    name: 'myimages',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  audio: {
    name: 'myaudio',
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  },
  video: {
    name: 'myvideos',
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  }
};

/**
 * Initialize Azure Blob Storage client
 * @returns {Object} Azure Blob Storage client and configuration
 */
export const initializeAzureStorage = () => {
  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;

  if (!account || !sasToken) {
    console.error('Azure Storage credentials are missing. Please check your .env file.');
    return {
      blobServiceClient: null,
      isConfigured: false,
      account,
      sasToken
    };
  }

  try {
    // Create the BlobServiceClient with the SAS token
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net/?${sasToken}`
    );

    return {
      blobServiceClient,
      isConfigured: true,
      account,
      sasToken
    };
  } catch (error) {
    console.error('Failed to initialize Azure Blob Storage client:', error);
    return {
      blobServiceClient: null,
      isConfigured: false,
      account,
      sasToken,
      error
    };
  }
};

/**
 * Create containers if they don't exist
 * @param {BlobServiceClient} blobServiceClient - Azure Blob Storage client
 */
export const ensureContainersExist = async (blobServiceClient) => {
  if (!blobServiceClient) return;

  try {
    // Check if containers exist first to avoid unnecessary creation attempts
    const containersToCreate = [];

    for (const config of Object.values(CONTAINER_CONFIG)) {
      const containerClient = blobServiceClient.getContainerClient(config.name);
      try {
        // Check if container exists first
        const exists = await containerClient.exists();
        if (!exists) {
          containersToCreate.push(config.name);
        }
      } catch (error) {
        // If we can't check, assume we need to create it
        containersToCreate.push(config.name);
      }
    }

    // Only try to create containers that don't exist
    if (containersToCreate.length > 0) {
      for (const containerName of containersToCreate) {
        try {
          const containerClient = blobServiceClient.getContainerClient(containerName);
          await containerClient.create();
          console.log(`Container ${containerName} created successfully`);
        } catch (containerError) {
          // Ignore 409 errors (container already exists)
          if (containerError.statusCode !== 409) {
            console.warn(`Error creating container ${containerName}:`, containerError);
          }
        }
      }
    }

    console.log('Containers verified successfully');
  } catch (error) {
    console.error('Error verifying containers:', error);
  }
};
