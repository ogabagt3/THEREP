/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export interface PriceData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
}

export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export async function fetchRealTimePrice(symbol: string): Promise<PriceData | null> {
  if (!ALPHA_VANTAGE_KEY) return null;

  try {
    // Determine if it's Forex or Stock
    const isForex = symbol.includes('/');
    let url = '';

    if (isForex) {
      const [from, to] = symbol.split('/');
      url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_KEY}`;
    } else {
      url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (isForex && data['Realtime Currency Exchange Rate']) {
      const rate = data['Realtime Currency Exchange Rate'];
      return {
        symbol,
        price: parseFloat(rate['5. Exchange Rate']).toFixed(4),
        change: '0.00', // Forex endpoint doesn't give 24h change directly in this call
        changePercent: '0.00%'
      };
    } else if (!isForex && data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol,
        price: parseFloat(quote['05. price']).toFixed(2),
        change: quote['09. change'],
        changePercent: quote['10. change percent']
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

export async function fetchNewsHeadlines(query: string): Promise<NewsHeadline[]> {
  if (!NEWS_API_KEY) return [];

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      return data.articles.map((article: any) => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        publishedAt: article.publishedAt
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching news for ${query}:`, error);
    return [];
  }
}
