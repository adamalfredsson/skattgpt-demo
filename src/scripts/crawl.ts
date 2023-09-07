import { CheerioCrawler, Dataset, createCheerioRouter } from "crawlee";
import fs from "fs/promises";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
});

turndown.remove([
  "script",
  "style",
  "picture",
  "noscript",
  "iframe",
  "audio",
  "video",
  "form",
  "input",
  "button",
  "nav",
]);

turndown.addRule("removeHrefs", {
  filter: "a",
  replacement: (content) => content,
});

turndown.addRule("removeImages", {
  filter: "img",
  replacement: (content) => "",
});

function htmlToMarkdown(html: string) {
  return turndown.turndown(html);
}

const URL = "https://www.skatteverket.se";

const crawl = async () => {
  await fs.rm("storage/datasets", { recursive: true, force: true });

  const router = createCheerioRouter();

  const dataset = await Dataset.open("skatteverket");

  router.addDefaultHandler(async ({ $, enqueueLinks, request }) => {
    console.log(request.url);

    const $content = $(".print-expand");

    if ($content.length > 1) {
      throw new Error("Too many content elements");
    }

    const content = htmlToMarkdown($content.html() || "");

    const title = $("h1").text();

    if (content && title) {
      dataset.pushData({
        url: request.loadedUrl || request.url,
        title,
        content,
      });
    }

    await enqueueLinks({});
  });

  const crawler = new CheerioCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: 5,
  });

  await crawler.run([URL]);
};

crawl();
