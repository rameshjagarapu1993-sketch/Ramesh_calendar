import React, { useState } from 'react';
import { Lock, X, KeyRound, ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getStoredHostPin } from '../utils/storage';

interface HostLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HostLoginModal: React.FC<HostLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentPin = getStoredHostPin();
    if (!pinInput.trim()) {
      setError('Please enter your Host PIN');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (pinInput.trim() === currentPin) {
        onSuccess();
        onClose();
        setPinInput('');
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Host Authentication</h3>
              <p className="text-xs text-slate-400">Ramesh J Consultant Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-300 leading-relaxed">
            Please enter your Host Access PIN to open the appointment records, client intake responses, and email dispatcher controls.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Host Security PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                placeholder="Enter 4-digit PIN..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
            <span className="text-indigo-300 font-semibold">Note:</span> Default Host PIN is <strong className="text-white font-mono">1993</strong>. You can change this anytime inside the Admin Dashboard.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? 'Authenticating...' : 'Unlock Host Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
