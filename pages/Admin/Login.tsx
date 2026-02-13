
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/db';
import { Lock, Zap, Loader2, Eye, EyeOff, AlertTriangle, ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    db.logout();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
        setErrorMsg('Preencha todos os campos.');
        return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      const success = await db.login(user.trim(), pass.trim());
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setErrorMsg('Usuário ou senha incorretos.');
      }
    } catch (e: any) {
      console.error("Erro no login:", e);
      setErrorMsg(e.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
        <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium">
             <ArrowLeft className="w-3 h-3" /> Voltar para o Site
        </Link>
        
        <div className="flex flex-col items-center mb-8 mt-4">
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
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="admin"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Senha</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors pr-12"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-3 border border-red-900/50 animate-pulse">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
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
