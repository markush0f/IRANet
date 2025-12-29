export type TerminalInputMessage = {
    type: "input";
    data: string;
};

export type TerminalResizeMessage = {
    type: "resize";
    cols: number;
    rows: number;
};

export type TerminalMessage =
    | TerminalInputMessage
    | TerminalResizeMessage;
