'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  IconPlus,
  IconCopy,
  IconUsers,
  IconLoader,
  IconCheck,
  IconSchool,
  IconPencil,
  IconTrash,
  IconX,
  IconUserPlus,
  IconClock,
  IconTrophy,
  IconFlame,
  IconCalendarTime,
  IconListCheck,
  IconKey,
  IconEye,
  IconEyeOff,
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
  IconMoodPuzzled,
  IconClipboardList,
  IconDotsVertical,
} from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import type { Classroom, ClassroomStudent, PendingStudent } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { useAuth } from '@/context/AuthContext';

// Mismo patrón que Features.tsx/ClassroomDesk.tsx: el catálogo guarda el
// ícono como nombre (string), acá lo resolvemos a componente — solo hace
// falta donde realmente se pinta.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
};

const ActivityIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const Icon = ICON_MAP[iconName] ?? IconMoodPuzzled;
  return <Icon className={className} />;
};


// Se usa en app/docente/page.tsx. La protección de rol (que solo entren
// docentes) vive en app/docente/layout.tsx, no acá.

type AddStudentTab = 'individual' | 'masiva';
type DetailTab = 'tablon' | 'trabajo' | 'personas' | 'calificaciones';

// Catálogo único (lib/activities.ts). Acá solo usamos id/title; el resto de
// los campos (ícono, descripción, ruta...) no hacen falta en esta pantalla.
const ACTIVITIES_CATALOG = ACTIVITIES;

// Las trivias no vienen con color propio (las crea el docente, no forman
// parte de un catálogo con paleta fija como las actividades) — les
// asignamos uno automático a partir de su id, siempre el mismo para la
// misma trivia, para que la tarjeta tenga la misma identidad visual.
const TRIVIA_COLORS = [
  '#1E88E5', '#039BE5', '#00897B', '#43A047', '#7CB342',
  '#C0CA33', '#FDD835', '#FFB300', '#FB8C00', '#F4511E',
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
];

function colorForTrivia(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TRIVIA_COLORS[sum % TRIVIA_COLORS.length];
}

const TOTAL_ACTIVITIES = ACTIVITIES_CATALOG.length;

