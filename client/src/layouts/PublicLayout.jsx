import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AppLogo } from '../components/AppLogo';
import { APP_NAME } from '../config/branding';

export function PublicLayout() {
  const { notice } = useToast();
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="public-shell">
      {notice && <div className={`toast toast-${notice.type}`}>{notice.text}</div>}
      
      <header className="public-header">
        <div className="public-top-bar">Solutions IT sur-mesure — Casablanca &amp; Grand Maroc</div>
        <div className="container public-nav-wrapper">
          <Link to="/" className="public-logo">
            <AppLogo size={40} subtitle="Facturation & paiements" />
          </Link>
          
          <nav className="public-nav-links">
            <a href="#services">Nos Services</a>
            <a href="#contact">Contact</a>
            <Link to="/cart" className="nav-cart"><ShoppingCart size={16} /> Panier ({cartCount})</Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="nav-login"><LayoutDashboard size={16} /> Dashboard</Link>
            ) : (
              <Link to="/login" className="nav-login"><LayoutDashboard size={16} /> Connexion</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <section className="newsletter-section">
        <div className="container">
          <div className="hero-eyebrow">NEWSLETTER</div>
          <h2>Restez informé de nos dernières offres et actualités</h2>
          <div className="newsletter-form">
            <input type="email" placeholder="Votre adresse email" />
            <button>S'ABONNER</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <AppLogo size={32} subtitle="Gestion de factures" />
              </div>
              <p className="footer-desc">
                Cabinet de conseil spécialisé dans le développement logiciel, les infrastructures cloud et la sécurité informatique.
              </p>
              <div className="footer-socials">
                <span>f</span> <span>in</span> <span>tw</span> <span>yt</span>
              </div>
            </div>
            <div>
              <h4>Menu</h4>
              <ul>
                <li><Link to="/">Accueil</Link></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><Link to="/login">Espace Client</Link></li>
              </ul>
            </div>
            <div>
              <h4>Nos spécialités</h4>
              <ul>
                <li>Développement Sur-Mesure</li>
                <li>Audit & Sécurité</li>
                <li>Migration Cloud</li>
                <li>Intégration Systèmes</li>
              </ul>
            </div>
            <div>
              <h4>Nous contacter</h4>
              <ul>
                <li>123 Avenue des Technologies, Casablanca</li>
                <li>contact@techpro-services.ma</li>
                <li>+212 5 22 00 00 00</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 {APP_NAME} — Tous droits réservés</span>
            <div className="footer-bottom-links">
              <a href="#">Mentions légales</a>
              <a href="#">Politique de confidentialité</a>
            </div>
            <button className="scroll-top-btn" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
