import { useEffect, useMemo, useState } from 'react';
import { api, apiBlob } from './api';
import { calculateInvoiceTotals } from './invoiceCalculations';

const STORAGE_KEY = 'facturation-platform-session';

const emptyAuth = {
  nom: '',
  email: '',
  mot_de_passe: '',
  role: 'user'
};

const emptyClient = {
  nom: '',
  email: '',
  tel: '',
  adresse: '',
  ville: ''
};

const emptyCategory = {
  nom: '',
  taux_tva: '20.00'
};

const emptyArticle = {
  designation: '',
  prix_unitaire: '',
  categorie_id: '',
  actif: true
};

const emptyParametre = {
  cle: '',
  valeur: '',
  description: ''
};

const makeInvoiceLine = () => ({
  article_id: '',
  designation_snapshot: '',
  quantite: 1,
  prix_unitaire_applique: '',
  remise_pct: 0,
  tva_pct: 20
});

const emptyInvoice = () => ({
  client_id: '',
  methode_calcul: 1,
  remise_globale_pct: 0,
  date_depot: '',
  date_encaissement: '',
  type_virement: '',
  signature_base64: '',
  pdf_url: '',
  commentaire_admin: '',
  lignes: [makeInvoiceLine()]
});

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clients', label: 'Clients' },
  { id: 'categories', label: 'Categories' },
  { id: 'articles', label: 'Articles' },
  { id: 'factures', label: 'Factures' },
  { id: 'parametres', label: 'Parametres' }
];

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return moneyFormatter.format(amount);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('fr-FR');
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function titleCase(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  switch (status) {
    case 'validee':
      return 'chip chip-success';
    case 'payee':
      return 'chip chip-accent';
    case 'rejetee':
      return 'chip chip-danger';
    default:
      return 'chip';
  }
}

function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

function Card({ title, value, note }) {
  return (
    <section className="card stat-card">
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
      {note ? <div className="muted">{note}</div> : null}
    </section>
  );
}

function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="panel card">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ value }) {
  return <span className={statusClass(value)}>{titleCase(value)}</span>;
}

