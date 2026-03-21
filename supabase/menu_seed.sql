-- SEED DE PRODUCTOS PARA "THE BEAR" (CEVICHERÍA)
-- Tabla: productos (id, nombre, descripcion, precio, tipo, activo, fraccion_pollo, imagen_url)

-- Limpiar productos actuales (opcional, comentar si se quieren mantener)
-- DELETE FROM productos;

INSERT INTO productos (nombre, descripcion, precio, tipo, activo) VALUES
-- ENTRADAS
('Leche de Tigre Clásica', 'Con trozos de pescado y mariscos', 13, 'plato', true),
('Leche de Tigre Especial', 'Acompañado con mariscos y chicharrón de pota', 15, 'plato', true),
('Leche Criolla', 'Leche en crema amarilla con trozos de chicharrón de pota', 18, 'plato', true),
('Leche Characata', 'Leche en crema de rocoto con trozos de chicharrón de pescado', 18, 'plato', true),
('Leche The Bear', 'Leche de la casa acompañado con un chicharrón mixto que te sorprenderá', 22, 'plato', true),
('Causa Acevichada The Bear', '', 20, 'plato', true),
('Dúo de Causas The Bear', '', 22, 'plato', true),
('Papa Rellena Acevichada', 'Papa crocante relleno de un salteado de mariscos acompañado de ceviche THE BEAR', 18, 'plato', true),
('Encuentro de Tiraditos de Pescado', 'En salsa de rocoto y ají amarillo', 22, 'plato', true),
('Conchitas a la Chalaca', '', 19, 'plato', true),

-- CEVICHES
('Ceviche de Pescado', '', 20, 'plato', true),
('Ceviche Norteño', '', 20, 'plato', true),
('Ceviche Mixto The Bear', '', 25, 'plato', true),
('Chalaquita de Pota The Bear', '', 15, 'plato', true),
('Ceviche Palteado', '', 20, 'plato', true),
('Festival de Ceviches en 3 Salsas', '', 28, 'plato', true),
('Ceviche de Langostinos', '', 30, 'plato', true),
('Ceviche de Conchas Negras', '', 35, 'plato', true),

-- ARROCES
('Arroz con Mariscos The Bear', '', 20, 'plato', true),
('Arroz con Langostinos', '', 25, 'plato', true),
('Chaufa de Mariscos The Bear', '', 18, 'plato', true),
('Arroz Criollo The Bear', '', 20, 'plato', true),
('Chaufa de Pescado', '', 18, 'plato', true),
('Chaufa Crispi de Pescado', '', 18, 'plato', true),
('Chaufa Salvaje The Bear', '', 20, 'plato', true),
('Arroz Criollo con Mariscos The Bear', '', 20, 'plato', true),

-- CRUJIENTES MARINOS
('Chicharrón de Pota', '', 18, 'plato', true),
('Chicharrón de Pescado', '', 20, 'plato', true),
('Chicharrón Mixto', '', 25, 'plato', true),
('Chicharrón de Calamar', '', 30, 'plato', true),
('Chicharrón de Langostinos', '', 30, 'plato', true),
('Cabrilla Frita', '', 25, 'plato', true),
('Chita Frita', '', 25, 'plato', true),
('Jalea Mixta The Bear', '', 28, 'plato', true),
('Jalea de Cabrilla', '', 35, 'plato', true),

-- SOPAS
('Chilcano Especial', '', 13, 'plato', true),
('Caldo Arrecho The Bear', '', 15, 'plato', true),
('Chilcano de Tramboyo', '', 20, 'plato', true),
('Chilcano de Cabrilla', '', 20, 'plato', true),

-- CHUPES
('Chupe de Pescado', '', 20, 'plato', true),
('Chupe de Mariscos', '', 22, 'plato', true),
('Chupe de Cangrejos Reventados', '', 22, 'plato', true),
('Chupe de Camarones', '', 25, 'plato', true),
('Chupe de Langostinos', '', 25, 'plato', true),

-- SUDADOS
('Sudado de Filete', '', 25, 'plato', true),
('Sudado de Mariscos', '', 23, 'plato', true),
('Sudado de Cabrilla', '', 25, 'plato', true),
('Sudado de Tramboyo', '', 25, 'plato', true),

-- PARIHUELAS
('Parihuela de Filete', '', 25, 'plato', true),
('Parihuela de Cabrilla', '', 28, 'plato', true),
('Parihuela de Tramboyo', '', 28, 'plato', true),

