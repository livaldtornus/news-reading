const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./services/rssService');
const metaDataRoutes = require('./routes/metadata');
const detailDataRoutes = require('./routes/detaildata');
const authRoutes = require('./routes/auth');
const commentsRoutes = require('./routes/comments');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/metadata', metaDataRoutes);
app.use('/api/detaildata', detailDataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);    
  });