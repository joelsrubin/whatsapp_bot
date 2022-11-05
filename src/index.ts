import { Application, Request, Response } from 'express';
import { client } from './whatsapp';

const express = require('express');
const app: Application = express();
const http = require('http');
const server = http.createServer(app);

client.initialize();

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
