import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Field } from '../components/ui';

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
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const payload = { ...values, role: 'user' };
      if (authMode === 'login') {
        delete payload.nom;
        delete payload.role;
      }

      const result = await api(endpoint, {
        method: 'POST',
        body: payload
      });

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
    <main className="auth-shell">
      <section className="brand-panel card">
        <div className="eyebrow">Facturation Platform</div>
        <h1>Gestion de facturation professionnelle</h1>
        <p>
          Factures, clients, catalogue, signature numérique et notifications par email — plateforme PFA EMSI Casablanca.
        </p>
        <div className="brand-metrics">
          <div>
            <strong>PostgreSQL</strong>
            <span>Base SQL relationnelle</span>
          </div>
          <div>
            <strong>Email</strong>
            <span>Notifications automatiques</span>
          </div>
        </div>
      </section>

      <section className="card auth-panel">
        <div className="tabs auth-tabs">
          <button className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>Connexion</button>
          <button className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>Inscription</button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
            <Form className="form-stack">
              {authMode === 'register' ? (
                <Field label="Nom complet" error={touched.nom && errors.nom}>
                  <input
                    name="nom"
                    value={values.nom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nom"
                  />
                </Field>
              ) : null}

              <Field label="Email" error={touched.email && errors.email}>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@company.com"
                />
              </Field>

              <Field label="Mot de passe" error={touched.mot_de_passe && errors.mot_de_passe}>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={values.mot_de_passe}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                />
              </Field>

              <button className="btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Creer le compte'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="muted auth-footnote">Comptes admin créés par l'équipe. Notifications envoyées par email à chaque étape.</p>
      </section>
    </main>
  );
}
