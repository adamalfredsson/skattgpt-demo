import { Dataset } from "crawlee";
import { processInBatches } from "../services/batch";
import { openai } from "../services/openai";
import { resetDataset } from "../utils/dataset";

const embed = async () => {
  const chunksDataset = await Dataset.open("chunks");
  const data = await chunksDataset.getData();

  const chunks = data.items;

  await resetDataset("embeddings");
  const embeddingsDataset = await Dataset.open("embeddings");

  await processInBatches(
    chunks,
    { batchSize: 50 },
    async (batch, { start, end }) => {
      console.log(`Processing batch ${start}-${end} of ${chunks.length}`);
      const embeddings = await openai.embeddings.create({
        input: batch.map((chunk) => chunk.content),
        model: "text-embedding-ada-002",
      });

      await embeddingsDataset.pushData(
        embeddings.data.map(({ index, embedding }) => {
          const chunk = batch[index];

          return {
            id: chunk.id,
            embedding,
          };
        })
      );
    }
  );
};

embed();
