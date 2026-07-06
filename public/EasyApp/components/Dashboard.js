import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  LogOut,
  RefreshCcw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getApiBaseUrl, getUser, logout } from '../services/authService';

const COLORS = {
  background: '#1c2428',
  surface: '#f4f8fc',
  surfaceMuted: '#e9f1f6',
  card: '#ffffff',
  border: '#caddea',
  text: '#101b23',
  muted: '#43596b',
  green: '#519b6d',
  greenDark: '#3f7f56',
  red: '#E74C3C',
  orange: '#F39C12',
  yellow: '#d99a18',
};

function numberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatPercent(value) {
  return `${Math.round(numberValue(value))}%`;
}

function formatDateTime(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSeverityStyle(severity) {
  const stylesBySeverity = {
    critica: { color: COLORS.red, backgroundColor: '#fdecea', label: 'Crítica' },
    alta: { color: COLORS.orange, backgroundColor: '#fff2df', label: 'Alta' },
    media: { color: COLORS.yellow, backgroundColor: '#fff8df', label: 'Média' },
    baixa: { color: COLORS.green, backgroundColor: '#e5f0e8', label: 'Baixa' },
  };

  return stylesBySeverity[severity] ?? stylesBySeverity.baixa;
}

function KpiCard({ title, value, helper, icon: Icon, tone = COLORS.green, width }) {
  return (
    <View style={[styles.kpiCard, { width }]}>
      <View style={styles.kpiHeader}>
        <View style={[styles.iconBadge, { backgroundColor: `${tone}20` }]}>
          <Icon color={tone} size={22} strokeWidth={2.4} />
        </View>
      </View>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiHelper}>{helper}</Text>
    </View>
  );
}

