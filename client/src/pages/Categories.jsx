import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field } from '../components/ui';

export function Categories() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [categories, setCategories] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    nom: '', taux_tva: '20.00'
  });

  const loadCategories = async () => {
    try {
      const data = await api('/api/categories', { token: session.token });
      setCategories(data);
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const validationSchema = Yup.object({
    nom: Yup.string().required('Le nom est requis'),
    taux_tva: Yup.number().min(0).max(100).required('Le taux TVA est requis')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await api(editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories', {
        method: editingCategoryId ? 'PUT' : 'POST',
        token: session.token,
        body: {
          nom: values.nom,
          taux_tva: Number(values.taux_tva || 0)
        }
      });
      notify('success', editingCategoryId ? 'Categorie mise à jour.' : 'Categorie créée.');
      setEditingCategoryId(null);
      resetForm();
      loadCategories();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (category) => {
    setEditingCategoryId(category.id);
    setInitialValues({
      nom: category.nom || '',
      taux_tva: String(category.taux_tva ?? '20.00')
    });
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setInitialValues({ nom: '', taux_tva: '20.00' });
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api(`/api/categories/${id}`, { method: 'DELETE', token: session.token });
      notify('success', 'Catégorie supprimée.');
      loadCategories();
    } catch (error) {
      notify('error', error.message);
    }
  };

  return (
    <div className="split-layout">
      <Panel 
        title={editingCategoryId ? 'Modifier une categorie' : 'Nouvelle categorie'} 
        subtitle="Classification des articles." 
        actions={editingCategoryId ? <button className="btn btn-secondary" onClick={cancelEdit}>Annuler</button> : null}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
            <Form className="form-grid">
              <Field label="Nom" error={touched.nom && errors.nom}>
                <input name="nom" value={values.nom} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Taux TVA (%)" error={touched.taux_tva && errors.taux_tva}>
                <input type="number" step="0.01" name="taux_tva" value={values.taux_tva} onChange={handleChange} onBlur={handleBlur} />
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

      <Panel title="Referentiel" subtitle="Toutes les categories.">
        <div className="list-group">
          {categories.map((category) => (
            <div key={category.id} className="list-item">
              <div>
                <strong>{category.nom}</strong>
                <div className="muted">TVA {category.taux_tva}%</div>
              </div>
              <div className="row-actions">
                <button className="btn btn-small btn-secondary" onClick={() => startEdit(category)}>Editer</button>
                <button className="btn btn-small btn-danger" onClick={() => deleteCategory(category.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
