import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Save, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface Instruction {
  id: number;
  category: string;
  title: string;
  keywords: string;
  content: string;
  priority: number;
  active: boolean;
}

const CATEGORIES = ['suporte', 'vendas', 'procedimentos', 'financeiro', 'comportamento'];

export const AdminInstructions: React.FC = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [editing, setEditing] = useState<Instruction | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      const res = await fetch('/api/instructions');
      const data = await res.json();
      setInstructions(data);
    } catch (e) {
      console.error('Erro ao carregar instruções:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveInstruction = async (inst: Instruction) => {
    try {
      const method = inst.id ? 'PUT' : 'POST';
      const url = inst.id ? `/api/instructions/${inst.id}` : '/api/instructions';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inst)
      });
      
      await loadInstructions();
      setEditing(null);
    } catch (e) {
      console.error('Erro ao salvar:', e);
    }
  };

  const deleteInstruction = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;
    
    try {
      await fetch(`/api/instructions/${id}`, { method: 'DELETE' });
      await loadInstructions();
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  const newInstruction = () => {
    setEditing({
      id: 0,
      category: 'suporte',
      title: '',
      keywords: '',
      content: '',
      priority: 5,
      active: true
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Instruções do Ligadinho</h1>
            <p className="text-gray-400 text-sm mt-1">
              Configure o conhecimento do atendente IA
            </p>
          </div>
          <button
            onClick={newInstruction}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Instrução
          </button>
        </div>

        {/* Lista de Instruções */}
        <div className="space-y-4">
          {instructions.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              Nenhuma instrução cadastrada. Clique em "Nova Instrução" para começar.
            </div>
          )}

          {instructions.map(inst => (
            <div key={inst.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {/* Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750"
                onClick={() => setExpandedId(expandedId === inst.id ? null : inst.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    inst.category === 'suporte' ? 'bg-blue-900 text-blue-300' :
                    inst.category === 'vendas' ? 'bg-green-900 text-green-300' :
                    inst.category === 'procedimentos' ? 'bg-purple-900 text-purple-300' :
                    inst.category === 'financeiro' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {inst.category}
                  </span>
                  <span className="text-white font-medium">{inst.title}</span>
                  {!inst.active && (
                    <span className="px-2 py-1 rounded text-xs bg-red-900 text-red-300">Inativa</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Prioridade: {inst.priority}</span>
                  {expandedId === inst.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === inst.id && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Palavras-chave:</label>
                    <p className="text-gray-300 text-sm">{inst.keywords || '-'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Conteúdo:</label>
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap bg-gray-900 rounded-lg p-3 mt-1">
                      {inst.content}
                    </pre>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditing(inst)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-sm transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteInstruction(inst.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-white text-sm transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal de Edição */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">
                {editing.id ? 'Editar Instrução' : 'Nova Instrução'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Categoria</label>
                  <select
                    value={editing.category}
                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Título</label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                    placeholder="Ex: Teste de Internet Ilimitada"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Palavras-chave</label>
                  <input
                    type="text"
                    value={editing.keywords}
                    onChange={e => setEditing({ ...editing, keywords: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                    placeholder="teste, internet, ilimitada (separadas por vírgula)"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Conteúdo (Markdown)</label>
                  <textarea
                    value={editing.content}
                    onChange={e => setEditing({ ...editing, content: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white h-48 font-mono text-sm"
                    placeholder="## Título&#10;&#10;Conteúdo da instrução..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Prioridade (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editing.priority}
                      onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 5 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={e => setEditing({ ...editing, active: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-gray-300">Ativa</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => saveInstruction(editing)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
