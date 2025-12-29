import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { registerTerminalWs } from "./ws/terminal.ws";

async function bootstrap() {
    const app = Fastify({
        logger: true,
    });

    await app.register(websocket);

    await registerTerminalWs(app);

    await app.listen({
        port: 3001,
        host: "0.0.0.0",
    });
}

bootstrap();
