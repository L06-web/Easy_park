'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/**
 * PROTÓTIPO - Dashboard Analytics
 * 
 * Componentes principais:
 * - KPICards: Indicadores principais
 * - OccupancyChart: Gráfico de ocupação
 * - AnomaliesAlert: Lista de anomalias
 * - TrendIndicator: Indicador de tendência
 * - HeatMap: Mapa de calor (simplificado)
 */

// Cores para o dashboard
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  light: '#F3F4F6'
};

/**
 * Card de KPI - Indicador Principal
 */
function KPICard({ titulo, valor, unidade, tendencia, comparacao }) {
  const ehSubindo = tendencia === 'subindo';

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{titulo}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {valor}
              <span className="text-lg text-gray-500 font-normal ml-1">{unidade}</span>
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">{comparacao}</p>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold ${ehSubindo ? 'text-red-500' : 'text-green-500'}`}>
            {ehSubindo ? '↑' : '↓'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Indicador de Tendência
 */
function TrendIndicator({ direcao, desvio }) {
  const cores = {
    subindo: 'text-red-500 bg-red-50',
    descendo: 'text-green-500 bg-green-50',
    estavel: 'text-blue-500 bg-blue-50'
  };

  const labels = {
    subindo: '📈 Ocupação Subindo',
    descendo: '📉 Ocupação Diminuindo',
    estavel: '→ Ocupação Estável'
  };

  return (
    <div className={`rounded-lg p-4 ${cores[direcao]}`}>
      <p className="font-semibold">{labels[direcao]}</p>
      <p className="text-sm mt-1">
        Variabilidade: {desvio < 5 ? 'Baixa' : desvio < 15 ? 'Média' : 'Alta'}
      </p>
    </div>
  );
}

/**
 * Gráfico de Ocupação por Hora
 */
function OccupancyChart({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Carregando dados...</p>
      </div>
    );
  }

  // Transformar dados para o gráfico
  const dadosGrafico = dados.map((d) => ({
    hora: d.hora || new Date(d.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    ocupacao: d.taxa_ocupacao || 0,
    vagas_livres: d.vagas_livres || 0
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ocupação por Hora</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={dadosGrafico}>
          <defs>
            <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hora" />
          <YAxis />
          <Tooltip formatter={(value) => `${value}%`} />
          <Area
            type="monotone"
            dataKey="ocupacao"
            stroke={COLORS.primary}
            fillOpacity={1}
            fill="url(#colorOcupacao)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Lista de Anomalias
 */
function AnomaliesAlert({ anomalias }) {
  if (!anomalias || anomalias.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <p className="text-green-700 font-semibold">✓ Nenhuma anomalia detectada</p>
      </div>
    );
  }

  const coresSeveridade = {
    critica: 'bg-red-50 border-red-200 text-red-700',
    alta: 'bg-orange-50 border-orange-200 text-orange-700',
    media: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    baixa: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const iconsSeveridade = {
    critica: '🔴',
    alta: '🟠',
    media: '🟡',
    baixa: '🔵'
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-red-700">Anomalias Detectadas</h3>
      {anomalias.slice(0, 5).map((anomalia, idx) => (
        <div
          key={idx}
          className={`border rounded-lg p-3 ${coresSeveridade[anomalia.severidade] || coresSeveridade.baixa}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{iconsSeveridade[anomalia.severidade]}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{anomalia.tipo}</p>
              <p className="text-xs mt-1">{anomalia.descricao}</p>
              {anomalia.id_vaga && (
                <p className="text-xs mt-1 opacity-75">Vaga #{anomalia.id_vaga}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Componente Principal - Dashboard
 */
export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  useEffect(() => {
    // Carregar dados do dashboard
    const carregarDados = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/dashboard');

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const dados = await response.json();
        setDados(dados);
        setUltimaAtualizacao(new Date());
        setErro(null);
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        setErro(erro.message);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();

    // Atualizar a cada 30 segundos
    const intervalo = setInterval(carregarDados, 30000);

    return () => clearInterval(intervalo);
  }, []);

  if (loading && !dados) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Erro ao carregar dados</p>
          <p className="text-sm mt-2">{erro}</p>
        </div>
      </div>
    );
  }

  const kpis = dados?.kpis || {};
  const anomalias = dados?.anomalias || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">📊 Easy Park Dashboard</h1>
            <p className="text-sm text-gray-500">
              Atualizado em: {ultimaAtualizacao?.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 1. Status Geral */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Status em Tempo Real</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              titulo="Taxa de Ocupação"
              valor={Math.round(kpis.ocupacao?.taxa_percentual || 0)}
              unidade="%"
              tendencia={kpis.tendencia?.direcao}
              comparacao={`${kpis.ocupacao?.vagas_ocupadas || 0} de ${kpis.ocupacao?.total_vagas || 0} vagas`}
            />
            <KPICard
              titulo="Vagas Livres"
              valor={kpis.ocupacao?.vagas_livres || 0}
              unidade="vagas"
              tendencia="descendo"
              comparacao="Disponível agora"
            />
            <KPICard
              titulo="Tempo Médio"
              valor={Math.round(kpis.permanencia?.tempo_medio_minutos || 0)}
              unidade="min"
              tendencia="estavel"
              comparacao="De permanência"
            />
            <KPICard
              titulo="Pico Máximo"
              valor={Math.round(kpis.pico?.ocupacao_maxima_percentual || 0)}
              unidade="%"
              tendencia="subindo"
              comparacao={`${kpis.pico?.vagas_simultaneas_max || 0} vagas`}
            />
          </div>
        </div>

        {/* 2. Tendência e Anomalias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Atual</h3>
            <TrendIndicator
              direcao={kpis.tendencia?.direcao}
              desvio={kpis.tendencia?.desvio_padrao}
            />

            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-sm mb-3">Saúde do Sistema</h4>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span>Rotatividade:</span>
                  <strong>{kpis.rotatividade?.total_mudancas || 0}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Anomalias:</span>
                  <strong className="text-red-600">{anomalias.length}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Status:</span>
                  <strong className={anomalias.length === 0 ? 'text-green-600' : 'text-red-600'}>
                    {anomalias.length === 0 ? '✓ Ótimo' : '⚠ Atenção'}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomalias Detectadas</h3>
            <AnomaliesAlert anomalias={anomalias} />
          </div>
        </div>

        {/* 3. Gráfico de Ocupação */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico</h2>
          <OccupancyChart dados={dados?.indicadores || []} />
        </div>

        {/* 4. Horários de Pico */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Horários de Pico</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Horário</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Dia</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Ocupação Média</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Confiança</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(dados?.horarios_pico || []).map((h, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {String(h.hora).padStart(2, '0')}:00
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][h.dia]}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(h.ocupacao_media / 120) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{Math.round(h.ocupacao_media)} min</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {h.confianca}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
