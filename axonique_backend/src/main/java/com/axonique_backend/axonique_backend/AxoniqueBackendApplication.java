package com.axonique_backend.axonique_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AxoniqueBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AxoniqueBackendApplication.class, args);
	}

}
