const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple server is running' });
});

// Mock auth login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'company@test.com' && password === 'test123') {
    res.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'company@test.com',
        role: 'CLIENT'
      }
    });
  } else if (email === 'influencer@test.com' && password === 'test123') {
    res.json({
      token: 'mock-jwt-token',
      user: {
        id: '2',
        email: 'influencer@test.com',
        role: 'INFLUENCER'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock register
app.post('/api/auth/register', (req, res) => {
  res.json({
    token: 'mock-jwt-token',
    user: {
      id: Date.now().toString(),
      email: req.body.email,
      role: req.body.role
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});