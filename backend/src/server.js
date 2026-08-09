import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PassThrough } from 'stream';
import apiRoutes from './routes/api.js';
import { initDbSchema } from './config/db.js';
import { confanaClient } from './config/confana.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'OptiFlow API server operational' });
});

// Create HTTP Server & WebSocket Server
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;

    // Agent Session WebSocket Route
    if (path === '/api/agent-session') {
        const agentId = url.searchParams.get('agentId');
        if (!agentId) {
            ws.close(4000, 'Missing agentId');
            return;
        }

        console.log(`Starting real-time agent session for agent: ${agentId}`);
        try {
            const session = await confanaClient.agent.session(agentId);
            const voiceWs = await session.voice_ws().connect();

            // Listen for message events from client (frontend) -> forward to Confana Voice WebSocket
            ws.on('message', (message, isBinary) => {
                if (isBinary) {
                    voiceWs.send_audio(message);
                } else {
                    try {
                        const data = JSON.parse(message.toString());
                        if (data.type === 'interrupt') {
                            voiceWs.signal_end_of_speech();
                        }
                    } catch (e) {
                        console.error('Error parsing control message:', e);
                    }
                }
            });

            // Stream events from Confana Voice WebSocket -> forward to client (frontend)
            const eventLoop = async () => {
                try {
                    for await (const event of voiceWs.events()) {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(event));
                        }
                    }
                } catch (err) {
                    console.error('Voice WebSocket events error:', err);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'error', message: err.message }));
                    }
                } finally {
                    ws.close();
                }
            };

            eventLoop();

            ws.on('close', () => {
                console.log('Client closed agent-session connection');
                voiceWs.disconnect();
            });

        } catch (error) {
            console.error('Failed to connect agent session:', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: `Session creation failed: ${error.message}` }));
            }
            ws.close();
        }
    }
    // STT Stream WebSocket Route
    else if (path === '/api/stt-stream') {
        const language = url.searchParams.get('language') || 'en';
        console.log(`Starting real-time STT streaming session. Target language: ${language}`);

        const audioStream = new PassThrough();

        ws.on('message', (message) => {
            if (Buffer.isBuffer(message) || message instanceof ArrayBuffer || ArrayBuffer.isView(message)) {
                audioStream.write(Buffer.from(message));
            }
        });

        const streamLoop = async () => {
            try {
                for await (const utterance of confanaClient.asr.streamAudio(audioStream, { language })) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'transcript', text: utterance }));
                    }
                }
            } catch (err) {
                console.error('STT streaming loop error:', err);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'error', message: err.message }));
                }
            } finally {
                ws.close();
            }
        };

        streamLoop();

        ws.on('close', () => {
            console.log('Client closed STT stream connection');
            audioStream.end();
        });
    } else {
        ws.close(4004, 'Not Found');
    }
});

server.listen(PORT, async () => {
    console.log(`🚀 OptiFlow Backend Server running on http://localhost:${PORT}`);
    await initDbSchema();
});
