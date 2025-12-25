import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, RegularPolygon, Star } from "react-konva";
import {
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Triangle,
  Diamond,
  Star as StarIcon,
  Hexagon,
  Palette,
  PaintBucket,
} from "lucide-react";

// Custom draggable hook (React 19 compatible replacement for react-draggable)
const useDraggable = (initialPosition = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const parent = dragRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const newX = e.clientX - parentRect.left - offsetRef.current.x;
    const newY = e.clientY - parentRect.top - offsetRef.current.y;

    setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { dragRef, position, handleMouseDown, isDragging };
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Migrate old canvas data format to new format
const migrateCanvasData = (data) => {
  if (!data) return [];
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    // Already in new format
    if (item.id && item.type) return item;

    // Migrate old format
    return {
      id: generateId(),
      type: item.tool === "eraser" ? "eraser" : "line",
      stroke: item.stroke || "black",
      strokeWidth: item.strokeWidth || 2,
      opacity: 1.0,
      points: item.points || [],
    };
  });
};

// Point simplification (Ramer-Douglas-Peucker algorithm)
const simplifyPoints = (points, tolerance = 2) => {
  if (points.length <= 4) return points;

  const pointsAsObjects = [];
  for (let i = 0; i < points.length; i += 2) {
    pointsAsObjects.push({ x: points[i], y: points[i + 1] });
  }

  const sqTolerance = tolerance * tolerance;

  const getSqSegDist = (p, p1, p2) => {
    let x = p1.x,
      y = p1.y,
      dx = p2.x - x,
      dy = p2.y - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
  };

  const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
    let maxSqDist = sqTolerance,
      index;
    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }
    if (maxSqDist > sqTolerance) {
      if (index - first > 1)
        simplifyDPStep(points, first, index, sqTolerance, simplified);
      simplified.push(points[index]);
      if (last - index > 1)
        simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  };

  const simplifyDP = (points, sqTolerance) => {
    const last = points.length - 1;
    const simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);
    return simplified;
  };

  const simplified = simplifyDP(pointsAsObjects, sqTolerance);
  return simplified.flatMap((p) => [p.x, p.y]);
};

// Custom hook for canvas history (undo/redo)
const useCanvasHistory = (initialState = []) => {
  const [history, setHistory] = useState({
    past: [],
    present: migrateCanvasData(initialState),
    future: [],
  });
  const maxHistory = 50;

  const push = useCallback((newState) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present].slice(-maxHistory),
      present: newState,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present].slice(-maxHistory),
      present: [],
      future: [],
    }));
  }, []);

  const setObjects = useCallback((objects) => {
    setHistory((prev) => ({
      ...prev,
      present: objects,
    }));
  }, []);

  return {
    objects: history.present,
    push,
    undo,
    redo,
    clear,
    setObjects,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};

