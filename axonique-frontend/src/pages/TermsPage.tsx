import './PolicyPage.css';

export default function TermsPage() {
  return (
    <main className="page">
      <section>
        <div className="container policy-page">
          <div className="section-header">
            <div className="section-label">Policies</div>
            <h1 className="section-title">Terms of Service</h1>
          </div>

          <div className="policy-block">
            <h2>1. Overview</h2>
            <p>AXO is a streetwear clothing brand operating through our official online store.</p>
            <p>
              When placing an order, you confirm that all details you provide, including your name,
              delivery address, and payment information, are correct.
            </p>
            <p>AXO reserves the right to decline or cancel orders at our discretion.</p>
          </div>

          <div className="policy-block">
            <h2>2. Products and Stock</h2>
            <p>All items are offered while stocks last. Availability is not guaranteed.</p>
            <p>
              Product colors and designs may vary slightly from what you see on your screen due to lighting
              and display differences.
            </p>
          </div>

          <div className="policy-block">
            <h2>3. Prices and Payments</h2>
            <p>All prices are shown in LKR and may change without prior notice.</p>
            <p>Full payment is required at the time of checkout.</p>
            <p>
              AXO is not responsible for payment failures, delays, or issues caused by third-party payment
              services.
            </p>
          </div>

          <div className="policy-block">
            <h2>4. Shipping and Delivery</h2>
            <p>Orders will be shipped to the address provided during checkout.</p>
            <p>
              AXO is not responsible for delays caused by courier services, incorrect delivery details, or
              external factors beyond our control.
            </p>
            <p>Estimated delivery times are provided for reference only and are not guaranteed.</p>
          </div>

          <div className="policy-block">
            <h2>5. Returns and Refunds</h2>
            <p>All purchases are final. We do not accept returns or exchanges.</p>
            <p>
              Refunds are only considered for items that arrive damaged, defective, or incorrect, as
              outlined in our Return and Refund Policy.
            </p>
          </div>

          <div className="policy-block">
            <h2>6. Ownership and Content</h2>
            <p>
              All designs, logos, images, and content associated with AXO are our property and protected by
              copyright laws.
            </p>
            <p>Unauthorized use, copying, or distribution of our content is strictly prohibited.</p>
          </div>

          <div className="policy-block">
            <h2>7. Responsibility Limit</h2>
            <p>
              AXO is not responsible for indirect or unexpected losses related to the use of our store or
              products.
            </p>
            <p>Our responsibility is limited to the total amount paid for the order.</p>
          </div>

          <div className="policy-block">
            <h2>8. Policy Updates</h2>
            <p>These terms may be updated at any time without prior notice.</p>
            <p>By continuing to use our store, you agree to any changes made.</p>
          </div>

          <div className="policy-block">
            <h2>9. Get in Touch</h2>
            <p>If you have any questions about these Terms and Conditions, please contact us at:</p>
            <p>
              <a className="policy-email" href="mailto:axoclothingonline@gmail.com">
                axoclothingonline@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
