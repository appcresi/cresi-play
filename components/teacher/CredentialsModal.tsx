import React, { useState } from 'react';
import { IconX, IconKey, IconEye, IconEyeOff, IconLoader } from '@tabler/icons-react';
import ClassroomService from '@/lib/classroomService';

// ==================== Modal de credenciales ====================
//
// Muestra y permite cambiar el usuario/contraseña de un alumno agregado
// manualmente — sirve tanto para uno que todavía no inició sesión como
// para uno que ya se unió (por si se le olvida y necesita que se la
// reasignen). La contraseña se guarda en texto plano en `estudiantesPendientes`
// (no son cuentas reales, es solo un login acotado a la clase), así que
// mostrarla directamente es intencional, no un descuido de seguridad.

export const CredentialsModal = ({
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