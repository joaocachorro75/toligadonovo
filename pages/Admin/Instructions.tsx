import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Instruction {
  id?: number;
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

  const saveInstruction = async () => {
    if (!editing) return;
    
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/instructions/${editing.id}` : '/api/instructions';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing)
      });
      
      setEditing(null);
      loadInstructions();
    } catch (e) {
      console.error('Erro ao salvar:', e);
    }
  };

  const deleteInstruction = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;
    
    try {
      await fetch(`/api/instructions/${id}`, { method: 'DELETE' });
      loadInstructions();
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  const newInstruction = () => {
    setEditing({
      category: 'suporte',
      title: '',
      keywords: '',
      content: '',
      priority: 5,
      active: true
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      suporte: 'bg-blue-500/20 text-blue-400',
      vendas: 'bg-green-500/20 text-green-400',
      procedimentos: 'bg-purple-500/20 text-purple-400',
      financeiro: 'bg-yellow-500/20 text-yellow-400',
      comportamento: 'bg-pink-500/20 text-pink-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
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
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Instrução
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => {
          const count = instructions.filter(i => i.category === cat).length;
          return (
            <div key={cat} className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">{cat}</div>
              <div className="text-xl font-bold text-white">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Instructions List */}
      <div className="space-y-3">
        {instructions.map(inst => (
          <div key={inst.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setExpandedId(expandedId === inst.id ? null : inst.id!)}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(inst.category)}`}>
                  {inst.category}
                </span>
                <span className="font-medium text-white">{inst.title}</span>
                {!inst.active && (
                  <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Inativa</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Prioridade: {inst.priority}</span>
                {expandedId === inst.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            
            {expandedId === inst.id && (
              <div className="border-t border-gray-700 p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Palavras-chave:</div>
                  <div className="text-sm text-gray-300">{inst.keywords || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Conteúdo:</div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-900 rounded p-3 overflow-x-auto">
                    {inst.content}
                  </pre>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(inst); }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteInstruction(inst.id!); }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {instructions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Nenhuma instrução cadastrada. Clique em "Nova Instrução" para começar.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editing.id ? 'Editar Instrução' : 'Nova Instrução'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoria</label>
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
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                  placeholder="Ex: Como fazer teste grátis"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Palavras-chave</label>
                <input
                  type="text"
                  value={editing.keywords}
                  onChange={e => setEditing({ ...editing, keywords: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                  placeholder="teste, gratis, experimentar, provar"
                />
                <p className="text-xs text-gray-500 mt-1">Separadas por vírgula</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Conteúdo (Markdown)</label>
                <textarea
                  value={editing.content}
                  onChange={e => setEditing({ ...editing, content: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white min-h-[200px]"
                  placeholder="## Título&#10;&#10;Conteúdo da instrução..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
                  <input
                    type="number"
                    value={editing.priority}
                    onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                    min="0"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">0-10 (maior = mais importante)</p>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editing.active}
                    onChange={e => setEditing({ ...editing, active: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="active" className="text-sm text-gray-300">Instrução ativa</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveInstruction}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
