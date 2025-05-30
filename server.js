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

// 时间单位转换为毫秒
const timeUnits = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000
};

// 生成更真实的模拟数据
const generateRealisticData = (range, unit) => {
  const totalMs = range * timeUnits[unit];
  
  // 根据时间区间确定数据点数量和间隔
  let dataPoints, intervalMs;
  
  if (unit === 'seconds') {
    dataPoints = Math.max(10, range); // 至少10个点
    intervalMs = totalMs / dataPoints;
  } else if (unit === 'minutes') {
    if (range <= 5) {
      dataPoints = range * 12; // 每分钟12个点 (5秒间隔)
      intervalMs = 5 * 1000;
    } else {
      dataPoints = range * 2; // 每分钟2个点 (30秒间隔)
      intervalMs = 30 * 1000;
    }
  } else { // hours
    dataPoints = range * 12; // 每小时12个点 (5分钟间隔)
    intervalMs = 5 * 60 * 1000;
  }

  const now = Date.now();
  const basePrice = 0.5 + Math.random() * 2; // 基础价格 0.5-2.5
  
  let currentPrice = basePrice;
  let trend = (Math.random() - 0.5) * 0.02; // 初始趋势
  
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const time = new Date(now - (dataPoints - 1 - i) * intervalMs);
    
    // 价格变化逻辑 - 模拟真实市场波动
    const volatility = 0.05 * (Math.random() - 0.5); // 随机波动
    const trendChange = (Math.random() - 0.5) * 0.001; // 趋势微调
    trend += trendChange;
    trend = Math.max(-0.05, Math.min(0.05, trend)); // 限制趋势幅度
    
    currentPrice *= (1 + trend + volatility);
    currentPrice = Math.max(0.1, currentPrice); // 价格不能为负
    
    // 交易量逻辑 - 基于价格变化和随机因子
    const priceChange = Math.abs(volatility + trend);
    const volumeMultiplier = 1 + priceChange * 10; // 价格变化越大，交易量越大
    
    const baseBuyVolume = (300 + Math.random() * 2000) * volumeMultiplier;
    const baseSellVolume = (300 + Math.random() * 2000) * volumeMultiplier;
    
    // 模拟市场情绪：上涨时买多卖少，下跌时卖多买少
    const sentiment = trend > 0 ? 1.2 : 0.8;
    const buyVolume = baseBuyVolume * sentiment;
    const sellVolume = baseSellVolume * (2 - sentiment);
    
    // 用户数量基于交易量
    const buyerCount = Math.floor((buyVolume / 50) + Math.random() * 20);
    const sellerCount = Math.floor((sellVolume / 50) + Math.random() * 20);
    
    data.push({
      time: formatTime(time, unit),
      price: Number(currentPrice.toFixed(6)),
      buy: Number(buyVolume.toFixed(2)),
      sell: Number(sellVolume.toFixed(2)),
      net: Number((buyVolume - sellVolume).toFixed(2)),
      buyerCount,
      sellerCount,
      netUsers: buyerCount - sellerCount
    });
  }
  
  return data;
};

