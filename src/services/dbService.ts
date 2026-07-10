import mongoose from 'mongoose';

export interface CollectionSummary {
  name: string;
  count: number;
}

export const dbService = {
  getNailsDBCollections: async (): Promise<string[]> => {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection is not available');
    }

    const collections = await db.listCollections().toArray();
    return collections.map((collection) => collection.name);
  },

  getNailsDBCollectionSummary: async (): Promise<CollectionSummary[]> => {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection is not available');
    }

    const collections = await db.listCollections().toArray();

    const summaries = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();
        return { name: collection.name, count };
      })
    );

    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  },
};