-- COMBOS MARINOS (DUOS)
('Duo 1: Ceviche + Chicharrón Pota', '', 25, 'promocion', true),
('Duo 2: Ceviche + Chicharrón Pescado', '', 25, 'promocion', true),
('Duo 3: Ceviche + Chicharrón Mixto', '', 28, 'promocion', true),
('Duo 4: Ceviche + Chicharrón Calamar', '', 28, 'promocion', true),
('Duo 5: Ceviche + Arroz Mariscos', '', 25, 'promocion', true),
('Duo 6: Ceviche + Chaufa Mariscos', '', 25, 'promocion', true),
('Duo 7: Ceviche + Chaufa Pescado', '', 25, 'promocion', true),
('Duo 8: Ceviche Mixto + Chicharrón Pota', '', 28, 'promocion', true),
('Duo 9: Ceviche Mixto + Chicharrón Pescado', '', 28, 'promocion', true),
('Duo 10: Ceviche Mixto + Chicharrón Mixto The Bear', '', 28, 'promocion', true),
('Duo 11: Ceviche Mixto + Chicharrón Calamar', '', 30, 'promocion', true),
('Duo 12: Ceviche Mixto + Arroz Mariscos', '', 28, 'promocion', true),
('Duo 13: Ceviche Mixto + Chaufa Mariscos', '', 28, 'promocion', true),
('Duo 14: Ceviche Mixto + Chaufa Salvaje The Bear', '', 28, 'promocion', true),

-- COMBOS CRUJIENTES
('Arroz Mariscos + Chicharrón Pota', '', 25, 'promocion', true),
('Arroz Mariscos + Chicharrón Pescado', '', 25, 'promocion', true),
('Arroz Mariscos + Chicharrón Mixto', '', 28, 'promocion', true),
('Chaufa Mariscos + Chicharrón Pota', '', 25, 'promocion', true),
('Chaufa Mariscos + Chicharrón Pescado', '', 25, 'promocion', true),
('Chaufa Salvaje + Chicharrón Mixto The Bear', '', 28, 'promocion', true),

-- TRILOGIAS MARINAS
('Triple 1: Ceviche + Chicharrón Pota + Arroz Mariscos', '', 33, 'promocion', true),
('Triple 2: Ceviche + Chicharrón Pota + Chaufa Mariscos', '', 33, 'promocion', true),
('Triple 3: Ceviche + Chicharrón Pescado + Arroz Mariscos', '', 33, 'promocion', true),
('Triple 4: Ceviche + Chicharrón Pescado + Chaufa Mariscos', '', 33, 'promocion', true),
('Triple 5: Ceviche + Chicharrón Mixto + Chaufa Mariscos', '', 35, 'promocion', true),
('Triple 6: Ceviche + Chicharrón Mixto + Arroz Mariscos', '', 35, 'promocion', true),
('Triple 7: Ceviche + Chicharrón Mixto + Chaufa Salvaje The Bear', '', 35, 'promocion', true),
('Triple 8: Ceviche Mixto + Chicharrón Pota + Arroz Mariscos', '', 38, 'promocion', true),
('Triple 9: Ceviche Mixto + Chicharrón Pota + Chaufa Mariscos', '', 38, 'promocion', true),
('Triple 10: Ceviche Mixto + Chicharrón Pescado + Arroz Mariscos', '', 38, 'promocion', true),
('Triple 11: Arma tu Trío The Bear', '', 38, 'promocion', true),

-- PLATOS DE LA CASA
('Fetuchini a la Huancaína Acevichada', '', 18, 'plato', true),
('Fetuchini a la Huancaína con Lomo Saltado', '', 25, 'plato', true),
('Fetuchini a la Huancaína con Lomo a la Plancha', '', 25, 'plato', true),
('Fetuchini al Alfredo con Langostinos', '', 25, 'plato', true),
('Fetuchini al Alpesto con Lomo a la Plancha', '', 25, 'plato', true),
('Tacu Tacu Acevichado', '', 25, 'plato', true),
('Tacu Tacu con Lomo Saltado', '', 25, 'plato', true),
('Dúo de Tacu Tacus', '', 28, 'plato', true),
('Tacu Tacu Acevichado + Tacu Tacu con Lomo Pobrecito', '', 28, 'plato', true),

-- PORCIONES
('Yucas Fritas', '', 5, 'complemento', true),
('Yucas Sancochadas', '', 5, 'complemento', true),
('Camotes', '', 5, 'complemento', true),
('Arroz Blanco', '', 4, 'complemento', true),
('Yuyo Broaster', '', 5, 'complemento', true),
('Chifles', '', 5, 'complemento', true),
('Choclo', '', 5, 'complemento', true),

-- REFRESCOS
('Jarra de Chicha Morada', '', 13, 'bebida', true),
('Jarra de Maracuyá', '', 13, 'bebida', true),
('Jarra de Limonada', '', 13, 'bebida', true),
('Jarra de Limonada Americana', '', 15, 'bebida', true);
