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
import axiosInstance from "./sock-axios.js";

const app: Express = express();
const mangasee123 = new MANGA.Mangasee123();

const port = process.env.PORT || 3000;

app.use(cors());

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
