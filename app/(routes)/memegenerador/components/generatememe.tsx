"use client"
import { useState, useRef, useEffect } from 'react';
import {
  IconPalette,
  IconTypography,
  IconArrowsMove,
  IconDownload,
  IconPhoto,
  IconChevronRight,
  IconChevronLeft,
  IconX,
} from '@tabler/icons-react';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

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

const ACTIVITY = getActivityById('meme');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Meme Generator';
const ACCENT = ACTIVITY?.color ?? '#689F38';

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

export default function MemeGenerator() {
  const [selectedTool, setSelectedTool] = useState<'move' | 'text'>('text');
  const [selectedMeme, setSelectedMeme] = useState<MemeTemplate | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('mi-meme');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [memesCreated, setMemesCreated] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTemplates, setShowTemplates] = useState(true);
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

  const totalPages = Math.ceil(memeTemplates.length / ITEMS_PER_PAGE);

  // Antes esta pantalla no persistía absolutamente nada: el puntaje era
  // estado local que arrancaba en 0 cada vez que volvías, nunca se sumaba
  // al puntaje real de la cuenta, y "Meme Generator" nunca se marcaba
  // como completado en ningún lado.
  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    setMemesCreated(data.progress.activityScores[ACTIVITY_TITLE] ? Math.round(data.progress.activityScores[ACTIVITY_TITLE] / SCORE_PER_MEME) : 0);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
  }, []);

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${fileName.trim() || 'mi-meme'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + SCORE_PER_MEME
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + SCORE_PER_MEME
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString()
        },
        completedActivities: !current.progress.completedActivities.includes(ACTIVITY_TITLE)
          ? [...current.progress.completedActivities, ACTIVITY_TITLE]
          : current.progress.completedActivities
      }
    };

    UserDataManager.saveUserData(updatedData);
    setScore(updatedData.game.totalScore);
    setMemesCreated(prev => prev + 1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, sube solo archivos de imagen.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
      // Estilo cómic del MEME EN SÍ (esto queda igual — es el contenido
      // que se descarga, no la interfaz de la herramienta).
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const drawText = (config: TextConfig) => {
        if (!ctx) return;

        ctx.fillStyle = config.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.font = `bold ${config.size}px "Comic Sans MS", "Bangers", cursive`;
        ctx.textAlign = 'center';

        const text = config.content.toUpperCase();

        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        for (let i = 0; i < 3; i++) {
          ctx.strokeText(text, config.position.x, config.position.y);
        }

        ctx.shadowColor = 'transparent';
        ctx.fillText(text, config.position.x, config.position.y);

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
      setTopText(prev => ({ ...prev, position: newPosition }));
    } else if (activeText === 'bottom') {
      setBottomText(prev => ({ ...prev, position: newPosition }));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topText, bottomText, selectedMeme, activeText]);

  return (
    <div className="min-h-screen bg-gray-50">
      <GameStatusBar title="Meme Creator" score={score} lives={lives} />

      <div className="container mx-auto p-2 sm:p-4 pt-24">
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-100 p-3 flex flex-wrap gap-2 items-center bg-gray-50">
            <div className="flex gap-2 border-r border-gray-200 pr-4">
              <button
                onClick={() => setSelectedTool('text')}
                className={`p-2 rounded-lg transition-colors ${selectedTool === 'text' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={selectedTool === 'text' ? { backgroundColor: ACCENT } : undefined}
                title="Herramienta de texto"
              >
                <IconTypography size={20} />
              </button>
              <button
                onClick={() => setSelectedTool('move')}
                className={`p-2 rounded-lg transition-colors ${selectedTool === 'move' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={selectedTool === 'move' ? { backgroundColor: ACCENT } : undefined}
                title="Herramienta de mover"
              >
                <IconArrowsMove size={20} />
              </button>
            </div>

            <div className="flex gap-2 border-r border-gray-200 pr-4 items-center">
              <IconPalette size={20} className="text-gray-400 shrink-0" />
              <div className="flex items-center gap-1">
                {colorOptions.map((color) => {
                  const currentColor = activeText === 'top' ? topText.color : bottomText.color;
                  const isSelected = currentColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        if (activeText === 'top') {
                          setTopText(prev => ({ ...prev, color }));
                        } else {
                          setBottomText(prev => ({ ...prev, color }));
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-offset-1' : 'border-gray-200'
                      }`}
                      style={{
                        backgroundColor: color,
                        borderColor: isSelected ? ACCENT : undefined,
                        ...(isSelected ? ({ '--tw-ring-color': ACCENT } as React.CSSProperties) : {}),
                      }}
                      aria-label={`Color ${color}`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <IconPhoto size={16} />
                <span className="hidden sm:inline">Abrir</span>
              </button>
              {!showTemplates && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <span>Templates</span>
                  <IconChevronLeft size={16} />
                </button>
              )}
              <button
                onClick={downloadMeme}
                disabled={!selectedMeme}
                className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                <IconDownload size={16} />
                <span className="hidden sm:inline">Descargar</span>
              </button>
            </div>
          </div>

          {/* Main workspace */}
          <div className="flex flex-col lg:flex-row min-h-[400px] lg:min-h-[600px]">
            {/* Left sidebar - Properties */}
            <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 space-y-4 bg-white">
              <div className="grid lg:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre de archivo</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Texto superior</label>
                  <input
                    type="text"
                    value={topText.content}
                    onChange={(e) => setTopText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Texto inferior</label>
                  <input
                    type="text"
                    value={bottomText.content}
                    onChange={(e) => setBottomText(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
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
            <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
              <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

            {/* Right sidebar - Templates */}
            {showTemplates && (
              <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-100 p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Templates</h3>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Cerrar templates"
                    title="Cerrar"
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                  {memeTemplates.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedMeme(template);
                        setCustomImage(null);
                      }}
                      className={`cursor-pointer rounded-lg p-1 border transition-colors ${
                        selectedMeme?.id === template.id
                          ? ''
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                      style={selectedMeme?.id === template.id ? { borderColor: ACCENT, backgroundColor: `${ACCENT}0D` } : undefined}
                    >
                      <img
                        src={template.url}
                        alt={template.name}
                        className="w-full aspect-square object-cover rounded"
                      />
                      <p className="text-xs text-center mt-1 font-medium text-gray-600 truncate">{template.name}</p>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="p-1.5 rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <IconChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="p-1.5 rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <IconChevronRight size={16} />
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