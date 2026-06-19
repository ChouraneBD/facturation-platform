import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { clientsService, facturesService } from '../../services/jsonService';
import { generatePdfBlob } from '../../utils/pdfGenerator';

export function Checkout() {
  const { cart, clearCart } = useCart();
  const { session } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/');
    }
  }, [cart, navigate, success]);

  const generateInvoice = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Prepare invoice payload for backend
      // Note: Backend requires a client_id. Since the user is authenticated, 
      // we need to ensure the user has an associated client record, or we map user to client.
      // For this SaaS logic, let's assume the user IS the client, or we create a dummy client if none exists.
      // Wait, the backend requires `client_id`. Let's fetch clients and pick the first one matching user email, or just create one.
      let clients = await clientsService.list(session.token);
      let client = clients.find(c => c.email === session.user.email);
      
      if (!client) {
        const createdClient = await clientsService.create({
          nom: session.user.nom || session.user.email.split('@')[0],
          email: session.user.email,
          tel: '0000000000',
          ville: 'Non renseignée',
          adresse: 'Non renseignée'
        }, session.token);
        client = createdClient.client || createdClient;
      }

      const payload = {
        client_id: client.id,
        methode_calcul: 1,
        remise_globale_pct: 0,
        lignes: cart.map(item => ({
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
        const blob = await generatePdfBlob(fullFacture);
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `Facture_${fullFacture.numero}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
      } catch (pdfErr) {
        console.error("PDF Gen Error:", pdfErr);
        notify('warning', "Facture créée, mais erreur lors du téléchargement du PDF.");
      }

      const emailMessage = response.emailSent === false
        ? 'Facture générée, mais la notification email n\'a pas pu être envoyée.'
        : response.message || 'Facture générée ! Notification email envoyée.';

      notify(response.emailSent === false ? 'warning' : 'success', emailMessage);
      clearCart();
      setSuccess(true);
      
    } catch (error) {
      notify('error', error.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="cart-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Merci pour votre demande !</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            Votre facture a été générée et le téléchargement a commencé.
          </p>
          <button className="call-btn" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => navigate('/dashboard/factures')}>
            Voir mon historique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', padding: '4rem 0' }}>
        <h2>Génération de la facture</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>
          Vous êtes sur le point de valider votre sélection. Une facture au nom de <strong>{session?.user?.email}</strong> va être générée.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/cart')} disabled={loading}>
            Retour au panier
          </button>
          <button className="checkout-btn" style={{ width: 'auto' }} onClick={generateInvoice} disabled={loading}>
            {loading ? 'Génération en cours...' : 'Confirmer et télécharger la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}
