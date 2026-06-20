import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { titleCase } from './ui';

const STEPS = [
  { key: 'en_attente', label: 'Créée' },
  { key: 'validee', label: 'Validée' },
  { key: 'payee', label: 'Payée' }
];

function getActiveStep(statut) {
  if (statut === 'rejetee') return -1;
  if (statut === 'payee') return 2;
  if (statut === 'validee') return 1;
  return 0;
}

export function WorkflowStepper({ statut, compact = false }) {
  if (statut === 'rejetee') {
    return (
      <Box sx={{ py: compact ? 0.5 : 1 }}>
        <Typography variant="caption" color="error.main" fontWeight={700}>
          Facture rejetée — workflow interrompu
        </Typography>
      </Box>
    );
  }

  const activeStep = getActiveStep(statut);

  return (
    <Stepper
      activeStep={activeStep}
      alternativeLabel={!compact}
      sx={{
        py: compact ? 0.5 : 1,
        '& .MuiStepLabel-label': { fontSize: compact ? '0.7rem' : '0.78rem' }
      }}
    >
      {STEPS.map((step) => (
        <Step key={step.key} completed={activeStep > STEPS.indexOf(step)}>
          <StepLabel>{step.label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export function workflowLabel(statut) {
  return titleCase(statut);
}
