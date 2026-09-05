// lib/tareaService.ts
//
// CRUD de tareas y entregas — mismo estilo que classroomService.ts.
// Las tareas viven bajo classrooms/{classroomId}/tareas/{tareaId}, y
// cada entrega bajo .../tareas/{tareaId}/entregas/{studentUid}.
//
// No entrega === no existe el documento: no pre-creamos un documento
// "pendiente" por cada alumno al crear la tarea (evita tener que conocer
// el roster completo en ese momento). "Pendiente" se calcula del lado
// del cliente comparando el roster contra qué entregas existen.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseFirestore';
import type { Tarea, Entrega, LinkedActivity } from '@/types/tarea';

/** Si una entrega llegó después de la fecha de entrega de la tarea —
 *  compartido entre la vista de calificar y el cuaderno de calificaciones
 *  para que el criterio de "con retraso" no pueda divergir entre los dos. */
export function isEntregaLate(tarea: Tarea, entrega: Entrega): boolean {
  return new Date(entrega.submittedAt).getTime() > new Date(tarea.dueDate).getTime();
}

const TareaService = {
  async createTarea(
    classroomId: string,
    teacherId: string,
    data: { title: string; consigna: string; linkedActivity: LinkedActivity; points: number; dueDate: string }
  ): Promise<Tarea> {
    const ref = await addDoc(collection(db, 'classrooms', classroomId, 'tareas'), {
      title: data.title,
      consigna: data.consigna,
      linkedActivity: data.linkedActivity,
      points: data.points,
      dueDate: data.dueDate,
      createdBy: teacherId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const now = new Date().toISOString();
    return {
      id: ref.id,
      title: data.title,
      consigna: data.consigna,
      linkedActivity: data.linkedActivity,
      points: data.points,
      dueDate: data.dueDate,
      createdBy: teacherId,
      createdAt: now,
      updatedAt: now,
    };
  },

  async getTareasForClassroom(classroomId: string): Promise<Tarea[]> {
    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'tareas'));
    return snap.docs
      .map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          title: data.title,
          consigna: data.consigna,
          linkedActivity: data.linkedActivity ?? { type: 'libre' },
          points: data.points ?? 0,
          dueDate: data.dueDate,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
        } as Tarea;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  async getTareaById(classroomId: string, tareaId: string): Promise<Tarea | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId, 'tareas', tareaId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      id: snap.id,
      title: data.title,
      consigna: data.consigna,
      linkedActivity: data.linkedActivity ?? { type: 'libre' },
      points: data.points ?? 0,
      dueDate: data.dueDate,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    };
  },

  async updateTarea(
    classroomId: string,
    tareaId: string,
    data: Partial<{ title: string; consigna: string; linkedActivity: LinkedActivity; points: number; dueDate: string }>
  ): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId, 'tareas', tareaId), { ...data, updatedAt: serverTimestamp() });
  },

  async deleteTarea(classroomId: string, tareaId: string): Promise<void> {
    // Nota: esto no borra en cascada las entregas — para un borrado
    // completo habría que listarlas y borrarlas una por una. Como no es
    // una operación frecuente ni con muchas entregas, se deja simple por
    // ahora; se puede reforzar más adelante si hace falta.
    await deleteDoc(doc(db, 'classrooms', classroomId, 'tareas', tareaId));
  },

  // ---------- Entregas ----------

  async getEntregasForTarea(classroomId: string, tareaId: string): Promise<Entrega[]> {
    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'tareas', tareaId, 'entregas'));
    return snap.docs.map((d) => ({ studentUid: d.id, ...(d.data() as any) } as Entrega));
  },

  async getEntregaForStudent(classroomId: string, tareaId: string, studentUid: string): Promise<Entrega | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId, 'tareas', tareaId, 'entregas', studentUid));
    if (!snap.exists()) return null;
    return { studentUid, ...(snap.data() as any) } as Entrega;
  },

  /** El alumno entrega (o re-entrega, si ya había mandado algo antes de la fecha límite). */
  async submitEntrega(
    classroomId: string,
    tareaId: string,
    studentUid: string,
    data: { responseText?: string; manuallyMarkedDone?: boolean }
  ): Promise<void> {
    const ref = doc(db, 'classrooms', classroomId, 'tareas', tareaId, 'entregas', studentUid);
    await setDoc(
      ref,
      {
        status: 'entregada',
        submittedAt: new Date().toISOString(),
        responseText: data.responseText ?? null,
        manuallyMarkedDone: data.manuallyMarkedDone ?? false,
      },
      { merge: true }
    );
  },

  /** El docente califica una entrega ya hecha. */
  async gradeEntrega(
    classroomId: string,
    tareaId: string,
    studentUid: string,
    data: { grade: number; feedback?: string }
  ): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId, 'tareas', tareaId, 'entregas', studentUid), {
      status: 'calificada',
      grade: data.grade,
      feedback: data.feedback ?? null,
      gradedAt: new Date().toISOString(),
    });
  },
};

export default TareaService;