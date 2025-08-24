"use client";

import { useState, useRef, useEffect } from "react";
import { Draw } from "../types";

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
  ctx.beginPath();
  ctx.roundRect(
    diagram.startX!,
    diagram.startY!,
    diagram.endX! - diagram.startX!,
    diagram.endY! - diagram.startY!,
    cornerRadius
  );
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
}

function clearAndRenderFullCanvas(ctx: CanvasRenderingContext2D ,DrawObjs: Draw[]){
    DrawObjs.forEach((obj:Draw) => {

        // ctx.clear();

        if(obj.shape === "rectangle"){
            drawRectangle(ctx, obj);
        }
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
    const [selectedShape, setSelectedShape] = useState<
        | "rectangle"
        | "diamond"
        | "circle"
        | "line"
        | "arrow"
        | "text"
        | "freeHand"
        | null
    >("rectangle");

    useEffect(()=>{
        setisClient(true);
    },[]);

    useEffect(()=>{
        
    },[]);

    useEffect(() => {
        if(canvasRef.current)
        canvasCTX.current = canvasRef.current.getContext("2d");
        

        const handleMouseDown = (event: MouseEvent) => {
            //console.log('mouse down');
            isDraging.current = true;
            DrawStartPoint.current = {x: event.offsetX , y: event.offsetY };
            //console.log("DrawStartPoint:",DrawStartPoint.current.x, DrawStartPoint.current.y);

        };
        const handleMouseUp = (event: MouseEvent) => { 
            if(!canvasCTX) return;

             //console.log('mouse up');
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

            };


            DrawObjArray.current.push(newDraw);
            canvasCTX.current!.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);
            //@ts-ignore
            clearAndRenderFullCanvas(canvasCTX.current, DrawObjArray.current);

        
        }
        };
        const handleMouseMove = (event: MouseEvent) => { 

            // if(isDraging.current){
             //console.log('mouse move');
             //console.log("currentpointx:",event.offsetX,"currentpointy:",event.offsetY);
            DrawDragPoint.current = {x: event.offsetX , y: event.offsetX };
        };
        const handleKeyDown = (event: KeyboardEvent) => { };
        const handleScroll = (event: MouseEvent) => { };


        canvasRef.current.addEventListener("mousedown", handleMouseDown);
        canvasRef.current.addEventListener("mouseup", handleMouseUp);
        canvasRef.current.addEventListener("mousemove", handleMouseMove);
        canvasRef.current.addEventListener("keydown", handleKeyDown);
        canvasRef.current.addEventListener("wheel", handleScroll);

        return () => {
        canvasRef.current.removeEventListener("mousedown", handleMouseDown);
        canvasRef.current.removeEventListener("mouseup", handleMouseUp);
        canvasRef.current.removeEventListener("mousemove", handleMouseMove);
        canvasRef.current.removeEventListener("keydown", handleKeyDown);
        canvasRef.current.removeEventListener("wheel", handleScroll);
    };
    }, []);
    return (
        
        isClient?
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="bg-blue-200"
        /> : 
        <canvas
            ref={canvasRef}
            className="bg-blue-200"
        />

    )
}

export default Canvas