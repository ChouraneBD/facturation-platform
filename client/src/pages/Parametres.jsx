import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { parametresService } from '../services/jsonService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field, PageHeader } from '../components/ui';

const COMPANY_KEYS = [
  { key: 'societe_nom', label: 'Nom de la société', field: 'societeNom' },
  { key: 'societe_tagline', label: 'Slogan', field: 'societeTagline' },
  { key: 'societe_adresse', label: 'Adresse', field: 'societeAdresse' },
  { key: 'societe_email', label: 'Email', field: 'societeEmail' },
  { key: 'societe_telephone', label: 'Téléphone', field: 'societeTelephone' },
  { key: 'devise', label: 'Devise (MAD, EUR, USD)', field: 'devise' }
];

export function Parametres() {
  const { session } = useAuth();
  const { notify } = useToast();
  const [parametres, setParametres] = useState([]);
  const [editingParametreKey, setEditingParametreKey] = useState(null);

  const [companyValues, setCompanyValues] = useState({
    societeNom: '',
    societeTagline: '',
    societeAdresse: '',
    societeEmail: '',
    societeTelephone: '',
    devise: 'MAD',
    logoBase64: ''
  });

  const [initialValues, setInitialValues] = useState({
    cle: '', valeur: '', description: ''
  });

  const loadParametres = async () => {
    try {
      const data = await parametresService.list(session.token);
      setParametres(data);
      const map = Object.fromEntries(data.map((p) => [p.cle, p.valeur]));
      setCompanyValues({
        societeNom: map.societe_nom || '',
        societeTagline: map.societe_tagline || '',
        societeAdresse: map.societe_adresse || '',
        societeEmail: map.societe_email || '',
        societeTelephone: map.societe_telephone || '',
        devise: map.devise || 'MAD',
        logoBase64: map.logo_base64 || ''
      });
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
      await parametresService.upsert(values, session.token);
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

  const saveCompanyProfile = async () => {
    try {
      await Promise.all(
        COMPANY_KEYS.map(({ key, field }) =>
          parametresService.upsert(
            { cle: key, valeur: companyValues[field] || '', description: `Profil entreprise — ${key}` },
            session.token
          )
        )
      );
      if (companyValues.logoBase64 !== undefined) {
        await parametresService.upsert(
          { cle: 'logo_base64', valeur: companyValues.logoBase64 || '', description: 'Logo entreprise' },
          session.token
        );
      }
      notify('success', 'Profil entreprise enregistré. Les PDF seront mis à jour.');
      loadParametres();
    } catch (error) {
      notify('error', error.message);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyValues((prev) => ({ ...prev, logoBase64: reader.result }));
    };
    reader.readAsDataURL(file);
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
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Personnalisez l'identité visuelle affichée sur les factures PDF et le tableau de bord."
      />

      <Panel title="Profil entreprise" subtitle="Logo, coordonnées et devise — utilisés sur tous les documents.">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Avatar
              src={companyValues.logoBase64 || undefined}
              sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontWeight: 700 }}
            >
              {companyValues.societeNom?.slice(0, 2)?.toUpperCase() || 'TP'}
            </Avatar>
            <Box>
              <Button variant="outlined" component="label" size="small">
                Importer un logo
                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
              </Button>
              {companyValues.logoBase64 ? (
                <Button size="small" color="inherit" sx={{ ml: 1 }} onClick={() => setCompanyValues((p) => ({ ...p, logoBase64: '' }))}>
                  Retirer
                </Button>
              ) : null}
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {COMPANY_KEYS.map(({ field, label }) => (
              <TextField
                key={field}
                label={label}
                value={companyValues[field]}
                onChange={(e) => setCompanyValues((prev) => ({ ...prev, [field]: e.target.value }))}
                fullWidth
                size="small"
              />
            ))}
          </Box>

          <Button variant="contained" onClick={saveCompanyProfile}>
            Enregistrer le profil entreprise
          </Button>
        </Stack>
      </Panel>

      <Divider sx={{ my: 2 }} />

      <div className="split-layout">
        <Panel
          title="Modifier un parametre avancé"
          subtitle="Configuration technique du système."
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
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: param.cle === 'logo_base64' ? 'inherit' : 'monospace' }}>
                    {param.cle === 'logo_base64'
                      ? (param.valeur ? 'Logo configuré' : 'Aucun logo')
                      : param.valeur}
                  </Typography>
                </div>
                <div className="row-actions">
                  <button className="btn btn-small btn-secondary" onClick={() => startEdit(param)}>Editer</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
