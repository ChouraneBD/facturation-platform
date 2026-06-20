import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { AlertCircle } from 'lucide-react';
import { facturesService } from '../../services/jsonService';
import { formatMoney } from '../../utils/formatMoney';
import { StatusPill, LoadingPanel } from '../../components/ui';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export function Verify() {
  const { numero } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await facturesService.verify(numero);
        setResult(data);
      } catch (err) {
        setError(err.message || 'Vérification impossible.');
      } finally {
        setLoading(false);
      }
    };
    if (numero) verify();
  }, [numero]);

  return (
    <Box sx={{ py: 6 }}>
      <Box className="container" sx={{ maxWidth: 560, mx: 'auto' }}>
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="overline" color="primary" fontWeight={700}>
            Vérification de facture
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1, mb: 3 }}>
            {numero}
          </Typography>

          {loading ? (
            <LoadingPanel rows={3} />
          ) : error ? (
            <Stack spacing={2} alignItems="center" textAlign="center">
              <AlertCircle size={48} color="#ef4444" />
              <Typography color="error">{error}</Typography>
              <Button component={Link} to="/" variant="outlined">Retour au site</Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <VerifiedIcon color="success" />
                <Typography fontWeight={700} color="success.main">
                  Document authentique — facture enregistrée
                </Typography>
              </Stack>

              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Client</Typography>
                  <Typography fontWeight={600}>{result.client_nom || '—'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Date</Typography>
                  <Typography fontWeight={600}>{formatDate(result.date_creation)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Statut</Typography>
                  <StatusPill value={result.statut} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Total TTC</Typography>
                  <Typography fontWeight={700}>{formatMoney(result.total_ttc, 'MAD')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Signature numérique</Typography>
                  <Chip size="small" color={result.has_signature ? 'success' : 'default'} label={result.has_signature ? 'Présente' : 'Absente'} />
                </Box>
              </Box>

              <Button component={Link} to="/login" variant="contained" fullWidth sx={{ mt: 2 }}>
                Accéder à l'espace client
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
