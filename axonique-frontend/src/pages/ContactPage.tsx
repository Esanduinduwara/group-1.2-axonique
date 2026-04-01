// Contact Page

import { useState } from 'react';
import Toast from '../components/Toast';
import './ContactPage.css';

export default function ContactPage() {
  const [toast, setToast] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    (e.target as HTMLFormElement).reset();
    setToast('Thanks — we will respond soon');
  };

  return (
    <main className="page">
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Get in touch</div>
            <h1 className="section-title">Contact Us</h1>
          </div>

          <div className="contact-layout">
            <div>
              <p className="contact-intro">
                For enquiries about orders, returns, or collaborations, email us at{' '}
                <a href="mailto:axoclothingonline@gmail.com" className="contact-email">
                  axoclothingonline@gmail.com
                </a>{' '}
                or use the form below.
              </p>

              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <input required name="name" placeholder="Your name" className="contact-input" />
                <input required type="email" name="email" placeholder="Email" className="contact-input" />
                <textarea required name="message" placeholder="Message" rows={6} className="contact-input contact-textarea" />
                <div className="contact-form__actions">
                  <button type="submit" className="btn btn-primary">Send Message →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Toast message={toast} onDone={() => setToast('')} />
    </main>
  );
}
