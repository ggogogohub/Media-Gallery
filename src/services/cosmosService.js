import { CosmosClient } from "@azure/cosmos";

// Cosmos DB configuration
const endpoint = "https://cosmossonu.documents.azure.com:443/";
const key = "FLB0pXSMteqtoUcC11bXC6R8Oe0ouiVvbRkq6uoy9hg25oRwGdpO8YyEZwy784BH1zdN1aEo2WHxACDby8GcUw==";
const databaseId = "MediaShareDB";

// Container IDs for different media types
const containers = {
  image: "imagesContainer",
  audio: "audioContainer",
  video: "videoContainer"
};

// Initialize the Cosmos client
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

// Get container by type string
const getContainerByType = (type) => {
  // Normalize media type to ensure consistency
  let containerKey;

  if (type === 'image' || type === 'images' || type === 'myimage') {
    containerKey = 'image';
  } else if (type === 'audio' || type === 'myaudio') {
    containerKey = 'audio';
  } else if (type === 'video' || type === 'myvideo' || type === 'myvideos') {
    containerKey = 'video';
  } else {
    containerKey = type; // Use as-is if not matched
  }

  if (containers[containerKey]) {
    return database.container(containers[containerKey]);
  }

  console.error(`Unknown container type: ${type}, normalized to ${containerKey}`);
  throw new Error(`Unknown container type: ${type}`);
};

// Create a new media item in the appropriate container
export const createMediaItem = async (mediaItem) => {
  try {
    // Determine the correct media type and container
    let mediaType = mediaItem.mediaType || mediaItem.type;

    // If mediaType is still undefined, try to derive from contentType
    if (!mediaType && mediaItem.contentType) {
      mediaType = mediaItem.contentType.split('/')[0];
    }

    // Normalize mediaType to one of our container keys
    let containerKey;
    if (mediaType === 'image' || mediaType === 'images') {
      containerKey = 'image';
    } else if (mediaType === 'audio') {
      containerKey = 'audio';
    } else if (mediaType === 'video') {
      containerKey = 'video';
    } else {
      console.warn(`Unknown media type: ${mediaType}. Using 'image' as default.`);
      containerKey = 'image';
    }

    // Get the container for this media type
    const container = database.container(containers[containerKey]);

    // Check if an item with the same ID or blobName already exists
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id OR c.blobName = @blobName",
        parameters: [
          { name: "@id", value: mediaItem.id },
          { name: "@blobName", value: mediaItem.blobName }
        ]
      };

      const { resources: existingItems } = await container.items.query(querySpec).fetchAll();

      if (existingItems && existingItems.length > 0) {
        console.log(`Item already exists in container ${containers[containerKey]}. Skipping creation.`);
        return existingItems[0]; // Return the existing item
      }
    } catch (queryError) {
      console.warn("Error checking for existing item:", queryError);
      // Continue with creation if the check fails
    }

    // Ensure we have the mediaType field
    const itemToCreate = {
      ...mediaItem,
      mediaType: containerKey // Ensure consistent mediaType
    };

    const { resource: createdItem } = await container.items.create(itemToCreate);
    console.log(`Created ${containerKey} item with id: ${createdItem.id}`);
    return createdItem;
  } catch (error) {
    console.error("Error creating media item:", error);
    throw error;
  }
};

// Get all media items from all containers
export const getAllMediaItems = async () => {
  try {
    const allItems = [];

    for (const type in containers) {
      try {
        const container = database.container(containers[type]);
        const querySpec = {
          query: "SELECT * FROM c"
        };

        console.log(`Querying container: ${containers[type]}`);
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        console.log(`Retrieved ${items.length} items from ${containers[type]}`);

        allItems.push(...items);
      } catch (containerError) {
        console.error(`Error querying container ${containers[type]}:`, containerError);
      }
    }

    // Sort all items by upload date
    if (allItems.length > 0) {
      return allItems.sort((a, b) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate) : new Date(0);
        const dateB = b.uploadDate ? new Date(b.uploadDate) : new Date(0);
        return dateB - dateA;
      });
    }

    console.log('No items found in any containers');
    return [];
  } catch (error) {
    console.error("Error getting all media items:", error);
    throw error;
  }
};

// Get media items by type
export const getMediaItemsByType = async (mediaType) => {
  try {
    if (mediaType === 'all') {
      return getAllMediaItems();
    }

    // Normalize the media type
    let normalizedType = mediaType;
    if (mediaType === 'image' || mediaType === 'images' || mediaType === 'myimage') {
      normalizedType = 'image';
    } else if (mediaType === 'audio' || mediaType === 'myaudio') {
      normalizedType = 'audio';
    } else if (mediaType === 'video' || mediaType === 'myvideo' || mediaType === 'myvideos') {
      normalizedType = 'video';
    }

    if (!containers[normalizedType]) {
      console.error(`Invalid media type: ${mediaType} (normalized to ${normalizedType})`);
      return [];
    }

    try {
      const container = database.container(containers[normalizedType]);
      const querySpec = {
        query: "SELECT * FROM c"
      };

      console.log(`Querying ${normalizedType} container: ${containers[normalizedType]}`);
      const { resources: items } = await container.items.query(querySpec).fetchAll();
      console.log(`Retrieved ${items.length} items from ${containers[normalizedType]}`);

      return items;
    } catch (containerError) {
      console.error(`Error querying ${normalizedType} container:`, containerError);
      return [];
    }
  } catch (error) {
    console.error(`Error getting ${mediaType} items:`, error);
    return [];
  }
};

