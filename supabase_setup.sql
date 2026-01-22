-- Create family table
CREATE TABLE IF NOT EXISTS family (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ttl TEXT,
  address TEXT,
  hp TEXT,
  ktp TEXT,
  photo TEXT,
  role TEXT,
  parent_id INTEGER REFERENCES family(id) ON DELETE SET NULL,
  spouse_id INTEGER REFERENCES family(id) ON DELETE SET NULL,
  birth_order INTEGER DEFAULT 1,
  generation INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE family ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public access)
CREATE POLICY "Allow all operations" ON family
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial data
INSERT INTO family (name, ttl, address, hp, ktp, photo, role, parent_id, spouse_id, generation) VALUES
('SB Sihite', 'Jakarta, 01-01-1950', 'Jl. Old Town No. 1', '081234567890', '1234567890123456', 'https://i.pravatar.cc/100?img=70', 'The Origin', NULL, 2, 1),
('Tiarly Samosir', 'Bandung, 02-02-1955', 'Jl. Old Town No. 1', '081234567891', '1234567890123457', 'https://i.pravatar.cc/100?img=47', 'The Matriarch', NULL, 1, 1),
('Uncle John', 'Surabaya, 03-03-1975', 'Jl. New City No. 5', '081234567892', '1234567890123458', 'https://i.pravatar.cc/100?img=12', 'Explorer', 1, NULL, 2),
('Dad', 'Jakarta, 04-04-1978', 'Jl. Future Blvd No. 10', '081234567893', '1234567890123459', 'https://i.pravatar.cc/100?img=11', 'Architect', 1, 5, 2),
('Mom', 'Yogyakarta, 05-05-1980', 'Jl. Future Blvd No. 10', '081234567894', '1234567890123460', 'https://i.pravatar.cc/100?img=32', 'Designer', NULL, 4, 2),
('Aunt Jane', 'Bali, 08-08-1982', 'Jl. Beach Side No. 8', '081234567897', '1234567890123463', 'https://i.pravatar.cc/100?img=5', 'Scientist', 1, NULL, 2),
('Me', 'Jakarta, 06-06-2005', 'Jl. Future Blvd No. 10', '081234567895', '1234567890123461', 'https://i.pravatar.cc/100?img=33', 'Coder', 4, NULL, 3),
('Sister', 'Jakarta, 07-07-2008', 'Jl. Future Blvd No. 10', '081234567896', '1234567890123462', 'https://i.pravatar.cc/100?img=9', 'Artist', 4, NULL, 3);
