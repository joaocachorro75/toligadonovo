import React, { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { db } from '../services/db';

interface LeadFormProps {
  origin: string;
  className?: string;
  btnColor?: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ origin, className = '', btnColor = 'bg-cyan-500 hover:bg-cyan-600' }) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;

    setLoading(true);
    try {
      await db.addLead(name, whatsapp, origin);
      setSuccess(true);
      setName('');
      setWhatsapp('');
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`p-6 rounded-xl bg-green-900/30 border border-green-500/50 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white">Sucesso!</h3>
        <p className="text-gray-300">Entraremos em contato via WhatsApp em breve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${className}`}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder-gray-500"
          placeholder="Seu nome"
          required
        />
      </div>
      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
        <input
          type="tel"
          id="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder-gray-500"
          placeholder="(DDD) 99999-9999"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`mt-2 w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${btnColor}`}
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
        {loading ? 'Enviando...' : 'Falar com Especialista'}
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Seus dados estão seguros. Não enviamos spam.
      </p>
    </form>
  );
};