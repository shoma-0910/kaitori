-- Organizations data
INSERT INTO organizations (id, name, created_at) VALUES
('cae4579e-0ef9-4d6f-9a2c-ba17cdd06bb3', 'Super Admin Org r8gbW3', '2025-11-17 13:58:26.84666'),
('75f85e65-b97d-4e35-8791-b8a831deb1db', 'テスト株式会社', '2025-11-16 13:29:09.154375'),
('15184d82-c392-4aac-83c3-a3f291ce5a8f', 'test', '2025-11-17 15:15:11.175024');

-- User organizations data
INSERT INTO user_organizations (id, user_id, organization_id, role, created_at, is_super_admin) VALUES
('9cc71e8f-7d4d-4811-a9df-f5195bb0533a', 'df7d30b6-7add-40e5-9d1a-2322cb84bb53', '75f85e65-b97d-4e35-8791-b8a831deb1db', 'admin', '2025-11-16 15:16:33.52446', 'true'),
('3aa820f0-c4d3-4a9c-b231-be755e48c416', '8e452d4e-df29-40cd-90c0-32db0c75acee', 'cae4579e-0ef9-4d6f-9a2c-ba17cdd06bb3', 'admin', '2025-11-17 13:58:26.933087', 'true'),
('373c9846-9010-4421-a8fc-758ff4d22f4b', '19baf8c2-14ee-4686-bdc4-dfbad3a59dda', '15184d82-c392-4aac-83c3-a3f291ce5a8f', 'admin', '2025-11-17 15:15:11.26033', 'false');
