import { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { TerminalMessage } from "../types/ws";
import { createPty } from "../services/pty.service";

export async function registerTerminalWs(fastify: FastifyInstance) {
    fastify.get(
        "/ws/terminal",
        { websocket: true },
        (socket: WebSocket) => {
            const ptyProcess = createPty();

            ptyProcess.onData((data) => {
                socket.send(data);
            });

            socket.on("message", (raw: WebSocket.RawData) => {
                const message = JSON.parse(raw.toString()) as TerminalMessage;

                if (message.type === "input") {
                    ptyProcess.write(message.data);
                }

                if (message.type === "resize") {
                    ptyProcess.resize(message.cols, message.rows);
                }
            });

            socket.on("close", () => {
                ptyProcess.kill();
            });
        }
    );
}
