"use client";

import { useState, useRef, useEffect } from "react";
import { Draw } from "../types";
function drawDiamond(ctx: CanvasRenderingContext2D, diagram: Draw) {
  const { startX, startY, endX, endY, strokeStyle, fillStyle, lineWidth, isFill } = diagram;

  const cx = (startX! + endX!) / 2;
  const cy = (startY! + endY!) / 2;

  const dx = Math.abs(endX! - startX!) / 2;
  const dy = Math.abs(endY! - startY!) / 2;

  // Clamp corner radius
  const radius = Math.min(dx, dy) * 0.2;

  // Calculate the 4 corners of the diamond (rotated rectangle)
  const top = { x: cx, y: cy - dy };
  const right = { x: cx + dx, y: cy };
  const bottom = { x: cx, y: cy + dy };
  const left = { x: cx - dx, y: cy };

  // Unit vectors for directions between points (needed for corner rounding)
  function unitVec(p1: {x:number,y:number}, p2: {x:number,y:number}) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    return { x: dx / len, y: dy / len };
  }

  const topToRight = unitVec(top, right);
  const rightToBottom = unitVec(right, bottom);
  const bottomToLeft = unitVec(bottom, left);
  const leftToTop = unitVec(left, top);

  ctx.beginPath();
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.lineWidth = lineWidth;

  // Start at top, move slightly inward
  ctx.moveTo(top.x + topToRight.x * radius, top.y + topToRight.y * radius);

  // Top-right corner
  ctx.lineTo(right.x - topToRight.x * radius, right.y - topToRight.y * radius);
  ctx.quadraticCurveTo(right.x, right.y, right.x + rightToBottom.x * radius, right.y + rightToBottom.y * radius);

  // Bottom-right corner
  ctx.lineTo(bottom.x - rightToBottom.x * radius, bottom.y - rightToBottom.y * radius);
  ctx.quadraticCurveTo(bottom.x, bottom.y, bottom.x + bottomToLeft.x * radius, bottom.y + bottomToLeft.y * radius);

  // Bottom-left corner
  ctx.lineTo(left.x - bottomToLeft.x * radius, left.y - bottomToLeft.y * radius);
  ctx.quadraticCurveTo(left.x, left.y, left.x + leftToTop.x * radius, left.y + leftToTop.y * radius);

  // Top-left corner
  ctx.lineTo(top.x - leftToTop.x * radius, top.y - leftToTop.y * radius);
  ctx.quadraticCurveTo(top.x, top.y, top.x + topToRight.x * radius, top.y + topToRight.y * radius);

  ctx.closePath();

  if (isFill) ctx.fill();
  ctx.stroke();
}





function drawRectangle(ctx: CanvasRenderingContext2D, diagram: Draw) {
  const cornerRadius = Math.min(
    20,
    Math.min(
      Math.abs(diagram.endX! - diagram.startX!),
      Math.abs(diagram.endY! - diagram.startY!)
    ) * 0.2,
    Math.min(
      Math.abs(diagram.endX! - diagram.startX!),
      Math.abs(diagram.endY! - diagram.startY!)
    ) / 2
  );
  ctx.strokeStyle= diagram.strokeStyle;
  ctx.fillStyle = diagram.fillStyle;
  ctx.lineWidth = diagram.lineWidth;
  ctx.beginPath();
  ctx.roundRect(
    diagram.startX!,
    diagram.startY!,
    diagram.endX! - diagram.startX!,
    diagram.endY! - diagram.startY!,
    cornerRadius
  );
  ctx.stroke();
  if(diagram.isFill)
  ctx.fill();
  ctx.closePath();
}
function drawCircle(ctx: CanvasRenderingContext2D, diagram: Draw) {
  const centerX = (diagram.startX! + diagram.endX!) / 2;
  const centerY = (diagram.startY! + diagram.endY!) / 2;

  const radiusX = Math.abs(diagram.endX! - diagram.startX!) / 2;
  const radiusY = Math.abs(diagram.endY! - diagram.startY!) / 2;


  ctx.strokeStyle= diagram.strokeStyle;
  ctx.fillStyle = diagram.fillStyle;
  ctx.lineWidth = diagram.lineWidth;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
  if(diagram.isFill)
  ctx.fill();
  ctx.closePath();
}

function clearAndRenderFullCanvas(ctx: CanvasRenderingContext2D | null  ,DrawObjs: Draw[]){
    if(!ctx)return;
    DrawObjs.forEach((obj:Draw) => {

        // ctx.clear();

        if(obj.shape === "rectangle"){
            drawRectangle(ctx, obj);
        }
        if(obj.shape === "circle") {drawCircle(ctx,obj);
            console.log("circle");
        }
        if(obj.shape === "diamond")drawDiamond(ctx,obj);
    });
}



