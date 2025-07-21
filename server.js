require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "https://index.html" }));  
app.use(express.json());

// Deriv API credentials
const DERIV_API_URL = 'https://api.deriv.com';
const DERIV_APP_ID = process.env.DERIV_APP_ID;

// DeepSeek API credentials
const DEEPSEEK_API_URL = 'https://api.deepseek.ai/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Get market data from Deriv
app.post('/api/market-data', async (req, res) => {
  try {
    const { symbol } = req.body;
    const response = await axios.post(`${DERIV_API_URL}/ticks`, {
      ticks: symbol,
      subscribe: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'App-ID': DERIV_APP_ID
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Deriv API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get market data' });
  }
});

// Get AI analysis from DeepSeek
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { market_data } = req.body;
    
    const prompt = `As a professional trading analyst, analyze the following market data and provide:
1. Trading signal (BUY/SELL/HOLD) with confidence percentage
2. Recommended entry price
3. Stop loss price
4. Take profit price
5. Brief reasoning (max 2 sentences)

Market data: ${JSON.stringify(market_data)}`;

    const response = await axios.post(`${DEEPSEEK_API_URL}/chat/completions`, {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ analysis: response.data.choices[0].message.content });
  } catch (error) {
    console.error('DeepSeek API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// Place a trade on Deriv
app.post('/api/place-trade', async (req, res) => {
  try {
    const { symbol, amount, action, stopLoss, takeProfit } = req.body;
    
    const response = await axios.post(`${DERIV_API_URL}/buy`, {
      proposal: 1,
      amount: amount.toString(),
      basis: 'stake',
      contract_type: action === 'BUY' ? 'CALL' : 'PUT',
      currency: 'USD',
      duration: 5,
      duration_unit: 'm',
      symbol,
      stop_loss: stopLoss,
      take_profit: takeProfit
    }, {
      headers: {
        'Content-Type': 'application/json',
        'App-ID': DERIV_APP_ID
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Trade placement error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Trade placement failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
