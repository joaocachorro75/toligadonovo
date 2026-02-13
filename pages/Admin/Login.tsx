import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Lock, Zap, Loader2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    try {
      if (await db.login(user, pass)) {
        navigate('/admin/dashboard');
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-cyan-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acesso Administrativo</h1>
          <p className="text-gray-500 text-sm">To-Ligado.com</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Usuário</label>
            <input 
              type="text" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Senha</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-lg text-sm text-center border border-red-900/50">
              Credenciais inválidas.
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};