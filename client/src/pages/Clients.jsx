import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { clientsService } from '../services/jsonService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field } from '../components/ui';

export function Clients() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [clients, setClients] = useState([]);
  const [editingClientId, setEditingClientId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    nom: '', email: '', tel: '', adresse: '', ville: ''
  });

  const loadClients = async () => {
    try {
      const data = await clientsService.list(session.token);
      setClients(data);
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const validationSchema = Yup.object({
    nom: Yup.string().required('Le nom est requis'),
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    tel: Yup.string().required('Le téléphone est requis'),
    ville: Yup.string().required('La ville est requise'),
    adresse: Yup.string().required('L\'adresse est requise')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingClientId) {
        await clientsService.update(editingClientId, values, session.token);
      } else {
        await clientsService.create(values, session.token);
      }
      notify('success', editingClientId ? 'Client mis à jour.' : 'Client créé.');
      setEditingClientId(null);
      resetForm();
      loadClients();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (client) => {
    setEditingClientId(client.id);
    setInitialValues({
      nom: client.nom || '',
      email: client.email || '',
      tel: client.tel || '',
      adresse: client.adresse || '',
      ville: client.ville || ''
    });
  };

  const cancelEdit = () => {
    setEditingClientId(null);
    setInitialValues({ nom: '', email: '', tel: '', adresse: '', ville: '' });
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try {
      await clientsService.remove(id, session.token);
      notify('success', 'Client supprimé.');
      loadClients();
    } catch (error) {
      notify('error', error.message);
    }
  };

  return (
    <div className="split-layout">
      <Panel 
        title={editingClientId ? 'Modifier un client' : 'Nouveau client'} 
        subtitle="Gestion des tiers." 
        actions={editingClientId ? <button className="btn btn-secondary" onClick={cancelEdit}>Annuler</button> : null}
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
              <Field label="Email" error={touched.email && errors.email}>
                <input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Telephone" error={touched.tel && errors.tel}>
                <input name="tel" value={values.tel} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Ville" error={touched.ville && errors.ville}>
                <input name="ville" value={values.ville} onChange={handleChange} onBlur={handleBlur} />
              </Field>
              <Field label="Adresse" wide error={touched.adresse && errors.adresse}>
                <input name="adresse" value={values.adresse} onChange={handleChange} onBlur={handleBlur} />
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

      <Panel title="Annuaire" subtitle="Tous les clients enregistres.">
        <div className="list-group">
          {clients.map((client) => (
            <div key={client.id} className="list-item">
              <div>
                <strong>{client.nom}</strong>
                <div className="muted">{client.email} • {client.tel}</div>
              </div>
              <div className="row-actions">
                <button className="btn btn-small btn-secondary" onClick={() => startEdit(client)}>Editer</button>
                <button className="btn btn-small btn-danger" onClick={() => deleteClient(client.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
