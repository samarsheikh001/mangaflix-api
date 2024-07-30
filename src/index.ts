import express, { Express, Request, Response, query } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";
import { getAmazonProducts } from "./amazon-scrape.js";
import axios, { AxiosAdapter } from "axios";
import torRequest from "tor-request";

const app: Express = express();
const mangasee123 = new MANGA.Mangasee123();

const port = process.env.PORT || 3000;

app.use(cors());

// torRequest.setTorAddress("localhost", 9050);

// Custom Axios adapter using tor-request
const torAdapter: AxiosAdapter = (config: any) => {
  return new Promise((resolve, reject) => {
    const method = config.method.toLowerCase();
    const options = {
      url: config.url,
      method: method,
      headers: config.headers,
      qs: config.params,
      body: config.data,
      encoding: null, // This ensures the body is a Buffer
    };

    torRequest(options, (err: any, response: any, body: any) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          data: body,
          status: response.statusCode,
          statusText: response.statusMessage,
          headers: response.headers,
          config: config,
          request: response.request,
        });
      }
    });
  });
};

// Create an Axios instance with the Tor adapter
const axiosTor = axios.create({
  adapter: torAdapter,
});

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

app.get("/products/:query", async (req, res) => {
  const data = await getAmazonProducts(req.params.query);
  res.json({ success: true, data });
});

app.listen(port, () =>
  console.log(`[server]: Server is running at http://localhost:${port}`)
);
