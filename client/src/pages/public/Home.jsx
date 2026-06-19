import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { articlesService, contactService } from '../../services/jsonService';

const cardGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
];

export function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { notify } = useToast();

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await articlesService.list();
        setArticles(data.filter(a => a.actif !== false));
      } catch (error) {
        console.error("Failed to load articles:", error);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, []);

  const handleAdd = (article) => {
    addToCart(article);
    notify('success', `"${article.designation}" ajouté au panier !`);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      nom: form.nom.value,
      email: form.email.value,
      sujet: form.sujet.value,
      message: form.message.value
    };

    try {
      const result = await contactService.send(payload);
      notify('success', result.message || 'Message envoyé.');
      form.reset();
    } catch (error) {
      notify('error', error.message || 'Erreur lors de l\'envoi du message.');
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-eyebrow">CONSULTING & ENGINEERING</div>
          <h1 className="hero-title">Des Solutions Numériques Qui Transforment Votre Business</h1>
          <p className="hero-subtitle">Développement web, audit sécurité, migration cloud — nous accompagnons les entreprises marocaines dans leur transformation digitale.</p>
          <a href="#services" className="hero-btn">Découvrir nos services</a>
        </div>
      </section>

      {/* Services */}
      <section className="services-section" id="services">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <div className="section-subtitle">NOTRE EXPERTISE</div>
            <h2 className="section-title">Catalogue de Services</h2>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement du catalogue…</p>
          ) : articles.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun service disponible pour le moment.</p>
          ) : (
            <div className="services-grid">
              {articles.map((article, index) => (
                <div key={article.id} className="service-card">
                  <div className="service-card-bg" style={{ background: cardGradients[index % cardGradients.length] }} />
                  <div className="service-card-overlay" />
                  <div className="service-card-content">
                    <div className="service-card-category">{article.Category?.nom || 'Service'}</div>
                    <h3 className="service-card-title">{article.designation}</h3>
                    <div className="service-card-price">{Number(article.prix_unitaire).toFixed(0)} <small>EUR HT</small></div>
                    <button className="service-card-btn" onClick={(e) => { e.stopPropagation(); handleAdd(article); }}>
                      + Ajouter au panier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="contact-section" id="contact">
        <div className="contact-info-block">
          <div className="hero-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)' }}>NOUS CONTACTER</div>
          <h2>Besoin d'un accompagnement ?</h2>
          <p>Notre équipe est à votre disposition pour évaluer vos besoins et vous proposer une solution adaptée.</p>

          <div className="contact-detail">
            <div style={{ fontSize: '1.3rem' }}>📞</div>
            <div>
              <strong>Téléphone</strong>
              <span>+212 5 22 00 00 00</span>
            </div>
          </div>
          <div className="contact-detail">
            <div style={{ fontSize: '1.3rem' }}>✉️</div>
            <div>
              <strong>Email</strong>
              <span>contact@techpro-services.ma</span>
            </div>
          </div>
          <div className="contact-detail">
            <div style={{ fontSize: '1.3rem' }}>📍</div>
            <div>
              <strong>Adresse</strong>
              <span>123 Avenue des Technologies, Casablanca</span>
            </div>
          </div>
        </div>

        <div className="contact-form-block">
          <div className="hero-eyebrow">DEMANDE DE DEVIS</div>
          <h3>Comment pouvons-nous vous aider ?</h3>
          <p>Remplissez ce formulaire et un de nos experts vous répondra dans les plus brefs délais.</p>
          
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-row">
              <input type="text" name="nom" placeholder="Nom complet *" required />
              <input type="email" name="email" placeholder="Email *" required />
            </div>
            <input type="text" name="sujet" placeholder="Objet *" required />
            <textarea name="message" rows={5} placeholder="Décrivez votre besoin…" required></textarea>
            <button type="submit" className="submit-btn">Envoyer ma demande</button>
          </form>
        </div>
      </section>
    </>
  );
}
