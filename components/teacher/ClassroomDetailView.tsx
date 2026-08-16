import React, { useState } from 'react';
import { IconPencil, IconCheck, IconX, IconLoader, IconDotsVertical, IconCopy, IconUserPlus, IconTrash } from '@tabler/icons-react';
import type { Classroom, ClassroomStudent, PendingStudent } from '@/types/classroom';
import type { Tarea } from '@/types/tarea';
import type { DetailTab } from './types';
import { VisibleActivitiesSummary } from './VisibleActivitiesSummary';
import { VisibleTriviasSummary } from './VisibleTriviasSummary';
import { WorkInClassTab } from './WorkInClassTab';
import { StudentsGrid } from './StudentsGrid';
import { TareaGradingScreen } from './TareaGradingScreen';
import { TareasFeedSummary } from '@/components/tareas/TareasFeedSummary';
import { ProximasEntregasBox } from '@/components/tareas/ProximasEntregasBox';

export const ClassroomDetailView = ({
  classroom,
  onBack,
  tab,
  setTab,
  students,
  pending,
  loadingRoster,
  editingName,
  nameDraft,
  setNameDraft,
  savingName,
  onStartEditingName,
  onSaveName,
  onCancelEditingName,
  onCopyCode,
  copiedCode,
  onOpenAddStudents,
  teacherId,
  teacherName,
  onActivitiesChanged,
  onTriviasChanged,
  onQuestionsChanged,
  onCompletaPalabrasChanged,
  onInfografiasChanged,
  onSelectStudent,
  onRemoveStudent,
  onRemovePending,
  onManageStudentCredentials,
  onManagePendingCredentials,
  onDeleteClass,
  totalActivities,
}: {
  classroom: Classroom;
  onBack: () => void;
  tab: DetailTab;
  setTab: (t: DetailTab) => void;
  students: ClassroomStudent[];
  pending: PendingStudent[];
  loadingRoster: boolean;
  editingName: boolean;
  nameDraft: string;
  setNameDraft: (v: string) => void;
  savingName: boolean;
  onStartEditingName: () => void;
  onSaveName: () => void;
  onCancelEditingName: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onOpenAddStudents: () => void;
  teacherId: string;
  teacherName: string;
  onActivitiesChanged: (allowedActivities: string[] | null) => void;
  onTriviasChanged: (visibleTrivias: string[] | null) => void;
  onQuestionsChanged: (restrictedTags: string[] | null, restrictedQuestionIds: string[] | null) => void;
  onCompletaPalabrasChanged: (visibleCompletaPalabras: string[] | null) => void;
  onInfografiasChanged: (restrictedInfografias: string[] | null) => void;
  onSelectStudent: (s: ClassroomStudent) => void;
  onRemoveStudent: (uid: string) => void;
  onManageStudentCredentials: (s: ClassroomStudent) => void;
  onManagePendingCredentials: (p: PendingStudent) => void;
  onRemovePending: (pendingId: string) => void;
  onDeleteClass: () => void;
  totalActivities: number;
}) => {
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [gradingTarea, setGradingTarea] = useState<Tarea | null>(null);

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'tablon', label: 'Tablón' },
    { key: 'trabajo', label: 'Trabajo en clase' },
    { key: 'personas', label: 'Personas' },
    { key: 'calificaciones', label: 'Calificaciones' },
  ];

  // Cuando se abre una tarea (desde el Tablón o desde Trabajo en clase),
  // reemplaza TODO el contenido de la clase — no es un modal, es una
  // pantalla propia con su botón de volver, igual que "Trabajo de los
  // alumnos" en Google Classroom.
  if (gradingTarea) {
    return (
      <TareaGradingScreen
        classroomId={classroom.id}
        tarea={gradingTarea}
        students={students}
        onBack={() => setGradingTarea(null)}
        onTareaUpdated={(updated) => setGradingTarea(updated)}
      />
    );
  }

  return (
    <div>
      <div
        className="w-full h-40 sm:h-48 flex items-end relative"
        style={{ backgroundColor: classroom.color }}
      >
        <div className="max-w-6xl mx-auto w-full px-6 pb-6">
          {editingName ? (
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={savingName}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg text-gray-900 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                onClick={onSaveName}
                disabled={savingName}
                className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2"
                title="Guardar"
              >
                {savingName ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
              </button>
              <button
                onClick={onCancelEditingName}
                disabled={savingName}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                title="Cancelar"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-medium text-white">{classroom.name}</h1>
                <button
                  onClick={onStartEditingName}
                  className="text-white/70 hover:text-white"
                  title="Editar nombre"
                >
                  <IconPencil className="w-4 h-4" />
                </button>
              </div>

              {/* Menú de la clase (eliminar, etc.) — separado del contenido
                  de las solapas, como el "⋮" de Google Classroom. */}
              <div className="relative">
                <button
                  onClick={() => setShowClassMenu((v) => !v)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2"
                  title="Opciones de la clase"
                >
                  <IconDotsVertical className="w-5 h-5" />
                </button>
                {showClassMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowClassMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => { setShowClassMenu(false); onDeleteClass(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <IconTrash className="w-4 h-4" />
                        Eliminar clase
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── Tablón ── */}
        {tab === 'tablon' && (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
            {/* Columna chica: código de la clase + próximas a entregar */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Código de la clase</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Compartí el link con tus alumnos — entran con un clic.
                </p>
                <button
                  onClick={() => onCopyCode(classroom.code)}
                  title="Copiar link para compartir con tus alumnos"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100
                           rounded-lg text-sm font-mono font-bold tracking-widest text-gray-800 transition-colors"
                >
                  {classroom.code}
                  {copiedCode === classroom.code
                    ? <IconCheck className="w-4 h-4 text-green-600" />
                    : <IconCopy className="w-4 h-4 text-gray-400" />}
                </button>
                {copiedCode === classroom.code && (
                  <p className="text-[11px] text-green-600 mt-1.5">Link copiado ✓</p>
                )}
              </div>

              <ProximasEntregasBox classroomId={classroom.id} />
            </div>

            {/* Columna grande: tareas, actividades y trivias */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tareas</h3>
                <TareasFeedSummary
                  classroomId={classroom.id}
                  emptyLabel="Todavía no asignaste ninguna tarea."
                  showStats
                  totalStudents={students.length}
                  onOpenTarea={setGradingTarea}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Actividades de esta clase</h3>
                <VisibleActivitiesSummary classroom={classroom} />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Trivias de esta clase</h3>
                <VisibleTriviasSummary classroom={classroom} teacherId={teacherId} />
              </div>
            </div>
          </div>
        )}

        {/* ── Trabajo en clase (solapas: Actividades / Trivias / Preguntas / Completa Palabras / Infografías / Tareas) ── */}
        {tab === 'trabajo' && (
          <WorkInClassTab
            classroom={classroom}
            teacherId={teacherId}
            students={students}
            totalActivities={totalActivities}
            onActivitiesChanged={onActivitiesChanged}
            onTriviasChanged={onTriviasChanged}
            onQuestionsChanged={onQuestionsChanged}
            onCompletaPalabrasChanged={onCompletaPalabrasChanged}
            onInfografiasChanged={onInfografiasChanged}
            onOpenTarea={setGradingTarea}
          />
        )}

        {/* ── Personas ── */}
        {tab === 'personas' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-[11px] font-medium text-gray-500 uppercase mb-2">Profesor</h3>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {teacherName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">{teacherName}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-[11px] font-medium text-gray-500 uppercase">Alumnos</h3>
                <button
                  onClick={onOpenAddStudents}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100
                           text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <IconUserPlus className="w-4 h-4" />
                  Añadir
                </button>
              </div>

              {loadingRoster ? (
                <p className="text-xs text-gray-500 p-4">Cargando alumnos...</p>
              ) : students.length === 0 && pending.length === 0 ? (
                <p className="text-xs text-gray-500 p-4">Todavía no hay alumnos en esta clase.</p>
              ) : (
                <StudentsGrid
                  mode="personas"
                  students={students}
                  pending={pending}
                  totalActivities={totalActivities}
                  onSelectStudent={onSelectStudent}
                  onRemoveStudent={onRemoveStudent}
                  onRemovePending={onRemovePending}
                  onManageStudentCredentials={onManageStudentCredentials}
                  onManagePendingCredentials={onManagePendingCredentials}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Calificaciones ── */}
        {tab === 'calificaciones' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-[11px] font-medium text-gray-500 uppercase">Calificaciones</h3>
            </div>
            {loadingRoster ? (
              <p className="text-xs text-gray-500 p-4">Cargando...</p>
            ) : students.length === 0 ? (
              <p className="text-xs text-gray-500 p-4">
                Todavía no hay alumnos con progreso — van a aparecer acá apenas jueguen algo.
              </p>
            ) : (
              <StudentsGrid
                mode="calificaciones"
                students={students}
                pending={pending}
                totalActivities={totalActivities}
                onSelectStudent={onSelectStudent}
                onRemoveStudent={onRemoveStudent}
                onRemovePending={onRemovePending}
                onManageStudentCredentials={onManageStudentCredentials}
                onManagePendingCredentials={onManagePendingCredentials}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};