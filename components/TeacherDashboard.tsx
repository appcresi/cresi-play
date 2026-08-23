'use client';

import React, { useEffect, useState } from 'react';
import ClassroomService from '@/lib/classroomService';
import { trackEvent } from '@/lib/analytics';
import type { Classroom, ClassroomStudent, PendingStudent } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { useAuth } from '@/context/AuthContext';

import type { DetailTab } from './teacher/types';
import { ClassroomGridView } from './teacher/ClassroomGridView';
import { ClassroomDetailView } from './teacher/ClassroomDetailView';
import { CreateClassModal } from './teacher/CreateClassModal';
import { DeleteClassModal } from './teacher/DeleteClassModal';
import { AddStudentsModal } from './teacher/AddStudentsModal';
import { StudentProgressModal } from './teacher/StudentProgressModal';
import { CredentialsModal } from './teacher/CredentialsModal';

// Se usa en app/docente/page.tsx. La protección de rol (que solo entren
// docentes) vive en app/docente/layout.tsx, no acá.
//
// Este archivo es solo el orquestador: guarda el estado y los handlers,
// y delega todo el render a components/teacher/*. Antes tenía más de
// 2300 líneas con todo junto (vistas, modales, pickers) — se dividió en
// piezas más chicas para que sea manejable.

const TOTAL_ACTIVITIES = ACTIVITIES.length;

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
  // Actividades, trivias y preguntas se editan directo en la pestaña
  // Trabajo en clase (con autoguardado), no en un modal aparte.
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
      trackEvent('create_classroom');
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
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral mx-auto mb-3" />
          <p className="text-sm text-ink/60 dark:text-gray-400">Cargando tus clases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
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
          onQuestionsChanged={(restrictedTags, restrictedQuestionIds) => {
            setClassrooms((prev) =>
              prev.map((c) =>
                c.id === selectedClassroom.id ? { ...c, restrictedTags, restrictedQuestionIds } : c
              )
            );
          }}
          onCompletaPalabrasChanged={(visibleCompletaPalabras) => {
            setClassrooms((prev) =>
              prev.map((c) => (c.id === selectedClassroom.id ? { ...c, visibleCompletaPalabras } : c))
            );
          }}
          onInfografiasChanged={(restrictedInfografias) => {
            setClassrooms((prev) =>
              prev.map((c) => (c.id === selectedClassroom.id ? { ...c, restrictedInfografias } : c))
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

      {createModalOpen && (
        <CreateClassModal
          name={newClassName}
          onNameChange={(v) => { setNewClassName(v); setError(''); }}
          error={error}
          creating={creating}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateClass}
        />
      )}

      {deletingClassId && (
        <DeleteClassModal
          onCancel={() => setDeletingClassId(null)}
          onConfirm={() => confirmDeleteClass(deletingClassId)}
        />
      )}

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

      {progressStudent && (
        <StudentProgressModal
          student={progressStudent}
          onClose={() => setProgressStudent(null)}
        />
      )}

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