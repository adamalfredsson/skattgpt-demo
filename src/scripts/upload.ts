import { Dataset } from "crawlee";
import { processInBatches } from "../services/batch";
import { COLLECTION_NAME, qdrant } from "../services/qdrant";
import { Chunk } from "../types";

const upload = async () => {
  await qdrant.recreateCollection(COLLECTION_NAME, {
    vectors: { size: 1536, distance: "Cosine" },
  });

  const embeddingsDataset = await Dataset.open("embeddings");
  const chunksDataset = await Dataset.open<Chunk>("chunks");

  const embeddings = await embeddingsDataset.getData();
  const chunks = await chunksDataset.getData();

  await processInBatches(
    chunks.items,
    { batchSize: 50 },
    async (batch, { start, end }) => {
      console.log(`Processing batch ${start}-${end} of ${chunks.items.length}`);
      const chunksWithEmbeddings = batch.map((chunk) => {
        const embedding = embeddings.items.find(
          (embedding) => embedding.id === chunk.id
        );

        if (!embedding) {
          throw new Error("No embedding found");
        }

        return {
          ...chunk,
          embedding: embedding.embedding,
        };
      });

      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: chunksWithEmbeddings.map((chunk) => ({
          id: chunk.id,
          vector: chunk.embedding,
          payload: {
            title: chunk.title,
            content: chunk.content,
            url: chunk.url,
          },
        })),
      });
    }
  );
};

upload();
