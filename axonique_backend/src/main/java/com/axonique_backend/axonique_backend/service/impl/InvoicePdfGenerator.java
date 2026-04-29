package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.model.OrderItem;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class InvoicePdfGenerator {

    public byte[] generate(Order order) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 780f;
                y = write(content, "AXONIQUE - INVOICE", 18, 50f, y);
                y = write(content, "Order ID: #" + order.getId(), 12, 50f, y - 18f);
                y = write(content, "Customer: " + order.getCustomerName(), 11, 50f, y - 8f);
                y = write(content, "Email: " + order.getCustomerEmail(), 11, 50f, y - 4f);
                y = write(content, "Delivery Address: " + sanitize(order.getDeliveryAddress()), 11, 50f, y - 4f);
                y -= 14f;
                y = write(content, "Items", 12, 50f, y);

                for (OrderItem item : order.getItems()) {
                    String line = String.format("- %s | Qty: %d | Line Total: LKR %s",
                            sanitize(item.getProductName()),
                            item.getQuantity(),
                            item.getLineTotal());
                    y = write(content, line, 10, 55f, y - 6f);
                    if (y < 80f) {
                        break;
                    }
                }

                y -= 14f;
                y = write(content, "Subtotal: LKR " + order.getSubtotal(), 11, 50f, y);
                y = write(content, "Shipping: LKR " + order.getShippingFee(), 11, 50f, y - 4f);
                write(content, "Total: LKR " + order.getTotal(), 12, 50f, y - 8f);
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            return ("Invoice generation failed for order " + order.getId()).getBytes(StandardCharsets.UTF_8);
        }
    }

    private float write(PDPageContentStream content, String text, int fontSize, float x, float y) throws IOException {
        content.beginText();
        content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), fontSize);
        content.newLineAtOffset(x, y);
        content.showText(sanitize(text));
        content.endText();
        return y - (fontSize + 4f);
    }

    private String sanitize(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\r", " ")
                .replace("\n", " ")
                .replace("\t", " ");
    }
}
