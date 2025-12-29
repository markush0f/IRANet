import * as pty from "node-pty";

export function createPty() {
    const shell = process.env.SHELL || "/bin/bash";

    return pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
    });
}