const Canvas = () => {



    const currentDraw = useRef<Draw>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // const [canvasRefUS, setCanvasRefUS] = useState<HTMLCanvasElement | null>(null);
    const [isClient, setisClient] = useState<boolean>(false);
    const isCloud = useRef<boolean>(false);
    const currentShapeId = useRef<number>(1);
    const DrawStartPoint= useRef<{x: number, y: number}>({x: 0,y: 0});
    const DrawEndPoint = useRef<{x: number, y: number}>({x: 0,y: 0});
    const DrawDragPoint = useRef<{x: number, y: number}>({x: 0,y: 0});
    const DrawObjArray = useRef<Draw[]>([]);
    const isDraging = useRef<boolean>(false);
    const canvasCTX = useRef<CanvasRenderingContext2D>(null);
    const currentLineWidth= useRef<number>(5);
    const currentStrokeStyle = useRef<string>("000000");
    const currentFillStyle = useRef<string>("FFFFFF")
    const currentIsFill = useRef<boolean>(false);
    const [selectedShape, setSelectedShape] = useState<
        | "rectangle"
        | "diamond"
        | "circle"
        | "line"
        | "arrow"
        | "text"
        | "freeHand"
        | null
    >("diamond");

    useEffect(()=>{
        setisClient(true);
    },[]);

    useEffect(()=>{
        
    },[]);

    useEffect(() => {
        if(!canvasRef.current)return;
        canvasCTX.current = canvasRef.current.getContext("2d");
        

        const handleMouseDown = (event: MouseEvent) => {
            console.log('mouse down');
            isDraging.current = true;
            DrawStartPoint.current = {x: event.offsetX , y: event.offsetY };
            //console.log("DrawStartPoint:",DrawStartPoint.current.x, DrawStartPoint.current.y);

        };
        const handleMouseUp = (event: MouseEvent) => { 
            if(!canvasCTX) return;

             console.log('mouse up');
            isDraging.current = false;
            DrawEndPoint.current = {x: event.offsetX , y: event.offsetY };
            //console.log("Draw-end-point:",DrawEndPoint.current.x,DrawEndPoint.current.y);

            if(selectedShape === "rectangle"){
            const newDraw: Draw = {
                id: currentShapeId.current++,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawEndPoint.current.x,
                endY : DrawEndPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current


            };


            DrawObjArray.current.push(newDraw);
            currentShapeId.current++;
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            //@ts-ignore
            clearAndRenderFullCanvas(canvasCTX.current, DrawObjArray.current);

        
        }

             if(selectedShape === "circle"){
                const newDraw: Draw = {
                id: currentShapeId.current,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawDragPoint.current.x,
                endY : DrawDragPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current

            };
             DrawObjArray.current.push(newDraw);
            currentShapeId.current++;
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            clearAndRenderFullCanvas(canvasCTX.current, [...DrawObjArray.current,newDraw]);}



             if(selectedShape === "diamond"){
                const newDraw: Draw = {
                id: currentShapeId.current,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawDragPoint.current.x,
                endY : DrawDragPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current

            };
             DrawObjArray.current.push(newDraw);
            currentShapeId.current++;
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            clearAndRenderFullCanvas(canvasCTX.current, DrawObjArray.current);}
        };
        const handleMouseMove = (event: MouseEvent) => { 
            if(!isDraging.current) return;
            // if(isDraging.current){
             console.log('mouse move');
             //console.log("currentpointx:",event.offsetX,"currentpointy:",event.offsetY);
            DrawDragPoint.current = {x: event.offsetX , y: event.offsetY };
            if(selectedShape === "rectangle"){
            const newDraw: Draw = {
                id: currentShapeId.current,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawDragPoint.current.x,
                endY : DrawDragPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current

            };
            
            // console.log(newDraw);
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            clearAndRenderFullCanvas(canvasCTX.current, [...DrawObjArray.current,newDraw]);}

            if(selectedShape === "circle"){
                const newDraw: Draw = {
                id: currentShapeId.current,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawDragPoint.current.x,
                endY : DrawDragPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current

            };
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            clearAndRenderFullCanvas(canvasCTX.current, [...DrawObjArray.current,newDraw]);}
            
            if(selectedShape === "diamond"){
                console.log('272 line')
            const newDraw: Draw = {
                id: currentShapeId.current,
                shape : selectedShape,
                startX: DrawStartPoint.current.x,
                startY: DrawStartPoint.current.y,
                endX: DrawDragPoint.current.x,
                endY : DrawDragPoint.current.y,
                fillStyle: currentFillStyle.current,
                strokeStyle: currentStrokeStyle.current,
                lineWidth: currentLineWidth.current,
                isFill: currentIsFill.current

            };
            
            // console.log(newDraw);
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            clearAndRenderFullCanvas(canvasCTX.current, [...DrawObjArray.current,newDraw]);}
            
            
        };
        const handleKeyDown = (event: KeyboardEvent) => { };
        const handleScroll = (event: MouseEvent) => { };


        canvasRef.current.addEventListener("mousedown", handleMouseDown);
        canvasRef.current.addEventListener("mouseup", handleMouseUp);
        canvasRef.current.addEventListener("mousemove", handleMouseMove);
        canvasRef.current.addEventListener("keydown", handleKeyDown);
        canvasRef.current.addEventListener("wheel", handleScroll);

        return () => {if(canvasRef.current){
        canvasRef.current.removeEventListener("mousedown", handleMouseDown);
        canvasRef.current.removeEventListener("mouseup", handleMouseUp);
        canvasRef.current.removeEventListener("mousemove", handleMouseMove);
        canvasRef.current.removeEventListener("keydown", handleKeyDown);
        canvasRef.current.removeEventListener("wheel", handleScroll);}
    };
    }, [isClient]);
    return (
        
        isClient?
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="bg-white"
        /> : 
        <canvas
            ref={canvasRef}
            className="bg-white"
        />

    )
}

export default Canvas