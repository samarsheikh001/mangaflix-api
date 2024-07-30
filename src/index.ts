import express, { Express, Request, Response, query } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";
import { getAmazonProducts } from "./amazon-scrape.js";
import axios, { AxiosAdapter, AxiosPromise, AxiosRequestConfig } from "axios";
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

// Create a SOCKS5 agent
const socksAgent = new SocksProxyAgent("socks5://localhost:9050");

// Create a custom adapter
const socksAdapter: AxiosAdapter = (
  config: AxiosRequestConfig
): AxiosPromise => {
  // Add the SOCKS5 agent to the request config
  config.httpAgent = socksAgent;
  config.httpsAgent = socksAgent;

  // Use the default Axios adapter
  const defaultAdapter: AxiosAdapter = axios.defaults.adapter as AxiosAdapter;
  if (!defaultAdapter) {
    throw new Error("No default Axios adapter found");
  }

  // Make the request using the default Axios adapter
  return defaultAdapter(config as any);
};

// Create a custom Axios instance
const axiosInstance = axios.create({
  adapter: socksAdapter,
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
