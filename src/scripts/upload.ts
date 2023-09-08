import { Dataset } from "crawlee";
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

  const chunksWithEmbeddings = chunks.items.map((chunk) => {
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
};

upload();
