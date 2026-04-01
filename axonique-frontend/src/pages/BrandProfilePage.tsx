import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { authService } from '../services/authService';
import type { BrandProfile } from '../types';
import './BrandProfilePage.css';

const API = '' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '';

const isValidImageUrl = (url: string) =>
  !url || url.startsWith('data:image') || /\.(png|jpg|jpeg|webp)(\?.*)?$/i.test(url);

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  previewClass?: string;
}

function ImagePickerField({ label, value, onChange, previewClass }: ImagePickerFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setReading(false);
    };
    reader.onerror = () => setReading(false);
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-picked
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="bp-image-picker-row">
        <input
          value={value.startsWith('data:') ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://...image.png"
          className="bp-url-input"
        />
        <button
          type="button"
          className="pm-btn pm-btn--ghost bp-browse-btn"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
        >
          {reading ? 'Reading...' : '📁 Browse file'}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {value && !isValidImageUrl(value) && (
        <span className="bp-warning">⚠️ URL should end in .png, .jpg, .jpeg, or .webp</span>
      )}
      {value && isValidImageUrl(value) && (
        <div className={`bp-preview ${previewClass || ''}`}>
          <img src={value} alt={`${label} preview`} onError={e => (e.currentTarget.style.display = 'none')} />
        </div>
      )}
    </div>
  );
}

export default function BrandProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [logoUrl, setLogoUrl] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [discountBannerText, setDiscountBannerText] = useState('');
  const [discountBannerActive, setDiscountBannerActive] = useState(false);
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [policies, setPolicies] = useState('');

  const headers = { ...authService.getAuthHeader(), 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    fetch(`${API}/api/brand`)
      .then(r => r.json())
      .then((d: { data: BrandProfile }) => {
        const p = d.data;
        if (!p) return;
        setLogoUrl(p.logoUrl || '');
        setHeroBannerUrl(p.heroBannerUrl || '');
        setDiscountBannerText(p.discountBannerText || '');
        setDiscountBannerActive(p.discountBannerActive);
        setMission(p.mission || '');
        setVision(p.vision || '');
        setPolicies(p.policies || '');
      })
      .catch(() => showToast('Failed to load brand profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/brand`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ logoUrl, heroBannerUrl, discountBannerText, discountBannerActive, mission, vision, policies }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Brand profile updated — changes are now live');
      } else {
        showToast('Save failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {toast && <div className={`admin-toast admin-toast--${toastType}`}>{toast}</div>}
        <div className="admin-content">
          <h1 className="admin-page-title">Brand Profile</h1>
          <p className="admin-page-subtitle">Manage your public brand settings, imagery and copy</p>

          {loading ? (
            <div className="skeleton" style={{ height: 400, borderRadius: 8 }} />
          ) : (
            <div className="bp-sections">
              {/* Visual Assets */}
              <section className="bp-section">
                <h2 className="bp-section-title">🖼️ Visual Assets</h2>
                <div className="bp-grid">
                  <ImagePickerField
                    label="Logo URL"
                    value={logoUrl}
                    onChange={setLogoUrl}
                  />
                  <ImagePickerField
                    label="Hero Banner URL"
                    value={heroBannerUrl}
                    onChange={setHeroBannerUrl}
                    previewClass="bp-preview--banner"
                  />
                </div>
              </section>

              {/* Discount Banner */}
              <section className="bp-section">
                <h2 className="bp-section-title">📢 Discount Banner</h2>
                <div className="form-group">
                  <label>Banner Message</label>
                  <input
                    value={discountBannerText}
                    onChange={e => setDiscountBannerText(e.target.value)}
                    placeholder="🔥 Free shipping on orders above LKR 5,000"
                  />
                </div>
                <div className="bp-toggle-row">
                  <span>Banner Active</span>
                  <button
                    className={`bp-toggle ${discountBannerActive ? 'bp-toggle--on' : ''}`}
                    onClick={() => setDiscountBannerActive(!discountBannerActive)}
                    aria-label="Toggle discount banner"
                  >
                    <span className="bp-toggle-knob" />
                  </button>
                  <span className={discountBannerActive ? 'bp-active-label' : 'text-muted'}>
                    {discountBannerActive ? 'Live' : 'Hidden'}
                  </span>
                </div>
                {discountBannerText && discountBannerActive && (
                  <div className="bp-banner-preview">{discountBannerText}</div>
                )}
              </section>

              {/* Brand Copy */}
              <section className="bp-section">
                <h2 className="bp-section-title">✍️ Brand Copy</h2>
                <div className="form-group">
                  <label>Mission <span className="bp-counter">{mission.length}/500</span></label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={mission}
                    onChange={e => setMission(e.target.value)}
                    placeholder="Our mission..."
                  />
                </div>
                <div className="form-group">
                  <label>Vision <span className="bp-counter">{vision.length}/500</span></label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={vision}
                    onChange={e => setVision(e.target.value)}
                    placeholder="Our vision..."
                  />
                </div>
                <div className="form-group">
                  <label>Policies <span className="bp-counter">{policies.length}/2000</span></label>
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={policies}
                    onChange={e => setPolicies(e.target.value)}
                    placeholder="Return policy, shipping info..."
                  />
                </div>
              </section>

              <div className="bp-save-row">
                <button className="pm-btn pm-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Brand Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
