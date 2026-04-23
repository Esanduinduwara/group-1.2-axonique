package com.axonique_backend.axonique_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProductSyncResponse {

    private int totalReceived;
    private int inserted;
    private int updated;
    private int skipped;
    private int failed;

    @Builder.Default
    private List<String> messages = new ArrayList<>();
}