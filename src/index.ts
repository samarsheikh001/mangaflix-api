import express, { Express, Request, Response } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";

const app: Express = express();
const mangasee123 = new MANGA.Mangasee123();

const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.json({ success: true });
});

app.get("/manga/search/:query", async (req, res) => {
  const data = await mangasee123.search(req.params.query);
  res.json({ success: true, data });
});

app.get("/manga/info/:query", async (req, res) => {
  const data = await mangasee123.fetchMangaInfo(req.params.query);
  res.json({ success: true, data });
});

app.get("/manga/chapter/:query", async (req, res) => {
  const data = await mangasee123.fetchChapterPages(req.params.query);
  res.json({ success: true, data });
});

app.listen(port, () =>
  console.log(`[server]: Server is running at http://localhost:${port}`)
);
