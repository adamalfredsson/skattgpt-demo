import { CheerioCrawler, createCheerioRouter } from "crawlee";
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

const router = createCheerioRouter();

router.addDefaultHandler(async ({ $, enqueueLinks, request }) => {
  console.log(request.url);

  const $content = $(".print-expand");

  if ($content.length > 1) {
    throw new Error("Too many content elements");
  }

  const content = htmlToMarkdown($content.html() || "");

  console.log(content);

  await enqueueLinks({});
});

const crawl = async () => {
  const crawler = new CheerioCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: 5,
  });

  await crawler.run([URL]);
};

crawl();
