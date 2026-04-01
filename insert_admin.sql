USE axo_nique;
DELETE FROM users WHERE username='admin';
INSERT INTO users (username, email, password, role, enabled) VALUES ('admin', 'admin@axonique.com', '$2a$10$8.XhL5xS.KxP.8r7oGv9G.4B0h7z3Hh0z2I3J4K5L6M7N8O9P0Q1R', 'ADMIN', 1);
