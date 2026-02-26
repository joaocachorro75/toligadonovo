import React from 'react';

interface Lead {
  id: string;
  name?: string;
  phone?: string;
  interest?: string;
  status?: string;
  createdAt?: string;
}

interface LeadsTableProps {
  leads: Lead[];
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads }) => {
  const getStatusColor = (status?: string): string => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    const colors: Record<string, string> = {
      new: 'bg-blue-500/20 text-blue-400',
      contacted: 'bg-yellow-500/20 text-yellow-400',
      qualified: 'bg-green-500/20 text-green-400',
      converted: 'bg-emerald-500/20 text-emerald-400',
      lost: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getInterestColor = (interest?: string): string => {
    if (!interest) return 'bg-gray-500/20 text-gray-400';
    const colors: Record<string, string> = {
      'TV via Internet': 'bg-purple-500/20 text-purple-400',
      'Landing Page': 'bg-blue-500/20 text-blue-400',
      'Zap Marketing': 'bg-green-500/20 text-green-400',
      'Loja Virtual': 'bg-orange-500/20 text-orange-400',
      'Blog IA': 'bg-cyan-500/20 text-cyan-400',
      'Delivery': 'bg-pink-500/20 text-pink-400',
      'Combo': 'bg-indigo-500/20 text-indigo-400',
      'Design': 'bg-rose-500/20 text-rose-400'
    };
    return colors[interest] || 'bg-gray-500/20 text-gray-400';
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr.replace(" ", "T")).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatPhone = (phone?: string): string => {
    if (!phone) return '-';
    return phone;
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Nenhum lead cadastrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nome</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Telefone</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Interesse</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id || Math.random()} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-4 py-3">{lead.name || 'Não informado'}</td>
              <td className="px-4 py-3">{formatPhone(lead.phone)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${getInterestColor(lead.interest)}`}>
                  {lead.interest || 'não definido'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                  {lead.status || 'novo'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;
