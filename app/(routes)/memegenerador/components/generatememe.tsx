"use client"
import { useState, useRef, useEffect } from 'react';
import { Palette, Type, Move, Download, Image as ImageIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import GameStatusBar from '@/components/GameStatusBar';

interface MemeTemplate {
  id: string;
  url: string;
  name: string;
}

interface TextConfig {
  content: string;
  size: number;
  color: string;
  position: { x: number; y: number };
}

const memeTemplates = [
  { id: '1', url: '/meme1.webp', name: 'Piensa' },
  { id: '2', url: '/meme2.webp', name: 'Sorprendido' },
  { id: '3', url: '/meme3.webp', name: 'Estoica' },
  { id: '4', url: '/meme4.webp', name: 'Genial' },
  { id: '5', url: '/meme5.webp', name: 'Julio' },
  { id: '6', url: '/meme6.webp', name: 'Sorprendida' },
  { id: '7', url: '/meme7.webp', name: 'Mentira' }
];

const colorOptions = ['white', 'yellow', 'red', 'blue', 'green', 'purple', 'orange'];
const SCORE_PER_MEME = 300;
const ITEMS_PER_PAGE = 6;

export default function MemeGenerator() {
  const [selectedTool, setSelectedTool] = useState<'move' | 'text'>('text');
  const [selectedMeme, setSelectedMeme] = useState<MemeTemplate | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('mi-meme');
  const [score, setScore] = useState(0);
  const [memesCreated, setMemesCreated] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [topText, setTopText] = useState<TextConfig>({
    content: '',
    size: 30,
    color: 'white',
    position: { x: 250, y: 40 }
  });
  const [bottomText, setBottomText] = useState<TextConfig>({
    content: '',
    size: 30,
    color: 'white',
    position: { x: 250, y: 380 }
  });
  
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [activeText, setActiveText] = useState<'top' | 'bottom' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    // Calcular el índice de los memes a mostrar
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const selectedMemes = memeTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalPages = Math.ceil(memeTemplates.length / ITEMS_PER_PAGE);

    const downloadMeme = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;        
        // Crear y descargar el meme
        const link = document.createElement('a');
        link.download = `${fileName.trim() || 'mi-meme'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();   
        // Actualizar puntuación y contador de memes
        setScore(prevScore => prevScore + SCORE_PER_MEME);
        setMemesCreated(prevCount => prevCount + 1);
      };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor, sube solo archivos de imagen.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Crear un template personalizado
          const customTemplate: MemeTemplate = {
            id: 'custom',
            url: img.src,
            name: 'Mi imagen'
          };
          setCustomImage(img.src);
          setSelectedMeme(customTemplate);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedMeme) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Estilo cómic: Agregar borde negro grueso
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Dibujar borde estilo cómic
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar imagen manteniendo la proporción
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Función para dibujar texto estilo cómic
      const drawText = (config: TextConfig) => {
        if (!ctx) return;
        
        ctx.fillStyle = config.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.font = `bold ${config.size}px "Comic Sans MS", "Bangers", cursive`;
        ctx.textAlign = 'center';
        
        const text = config.content.toUpperCase();
        
        // Sombra tipo cómic
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Múltiples trazos para efecto más pronunciado
        for(let i = 0; i < 3; i++) {
          ctx.strokeText(text, config.position.x, config.position.y);
        }
        
        ctx.shadowColor = 'transparent';
        ctx.fillText(text, config.position.x, config.position.y);

        // Dibuja un pequeño indicador si el texto está activo
        if ((activeText === 'top' && config === topText) || 
            (activeText === 'bottom' && config === bottomText)) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fillRect(config.position.x - 50, config.position.y - 30, 100, 40);
        }
      };

      drawText(topText);
      drawText(bottomText);
      
      ctx.restore();
    };
    img.src = customImage || selectedMeme.url;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Mejorado: áreas de detección más precisas
    const isNearTop = Math.abs(x - topText.position.x) < 100 && Math.abs(y - topText.position.y) < 50;
    const isNearBottom = Math.abs(x - bottomText.position.x) < 100 && Math.abs(y - bottomText.position.y) < 50;

    if (isNearTop) {
      setActiveText('top');
      setDragStart({ x: x - topText.position.x, y: y - topText.position.y });
    } else if (isNearBottom) {
      setActiveText('bottom');
      setDragStart({ x: x - bottomText.position.x, y: y - bottomText.position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart || !activeText || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const newPosition = {
      x: Math.min(Math.max(x - dragStart.x, 50), canvas.width - 50),
      y: Math.min(Math.max(y - dragStart.y, 30), canvas.height - 30)
    };

    if (activeText === 'top') {
      setTopText(prev => ({
        ...prev,
        position: newPosition
      }));
    } else if (activeText === 'bottom') {
      setBottomText(prev => ({
        ...prev,
        position: newPosition
      }));
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setActiveText(null);
  };

  useEffect(() => {
    if (selectedMeme) {
      generateMeme();
    }
  }, [topText, bottomText, selectedMeme, activeText]);

  return (
    <div className="min-h-screen bg-yellow-50">
      <GameStatusBar title="Meme Creator" score={score}  />      
      <div className="container mx-auto p-2 sm:p-4 mt-20">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg">
          {/* Toolbar - Responsive */}
          <div className="border-b-4 border-black p-2 flex flex-wrap gap-2 items-center bg-gray-100">
            <div className="flex space-x-2 border-r-4 border-black pr-4">
              <button
                onClick={() => setSelectedTool('text')}
                className={`p-2 rounded border-2 border-black ${selectedTool === 'text' ? 'bg-blue-200 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'hover:bg-gray-200'}`}
                title="Text Tool"
              >
                <Type size={20} />
              </button>
              <button
                onClick={() => setSelectedTool('move')}
                className={`p-2 rounded border-2 border-black ${selectedTool === 'move' ? 'bg-blue-200 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'hover:bg-gray-200'}`}
                title="Move Tool"
              >
                <Move size={20} />
              </button>
            </div>
            
            <div className="flex space-x-2 border-r-4 border-black pr-4">
              <div className="flex items-center space-x-1">
                <Palette size={20} />
                <select
                  value={activeText === 'top' ? topText.color : bottomText.color}
                  onChange={(e) => {
                    if (activeText === 'top') {
                      setTopText(prev => ({ ...prev, color: e.target.value }));
                    } else {
                      setBottomText(prev => ({ ...prev, color: e.target.value }));
                    }
                  }}
                  className="border-2 border-black rounded p-1"
                >
                  {colorOptions.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <ImageIcon size={16} />
                <span className="hidden sm:inline">Abrir</span>
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <span className="hidden sm:inline">Templates</span>
                {showTemplates ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                onClick={downloadMeme}
                disabled={!selectedMeme}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-500 text-white rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Descargar</span>
              </button>
            </div>
          </div>

          {/* Main workspace - Responsive Layout */}
          <div className="flex flex-col lg:flex-row min-h-[400px] lg:min-h-[600px]">
            {/* Left sidebar - Properties */}
            <div className="w-full lg:w-64 border-b-4 lg:border-b-0 lg:border-r-4 border-black p-4 space-y-4 bg-gray-50">
              <div className="grid lg:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre de Archivo</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-2 py-1 border-2 border-black rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-1">Texto Superior</label>
                  <input
                    type="text"
                    value={topText.content}
                    onChange={(e) => setTopText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-2 py-1 border-2 border-black rounded mb-2"
                  />
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={topText.size}
                    onChange={(e) => setTopText(prev => ({ ...prev, size: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div className="lg:mt-4">
                  <label className="block text-sm font-bold mb-1">Texto Inferior</label>
                  <input
                    type="text"
                    value={bottomText.content}
                    onChange={(e) => setBottomText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-2 py-1 border-2 border-black rounded mb-2"
                  />
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={bottomText.size}
                    onChange={(e) => setBottomText(prev => ({ ...prev, size: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Main canvas area */}
            <div className="flex-1 p-4 bg-gray-100">
              <div className="relative bg-white border-4 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={400}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full cursor-move"
                />
              </div>
            </div>

            {/* Right sidebar - Templates (Responsive) */}
            {showTemplates && (
              <div className="w-full lg:w-64 border-t-4 lg:border-t-0 lg:border-l-4 border-black p-4 bg-gray-50">
                <h3 className="font-bold mb-4">Templates</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                  {memeTemplates.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedMeme(template);
                        setCustomImage(null);
                      }}
                      className={`cursor-pointer border-2 border-black rounded p-1 ${
                        selectedMeme?.id === template.id 
                          ? 'bg-blue-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <img
                        src={template.url}
                        alt={template.name}
                        className="w-full aspect-square object-cover border border-black"
                      />
                      <p className="text-xs text-center mt-1 font-bold truncate">{template.name}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="px-2 py-1 bg-blue-500 text-white rounded border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-bold">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-2 py-1 bg-blue-500 text-white rounded border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
