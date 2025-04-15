import { CosmosClient } from "@azure/cosmos";

// Your Cosmos DB information
const endpoint = "https://cosmossonu.documents.azure.com:443/";
const key = "FLB0pXSMteqtoUcC11bXC6R8Oe0ouiVvbRkq6uoy9hg25oRwGdpO8YyEZwy784BH1zdN1aEo2WHxACDby8GcUw==";
const databaseId = "MediaShareDB";
const containerId = "imagecollectionsonu"; // I see this container already exists

async function setupCosmosDB() {
  try {
    const client = new CosmosClient({ endpoint, key });

    // Create database if it doesn't exist
    console.log(`Creating database: ${databaseId}`);
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database created: ${database.id}`);

    // Check if container exists, if not create it
    console.log(`Checking container: ${containerId}`);
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/id"] }
    });
    console.log(`Container ready: ${container.id}`);

    console.log("Cosmos DB setup complete!");
  } catch (error) {
    console.error("Error setting up Cosmos DB:", error);
  }
}

setupCosmosDB();
