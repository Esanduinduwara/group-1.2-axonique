package com.axonique_backend.axonique_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "security_question_1")
    private String securityQuestion1;

    @Column(name = "security_answer_1")
    private String securityAnswer1;

    @Column(name = "security_question_2")
    private String securityQuestion2;

    @Column(name = "security_answer_2")
    private String securityAnswer2;

    @Column(name = "security_question_3")
    private String securityQuestion3;

    @Column(name = "security_answer_3")
    private String securityAnswer3;

    @Builder.Default
    private boolean enabled = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;
}
