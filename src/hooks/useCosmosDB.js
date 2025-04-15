/**
 * Custom hook for Azure Cosmos DB operations
 */

import { useState, useCallback } from 'react';
import { 
  createMediaItem, 
  getAllMediaItems, 
  getMediaItemById, 
  updateMediaItem, 
  deleteMediaItem 
} from '../services/cosmosService';

/**
 * Custom hook for Azure Cosmos DB operations
 * @returns {Object} Azure Cosmos DB operations and state
 */
export const useCosmosDB = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save media metadata to Cosmos DB
   * @param {Object} mediaData - Media metadata to save
   * @returns {Promise<Object|null>} - Created media item or null if failed
   */
  const saveMediaMetadata = useCallback(async (mediaData) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure the media data has an ID
      if (!mediaData.id) {
        mediaData.id = `${Date.now()}`;
      }

      // Add upload timestamp if not present
      if (!mediaData.uploadDate) {
        mediaData.uploadDate = new Date().toISOString();
      }

      const result = await createMediaItem(mediaData);
      return result;
    } catch (err) {
      console.error('Error saving media metadata:', err);
      setError(`Failed to save metadata: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all media metadata from Cosmos DB
   * @returns {Promise<Array|null>} - Array of media items or null if failed
   */
  const getAllMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const items = await getAllMediaItems();
      return items;
    } catch (err) {
      console.error('Error getting media metadata:', err);
      setError(`Failed to retrieve metadata: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get media metadata by ID
   * @param {string} id - Media item ID
   * @returns {Promise<Object|null>} - Media item or null if failed
   */
  const getMediaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const item = await getMediaItemById(id);
      return item;
    } catch (err) {
      console.error(`Error getting media with ID ${id}:`, err);
      setError(`Failed to retrieve media: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update media metadata
   * @param {string} id - Media item ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated media item or null if failed
   */
  const updateMedia = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateMediaItem(id, updates);
      return result;
    } catch (err) {
      console.error(`Error updating media with ID ${id}:`, err);
      setError(`Failed to update media: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete media metadata
   * @param {string} id - Media item ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  const deleteMedia = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await deleteMediaItem(id);
      return true;
    } catch (err) {
      console.error(`Error deleting media with ID ${id}:`, err);
      setError(`Failed to delete media: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    saveMediaMetadata,
    getAllMedia,
    getMediaById,
    updateMedia,
    deleteMedia
  };
};
