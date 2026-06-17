import { useState, useEffect, useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field } from '../components/ui';

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

export function Articles() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleAvailability, setArticleAvailability] = useState('all');

  const [initialValues, setInitialValues] = useState({
    designation: '', prix_unitaire: '', categorie_id: '', actif: true
  });

  const loadData = async () => {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        api('/api/articles', { token: session.token }),
        api('/api/categories', { token: session.token })
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredArticles = useMemo(() => {
    const search = normalizeText(articleSearch);
    return articles
      .filter((article) => {
        if (articleAvailability === 'active' && !article.actif) return false;
        if (articleAvailability === 'inactive' && article.actif) return false;
        if (!search) return true;

        const categoryName = article.Category?.nom || '';
        return [article.designation, categoryName, String(article.prix_unitaire || ''), String(article.id || '')]
          .some((field) => normalizeText(field).includes(search));
      })
      .sort((left, right) => left.designation.localeCompare(right.designation));
  }, [articles, articleAvailability, articleSearch]);

  const validationSchema = Yup.object({
    designation: Yup.string().required('La désignation est requise'),
    prix_unitaire: Yup.number().min(0, 'Doit être positif').required('Le prix est requis'),
    categorie_id: Yup.string().required('La catégorie est requise'),
    actif: Yup.boolean()
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await api(editingArticleId ? `/api/articles/${editingArticleId}` : '/api/articles', {
        method: editingArticleId ? 'PUT' : 'POST',
        token: session.token,
        body: {
          designation: values.designation,
          prix_unitaire: Number(values.prix_unitaire || 0),
          categorie_id: values.categorie_id ? Number(values.categorie_id) : null,
          actif: Boolean(values.actif)
        }
      });
      notify('success', editingArticleId ? 'Article mis à jour.' : 'Article créé.');
      setEditingArticleId(null);
      resetForm();
      loadData();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (article) => {
    setEditingArticleId(article.id);
    setInitialValues({
      designation: article.designation || '',
      prix_unitaire: String(article.prix_unitaire ?? ''),
      categorie_id: article.categorie_id ? String(article.categorie_id) : '',
      actif: Boolean(article.actif)
    });
  };

  const cancelEdit = () => {
    setEditingArticleId(null);
    setInitialValues({ designation: '', prix_unitaire: '', categorie_id: '', actif: true });
  };

  const deleteArticle = async (id) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
      await api(`/api/articles/${id}`, { method: 'DELETE', token: session.token });
      notify('success', 'Article supprimé.');
      loadData();
    } catch (error) {
      notify('error', error.message);
    }
  };

  return (
    <div className="split-layout">
      <Panel 
        title={editingArticleId ? 'Modifier un article' : 'Nouvel article'} 
        subtitle="Catalogue de produits et services." 
        actions={editingArticleId ? <button className="btn btn-secondary" onClick={cancelEdit}>Annuler</button> : null}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
            <Form className="form-grid">
              <Field label="Designation" wide error={touched.designation && errors.designation}>
                <input name="designation" value={values.designation} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Prix unitaire HT" error={touched.prix_unitaire && errors.prix_unitaire}>
                <input type="number" step="0.01" name="prix_unitaire" value={values.prix_unitaire} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Categorie" error={touched.categorie_id && errors.categorie_id}>
                <select name="categorie_id" value={values.categorie_id} onChange={handleChange} onBlur={handleBlur}>
                  <option value="">Selectionner...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </Field>
              <Field label="Disponibilite" wide>
                <label className="checkbox">
                  <input type="checkbox" name="actif" checked={values.actif} onChange={handleChange} onBlur={handleBlur} />
                  Article actif et disponible a la facturation
                </label>
              </Field>
              <div className="form-actions wide">
                <button className="btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Panel>

      <Panel title="Catalogue" subtitle="Tous les articles enregistres.">
        <div className="filter-bar">
          <input type="search" placeholder="Rechercher..." value={articleSearch} onChange={(event) => setArticleSearch(event.target.value)} />
          <select value={articleAvailability} onChange={(event) => setArticleAvailability(event.target.value)}>
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
        <div className="list-group">
          {filteredArticles.map((article) => (
            <div key={article.id} className={`list-item ${!article.actif ? 'inactive-item' : ''}`}>
              <div>
                <strong>{article.designation}</strong>
                <div className="muted">{article.Category?.nom || 'Sans categorie'} • {article.prix_unitaire} EUR</div>
              </div>
              <div className="row-actions">
                <button className="btn btn-small btn-secondary" onClick={() => startEdit(article)}>Editer</button>
                <button className="btn btn-small btn-danger" onClick={() => deleteArticle(article.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
