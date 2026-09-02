import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';

interface LeaderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeaderAuthModal: React.FC<LeaderAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (isChangingPin) {
      if (newPin.length < 6) setNewPin((prev) => prev + num);
    } else {
      if (pin.length < 6) {
        const next = pin + num;
        setPin(next);
        setError(null);
      }
    }
  };

  const handleDelete = () => {
    if (isChangingPin) {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
      setError(null);
    }
  };

  const handleClear = () => {
    if (isChangingPin) {
      setNewPin('');
      setConfirmNewPin('');
    } else {
      setPin('');
      setError(null);
    }
  };

  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const result = authService.loginAsLeader(pin);
    if (result.success) {
      setPin('');
      setError(null);
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'PIN incorreto. Tente novamente.');
      setPin('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin.length < 4) {
      setError('O novo PIN deve conter pelo menos 4 dígitos.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setError('Os novos PINs digitados não coincidem.');
      return;
    }

    const saved = authService.setLeaderPin(newPin);
    if (saved) {
      setChangeSuccess('PIN de Líder alterado com sucesso!');
      setTimeout(() => {
        setIsChangingPin(false);
        setNewPin('');
        setConfirmNewPin('');
        setChangeSuccess(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121214] text-white border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-black p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4F00] flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Acesso Restrito ao Líder
              </h2>
              <p className="text-xs text-zinc-400">
                {isChangingPin ? 'Alteração de Código de Segurança' : 'Digite o PIN de autorização de gestão'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {changeSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{changeSuccess}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isChangingPin ? (
            <form onSubmit={handleAuthenticate} className="space-y-6">
              {/* PIN Display Circles */}
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Código de Acesso
                </span>
                <div className="flex items-center gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          filled
                            ? 'bg-[#FF4F00] scale-125 shadow-[0_0_12px_rgba(255,79,0,0.8)]'
                            : 'bg-zinc-800 border border-zinc-700'
                        }`}
                      />
                    );
                  })}
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  className="opacity-0 absolute -z-10"
                  autoFocus
                />
              </div>

              {/* Numeric Keypad for Touch / Mobile */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(String(num))}
                    className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-[#FF4F00] active:text-black border border-zinc-800 font-bold text-lg text-white transition-all shadow-sm flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-semibold text-xs transition-all flex items-center justify-center"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-[#FF4F00] active:text-black border border-zinc-800 font-bold text-lg text-white transition-all shadow-sm flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-12 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-semibold text-xs transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* Unlock button */}
              <button
                type="submit"
                disabled={pin.length < 4}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  pin.length >= 4
                    ? 'bg-[#FF4F00] hover:bg-[#ff621e] text-black shadow-orange-500/20 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Desbloquear Modo Líder</span>
              </button>

              {/* Helper text / Default PIN notice */}
              <div className="pt-2 text-center flex flex-col items-center gap-1.5 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                <span>PIN inicial de fábrica: <strong className="text-zinc-300 font-mono">1234</strong></span>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="text-[#FECC14] hover:underline flex items-center gap-1 font-semibold mt-1"
                >
                  <KeyRound className="w-3 h-3" /> Configurar / Alterar PIN do Líder
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Novo PIN de Líder (4 a 6 dígitos numéricos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ex: 5821"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#FF4F00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Confirme o Novo PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Repita o novo PIN"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#FF4F00]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(false);
                    setNewPin('');
                    setConfirmNewPin('');
                    setError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FECC14] hover:bg-amber-400 text-black font-black text-xs shadow-md"
                >
                  Salvar Novo PIN
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
