import express from 'express';
const app = express();

try {
  app.get('/:collection', (req, res) => {});
  console.log('/:collection is OK');
} catch (e) {
  console.log('Error on /:collection:', e.message);
}

try {
  app.get('*', (req, res) => {});
  console.log('* is OK');
} catch (e) {
  console.log('Error on *:', e.message);
}
