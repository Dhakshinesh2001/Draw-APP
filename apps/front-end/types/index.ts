export interface Draw {
    id: Number;
    shape:
    | "rectangle"
    | "diamond"
    | "circle"
    | "line"
    | "arrow"
    | "text"
    | "freeHand";
    isFill: boolean;
    strokeStyle: string;
    fillStyle: string;
    lineWidth: number;
    font?: string;
    fontSize?: string;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    text?: string;
    points?: { x: number; y: number }[];
}