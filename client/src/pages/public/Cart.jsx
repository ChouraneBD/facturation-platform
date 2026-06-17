import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const totalHT = cart.reduce((acc, item) => acc + (item.prix_unitaire * item.quantity), 0);
  const totalTVA = cart.reduce((acc, item) => {
    const tvaPct = item.Category?.taux_tva || 20;
    return acc + ((item.prix_unitaire * item.quantity) * (tvaPct / 100));
  }, 0);
  const totalTTC = totalHT + totalTVA;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      // Pass redirect info to login
      navigate('/login?redirect=/checkout');
    }
  };

  return (
    <div className="cart-page">
      <div className="container">
        <h2 className="section-title" style={{ marginBottom: '2rem' }}>Votre Panier</h2>
        
        {cart.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem' }}>
            <strong>Votre panier est vide</strong>
            <p>Découvrez nos produits et services pour commencer.</p>
            <button className="call-btn" style={{ marginTop: '1rem', background: 'var(--accent)', color: '#fff' }} onClick={() => navigate('/')}>Retour à l'accueil</button>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.designation}</h4>
                    <p>PU HT: {Number(item.prix_unitaire).toFixed(2)} EUR</p>
                  </div>
                  <div className="cart-item-actions">
                    <input 
                      type="number" 
                      className="qty-input"
                      value={item.quantity} 
                      min="1" 
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                    />
                    <div style={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                      {(item.prix_unitaire * item.quantity).toFixed(2)} EUR
                    </div>
                    <button className="btn btn-small btn-danger" onClick={() => removeFromCart(item.id)}>X</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Résumé de la commande</h3>
              <div className="summary-row">
                <span>Total HT</span>
                <span>{totalHT.toFixed(2)} EUR</span>
              </div>
              <div className="summary-row">
                <span>TVA estimée</span>
                <span>{totalTVA.toFixed(2)} EUR</span>
              </div>
              <div className="summary-total">
                <span>Total TTC</span>
                <span>{totalTTC.toFixed(2)} EUR</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                Demander ma facture
              </button>
              {!isAuthenticated && (
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '1rem' }}>
                  Vous serez invité à vous connecter ou créer un compte.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
