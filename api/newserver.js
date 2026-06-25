const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

const letters = ['A', 'B', 'C', 'D', 'S', 'T'];
const topics = ['Animals', 'Foods', 'Movies', 'Countries'];

app.post('/games', async (req, res) => {
  const roomCode = req.body.roomCode;

  if (!roomCode) {
    res.status(400).json({ error: 'roomCode is required' });
    return;
  }

  const letter = letters[Math.floor(Math.random() * letters.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  try {
    const game = await prisma.game.create({
      data: { roomCode: roomCode, letter: letter, topic: topic }
    });
    res.json({ roomCode: game.roomCode, letter: game.letter, topic: game.topic });
  } catch (err) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Room code already in use' });
    } else {
      console.log(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
});

app.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({
    select: { roomCode: true, letter: true, topic: true }
  });
  res.json(games);
});

app.post('/answers', async (req, res) => {
  const roomCode = req.body.roomCode;
  const username = req.body.username;
  const answer = req.body.answer;

  if (!roomCode || !username || !answer) {
    res.status(400).json({ error: 'roomCode, username, and answer are required' });
    return;
  }

  const game = await prisma.game.findUnique({ where: { roomCode: roomCode } });

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  // check first letter matches
  if (answer[0].toUpperCase() !== game.letter) {
    res.status(400).json({ error: 'Answer must start with ' + game.letter });
    return;
  }

  try {
    await prisma.answer.create({
      data: { gameId: game.id, username: username, answer: answer }
    });
    res.json({ accepted: true });
  } catch (err) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Answer already taken' });
    } else {
      console.log(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
});

app.listen(3000, () => {
  console.log('listening on port 3000');
});