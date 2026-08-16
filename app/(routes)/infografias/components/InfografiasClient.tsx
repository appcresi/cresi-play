"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  IconSearch,
  IconX,
  IconDownload,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconFolderOpen,
} from "@tabler/icons-react";
import GameStatusBar from "@/components/GameStatusBar";
import UserDataManager from "@/lib/userDataManager";
import ClassroomService from "@/lib/classroomService";
import { getActivityById } from "@/lib/activities";

const ACTIVITY = getActivityById("infografias");
const ACTIVITY_TITLE = ACTIVITY?.title ?? "Infografías";
const ACCENT = ACTIVITY?.color ?? "#00897B";

const POINTS_PER_VIEW = 10;
const POINTS_PER_DOWNLOAD = 5;
const PER_PAGE = 6;

interface Infographic {
  id: string;
  title: string;
  informacion: string;
  cover: string;
  download: string;
}

export default function InfografiasClient(): JSX.Element {
  const [items, setItems] = useState<Infographic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query_, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Infographic | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const viewedIds = useRef<Set<string>>(new Set());
  const downloadedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "infografias"), where("author", "==", "CRESI")));
        let all = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            informacion: data.informacion,
            cover: data.cover,
            download: data.download,
          };
        });

        // Si el alumno entró con código, aplicamos lo que haya
        // restringido su docente para esta clase.
        const userData = UserDataManager.loadUserData();
        const classroomId = userData.profile.classroomId;
        if (classroomId) {
          const classroom = await ClassroomService.getClassroomById(classroomId);
          if (classroom?.restrictedInfografias) {
            const blocked = new Set(classroom.restrictedInfografias);
            all = all.filter((item) => !blocked.has(item.id));
          }
        }

        setItems(all);
      } catch (err) {
        console.error("❌ Error cargando infografías:", err);
      } finally {
        setLoading(false);
      }
    })();

    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
  }, []);

  const awardPoints = (points: number) => {
    const current = UserDataManager.loadUserData();
    const updated = {
      ...current,
      game: { ...current.game, totalScore: current.game.totalScore + points },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + points,
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString(),
        },
      },
    };
    UserDataManager.saveUserData(updated);
    setScore(updated.game.totalScore);
  };

  const handleOpen = (item: Infographic) => {
    setSelected(item);
    if (!viewedIds.current.has(item.id)) {
      viewedIds.current.add(item.id);
      awardPoints(POINTS_PER_VIEW);
    }
  };

  const handleDownloadClick = (item: Infographic) => {
    if (!downloadedIds.current.has(item.id)) {
      downloadedIds.current.add(item.id);
      awardPoints(POINTS_PER_DOWNLOAD);
    }
  };

  // Una sola fuente de la verdad: si hay búsqueda, filtra; si no, muestra
  // todo. Antes esto vivía en dos componentes separados (PaginatedGrid +
  // SearchBar) que se mostraban los dos a la vez — con la búsqueda vacía,
  // uno mostraba todo y el otro directamente "no se encontraron
  // resultados", los dos al mismo tiempo.
  const trimmedQuery = query_.trim().toLowerCase();
  const filtered = trimmedQuery
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(trimmedQuery) ||
          i.informacion.toLowerCase().includes(trimmedQuery)
      )
    : items;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-cream">
      <GameStatusBar title="Infografías" score={score} lives={lives} level={1} />

      <section className="w-full max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="h-20 md:h-28 relative" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
                <IconPhoto size={18} style={{ color: ACCENT }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                Aprender más, para cuidarse mejor
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-ink mb-1">Infografías</h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Material visual educativo, gratuito, para consultar o descargar. +{POINTS_PER_VIEW} puntos por ver una,
              +{POINTS_PER_DOWNLOAD} por descargarla.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query_}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar infografías por tema..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-base
                     focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm"
            style={{ "--tw-ring-color": ACCENT } as React.CSSProperties}
          />
          {query_ && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <IconX size={18} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <IconFolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              {trimmedQuery
                ? `No se encontraron infografías para "${trimmedQuery}"`
                : "Todavía no hay infografías cargadas."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pageItems.map((item) => (
                <button key={item.id} onClick={() => handleOpen(item)} className="group text-left">
                  <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-72">
                    <Image
                      src={item.cover}
                      alt={`Infografía: ${item.title}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center pb-4">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver infografía
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-10 group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-sm font-medium line-clamp-2">{item.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Página anterior"
                >
                  <IconChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className="w-9 h-9 rounded-full text-sm font-medium transition"
                      style={
                        currentPage === i + 1
                          ? { backgroundColor: ACCENT, color: "white" }
                          : { backgroundColor: "#F3F4F6", color: "#374151" }
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Página siguiente"
                >
                  <IconChevronRight size={18} />
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 pt-3">
              Mostrando {(currentPage - 1) * PER_PAGE + 1} a {Math.min(currentPage * PER_PAGE, filtered.length)} de{" "}
              {filtered.length} infografías
            </p>
          </>
        )}
      </section>

      {/* Preview modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full transition-colors shadow-md z-10"
              aria-label="Cerrar"
            >
              <IconX className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 p-6 md:p-8">
              <div className="flex-shrink-0 w-full sm:w-64">
                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  <img
                    src={selected.cover}
                    alt={`Vista previa de ${selected.title}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between flex-grow">
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{selected.title}</h2>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{selected.informacion}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <a
                    href={selected.download}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownloadClick(selected)}
                    className="px-6 py-3 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <IconDownload className="w-5 h-5" />
                    Descargar PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}