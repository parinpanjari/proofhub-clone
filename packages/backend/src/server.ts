import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app';
import { env, connectDatabase, logger } from './config';

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  },
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join:org', (orgId: string) => {
    socket.join(`org:${orgId}`);
  });

  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('join:channel', (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available globally for emitting events from services
app.set('io', io);

async function start(): Promise<void> {
  await connectDatabase();

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
  });
}

function handleShutdown(signal: string): void {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export { io };
