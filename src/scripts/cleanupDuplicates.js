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

/**
 * Clean up duplicate entries in Cosmos DB containers
 */
async function cleanupDuplicates() {
  console.log("Starting Cosmos DB cleanup process...");
  
  const allMediaItems = [];
  const uniqueMediaItems = new Map();
  const duplicatesToDelete = [];
  
  // First, query all containers to find all media items
  for (const [mediaType, containerId] of Object.entries(containers)) {
    try {
      console.log(`Querying ${containerId}...`);
      const container = database.container(containerId);
      const { resources: items } = await container.items.query("SELECT * FROM c").fetchAll();
      console.log(`Found ${items.length} items in ${containerId}`);
      
      // Add container and media type info to each item
      items.forEach(item => {
        item._container = containerId;
        item._mediaType = mediaType;
      });
      
      allMediaItems.push(...items);
    } catch (error) {
      console.error(`Error querying ${containerId}:`, error);
    }
  }
  
  console.log(`Total items found across all containers: ${allMediaItems.length}`);
  
  // Group items by fileName/blobName to find duplicates
  allMediaItems.forEach(item => {
    // Create a unique key using fileName, blobName, or title
    const key = (item.fileName || item.blobName || item.title || item.id || "").toLowerCase();
    
    if (!key) {
      console.log("Skipping item with no identifiable key:", item.id);
      return;
    }
    
    if (!uniqueMediaItems.has(key)) {
      // This is the first occurrence of this item
      uniqueMediaItems.set(key, item);
    } else {
      // This is a duplicate - check which one to keep
      const existingItem = uniqueMediaItems.get(key);
      
      // Keep the item that matches its container type
      const existingIsInCorrectContainer = existingItem._mediaType === (existingItem.mediaType || existingItem.type);
      const newIsInCorrectContainer = item._mediaType === (item.mediaType || item.type);
      
      if (newIsInCorrectContainer && !existingIsInCorrectContainer) {
        // Keep the new item, mark the existing one for deletion
        duplicatesToDelete.push(existingItem);
        uniqueMediaItems.set(key, item);
      } else {
        // Keep the existing item, mark the new one for deletion
        duplicatesToDelete.push(item);
      }
    }
  });
  
  console.log(`Found ${duplicatesToDelete.length} duplicate items to delete`);
  
  // Delete the duplicates
  for (const item of duplicatesToDelete) {
    try {
      const container = database.container(item._container);
      console.log(`Deleting duplicate item ${item.id} from ${item._container}`);
      await container.item(item.id, item.id).delete();
    } catch (error) {
      console.error(`Error deleting item ${item.id} from ${item._container}:`, error);
    }
  }
  
  console.log("Cleanup process completed!");
}

// Run the cleanup
cleanupDuplicates().catch(error => {
  console.error("Cleanup failed:", error);
}); 