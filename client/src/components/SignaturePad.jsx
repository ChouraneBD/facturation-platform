import { forwardRef, useImperativeHandle, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

function readSignature(pad) {
  if (!pad || pad.isEmpty()) return '';
  try {
    return pad.getTrimmedCanvas().toDataURL('image/png');
  } catch {
    return pad.toDataURL('image/png');
  }
}

export const SignaturePad = forwardRef(function SignaturePad(
  { value, onChange, onAvailabilityChange },
  ref
) {
  const padRef = useRef(null);

  const exportSignature = () => {
    if (value) return value;
    return readSignature(padRef.current);
  };

  useImperativeHandle(ref, () => ({
    exportSignature,
    isEmpty: () => !value && (padRef.current?.isEmpty() ?? true)
  }));

  const notifyAvailability = (pad) => {
    const available = Boolean(value) || Boolean(readSignature(pad));
    onAvailabilityChange?.(available);
  };

  const clear = () => {
    padRef.current?.clear();
    onChange('');
    onAvailabilityChange?.(false);
  };

  const save = () => {
    const data = readSignature(padRef.current);
    if (data) {
      onChange(data);
    }
    notifyAvailability(padRef.current);
  };

  return (
    <div
      className="signature-pad-container"
      style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SignatureCanvas
          ref={padRef}
          penColor="black"
          canvasProps={{ width: 400, height: 150, className: 'sigCanvas', style: { width: '100%', height: 150 } }}
          onEnd={save}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #cbd5e1'
          }}
        >
          {value ? (
            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>Signature enregistrée</span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Signez dans la zone ci-dessus</span>
          )}
          <button type="button" onClick={clear} className="btn btn-small">
            Effacer
          </button>
        </div>
      </div>
    </div>
  );
});
