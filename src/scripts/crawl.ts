import { CheerioCrawler, createCheerioRouter } from "crawlee";

const URL = "https://www.skatteverket.se";

const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, request }) => {
  console.log(request.url);

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
