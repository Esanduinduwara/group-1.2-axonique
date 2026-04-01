import './PolicyPage.css';

export default function RefundPolicyPage() {
  return (
    <main className="page">
      <section>
        <div className="container policy-page">
          <div className="section-header">
            <div className="section-label">Policies</div>
            <h1 className="section-title">Refund Policy</h1>
          </div>

          <div className="policy-block">
            <p>
              At AXO, we carefully craft every piece we sell. Before placing an order, please take a
              moment to review our policy.
            </p>
          </div>

          <div className="policy-block">
            <h2>Returns and Exchanges</h2>
            <p>Currently, we do not offer returns or exchanges.</p>
            <p>Once an order is confirmed, it cannot be changed or cancelled.</p>
            <p>
              Please make sure to review product details, size guides, and delivery information carefully
              before completing your purchase.
            </p>
          </div>

          <div className="policy-block">
            <h2>Refund Policy</h2>
            <p>Refunds are not provided for size selection mistakes, change of mind, or personal preference.</p>
            <p>A refund or replacement will only be considered if:</p>
            <p>Your item arrives damaged or faulty.</p>
            <p>You receive an item different from what you ordered.</p>
            <p>
              If you experience any of the above, contact us within 7 days of receiving your order with
              your order number and clear photos showing the issue.
            </p>
          </div>

          <div className="policy-block">
            <h2>Our Promise</h2>
            <p>
              AXO is a growing streetwear label, and we truly value every customer. While returns are not
              available at this time, we promise to handle genuine issues responsibly and work toward a fair
              solution.
            </p>
            <p>Thank you for choosing AXO and supporting our journey.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
