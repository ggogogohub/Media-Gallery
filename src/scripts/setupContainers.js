import { CosmosClient } from "@azure/cosmos";

// Cosmos DB configuration
const config = {
  endpoint: "https://cosmossonu.documents.azure.com:443/",
  key: "FLB0pXSMteqtoUcC11bXC6R8Oe0ouiVvbRkq6uoy9hg25oRwGdpO8YyEZwy784BH1zdN1aEo2WHxACDby8GcUw==",
  databaseId: "MediaShareDB",
  containers: [
    {
      id: "imagesContainer",
      partitionKey: "/contentType",
      description: "Container for image files"
    },
    {
      id: "audioContainer",
      partitionKey: "/contentType",
      description: "Container for audio files"
    },
    {
      id: "videoContainer",
      partitionKey: "/contentType",
      description: "Container for video files"
    }
  ]
};

async function setupContainers() {
  try {
    // Initialize Cosmos client
    const client = new CosmosClient({ 
      endpoint: config.endpoint, 
      key: config.key 
    });

    console.log("Setting up database with shared throughput...");
    
    // Delete existing database if it exists
    try {
      const { database: existingDb } = await client.database(config.databaseId).read();
      if (existingDb) {
        console.log(`Deleting existing database '${config.databaseId}'...`);
        await client.database(config.databaseId).delete();
        console.log("Existing database deleted.");
      }
    } catch (e) {
      if (e.code !== 404) {
        throw e;
      }
    }

    // Create new database with shared throughput
    const { database } = await client.databases.create({
      id: config.databaseId,
      throughput: 400 // Minimum shared throughput for all containers
    });
    console.log(`Database '${config.databaseId}' created with shared throughput`);

    // Create containers
    for (const containerDef of config.containers) {
      console.log(`Creating container '${containerDef.id}'...`);
      
      const { container } = await database.containers.create({
        id: containerDef.id,
        partitionKey: { paths: [containerDef.partitionKey] }
      });

      console.log(`Container '${containerDef.id}' created`);

      // Add a sample item to verify container is working
      try {
        await container.items.create({
          id: `test-item-${Date.now()}`, // Make ID unique
          contentType: `${containerDef.id.replace('Container', '')}/test`,
          title: "Test Item",
          description: `Test item for ${containerDef.description}`,
          _ts: Math.floor(Date.now() / 1000)
        });
        console.log(`Test item created in ${containerDef.id}`);
      } catch (e) {
        console.warn(`Warning: Could not create test item in ${containerDef.id}:`, e.message);
      }
    }

    console.log("\nSetup completed successfully!");
    console.log("Summary:");
    console.log(`- Database: ${config.databaseId} (with 400 RU/s shared throughput)`);
    console.log("- Containers created:");
    config.containers.forEach(c => console.log(`  • ${c.id} (${c.description})`));

  } catch (error) {
    console.error("Error during setup:", error);
    process.exit(1);
  }
}

// Run the setup
setupContainers().catch(console.error); 