// 根据时间区间格式化时间显示
const formatTime = (date, unit) => {
  if (unit === 'seconds' || unit === 'minutes') {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  } else {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// 生成投资建议
const generateRecommendation = (data) => {
  if (data.length < 3) {
    return {
      recommendation: '数据不足，无法给出建议',
      recommendationType: 'neutral'
    };
  }
  
  const recent = data.slice(-5); // 最近5个数据点
  const earlier = data.slice(-10, -5); // 之前5个数据点
  
  // 计算趋势
  const recentAvgPrice = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
  const earlierAvgPrice = earlier.length > 0 
    ? earlier.reduce((sum, d) => sum + d.price, 0) / earlier.length 
    : recentAvgPrice;
  
  const priceTrend = (recentAvgPrice - earlierAvgPrice) / earlierAvgPrice;
  
  // 计算资金流向
  const recentNetFlow = recent.reduce((sum, d) => sum + d.net, 0);
  const avgNetFlow = recentNetFlow / recent.length;
  
  // 计算用户活跃度
  const recentNetUsers = recent.reduce((sum, d) => sum + d.netUsers, 0);
  const avgNetUsers = recentNetUsers / recent.length;
  
  // 综合评分
  let score = 0;
  let reasons = [];
  
  // 价格趋势评分 (40%)
  if (priceTrend > 0.02) {
    score += 40;
    reasons.push('价格呈上升趋势');
  } else if (priceTrend < -0.02) {
    score -= 40;
    reasons.push('价格呈下降趋势');
  } else {
    reasons.push('价格相对稳定');
  }
  
  // 资金流向评分 (35%)
  if (avgNetFlow > 500) {
    score += 35;
    reasons.push('资金净流入强劲');
  } else if (avgNetFlow < -500) {
    score -= 35;
    reasons.push('资金净流出明显');
  } else {
    reasons.push('资金流向基本平衡');
  }
  
  // 用户活跃度评分 (25%)
  if (avgNetUsers > 10) {
    score += 25;
    reasons.push('买家明显多于卖家');
  } else if (avgNetUsers < -10) {
    score -= 25;
    reasons.push('卖家明显多于买家');
  } else {
    reasons.push('买卖双方相对平衡');
  }
  
  // 生成建议
  let recommendation, recommendationType;
  
  if (score > 50) {
    recommendation = `🟢 建议买入 (信心度: ${Math.min(100, score)}%)`;
    recommendationType = 'buy';
  } else if (score < -50) {
    recommendation = `🔴 建议卖出 (信心度: ${Math.min(100, Math.abs(score))}%)`;
    recommendationType = 'sell';
  } else {
    recommendation = `🟡 建议观望 (市场信号不明确)`;
    recommendationType = 'neutral';
  }
  
  recommendation += `\n原因: ${reasons.join(', ')}`;
  
  return { recommendation, recommendationType };
};

// 验证Solana地址格式
const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API端点
app.get('/api/sol-token-info', async (req, res) => {
  try {
    const { address, range = 1, unit = 'hours' } = req.query;
    
    // 验证参数
    if (!address) {
      return res.status(400).json({ error: '缺少 address 参数' });
    }
    
    if (!isValidSolanaAddress(address)) {
      return res.status(400).json({ error: '无效的Solana地址格式' });
    }
    
    const rangeNum = parseInt(range);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      return res.status(400).json({ error: '无效的时间范围' });
    }
    
    if (!timeUnits[unit]) {
      return res.status(400).json({ error: '无效的时间单位' });
    }
    
    // 生成数据
    const data = generateRealisticData(rangeNum, unit);
    
    // 分离不同类型的图表数据
    const priceChart = data.map(d => ({ time: d.time, price: d.price }));
    const volumeChart = data.map(d => ({ 
      time: d.time, 
      buy: d.buy, 
      sell: d.sell, 
      net: d.net 
    }));
    const userChart = data.map(d => ({ 
      time: d.time, 
      buyerCount: d.buyerCount, 
      sellerCount: d.sellerCount, 
      netUsers: d.netUsers 
    }));
    
    // 生成投资建议
    const { recommendation, recommendationType } = generateRecommendation(data);
    
    res.json({
      success: true,
      address,
      timeRange: `${range} ${unit}`,
      dataPoints: data.length,
      priceChart,
      volumeChart,
      userChart,
      recommendation,
      recommendationType,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('API错误:', err);
    res.status(500).json({ 
      error: '内部服务器错误',
      message: err.message 
    });
  }
});

// 静态文件服务 - 放在API路由之后
app.use(express.static('.'));

app.listen(port, () => {
  console.log(`🚀 SOL Token Analyzer Server running on http://localhost:${port}`);
  console.log(`📊 API endpoint: http://localhost:${port}/api/sol-token-info`);
  console.log(`💡 Health check: http://localhost:${port}/health`);
});
