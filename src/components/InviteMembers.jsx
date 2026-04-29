import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, UserPlus, Users, Crown, Pencil, Eye, Trash2,
  Lock, Unlock, Shield
} from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

const roleIcons = {
  lead: Crown,
  contributor: Pencil,
  viewer: Eye,
};

const roleLabels = {
  lead: 'Lead',
  contributor: 'Contributor',
  viewer: 'Viewer',
};

export default function InviteMembers({ roomId, token, userRole, onClose }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contributor');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isLead = userRole === 'lead';

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMembers(data);
    } catch (e) {
      console.error('Fetch members error', e);
    }
  }, [roomId, token]);

  const fetchLockStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/lock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setIsLocked(data.locked);
    } catch (e) {
      console.error('Fetch lock error', e);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchMembers();
    fetchLockStatus();
  }, [fetchMembers, fetchLockStatus]);

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/invite-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Invited ${inviteEmail} as ${selectedRole}`);
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the room?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/lock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ locked: !isLocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsLocked(data.locked);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-hidden border-4 border-black bg-neo-white shadow-neo-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black bg-neo-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-neo-white shadow-neo-sm">
              <Users className="size-5 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Room Members</h2>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                {isLead ? 'Manage your team' : 'View members'}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-none border-4 border-black bg-neo-accent shadow-neo-sm"
          >
            <X className="size-5 stroke-[3px]" />
          </Button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-4 space-y-4">
          {/* Lock Status (Lead only) */}
          {isLead && (
            <div className="border-4 border-black bg-neo-canvas p-3 shadow-neo-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center border-4 border-black shadow-neo-sm ${isLocked ? 'bg-neo-accent' : 'bg-neo-muted'}`}>
                    {isLocked ? <Lock className="size-5 stroke-[3px]" /> : <Unlock className="size-5 stroke-[3px]" />}
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight">
                      {isLocked ? 'Room is Locked' : 'Room is Unlocked'}
                    </p>
                    <p className="text-xs font-bold opacity-70">
                      {isLocked ? 'Contributors can only comment' : 'Everyone can edit'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleLock}
                  disabled={loading}
                  className="rounded-none border-4 border-black bg-neo-accent px-4 text-xs font-black uppercase tracking-widest shadow-neo-sm"
                >
                  {isLocked ? 'Unlock' : 'Lock'}
                </Button>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold shadow-neo-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-4 border-black bg-neo-secondary px-3 py-2 text-sm font-bold shadow-neo-sm"
            >
              {success}
            </motion.div>
          )}

          {/* Invite Section (Lead only) */}
          {isLead && (
            <div className="border-4 border-black bg-neo-white p-4 shadow-neo-sm space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 stroke-[3px]" />
                <span className="font-black uppercase tracking-tight">Invite Member</span>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter collaborator email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-12 rounded-none border-4 border-black bg-white text-base font-bold placeholder:opacity-40"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex gap-2">
                {['contributor', 'viewer'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`flex-1 border-4 border-black px-3 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                      selectedRole === r 
                        ? 'bg-neo-accent shadow-neo-sm' 
                        : 'bg-neo-muted hover:bg-neo-secondary'
                    }`}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
              <Button
                onClick={inviteUser}
                disabled={loading || !inviteEmail.trim()}
                className="w-full rounded-none border-4 border-black bg-neo-accent px-3 text-xs font-black uppercase tracking-widest shadow-neo-sm"
              >
                Send Invite
              </Button>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
              <Shield className="size-4 stroke-[3px]" />
              <span>Current Members ({members.length})</span>
            </div>
            
            <div className="space-y-2">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border-4 border-black bg-neo-white p-3 shadow-neo-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center border-2 border-black ${
                        member.role === 'lead' ? 'bg-neo-accent' : 'bg-neo-muted'
                      }`}>
                        <RoleIcon className="size-4 stroke-[3px]" />
                      </div>
                      <div>
                        <p className="font-black">@{member.username}</p>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                          {roleLabels[member.role]}
                        </p>
                      </div>
                    </div>
                    
                    {/* Role Actions (Lead only, can't modify other leads) */}
                    {isLead && member.role !== 'lead' && (
                      <div className="flex items-center gap-1">
                        <select
                          value={member.role}
                          onChange={(e) => updateRole(member.id, e.target.value)}
                          disabled={loading}
                          className="h-8 rounded-none border-2 border-black bg-neo-canvas px-2 text-xs font-bold"
                        >
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          size="icon"
                          onClick={() => removeMember(member.id)}
                          disabled={loading}
                          className="h-8 w-8 rounded-none border-2 border-black bg-neo-accent shadow-neo-sm"
                          title="Remove member"
                        >
                          <Trash2 className="size-4 stroke-[3px]" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