function AnomaliesList({ anomalies, onResolve }) {
  if (!anomalies.length) {
    return (
      <View style={styles.emptyState}>
        <CheckCircle2 color={COLORS.green} size={24} />
        <View style={styles.emptyStateTextGroup}>
          <Text style={styles.emptyTitle}>Nenhuma anomalia registrada</Text>
          <Text style={styles.emptyText}>Quando a API detectar eventos fora do padrão, eles aparecerão aqui.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableHeaderText, styles.colType]}>Tipo</Text>
          <Text style={[styles.tableHeaderText, styles.colSpot]}>Vaga</Text>
          <Text style={[styles.tableHeaderText, styles.colSeverity]}>Severidade</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Data/hora</Text>
          <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
        </View>
        {anomalies.map(item => {
          const severity = getSeverityStyle(item.severidade);
          const isResolved = Boolean(item.resolvido);
          const id = item.id_anomalia ?? item.id;

          return (
            <View key={`${id}-${item.timestamp}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colType]} numberOfLines={2}>
                {String(item.tipo ?? 'anomalia').replaceAll('_', ' ')}
              </Text>
              <Text style={[styles.tableCell, styles.colSpot]}>{item.id_vaga ? `#${item.id_vaga}` : 'Geral'}</Text>
              <View style={styles.colSeverity}>
                <View style={[styles.severityPill, { backgroundColor: severity.backgroundColor }]}>
                  <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
                </View>
              </View>
              <Text style={[styles.tableCell, styles.colDate]}>{formatDateTime(item.timestamp)}</Text>
              <View style={styles.colStatus}>
                {isResolved ? (
                  <View style={[styles.statusPill, styles.statusResolved]}>
                    <Text style={styles.statusResolvedText}>Resolvido</Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.resolveButton, pressed ? styles.buttonPressed : null]}
                    onPress={() => onResolve(id)}
                    disabled={!id}>
                    <Text style={styles.resolveButtonText}>Resolver</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const isDesktop = width >= 1040;
  const isTablet = width >= 760;
  const contentWidth = Math.min(width - (isDesktop ? 64 : 32), 1180);
  const kpiWidth = isDesktop ? '31.8%' : isTablet ? '48.5%' : '100%';

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${getApiBaseUrl()}/api/analytics/dashboard?periodo=24h`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.erro || payload.error || 'Nao foi possivel carregar o dashboard.');
      }

      setData(payload);
      setLastUpdate(new Date());
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const user = await getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setCheckedAuth(true);
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!checkedAuth) return undefined;

    loadDashboard();
    const interval = setInterval(() => loadDashboard({ silent: true }), 30000);

    return () => clearInterval(interval);
  }, [checkedAuth, loadDashboard]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleResolve = async id => {
    if (!id) return;

    try {
      setRefreshing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/analytics/anomalias/${id}/resolver`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.erro || payload.error || 'Nao foi possivel resolver a anomalia.');
      }

      await loadDashboard({ silent: true });
    } catch (resolveError) {
      setError(resolveError.message);
      setRefreshing(false);
    }
  };

  const kpis = data?.kpis ?? {};
  const occupancy = kpis.ocupacao ?? {};
  const turnover = kpis.rotatividade ?? {};
  const anomalies = data?.anomalias ?? [];
  const pendingAnomalies = anomalies.filter(item => !item.resolvido).length;

  if (!checkedAuth || (loading && !data)) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#ffffff" size="large" />
          <Text style={styles.centerText}>Carregando painel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { width: contentWidth }]}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerEyebrow}>Easy Park Analytics</Text>
              <Text style={styles.headerTitle}>Dashboard operacional</Text>
              <Text style={styles.headerSubtitle}>Indicadores em tempo real consumidos da API de analytics.</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.refreshButton, pressed ? styles.buttonPressed : null]}
                onPress={() => loadDashboard({ silent: true })}
                disabled={refreshing}>
                {refreshing ? <ActivityIndicator color={COLORS.green} /> : <RefreshCcw color={COLORS.green} size={18} />}
                <Text style={styles.refreshText}>Atualizar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sair"
                style={({ pressed }) => [styles.logoutButton, pressed ? styles.buttonPressed : null]}
                onPress={handleLogout}>
                <LogOut color="#ffffff" size={20} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AlertTriangle color={COLORS.red} size={20} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.kpiGrid}>
            <KpiCard
              width={kpiWidth}
              title="Taxa de ocupação"
              value={formatPercent(occupancy.taxa_percentual)}
              helper={`${numberValue(occupancy.vagas_ocupadas)} de ${numberValue(occupancy.total_vagas)} vagas`}
              icon={Gauge}
              tone={COLORS.green}
            />
            <KpiCard
              width={kpiWidth}
              title="Vagas livres"
              value={numberValue(occupancy.vagas_livres)}
              helper="Disponíveis agora"
              icon={CheckCircle2}
              tone={COLORS.green}
            />
            <KpiCard
              width={kpiWidth}
              title="Vagas ocupadas"
              value={numberValue(occupancy.vagas_ocupadas)}
              helper="Em uso no momento"
              icon={Car}
              tone={COLORS.red}
            />
            <KpiCard
              width={kpiWidth}
              title="Vagas reservadas"
              value={numberValue(occupancy.vagas_reservadas)}
              helper="Separadas para reserva"
              icon={LockKeyhole}
              tone={COLORS.orange}
            />
            <KpiCard
              width={kpiWidth}
              title="Rotatividade"
              value={numberValue(turnover.total_mudancas)}
              helper={`${numberValue(turnover.media_por_hora)} mudanças/hora`}
              icon={RefreshCcw}
              tone={COLORS.orange}
            />
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Resumo</Text>
                <Text style={styles.panelSubtitle}>Saúde da operação</Text>
              </View>
            </View>
            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Anomalias pendentes</Text>
                <Text style={[styles.summaryValue, pendingAnomalies ? styles.summaryDanger : null]}>{pendingAnomalies}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Anomalias recentes</Text>
                <Text style={styles.summaryValue}>{anomalies.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Atualizado</Text>
                <Text style={styles.summaryValue}>
                  {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Lista de anomalias</Text>
                <Text style={styles.panelSubtitle}>Tipo, vaga, severidade, data/hora e status</Text>
              </View>
            </View>
            <AnomaliesList anomalies={anomalies} onResolve={handleResolve} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  container: {
    maxWidth: 1180,
    gap: 18,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 280,
  },
  headerEyebrow: {
    color: '#caddea',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 39,
    marginTop: 4,
  },
  headerSubtitle: {
    color: '#caddea',
    fontSize: 14,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
  },
  refreshText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b8b1',
    backgroundColor: '#fdecea',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    color: '#9f2d22',
    fontSize: 13,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  kpiCard: {
    minHeight: 164,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  kpiValue: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 4,
  },
  kpiHelper: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 7,
  },
  twoColumn: {
    gap: 18,
  },
  panel: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  chartPanel: {
    overflow: 'hidden',
  },
  mainPanel: {
    flex: 1.85,
  },
  sidePanel: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  panelTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  panelSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    padding: 3,
  },
  segmentButton: {
    minWidth: 54,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.green,
  },
  segmentText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  emptyChart: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    padding: 22,
  },
  emptyState: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  emptyStateTextGroup: {
    flex: 1,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  summaryList: {
    gap: 10,
  },
  summaryItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
  },
  summaryLabel: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  summaryDanger: {
    color: COLORS.red,
  },
  table: {
    minWidth: 620,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  tableRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  tableHeader: {
    minHeight: 44,
    borderTopWidth: 0,
    backgroundColor: COLORS.surfaceMuted,
  },
  tableHeaderText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableCell: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  colType: {
    flex: 1.25,
  },
  colSpot: {
    width: 56,
  },
  colSeverity: {
    width: 98,
  },
  colDate: {
    width: 104,
  },
  colStatus: {
    width: 104,
    alignItems: 'flex-start',
  },
  severityPill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusResolved: {
    backgroundColor: '#e5f0e8',
  },
  statusResolvedText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '800',
  },
  resolveButton: {
    borderRadius: 8,
    backgroundColor: COLORS.green,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resolveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  peakList: {
    gap: 14,
  },
  peakItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  peakRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5f0e8',
  },
  peakRankText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '800',
  },
  peakInfo: {
    flex: 1,
  },
  peakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  peakTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  peakConfidence: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  peakBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    marginTop: 10,
  },
  peakBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  peakMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 7,
  },
});