// Get a media item by ID and type
export const getMediaItemById = async (id, mediaType) => {
  try {
    const container = getContainerByType(mediaType);

    // First, try to query for the item to avoid partition key issues
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }]
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (items && items.length > 0) {
      return items[0];
    }

    // Fallback to direct read
    const { resource: item } = await container.item(id, id).read();
    return item;
  } catch (error) {
    console.error(`Error getting media item with ID ${id}:`, error);
    throw error;
  }
};

// Update a media item
export const updateMediaItem = async (id, updates, mediaType) => {
  try {
    const container = getContainerByType(mediaType);

    // Query for the item first to avoid partition key issues
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }]
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (!items || items.length === 0) {
      throw new Error(`Item with ID ${id} not found`);
    }

    const existingItem = items[0];
    const updatedItem = {
      ...existingItem,
      ...updates,
      mediaType: updates.contentType ? updates.contentType.split('/')[0] : existingItem.mediaType
    };

    const { resource: result } = await container.item(id, id).replace(updatedItem);
    return result;
  } catch (error) {
    console.error(`Error updating media item with ID ${id}:`, error);
    throw error;
  }
};

// Delete a media item
export const deleteMediaItem = async (id, mediaType) => {
  try {
    // Normalize media type to ensure we're using the right container
    let normalizedType;

    if (mediaType === 'image' || mediaType === 'images' || mediaType === 'myimage') {
      normalizedType = 'image';
    } else if (mediaType === 'audio' || mediaType === 'myaudio') {
      normalizedType = 'audio';
    } else if (mediaType === 'video' || mediaType === 'myvideo' || mediaType === 'myvideos') {
      normalizedType = 'video';
    } else {
      normalizedType = mediaType;
    }

    console.log(`Attempting to delete from Cosmos DB with ID: ${id}, mediaType: ${mediaType}, normalized: ${normalizedType}`);

    // Check all containers - sometimes items might be in the wrong container
    for (const containerName of Object.values(containers)) {
      try {
        const container = database.container(containerName);

        // First, check if the item exists in this container
        const querySpec = {
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: id }]
        };

        console.log(`Searching for item with ID ${id} in container ${containerName}`);
        const { resources: items } = await container.items.query(querySpec).fetchAll();

        if (items.length > 0) {
          const itemToDelete = items[0];
          console.log(`Found item to delete in container ${containerName}:`, itemToDelete);

          // Try multiple deletion methods with better error handling
          try {
            // Try deleting with ID and default partition key handling 
            console.log(`Trying deletion with just ID`);
            await container.item(id).delete();
            console.log(`Successfully deleted item from ${containerName}`);
            return true;
          } catch (error1) {
            console.log(`Standard deletion failed: ${error1.message}`);

            // Try a different approach - get all potential partition key fields from the item
            const potentialPartitionKeys = Object.keys(itemToDelete);
            console.log(`Trying with potential partition keys:`, potentialPartitionKeys);

            // Try each field in the item as a potential partition key
            for (const pkField of potentialPartitionKeys) {
              try {
                console.log(`Trying with ${pkField}=${itemToDelete[pkField]} as partition key`);
                await container.item(id, itemToDelete[pkField]).delete();
                console.log(`Successfully deleted item using ${pkField} as partition key`);
                return true;
              } catch (pkError) {
                console.log(`Failed with ${pkField}: ${pkError.message}`);
                // Continue to the next field
              }
            }

            // If we still can't delete, try using another approach with query
            console.log(`All standard deletion methods failed. Trying SQL delete.`);

            // This is a workaround - we'll use a stored procedure to delete the item
            // First make sure the item still exists
            const recheckQuery = {
              query: "SELECT VALUE COUNT(1) FROM c WHERE c.id = @id",
              parameters: [{ name: "@id", value: id }]
            };

            const { resources: countResult } = await container.items.query(recheckQuery).fetchAll();

            if (countResult[0] > 0) {
              console.log(`Item still exists after all deletion attempts. Marking failure.`);
              // At this point, we've tried everything - we'll need to handle this as an error
              throw new Error(`Could not delete item ${id} from container ${containerName} using any method`);
            } else {
              // Item is gone (might have been deleted by a previous attempt)
              console.log(`Item ${id} is no longer in container ${containerName}`);
              return true;
            }
          }
        }
      } catch (containerError) {
        console.warn(`Error accessing container ${containerName}: ${containerError.message}`);
        // Continue to the next container
      }
    }

    // If we get here, we didn't find the item in any container
    console.log(`Item with ID ${id} not found in any container`);
    return false; // Item doesn't exist, so consider it "deleted"
  } catch (error) {
    console.error(`Error deleting media item with ID ${id}:`, error);
    throw error;
  }
}; 