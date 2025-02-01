"use client"
import { useState, useRef, useEffect } from 'react';
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

const memeTemplates: MemeTemplate[] = [
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
const SCORE_STORAGE_KEY = 'totalGameScore';

export default function MemeGenerator() {
    const [selectedMeme, setSelectedMeme] = useState<MemeTemplate | null>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState('mi-meme');
    const [score, setScore] = useState(0);
    useEffect(() => {
        const storedScore = localStorage.getItem(SCORE_STORAGE_KEY);
        if (storedScore) {
          setScore(parseInt(storedScore, 10));
        }
      }, []); 
    const [memesCreated, setMemesCreated] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
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
    <div className="min-h-screen bg-yellow-50 py-12 font-comic">
      <div className="container mx-auto px-4">
         <GameStatusBar
            title="Meme Creator"
            score={score}
            lives={3}
            level={Math.floor(memesCreated / 5) + 1}
        />
        
        {/* Botón de carga de imagen */}
        <div className="mb-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-500 text-white font-bold py-3 px-6 rounded-lg border-4 border-black
                     shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]
                     hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
          >
            📸 ¡SUBE TU PROPIA IMAGEN!
          </button>
        </div>

        {/* Galería de templates */}
        <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
        {selectedMemes.map((template) => (
          <div 
            key={template.id}
            className={`
              relative transform hover:-rotate-2 transition-all duration-300
              ${selectedMeme?.id === template.id ? 'ring-8 ring-red-500 rotate-3' : ''}
            `}
            onClick={() => {
              setSelectedMeme(template);
              setCustomImage(null);
            }}
          >
            <div className="bg-white p-2 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black h-full flex flex-col">
              <img 
                src={template.url} 
                alt={template.name}
                className="w-full aspect-square object-cover border-2 border-black"
              />
              <p className="text-center font-bold mt-2 text-lg flex-grow flex items-end">{template.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-4">
          <button 
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} 
            disabled={currentPage === 0}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-lg font-bold">
            {currentPage + 1}/{totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))} 
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>


         {/* Editor de meme */}
         {selectedMeme && (
          <div className="max-w-4xl mx-auto bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Control de nombre de archivo */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-red-600">Nombre del archivo</h3>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black rounded focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Nombre para tu meme"
                  />
                </div>

                {/* Controles para texto superior */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-red-600">Texto Superior</h3>
                  <input
                    type="text"
                    value={topText.content}
                    onChange={(e) => setTopText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="¡POW!"
                  />
                  <div className="flex space-x-4">
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={topText.size}
                      onChange={(e) => setTopText(prev => ({ ...prev, size: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <select
                      value={topText.color}
                      onChange={(e) => setTopText(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-1 border-2 border-black rounded"
                    >
                      {colorOptions.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Controles para texto inferior */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-red-600">Texto Inferior</h3>
                  <input
                    type="text"
                    value={bottomText.content}
                    onChange={(e) => setBottomText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="¡BAM!"
                  />
                  <div className="flex space-x-4">
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={bottomText.size}
                      onChange={(e) => setBottomText(prev => ({ ...prev, size: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <select
                      value={bottomText.color}
                      onChange={(e) => setBottomText(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-1 border-2 border-black rounded"
                    >
                      {colorOptions.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={downloadMeme}
                  className="w-full py-3 bg-red-500 text-white font-bold text-xl border-4 border-black rounded 
                           shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]
                           hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
                >
                  ¡DESCARGAR MEME!
                </button>
              </div>

              <div className="relative">
                <p className="text-lg font-bold text-red-600 mb-2">
                  ¡ARRASTRA EL TEXTO PARA MOVERLO! 👊💥
                </p>
                <div className="border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
