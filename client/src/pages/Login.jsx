import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/jsonService';
import { AppLogo } from '../components/AppLogo';
import { APP_NAME, APP_TAGLINE } from '../config/branding';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

export function Login() {
  const [authMode, setAuthMode] = useState('login');
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const initialValues = {
    nom: '',
    email: '',
    mot_de_passe: ''
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Email invalide').required('L\'email est requis'),
    mot_de_passe: Yup.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').required('Le mot de passe est requis'),
    ...(authMode === 'register' && {
      nom: Yup.string().required('Le nom est requis')
    })
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = { ...values, role: 'user' };
      if (authMode === 'login') {
        delete payload.nom;
        delete payload.role;
      }

      const result = authMode === 'login'
        ? await authService.login(payload)
        : await authService.register(payload);

      login(result);
      notify('success', result.message || 'Connexion réussie.');
      navigate(redirectUrl);
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { md: '1.1fr 1fr' }, gap: 3, p: { xs: 2, md: 4 }, alignItems: 'center' }}>
      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', height: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 2 }}>
            <AppLogo size={56} subtitle={APP_TAGLINE} light />
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 1, mb: 2 }}>
            Bienvenue sur {APP_NAME}
          </Typography>
          <Typography sx={{ opacity: 0.95, mb: 3 }}>
            Factures, clients, catalogue, signature numérique et alertes workflow — votre plateforme de facturation tout-en-un.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box>
              <Typography fontWeight={700}>API REST</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Express + PostgreSQL</Typography>
            </Box>
            <Box>
              <Typography fontWeight={700}>Alertes workflow</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Notifications en base de données</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Tabs value={authMode} onChange={(_, value) => setAuthMode(value)} sx={{ mb: 3 }}>
            <Tab value="login" label="Connexion" />
            <Tab value="register" label="Inscription" />
          </Tabs>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
              <Form>
                <Stack spacing={2}>
                  {authMode === 'register' ? (
                    <TextField
                      name="nom"
                      label="Nom complet"
                      value={values.nom}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.nom && errors.nom)}
                      helperText={touched.nom && errors.nom}
                      fullWidth
                    />
                  ) : null}

                  <TextField
                    type="email"
                    name="email"
                    label="Email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                    fullWidth
                  />

                  <TextField
                    type="password"
                    name="mot_de_passe"
                    label="Mot de passe"
                    value={values.mot_de_passe}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.mot_de_passe && errors.mot_de_passe)}
                    helperText={touched.mot_de_passe && errors.mot_de_passe}
                    fullWidth
                  />

                  <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Comptes admin créés par l'équipe. Notifications et alertes à chaque étape du workflow.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
