import express, { Express, Request, Response, query } from "express";
import cors from "cors";
import { MANGA } from "@consumet/extensions";
import { getAmazonProducts } from "./amazon-scrape.js";
import axios, {
  Axios,
  AxiosAdapter,
  AxiosDefaults,
  AxiosPromise,
  AxiosRequestConfig,
} from "axios";
import torRequest from "tor-request";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";
import http from "http";
import url from "url";

const app: Express = express();

const port = process.env.PORT || 3001;
const PORT = 3000;
// const socks5ProxyUrl = "socks5://localhost:9050";

app.use(cors());

function createAxiosSocks5ProxyAdapter(proxyUrl: string): AxiosAdapter {
  return function axiosSocks5ProxyAdapter(config: any): AxiosPromise {
    const agent = new SocksProxyAgent(proxyUrl);

    const { url, method, headers = {}, data, responseType } = config;

    if (!url) {
      return Promise.reject(new Error("No URL provided"));
    }

    const protocol = new URL(url).protocol;

    // Remove undefined headers
    Object.keys(headers).forEach(
      (key) => headers[key] === undefined && delete headers[key]
    );

    const requestOptions: http.RequestOptions = {
      method: method?.toUpperCase(),
      headers: headers,
      agent: agent,
    };

    return new Promise((resolve, reject) => {
      const req = (protocol === "https:" ? https : http).request(
        url,
        requestOptions,
        (res) => {
          let responseData: any = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });
          res.on("end", () => {
            let parsedData: any;
            if (responseType === "json") {
              try {
                parsedData = JSON.parse(responseData);
              } catch (e) {
                parsedData = responseData;
              }
            } else {
              parsedData = responseData;
            }

            const response: any = {
              data: parsedData,
              status: res.statusCode ?? 0,
              statusText: res.statusMessage ?? "",
              headers: res.headers,
              config: config,
              request: req,
            };

            resolve(response);
          });
        }
      );

      req.on("error", (error) => {
        reject(error);
      });

      if (data) {
        req.write(typeof data === "string" ? data : JSON.stringify(data));
      }
      req.end();
    });
  };
}

// // Usage example
// const axiosInstance = axios.create({
//   adapter: createAxiosSocks5ProxyAdapter(socks5ProxyUrl),
// });

const mangasee123 = new MANGA.Mangasee123();

app.get("/", async (req, res) => {
  const response = await axios.get("https://api.ipify.org?format=json");
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${PORT}`);
});

// b003SeT2WnM5NYx6sd
