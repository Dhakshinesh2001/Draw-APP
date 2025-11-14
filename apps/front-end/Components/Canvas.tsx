"use client";

import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from "react";

// --- TYPE DEFINITIONS ---

type Shape = "select" | "rectangle" | "diamond" | "circle" | "arrow" | "text" | "freeHand" | "line";
type HandleType = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br' | 'start' | 'end';

interface ToolSelectorProps {
    selectedShape: Shape;
    setSelectedShape: Dispatch<SetStateAction<Shape>>;
}

interface Draw {
    id: number;
    shape: "rectangle" | "diamond" | "circle" | "arrow" | "freeHand" | "select";
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    points?: { x: number; y: number }[];
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    isFill: boolean;
    // New: Text content for the shape
    text?: string;
    // Fields to track the committed start position for drag/resize calculation
    originalStartX?: number;
    originalStartY?: number;
    originalEndX?: number;
    originalEndY?: number;
    originalPoints?: { x: number; y: y }[]; 
}


// --- TOOL SELECTOR DEFINITION (Integrated for single-file mandate) ---

const tools = [
    { id: "select", label: "Select", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.9231 2.5L20.5 10.0769V20.5H2.5V2.5H12.9231Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 11L11 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>)},
    { id: "rectangle", label: "Rectangle", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4.5" y="4.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>)},
    { id: "diamond", label: "Diamond", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L21.5 12L12 21.5L2.5 12L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>)},
    { id: "circle", label: "Circle", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5"/></svg>)},
    { id: "arrow", label: "Arrow", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20L20 4M20 4H10M20 4V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>)},
    { id: "freeHand", label: "Freehand", icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6C17.5 7 19.5 9 19.5 12C19.5 15 17.5 17 14 18M14 18C10.5 17 8.5 15 8.5 12C8.5 9 10.5 7 14 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.5 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg>)},
];

