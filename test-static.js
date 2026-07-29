import express from 'express';
const app = express();

try {
  app.use(express.static('dist'));
  console.log('express.static is OK');
} catch (e) {
  console.log('Error on express.static:', e.message);
}