// Shape renderer component
const ShapeRenderer = ({ objects }) => {
  return objects.map((obj) => {
    if (!obj || !obj.id) return null;

    switch (obj.type) {
      case "line":
      case "highlighter":
      case "eraser":
        return (
          <Line
            key={obj.id}
            points={obj.points || []}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            opacity={obj.opacity || 1}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              obj.type === "eraser" ? "destination-out" : "source-over"
            }
          />
        );
      case "rectangle":
        return (
          <Rect
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "circle":
        return (
          <Circle
            key={obj.id}
            x={obj.x}
            y={obj.y}
            radius={obj.radius}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "triangle":
        return (
          <RegularPolygon
            key={obj.id}
            x={obj.x}
            y={obj.y}
            sides={3}
            radius={obj.radius}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "diamond":
        return (
          <RegularPolygon
            key={obj.id}
            x={obj.x}
            y={obj.y}
            sides={4}
            radius={obj.radius}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "hexagon":
        return (
          <RegularPolygon
            key={obj.id}
            x={obj.x}
            y={obj.y}
            sides={6}
            radius={obj.radius}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "star":
        return (
          <Star
            key={obj.id}
            x={obj.x}
            y={obj.y}
            numPoints={5}
            innerRadius={obj.radius * 0.4}
            outerRadius={obj.radius}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            fill={obj.fill || "transparent"}
            opacity={obj.opacity || 1}
          />
        );
      case "straightLine":
        return (
          <Line
            key={obj.id}
            points={[obj.x, obj.y, obj.endX, obj.endY]}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            opacity={obj.opacity || 1}
            lineCap="round"
          />
        );
      case "arrow":
        return (
          <Arrow
            key={obj.id}
            points={[obj.x, obj.y, obj.endX, obj.endY]}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            opacity={obj.opacity || 1}
            pointerLength={10}
            pointerWidth={10}
            fill={obj.stroke}
          />
        );
      case "text":
        return (
          <Text
            key={obj.id}
            x={obj.x}
            y={obj.y}
            text={obj.text}
            fontSize={obj.fontSize || 18}
            fill={obj.stroke}
            opacity={obj.opacity || 1}
          />
        );
      default:
        return null;
    }
  });
};

// Text input overlay component - Fixed positioning
const TextOverlay = ({ position, onComplete, onCancel, color, scrollContainerRef }) => {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      onComplete(text);
    } else {
      onCancel();
    }
  };

  // Calculate position relative to the scroll container
  const scrollLeft = scrollContainerRef?.current?.scrollLeft || 0;
  const scrollTop = scrollContainerRef?.current?.scrollTop || 0;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x - scrollLeft,
        top: position.y - scrollTop,
        zIndex: 100,
      }}
    >
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        style={{
          fontSize: "18px",
          border: `2px dashed ${color}`,
          padding: "4px 8px",
          borderRadius: "4px",
          outline: "none",
          minWidth: "150px",
          backgroundColor: "white",
          color: color,
        }}
        placeholder="Type here..."
      />
    </div>
  );
};

// Tool button component
const ToolButton = ({ active, onClick, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded text-lg transition-colors ${
      active
        ? "bg-blue-500 text-white"
        : disabled
        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
        : "bg-neutral-200 hover:bg-neutral-300"
    }`}
    title={title}
  >
    {children}
  </button>
);

// Color button component
const ColorButton = ({ color, active, onClick, isCustom }) => (
  <div
    onClick={onClick}
    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
      active ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-105"
    } ${isCustom ? "flex items-center justify-center border-2 border-dashed border-neutral-400" : ""}`}
    style={{ backgroundColor: isCustom ? "white" : color }}
    title={isCustom ? "Custom color" : color}
  >
    {isCustom && <Palette size={14} className="text-neutral-500" />}
  </div>
);

// Custom color picker component
const CustomColorPicker = ({ color, onChange, onClose }) => {
  return (
    <div className="absolute z-50 bg-white p-3 rounded-lg shadow-xl border">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-neutral-600">Custom:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer border-0 p-0"
        />
        <span className="text-xs text-neutral-500 font-mono">{color}</span>
      </div>
      <button
        onClick={onClose}
        className="text-xs text-blue-500 hover:underline"
      >
        Done
      </button>
    </div>
  );
};

