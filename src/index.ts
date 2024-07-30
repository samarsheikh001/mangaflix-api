import express, { Express, Request, Response, query } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";
import { getAmazonProducts } from "./amazon-scrape.js";
import axios, { AxiosAdapter } from "axios";
import torRequest from "tor-request";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";
import http from "http";
import url from "url";

const app: Express = express();
const mangasee123 = new MANGA.Mangasee123();

const port = process.env.PORT || 3000;

app.use(cors());

const socks5Adapter: AxiosAdapter = (config) => {
  return new Promise((resolve, reject) => {
    const agent = new HttpsProxyAgent("socks5://localhost:9050");

    const parsedUrl = url.parse(config.url!);

    const options: https.RequestOptions = {
      method: config.method?.toUpperCase(),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      headers: config.headers,
      agent: agent,
    };

    const req = https.request(options, (res) => {
      const response: any = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: req,
      };

      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        response.data = responseBody;
        resolve(response);
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (config.data) {
      req.write(JSON.stringify(config.data));
    }

    req.end();
  });
};
const axiosInstance = axios.create({
  adapter: socks5Adapter,
});

app.get("/", async (req, res) => {
  const response = await axiosInstance.get("https://api.ipify.org?format=json");
  res.json({ success: true, data: response.data });
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
