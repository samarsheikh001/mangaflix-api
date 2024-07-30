import axios, {
  AxiosAdapter,
  AxiosPromise,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  RawAxiosRequestHeaders,
} from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import http from "http";
import https from "https";

// Create a SOCKS5 agent
const socksAgent = new SocksProxyAgent("socks5://localhost:9050");

// Helper function to convert Axios headers to Node.js compatible headers
function convertHeaders(
  headers: RawAxiosRequestHeaders | AxiosHeaders
): http.OutgoingHttpHeaders {
  const result: http.OutgoingHttpHeaders = {};
  if (headers instanceof AxiosHeaders) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
  } else {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result[key] = Array.isArray(value)
          ? value.join(", ")
          : value.toString();
      }
    }
  }
  return result;
}

// Create a custom adapter
const socksAdapter: AxiosAdapter = (
  config: InternalAxiosRequestConfig
): AxiosPromise => {
  return new Promise((resolve, reject) => {
    const { url, method = "get", data, headers, timeout } = config;

    if (!url) {
      reject(new Error("No URL provided"));
      return;
    }

    const isHttps = url.startsWith("https");
    const requestModule = isHttps ? https : http;

    const requestOptions: http.RequestOptions = {
      method: method.toUpperCase(),
      headers: convertHeaders(headers || {}),
      agent: socksAgent,
      timeout,
    };

    const req = requestModule.request(url, requestOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          data: responseData,
          status: res.statusCode || 200,
          statusText: res.statusMessage || "OK",
          headers: res.headers,
          config,
          request: req,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }

    req.end();
  });
};

// Create a custom Axios instance
const axiosInstance = axios.create({
  adapter: socksAdapter,
});

export default axiosInstance;
