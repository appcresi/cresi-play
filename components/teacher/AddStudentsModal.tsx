import React, { useState } from 'react';
import { IconX, IconLoader } from '@tabler/icons-react';
import ClassroomService from '@/lib/classroomService';
import type { AddStudentTab } from './types';

// ==================== Modal "Añadir estudiantes" ====================

export const AddStudentsModal = ({
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
        <div className="flex items-center justify-between p-5 border-b border-pink-light">
          <h2 className="text-lg font-bold text-ink">Añadir estudiantes</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink/70">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-pink-light px-5">
          <button
            onClick={() => { setTab('individual'); setError(''); }}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'individual'
                ? 'border-coral text-coral-dark'
                : 'border-transparent text-ink/60 hover:text-ink/80'
            }`}
          >
            Añadir individualmente
          </button>
          <button
            onClick={() => { setTab('masiva'); setError(''); }}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'masiva'
                ? 'border-coral text-coral-dark'
                : 'border-transparent text-ink/60 hover:text-ink/80'
            }`}
          >
            Añadir de forma masiva
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {tab === 'individual' ? (
            <>
              <div>
                <label className="block text-sm font-bold text-ink mb-1">Estudiante</label>
                <p className="text-xs text-ink/60 mb-2">
                  Cómo saber quién es quién en tu clase. Por ejemplo, Maria L. Mínimo 3 caracteres.
                  Admite letras, números y símbolos.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Por ejemplo, María L."
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-pink-light rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-coral disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-ink mb-1">Inicio de sesión de estudiante</label>
                <p className="text-xs text-ink/60 mb-2">
                  Contraseña única que este estudiante utilizará para iniciar sesión. Mínimo 3 caracteres.
                  Admite letras, números y símbolos.
                </p>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Por ejemplo, MarL632"
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-pink-light rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-coral disabled:opacity-50"
                />
              </div>

              {error && <p className="text-red-600 text-xs">{error}</p>}
              {success && <p className="text-green-600 text-xs">Estudiante añadido ✓</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full border border-pink-light text-ink/80 text-sm font-medium hover:bg-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddIndividual}
                  disabled={!isValidIndividual || saving}
                  className="px-5 py-2 rounded-full bg-coral text-white text-sm font-medium
                           hover:bg-coral-dark disabled:bg-pink-light disabled:cursor-not-allowed
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
                <label className="block text-sm font-bold text-ink mb-1">Lista de estudiantes</label>
                <p className="text-xs text-ink/60 mb-2">
                  Una línea por estudiante, con el formato: <span className="font-mono">Nombre, contraseña</span>
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setError(''); setBulkResult(null); }}
                  disabled={savingBulk}
                  rows={6}
                  placeholder={'María L., MarL632\nJuan P., JuaP219'}
                  className="w-full px-3 py-2.5 border border-pink-light rounded-lg text-sm font-mono
                           focus:outline-none focus:ring-2 focus:ring-coral disabled:opacity-50"
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
                  className="px-5 py-2 rounded-full border border-pink-light text-ink/80 text-sm font-medium hover:bg-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddBulk}
                  disabled={savingBulk || !bulkText.trim()}
                  className="px-5 py-2 rounded-full bg-coral text-white text-sm font-medium
                           hover:bg-coral-dark disabled:bg-pink-light disabled:cursor-not-allowed
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