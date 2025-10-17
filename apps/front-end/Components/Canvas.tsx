"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Draw } from "../types";
import { ToolSelector } from "./ToolSelector";
// import shape

// --- SHAPE DRAWING FUNCTIONS (Unchanged) ---
// These functions now operate in "world space". The canvas transform handles the rest.
function drawArrow(ctx: CanvasRenderingContext2D, diagram: Draw) {
    if (
        diagram.startX === undefined || diagram.startY === undefined ||
        diagram.endX === undefined || diagram.endY === undefined
    ) return;
    const { startX, startY, endX, endY, strokeStyle, lineWidth } = diagram;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    const headLength = 15 / (ctx.getTransform().a); // Scale arrowhead size based on zoom
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
    // Check for required points array and minimum length
    if (!diagram.points || diagram.points.length < 2) return;
    
    const { points, strokeStyle, lineWidth } = diagram;
    
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round'; // Ensures smooth ends
    ctx.lineJoin = 'round'; // Ensures smooth joints between segments

    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);

    // Connect all subsequent points
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
    }

    ctx.stroke();
}

const Canvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState<boolean>(false);

    // --- STATE MANAGEMENT ---
    // Use refs for state that changes frequently to avoid re-renders.
    const DrawObjArray = useRef<Draw[]>([]);
    const currentShapeId = useRef<number>(1);
    const currentDraw = useRef<Draw | null>(null); // For the shape currently being drawn
    const isDrawing = useRef<boolean>(false);

    // --- INFINITE CANVAS STATE ---
    const camera = useRef({ x: 0, y: 0, zoom: 1 });
    const isPanning = useRef<boolean>(false);
    const panStart = useRef({ x: 0, y: 0 });

    // Tool and style settings
    const currentLineWidth = useRef<number>(2);
    const currentStrokeStyle = useRef<string>("#000000");
    const currentFillStyle = useRef<string>("#FFFFFF");
    const currentIsFill = useRef<boolean>(false);
    const [selectedShape, setSelectedShape] = useState<"rectangle" | "diamond" | "circle" | "arrow" | "freeHand" | "select">("select");

    // --- COORDINATE TRANSFORMATION ---
    // Converts screen coordinates (e.g., from a mouse event) to world coordinates.
    // --- CORRECTED COORDINATE TRANSFORMATION ---
    // Converts screen coordinates (x, y) to world coordinates.
  // --- MODIFIED COORDINATE TRANSFORMATION ---
    // Takes screen coordinates (x, y) AND the current camera state.
    const getTransformedPoint = useCallback((x: number, y: number, cameraState: { x: number, y: number, zoom: number }) => {
        const panX = cameraState.x;
        const panY = cameraState.y;
        const zoom = cameraState.zoom;

        // W = (S - P) / Z
        const worldX = (x - panX) / zoom;
        const worldY = (y - panY) / zoom;
        
        return { x: worldX, y: worldY };
    }, []); // Dependency array remains empty as it no longer accesses the ref directly

    // --- MAIN RENDER LOOP ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ratio = window.devicePixelRatio || 1;

        // Get the actual display size (CSS size)
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        // Set the canvas's internal drawing buffer size (multiplied by ratio)
        canvas.width = displayWidth * ratio;
        canvas.height = displayHeight * ratio;

        // Set the canvas's display size (CSS size)
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Scale the drawing context by the ratio
        ctx.scale(ratio, ratio);
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply camera transformations (pan and zoom)
        ctx.save();
        ctx.translate(camera.current.x, camera.current.y);
        ctx.scale(camera.current.zoom, camera.current.zoom);

        // Draw all committed shapes
        DrawObjArray.current.forEach((obj) => {
            if (obj.shape === "rectangle") drawRectangle(ctx, obj);
            if (obj.shape === "circle") drawCircle(ctx, obj);
            if (obj.shape === "diamond") drawDiamond(ctx, obj);
            if (obj.shape === 'arrow') drawArrow(ctx, obj);
            if (obj.shape === 'freeHand') drawFreeHand(ctx, obj);
        });

        // Draw the shape currently being created
        if (isDrawing.current && currentDraw.current) {
            const obj = currentDraw.current;
            if (obj.shape === "rectangle") drawRectangle(ctx, obj);
            if (obj.shape === "circle") drawCircle(ctx, obj);
            if (obj.shape === "diamond") drawDiamond(ctx, obj);
            if (obj.shape === 'arrow') drawArrow(ctx, obj);
            if (obj.shape === 'freeHand') drawFreeHand(ctx, obj);
        }

        ctx.restore();
    }, []);

    useEffect(() => {
        setIsClient(true);
        const animationFrameId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationFrameId);
    }, [draw]);

    // --- EVENT HANDLERS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (event: MouseEvent) => {
            // Middle mouse button for panning
            if (event.button === 1) {
                event.preventDefault(); // <-- ADD THIS LINE
                isPanning.current = true;
                panStart.current = { x: event.clientX, y: event.clientY };
                canvas.style.cursor = 'grabbing';
                return;
            }

            if (selectedShape !== 'select') {
                isDrawing.current = true;
                const startPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);

                currentDraw.current = {
                    id: currentShapeId.current,
                    shape: selectedShape,
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
            // Stop panning
            if (isPanning.current) {
                isPanning.current = false;
                canvas.style.cursor = 'default';
            }

            // Commit the new shape to the array
            if (isDrawing.current && currentDraw.current) {
                DrawObjArray.current.push(currentDraw.current);
                currentShapeId.current++;
                isDrawing.current = false;
                currentDraw.current = null;
            }
            draw();
        };

        const handleMouseMove = (event: MouseEvent) => {
            // Handle panning
            if (isPanning.current) {
                const dx = event.clientX - panStart.current.x;
                const dy = event.clientY - panStart.current.y;
                camera.current.x += dx;
                camera.current.y += dy;
                panStart.current = { x: event.clientX, y: event.clientY };
                draw();
                return;
            }

            // Handle drawing
            if (isDrawing.current && currentDraw.current) {
                const currentPoint = getTransformedPoint(event.offsetX, event.offsetY, camera.current);

                if (currentDraw.current.shape === 'freeHand' && currentDraw.current.points) { 
                    currentDraw.current.points.push({ x: currentPoint.x, y: currentPoint.y });
                } else {
                currentDraw.current.endX = currentPoint.x;
                currentDraw.current.endY = currentPoint.y;}
                draw();
            }
        };

       const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomSensitivity = 0.001;
    const minZoom = 0.1;
    const maxZoom = 5;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get accurate mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const mousePos = { x: canvasX, y: canvasY };

    // 1. Calculate the World Point under the mouse BEFORE any change
    const mouseBeforeZoom = getTransformedPoint(mousePos.x, mousePos.y, camera.current);

    // 2. Determine and set the NEW zoom level
    const zoomAmount = event.deltaY * -zoomSensitivity;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.current.zoom * (1 + zoomAmount)));
    
    // CRUCIAL STEP: Update the camera's zoom immediately.
    camera.current.zoom = newZoom; 

    // 3. Calculate where the mouse's Screen Position NOW maps to in the World
    const mouseAfterZoom = getTransformedPoint(mousePos.x, mousePos.y, camera.current);
    
    // 4. Apply the pan correction (Offset)
    // The difference (WorldBefore - WorldAfter) is scaled by the NEW zoom.
    camera.current.x += (mouseBeforeZoom.x - mouseAfterZoom.x) * camera.current.zoom;
    camera.current.y += (mouseBeforeZoom.y - mouseAfterZoom.y) * camera.current.zoom;
    
    draw();
};

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("wheel", handleWheel);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, [isClient, selectedShape, draw, getTransformedPoint]);


    return (
        <>
            <div className="fixed top-4 left-1/2 -translate-x-1/2 transform z-10">
                <ToolSelector selectedShape={selectedShape} setSelectedShape={setSelectedShape} />
            </div>
            {isClient ?
                <canvas
                    ref={canvasRef}
                    className="bg-blue-200 w-full h-full"
                /> :
                <div className="w-screen h-screen bg-blue-200" /> // Placeholder for SSR
            }
        </>
    )
}

export default Canvas;