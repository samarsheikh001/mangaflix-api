import express, { Express, Request, Response, query } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";
import { getAmazonProducts } from "./amazon-scrape.js";
import axios, { AxiosAdapter } from "axios";
import torRequest from "tor-request";
import { SocksProxyAgent } from "socks-proxy-agent";
import https from "https";
import http from "http";

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

const socks5Adapter: AxiosAdapter = (config) => {
  return new Promise((resolve, reject) => {
    const agent = new SocksProxyAgent("socks5://localhost:9050");

    const protocol = config.url?.startsWith("https") ? https : http;

    const options: http.RequestOptions = {
      method: config.method?.toUpperCase(),
      headers: config.headers,
      agent: agent,
    };

    const req = protocol.request(config.url!, options, (res) => {
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

// Create an Axios instance with the Tor adapter
const axiosTor = axios.create({
  adapter: socks5Adapter,
});

app.get("/", async (req, res) => {
  const response = await axiosTor.get("https://httpbin.org/ip");
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
