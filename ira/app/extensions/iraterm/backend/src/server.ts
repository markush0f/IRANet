import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { registerTerminalWs } from "./ws/terminal.ws";
const port = Number(process.env.PORT) || 3001;

async function bootstrap() {
    const app = Fastify({
        logger: true,
    });

    await app.register(websocket);

    await registerTerminalWs(app);

    await app.listen({
        port: port,
        host: "0.0.0.0",
    });
}

bootstrap();
