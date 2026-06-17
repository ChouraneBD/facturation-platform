import { useState, useEffect, useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { api } from '../services/api';
import { calculateInvoiceTotals } from '../utils/invoiceCalculations';
import { generatePdfBlob } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Panel, Field, StatusPill, EmptyState, titleCase, blobToBase64 } from '../components/ui';
import { SignaturePad } from '../components/SignaturePad';
import { Download, Mail } from 'lucide-react';

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

const moneyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
function formatMoney(value) { return moneyFormatter.format(Number(value || 0)); }

const makeInvoiceLine = () => ({
  article_id: '',
  designation_snapshot: '',
  quantite: 1,
  prix_unitaire_applique: '',
  remise_pct: 0,
  tva_pct: 20
});

export function Factures() {
  const { session } = useAuth();
  const { notify } = useToast();
  
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  
  const [factureSearch, setFactureSearch] = useState('');
  const [factureStatusFilter, setFactureStatusFilter] = useState('all');
  const [factureDateFrom, setFactureDateFrom] = useState('');
  const [factureDateTo, setFactureDateTo] = useState('');
  const [facturePage, setFacturePage] = useState(1);

  const loadData = async () => {
    try {
      const [facturesData, clientsData, articlesData] = await Promise.all([
        api('/api/factures', { token: session.token }),
        api('/api/clients', { token: session.token }),
        api('/api/articles', { token: session.token })
      ]);
      setFactures(facturesData);
      setClients(clientsData);
      setArticles(articlesData);
    } catch (error) {
      notify('error', error.message);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredFactures = useMemo(() => {
    const search = normalizeText(factureSearch);
    return factures.filter((facture) => {
      if (factureStatusFilter !== 'all' && facture.statut !== factureStatusFilter) return false;
      if (factureDateFrom && new Date(facture.date_creation || facture.created_at) < new Date(factureDateFrom)) return false;
      if (factureDateTo && new Date(facture.date_creation || facture.created_at) > new Date(factureDateTo)) return false;
      if (!search) return true;
      const haystack = [facture.numero, facture.Client?.nom, facture.statut, facture.commentaire_admin].filter(Boolean).join(' ');
      return normalizeText(haystack).includes(search);
    });
  }, [factures, factureDateFrom, factureDateTo, factureSearch, factureStatusFilter]);

  const facturePageSize = 5;
  const factureTotalPages = Math.max(1, Math.ceil(filteredFactures.length / facturePageSize));
  const currentFactures = filteredFactures.slice((facturePage - 1) * facturePageSize, facturePage * facturePageSize);

  useEffect(() => { setFacturePage(1); }, [factureSearch, factureStatusFilter, factureDateFrom, factureDateTo]);

  const downloadFacturePdf = async (facture) => {
    try {
      const blob = await generatePdfBlob(facture);
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
      notify('error', "Erreur lors de la génération du PDF.");
    }
  };

  const initialInvoiceValues = {
    client_id: '',
    methode_calcul: 1,
    remise_globale_pct: 0,
    date_depot: '',
    date_encaissement: '',
    type_virement: '',
    signature_base64: '',
    commentaire_admin: '',
    lignes: [makeInvoiceLine()]
  };

  const invoiceValidationSchema = Yup.object({
    client_id: Yup.string().required('Client requis'),
    methode_calcul: Yup.number().required('Méthode de calcul requise'),
    lignes: Yup.array().of(
      Yup.object({
        designation_snapshot: Yup.string().required('Désignation requise'),
        quantite: Yup.number().min(1, 'Min 1').required('Qté requise'),
        prix_unitaire_applique: Yup.number().min(0).required('Prix requis'),
        tva_pct: Yup.number().min(0).max(100).required('TVA requise')
      })
    ).min(1, 'Au moins une ligne est requise'),
    signature_base64: Yup.string().required('La signature numérique est requise')
  });

  const handleInvoiceSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        ...values,
        client_id: Number(values.client_id),
        methode_calcul: Number(values.methode_calcul),
        remise_globale_pct: Number(values.remise_globale_pct || 0),
        lignes: values.lignes.map(line => ({
          ...line,
          article_id: line.article_id ? Number(line.article_id) : null,
          quantite: Number(line.quantite),
          prix_unitaire_applique: Number(line.prix_unitaire_applique),
          remise_pct: Number(line.remise_pct || 0),
          tva_pct: Number(line.tva_pct || 20)
        }))
      };

      const result = await api('/api/factures', {
        method: 'POST',
        token: session.token,
        body: payload
      });

      notify('success', result.message || 'Facture créée. Notifications email envoyées.');
      resetForm();
      loadData();
    } catch (error) {
      notify('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (facture, nextStatus, discount, comment, dateEncaissement, typeVirement) => {
    try {
      if (nextStatus === 'validee' || nextStatus === 'rejetee') {
        let pdfBase64 = null;
        if (nextStatus === 'validee') {
          const pdfBlob = await generatePdfBlob(facture);
          pdfBase64 = await blobToBase64(pdfBlob);
        }

        const result = await api(`/api/factures/${facture.id}/validation`, {
          method: 'PATCH',
          token: session.token,
          body: { statut: nextStatus, pdfBase64, commentaire_admin: comment || null }
        });

        notify('success', result.message || `Facture ${facture.numero} traitée. Notification email envoyée.`);
      } else {
        await api(`/api/factures/${facture.id}/remise-globale`, {
          method: 'PATCH',
          token: session.token,
          body: { remise_globale_pct: Number(discount || 0) }
        });

        const result = await api(`/api/factures/${facture.id}/statut`, {
          method: 'PATCH',
          token: session.token,
          body: {
            statut: nextStatus,
            commentaire_admin: comment,
            date_encaissement: dateEncaissement || null,
            type_virement: typeVirement || null
          }
        });
        notify('success', result.message || `Facture ${facture.numero} mise à jour.`);
      }
      loadData();
    } catch (error) {
      notify('error', error.message);
    }
  };

  return (
    <div className="split-layout">
      {session.user?.role !== 'admin' && (
        <Panel title="Nouvelle facture" subtitle="Création, signature et notification email automatique.">
          <Formik
            initialValues={initialInvoiceValues}
            validationSchema={invoiceValidationSchema}
            onSubmit={handleInvoiceSubmit}
          >
            {({ values, handleChange, handleBlur, setFieldValue, isSubmitting, errors, touched }) => {
              const preview = calculateInvoiceTotals({
                lines: values.lignes,
                methodeCalcul: values.methode_calcul,
                remiseGlobalePct: values.remise_globale_pct
              });

              return (
                <Form className="form-stack">
                  <div className="form-grid">
                    <Field label="Client" error={touched.client_id && errors.client_id}>
                      <select name="client_id" value={values.client_id} onChange={handleChange} onBlur={handleBlur}>
                        <option value="">Selectionner un client</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    </Field>
                    <Field label="Methode de calcul" error={touched.methode_calcul && errors.methode_calcul}>
                      <select name="methode_calcul" value={values.methode_calcul} onChange={handleChange} onBlur={handleBlur}>
                        <option value="1">1. Remise puis TVA en cascade</option>
                        <option value="2">2. Remise sur TTC</option>
                        <option value="3">3. Remise globale sur HT total</option>
                        <option value="4">4. Simple HT + TVA (sans remise globale)</option>
                      </select>
                    </Field>
                    <Field label="Remise globale %" error={touched.remise_globale_pct && errors.remise_globale_pct}>
                      <input type="number" step="0.01" name="remise_globale_pct" value={values.remise_globale_pct} onChange={handleChange} onBlur={handleBlur} />
                    </Field>
                  </div>

                  <FieldArray name="lignes">
                    {({ push, remove }) => (
                      <div className="invoice-lines-section">
                        <h4>Lignes de facture</h4>
                        {values.lignes.map((line, index) => {
                          const lineErrors = errors.lignes?.[index] || {};
                          const lineTouched = touched.lignes?.[index] || {};
                          return (
                            <div key={index} className="invoice-line-row">
                              <select 
                                value={line.article_id} 
                                onChange={(e) => {
                                  const articleId = e.target.value;
                                  const article = articles.find(a => String(a.id) === articleId);
                                  setFieldValue(`lignes.${index}.article_id`, articleId);
                                  if (article) {
                                    setFieldValue(`lignes.${index}.designation_snapshot`, article.designation);
                                    setFieldValue(`lignes.${index}.prix_unitaire_applique`, article.prix_unitaire);
                                    setFieldValue(`lignes.${index}.tva_pct`, article.Category?.taux_tva || 20);
                                  }
                                }}
                              >
                                <option value="">Choisir un article</option>
                                {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                              </select>
                              
                              <input 
                                placeholder="Désignation libre" 
                                name={`lignes.${index}.designation_snapshot`} 
                                value={line.designation_snapshot} 
                                onChange={handleChange} 
                                className={lineErrors.designation_snapshot && lineTouched.designation_snapshot ? 'error-input' : ''}
                              />
                              <input 
                                type="number" placeholder="Qté" 
                                name={`lignes.${index}.quantite`} 
                                value={line.quantite} 
                                onChange={handleChange} 
                                className={lineErrors.quantite && lineTouched.quantite ? 'error-input' : ''}
                              />
                              <input 
                                type="number" step="0.01" placeholder="Prix Unitaire" 
                                name={`lignes.${index}.prix_unitaire_applique`} 
                                value={line.prix_unitaire_applique} 
                                onChange={handleChange} 
                                className={lineErrors.prix_unitaire_applique && lineTouched.prix_unitaire_applique ? 'error-input' : ''}
                              />
                              <input 
                                type="number" step="0.01" placeholder="Remise %" 
                                name={`lignes.${index}.remise_pct`} 
                                value={line.remise_pct} 
                                onChange={handleChange} 
                              />
                              <input 
                                type="number" step="0.01" placeholder="TVA %" 
                                name={`lignes.${index}.tva_pct`} 
                                value={line.tva_pct} 
                                onChange={handleChange} 
                                className={lineErrors.tva_pct && lineTouched.tva_pct ? 'error-input' : ''}
                              />
                              <button type="button" className="btn btn-small btn-danger" onClick={() => remove(index)}>X</button>
                            </div>
                          );
                        })}
                        <button type="button" className="btn btn-small btn-secondary" onClick={() => push(makeInvoiceLine())}>+ Ajouter une ligne</button>
                      </div>
                    )}
                  </FieldArray>

                  <div className="invoice-totals card">
                    <div className="total-row"><span>Total HT</span><strong>{formatMoney(preview.total_ht)}</strong></div>
                    <div className="total-row"><span>TVA</span><strong>{formatMoney(preview.tva)}</strong></div>
                    <div className="total-row highlight"><span>Total TTC</span><strong>{formatMoney(preview.total_ttc)}</strong></div>
                  </div>

                  <Field label="Signature numérique" wide error={touched.signature_base64 && errors.signature_base64}>
                    <SignaturePad 
                      value={values.signature_base64} 
                      onChange={(val) => setFieldValue('signature_base64', val)} 
                    />
                  </Field>

                  <button className="btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer la facture'}
                  </button>
                </Form>
              );
            }}
          </Formik>
        </Panel>
      )}

      <Panel title="Liste des factures" subtitle="Suivi, validation et notifications email.">
        <div className="filter-bar">
          <input type="search" placeholder="Rechercher..." value={factureSearch} onChange={e => setFactureSearch(e.target.value)} />
          <select value={factureStatusFilter} onChange={e => setFactureStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="validee">Validée</option>
            <option value="payee">Payée</option>
            <option value="rejetee">Rejetée</option>
          </select>
          <input type="date" value={factureDateFrom} onChange={e => setFactureDateFrom(e.target.value)} />
          <input type="date" value={factureDateTo} onChange={e => setFactureDateTo(e.target.value)} />
        </div>

        <div className="list-group">
          {currentFactures.map((facture) => (
            <div key={facture.id} className="list-item invoice-item">
              <div className="invoice-item-header">
                <div>
                  <strong>{facture.numero}</strong>
                  <div className="muted">{facture.Client?.nom} • {formatDate(facture.date_creation || facture.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatMoney(facture.total_ttc)}</div>
                  <StatusPill value={facture.statut} />
                </div>
              </div>

              <div className="invoice-item-actions">
                <button className="btn btn-small btn-secondary btn-icon" onClick={() => downloadFacturePdf(facture)}>
                  <Download size={14} /> PDF
                </button>
                {facture.signature_base64 ? (
                  <span className="signature-thumb" title="Signature enregistrée">
                    <img src={facture.signature_base64} alt="Signature" />
                  </span>
                ) : null}
              </div>

              <div className="invoice-item-editor">
                <Editor 
                  facture={facture} 
                  role={session.user?.role} 
                  onAction={(status, discount, comment, dateEnc, typeVir) => handleValidate(facture, status, discount, comment, dateEnc, typeVir)} 
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="pagination">
          <button className="btn btn-small" disabled={facturePage === 1} onClick={() => setFacturePage(p => p - 1)}>Precedent</button>
          <span className="muted">Page {facturePage} sur {factureTotalPages}</span>
          <button className="btn btn-small" disabled={facturePage >= factureTotalPages} onClick={() => setFacturePage(p => p + 1)}>Suivant</button>
        </div>
      </Panel>
    </div>
  );
}

function Editor({ facture, role, onAction }) {
  const [status, setStatus] = useState(facture.statut);
  const [discount, setDiscount] = useState(String(facture.remise_globale_pct ?? 0));
  const [comment, setComment] = useState(facture.commentaire_admin || '');
  const [dateEncaissement, setDateEncaissement] = useState(facture.date_encaissement || '');
  const [typeVirement, setTypeVirement] = useState(facture.type_virement || '');

  if (role === 'admin') {
    return (
      <div className="invoice-editor-admin">
        <input type="number" min="0" max="100" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Remise %" />
        <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire (envoyé par email)" />
        <button className="btn btn-small btn-icon" onClick={() => onAction('validee', discount, comment, null, null)}>
          <Mail size={14} /> Valider & notifier
        </button>
        <button className="btn btn-small btn-danger" onClick={() => onAction('rejetee', discount, comment, null, null)}>Rejeter & notifier</button>
      </div>
    );
  }

  return (
    <div className="invoice-editor-user">
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value={facture.statut}>{titleCase(facture.statut)}</option>
        <option value="payee">Payée</option>
      </select>
      <input type="date" value={dateEncaissement} onChange={e => setDateEncaissement(e.target.value)} title="Date encaissement" />
      <input type="text" value={typeVirement} onChange={e => setTypeVirement(e.target.value)} placeholder="Type virement" />
      <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire" />
      <button className="btn btn-small" onClick={() => onAction(status, discount, comment, dateEncaissement, typeVirement)}>Mettre à jour</button>
    </div>
  );
}
