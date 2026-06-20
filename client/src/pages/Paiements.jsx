import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { facturesService, loadAppSettings } from '../services/jsonService';
import { formatMoney } from '../utils/formatMoney';
import { exportFacturesToExcel } from '../utils/excelExport';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, EmptyState, LoadingPanel, PageHeader, Panel, StatusPill } from '../components/ui';
import { Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export function Paiements() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [appSettings, setAppSettings] = useState({ devise: 'MAD' });

  const displayMoney = (value) => formatMoney(value, appSettings.devise);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, settings] = await Promise.all([
          facturesService.list(session.token),
          loadAppSettings(session.token)
        ]);
        setFactures(data);
        setAppSettings(settings);
      } catch (error) {
        notify('error', error.message);
      } finally {
        setLoading(false);
      }
    };
    if (session?.token) load();
  }, [session]);

  const paymentFactures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return factures.filter((facture) => {
      if (filter === 'pending' && facture.statut !== 'validee') return false;
      if (filter === 'paid' && facture.statut !== 'payee') return false;
      if (filter === 'unpaid' && !['validee', 'payee', 'en_attente'].includes(facture.statut)) return false;
      if (!query) return true;
      const haystack = [facture.numero, facture.Client?.nom, facture.type_virement].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [factures, filter, search]);

  const stats = useMemo(() => {
    const paid = factures.filter((f) => f.statut === 'payee');
    const pending = factures.filter((f) => f.statut === 'validee');
    const overdue = factures.filter((f) => f.statut === 'en_attente');
    return {
      totalEncaisse: paid.reduce((sum, f) => sum + Number(f.total_ttc || 0), 0),
      pendingAmount: pending.reduce((sum, f) => sum + Number(f.total_ttc || 0), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length
    };
  }, [factures]);

  if (loading) return <LoadingPanel rows={6} />;

  return (
    <>
      <PageHeader
        title="Suivi des paiements"
        subtitle="Encaissements, factures validées en attente de règlement et historique des virements."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card title="Total encaissé" value={displayMoney(stats.totalEncaisse)} icon={Wallet} tone="green" note={`${stats.paidCount} facture(s) payée(s)`} />
        <Card title="À encaisser" value={displayMoney(stats.pendingAmount)} icon={Clock} tone="amber" note={`${stats.pendingCount} validée(s)`} />
        <Card title="Payées" value={stats.paidCount} icon={CheckCircle2} tone="cyan" note="Règlements confirmés" />
        <Card title="En attente validation" value={stats.overdueCount} icon={AlertCircle} tone="indigo" note="Workflow en cours" />
      </Box>

      <Panel
        title="Registre des paiements"
        subtitle="Filtrez par statut et exportez le suivi comptable."
        actions={
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => {
              exportFacturesToExcel(paymentFactures, { devise: appSettings.devise, year: null });
              notify('success', `${paymentFactures.length} ligne(s) exportée(s).`);
            }}
          >
            Export Excel
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
          <Tabs value={filter} onChange={(_, value) => setFilter(value)} variant="scrollable" scrollButtons="auto">
            <Tab value="all" label="Toutes" sx={{ textTransform: 'none', minHeight: 40 }} />
            <Tab value="pending" label="À encaisser" sx={{ textTransform: 'none', minHeight: 40 }} />
            <Tab value="paid" label="Payées" sx={{ textTransform: 'none', minHeight: 40 }} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Rechercher numéro, client, virement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260, ml: { sm: 'auto' } }}
          />
        </Stack>

        {paymentFactures.length === 0 ? (
          <EmptyState title="Aucun paiement" message="Les factures validées ou payées apparaîtront ici." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Facture</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Montant TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date encaissement</TableCell>
                  <TableCell>Mode de paiement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentFactures.map((facture) => (
                  <TableRow key={facture.id} hover>
                    <TableCell>
                      <strong>{facture.numero}</strong>
                      <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {formatDate(facture.date_creation || facture.created_at)}
                      </Box>
                    </TableCell>
                    <TableCell>{facture.Client?.nom || '—'}</TableCell>
                    <TableCell>{displayMoney(facture.total_ttc)}</TableCell>
                    <TableCell><StatusPill value={facture.statut} /></TableCell>
                    <TableCell>
                      {facture.date_encaissement ? (
                        <Chip size="small" color="success" label={formatDate(facture.date_encaissement)} />
                      ) : (
                        <Chip size="small" variant="outlined" label="Non renseignée" />
                      )}
                    </TableCell>
                    <TableCell>{facture.type_virement || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>
    </>
  );
}
