import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { clientsService } from '../services/jsonService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PageHeader, Panel, Field } from '../components/ui';
import { Box } from '@mui/material';

const emptyProfile = { nom: '', email: '', tel: '', adresse: '', ville: '' };

const validationSchema = Yup.object({
  nom: Yup.string().required('Le nom est requis'),
  email: Yup.string().email('Email invalide').required('L\'email est requis'),
  tel: Yup.string().required('Le téléphone est requis'),
  ville: Yup.string().required('La ville est requise'),
  adresse: Yup.string().required('L\'adresse est requise')
});

function ClientForm({ initialValues, editingClientId, onSubmit, onCancel, emailReadOnly = false }) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
        <Form className="form-grid">
          <Field label="Nom" error={touched.nom && errors.nom}>
            <input name="nom" value={values.nom} onChange={handleChange} onBlur={handleBlur} />
          </Field>
          <Field label="Email" error={touched.email && errors.email}>
            <input
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              readOnly={emailReadOnly}
              disabled={emailReadOnly}
            />
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
            {onCancel ? (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Annuler
              </button>
            ) : null}
            <button className="btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde...' : editingClientId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function MyProfile() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [profileId, setProfileId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    ...emptyProfile,
    email: session?.user?.email || '',
    nom: session?.user?.nom || ''
  });

  const loadProfile = async () => {
    try {
      const data = await clientsService.list(session.token);
      const profile = data[0];

      if (profile) {
        setProfileId(profile.id);
        setInitialValues({
          nom: profile.nom || '',
          email: profile.email || session.user.email,
          tel: profile.tel || '',
          adresse: profile.adresse || '',
          ville: profile.ville || ''
        });
      }
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (profileId) {
        await clientsService.update(profileId, values, session.token);
      } else {
        const created = await clientsService.create(values, session.token);
        setProfileId(created.client?.id || created.id);
      }
      notify('success', 'Vos informations ont été enregistrées.');
      loadProfile();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <PageHeader
        title="Mon profil"
        subtitle="Consultez et mettez à jour vos informations utilisées sur vos factures."
      />
      <Panel
        title={profileId ? 'Mes informations' : 'Compléter mon profil'}
        subtitle="Ces données apparaissent sur vos factures et documents."
      >
        <ClientForm
          initialValues={initialValues}
          editingClientId={profileId}
          onSubmit={handleSubmit}
          emailReadOnly
        />
      </Panel>
    </Box>
  );
}

function AdminClients() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [clients, setClients] = useState([]);
  const [editingClientId, setEditingClientId] = useState(null);
  const [initialValues, setInitialValues] = useState(emptyProfile);

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
    setInitialValues(emptyProfile);
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
    <>
      <PageHeader title="Clients" subtitle="Gestion de l'annuaire des tiers." />
      <div className="split-layout">
        <Panel
          title={editingClientId ? 'Modifier un client' : 'Nouveau client'}
          subtitle="Gestion des tiers."
          actions={editingClientId ? <button className="btn btn-secondary" onClick={cancelEdit}>Annuler</button> : null}
        >
          <ClientForm
            initialValues={initialValues}
            editingClientId={editingClientId}
            onSubmit={handleSubmit}
            onCancel={editingClientId ? cancelEdit : null}
          />
        </Panel>

        <Panel title="Annuaire" subtitle="Tous les clients enregistrés.">
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
    </>
  );
}

export function UserProfile() {
  return <MyProfile />;
}

export function Clients() {
  return <AdminClients />;
}
