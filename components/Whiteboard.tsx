import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pen, Trash2, Download, X, Undo, Redo, MessageCircle, Check } from 'lucide-react';
import { BoardComment } from '../types';

interface WhiteboardProps {
  onClose: () => void;
  isReadOnly?: boolean;
  backgroundImage?: string | null;
  comments: BoardComment[];
  onAddComment?: (comment: BoardComment) => void;
  onResolveComment?: (id: string) => void;
  currentUserName: string;
  initialData?: string | null;
  onSave?: (data: string) => void;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export const Whiteboard: React.FC<WhiteboardProps> = ({ 
  onClose, 
  isReadOnly = false, 
  backgroundImage,
  comments,
  onAddComment,
  onResolveComment,
  currentUserName,
  initialData,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'comment'>('pen');
  const [newCommentPos, setNewCommentPos] = useState<{x: number, y: number} | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Load Background Image
  useEffect(() => {
    if (backgroundImage) {
        const img = new Image();
        img.src = backgroundImage;
        img.onload = () => {
            bgImageRef.current = img;
            redrawCanvas();
        };
    } else {
        bgImageRef.current = null;
        redrawCanvas();
    }
  }, [backgroundImage]);

  // Load Initial Data (Saved State)
  useEffect(() => {
    if (initialData && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = initialData;
        img.onload = () => {
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                // Set this as the initial history state
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([data]);
                setHistoryStep(0);
            }
        };
    }
  }, []); // Run once on mount

  // Save on Unmount
  useEffect(() => {
    return () => {
      if (onSave && canvasRef.current) {
        onSave(canvasRef.current.toDataURL());
      }
    };
  }, [onSave]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 1. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Image (Contain)
    if (bgImageRef.current) {
        const img = bgImageRef.current;
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
    
    // 3. Restore History (Drawing Layer)
    if (historyStep >= 0 && history[historyStep]) {
         ctx.putImageData(history[historyStep], 0, 0);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const resizeCanvas = () => {
        // Capture existing content before resize if history is empty (e.g. from initialData)
        let currentContent: ImageData | null = null;
        const ctx = canvas.getContext('2d');
        if (ctx && history.length === 0 && initialData) {
             currentContent = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        redrawCanvas(); 
        
        // Restore initial content if it was loaded but not yet in history
        if (currentContent && ctx && history.length === 0) {
            ctx.putImageData(currentContent, 0, 0);
        }

        // Init history if completely empty
        if (history.length === 0 && !initialData) {
             if (ctx) {
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([data]);
                setHistoryStep(0);
            }
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(data);
        if (newHistory.length > 20) newHistory.shift();
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
        setHistoryStep(prev => prev - 1);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && history[historyStep - 1]) {
             ctx.putImageData(history[historyStep - 1], 0, 0);
        }
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
        setHistoryStep(prev => prev + 1);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && history[historyStep + 1]) {
             ctx.putImageData(history[historyStep + 1], 0, 0);
        }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'comment' && !isReadOnly) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setNewCommentPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }
  };

  const submitComment = () => {
      if (newCommentPos && commentText.trim() && onAddComment) {
          onAddComment({
              id: Math.random().toString(36).substr(2, 9),
              x: newCommentPos.x,
              y: newCommentPos.y,
              text: commentText,
              authorName: currentUserName,
              isResolved: false
          });
          setNewCommentPos(null);
          setCommentText('');
          setTool('pen'); 
      }
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly || tool === 'comment') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isReadOnly || tool === 'comment') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isReadOnly || !isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.closePath();
    saveHistory();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-100 overflow-hidden flex flex-col">
        {/* Canvas */}
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onClick={handleCanvasClick}
            className={`touch-none w-full h-full bg-white shadow-inner ${tool === 'comment' ? 'cursor-text' : 'cursor-crosshair'}`}
        />

        {/* Comment Markers */}
        {comments.map(comment => !comment.isResolved && (
            <div 
                key={comment.id}
                className="absolute group z-10"
                style={{ left: comment.x, top: comment.y }}
            >
                <div className="w-8 h-8 -ml-4 -mt-8 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in cursor-pointer hover:bg-blue-700">
                    <span className="text-xs font-bold">?</span>
                </div>
                <div className="absolute top-2 left-4 w-48 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block z-20">
                    <p className="text-xs font-bold text-gray-500 mb-1">{comment.authorName}:</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{comment.text}</p>
                    {!isReadOnly && (
                        <button 
                            onClick={() => onResolveComment && onResolveComment(comment.id)}
                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                            <Check size={12} /> حل شد
                        </button>
                    )}
                </div>
            </div>
        ))}

        {/* Add Comment Input Modal */}
        {newCommentPos && (
            <div 
                className="absolute bg-white dark:bg-gray-800 p-3 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-30 flex flex-col gap-2 w-64 animate-in fade-in zoom-in"
                style={{ left: Math.min(newCommentPos.x, (containerRef.current?.clientWidth || 500) - 270), top: newCommentPos.y + 10 }}
            >
                <textarea 
                    autoFocus
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="سوال یا نظر خود را بنویسید..."
                    className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:text-white"
                    rows={3}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setNewCommentPos(null)} className="text-gray-500 text-xs hover:text-red-500">لغو</button>
                    <button onClick={submitComment} className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">ارسال</button>
                </div>
            </div>
        )}

        {/* Floating Toolbar */}
        {!isReadOnly && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-2 flex items-center gap-3 animate-in slide-in-from-bottom-5 z-20">
                <div className="flex gap-1">
                     <ToolBtn onClick={handleUndo} icon={<Undo size={18} />} tooltip="بازگشت" disabled={historyStep <= 0} />
                     <ToolBtn onClick={handleRedo} icon={<Redo size={18} />} tooltip="انجام مجدد" disabled={historyStep >= history.length - 1} />
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                    <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} icon={<Pen size={18} />} tooltip="قلم" />
                    <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18} />} tooltip="پاک‌کن" />
                    <ToolBtn active={tool === 'comment'} onClick={() => setTool('comment')} icon={<MessageCircle size={18} />} tooltip="کامنت / سوال" />
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-1.5 px-1">
                    {COLORS.map((c) => (
                        <button key={c} onClick={() => { setColor(c); setTool('pen'); }} className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'border-gray-900 dark:border-white scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                    <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="h-1.5 w-16 ml-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <ToolBtn onClick={onClose} icon={<X size={18} />} danger tooltip="بستن" />
            </div>
        )}

        {isReadOnly && (
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <button 
                    onClick={() => { if (!tool.includes('comment')) setTool('comment'); else setTool('pen'); }}
                    className={`bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 flex items-center gap-2 ${tool === 'comment' ? 'ring-2 ring-white' : ''}`}
                >
                    <MessageCircle size={18} />
                    {tool === 'comment' ? 'برای نوشتن کلیک کنید' : 'افزودن سوال روی بورد'}
                </button>
             </div>
        )}

        {/* Close Button (Top Left) */}
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full text-gray-600 dark:text-gray-300 hover:text-red-500 shadow-lg z-10">
            <X size={20} />
        </button>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, danger, tooltip, disabled }: any) => (
    <button onClick={onClick} title={tooltip} disabled={disabled} className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${active ? 'bg-blue-600 text-white shadow-lg scale-105' : danger ? 'text-red-500 hover:bg-red-100' : !disabled && 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
        {icon}
    </button>
);