function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function InvoiceStatusEditor({ facture, token, onSaved, notify, role }) {
  const [status, setStatus] = useState(facture.statut);
  const [discount, setDiscount] = useState(String(facture.remise_globale_pct ?? 0));
  const [comment, setComment] = useState(facture.commentaire_admin || '');
  const [dateEncaissement, setDateEncaissement] = useState(facture.date_encaissement || '');
  const [typeVirement, setTypeVirement] = useState(facture.type_virement || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(facture.statut);
    setDiscount(String(facture.remise_globale_pct ?? 0));
    setComment(facture.commentaire_admin || '');
    setDateEncaissement(facture.date_encaissement || '');
    setTypeVirement(facture.type_virement || '');
  }, [facture]);

  const refreshFacture = async () => {
    await onSaved();
  };

  const handleValidate = async (nextStatus) => {
    setBusy(true);
    try {
      await api(`/api/factures/${facture.id}/validation`, {
        method: 'PATCH',
        token,
        body: { statut: nextStatus }
      });

      try {
        await api(`/api/factures/${facture.id}/send-email`, {
          method: 'POST',
          token,
          body: { statut: nextStatus }
        });
      } catch (emailError) {
        notify('warning', emailError.message);
      }

      notify(nextStatus === 'validee' ? 'success' : 'error', `Facture ${facture.numero} ${nextStatus === 'validee' ? 'validée' : 'rejetée'}.`);
      await refreshFacture();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await api(`/api/factures/${facture.id}/remise-globale`, {
        method: 'PATCH',
        token,
        body: { remise_globale_pct: Number(discount || 0) }
      });

      await api(`/api/factures/${facture.id}/statut`, {
        method: 'PATCH',
        token,
        body: {
          statut,
          commentaire_admin: comment,
          date_encaissement: dateEncaissement || null,
          type_virement: typeVirement || null
        }
      });

      notify('success', `Facture ${facture.numero} mise à jour.`);
      onSaved();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setBusy(false);
    }
  };

  if (role === 'admin') {
    return (
      <div className="invoice-editor invoice-editor-admin">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discount}
          onChange={(event) => setDiscount(event.target.value)}
          placeholder="Remise %"
        />
        <input
          type="text"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Commentaire de validation"
        />
        <div className="row-actions">
          <button className="btn btn-small" type="button" onClick={() => handleValidate('validee')} disabled={busy}>
            Valider
          </button>
          <button className="btn btn-small btn-danger" type="button" onClick={() => handleValidate('rejetee')} disabled={busy}>
            Rejeter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-editor invoice-editor-user">
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="en_attente">En attente</option>
        <option value="payee">Payée</option>
      </select>
      <input
        type="date"
        value={dateEncaissement}
        onChange={(event) => setDateEncaissement(event.target.value)}
        placeholder="Date encaissement"
      />
      <input
        type="text"
        value={typeVirement}
        onChange={(event) => setTypeVirement(event.target.value)}
        placeholder="Type virement"
      />
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={discount}
        onChange={(event) => setDiscount(event.target.value)}
        placeholder="Remise %"
      />
      <input
        type="text"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Commentaire"
      />
      <button className="btn btn-small" type="button" onClick={handleSave} disabled={busy}>
        {busy ? 'Sauvegarde...' : 'Mettre a jour'}
      </button>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [factures, setFactures] = useState([]);
  const [parametres, setParametres] = useState([]);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [editingClientId, setEditingClientId] = useState(null);

  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [articleForm, setArticleForm] = useState(emptyArticle);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleAvailability, setArticleAvailability] = useState('all');

  const [parametreForm, setParametreForm] = useState(emptyParametre);
  const [editingParametreKey, setEditingParametreKey] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice());
  const [factureSearch, setFactureSearch] = useState('');
  const [factureStatusFilter, setFactureStatusFilter] = useState('all');
  const [factureDateFrom, setFactureDateFrom] = useState('');
  const [factureDateTo, setFactureDateTo] = useState('');
  const [facturePage, setFacturePage] = useState(1);

  const canManageParameters = session?.user?.role === 'admin';

  const invoiceClientOptions = useMemo(() => clients.slice().sort((left, right) => left.nom.localeCompare(right.nom)), [clients]);
  const articleOptions = useMemo(() => articles.slice().sort((left, right) => left.designation.localeCompare(right.designation)), [articles]);
  const filteredArticles = useMemo(() => {
    const search = normalizeText(articleSearch);

    return articles
      .filter((article) => {
        if (articleAvailability === 'active' && !article.actif) {
          return false;
        }

        if (articleAvailability === 'inactive' && article.actif) {
          return false;
        }

        if (!search) {
          return true;
        }

        const categoryName = article.Category?.nom || '';
        return [article.designation, categoryName, String(article.prix_unitaire || ''), String(article.id || '')]
          .some((field) => normalizeText(field).includes(search));
      })
      .sort((left, right) => left.designation.localeCompare(right.designation));
  }, [articles, articleAvailability, articleSearch]);

  const invoicePreview = useMemo(() => {
    return calculateInvoiceTotals({
      lines: invoiceForm.lignes,
      methodeCalcul: invoiceForm.methode_calcul,
      remiseGlobalePct: invoiceForm.remise_globale_pct
    });
  }, [invoiceForm.lignes, invoiceForm.methode_calcul, invoiceForm.remise_globale_pct]);

  const selectedInvoiceArticles = useMemo(() => {
    return invoicePreview.lignes.filter((line) => line.article_id || line.designation_snapshot);
  }, [invoicePreview.lignes]);

  const filteredFactures = useMemo(() => {
    const search = normalizeText(factureSearch);

    return factures.filter((facture) => {
      if (factureStatusFilter !== 'all' && facture.statut !== factureStatusFilter) {
        return false;
      }

      if (factureDateFrom) {
        const createdAt = new Date(facture.date_creation || facture.created_at);
        if (createdAt < new Date(factureDateFrom)) {
          return false;
        }
      }

      if (factureDateTo) {
        const createdAt = new Date(facture.date_creation || facture.created_at);
        if (createdAt > new Date(factureDateTo)) {
          return false;
        }
      }

      if (!search) {
        return true;
      }

      const haystack = [
        facture.numero,
        facture.Client?.nom,
        facture.statut,
        facture.commentaire_admin
      ]
        .filter(Boolean)
        .join(' ');

      return normalizeText(haystack).includes(search);
    });
  }, [factures, factureDateFrom, factureDateTo, factureSearch, factureStatusFilter]);

  const facturePageSize = 4;
  const factureTotalPages = Math.max(1, Math.ceil(filteredFactures.length / facturePageSize));
  const currentFactures = filteredFactures.slice((facturePage - 1) * facturePageSize, facturePage * facturePageSize);

  const notify = (type, text) => {
    setNotice({ type, text });
    window.clearTimeout(window.__facturationNoticeTimer);
    window.__facturationNoticeTimer = window.setTimeout(() => setNotice(null), 4500);
  };

  useEffect(() => {
    setFacturePage(1);
  }, [factureSearch, factureStatusFilter, factureDateFrom, factureDateTo]);

  const downloadFacturePdf = async (facture) => {
    try {
      const blob = await apiBlob(`/api/factures/${facture.id}/pdf`, { token: session.token });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${facture.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      notify('success', `PDF de ${facture.numero} téléchargé.`);
    } catch (error) {
      notify('error', error.message);
    }
  };

  const loadAll = async (token = session?.token) => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [dashboardData, clientsData, categoriesData, articlesData, facturesData, parametresData] = await Promise.all([
        api('/api/dashboard/metrics', { token }),
        api('/api/clients', { token }),
        api('/api/categories', { token }),
        api('/api/articles', { token }),
        api('/api/factures', { token }),
        api('/api/parametres', { token })
      ]);

      setDashboard(dashboardData);
      setClients(clientsData);
      setCategories(categoriesData);
      setArticles(articlesData);
      setFactures(facturesData);
      setParametres(parametresData);
    } catch (error) {
      notify('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      loadAll(session.token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      setDashboard(null);
      setClients([]);
      setCategories([]);
      setArticles([]);
      setFactures([]);
      setParametres([]);
      setActiveTab('dashboard');
    }
  }, [session]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const payload = { ...authForm };
      if (authMode === 'login') {
        delete payload.nom;
        delete payload.role;
      }

      const result = await api(endpoint, {
        method: 'POST',
        body: payload
      });

      setSession(result);
      notify('success', result.message || 'Connexion réussie.');
      setAuthForm(emptyAuth);
    } catch (error) {
      notify('error', error.message);
    }
  };

  const logout = () => {
    setSession(null);
    setAuthForm(emptyAuth);
    setNotice(null);
  };

  const handleClientSubmit = async (event) => {
    event.preventDefault();
    try {
      await api(editingClientId ? `/api/clients/${editingClientId}` : '/api/clients', {
        method: editingClientId ? 'PUT' : 'POST',
        token: session.token,
        body: clientForm
      });
      setClientForm(emptyClient);
      setEditingClientId(null);
      notify('success', editingClientId ? 'Client mis a jour.' : 'Client cree.');
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      await api(editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories', {
        method: editingCategoryId ? 'PUT' : 'POST',
        token: session.token,
        body: {
          nom: categoryForm.nom,
          taux_tva: Number(categoryForm.taux_tva || 0)
        }
      });
      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
      notify('success', editingCategoryId ? 'Categorie mise a jour.' : 'Categorie creee.');
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const handleArticleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api(editingArticleId ? `/api/articles/${editingArticleId}` : '/api/articles', {
        method: editingArticleId ? 'PUT' : 'POST',
        token: session.token,
        body: {
          designation: articleForm.designation,
          prix_unitaire: Number(articleForm.prix_unitaire || 0),
          categorie_id: articleForm.categorie_id ? Number(articleForm.categorie_id) : null,
          actif: Boolean(articleForm.actif)
        }
      });
      setArticleForm(emptyArticle);
      setEditingArticleId(null);
      notify('success', editingArticleId ? 'Article mis a jour.' : 'Article cree.');
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const handleParametreSubmit = async (event) => {
    event.preventDefault();
    try {
      await api('/api/parametres', {
        method: 'PUT',
        token: session.token,
        body: parametreForm
      });
      setParametreForm(emptyParametre);
      setEditingParametreKey(null);
      notify('success', 'Parametre enregistre.');
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const updateInvoiceLine = (index, field, value) => {
    setInvoiceForm((current) => {
      const lines = current.lignes.map((line, lineIndex) => {
        if (lineIndex !== index) {
          return line;
        }

        const next = { ...line, [field]: value };
        if (field === 'article_id') {
          const article = articles.find((item) => String(item.id) === String(value));
          if (article) {
            next.designation_snapshot = article.designation;
            next.prix_unitaire_applique = Number(article.prix_unitaire || 0);
            next.tva_pct = Number(article.Category?.taux_tva ?? 20);
          } else {
            next.designation_snapshot = '';
            next.prix_unitaire_applique = '';
            next.tva_pct = 20;
          }
        }
        return next;
      });

      return { ...current, lignes: lines };
    });
  };

  const addArticleToInvoice = (article) => {
    setInvoiceForm((current) => ({
      ...current,
      lignes: [
        ...current.lignes,
        {
          ...makeInvoiceLine(),
          article_id: String(article.id),
          designation_snapshot: article.designation || '',
          prix_unitaire_applique: Number(article.prix_unitaire || 0),
          tva_pct: Number(article.Category?.taux_tva ?? 20)
        }
      ]
    }));
  };

  const addInvoiceLine = () => {
    setInvoiceForm((current) => ({ ...current, lignes: [...current.lignes, makeInvoiceLine()] }));
  };

  const removeInvoiceLine = (index) => {
    setInvoiceForm((current) => ({
      ...current,
      lignes: current.lignes.length > 1 ? current.lignes.filter((_, lineIndex) => lineIndex !== index) : current.lignes
    }));
  };

  const handleInvoiceSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        client_id: Number(invoiceForm.client_id),
        methode_calcul: Number(invoiceForm.methode_calcul),
        remise_globale_pct: Number(invoiceForm.remise_globale_pct || 0),
        date_depot: invoiceForm.date_depot || null,
        date_encaissement: invoiceForm.date_encaissement || null,
        type_virement: invoiceForm.type_virement || null,
        signature_base64: invoiceForm.signature_base64 || null,
        pdf_url: invoiceForm.pdf_url || null,
        commentaire_admin: invoiceForm.commentaire_admin || null,
        calculs_facture: invoicePreview,
        lignes: invoiceForm.lignes.map((line) => ({
          article_id: line.article_id ? Number(line.article_id) : null,
          designation_snapshot: line.designation_snapshot,
          quantite: Number(line.quantite),
          prix_unitaire_applique: Number(line.prix_unitaire_applique),
          remise_pct: Number(line.remise_pct || 0),
          tva_pct: Number(line.tva_pct || 20)
        }))
      };

      await api('/api/factures', {
        method: 'POST',
        token: session.token,
        body: payload
      });

      setInvoiceForm(emptyInvoice());
      notify('success', 'Facture creee.');
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const deleteEntity = async (entity, id, label) => {
    if (!window.confirm(`Supprimer ${label} ?`)) {
      return;
    }

    const endpoints = {
      client: `/api/clients/${id}`,
      category: `/api/categories/${id}`,
      article: `/api/articles/${id}`
    };

    try {
      await api(endpoints[entity], {
        method: 'DELETE',
        token: session.token
      });
      notify('success', `${label} supprime.`);
      loadAll();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const startEditClient = (client) => {
    setEditingClientId(client.id);
    setClientForm({
      nom: client.nom || '',
      email: client.email || '',
      tel: client.tel || '',
      adresse: client.adresse || '',
      ville: client.ville || ''
    });
    setActiveTab('clients');
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      nom: category.nom || '',
      taux_tva: String(category.taux_tva ?? '20.00')
    });
    setActiveTab('categories');
  };

  const startEditArticle = (article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      designation: article.designation || '',
      prix_unitaire: String(article.prix_unitaire ?? ''),
      categorie_id: article.categorie_id ? String(article.categorie_id) : '',
      actif: Boolean(article.actif)
    });
    setActiveTab('articles');
  };

  const startEditParametre = (parametre) => {
    setEditingParametreKey(parametre.cle);
    setParametreForm({
      cle: parametre.cle || '',
      valeur: parametre.valeur || '',
      description: parametre.description || ''
    });
    setActiveTab('parametres');
  };

  const dashboardCards = dashboard
    ? [
        { title: 'Factures', value: dashboard.totals.factures },
        { title: 'Clients', value: dashboard.totals.clients },
        { title: 'Articles', value: dashboard.totals.articles },
        { title: 'CA TTC', value: formatMoney(dashboard.totals.total_ttc) },
        { title: 'Revenus valides', value: formatMoney(dashboard.totals.revenus_valides) }
      ]
    : [];

  const renderAuth = () => (
    <main className="auth-shell">
      <section className="brand-panel card">
        <div className="eyebrow">Facturation Platform</div>
        <h1>Backend complet. Frontend operable.</h1>
        <p>
          Login, facturation, catalogue produit, parametres systeme et dashboard financier dans une seule interface.
        </p>
        <div className="brand-metrics">
          <div>
            <strong>5 modules</strong>
            <span>Auth, CRUD, Invoicing, Metrics, Config</span>
          </div>
          <div>
            <strong>1 API</strong>
            <span>JWT Bearer et PostgreSQL</span>
          </div>
        </div>
      </section>

      <section className="card auth-panel">
        <div className="tabs auth-tabs">
          <button className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>Connexion</button>
          <button className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>Inscription</button>
        </div>

        <form className="form-stack" onSubmit={handleAuthSubmit}>
          {authMode === 'register' ? (
            <Field label="Nom complet">
              <input value={authForm.nom} onChange={(event) => setAuthForm({ ...authForm, nom: event.target.value })} placeholder="Nom" />
            </Field>
          ) : null}

          <Field label="Email">
            <input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="admin@company.com" />
          </Field>

          <Field label="Mot de passe">
            <input type="password" value={authForm.mot_de_passe} onChange={(event) => setAuthForm({ ...authForm, mot_de_passe: event.target.value })} placeholder="••••••••" />
          </Field>

          {authMode === 'register' ? (
            <Field label="Role">
              <select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          ) : null}

          <button className="btn" type="submit">{authMode === 'login' ? 'Se connecter' : 'Creer le compte'}</button>
        </form>

        <p className="muted auth-footnote">JWT est stocke localement, puis les modules s'affichent apres authentification.</p>
      </section>
    </main>
  );

  if (!session?.token) {
    return (
      <div className="app-shell auth-background">
        {notice ? <div className={`toast toast-${notice.type}`}>{notice.text}</div> : null}
        {renderAuth()}
      </div>
    );
  }

  return (
    <div className="app-shell dashboard-background">
      {notice ? <div className={`toast toast-${notice.type}`}>{notice.text}</div> : null}

      <header className="topbar card">
        <div>
          <div className="eyebrow">Facturation Platform</div>
          <h1>Tableau de bord operable</h1>
          <p className="muted">Connecte sous {session.user?.email} comme {session.user?.role}.</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" type="button" onClick={() => loadAll()} disabled={loading}>
            {loading ? 'Chargement...' : 'Rafraichir'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={logout}>Deconnexion</button>
        </div>
      </header>

      <nav className="tabs main-tabs card">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="workspace">
        {activeTab === 'dashboard' ? (
          <>
            <section className="stats-grid">
              {dashboardCards.map((card) => (
                <Card key={card.title} title={card.title} value={card.value} note="Synthese en temps reel" />
              ))}
            </section>

            <Panel title="Repartition des statuts" subtitle="Visibilite rapide sur les flux de factures.">
              {dashboard ? (
                <div className="status-grid">
                  {Object.entries(dashboard.status_breakdown).map(([key, value]) => (
                    <div key={key} className="status-metric">
                      <span>{titleCase(key)}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucune statistique" message="Actualise le tableau de bord apres avoir cree des donnees." />
              )}
            </Panel>

            <Panel title="Factures recentes" subtitle="Les dernieres factures avec le client et les lignes associees.">
              {dashboard?.recent_factures?.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Numero</th>
                        <th>Client</th>
                        <th>Total TTC</th>
                        <th>Status</th>
                        <th>Creation</th>
                        <th>Lignes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent_factures.map((facture) => (
                        <tr key={facture.id}>
                          <td>{facture.numero}</td>
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
                <EmptyState title="Aucune facture" message="Les nouvelles factures apparaîtront ici apres creation." />
              )}
            </Panel>
          </>
        ) : null}

        {activeTab === 'clients' ? (
          <div className="split-layout">
            <Panel title={editingClientId ? 'Modifier un client' : 'Nouveau client'} subtitle="Gestion des tiers." actions={editingClientId ? <button className="btn btn-secondary" type="button" onClick={() => { setEditingClientId(null); setClientForm(emptyClient); }}>Annuler</button> : null}>
              <form className="form-grid" onSubmit={handleClientSubmit}>
                <Field label="Nom">
                  <input value={clientForm.nom} onChange={(event) => setClientForm({ ...clientForm, nom: event.target.value })} />
                </Field>
                <Field label="Email">
                  <input value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} />
                </Field>
                <Field label="Telephone">
                  <input value={clientForm.tel} onChange={(event) => setClientForm({ ...clientForm, tel: event.target.value })} />
                </Field>
                <Field label="Ville">
                  <input value={clientForm.ville} onChange={(event) => setClientForm({ ...clientForm, ville: event.target.value })} />
                </Field>
                <Field label="Adresse" wide>
                  <textarea rows="3" value={clientForm.adresse} onChange={(event) => setClientForm({ ...clientForm, adresse: event.target.value })} />
                </Field>
                <button className="btn" type="submit">{editingClientId ? 'Mettre a jour' : 'Creer le client'}</button>
              </form>
            </Panel>

            <Panel title="Clients existants" subtitle={`${clients.length} enregistrements.`}>
              {clients.length ? (
                <div className="entity-list">
                  {clients.map((client) => (
                    <article key={client.id} className="entity-row">
                      <div>
                        <strong>{client.nom}</strong>
                        <div className="muted">{client.email || '—'} · {client.ville || '—'}</div>
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => startEditClient(client)}>Editer</button>
                        <button className="btn btn-small btn-danger" type="button" onClick={() => deleteEntity('client', client.id, client.nom)}>Supprimer</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucun client" message="Crée un client pour commencer à facturer." />
              )}
            </Panel>
          </div>
        ) : null}

        {activeTab === 'categories' ? (
          <div className="split-layout">
            <Panel title={editingCategoryId ? 'Modifier une categorie' : 'Nouvelle categorie'} subtitle="Categories TVA." actions={editingCategoryId ? <button className="btn btn-secondary" type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); }}>Annuler</button> : null}>
              <form className="form-grid" onSubmit={handleCategorySubmit}>
                <Field label="Nom">
                  <input value={categoryForm.nom} onChange={(event) => setCategoryForm({ ...categoryForm, nom: event.target.value })} />
                </Field>
                <Field label="Taux TVA">
                  <input type="number" step="0.01" min="0" value={categoryForm.taux_tva} onChange={(event) => setCategoryForm({ ...categoryForm, taux_tva: event.target.value })} />
                </Field>
                <button className="btn" type="submit">{editingCategoryId ? 'Mettre a jour' : 'Creer la categorie'}</button>
              </form>
            </Panel>

            <Panel title="Categories en base" subtitle={`${categories.length} categories.`}>
              {categories.length ? (
                <div className="entity-list">
                  {categories.map((category) => (
                    <article key={category.id} className="entity-row">
                      <div>
                        <strong>{category.nom}</strong>
                        <div className="muted">TVA {category.taux_tva}%</div>
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => startEditCategory(category)}>Editer</button>
                        <button className="btn btn-small btn-danger" type="button" onClick={() => deleteEntity('category', category.id, category.nom)}>Supprimer</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucune categorie" message="Les categories de base sont normalement seedees côté serveur." />
              )}
            </Panel>
          </div>
        ) : null}

        {activeTab === 'articles' ? (
          <div className="split-layout article-layout">
            <Panel
              title={editingArticleId ? 'Modifier un article' : 'Nouvel article'}
              subtitle="Créer ou ajuster le catalogue qui alimente les factures."
              actions={editingArticleId ? <button className="btn btn-secondary" type="button" onClick={() => { setEditingArticleId(null); setArticleForm(emptyArticle); }}>Annuler</button> : null}
            >
              <form className="form-grid" onSubmit={handleArticleSubmit}>
                <Field label="Designation" wide>
                  <input value={articleForm.designation} onChange={(event) => setArticleForm({ ...articleForm, designation: event.target.value })} />
                </Field>
                <Field label="Prix unitaire">
                  <input type="number" step="0.01" min="0" value={articleForm.prix_unitaire} onChange={(event) => setArticleForm({ ...articleForm, prix_unitaire: event.target.value })} />
                </Field>
                <Field label="Categorie">
                  <select value={articleForm.categorie_id} onChange={(event) => setArticleForm({ ...articleForm, categorie_id: event.target.value })}>
                    <option value="">Aucune</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Actif">
                  <select value={articleForm.actif ? 'true' : 'false'} onChange={(event) => setArticleForm({ ...articleForm, actif: event.target.value === 'true' })}>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </Field>
                <button className="btn" type="submit">{editingArticleId ? 'Mettre a jour' : "Creer l'article"}</button>
              </form>
            </Panel>

            <Panel
              title="Catalogue articles"
              subtitle={`${filteredArticles.length} article${filteredArticles.length > 1 ? 's' : ''} disponibles pour la sélection.`}
              actions={
                <div className="panel-actions article-filters">
                  <input
                    className="catalog-search"
                    value={articleSearch}
                    onChange={(event) => setArticleSearch(event.target.value)}
                    placeholder="Rechercher un article, une catégorie ou un prix"
                  />
                  <select value={articleAvailability} onChange={(event) => setArticleAvailability(event.target.value)}>
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
              }
            >
              {filteredArticles.length ? (
                <div className="table-scroll">
                  <table className="article-table">
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th>Categorie</th>
                        <th>Prix</th>
                        <th>TVA</th>
                        <th>Etat</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article) => {
                        const alreadySelected = invoiceForm.lignes.some((line) => String(line.article_id) === String(article.id));

                        return (
                          <tr key={article.id} className={alreadySelected ? 'article-selected-row' : ''}>
                            <td>
                              <strong>{article.designation}</strong>
                              <div className="muted">Code #{article.id}</div>
                            </td>
                            <td>{article.Category?.nom || 'Sans categorie'}</td>
                            <td>{formatMoney(article.prix_unitaire)}</td>
                            <td>{article.Category?.taux_tva ?? 20}%</td>
                            <td>
                              <span className={article.actif ? 'chip chip-success' : 'chip chip-danger'}>
                                {article.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button className="btn btn-small" type="button" onClick={() => addArticleToInvoice(article)}>
                                  {alreadySelected ? 'Ajouter encore' : 'Ajouter à la facture'}
                                </button>
                                <button className="btn btn-small btn-secondary" type="button" onClick={() => startEditArticle(article)}>Editer</button>
                                <button className="btn btn-small btn-danger" type="button" onClick={() => deleteEntity('article', article.id, article.designation)}>Supprimer</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="Aucun article" message="Aucun résultat ne correspond au filtre actuel." />
              )}

              <div className="invoice-preview">
                <div className="section-line">
                  <strong>Facture en cours</strong>
                  <button className="btn btn-small btn-secondary" type="button" onClick={() => setActiveTab('factures')}>Ouvrir la facture</button>
                </div>

                {selectedInvoiceArticles.length ? (
                  <div className="selected-lines-list">
                    {selectedInvoiceArticles.map((line) => (
                      <div key={`${line.article_id || line.designation_snapshot}-${line.index}`} className="selected-line-row">
                        <div>
                          <strong>{line.designation_snapshot || 'Ligne sans designation'}</strong>
                          <div className="muted">Quantité {line.quantite} · PU {formatMoney(line.prix_unitaire_applique)} · TVA {line.tva_pct}% · Total {formatMoney(line.adjusted_total_ttc)}</div>
                        </div>
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => removeInvoiceLine(line.index)}>
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Aucune sélection" message="Clique sur Ajouter à la facture pour préparer un devis ou une facture." />
                )}
              </div>
            </Panel>
          </div>
        ) : null}

        {activeTab === 'factures' ? (
          <div className="split-layout invoice-layout">
            <Panel title="Nouvelle facture" subtitle="Lignes snapshots, TVA et remise globale." actions={<button className="btn btn-secondary" type="button" onClick={() => setInvoiceForm(emptyInvoice())}>Reset</button>}>
              <form className="form-grid invoice-form" onSubmit={handleInvoiceSubmit}>
                <Field label="Client">
                  <select value={invoiceForm.client_id} onChange={(event) => setInvoiceForm({ ...invoiceForm, client_id: event.target.value })}>
                    <option value="">Choisir un client</option>
                    {invoiceClientOptions.map((client) => <option key={client.id} value={client.id}>{client.nom}</option>)}
                  </select>
                </Field>
                <Field label="Methode calcul">
                  <select value={invoiceForm.methode_calcul} onChange={(event) => setInvoiceForm({ ...invoiceForm, methode_calcul: Number(event.target.value) })}>
                    <option value={1}>1 - Calcul simple</option>
                    <option value={2}>2 - Remise par ligne</option>
                    <option value={3}>3 - Remise globale sur HT</option>
                    <option value={4}>4 - TVA source categorie</option>
                  </select>
                </Field>
                <Field label="Remise globale %">
                  <input type="number" min="0" max="100" step="0.01" value={invoiceForm.remise_globale_pct} onChange={(event) => setInvoiceForm({ ...invoiceForm, remise_globale_pct: event.target.value })} />
                </Field>
                <Field label="Date depot">
                  <input type="date" value={invoiceForm.date_depot} onChange={(event) => setInvoiceForm({ ...invoiceForm, date_depot: event.target.value })} />
                </Field>
                <Field label="Date encaissement">
                  <input type="date" value={invoiceForm.date_encaissement} onChange={(event) => setInvoiceForm({ ...invoiceForm, date_encaissement: event.target.value })} />
                </Field>
                <Field label="Type virement">
                  <input value={invoiceForm.type_virement} onChange={(event) => setInvoiceForm({ ...invoiceForm, type_virement: event.target.value })} />
                </Field>
                <Field label="PDF URL" wide>
                  <input value={invoiceForm.pdf_url} onChange={(event) => setInvoiceForm({ ...invoiceForm, pdf_url: event.target.value })} />
                </Field>
                <Field label="Signature base64" wide>
                  <textarea rows="2" value={invoiceForm.signature_base64} onChange={(event) => setInvoiceForm({ ...invoiceForm, signature_base64: event.target.value })} />
                </Field>
                <Field label="Commentaire admin" wide>
                  <textarea rows="2" value={invoiceForm.commentaire_admin} onChange={(event) => setInvoiceForm({ ...invoiceForm, commentaire_admin: event.target.value })} />
                </Field>

                <div className="invoice-summary card wide">
                  <div>
                    <span className="field-label">Total HT</span>
                    <strong>{formatMoney(invoicePreview.total_ht)}</strong>
                  </div>
                  <div>
                    <span className="field-label">TVA</span>
                    <strong>{formatMoney(invoicePreview.tva)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Remise globale</span>
                    <strong>{formatMoney(invoicePreview.remise_globale_montant)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Total TTC</span>
                    <strong>{formatMoney(invoicePreview.total_ttc)}</strong>
                  </div>
                </div>

                <div className="invoice-lines wide">
                  <div className="section-line">
                    <strong>Lignes</strong>
                    <button className="btn btn-small btn-secondary" type="button" onClick={addInvoiceLine}>Ajouter une ligne</button>
                  </div>

                  {invoiceForm.lignes.map((line, index) => (
                    <div className="invoice-line" key={index}>
                      <Field label="Article">
                        <select value={line.article_id} onChange={(event) => updateInvoiceLine(index, 'article_id', event.target.value)}>
                          <option value="">Manuel</option>
                          {articleOptions.map((article) => <option key={article.id} value={article.id}>{article.designation}</option>)}
                        </select>
                      </Field>
                      <Field label="Designation">
                        <input value={line.designation_snapshot} onChange={(event) => updateInvoiceLine(index, 'designation_snapshot', event.target.value)} />
                      </Field>
                      <Field label="Quantite">
                        <input type="number" min="1" value={line.quantite} onChange={(event) => updateInvoiceLine(index, 'quantite', event.target.value)} />
                      </Field>
                      <Field label="Prix unitaire applique">
                        <input type="number" step="0.01" min="0" value={line.prix_unitaire_applique} onChange={(event) => updateInvoiceLine(index, 'prix_unitaire_applique', event.target.value)} />
                      </Field>
                      <Field label="Remise %">
                        <input type="number" step="0.01" min="0" max="100" value={line.remise_pct} onChange={(event) => updateInvoiceLine(index, 'remise_pct', event.target.value)} />
                      </Field>
                      <Field label="TVA %">
                        <input type="number" step="0.01" min="0" max="100" value={line.tva_pct} onChange={(event) => updateInvoiceLine(index, 'tva_pct', event.target.value)} />
                      </Field>
                      <div className="line-actions">
                        <button className="btn btn-small btn-danger" type="button" onClick={() => removeInvoiceLine(index)}>Retirer</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn" type="submit">Creer la facture</button>
              </form>
            </Panel>

            <Panel
              title="Factures existantes"
              subtitle={`${filteredFactures.length} facture${filteredFactures.length > 1 ? 's' : ''} filtrée${filteredFactures.length > 1 ? 's' : ''}.`}
              actions={
                <div className="invoice-history-filters">
                  <input value={factureSearch} onChange={(event) => setFactureSearch(event.target.value)} placeholder="Rechercher une facture, un client ou un statut" />
                  <select value={factureStatusFilter} onChange={(event) => setFactureStatusFilter(event.target.value)}>
                    <option value="all">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="validee">Validée</option>
                    <option value="rejetee">Rejetée</option>
                    <option value="payee">Payée</option>
                  </select>
                  <input type="date" value={factureDateFrom} onChange={(event) => setFactureDateFrom(event.target.value)} />
                  <input type="date" value={factureDateTo} onChange={(event) => setFactureDateTo(event.target.value)} />
                </div>
              }
            >
              {currentFactures.length ? (
                <div className="entity-list invoices-list">
                  {currentFactures.map((facture) => (
                    <article key={facture.id} className="invoice-card">
                      <div className="invoice-card-head">
                        <div>
                          <strong>{facture.numero}</strong>
                          <div className="muted">{facture.Client?.nom || '—'} · {formatDate(facture.date_creation || facture.created_at)}</div>
                        </div>
                        <div className="invoice-card-totals">
                          <span>{formatMoney(facture.total_ttc)}</span>
                          <StatusPill value={facture.statut} />
                        </div>
                      </div>
                      <div className="muted invoice-meta">
                        HT {formatMoney(facture.total_ht)} · TVA {formatMoney(facture.tva)} · Lignes {facture.lignes_facture?.length || 0}
                      </div>
                      <div className="row-actions invoice-card-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => downloadFacturePdf(facture)}>Télécharger PDF</button>
                      </div>
                      <InvoiceStatusEditor facture={facture} token={session.token} onSaved={() => loadAll()} notify={notify} role={session.user?.role} />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucune facture" message="Les nouvelles factures apparaîtront ici apres creation." />
              )}
              {factureTotalPages > 1 ? (
                <div className="pagination-bar">
                  <button className="btn btn-small btn-secondary" type="button" onClick={() => setFacturePage((current) => Math.max(1, current - 1))} disabled={facturePage === 1}>Précédent</button>
                  <span className="muted">Page {facturePage} / {factureTotalPages}</span>
                  <button className="btn btn-small btn-secondary" type="button" onClick={() => setFacturePage((current) => Math.min(factureTotalPages, current + 1))} disabled={facturePage === factureTotalPages}>Suivant</button>
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}

        {activeTab === 'parametres' ? (
          <div className="split-layout">
            <Panel title={editingParametreKey ? 'Modifier un parametre' : 'Nouveau parametre'} subtitle="Configuration systeme." actions={editingParametreKey ? <button className="btn btn-secondary" type="button" onClick={() => { setEditingParametreKey(null); setParametreForm(emptyParametre); }}>Annuler</button> : null}>
              <form className="form-grid" onSubmit={handleParametreSubmit}>
                <Field label="Cle">
                  <input value={parametreForm.cle} onChange={(event) => setParametreForm({ ...parametreForm, cle: event.target.value })} disabled={Boolean(editingParametreKey)} />
                </Field>
                <Field label="Valeur" wide>
                  <textarea rows="3" value={parametreForm.valeur} onChange={(event) => setParametreForm({ ...parametreForm, valeur: event.target.value })} />
                </Field>
                <Field label="Description" wide>
                  <textarea rows="2" value={parametreForm.description} onChange={(event) => setParametreForm({ ...parametreForm, description: event.target.value })} />
                </Field>
                <button className="btn" type="submit" disabled={!canManageParameters}> {canManageParameters ? 'Enregistrer' : 'Role admin requis'} </button>
              </form>
            </Panel>

            <Panel title="Parametres enregistrés" subtitle={`${parametres.length} clefs.`}>
              {parametres.length ? (
                <div className="entity-list">
                  {parametres.map((parametre) => (
                    <article key={parametre.id} className="entity-row parametre-row">
                      <div>
                        <strong>{parametre.cle}</strong>
                        <div className="muted">{parametre.description || '—'}</div>
                        <pre>{String(parametre.valeur)}</pre>
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => startEditParametre(parametre)} disabled={!canManageParameters}>Editer</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucun parametre" message="Ajoute les informations de l'entreprise ici." />
              )}
            </Panel>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
