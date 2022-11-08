import { Application, Request, Response } from 'express';
import { client } from './whatsapp';
import * as dotenv from 'dotenv';
dotenv.config();
const express = require('express');
const app: Application = express();
const http = require('http');
const server = http.createServer(app);

client.initialize();

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(process.env.PORT, () => {
  console.log('listening on http//localhost:3000');
});
