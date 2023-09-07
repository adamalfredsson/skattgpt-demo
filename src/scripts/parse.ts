import { Dataset } from "crawlee";
import { MarkdownTextSplitter } from "langchain/text_splitter";

const parse = async () => {
  const pagesDataset = await Dataset.open("skatteverket");
  const data = await pagesDataset.getData();

  const pages = data.items;

  const chunksDataset = await Dataset.open("chunks");

  for (const page of pages.slice(0, 2)) {
    const textSplitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const chunks = await textSplitter.splitText(page.content);

    for (const chunk of chunks) {
      await chunksDataset.pushData({
        title: page.title,
        url: page.url,
        content: chunk,
      });
    }
  }
};

parse();
