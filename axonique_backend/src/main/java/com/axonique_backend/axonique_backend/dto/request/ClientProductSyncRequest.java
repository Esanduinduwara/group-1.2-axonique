package com.axonique_backend.axonique_backend.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ClientProductSyncRequest {
    private List<ClientProductSyncItemRequest> products;
}