const ToolSelector: React.FC<ToolSelectorProps> = ({ selectedShape, setSelectedShape }) => {
    const commonClass = "p-3 rounded-xl transition-colors shadow-lg cursor-pointer flex items-center justify-center";
    return (
        <div className="flex space-x-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-2xl">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setSelectedShape(tool.id as Shape)}
                    className={`${commonClass} ${selectedShape === tool.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    title={tool.label}
                    aria-label={tool.label}
                >
                    {tool.icon}
                </button>
            ))}
        </div>
    );
};
// --- END TOOL SELECTOR DEFINITION ---


// --- SHAPE DRAWING FUNCTIONS ---

function drawArrow(ctx: CanvasRenderingContext2D, diagram: Draw) {
    if (
        diagram.startX === undefined || diagram.startY === undefined ||
        diagram.endX === undefined || diagram.endY === undefined
    ) return;
    const { startX, startY, endX, endY, strokeStyle, lineWidth } = diagram;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    const headLength = 15 / (ctx.getTransform().a);
    const headAngle = Math.PI / 8;
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle - headAngle), endY - headLength * Math.sin(angle - headAngle));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle + headAngle), endY - headLength * Math.sin(angle + headAngle));
    ctx.stroke();
}
function drawDiamond(ctx: CanvasRenderingContext2D, diagram: Draw) {
    if (diagram.startX === undefined || diagram.startY === undefined || diagram.endX === undefined || diagram.endY === undefined) return;
    const { startX, startY, endX, endY, strokeStyle, fillStyle, lineWidth, isFill } = diagram;
    const cx = (startX + endX) / 2;
    const cy = (startY + endY) / 2;
    const dx = Math.abs(endX - startX) / 2;
    const dy = Math.abs(endY - startY) / 2;
    const maxScreenRadius = 20;
    const zoomFactor = ctx.getTransform().a;
    const worldRadiusCap = maxScreenRadius / zoomFactor;
    const radius = Math.min(dx, dy, worldRadiusCap);
    const top = { x: cx, y: cy - dy };
    const right = { x: cx + dx, y: cy };
    const bottom = { x: cx, y: cy + dy };
    const left = { x: cx - dx, y: cy };
    function unitVec(p1: { x: number; y: number }, p2: { x: number; y: number }) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        return { x: dx / len, y: dy / len };
    }
    const vTopRight = unitVec(top, right);
    const vRightBottom = unitVec(right, bottom);
    const vBottomLeft = unitVec(bottom, left);
    const vLeftTop = unitVec(left, top);
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(top.x + vTopRight.x * radius, top.y + vTopRight.y * radius);
    ctx.lineTo(right.x - vTopRight.x * radius, right.y - vTopRight.y * radius);
    ctx.quadraticCurveTo(right.x, right.y, right.x + vRightBottom.x * radius, right.y + vRightBottom.y * radius);
    ctx.lineTo(bottom.x - vRightBottom.x * radius, bottom.y - vRightBottom.y * radius);
    ctx.quadraticCurveTo(bottom.x, bottom.y, bottom.x + vBottomLeft.x * radius, bottom.y + vBottomLeft.y * radius);
    ctx.lineTo(left.x - vBottomLeft.x * radius, left.y - vBottomLeft.y * radius);
    ctx.quadraticCurveTo(left.x, left.y, left.x + vLeftTop.x * radius, left.y + vLeftTop.y * radius);
    ctx.lineTo(top.x - vLeftTop.x * radius, top.y - vLeftTop.y * radius);
    ctx.quadraticCurveTo(top.x, top.y, top.x + vTopRight.x * radius, top.y + vTopRight.y * radius);
    ctx.closePath();
    if (isFill) ctx.fill();
    ctx.stroke();
}
function drawRectangle(ctx: CanvasRenderingContext2D, diagram: Draw) {
    // roundRect handles negative width/height correctly for flipping
    const cornerRadius = Math.min(20, Math.min(Math.abs(diagram.endX! - diagram.startX!), Math.abs(diagram.endY! - diagram.startY!)) * 0.2, Math.min(Math.abs(diagram.endX! - diagram.startX!), Math.abs(diagram.endY! - diagram.startY!)) / 2);
    ctx.strokeStyle = diagram.strokeStyle;
    ctx.fillStyle = diagram.fillStyle;
    ctx.lineWidth = diagram.lineWidth;
    ctx.beginPath();
    ctx.roundRect(diagram.startX!, diagram.startY!, diagram.endX! - diagram.startX!, diagram.endY! - diagram.startY!, cornerRadius);
    ctx.stroke();
    if (diagram.isFill) ctx.fill();
    ctx.closePath();
}
function drawCircle(ctx: CanvasRenderingContext2D, diagram: Draw) {
    const centerX = (diagram.startX! + diagram.endX!) / 2;
    const centerY = (diagram.startY! + diagram.endY!) / 2;
    // Uses Math.abs for radius, so flipping is handled correctly
    const radiusX = Math.abs(diagram.endX! - diagram.startX!) / 2;
    const radiusY = Math.abs(diagram.endY! - diagram.startY!) / 2;
    ctx.strokeStyle = diagram.strokeStyle;
    ctx.fillStyle = diagram.fillStyle;
    ctx.lineWidth = diagram.lineWidth;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
    if (diagram.isFill) ctx.fill();
    ctx.closePath();
}
function drawFreeHand(ctx: CanvasRenderingContext2D, diagram: Draw) {
    if (!diagram.points || diagram.points.length < 2) return;
    const { points, strokeStyle, lineWidth } = diagram;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round'; 
    ctx.lineJoin = 'round'; 
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[0]!.y);
    }
    ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, diagram: Draw) {
    if (!diagram.text) return;

    // Use a simplified version without advanced wrapping for now, just split on newlines
    const bbox = getBoundingBox(diagram);
    const { minX, minY, maxX, maxY } = bbox;
    
    // Text properties (use a consistent size/font)
    const fontSize = 14; 
    ctx.fillStyle = diagram.strokeStyle || '#000000'; // Text color usually matches stroke
    ctx.font = `${fontSize}px Inter, sans-serif`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = diagram.text.split('\n');
    // Line height in world units
    const lineHeight = (fontSize + 2); 

    // Center the entire block of text vertically
    const blockHeight = lines.length * lineHeight;
    const centerOfBoxY = minY + (maxY - minY) / 2;
    const startY = centerOfBoxY - (blockHeight / 2) + (lineHeight / 2); // Calculate starting point for the first line

    lines.forEach((line, index) => {
        // Render each line centered horizontally in the box
        ctx.fillText(
            line, 
            minX + (maxX - minX) / 2, 
            startY + index * lineHeight
        );
    });
}

// Helper function to get the bounding box of a Draw object
const getBoundingBox = (diagram: Draw) => {
    // Handle freeHand first
    if (diagram.shape === 'freeHand' && diagram.points && diagram.points.length > 0) {
        let minX = diagram.points[0].x;
        let minY = diagram.points[0].y;
        let maxX = diagram.points[0].x;
        let maxY = diagram.points[0].y;
        
        for (const p of diagram.points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return { minX, minY, maxX, maxY };
    }

    // Handle all other shapes (rectangle, circle, diamond, arrow)
    const x1 = diagram.startX!;
    const y1 = diagram.startY!;
    const x2 = diagram.endX!;
    const y2 = diagram.endY!;

    // We must use Math.min/Math.max here to always return a normalized box,
    // even if the shape has been flipped (i.e., startX > endX)
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);

    return { minX, minY, maxX, maxY };
};

const Canvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState<boolean>(false);

    // --- STATE MANAGEMENT ---
    const DrawObjArray = useRef<Draw[]>([]);
    const currentShapeId = useRef<number>(1);
    const currentDraw = useRef<Draw | null>(null); 
    const isDrawing = useRef<boolean>(false);

    // --- SELECTION/MOVEMENT/RESIZE STATE ---
    const [selectedDrawId, setSelectedDrawId] = useState<number | null>(null);
    const isDraggingShape = useRef<boolean>(false);
    const isResizing = useRef<boolean>(false); 
    const resizingHandle = useRef<HandleType | null>(null); 
    const dragOffset = useRef<{ x: number, y: number } | null>(null); 
    const resizeStartData = useRef<{ // Stores initial position for resize calculation
        bbox: { minX: number; minY: number; maxX: number; maxY: number };
        startX: number; startY: number; endX: number; endY: number;
    } | null>(null);
    
    // --- NEW TEXT EDITING STATE ---
    const [editingDrawId, setEditingDrawId] = useState<number | null>(null);
    const [editorStyle, setEditorStyle] = useState({});
    const [editorDivStyle, setEditorDivStyle] = useState({});

    const editorRef = useRef<HTMLTextAreaElement>(null);
    // -----------------------------


    // --- INFINITE CANVAS STATE ---
    const camera = useRef({ x: 0, y: 0, zoom: 1 });
    const isPanning = useRef<boolean>(false);
    const panStart = useRef({ x: 0, y: 0 });

    // Tool and style settings (Refs for stability in event listeners)
    const currentLineWidth = useRef<number>(2);
    const currentStrokeStyle = useRef<string>("#000000");
    const currentFillStyle = useRef<string>("#FFFFFF");
    const currentIsFill = useRef<boolean>(false);
    const [selectedShape, setSelectedShape] = useState<Shape>("select");

    // --- COORDINATE TRANSFORMATION ---
    const getTransformedPoint = useCallback((x: number, y: number, cameraState: { x: number, y: number, zoom: number }) => {
        const panX = cameraState.x;
        const panY = cameraState.y;
        const zoom = cameraState.zoom;

        // World = (Screen - Pan) / Zoom
        const worldX = (x - panX) / zoom;
        const worldY = (y - panY) / zoom;
        
        return { x: worldX, y: worldY };
    }, []);

    // New helper function to convert world coordinates to screen coordinates
    const getWorldToScreenPoint = useCallback((worldX: number, worldY: number, cameraState: { x: number, y: number, zoom: number }) => {
        const panX = cameraState.x;
        const panY = cameraState.y;
        const zoom = cameraState.zoom;
        // Screen = (World * Zoom) + Pan
        const screenX = (worldX * zoom) + panX;
        const screenY = (worldY * zoom) + panY;
        return { x: screenX, y: screenY };
    }, []);

    // --- CURSOR HELPERS ---
    const getResizeCursor = useCallback((handleType: HandleType): string => {
        switch (handleType) {
            case 'tl': case 'br': return 'nwse-resize';
            case 'tr': case 'bl': return 'nesw-resize';
            case 'tm': case 'bm': return 'ns-resize';
            case 'ml': case 'mr': return 'ew-resize';
            case 'start': case 'end': return 'move'; // Line endpoints
            default: return 'default';
        }
    }, []);

    // --- HIT-TESTING HELPERS ---
    const isPointInBoundingBox = useCallback((px: number, py: number, bbox: { minX: number, minY: number, maxX: number, maxY: number }, tolerance: number) => {
        return (
            px >= bbox.minX - tolerance &&
            px <= bbox.maxX + tolerance &&
            py >= bbox.minY - tolerance &&
            py <= bbox.maxY + tolerance
        );
    }, []);

    const findShapeAtPoint = useCallback((px: number, py: number): Draw | null => {
        // Iterate in reverse order (top-most layer first)
        const tolerance = 5 / camera.current.zoom; 
        for (let i = DrawObjArray.current.length - 1; i >= 0; i--) {
            const diagram = DrawObjArray.current[i];
            if (diagram.startX === undefined || diagram.startY === undefined) continue; 
            
            if (diagram.shape === 'freeHand' && (!diagram.points || diagram.points.length < 2)) continue;

            const bbox = getBoundingBox(diagram);
            if (isPointInBoundingBox(px, py, bbox, tolerance)) {
                return diagram;
            }
        }
        return null;
    }, [isPointInBoundingBox]);

    // Finds the resize handle at a given point
    const findHandleAtPoint = useCallback((px: number, py: number): HandleType | null => {
        if (selectedDrawId === null) return null;

        const selectedObj = DrawObjArray.current.find(obj => obj.id === selectedDrawId);
        if (!selectedObj) return null;

        const bbox = getBoundingBox(selectedObj);
        const padding = 10 / camera.current.zoom; // Use the new, larger padding for hit-testing
        const handleSize = 5 / camera.current.zoom;
        const hitTolerance = handleSize * 1.5; 

        const checkHit = (hx: number, hy: number) => {
            return (
                px >= hx - hitTolerance &&
                px <= hx + hitTolerance &&
                py >= hy - hitTolerance &&
                py <= hy + hitTolerance
            );
        };

        // Standard bounding box handles for common shapes
        if (['rectangle', 'diamond', 'circle'].includes(selectedObj.shape)) {
            // Calculate handle positions using padding
            const handles: { x: number, y: number, type: HandleType }[] = [
                { x: bbox.minX - padding, y: bbox.minY - padding, type: 'tl' }, 
                { x: (bbox.minX + bbox.maxX) / 2, y: bbox.minY - padding, type: 'tm' },
                { x: bbox.maxX + padding, y: bbox.minY - padding, type: 'tr' },
                { x: bbox.minX - padding, y: (bbox.minY + bbox.maxY) / 2, type: 'ml' },
                { x: bbox.maxX + padding, y: (bbox.minY + bbox.maxY) / 2, type: 'mr' },
                { x: bbox.minX - padding, y: bbox.maxY + padding, type: 'bl' },
                { x: (bbox.minX + bbox.maxX) / 2, y: bbox.maxY + padding, type: 'bm' },
                { x: bbox.maxX + padding, y: bbox.maxY + padding, type: 'br' },
            ];

            for (const handle of handles) {
                if (checkHit(handle.x, handle.y)) {
                    return handle.type;
                }
            }
        } 
        // Special handles for Arrow (endpoints are not padded, they remain on the line end)
        else if (selectedObj.shape === 'arrow') {
            if (checkHit(selectedObj.startX!, selectedObj.startY!)) return 'start';
            if (checkHit(selectedObj.endX!, selectedObj.endY!)) return 'end';
        }

        return null;
    }, [selectedDrawId]);


    // New function to update the DOM editor position/size
    const updateEditorPosition = useCallback((id: number, currentCamera: { x: number, y: number, zoom: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const selectedObj = DrawObjArray.current.find(obj => obj.id === id);
        if (!selectedObj) return;

        const bbox = getBoundingBox(selectedObj);
        
        // Convert world-space bounding box to screen-space coordinates
        const screenMin = getWorldToScreenPoint(bbox.minX, bbox.minY, currentCamera);
        const screenMax = getWorldToScreenPoint(bbox.maxX, bbox.maxY, currentCamera);
        
        const boxWidth = screenMax.x - screenMin.x;
        const boxHeight = screenMax.y - screenMin.y;

        // Base font size and padding (screen pixels)
        const baseFontSize = 14; 
        const padding = 5;

        setEditorStyle({
            // Position relative to the viewport/canvas container
            // left: `${screenMin.x}px`,
            // top: `${screenMin.y}px`,
            width: `${boxWidth}px`,
            // minheight: `${baseFontSize/2}`,
            
            // position: 'absolute',
            textAlign: 'center',
            // zIndex: 1000,
            
            // Adjust appearance to visually match the canvas text scale
            // Font size and padding are scaled by zoom for visual coherence
            fontSize: `${baseFontSize}px`, 
            // lineHeight: `${currentCamera.zoom}`,
            paddingTop: `${baseFontSize*1.2}px`, 
            lineHeight: 1,
            // Other styles for appearance
            backgroundColor: 'transparent',
            border: 'none',
            // boxSizing: 'border-box',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif',
            color: selectedObj.strokeStyle || '#000000',
            alignSelf: `center`,
            outline: 'none',
            boxShadow: 'none'
        });

        setEditorDivStyle({
            left: `${screenMin.x}px`,
            top: `${screenMin.y}px`,
            width: `${boxWidth}px`,
            height: `${boxHeight}px`,
             border: 'none',
             backgroundColor: 'transparent',
             position: 'absolute',
             display: 'flex'
            
             
        });

    }, [getWorldToScreenPoint]);


    // Function to draw the selection box and handles
    const drawSelectionBoxAndHandles = useCallback((ctx: CanvasRenderingContext2D, selectedObj: Draw) => {
        const bbox = getBoundingBox(selectedObj);
        const padding = 10 / camera.current.zoom; // Increased padding
        
        // 1. Draw dashed selection box (using translucent color)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)'; // Translucent blue
        ctx.lineWidth = 2 / camera.current.zoom; 
        ctx.setLineDash([5 / camera.current.zoom, 5 / camera.current.zoom]);
        
        const width = bbox.maxX - bbox.minX;
        const height = bbox.maxY - bbox.minY;
        
        ctx.strokeRect(bbox.minX - padding, bbox.minY - padding, 
                       width + 2 * padding, height + 2 * padding);

        ctx.setLineDash([]);
        
        // 2. Define and draw the handles
        const handles: { x: number, y: number, type: HandleType }[] = [];
        const handleSize = 5 / camera.current.zoom;

        // Standard bounding box handles for common shapes
        if (['rectangle', 'diamond', 'circle'].includes(selectedObj.shape)) {
            // Handle positions are offset by the padding
            handles.push(
                { x: bbox.minX - padding, y: bbox.minY - padding, type: 'tl' }, 
                { x: (bbox.minX + bbox.maxX) / 2, y: bbox.minY - padding, type: 'tm' },
                { x: bbox.maxX + padding, y: bbox.minY - padding, type: 'tr' },
                { x: bbox.minX - padding, y: (bbox.minY + bbox.maxY) / 2, type: 'ml' },
                { x: bbox.maxX + padding, y: (bbox.minY + bbox.maxY) / 2, type: 'mr' },
                { x: bbox.minX - padding, y: bbox.maxY + padding, type: 'bl' },
                { x: (bbox.minX + bbox.maxX) / 2, y: bbox.maxY + padding, type: 'bm' },
                { x: bbox.maxX + padding, y: bbox.maxY + padding, type: 'br' },
            );
        } 
        // Special handles for Line/Arrow endpoints
        else if (selectedObj.shape === 'arrow') {
            handles.push(
                { x: selectedObj.startX!, y: selectedObj.startY!, type: 'start' },
                { x: selectedObj.endX!, y: selectedObj.endY!, type: 'end' },
            );
        }
        // FreeHand does not get resize handles

        // Draw the handles
        handles.forEach(handle => {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // Translucent blue fill
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Slightly translucent white stroke
            ctx.lineWidth = 1 / camera.current.zoom; 
            
            ctx.beginPath();
            // Draw a square handle
            ctx.fillRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
            ctx.strokeRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
        });

    }, [selectedDrawId]); // Ensure dependency array reflects what it uses

    // --- MAIN RENDER LOOP ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ratio = window.devicePixelRatio || 1;

        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        canvas.width = displayWidth * ratio;
        canvas.height = displayHeight * ratio;

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply camera transformations (pan and zoom)
        ctx.save();
        ctx.translate(camera.current.x, camera.current.y);
        ctx.scale(camera.current.zoom, camera.current.zoom);

        // Draw all committed shapes
        DrawObjArray.current.forEach((obj) => {
            if (obj.shape === "rectangle") drawRectangle(ctx, obj);
            else if (obj.shape === "circle") drawCircle(ctx, obj);
            else if (obj.shape === "diamond") drawDiamond(ctx, obj);
            else if (obj.shape === 'arrow') drawArrow(ctx, obj);
            else if (obj.shape === 'freeHand') drawFreeHand(ctx, obj);
            
            // Draw text for the shape, but skip if we are currently editing it in the DOM
            if (obj.id !== editingDrawId) {
                drawText(ctx, obj);
            }
        });

        // Draw selection highlight and handles for the selected shape
        if (selectedDrawId !== null) {
            const selectedObj = DrawObjArray.current.find(obj => obj.id === selectedDrawId);
            if (selectedObj) {
                drawSelectionBoxAndHandles(ctx, selectedObj);
            }
        }

        // Draw the shape currently being created
        if (isDrawing.current && currentDraw.current) {
            const obj = currentDraw.current;
            if (obj.shape === "rectangle") drawRectangle(ctx, obj);
            else if (obj.shape === "circle") drawCircle(ctx, obj);
            else if (obj.shape === "diamond") drawDiamond(ctx, obj);
            else if (obj.shape === 'arrow') drawArrow(ctx, obj);
            else if (obj.shape === 'freeHand') drawFreeHand(ctx, obj);
        }

        ctx.restore();
    }, [selectedDrawId, drawSelectionBoxAndHandles, editingDrawId]); 

    // Effect to start the continuous animation loop
    useEffect(() => {
        setIsClient(true);
        let animationFrameId: number;
        const animate = () => {
            draw();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [draw]); 

    // Effect to focus the textarea when editingDrawId changes
    useEffect(() => {
        if (editingDrawId !== null) {
            editorRef.current?.focus();
            // Select all text when opening the editor for easy replacement
            editorRef.current?.select();
        }
    }, [editingDrawId]);


    // Text Editor Handlers (outside of useEffect to access state easily)
    const handleEditorBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        // Find the index in the mutable ref array
        const selectedIndex = DrawObjArray.current.findIndex(obj => obj.id === editingDrawId);

        if (selectedIndex !== -1) {
            // Update the text in the shape object, removing leading/trailing whitespace
            DrawObjArray.current[selectedIndex].text = event.target.value.trim();
        }
        
        // Hide the editor and reset state
        setEditingDrawId(null);
        setEditorStyle({});
        setEditorDivStyle({});
    };

    const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Commit the change and blur on Escape
        if (event.key === 'Escape') {
            event.currentTarget.blur();
        }
    };


    // --- EVENT HANDLERS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (event: MouseEvent) => {
            // Do not allow canvas interaction if text is being edited
            if (editingDrawId !== null) return;

            // Middle mouse button for panning
            if (event.button === 1) {
                event.preventDefault();
                isPanning.current = true;
                panStart.current = { x: event.clientX, y: event.clientY };
                canvas.style.cursor = 'grabbing';
                return;
            }

            // --- SELECT TOOL LOGIC ---
            if (selectedShape === 'select' && event.button === 0) { 
                const clickPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);
                
                // 1. Check for Resize Handle Hit (Must be selected first!)
                if (selectedDrawId !== null) {
                    const hitHandle = findHandleAtPoint(clickPoint.x, clickPoint.y);
                    if (hitHandle) {
                        isResizing.current = true;
                        resizingHandle.current = hitHandle;
                        
                        const selectedObj = DrawObjArray.current.find(obj => obj.id === selectedDrawId)!;
                        const bbox = getBoundingBox(selectedObj);

                        // Store starting data for resizing calculation (Original coordinates are crucial for flipping)
                        resizeStartData.current = {
                            bbox,
                            startX: selectedObj.startX!, 
                            startY: selectedObj.startY!, 
                            endX: selectedObj.endX!, 
                            endY: selectedObj.endY!, 
                        };

                        canvas.style.cursor = getResizeCursor(hitHandle);
                        return;
                    }
                }

                // 2. Check for Shape Hit (for dragging/selection)
                const hitShape = findShapeAtPoint(clickPoint.x, clickPoint.y);

                if (hitShape) {
                    setSelectedDrawId(hitShape.id);
                    isDraggingShape.current = true;
                    
                    // Store original coordinates for drag calculation
                    hitShape.originalStartX = hitShape.startX;
                    hitShape.originalStartY = hitShape.startY;
                    hitShape.originalEndX = hitShape.endX;
                    hitShape.originalEndY = hitShape.endY;

                    if (hitShape.shape === 'freeHand' && hitShape.points) {
                        hitShape.originalPoints = hitShape.points.map(p => ({ x: p.x, y: p.y }));
                    }

                    // Calculate the drag offset 
                    dragOffset.current = {
                        x: clickPoint.x - hitShape.startX!,
                        y: clickPoint.y - hitShape.startY!,
                    };
                    canvas.style.cursor = 'move'; 
                } else {
                    // Nothing was clicked, deselect
                    setSelectedDrawId(null);
                    canvas.style.cursor = 'default';
                }
                return; 
            }
            // --- END SELECT TOOL LOGIC ---

            // --- DRAWING TOOL LOGIC ---
            if (selectedShape !== 'select' && event.button === 0) { 
                setSelectedDrawId(null); 
                isDrawing.current = true;
                const startPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);

                currentDraw.current = {
                    id: currentShapeId.current,
                    shape: selectedShape as Draw['shape'], 
                    startX: startPoint.x,
                    startY: startPoint.y,
                    endX: startPoint.x,
                    endY: startPoint.y,
                    points: selectedShape === 'freeHand' ? [{ x: startPoint.x, y: startPoint.y }] : undefined,
                    fillStyle: currentFillStyle.current,
                    strokeStyle: currentStrokeStyle.current,
                    lineWidth: currentLineWidth.current,
                    isFill: currentIsFill.current,
                };
            }
        };

        const handleMouseUp = () => {
            // Do not allow canvas interaction if text is being edited
            if (editingDrawId !== null) return;
            
            // Stop panning
            if (isPanning.current) {
                isPanning.current = false;
                canvas.style.cursor = selectedShape === 'select' ? 'default' : 'crosshair';
                return;
            }
            
            // Stop resizing
            if (isResizing.current) {
                isResizing.current = false;
                resizingHandle.current = null;
                resizeStartData.current = null;
                // Update cursor
                canvas.style.cursor = selectedDrawId !== null ? 'pointer' : 'default'; 
                return;
            }

            // Stop dragging a selected shape
            if (selectedShape === 'select' && isDraggingShape.current) {
                isDraggingShape.current = false;
                
                dragOffset.current = null;
                
                // Clear original coordinates after drag is committed
                const selectedObj = DrawObjArray.current.find(obj => obj.id === selectedDrawId);
                if (selectedObj) {
                    delete selectedObj.originalStartX;
                    delete selectedObj.originalStartY;
                    delete selectedObj.originalEndX;
                    delete selectedObj.originalEndY;
                    delete selectedObj.originalPoints;
                }
                
                // Reset cursor based on selection status
                canvas.style.cursor = selectedDrawId !== null ? 'pointer' : 'default';
                return;
            }

            // Commit the new shape to the array
            if (isDrawing.current && currentDraw.current) {
                const newShapeId = currentDraw.current.id; // Get the ID of the new shape
                
                DrawObjArray.current.push(currentDraw.current);
                
                currentShapeId.current++;
                isDrawing.current = false;
                currentDraw.current = null;
                
                // NEW LOGIC: Select the new shape and switch to the select tool
                setSelectedDrawId(newShapeId);
                setSelectedShape('select'); 
            }
        };

        const handleMouseMove = (event: MouseEvent) => {
            const currentWorldPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);
            
            // --- TEXT EDITING AFFECTING PANNING/ZOOMING ---
            if (editingDrawId !== null) {
                 // If panning is active, update camera position and recalculate editor position
                if (isPanning.current) {
                    const dx = event.clientX - panStart.current.x;
                    const dy = event.clientY - panStart.current.y;
                    camera.current.x += dx;
                    camera.current.y += dy;
                    panStart.current = { x: event.clientX, y: event.clientY };
                    updateEditorPosition(editingDrawId, camera.current);
                }
                return; // Block other interactions while editing text
            }
            // --- END TEXT EDITING BLOCKER ---

            // Handle panning
            if (isPanning.current) {
                const dx = event.clientX - panStart.current.x;
                const dy = event.clientY - panStart.current.y;
                camera.current.x += dx;
                camera.current.y += dy;
                panStart.current = { x: event.clientX, y: event.clientY };
                return;
            }

            // --- RESIZING SHAPE LOGIC (HIGHEST PRIORITY) ---
            if (isResizing.current && selectedDrawId !== null && resizingHandle.current && resizeStartData.current) {
                const selectedIndex = DrawObjArray.current.findIndex(obj => obj.id === selectedDrawId);
                if (selectedIndex === -1) return;

                const selectedObj = DrawObjArray.current[selectedIndex];
                const handle = resizingHandle.current;
                const startData = resizeStartData.current; // Contains original startX/Y and endX/Y
                const newX = currentWorldPoint.x;
                const newY = currentWorldPoint.y;

                // Handle Arrow/Line Resizing (Endpoints)
                if (selectedObj.shape === 'arrow') {
                    if (handle === 'start') {
                        selectedObj.startX = newX;
                        selectedObj.startY = newY;
                    } else if (handle === 'end') {
                        selectedObj.endX = newX;
                        selectedObj.endY = newY;
                    }
                    return;
                }
                
                // Handle Standard Shape Resizing (Rectangle, Diamond, Circle)
                // Initialize temporary coordinates with the original, fixed points
                let tempStartX = startData.startX;
                let tempStartY = startData.startY;
                let tempEndX = startData.endX;
                let tempEndY = startData.endY;

                // 1. Update X coordinate based on dragged handle
                if (handle.includes('l')) {
                    // Dragging the left boundary, the right boundary (tempEndX) is fixed
                    tempStartX = newX;
                } else if (handle.includes('r')) {
                    // Dragging the right boundary, the left boundary (tempStartX) is fixed
                    tempEndX = newX;
                } 
                
                // 2. Update Y coordinate based on dragged handle
                if (handle.includes('t')) {
                    // Dragging the top boundary, the bottom boundary (tempEndY) is fixed
                    tempStartY = newY;
                } else if (handle.includes('b')) {
                    // Dragging the bottom boundary, the top boundary (tempStartY) is fixed
                    tempEndY = newY;
                }

                // 3. Assign the updated coordinates back to the object
                selectedObj.startX = tempStartX;
                selectedObj.startY = tempStartY;
                selectedObj.endX = tempEndX;
                selectedObj.endY = tempEndY;
                
                return;
            }
            // --- END RESIZING SHAPE LOGIC ---
            
            // --- DRAGGING SHAPE LOGIC ---
            if (selectedShape === 'select' && isDraggingShape.current && selectedDrawId !== null && dragOffset.current) {
                const selectedIndex = DrawObjArray.current.findIndex(obj => obj.id === selectedDrawId);

                if (selectedIndex !== -1) {
                    const selectedObj = DrawObjArray.current[selectedIndex];
                    
                    const targetWorldX = currentWorldPoint.x - dragOffset.current.x;
                    const targetWorldY = currentWorldPoint.y - dragOffset.current.y;
                    
                    const totalDx = targetWorldX - selectedObj.originalStartX!;
                    const totalDy = targetWorldY - selectedObj.originalStartY!;
                    
                    if (selectedObj.shape === 'freeHand' && selectedObj.originalPoints) {
                        // Freehand: Apply the total displacement to ALL original points
                        selectedObj.points = selectedObj.originalPoints.map(p => ({
                            x: p.x + totalDx,
                            y: p.y + totalDy
                        }));
                        
                        selectedObj.startX = selectedObj.originalStartX! + totalDx;
                        selectedObj.startY = selectedObj.originalStartY! + totalDy;
                    } else {
                        // Standard Shapes: Apply the total displacement to start/end points
                        selectedObj.startX = selectedObj.originalStartX! + totalDx;
                        selectedObj.startY = selectedObj.originalStartY! + totalDy;
                        selectedObj.endX = selectedObj.originalEndX! + totalDx;
                        selectedObj.endY = selectedObj.originalEndY! + totalDy;
                    }
                }
                return;
            }
            // --- END DRAGGING SHAPE LOGIC ---
            
            // Handle drawing
            if (isDrawing.current && currentDraw.current) {
                if (currentDraw.current.shape === 'freeHand' && currentDraw.current.points) { 
                    currentDraw.current.points.push({ x: currentWorldPoint.x, y: currentWorldPoint.y });
                } else {
                    currentDraw.current.endX = currentWorldPoint.x;
                    currentDraw.current.endY = currentWorldPoint.y;
                }
            }

            // --- HOVER CURSOR LOGIC ---
            if (selectedShape === 'select' && !isDraggingShape.current && !isPanning.current && selectedDrawId !== null) {
                const hitHandle = findHandleAtPoint(currentWorldPoint.x, currentWorldPoint.y);
                if (hitHandle) {
                    canvas.style.cursor = getResizeCursor(hitHandle);
                    return;
                }
            }

            if (selectedShape === 'select' && !isDraggingShape.current && !isPanning.current) {
                 const hitShape = findShapeAtPoint(currentWorldPoint.x, currentWorldPoint.y);
                 if (hitShape) {
                    canvas.style.cursor = 'pointer';
                 } else {
                    canvas.style.cursor = 'default';
                 }
            } else if (selectedShape !== 'select' && !isDrawing.current && !isPanning.current) {
                canvas.style.cursor = 'crosshair';
            }
        };

       const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const zoomSensitivity = 0.001;
            const minZoom = 0.1;
            const maxZoom = 5;

            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            const canvasX = event.clientX - rect.left;
            const canvasY = event.clientY - rect.top;
            const mousePos = { x: canvasX, y: canvasY };

            const mouseBeforeZoom = getTransformedPoint(mousePos.x, mousePos.y, camera.current);

            const zoomAmount = event.deltaY * -zoomSensitivity;
            const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.current.zoom * (1 + zoomAmount)));
            
            camera.current.zoom = newZoom; 

            const mouseAfterZoom = getTransformedPoint(mousePos.x, mousePos.y, camera.current);
            
            camera.current.x += (mouseBeforeZoom.x - mouseAfterZoom.x) * camera.current.zoom;
            camera.current.y += (mouseBeforeZoom.y - mouseAfterZoom.y) * camera.current.zoom;

            // Update editor position on zoom change
            if (editingDrawId !== null) {
                updateEditorPosition(editingDrawId, camera.current);
            }
        };
        
        // New: Handle double click for text editing
        const handleDoubleClick = (event: MouseEvent) => {
            // Only proceed if the Select tool is active and a shape is selected
            if (selectedShape !== 'select' || selectedDrawId === null) return;
            
            const clickPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);
            const selectedObj = DrawObjArray.current.find(obj => obj.id === selectedDrawId);

            if (selectedObj) {
                const bbox = getBoundingBox(selectedObj);
                const tolerance = 5 / camera.current.zoom;

                // Check if double click is inside the selected shape's bounds
                if (isPointInBoundingBox(clickPoint.x, clickPoint.y, bbox, tolerance)) {
                    
                    // Update editor position and set editing state
                    updateEditorPosition(selectedDrawId, camera.current);
                    setEditingDrawId(selectedDrawId);
                }
            }
        };

        // Attach event listeners to the canvas element
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("wheel", handleWheel);
        canvas.addEventListener("dblclick", handleDoubleClick);
        
        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("dblclick", handleDoubleClick);
        };
    }, [
        isClient, selectedShape, selectedDrawId, getTransformedPoint, findShapeAtPoint, 
        findHandleAtPoint, getResizeCursor, editingDrawId, updateEditorPosition
    ]); 

    return (
        <>
            <div className="fixed top-4 left-1/2 -translate-x-1/2 transform z-10">
                <ToolSelector selectedShape={selectedShape} setSelectedShape={setSelectedShape as Dispatch<SetStateAction<Shape>>} />
            </div>
            
            {/* The main drawing surface */}
            {isClient ?
                <canvas
                    ref={canvasRef}
                    className={`bg-blue-100 w-full h-full ${selectedShape !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
                /> :
                <div className="w-screen h-screen bg-blue-100" />
            }
            
            {/* Floating Text Editor (DOM Overlay) */}
            {editingDrawId !== null && (
                <div style={editorDivStyle}>
                <textarea
                    ref={editorRef}
                    // Fetch the current text from the mutable ref array
                    defaultValue={DrawObjArray.current.find(d => d.id === editingDrawId)?.text || ''}
                    onBlur={handleEditorBlur}
                    onKeyDown={handleEditorKeyDown}
                    style={editorStyle}
                    // Add tailwind-like classes for basic styling robustness
                    className="absolute p-1 border-2 border-blue-500 rounded-lg shadow-xl outline-none bg-white/90"
                /></div>
            )}
        </>
    )
}

export default Canvas;
