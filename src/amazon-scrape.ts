import axios from "axios";
import * as cheerio from "cheerio";

export async function getAmazonProducts(query: string) {
  const url = `https://www.amazon.com/s?k=${query.replace(" ", "+")}`;
  const response = await axios(url);
  const html = response.data;
  const $ = cheerio.load(html);
  const products = [];
  $('[cel_widget_id^="MAIN-SEARCH_RESULTS"]').each((i, elem) => {
    const productName = $(elem)
      .find(".a-size-medium.a-color-base.a-text-normal")
      .text();
    const productWholePrice = $(elem).find(".a-price-whole").text();
    const productWholeFraction = $(elem).find(".a-price-fraction").text();
    const productImageURL = $(elem).find(".s-image").attr("src");
    const productLink = $(elem)
      .find(
        ".a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal"
      )
      .attr("href");

    console.log(productLink);
    products.push({
      productName,
      productImageURL,
      productWholePrice,
      productWholeFraction,
      productLink,
    });
  });
  return products;
}
