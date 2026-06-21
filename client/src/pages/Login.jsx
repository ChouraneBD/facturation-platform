import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  FileText,
  Lock,
  Mail,
  PenLine,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/jsonService';
import { AppLogo } from '../components/AppLogo';

const FEATURES = [
  { icon: FileText, label: 'Génération de factures PDF' },
  { icon: PenLine, label: 'Signature numérique & QR code' },
  { icon: BellRing, label: 'Alertes workflow en temps réel' },
  { icon: BarChart3, label: 'Tableau de bord analytique' }
];

function LoginHeroHeader({ compact = false, sx }) {
  const logoSize = compact ? 40 : 46;
  const retourLinkSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.875,
    color: alpha('#fff', 0.72),
    textDecoration: 'none',
    fontSize: '0.925rem',
    fontWeight: 500,
    transition: 'color 0.2s ease',
    '&:hover': { color: '#fff' },
    '& .retour-icon': { transition: 'transform 0.2s ease' },
    '&:hover .retour-icon': { transform: 'translateX(-3px)' }
  };

  return (
    <Box
      sx={{
        width: '100%',
        pb: compact ? 0 : 4,
        mb: compact ? 0 : 7,
        borderBottom: compact ? 'none' : `1px solid ${alpha('#fff', 0.14)}`,
        ...sx
      }}
    >
      <Stack spacing={compact ? 2 : 2.5}>
        <AppLogo size={logoSize} light textVariant="h5" />

        <Box component={Link} to="/" sx={retourLinkSx}>
          <ArrowLeft size={16} strokeWidth={2.25} className="retour-icon" />
          Retour au site
        </Box>
      </Stack>
    </Box>
  );
}

function LoginHeroPanel({ theme }) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        justifyContent: 'flex-start',
        px: { lg: 7, xl: 9 },
        pt: { lg: 8 },
        pb: 8,
        color: '#fff',
        bgcolor: theme.palette.primary.main,
        backgroundImage: `radial-gradient(circle at 85% 15%, ${alpha(theme.palette.secondary.main, 0.18)} 0%, transparent 42%)`
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 460, width: '100%' }}>
        <LoginHeroHeader />

        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            mb: 4,
            letterSpacing: '-0.03em',
            lineHeight: 1.12,
            fontSize: { lg: '2.35rem', xl: '2.55rem' }
          }}
        >
          La facturation pro,
          <br />
          simplifiée.
        </Typography>

        <Stack spacing={2.25}>
          {FEATURES.map(({ icon: Icon, label }) => (
            <Stack key={label} direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha('#fff', 0.14),
                  flexShrink: 0
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </Box>
              <Typography fontWeight={600} sx={{ opacity: 0.96, fontSize: '0.98rem' }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export function Login() {
  const theme = useTheme();
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1fr' },
        bgcolor: 'background.default'
      }}
    >
      {/* Hero panel — desktop only */}
      <LoginHeroPanel theme={theme} />

      {/* Mobile hero strip */}
      <Box
        sx={{
          display: { xs: 'flex', lg: 'none' },
          flexDirection: 'column',
          alignItems: 'flex-start',
          px: 2.5,
          pt: 3,
          pb: 3.5,
          bgcolor: 'primary.dark',
          color: '#fff'
        }}
      >
        <LoginHeroHeader compact />
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: { xs: 'center', lg: 'flex-start' },
          px: { xs: 2, sm: 4, lg: 6 },
          pt: { xs: 4, lg: 8 },
          pb: { xs: 4, lg: 6 }
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)'
          }}
        >
          <Typography variant="h5" fontWeight={800} gutterBottom>
            {authMode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {authMode === 'login'
              ? 'Accédez à votre espace de facturation.'
              : 'Inscrivez-vous pour créer et suivre vos factures.'}
          </Typography>

          <Tabs
            value={authMode}
            onChange={(_, value) => setAuthMode(value)}
            sx={{
              mb: 3,
              minHeight: 42,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              borderRadius: 2.5,
              p: 0.5,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 38,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                flex: 1
              },
              '& .Mui-selected': {
                bgcolor: 'background.paper',
                color: 'primary.main',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.12)'
              }
            }}
          >
            <Tab value="login" label="Connexion" disableRipple />
            <Tab value="register" label="Inscription" disableRipple />
          </Tabs>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
              <Form>
                <Stack spacing={2.25}>
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} color="#64748b" />
                          </InputAdornment>
                        )
                      }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} color="#64748b" />
                        </InputAdornment>
                      )
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} color="#64748b" />
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      mt: 1,
                      py: 1.4,
                      fontSize: '1rem',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                      }
                    }}
                  >
                    {isSubmitting ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>

          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: '1px dashed',
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }}
          >
            <Typography variant="caption" fontWeight={700} color="primary.main" display="block" sx={{ mb: 1.5 }}>
              Comptes de démonstration
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                Admin : <strong>admin@test.com</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User : <strong>client@test.com</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mot de passe : <strong>password123</strong>
              </Typography>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.6, mt: 2.5 }}>
            Comptes administrateur créés par l&apos;équipe.
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
