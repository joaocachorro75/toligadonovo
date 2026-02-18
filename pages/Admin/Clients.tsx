import React, { useEffect, useState } from 'react';
import { Client } from '../../types';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  Plus, Trash2, Edit, Save, X, QrCode, RefreshCw, 
  Smartphone, DollarSign, Building, Mail, Phone, 
  MessageSquare, CheckCircle, XCircle, AlertTriangle,
  Copy, ExternalLink, Wifi, WifiOff
} from 'lucide-react';

const EVOLUTION_API_URL = 'https://automacao-evolution-api.nfeujb.easypanel.host';
const EVOLUTION_API_KEY = '5BE128D18942-4B09-8AF8-454ADEEB06B1';

export const AdminClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [qrCodeLoading, setQRCodeLoading] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [qrCodeStatus, setQRCodeStatus] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : (data.clients || []));
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    setIsCreating(true);
    setEditingClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      plan: 'basic',
      monthly_price: 0,
      agent_prompt: '',
      agent_active: false
    });
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      const url = isCreating ? '/api/clients' : `/api/clients/${editingClient.id}`;
      const method = isCreating ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient)
      });

      const data = await res.json();
      
      if (data.success) {
        setEditingClient(null);
        setIsCreating(false);
        loadClients();
      } else {
        alert('Erro ao salvar cliente: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Isso também removerá a instância do WhatsApp.')) return;
    
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        loadClients();
      } else {
        alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleShowQRCode = async (client: Client) => {
    setSelectedClient(client);
    setShowQRModal(true);
    setQRCodeData(null);
    setQRCodeStatus('loading');
    setQRCodeLoading(true);

    try {
      // Primeiro, busca o QR code da API
      const res = await fetch(`/api/clients/${client.id}/qrcode`);
      const data = await res.json();
      
      if (data.success && data.qrcode) {
        setQRCodeData(data.qrcode);
        setQRCodeStatus('success');
      } else if (data.status === 'already_connected') {
        setQRCodeStatus('connected');
      } else {
        setQRCodeStatus('error');
        setQRCodeData(data.error || 'Erro ao obter QR Code');
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      setQRCodeStatus('error');
      setQRCodeData('Erro de conexão com a API');
    } finally {
      setQRCodeLoading(false);
    }
  };

  const handleRefreshQRCode = async () => {
    if (!selectedClient) return;
    await handleShowQRCode(selectedClient);
  };

  const handleCheckStatus = async (client: Client) => {
    try {
      const res = await fetch(`/api/clients/${client.id}/status`);
      const data = await res.json();
      
      if (data.success) {
        alert(`Status da instância: ${data.status || 'Desconhecido'}`);
        loadClients();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'connected':
        return <span className="flex items-center gap-1 text-green-400 text-xs"><Wifi className="w-3 h-3" /> Conectado</span>;
      case 'disconnected':
        return <span className="flex items-center gap-1 text-red-400 text-xs"><WifiOff className="w-3 h-3" /> Desconectado</span>;
      default:
        return <span className="flex items-center gap-1 text-yellow-400 text-xs"><AlertTriangle className="w-3 h-3" /> Pendente</span>;
    }
  };

  const renderQRModal = () => {
    if (!showQRModal || !selectedClient) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-400" />
              QR Code - {selectedClient.name}
            </h3>
            <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 text-center">
            {qrCodeLoading ? (
              <div className="py-8">
                <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Obtendo QR Code...</p>
              </div>
            ) : qrCodeStatus === 'connected' ? (
              <div className="py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 font-bold">WhatsApp já conectado!</p>
                <p className="text-gray-400 text-sm mt-2">Instância: {selectedClient.instance_name}</p>
              </div>
            ) : qrCodeStatus === 'success' && qrCodeData ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCodeData} alt="QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <p className="text-gray-400 text-sm">
                  Escaneie o QR Code com o WhatsApp do cliente
                </p>
                <button
                  onClick={handleRefreshQRCode}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Atualizar QR
                </button>
              </div>
            ) : (
              <div className="py-8">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{qrCodeData || 'Erro ao obter QR Code'}</p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p><strong>Instância:</strong> {selectedClient.instance_name}</p>
            <p><strong>Empresa:</strong> {selectedClient.company || '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderClientForm = () => (
    <form onSubmit={handleSaveClient} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h3 className="text-xl font-bold text-white">
          {isCreating ? 'Novo Cliente' : 'Editar Cliente'}
        </h3>
        <button 
          type="button" 
          onClick={() => { setEditingClient(null); setIsCreating(false); }}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <Building className="w-4 h-4 inline mr-1" /> Nome / Empresa
          </label>
          <input
            type="text"
            value={editingClient?.name || ''}
            onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <Mail className="w-4 h-4 inline mr-1" /> Email
          </label>
          <input
            type="email"
            value={editingClient?.email || ''}
            onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <Phone className="w-4 h-4 inline mr-1" /> Telefone
          </label>
          <input
            type="text"
            value={editingClient?.phone || ''}
            onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
            placeholder="5511999999999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Plano</label>
          <select
            value={editingClient?.plan || 'basic'}
            onChange={e => setEditingClient({ ...editingClient, plan: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="basic">Básico</option>
            <option value="pro">Profissional</option>
            <option value="enterprise">Empresarial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" /> Valor Mensal (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={editingClient?.monthly_price || 0}
            onChange={e => setEditingClient({ ...editingClient, monthly_price: parseFloat(e.target.value) })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <Smartphone className="w-4 h-4 inline mr-1" /> Nome da Instância
          </label>
          <input
            type="text"
            value={editingClient?.instance_name || ''}
            onChange={e => setEditingClient({ ...editingClient, instance_name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-mono"
            placeholder="cliente123"
            disabled={!isCreating}
          />
          {isCreating && (
            <p className="text-xs text-gray-500 mt-1">Nome único para a instância WhatsApp (apenas letras e números)</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" /> Prompt do Agente IA
          </label>
          <textarea
            rows={3}
            value={editingClient?.agent_prompt || ''}
            onChange={e => setEditingClient({ ...editingClient, agent_prompt: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 text-sm"
            placeholder="Instruções para o bot de atendimento..."
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="agent_active"
            checked={editingClient?.agent_active || false}
            onChange={e => setEditingClient({ ...editingClient, agent_active: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-900 border-gray-700"
          />
          <label htmlFor="agent_active" className="text-sm text-gray-300">
            Agente de IA ativo
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={() => { setEditingClient(null); setIsCreating(false); }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Salvar Cliente
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestão de Clientes</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie clientes e instâncias WhatsApp</p>
          </div>
          {!editingClient && (
            <button
              onClick={handleCreateClient}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Novo Cliente
            </button>
          )}
        </div>

        {editingClient ? (
          renderClientForm()
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-200">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Instância</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Agente IA</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{client.name}</div>
                      {client.company && (
                        <div className="text-xs text-gray-500">{client.company}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{client.email}</div>
                      <div className="text-xs text-gray-500 font-mono">{client.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-cyan-400 text-xs">{client.instance_name}</div>
                      <div className="text-xs text-gray-500">{formatDate(client.created_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        client.plan === 'enterprise' ? 'bg-purple-900/50 text-purple-400' :
                        client.plan === 'pro' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {client.plan || 'basic'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-400">
                      {formatCurrency(client.monthly_price)}
                    </td>
                    <td className="px-4 py-3">
                      {client.agent_active ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(client.instance_status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleShowQRCode(client)}
                          className="p-2 text-green-400 hover:bg-green-900/30 rounded"
                          title="Ver QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCheckStatus(client)}
                          className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded"
                          title="Verificar Status"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingClient(client); setIsCreating(false); }}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderQRModal()}
    </AdminLayout>
  );
};

export default AdminClients;