const Canvas = forwardRef((props, ref) => {
  const initialState = Array.isArray(props?.initialState) ? props.initialState : [];

  // Canvas history for undo/redo
  const { objects, push, undo, redo, clear, canUndo, canRedo } =
    useCanvasHistory(initialState);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentObject, setCurrentObject] = useState(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("black");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [customColor, setCustomColor] = useState("#ff6b6b");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState("stroke"); // "stroke" or "fill"

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showShapesPanel, setShowShapesPanel] = useState(false);

  // Draggable toolbar
  const { dragRef, position: toolbarPosition, handleMouseDown: handleToolbarDrag } = useDraggable({ x: 8, y: 8 });

  // Refs
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lastCenter = useRef(null);
  const lastDist = useRef(0);
  const drawStartPos = useRef(null);

  const [canvasSize] = useState({
    width: 900,
    height: 1200,
  });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Get pressure from event (for Apple Pencil support)
  const getPressure = useCallback((e) => {
    if (e.evt?.pressure !== undefined && e.evt.pressure > 0) {
      return e.evt.pressure;
    }
    if (e.evt?.touches?.[0]?.force !== undefined) {
      return e.evt.touches[0].force;
    }
    return 0.5;
  }, []);

  // Get distance between two touch points
  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Get center between two touch points
  const getCenter = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  // Shape tools that support fill
  const shapeTools = ["rectangle", "circle", "triangle", "diamond", "hexagon", "star"];
  const isShapeTool = shapeTools.includes(tool);

  // Handle drawing start
  const handleDrawStart = useCallback(
    (e) => {
      // Handle pinch zoom (2 fingers)
      if (e.evt.touches && e.evt.touches.length === 2) {
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      const pressure = getPressure(e);
      const adjustedWidth = strokeWidth * (0.5 + pressure);

      // Handle text tool
      if (tool === "text") {
        setTextPosition({ x: pos.x, y: pos.y });
        setShowTextInput(true);
        return;
      }

      setIsDrawing(true);
      drawStartPos.current = pos;

      const baseProps = {
        id: generateId(),
        stroke: color,
        strokeWidth: tool === "highlighter" ? strokeWidth * 2 : adjustedWidth,
        opacity: tool === "highlighter" ? 0.4 : 1.0,
        fill: isShapeTool ? fillColor : undefined,
      };

      switch (tool) {
        case "pen":
        case "highlighter":
          setCurrentObject({
            ...baseProps,
            type: tool === "highlighter" ? "highlighter" : "line",
            points: [pos.x, pos.y],
          });
          break;
        case "eraser":
          setCurrentObject({
            ...baseProps,
            type: "eraser",
            strokeWidth: strokeWidth * 2,
            points: [pos.x, pos.y],
          });
          break;
        case "rectangle":
          setCurrentObject({
            ...baseProps,
            type: "rectangle",
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
          });
          break;
        case "circle":
        case "triangle":
        case "diamond":
        case "hexagon":
        case "star":
          setCurrentObject({
            ...baseProps,
            type: tool,
            x: pos.x,
            y: pos.y,
            radius: 0,
          });
          break;
        case "line":
          setCurrentObject({
            ...baseProps,
            type: "straightLine",
            x: pos.x,
            y: pos.y,
            endX: pos.x,
            endY: pos.y,
          });
          break;
        case "arrow":
          setCurrentObject({
            ...baseProps,
            type: "arrow",
            x: pos.x,
            y: pos.y,
            endX: pos.x,
            endY: pos.y,
          });
          break;
        default:
          break;
      }
    },
    [tool, color, fillColor, strokeWidth, getPressure, isShapeTool]
  );

  // Handle drawing move
  const handleDrawMove = useCallback(
    (e) => {
      // Handle pinch zoom
      if (e.evt.touches && e.evt.touches.length === 2) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const p1 = { x: touch1.clientX, y: touch1.clientY };
        const p2 = { x: touch2.clientX, y: touch2.clientY };

        const newCenter = getCenter(p1, p2);
        const dist = getDistance(p1, p2);

        if (!lastCenter.current) {
          lastCenter.current = newCenter;
          lastDist.current = dist;
          return;
        }

        const newScale = Math.max(
          0.5,
          Math.min(3, scale * (dist / lastDist.current))
        );
        setScale(newScale);

        lastDist.current = dist;
        lastCenter.current = newCenter;
        return;
      }

      if (!isDrawing || !currentObject) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      switch (currentObject.type) {
        case "line":
        case "highlighter":
        case "eraser":
          setCurrentObject((prev) => ({
            ...prev,
            points: [...prev.points, pos.x, pos.y],
          }));
          break;
        case "rectangle":
          setCurrentObject((prev) => ({
            ...prev,
            x: Math.min(drawStartPos.current.x, pos.x),
            y: Math.min(drawStartPos.current.y, pos.y),
            width: Math.abs(pos.x - drawStartPos.current.x),
            height: Math.abs(pos.y - drawStartPos.current.y),
          }));
          break;
        case "circle":
        case "triangle":
        case "diamond":
        case "hexagon":
        case "star":
          const radius = getDistance(drawStartPos.current, pos);
          setCurrentObject((prev) => ({
            ...prev,
            radius,
          }));
          break;
        case "straightLine":
        case "arrow":
          setCurrentObject((prev) => ({
            ...prev,
            endX: pos.x,
            endY: pos.y,
          }));
          break;
        default:
          break;
      }
    },
    [isDrawing, currentObject, scale]
  );

  // Handle drawing end
  const handleDrawEnd = useCallback(() => {
    // Reset pinch state
    lastCenter.current = null;
    lastDist.current = 0;

    if (!isDrawing || !currentObject) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    // Simplify points for freehand drawings
    let finalObject = { ...currentObject };
    if (
      (currentObject.type === "line" ||
        currentObject.type === "highlighter" ||
        currentObject.type === "eraser") &&
      currentObject.points.length > 4
    ) {
      finalObject.points = simplifyPoints(currentObject.points);
    }

    // Only add if object has meaningful size
    const isValidObject =
      (finalObject.type === "line" && finalObject.points.length > 2) ||
      (finalObject.type === "highlighter" && finalObject.points.length > 2) ||
      (finalObject.type === "eraser" && finalObject.points.length > 2) ||
      (finalObject.type === "rectangle" &&
        finalObject.width > 5 &&
        finalObject.height > 5) ||
      (["circle", "triangle", "diamond", "hexagon", "star"].includes(finalObject.type) &&
        finalObject.radius > 5) ||
      (finalObject.type === "straightLine" &&
        getDistance(
          { x: finalObject.x, y: finalObject.y },
          { x: finalObject.endX, y: finalObject.endY }
        ) > 5) ||
      (finalObject.type === "arrow" &&
        getDistance(
          { x: finalObject.x, y: finalObject.y },
          { x: finalObject.endX, y: finalObject.endY }
        ) > 5);

    if (isValidObject) {
      push([...objects, finalObject]);
    }

    setCurrentObject(null);
    drawStartPos.current = null;
  }, [isDrawing, currentObject, objects, push]);

  // Handle text completion
  const handleTextComplete = useCallback(
    (text) => {
      const textObject = {
        id: generateId(),
        type: "text",
        x: textPosition.x,
        y: textPosition.y,
        text,
        fontSize: 18,
        stroke: color,
        opacity: 1.0,
      };
      push([...objects, textObject]);
      setShowTextInput(false);
    },
    [textPosition, color, objects, push]
  );

  // Export canvas
  const exportCanvas = useCallback(() => {
    return {
      version: 2,
      objects,
      lines: objects, // Backward compatibility
      imageData: stageRef.current?.toDataURL({ mimeType: "image/png" }) || "",
      canvasSize,
    };
  }, [objects, canvasSize]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportCanvas,
    undo,
    redo,
    clear,
  }));

  // All objects to render
  const allObjects = useMemo(() => {
    return currentObject ? [...objects, currentObject] : objects;
  }, [objects, currentObject]);

  // Colors palette
  const colors = [
    "black",
    "red",
    "blue",
    "green",
    "orange",
    "purple",
    "yellow",
    "brown",
  ];

  // Primary tools (always visible)
  const primaryTools = [
    { id: "pen", icon: <Pencil size={18} />, title: "Pen" },
    { id: "highlighter", icon: <Highlighter size={18} />, title: "Highlighter" },
    { id: "eraser", icon: <Eraser size={18} />, title: "Eraser" },
  ];

  // Shape tools
  const shapeToolsList = [
    { id: "rectangle", icon: <Square size={18} />, title: "Rectangle" },
    { id: "circle", icon: <CircleIcon size={18} />, title: "Circle" },
    { id: "triangle", icon: <Triangle size={18} />, title: "Triangle" },
    { id: "diamond", icon: <Diamond size={18} />, title: "Diamond" },
    { id: "hexagon", icon: <Hexagon size={18} />, title: "Hexagon" },
    { id: "star", icon: <StarIcon size={18} />, title: "Star" },
  ];

  // Line tools
  const lineTools = [
    { id: "line", icon: <Minus size={18} />, title: "Line" },
    { id: "arrow", icon: <ArrowRight size={18} />, title: "Arrow" },
    { id: "text", icon: <Type size={18} />, title: "Text" },
  ];

  // All tools for mobile
  const allTools = [...primaryTools, ...shapeToolsList, ...lineTools];

  const handleColorSelect = (c) => {
    if (colorPickerType === "stroke") {
      setColor(c);
    } else {
      setFillColor(c);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full"
      style={{ height: "80vh", touchAction: "none" }}
    >
      {/* Canvas area */}
      <div
        ref={scrollContainerRef}
        className="border overflow-auto bg-white"
        style={{
          height: isMobile ? "calc(100% - 120px)" : "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleDrawEnd}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
          style={{ backgroundColor: "white" }}
        >
          <Layer>
            <ShapeRenderer objects={allObjects} />
          </Layer>
        </Stage>
      </div>

      {/* Text input overlay */}
      {showTextInput && (
        <TextOverlay
          position={textPosition}
          onComplete={handleTextComplete}
          onCancel={() => setShowTextInput(false)}
          color={color}
          scrollContainerRef={scrollContainerRef}
        />
      )}

      {/* Desktop Toolbar */}
      {!isMobile && (
        <div
          ref={dragRef}
          onMouseDown={handleToolbarDrag}
          className="absolute bg-white p-3 rounded-lg shadow-lg border select-none"
          style={{
            zIndex: 20,
            cursor: "move",
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            maxWidth: "280px",
          }}
        >
          {/* Primary tools */}
          <div className="flex flex-wrap gap-2 mb-3">
            {primaryTools.map((t) => (
              <ToolButton
                key={t.id}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
                title={t.title}
              >
                {t.icon}
              </ToolButton>
            ))}
          </div>

          {/* Shape tools */}
          <div className="flex flex-wrap gap-2 mb-3">
            {shapeToolsList.map((t) => (
              <ToolButton
                key={t.id}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
                title={t.title}
              >
                {t.icon}
              </ToolButton>
            ))}
          </div>

          {/* Line tools */}
          <div className="flex flex-wrap gap-2 mb-3">
            {lineTools.map((t) => (
              <ToolButton
                key={t.id}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
                title={t.title}
              >
                {t.icon}
              </ToolButton>
            ))}
          </div>

          {/* Undo/Redo/Clear */}
          <div className="flex gap-2 mb-3 border-t pt-3">
            <ToolButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo2 size={18} />
            </ToolButton>
            <ToolButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              <Redo2 size={18} />
            </ToolButton>
            <ToolButton onClick={clear} title="Clear All">
              <Trash2 size={18} />
            </ToolButton>
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-neutral-600">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-neutral-600 w-8">{strokeWidth}px</span>
          </div>

          {/* Stroke Color */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Pencil size={14} className="text-neutral-500" />
              <span className="text-xs text-neutral-600">Stroke</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <ColorButton
                  key={c}
                  color={c}
                  active={color === c}
                  onClick={() => setColor(c)}
                />
              ))}
              <div className="relative">
                <ColorButton
                  color={customColor}
                  active={color === customColor}
                  onClick={() => {
                    setColorPickerType("stroke");
                    setShowColorPicker(!showColorPicker);
                  }}
                  isCustom
                />
                {showColorPicker && colorPickerType === "stroke" && (
                  <div className="absolute left-0 top-8">
                    <CustomColorPicker
                      color={customColor}
                      onChange={(c) => {
                        setCustomColor(c);
                        setColor(c);
                      }}
                      onClose={() => setShowColorPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fill Color (only for shapes) */}
          {isShapeTool && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <PaintBucket size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-600">Fill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div
                  onClick={() => setFillColor("transparent")}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 border-dashed border-neutral-300 ${
                    fillColor === "transparent" ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : ""
                  }`}
                  title="No fill"
                />
                {colors.map((c) => (
                  <ColorButton
                    key={`fill-${c}`}
                    color={c}
                    active={fillColor === c}
                    onClick={() => setFillColor(c)}
                  />
                ))}
                <div className="relative">
                  <ColorButton
                    color={customColor}
                    active={fillColor === customColor}
                    onClick={() => {
                      setColorPickerType("fill");
                      setShowColorPicker(!showColorPicker);
                    }}
                    isCustom
                  />
                  {showColorPicker && colorPickerType === "fill" && (
                    <div className="absolute left-0 top-8">
                      <CustomColorPicker
                        color={customColor}
                        onChange={(c) => {
                          setCustomColor(c);
                          setFillColor(c);
                        }}
                        onClose={() => setShowColorPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Toolbar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          {/* Primary tools row */}
          <div className="flex justify-around items-center p-2">
            <ToolButton
              active={tool === "pen"}
              onClick={() => setTool("pen")}
              title="Pen"
            >
              <Pencil size={20} />
            </ToolButton>
            <ToolButton
              active={tool === "highlighter"}
              onClick={() => setTool("highlighter")}
              title="Highlighter"
            >
              <Highlighter size={20} />
            </ToolButton>
            <ToolButton
              active={tool === "eraser"}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              <Eraser size={20} />
            </ToolButton>
            <ToolButton
              onClick={() => setShowMoreTools(!showMoreTools)}
              title="More Tools"
            >
              {showMoreTools ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </ToolButton>
            <ToolButton onClick={undo} disabled={!canUndo} title="Undo">
              <Undo2 size={20} />
            </ToolButton>
            <ToolButton onClick={redo} disabled={!canRedo} title="Redo">
              <Redo2 size={20} />
            </ToolButton>
          </div>

          {/* Expanded tools */}
          {showMoreTools && (
            <div className="p-3 border-t bg-neutral-50 max-h-64 overflow-y-auto">
              {/* Shape and line tools */}
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {[...shapeToolsList, ...lineTools].map((t) => (
                  <ToolButton
                    key={t.id}
                    active={tool === t.id}
                    onClick={() => setTool(t.id)}
                    title={t.title}
                  >
                    {t.icon}
                  </ToolButton>
                ))}
                <ToolButton onClick={clear} title="Clear">
                  <Trash2 size={20} />
                </ToolButton>
              </div>

              {/* Stroke Colors */}
              <div className="mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Pencil size={14} className="text-neutral-500" />
                  <span className="text-xs text-neutral-600">Stroke</span>
                </div>
                <div className="flex justify-center gap-3">
                  {colors.map((c) => (
                    <ColorButton
                      key={c}
                      color={c}
                      active={color === c}
                      onClick={() => setColor(c)}
                    />
                  ))}
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setColor(e.target.value);
                    }}
                    className="w-6 h-6 cursor-pointer border-0 p-0 rounded-full"
                  />
                </div>
              </div>

              {/* Fill Colors (for shapes) */}
              {isShapeTool && (
                <div className="mb-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PaintBucket size={14} className="text-neutral-500" />
                    <span className="text-xs text-neutral-600">Fill</span>
                  </div>
                  <div className="flex justify-center gap-3">
                    <div
                      onClick={() => setFillColor("transparent")}
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 border-dashed border-neutral-300 ${
                        fillColor === "transparent" ? "ring-2 ring-offset-1 ring-blue-500" : ""
                      }`}
                      title="No fill"
                    />
                    {colors.slice(0, 6).map((c) => (
                      <ColorButton
                        key={`fill-${c}`}
                        color={c}
                        active={fillColor === c}
                        onClick={() => setFillColor(c)}
                      />
                    ))}
                    <input
                      type="color"
                      value={fillColor === "transparent" ? "#ffffff" : fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-6 h-6 cursor-pointer border-0 p-0 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Stroke width */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm w-8">{strokeWidth}px</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zoom controls (for mobile) */}
      {isMobile && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="bg-white p-2 rounded shadow border"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="bg-white p-2 rounded shadow border"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="bg-white p-2 rounded shadow border"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}
    </div>
  );
});

export default Canvas;
