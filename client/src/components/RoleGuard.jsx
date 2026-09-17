import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { ShieldAlert } from 'lucide-react';

export default function RoleGuard({ allowedRoles = [], children, fallback }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback) return fallback;

    return (
      <div className="p-8 text-center bg-[#0f1422] border border-rose-900/50 rounded-2xl max-w-md mx-auto my-12">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold font-mono text-slate-100">Access Restricted</h4>
        <p className="mt-1 text-xs text-slate-400">
          This forensic operation requires authorization role: <strong>{allowedRoles.join(', ')}</strong>.
          Your current role is <span className="text-amber-400 font-mono font-bold">[{user?.role || 'viewer'}]</span>.
        </p>
      </div>
    );
  }

  return children;
}
