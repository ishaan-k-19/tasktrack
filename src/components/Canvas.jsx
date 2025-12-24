import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import Draggable from "react-draggable";

const Canvas = forwardRef((props, ref) => {
  const initialState = Array.isArray(props?.initialState) ? props.initialState : [];
  const [lines, setLines] = useState(initialState);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("black");
  const stageRef = React.useRef();
  const [image, setImage] = useState(null);

  const [canvasSize, setCanvasSize] = useState({
    width: 900,
    height: 1200,
  });

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setLines((prevLines) => [
      ...(Array.isArray(prevLines) ? prevLines : []),
      {
        points: [pos.x, pos.y],
        stroke: color, // Always use the color for the pen
        strokeWidth,
        tool, // Add the current tool to the line data
      },
    ]);
  };
  
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    setLines((prevLines) => {
      const lastLine = prevLines[prevLines.length - 1];
      const newPoints = lastLine.points.concat([pos.x, pos.y]);
      return [...prevLines.slice(0, -1), { ...lastLine, points: newPoints }];
    });
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  

  const exportCanvas = () => ({
    lines,
    imageData: stageRef.current.toDataURL({ mimeType: "image/png" }),
  });

  const clearCanvas = () => setLines([]);

  useImperativeHandle(ref, () => ({ exportCanvas }));

  return (
    <div className="relative h-full overflow-y-auto" style={{ height: "80vh" }}>
      <div className="border overflow-y-auto" style={{ height: "100%" }}>
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            )}
            {Array.isArray(lines) &&
              lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === "eraser" ? "destination-out" : "source-over"
                  }
                />
              ))}
          </Layer>
        </Stage>
      </div>

      <Draggable>
        <div
          className="absolute top-2 left-2 bg-slate-100 p-2 rounded shadow-lg flex flex-wrap items-center gap-3"
          style={{ zIndex: 10, cursor: "move" }}
          aria-label="Canvas Tools"
        >
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${
              tool === "pen" ? "bg-blue-500 text-white" : "bg-neutral-200"
            }`}
            title="Pen Tool"
          >
            🖊️
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded ${
              tool === "eraser" ? "bg-blue-500 text-white" : "bg-neutral-200"
            }`}
            title="Eraser Tool"
          >
            🧽
          </button>

          <button
            onClick={clearCanvas}
            className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
            title="Clear Canvas"
          >
            🗑️
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="strokeWidth" className="text-sm">
              Size:
            </label>
            <input
              id="strokeWidth"
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm">{strokeWidth}px</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            <div className="flex gap-1">
              {["black", "red", "green", "brown", "blue"].map((col) => (
                <div
                  key={col}
                  onClick={() => setColor(col)}
                  className={`w-6 h-6 rounded-full cursor-pointer ${
                    color === col ? "border-2 border-neutral-700" : "border"
                  }`}
                  style={{ backgroundColor: col }}
                  title={`Choose ${col}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
});

export default Canvas;
