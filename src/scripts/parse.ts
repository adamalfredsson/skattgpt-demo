import { Dataset } from "crawlee";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { v5 as uuid } from "uuid";
import { Chunk } from "../types";
import { resetDataset } from "../utils/dataset";

const parse = async () => {
  const pagesDataset = await Dataset.open("skatteverket");
  const data = await pagesDataset.getData();

  const pages = data.items;

  await resetDataset("chunks");
  const chunksDataset = await Dataset.open<Chunk>("chunks");

  for (const page of pages.slice(0, 2)) {
    const textSplitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const chunks = await textSplitter.splitText(page.content);

    for (const chunk of chunks) {
      await chunksDataset.pushData({
        id: uuid(page.url, "00000000-0000-0000-0000-000000000000"),
        title: page.title,
        url: page.url,
        content: chunk,
      });
    }
  }
};

parse();
