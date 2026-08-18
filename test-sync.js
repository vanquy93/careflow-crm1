import express from 'express';
const app = express();

app.get('*', (req, res) => {});
console.log('Reached listen!');
app.listen(3001);
