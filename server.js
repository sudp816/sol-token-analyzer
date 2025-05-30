// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';

const app = express();
const port = 3001;

app.use(cors());

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// 简化处理：模拟过去5小时的数据（正常应使用数据库或历史交易爬取器）
const mockAnalyzeToken = async (address) => {
  // 用于模拟图表数据：每小时一次的数据点（5小时）
  const now = Date.now();
  const dataPoints = Array.from({ length: 5 }, (_, i) => {
    const time = new Date(now - (4 - i) * 60 * 60 * 1000).toLocaleTimeString();
    return {
      time,
      price: Math.random() * 2 + 0.5, // 随机价格
      buy: Math.random() * 5000,
      sell: Math.random() * 5000,
      buyerCount: Math.floor(Math.random() * 300),
      sellerCount: Math.floor(Math.random() * 300),
    };
  });

  const priceChart = dataPoints.map(d => ({ time: d.time, price: d.price }));
  const volumeChart = dataPoints.map(d => ({
    time: d.time,
    buy: d.buy,
    sell: d.sell,
    net: d.buy - d.sell
  }));
  const userChart = dataPoints.map(d => ({
    time: d.time,
    buyerCount: d.buyerCount,
    sellerCount: d.sellerCount,
    netUsers: d.buyerCount - d.sellerCount
  }));

  // 简单的推荐逻辑：如果最近一小时净流入大于净流出 + 买家数量大于卖家 => 买入
  const latest = dataPoints[dataPoints.length - 1];
  const recommendation =
    latest.buy - latest.sell > 1000 && latest.buyerCount > latest.sellerCount
      ? '建议买入：买入资金强劲且买家多于卖家'
      : '建议卖出：卖出压力大或买家不足';

  return { priceChart, volumeChart, userChart, recommendation };
};

app.get('/api/sol-token-info', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: '缺少 address 参数' });

  try {
    const result = await mockAnalyzeToken(address);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '内部服务器错误' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
