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

function createAxiosSocks5ProxyAdapter(proxyUrl) {
  return async function axiosSocks5ProxyAdapter(config) {
    const agent = new SocksProxyAgent(proxyUrl);

    const { url, method, headers, data } = config;
    const protocol = new URL(url).protocol;

    const requestOptions = {
      method: method.toUpperCase(),
      headers: headers,
      agent: agent,
    };

    return new Promise((resolve, reject) => {
      const req = (protocol === "https:" ? https : http).request(
        url,
        requestOptions,
        (res) => {
          let responseData = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });
          res.on("end", () => {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              config: config,
              request: req,
              data: responseData,
            });
          });
        }
      );

      req.on("error", (error) => {
        reject(error);
      });

      if (data) {
        req.write(data);
      }
      req.end();
    });
  };
}

// Usage example
const socks5ProxyUrl = "socks5://localhost:9050";
const axiosInstance = axios.create({
  adapter: createAxiosSocks5ProxyAdapter(socks5ProxyUrl) as AxiosAdapter,
});

// const agent = new SocksProxyAgent("socks5://localhost:9050");

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
