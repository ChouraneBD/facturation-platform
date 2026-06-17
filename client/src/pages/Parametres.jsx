import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field } from '../components/ui';

export function Parametres() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [parametres, setParametres] = useState([]);
  const [editingParametreKey, setEditingParametreKey] = useState(null);

  const [initialValues, setInitialValues] = useState({
    cle: '', valeur: '', description: ''
  });

  const loadParametres = async () => {
    try {
      const data = await api('/api/parametres', { token: session.token });
      setParametres(data);
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => {
    loadParametres();
  }, []);

  const validationSchema = Yup.object({
    cle: Yup.string().required('La clé est requise'),
    valeur: Yup.string().required('La valeur est requise'),
    description: Yup.string()
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await api('/api/parametres', {
        method: 'PUT',
        token: session.token,
        body: values
      });
      notify('success', 'Parametre enregistré.');
      setEditingParametreKey(null);
      resetForm();
      loadParametres();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (param) => {
    setEditingParametreKey(param.cle);
    setInitialValues({
      cle: param.cle || '',
      valeur: param.valeur || '',
      description: param.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingParametreKey(null);
    setInitialValues({ cle: '', valeur: '', description: '' });
  };

  if (session?.user?.role !== 'admin') {
    return (
      <div className="access-denied card">
        <strong>Accès refusé</strong>
        <p className="muted">Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="split-layout">
      <Panel 
        title="Modifier un parametre" 
        subtitle="Configuration globale du systeme." 
        actions={editingParametreKey ? <button className="btn btn-secondary" onClick={cancelEdit}>Annuler</button> : null}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
            <Form className="form-stack">
              <Field label="Cle unique" error={touched.cle && errors.cle}>
                <input name="cle" value={values.cle} onChange={handleChange} onBlur={handleBlur} readOnly={!!editingParametreKey} style={editingParametreKey ? { backgroundColor: '#f1f5f9' } : {}} />
              </Field>
              <Field label="Valeur" error={touched.valeur && errors.valeur}>
                <input name="valeur" value={values.valeur} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Description" wide error={touched.description && errors.description}>
                <input name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <div className="form-actions wide">
                <button className="btn" type="submit" disabled={isSubmitting || !values.cle}>
                  {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Panel>

      <Panel title="Configuration" subtitle="Valeurs actuelles du systeme.">
        <div className="list-group">
          {parametres.map((param) => (
            <div key={param.cle} className="list-item">
              <div>
                <strong>{param.cle}</strong>
                <div className="muted">{param.description || 'Aucune description'}</div>
                <div style={{ marginTop: 4, fontFamily: 'monospace' }}>{param.valeur}</div>
              </div>
              <div className="row-actions">
                <button className="btn btn-small btn-secondary" onClick={() => startEdit(param)}>Editer</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
