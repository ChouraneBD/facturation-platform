import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { clientsService, facturesService, loadAppSettings } from '../../services/jsonService';
import { generatePdfBlob } from '../../utils/pdfGenerator';
import { SignaturePad } from '../../components/SignaturePad';
import { formatMoney } from '../../utils/formatMoney';

export function Checkout() {
  const { cart, clearCart } = useCart();
  const { session } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState('');
  const [appSettings, setAppSettings] = useState({ devise: 'MAD' });

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/');
    }
  }, [cart, navigate, success]);

  useEffect(() => {
    if (!session?.token) return;
    loadAppSettings(session.token)
      .then(setAppSettings)
      .catch(() => {});
  }, [session?.token]);

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.prix_unitaire || 0) * item.quantity, 0);

  const generateInvoice = async () => {
    if (cart.length === 0) return;
    if (!signature) {
      notify('error', 'Veuillez signer avant de confirmer la facture.');
      return;
    }

    setLoading(true);

    try {
      let clients = await clientsService.list(session.token);
      let client = clients.find((c) => c.email === session.user.email);

      if (!client) {
        const createdClient = await clientsService.create({
          nom: session.user.nom || session.user.email.split('@')[0],
          email: session.user.email,
          tel: '',
          ville: '',
          adresse: ''
        }, session.token);
        client = createdClient.client || createdClient;
      }

      const payload = {
        client_id: client.id,
        methode_calcul: 1,
        remise_globale_pct: 0,
        signature_base64: signature,
        lignes: cart.map((item) => ({
          article_id: item.id,
          designation_snapshot: item.designation,
          quantite: item.quantity,
          prix_unitaire_applique: item.prix_unitaire,
          remise_pct: 0,
          tva_pct: item.Category?.taux_tva || 20
        }))
      };

      const response = await facturesService.create(payload, session.token);
      const created = response.facture || response;
      const fullFacture = await facturesService.get(created.id, session.token);

      try {
        const blob = await generatePdfBlob(fullFacture, {
          name: appSettings.societeNom,
          tagline: appSettings.societeTagline,
          address: appSettings.societeAdresse,
          email: appSettings.societeEmail,
          phone: appSettings.societeTelephone,
          logoBase64: appSettings.logoBase64,
          devise: appSettings.devise
        });
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `Facture_${fullFacture.numero}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
      } catch (pdfErr) {
        console.error('PDF Gen Error:', pdfErr);
        notify('warning', 'Facture créée, mais erreur lors du téléchargement du PDF.');
      }

      const emailMessage = response.emailSent === false
        ? 'Facture générée, mais la notification email n\'a pas pu être envoyée.'
        : response.message || 'Facture générée ! Notification email envoyée.';

      notify(response.emailSent === false ? 'warning' : 'success', emailMessage);
      clearCart();
      setSuccess(true);
    } catch (error) {
      notify('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="cart-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Merci pour votre demande !</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Votre facture signée a été générée avec QR code de vérification.
          </p>
          <Stack direction="row" spacing={2} justifyContent="center">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>Retour au site</button>
            <button className="checkout-btn" style={{ width: 'auto' }} onClick={() => navigate('/dashboard/paiements')}>
              Suivi des paiements
            </button>
          </Stack>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container" style={{ maxWidth: 720, padding: '3rem 0' }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
          Finaliser la facture
        </Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Confirmez votre commande pour <strong>{session?.user?.email}</strong> et signez électroniquement.
        </Typography>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <Stack spacing={1.5}>
            {cart.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{item.designation} × {item.quantity}</Typography>
                <Typography fontWeight={600}>{formatMoney(item.prix_unitaire * item.quantity, appSettings.devise)}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700}>Total TTC estimé</Typography>
              <Typography fontWeight={800} color="primary.main">{formatMoney(cartTotal, appSettings.devise)}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <Typography fontWeight={700} gutterBottom>Signature numérique</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Dessinez votre signature — elle sera intégrée au PDF avec le code QR.
          </Typography>
          <SignaturePad value={signature} onChange={setSignature} />
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="outlined" onClick={() => navigate('/cart')} disabled={loading}>
            Retour au panier
          </Button>
          <Button variant="contained" size="large" onClick={generateInvoice} disabled={loading || !signature}>
            {loading ? 'Génération...' : 'Confirmer et télécharger la facture'}
          </Button>
        </Stack>
      </div>
    </div>
  );
}
