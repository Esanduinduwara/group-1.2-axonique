package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.service.OrderVerificationEmailService;
import com.resend.Resend;
import com.resend.services.emails.model.Attachment;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrderVerificationEmailServiceImpl implements OrderVerificationEmailService {
    private final InvoicePdfGenerator invoicePdfGenerator;

    public OrderVerificationEmailServiceImpl(InvoicePdfGenerator invoicePdfGenerator) {
        this.invoicePdfGenerator = invoicePdfGenerator;
    }

    @Value("${app.mail.resend.api}")
    private String resendApiKey;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void sendVerificationEmail(Order order, String verificationToken) {
        String verifyUrl = frontendBaseUrl + "/verify-order?token=" + verificationToken;
        String html = """
                <div style="font-family: Arial, sans-serif; background: #0f0f0f; color: #f4f4f4; padding: 24px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #171717; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px;">
                    <h2 style="margin: 0 0 12px;">Confirm your order</h2>
                    <p style="margin: 0 0 16px; color: #cfcfcf;">
                      We received your order request <strong>#%s</strong>. Please verify your email to confirm this cash-on-delivery order.
                    </p>
                    <a href="%s" style="display:inline-block;background:#fc1010;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
                      Verify Order
                    </a>
                    <p style="margin: 16px 0 0; color: #adadad; font-size: 13px;">
                      This verification link expires in 24 hours.
                    </p>
                  </div>
                </div>
                """.formatted(order.getId(), verifyUrl);

        try {
            Resend resend = new Resend(resendApiKey);
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("Axonique <orders@axonique.space>")
                    .to(order.getCustomerEmail())
                    .replyTo("support@axonique.space")
                    .subject("Please verify order #" + order.getId())
                    .html(html)
                    .text("Please verify your order #" + order.getId()
                            + " within 24 hours. Open this link: " + verifyUrl)
                    .build();
            resend.emails().send(params);
        } catch (Exception e) {
            log.error("Failed to send verification email for order {}", order.getId(), e);
        }
    }

    @Override
    public void sendInvoiceEmail(Order order) {
        String itemsHtml = order.getItems().stream()
                .map(item -> """
                        <tr>
                          <td style="padding:8px;border-bottom:1px solid #2a2a2a;">%s</td>
                          <td style="padding:8px;border-bottom:1px solid #2a2a2a;">%d</td>
                          <td style="padding:8px;border-bottom:1px solid #2a2a2a;text-align:right;">LKR %s</td>
                        </tr>
                        """.formatted(item.getProductName(), item.getQuantity(), item.getLineTotal()))
                .collect(Collectors.joining());

        String html = """
                <div style="font-family: Arial, sans-serif; background: #0f0f0f; color: #f4f4f4; padding: 24px;">
                  <div style="max-width: 640px; margin: 0 auto; background: #171717; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px;">
                    <h2 style="margin: 0 0 12px;">Order Confirmed</h2>
                    <p style="margin: 0 0 16px; color: #cfcfcf;">Your order <strong>#%s</strong> is confirmed.</p>
                    <p style="margin: 0 0 16px; color: #d9d9d9;">Thank you for your purchase and for choosing Axonique. We truly appreciate your support.</p>
                    <table style="width:100%%;border-collapse:collapse;margin:8px 0 16px;">
                      <thead>
                        <tr>
                          <th style="text-align:left;padding:8px;border-bottom:1px solid #2a2a2a;">Item</th>
                          <th style="text-align:left;padding:8px;border-bottom:1px solid #2a2a2a;">Qty</th>
                          <th style="text-align:right;padding:8px;border-bottom:1px solid #2a2a2a;">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>%s</tbody>
                    </table>
                    <p style="margin: 0; color: #adadad;">Subtotal: LKR %s</p>
                    <p style="margin: 4px 0; color: #adadad;">Shipping: LKR %s</p>
                    <p style="margin: 8px 0 0; font-size: 16px;"><strong>Total: LKR %s</strong></p>
                  </div>
                </div>
                """.formatted(order.getId(), itemsHtml, order.getSubtotal(), order.getShippingFee(), order.getTotal());

        try {
            byte[] invoiceBytes = invoicePdfGenerator.generate(order);
            String invoiceBase64 = Base64.getEncoder().encodeToString(invoiceBytes);

            Resend resend = new Resend(resendApiKey);
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("Axonique <orders@axonique.space>")
                    .to(order.getCustomerEmail())
                    .replyTo("support@axonique.space")
                    .subject("Invoice for your Axonique order #" + order.getId())
                    .html(html)
                    .text("Thank you for your purchase. Your order #" + order.getId()
                            + " is confirmed. Total: LKR " + order.getTotal())
                    .attachments(
                            Attachment.builder()
                                    .fileName("axonique-invoice-" + order.getId() + ".pdf")
                                    .content(invoiceBase64)
                                    .build()
                    )
                    .build();
            resend.emails().send(params);
        } catch (Exception e) {
            log.error("Failed to send invoice email for order {}", order.getId(), e);
        }
    }
}
