import './PolicyPage.css';

export default function ShippingPolicyPage() {
  return (
    <main className="page">
      <section>
        <div className="container policy-page">
          <div className="section-header">
            <div className="section-label">Policies</div>
            <h1 className="section-title">Shipping Policy</h1>
          </div>

          <div className="policy-block">
            <h2>Order Processing</h2>
            <p>Orders are processed within 1-3 business days after confirmation.</p>
            <p>Orders placed on Sundays or public holidays will be processed on the next working day.</p>
          </div>

          <div className="policy-block">
            <h2>Shipping Locations</h2>
            <p>We currently ship islandwide within Sri Lanka.</p>
            <p>International shipping is not available at the moment.</p>
          </div>

          <div className="policy-block">
            <h2>Delivery Time</h2>
            <p>Colombo and suburbs: 4-7 business days.</p>
            <p>Outstation areas: 9-14 business days.</p>
            <p>Delivery times may vary due to weather conditions, courier delays, or public holidays.</p>
          </div>

          <div className="policy-block">
            <h2>Delivery Information</h2>
            <p>Please ensure your address and contact number are accurate.</p>
            <p>
              AXO is not responsible for delays or failed deliveries due to incorrect details provided by
              the customer.
            </p>
          </div>

          <div className="policy-block">
            <h2>Delays and Issues</h2>
            <p>While we do our best to meet delivery timelines, unexpected delays may occur.</p>
            <p>
              If your order is delayed or damaged during delivery, please contact us within 24 hours of
              receiving the package.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
