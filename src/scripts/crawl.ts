import { CheerioCrawler, Dataset, createCheerioRouter } from "crawlee";
import TurndownService from "turndown";
import { resetDataset } from "../utils/dataset";

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
  const router = createCheerioRouter();

  await resetDataset("skatteverket");
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

    await enqueueLinks({
      regexps: [/^https:\/\/www\.skatteverket\.se\/privat\/skatter\/.*/],
      exclude: [
        /^https:\/\/www\.skatteverket\.se\/privat\/skatter\/vardepapper\/aktiehistorik.*/,
      ],
    });
  });

  const crawler = new CheerioCrawler({
    requestHandler: router,
  });

  await crawler.run([URL]);
};

crawl();
