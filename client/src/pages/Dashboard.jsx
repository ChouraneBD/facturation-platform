import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import {
  FileText,
  Wallet,
  Clock,
  XCircle,
  TrendingUp,
  Banknote
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Panel, StatusPill, EmptyState, LoadingPanel, titleCase } from '../components/ui';

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export function Dashboard() {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardData, facturesData] = await Promise.all([
          api('/api/dashboard/metrics', { token: session.token }),
          api('/api/factures', { token: session.token })
        ]);
        setDashboard(dashboardData);
        setFactures(facturesData);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (session?.token) {
      loadData();
    }
  }, [session]);

  const dashboardAnalytics = useMemo(() => {
    const monthlyMap = new Map();
    factures.forEach((facture) => {
      const dateValue = facture.date_creation || facture.created_at;
      if (!dateValue) return;

      const date = new Date(dateValue);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(key) || { month: key, montant: 0, count: 0 };
      current.montant += Number(facture.total_ttc || 0);
      current.count += 1;
      monthlyMap.set(key, current);
    });

    return { monthlyRevenue: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)) };
  }, [factures]);

  if (loading) return <LoadingPanel rows={6} />;

  const totals = dashboard?.totals || {};
  const dashboardCards = dashboard
    ? [
        { title: 'Total factures', value: totals.factures, icon: FileText, tone: 'indigo' },
        { title: 'Total encaissé', value: formatMoney(totals.total_encaisse), icon: Wallet, tone: 'green' },
        { title: 'En attente', value: totals.factures_en_attente, icon: Clock, tone: 'amber' },
        { title: 'Rejetées', value: totals.factures_rejetees, icon: XCircle, tone: 'red' },
        { title: 'Montant moyen', value: formatMoney(totals.montant_moyen), icon: TrendingUp, tone: 'cyan' },
        { title: 'CA TTC', value: formatMoney(totals.total_ttc), icon: Banknote, tone: 'purple' }
      ]
    : [];

  const statusData = dashboard
    ? Object.entries(dashboard.status_breakdown).map(([name, count]) => ({
        name: titleCase(name),
        count
      }))
    : [];

  const encaisseData = dashboardAnalytics.monthlyRevenue.map((row) => ({
    month: row.month,
    montant: factures
      .filter((f) => {
        const d = f.date_creation || f.created_at;
        if (!d) return false;
        const date = new Date(d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return key === row.month && f.statut === 'payee';
      })
      .reduce((sum, f) => sum + Number(f.total_ttc || 0), 0)
  }));

  return (
    <>
      <section className="stats-grid stats-grid-6">
        {dashboardCards.map((card) => (
          <Card key={card.title} {...card} note="Temps réel" />
        ))}
      </section>

      <div className="charts-grid">
        <Panel title="Chiffre d'affaires mensuel" subtitle="Évolution du CA TTC.">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardAnalytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                <Line type="monotone" dataKey="montant" stroke="#4f46e5" strokeWidth={2} name="Revenus TTC" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {session?.user?.role === 'admin' ? (
          <Panel title="Répartition des statuts" subtitle="Nombre de factures par statut.">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Factures" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ) : null}
      </div>

      {session?.user?.role === 'admin' ? (
        <Panel title="Montant encaissé par mois" subtitle="Factures payées uniquement." className="chart-panel-full">
          <div className="chart-box chart-box-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={encaisseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="montant" fill="#10b981" radius={[6, 6, 0, 0]} name="Encaissé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}

      <Panel title="Factures récentes" subtitle="Dernières factures enregistrées.">
        {dashboard?.recent_factures?.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Total TTC</th>
                  <th>Statut</th>
                  <th>Création</th>
                  <th>Lignes</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_factures.map((facture) => (
                  <tr key={facture.id}>
                    <td><strong>{facture.numero}</strong></td>
                    <td>{facture.Client?.nom || '—'}</td>
                    <td>{formatMoney(facture.total_ttc)}</td>
                    <td><StatusPill value={facture.statut} /></td>
                    <td>{formatDate(facture.date_creation || facture.created_at)}</td>
                    <td>{facture.lignes_facture?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Aucune facture" message="Les nouvelles factures apparaîtront ici après création." />
        )}
      </Panel>
    </>
  );
}