const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const teacherName = profile?.profile?.username?.trim() || 'Docente';

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navegación grilla <-> detalle de clase (como entrar/salir de una clase en Classroom)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Crear clase
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  // Editar nombre (dentro del detalle)
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Confirmación de borrado
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // Roster de la clase abierta
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('tablon');

  // Modales
  const [addModalClassId, setAddModalClassId] = useState<string | null>(null);
  const [progressStudent, setProgressStudent] = useState<ClassroomStudent | null>(null);
  // Actividades y trivias ahora se editan directo en la pestaña Ajustes
  // (con autoguardado), no en un modal aparte.
  const [credentialsTarget, setCredentialsTarget] = useState<{
    classroomId: string;
    pendingId: string;
    username: string;
    password: string;
    /** Si ya está reclamado, presente y con su uid — habilita "Reiniciar acceso". */
    claimedUid?: string;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // La guarda de "si no sos docente, te mando a /" ya no vive acá:
  // la resuelve app/docente/layout.tsx.
  useEffect(() => {
    if (user?.uid) {
      loadClassrooms();
    }
  }, [user]);

  const loadClassrooms = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await ClassroomService.getTeacherClassrooms(user.uid);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar tus clases');
    } finally {
      setLoading(false);
    }
  };

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassId) ?? null;

  const openClassroom = (classroom: Classroom) => {
    setSelectedClassId(classroom.id);
    setDetailTab('tablon');
    loadRoster(classroom.id);
  };

  const closeClassroom = () => {
    setSelectedClassId(null);
    setStudents([]);
    setPending([]);
  };

  const loadRoster = async (classroomId: string) => {
    setLoadingRoster(true);
    try {
      const [studentsData, pendingData] = await Promise.all([
        ClassroomService.getClassroomStudents(classroomId),
        ClassroomService.getPendingStudents(classroomId),
      ]);
      setStudents(studentsData);
      setPending(pendingData.filter((p) => !p.claimed));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoster(false);
    }
  };

  // ---------- Crear clase ----------

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      setError('Ponele un nombre a la clase');
      return;
    }
    if (!user?.uid) return;

    try {
      setCreating(true);
      setError('');
      const classroom = await ClassroomService.createClassroom(user.uid, newClassName.trim());
      setClassrooms((prev) => [classroom, ...prev]);
      setNewClassName('');
      setCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo crear la clase');
    } finally {
      setCreating(false);
    }
  };

  // ---------- Editar nombre ----------

  const startEditingName = () => {
    if (!selectedClassroom) return;
    setNameDraft(selectedClassroom.name);
    setEditingName(true);
  };

  const saveClassName = async () => {
    if (!selectedClassroom || !nameDraft.trim()) return;
    try {
      setSavingName(true);
      await ClassroomService.updateClassroomName(selectedClassroom.id, nameDraft.trim());
      setClassrooms((prev) =>
        prev.map((c) => (c.id === selectedClassroom.id ? { ...c, name: nameDraft.trim() } : c))
      );
      setEditingName(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo renombrar la clase');
    } finally {
      setSavingName(false);
    }
  };

  // ---------- Eliminar clase ----------

  const confirmDeleteClass = async (classroomId: string) => {
    try {
      await ClassroomService.deleteClassroom(classroomId);
      setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
      if (selectedClassId === classroomId) closeClassroom();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar la clase');
    } finally {
      setDeletingClassId(null);
    }
  };

  // ---------- Alumnos ----------

  const handleRemoveStudent = async (classroomId: string, uid: string) => {
    try {
      await ClassroomService.removeStudent(classroomId, uid);
      setStudents((prev) => prev.filter((s) => s.uid !== uid));
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === classroomId ? { ...c, studentCount: Math.max(0, (c.studentCount ?? 1) - 1) } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemovePending = async (classroomId: string, pendingId: string) => {
    try {
      await ClassroomService.removePendingStudent(classroomId, pendingId);
      setPending((prev) => prev.filter((p) => p.id !== pendingId));
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === classroomId ? { ...c, pendingCount: Math.max(0, (c.pendingCount ?? 1) - 1) } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Credenciales (ver/cambiar usuario y contraseña) ----------

  const openCredentialsForPending = (classroomId: string, p: PendingStudent) => {
    setCredentialsTarget({
      classroomId,
      pendingId: p.id,
      username: p.username,
      password: p.password,
    });
  };

  const openCredentialsForStudent = async (classroomId: string, s: ClassroomStudent) => {
    try {
      // Si el alumno se unió después de que empezamos a guardar `pendingId`,
      // lo tenemos directo. Si es de antes, lo buscamos por claimedUid.
      const record = s.pendingId
        ? await ClassroomService.getPendingStudentById(classroomId, s.pendingId)
        : await ClassroomService.getPendingStudentByClaimedUid(classroomId, s.uid);

      if (!record) {
        console.warn('No se encontraron credenciales manuales para este alumno.');
        return;
      }

      setCredentialsTarget({
        classroomId,
        pendingId: record.id,
        username: record.username,
        password: record.password,
        claimedUid: s.uid,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code: string) => {
    // Copiamos el link directo a /clase/[codigo], no el código pelado — así
    // el alumno hace un clic y entra, en vez de tener que ir a la home y
    // buscar dónde tipearlo.
    const shareUrl = `${window.location.origin}/clase/${code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando tus clases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedClassroom ? (
        <ClassroomGridView
          classrooms={classrooms}
          error={error}
          onOpenClassroom={openClassroom}
          onCreateClick={() => setCreateModalOpen(true)}
          onCopyCode={handleCopyCode}
          copiedCode={copiedCode}
        />
      ) : (
        <ClassroomDetailView
          classroom={selectedClassroom}
          onBack={closeClassroom}
          tab={detailTab}
          setTab={setDetailTab}
          students={students}
          pending={pending}
          loadingRoster={loadingRoster}
          editingName={editingName}
          nameDraft={nameDraft}
          setNameDraft={setNameDraft}
          savingName={savingName}
          onStartEditingName={startEditingName}
          onSaveName={saveClassName}
          onCancelEditingName={() => setEditingName(false)}
          onCopyCode={handleCopyCode}
          copiedCode={copiedCode}
          onOpenAddStudents={() => setAddModalClassId(selectedClassroom.id)}
          teacherId={user?.uid ?? ''}
          teacherName={teacherName}
          onActivitiesChanged={(allowedActivities) => {
            setClassrooms((prev) =>
              prev.map((c) => (c.id === selectedClassroom.id ? { ...c, allowedActivities } : c))
            );
          }}
          onTriviasChanged={(visibleTrivias) => {
            setClassrooms((prev) =>
              prev.map((c) => (c.id === selectedClassroom.id ? { ...c, visibleTrivias } : c))
            );
          }}
          onSelectStudent={setProgressStudent}
          onRemoveStudent={(uid) => handleRemoveStudent(selectedClassroom.id, uid)}
          onRemovePending={(pendingId) => handleRemovePending(selectedClassroom.id, pendingId)}
          onManageStudentCredentials={(s) => openCredentialsForStudent(selectedClassroom.id, s)}
          onManagePendingCredentials={(p) => openCredentialsForPending(selectedClassroom.id, p)}
          onDeleteClass={() => setDeletingClassId(selectedClassroom.id)}
          totalActivities={TOTAL_ACTIVITIES}
        />
      )}

      {/* Modal "Crear clase" */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Crear clase</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => { setNewClassName(e.target.value); setError(''); }}
              placeholder="Nombre de la clase (ej: 4to B - Biología)"
              disabled={creating}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 mb-1"
            />
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClass}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
                         rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {creating && <IconLoader className="w-4 h-4 animate-spin" />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de borrado */}
      {deletingClassId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <h3 className="font-bold text-gray-900 mb-1">¿Eliminar esta clase?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se van a borrar también todos los alumnos asociados. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingClassId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDeleteClass(deletingClassId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Añadir estudiantes" */}
      {addModalClassId && (
        <AddStudentsModal
          classroomId={addModalClassId}
          onClose={() => setAddModalClassId(null)}
          onStudentsAdded={() => {
            loadClassrooms();
            if (selectedClassId === addModalClassId) loadRoster(addModalClassId);
          }}
        />
      )}

      {/* Modal de progreso individual */}
      {progressStudent && (
        <StudentProgressModal
          student={progressStudent}
          onClose={() => setProgressStudent(null)}
        />
      )}

      {/* Modal de credenciales (ver/cambiar usuario y contraseña) */}
      {credentialsTarget && (
        <CredentialsModal
          target={credentialsTarget}
          onClose={() => setCredentialsTarget(null)}
          onSaved={() => {
            setCredentialsTarget(null);
            if (selectedClassId) loadRoster(selectedClassId);
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;

// ==================== Vista: grilla de clases ====================

const ClassroomGridView = ({
  classrooms,
  error,
  onOpenClassroom,
  onCreateClick,
  onCopyCode,
  copiedCode,
}: {
  classrooms: Classroom[];
  error: string;
  onOpenClassroom: (c: Classroom) => void;
  onCreateClick: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    {/* Barra superior estilo Classroom */}
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
          <IconSchool className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-medium text-gray-800">Aula virtual</h1>
      </div>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg
                 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <IconPlus className="w-4 h-4" />
        Crear clase
      </button>
    </div>

    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

    {classrooms.length === 0 ? (
      <div className="text-center py-24">
        <IconSchool className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Todavía no creaste ninguna clase.</p>
        <button
          onClick={onCreateClick}
          className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700"
        >
          Crear tu primera clase
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classrooms.map((classroom) => (
          <ClassroomCard
            key={classroom.id}
            classroom={classroom}
            onOpen={() => onOpenClassroom(classroom)}
            onCopyCode={onCopyCode}
            copiedCode={copiedCode}
          />
        ))}
      </div>
    )}
  </div>
);

// ==================== Tarjeta de clase ====================

const ClassroomCard = ({
  classroom,
  onOpen,
  onCopyCode,
  copiedCode,
}: {
  classroom: Classroom;
  onOpen: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
    {/* Banner de color, estilo Classroom */}
    <button onClick={onOpen} className="block w-full text-left">
      <div
        className="h-24 px-4 py-3 flex flex-col justify-between relative"
        style={{ backgroundColor: classroom.color }}
      >
        <h3 className="text-white font-medium text-base leading-tight pr-6 line-clamp-2">
          {classroom.name}
        </h3>
      </div>
    </button>

    {/* Cuerpo */}
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <IconUsers className="w-3.5 h-3.5" />
          {classroom.studentCount ?? 0} alumno{(classroom.studentCount ?? 0) !== 1 ? 's' : ''}
        </div>
        {(classroom.pendingCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <IconClock className="w-3.5 h-3.5" />
            {classroom.pendingCount} pendiente{(classroom.pendingCount ?? 0) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <button
        onClick={() => onCopyCode(classroom.code)}
        title="Copiar link para compartir con tus alumnos"
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100
                 rounded-lg text-sm font-mono font-bold tracking-widest text-gray-700 transition-colors"
      >
        {classroom.code}
        {copiedCode === classroom.code
          ? <IconCheck className="w-4 h-4 text-green-600" />
          : <IconCopy className="w-4 h-4 text-gray-400" />}
      </button>
    </div>
  </div>
);

// ==================== Vista de detalle de una clase ====================

const ClassroomDetailView = ({
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
  onSelectStudent: (s: ClassroomStudent) => void;
  onRemoveStudent: (uid: string) => void;
  onManageStudentCredentials: (s: ClassroomStudent) => void;
  onManagePendingCredentials: (p: PendingStudent) => void;
  onRemovePending: (pendingId: string) => void;
  onDeleteClass: () => void;
  totalActivities: number;
}) => {
  const [showClassMenu, setShowClassMenu] = useState(false);

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'tablon', label: 'Tablón' },
    { key: 'trabajo', label: 'Trabajo en clase' },
    { key: 'personas', label: 'Personas' },
    { key: 'calificaciones', label: 'Calificaciones' },
  ];

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
            {/* Columna chica: código de la clase */}
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

            {/* Columna grande: actividades y trivias */}
            <div className="space-y-4">
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

        {/* ── Trabajo en clase ── */}
        {tab === 'trabajo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <ActivitiesPicker
                classroom={classroom}
                totalActivities={totalActivities}
                onChanged={onActivitiesChanged}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <TriviasPicker
                classroom={classroom}
                teacherId={teacherId}
                onChanged={onTriviasChanged}
              />
            </div>
          </div>
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

// ==================== Resúmenes de solo lectura para "Tablón" ====================

const VisibleActivitiesSummary = ({ classroom }: { classroom: Classroom }) => {
  const visible = classroom.allowedActivities
    ? ACTIVITIES_CATALOG.filter((a) => classroom.allowedActivities!.includes(a.id))
    : ACTIVITIES_CATALOG;

  if (visible.length === 0) {
    return <p className="text-xs text-gray-400">Todavía no hay actividades seleccionadas.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {visible.map((activity) => (
        <div
          key={activity.id}
          className="rounded-xl border-2 border-transparent shadow-sm p-3 min-w-0"
          style={{ borderColor: activity.color, backgroundColor: `${activity.color}0D` }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
            style={{ backgroundColor: activity.color }}
          >
            <ActivityIcon iconName={activity.iconName} className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 break-words">{activity.title}</p>
          <p className="text-[10px] text-gray-500 leading-tight">{activity.category}</p>
        </div>
      ))}
    </div>
  );
};

const VisibleTriviasSummary = ({ classroom, teacherId }: { classroom: Classroom; teacherId: string }) => {
  const [trivias, setTrivias] = useState<TeacherTriviaOption[] | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        const q = query(collection(db, 'trivia'), where('author', '==', teacherId));
        const snap = await getDocs(q);
        const list: TeacherTriviaOption[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: data.id || d.id,
            name: data.name,
            questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
          };
        });
        const visible = classroom.visibleTrivias
          ? list.filter((t) => classroom.visibleTrivias!.includes(t.id))
          : list;
        setTrivias(visible);
      } catch (err) {
        console.error('Error cargando trivias:', err);
        setTrivias([]);
      }
    })();
  }, [teacherId, classroom.visibleTrivias]);

  if (trivias === null) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
        <IconLoader className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  if (trivias.length === 0) {
    return <p className="text-xs text-gray-400">Todavía no hay trivias seleccionadas.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {trivias.map((t) => {
        const color = colorForTrivia(t.id);
        return (
          <div
            key={t.id}
            className="rounded-xl border-2 border-transparent shadow-sm p-3 min-w-0"
            style={{ borderColor: color, backgroundColor: `${color}0D` }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
              style={{ backgroundColor: color }}
            >
              <IconClipboardList className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">{t.name}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{t.questionCount} preg.</p>
          </div>
        );
      })}
    </div>
  );
};

// ==================== Grilla de progreso de todos los alumnos ====================

type SortKey = 'username' | 'completed' | 'score' | 'streak' | 'lastActive';
type SortDir = 'asc' | 'desc';

const StudentsGrid = ({
  students,
  pending,
  totalActivities,
  mode,
  onSelectStudent,
  onRemoveStudent,
  onRemovePending,
  onManageStudentCredentials,
  onManagePendingCredentials,
}: {
  students: ClassroomStudent[];
  pending: PendingStudent[];
  totalActivities: number;
  mode: 'personas' | 'calificaciones';
  onSelectStudent: (s: ClassroomStudent) => void;
  onRemoveStudent: (uid: string) => void;
  onRemovePending: (pendingId: string) => void;
  onManageStudentCredentials: (s: ClassroomStudent) => void;
  onManagePendingCredentials: (p: PendingStudent) => void;
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('username');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'completed':
        return ((a.progress?.completedCount ?? 0) - (b.progress?.completedCount ?? 0)) * dir;
      case 'score':
        return ((a.progress?.totalScore ?? 0) - (b.progress?.totalScore ?? 0)) * dir;
      case 'streak':
        return ((a.progress?.streak ?? 0) - (b.progress?.streak ?? 0)) * dir;
      case 'lastActive':
        return ((a.progress?.lastActive ?? '') > (b.progress?.lastActive ?? '') ? 1 : -1) * dir;
      default:
        return a.username.localeCompare(b.username) * dir;
    }
  });

  const SortHeader = ({ label, sortableKey }: { label: string; sortableKey: SortKey }) => (
    <th
      onClick={() => toggleSort(sortableKey)}
      className="text-left text-[11px] font-medium text-gray-500 uppercase px-3 py-2 cursor-pointer
               hover:text-indigo-600 select-none whitespace-nowrap"
    >
      {label} {sortKey === sortableKey && (sortDir === 'asc' ? '▲' : '▼')}
    </th>
  );

  const isCalificaciones = mode === 'calificaciones';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <SortHeader label="Alumno" sortableKey="username" />
            {isCalificaciones ? (
              <>
                <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-3 py-2 whitespace-nowrap">
                  Progreso
                </th>
                <SortHeader label="Completadas" sortableKey="completed" />
                <SortHeader label="Puntos" sortableKey="score" />
                <SortHeader label="Racha" sortableKey="streak" />
              </>
            ) : (
              <SortHeader label="Última vez" sortableKey="lastActive" />
            )}
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((s) => {
            const completed = s.progress?.completedCount ?? 0;
            const percentage = Math.round((completed / totalActivities) * 100);
            return (
              <tr
                key={s.uid}
                onClick={isCalificaciones ? () => onSelectStudent(s) : undefined}
                className={`border-b border-gray-100 transition-colors ${
                  isCalificaciones ? 'hover:bg-gray-50 cursor-pointer' : ''
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={s.character?.image}
                      alt={s.character?.name}
                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                    />
                    <span className="font-medium text-gray-800 whitespace-nowrap">{s.username}</span>
                  </div>
                </td>

                {isCalificaciones ? (
                  <>
                    <td className="px-3 py-2 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {completed}/{totalActivities}
                    </td>
                    <td className="px-3 py-2 text-yellow-700 font-medium whitespace-nowrap">
                      {s.progress?.totalScore ?? 0}
                    </td>
                    <td className="px-3 py-2 text-orange-600 whitespace-nowrap">
                      {s.progress?.streak ?? 0}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(s.progress?.lastActive)}
                  </td>
                )}

                <td className="px-3 py-2 text-right">
                  {!isCalificaciones && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onManageStudentCredentials(s); }}
                        className="text-gray-300 hover:text-indigo-600"
                        title="Ver/cambiar usuario y contraseña"
                      >
                        <IconKey className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveStudent(s.uid); }}
                        className="text-gray-300 hover:text-red-600"
                        title="Eliminar alumno"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {!isCalificaciones && pending.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 bg-amber-50/50">
              <td className="px-3 py-2">
                <span className="font-medium text-gray-500">{p.username}</span>
              </td>
              <td className="px-3 py-2 text-xs text-amber-600">
                Todavía no inició sesión
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onManagePendingCredentials(p)}
                    className="text-gray-300 hover:text-indigo-600"
                    title="Ver/cambiar usuario y contraseña"
                  >
                    <IconKey className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemovePending(p.id)}
                    className="text-gray-300 hover:text-red-600"
                    title="Eliminar"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================== Modal de progreso individual ====================

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return 'Todavía no jugó';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays > 1) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR');
};

const StudentProgressModal = ({
  student,
  onClose,
}: {
  student: ClassroomStudent;
  onClose: () => void;
}) => {
  const progress = student.progress;
  const completedCount = progress?.completedCount ?? 0;
  const percentage = Math.round((completedCount / TOTAL_ACTIVITIES) * 100);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={student.character?.image}
              alt={student.character?.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div>
              <h2 className="text-base font-bold text-gray-900">{student.username}</h2>
              <p className="text-xs text-gray-500">
                {student.addedManually ? 'Agregado manualmente' : 'Se unió con código'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {!progress ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Este alumno todavía no completó ninguna actividad.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <IconTrophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">{progress.totalScore}</p>
                  <p className="text-[10px] text-gray-500">Puntos</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <IconFlame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">{progress.streak}</p>
                  <p className="text-[10px] text-gray-500">Racha (días)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <IconCalendarTime className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{formatDate(progress.lastActive)}</p>
                  <p className="text-[10px] text-gray-500">Última vez</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700">Actividades completadas</p>
                  <p className="text-xs text-gray-500">{completedCount}/{TOTAL_ACTIVITIES}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Detalle</p>
                {progress.completedActivities.length === 0 ? (
                  <p className="text-xs text-gray-400">Todavía no completó actividades.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {progress.completedActivities.map((title) => (
                      <li
                        key={title}
                        className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span>{title}</span>
                        <span className="text-xs font-medium text-yellow-600">
                          {progress.activityScores?.[title] ?? 0} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== "Actividades visibles" (inline, autoguardado) ====================

const ActivitiesPicker = ({
  classroom,
  totalActivities,
  onChanged,
}: {
  classroom: Classroom;
  totalActivities: number;
  onChanged: (allowedActivities: string[] | null) => void;
}) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(classroom.allowedActivities ?? ACTIVITIES_CATALOG.map((a) => a.id))
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoguardado: esperamos un toque a que la persona termine de tocar
  // varias tarjetas seguidas antes de escribir en Firestore, en vez de
  // mandar un request por cada click.
  const scheduleSave = (next: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        const activityIds = Array.from(next);
        await ClassroomService.updateAllowedActivities(classroom.id, activityIds);
        onChanged(activityIds);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 600);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      // No dejamos que se quede sin ninguna actividad visible.
      if (prev.has(id) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      scheduleSave(next);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(ACTIVITIES_CATALOG.map((a) => a.id));
    setSelected(next);
    scheduleSave(next);
  };

  const selectNone = () => {
    // Dejamos al menos la primera, por la misma razón de arriba.
    const next = new Set([ACTIVITIES_CATALOG[0]?.id].filter(Boolean) as string[]);
    setSelected(next);
    scheduleSave(next);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900">Actividades visibles</h3>
        <SaveIndicator state={saveState} />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Tocá una tarjeta para prenderla/apagarla — se guarda solo. Los alumnos de esta
        clase solo ven las que estén marcadas ({selected.size}/{totalActivities}).
      </p>

      <div className="flex gap-3 text-xs mb-3">
        <button onClick={selectAll} className="text-indigo-600 hover:underline font-medium">
          Marcar todas
        </button>
        <button onClick={selectNone} className="text-gray-500 hover:underline font-medium">
          Desmarcar todas
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ACTIVITIES_CATALOG.map((activity) => {
          const isOn = selected.has(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggle(activity.id)}
              className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
                isOn
                  ? 'border-transparent shadow-sm'
                  : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
              }`}
              style={isOn ? { borderColor: activity.color, backgroundColor: `${activity.color}0D` } : undefined}
            >
              {isOn && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: activity.color }}
                >
                  <IconCheck className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                style={{ backgroundColor: activity.color }}
              >
                <ActivityIcon iconName={activity.iconName} className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 break-words">{activity.title}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{activity.category}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Indicador chico y compartido para el autoguardado (actividades y trivias).
const SaveIndicator = ({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) => {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
        <IconLoader className="w-3.5 h-3.5 animate-spin" /> Guardando...
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
        <IconCheck className="w-3.5 h-3.5" /> Guardado
      </span>
    );
  }
  if (state === 'error') {
    return <span className="text-xs text-red-600 shrink-0">No se pudo guardar</span>;
  }
  return null;
};

// ==================== "Trivias visibles" (inline, autoguardado) ====================
//
// Las trivias son del docente (se ven en todas sus clases por default,
// como decidimos), pero acá le damos control fino: puede apagar
// puntualmente cuáles quiere que vean los alumnos de ESTA clase en
// particular. `null` en visibleTrivias = todas (sin restricción).

interface TeacherTriviaOption {
  id: string;
  name: string;
  questionCount: number;
}

const TriviasPicker = ({
  classroom,
  teacherId,
  onChanged,
}: {
  classroom: Classroom;
  teacherId: string;
  onChanged: (visibleTrivias: string[] | null) => void;
}) => {
  const [trivias, setTrivias] = useState<TeacherTriviaOption[]>([]);
  const [loadingTrivias, setLoadingTrivias] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        setLoadingTrivias(true);
        const q = query(collection(db, 'trivia'), where('author', '==', teacherId));
        const snap = await getDocs(q);
        const list: TeacherTriviaOption[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: data.id || d.id,
            name: data.name,
            questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
          };
        });
        setTrivias(list);
        // Si visibleTrivias es null (sin restricción todavía), arrancamos
        // con todas tildadas — refleja el estado real ("se ven todas").
        setSelected(new Set(classroom.visibleTrivias ?? list.map((t) => t.id)));
      } catch (err) {
        console.error('Error cargando trivias:', err);
      } finally {
        setLoadingTrivias(false);
      }
    })();
  }, [teacherId, classroom.visibleTrivias]);

  const scheduleSave = (next: Set<string>, total: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        // Si están todas tildadas, guardamos null (sin restricción) en vez
        // de la lista completa — así una trivia nueva que cree después
        // también aparece acá sin tener que volver a tocar nada.
        const value = next.size === total ? null : Array.from(next);
        await ClassroomService.updateVisibleTrivias(classroom.id, value);
        onChanged(value);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 600);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      scheduleSave(next, trivias.length);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(trivias.map((t) => t.id));
    setSelected(next);
    scheduleSave(next, trivias.length);
  };

  const selectNone = () => {
    setSelected(new Set());
    scheduleSave(new Set(), trivias.length);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900">Trivias visibles</h3>
        {!loadingTrivias && trivias.length > 0 && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Elegí cuáles de tus trivias pueden jugar los alumnos de esta clase — se guarda solo.
      </p>

      {loadingTrivias ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : trivias.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">Todavía no creaste ninguna trivia.</p>
          <a
            href="/docente/trivias"
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Crear tu primera trivia
          </a>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-xs mb-3">
            <button onClick={selectAll} className="text-indigo-600 hover:underline font-medium">
              Marcar todas
            </button>
            <button onClick={selectNone} className="text-gray-500 hover:underline font-medium">
              Desmarcar todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {trivias.map((trivia) => {
              const isOn = selected.has(trivia.id);
              const color = colorForTrivia(trivia.id);
              return (
                <button
                  key={trivia.id}
                  type="button"
                  onClick={() => toggle(trivia.id)}
                  className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
                    isOn
                      ? 'border-transparent shadow-sm'
                      : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
                  }`}
                  style={isOn ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
                >
                  {isOn && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                    style={{ backgroundColor: color }}
                  >
                    <IconClipboardList className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">
                    {trivia.name}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">{trivia.questionCount} preg.</p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== Modal "Añadir estudiantes" ====================

const AddStudentsModal = ({
  classroomId,
  onClose,
  onStudentsAdded,
}: {
  classroomId: string;
  onClose: () => void;
  onStudentsAdded: () => void;
}) => {
  const [tab, setTab] = useState<AddStudentTab>('individual');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: string[] } | null>(null);
  const [savingBulk, setSavingBulk] = useState(false);

  const isValidIndividual = name.trim().length >= 3 && password.trim().length >= 3;

  const handleAddIndividual = async () => {
    if (!isValidIndividual) {
      setError('Completá ambos campos con al menos 3 caracteres.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await ClassroomService.addPendingStudent(classroomId, name.trim(), password.trim());
      setSuccess(true);
      setName('');
      setPassword('');
      onStudentsAdded();
      setTimeout(() => setSuccess(false), 1500);
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'DUPLICATE_USERNAME') {
        setError('Ya hay un alumno con ese usuario en esta clase. Elegí otro nombre.');
      } else {
        setError('No se pudo agregar el estudiante');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddBulk = async () => {
    const lines = bulkText.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      setError('Pegá al menos una línea con "Nombre, contraseña".');
      return;
    }
    try {
      setSavingBulk(true);
      setError('');
      const result = await ClassroomService.addPendingStudentsBulk(classroomId, lines);
      setBulkResult(result);
      if (result.added > 0) {
        onStudentsAdded();
        setBulkText('');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudieron agregar los estudiantes');
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Añadir estudiantes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-5">
          <button
            onClick={() => { setTab('individual'); setError(''); }}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'individual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Añadir individualmente
          </button>
          <button
            onClick={() => { setTab('masiva'); setError(''); }}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'masiva'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Añadir de forma masiva
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {tab === 'individual' ? (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Estudiante</label>
                <p className="text-xs text-gray-500 mb-2">
                  Cómo saber quién es quién en tu clase. Por ejemplo, Maria L. Mínimo 3 caracteres.
                  Admite letras, números y símbolos.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Por ejemplo, María L."
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Inicio de sesión de estudiante</label>
                <p className="text-xs text-gray-500 mb-2">
                  Contraseña única que este estudiante utilizará para iniciar sesión. Mínimo 3 caracteres.
                  Admite letras, números y símbolos.
                </p>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Por ejemplo, MarL632"
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {error && <p className="text-red-600 text-xs">{error}</p>}
              {success && <p className="text-green-600 text-xs">Estudiante añadido ✓</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddIndividual}
                  disabled={!isValidIndividual || saving}
                  className="px-5 py-2 rounded-full bg-gray-800 text-white text-sm font-medium
                           hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed
                           flex items-center gap-2"
                >
                  {saving && <IconLoader className="w-4 h-4 animate-spin" />}
                  Añadir estudiante
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Lista de estudiantes</label>
                <p className="text-xs text-gray-500 mb-2">
                  Una línea por estudiante, con el formato: <span className="font-mono">Nombre, contraseña</span>
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setError(''); setBulkResult(null); }}
                  disabled={savingBulk}
                  rows={6}
                  placeholder={'María L., MarL632\nJuan P., JuaP219'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono
                           focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {error && <p className="text-red-600 text-xs">{error}</p>}

              {bulkResult && (
                <div className="text-xs space-y-1">
                  <p className="text-green-600">{bulkResult.added} estudiante(s) añadido(s) ✓</p>
                  {bulkResult.skipped.length > 0 && (
                    <div className="text-amber-600">
                      <p>{bulkResult.skipped.length} línea(s) ignorada(s) (formato inválido):</p>
                      <ul className="list-disc list-inside">
                        {bulkResult.skipped.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddBulk}
                  disabled={savingBulk || !bulkText.trim()}
                  className="px-5 py-2 rounded-full bg-gray-800 text-white text-sm font-medium
                           hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed
                           flex items-center gap-2"
                >
                  {savingBulk && <IconLoader className="w-4 h-4 animate-spin" />}
                  Añadir estudiantes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Modal de credenciales ====================
//
// Muestra y permite cambiar el usuario/contraseña de un alumno agregado
// manualmente — sirve tanto para uno que todavía no inició sesión como
// para uno que ya se unió (por si se le olvida y necesita que se la
// reasignen). La contraseña se guarda en texto plano en `estudiantesPendientes`
// (no son cuentas reales, es solo un login acotado a la clase), así que
// mostrarla directamente es intencional, no un descuido de seguridad.

const CredentialsModal = ({
  target,
  onClose,
  onSaved,
}: {
  target: { classroomId: string; pendingId: string; username: string; password: string; claimedUid?: string };
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [username, setUsername] = useState(target.username);
  const [password, setPassword] = useState(target.password);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = async () => {
    if (username.trim().length < 3 || password.trim().length < 3) {
      setError('Usuario y contraseña deben tener al menos 3 caracteres.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await ClassroomService.updateCredentials(target.classroomId, target.pendingId, {
        username: username.trim(),
        password: password.trim(),
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!target.claimedUid) return;
    try {
      setResetting(true);
      setError('');
      await ClassroomService.resetStudentAccess(target.classroomId, target.pendingId, target.claimedUid);
      onSaved();
    } catch (err) {
      console.error(err);
      setError('No se pudo reiniciar el acceso.');
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <IconKey className="w-4 h-4 text-indigo-600" />
            Usuario y contraseña
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Esto es lo que el alumno necesita para iniciar sesión en esta clase.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              disabled={saving || resetting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={saving || resetting}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={saving || resetting}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || resetting}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <IconLoader className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>

        {/* Reiniciar acceso: solo tiene sentido si el alumno ya inició sesión */}
        {target.claimedUid && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!confirmingReset ? (
              <button
                onClick={() => setConfirmingReset(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Reiniciar acceso de este alumno
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 mb-2">
                  Esto borra su progreso guardado y le permite volver a unirse desde cero con
                  el mismo usuario y contraseña. Usalo si perdió el acceso en su dispositivo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingReset(false)}
                    disabled={resetting}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700
                             disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {resetting && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                    Sí, reiniciar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};