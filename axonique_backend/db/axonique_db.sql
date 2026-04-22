-- Schema for AxoNique Project
-- This file can be used to manually import the database structures into MySQL or another SQL client.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question_1 VARCHAR(255),
    security_answer_1 VARCHAR(255),
    security_question_2 VARCHAR(255),
    security_answer_2 VARCHAR(255),
    security_question_3 VARCHAR(255),
    security_answer_3 VARCHAR(255),
    enabled BOOLEAN DEFAULT FALSE
);

-- Note: You can also use spring.jpa.hibernate.ddl-auto=update in application.properties
-- to let Hibernate create these tables automatically.
