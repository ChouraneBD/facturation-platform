import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function SignaturePad({ value, onChange }) {
  const padRef = useRef(null);

  const clear = () => {
    if (padRef.current) {
      padRef.current.clear();
      onChange('');
    }
  };

  const save = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onChange(padRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  return (
    <div className="signature-pad-container" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {value ? (
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={value} alt="Signature" style={{ maxHeight: '100px' }} />
          <button type="button" onClick={() => onChange('')} className="btn btn-small btn-danger" style={{ marginTop: '10px' }}>
            Refaire la signature
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SignatureCanvas
            ref={padRef}
            penColor="black"
            canvasProps={{ width: 400, height: 150, className: 'sigCanvas' }}
            onEnd={save}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
            <button type="button" onClick={clear} className="btn btn-small">
              Effacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
