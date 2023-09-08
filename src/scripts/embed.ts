import { Dataset } from "crawlee";
import { openai } from "../services/openai";
import { resetDataset } from "../utils/dataset";

const embed = async () => {
  const chunksDataset = await Dataset.open("chunks");
  const data = await chunksDataset.getData();

  const chunks = data.items;

  await resetDataset("embeddings");
  const embeddingsDataset = await Dataset.open("embeddings");

  const embeddings = await openai.embeddings.create({
    input: chunks.map((chunk) => chunk.content),
    model: "text-embedding-ada-002",
  });

  await embeddingsDataset.pushData(
    embeddings.data.map(({ index, embedding }) => {
      const chunk = chunks[index];

      return {
        id: chunk.id,
        embedding,
      };
    })
  );
};

embed();
