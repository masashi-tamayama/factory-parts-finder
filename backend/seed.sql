-- ダミーデータ(すべて架空)
-- ローカル: psql -d factory_parts_dev -v ON_ERROR_STOP=1 --single-transaction -f backend/seed.sql
-- テーブルが空の状態で、1 回だけ流す想定。テーブルごとに追記していく

-- 工区(車両の流れの順。工場マップに合わせた 4 工区)
INSERT INTO zone (name) VALUES
    ('前部工区'),
    ('足回り工区'),
    ('後部工区'),
    ('内装工区');

-- メーカー(色 + 自然な字 + 会社の末尾。すべて架空)
INSERT INTO supplier (name) VALUES
    ('赤松工業'),
    ('青葉産業'),
    ('黄木ボルト'),
    ('橙山製作所'),
    ('緑川鉄工'),
    ('紫野産業'),
    ('白石ボルト'),
    ('黒岩工業'),
    ('銀谷鉄工');

-- 所番地(マップの 3 マス 1 組 = 1 つの所番地。各工区から 1 組だけ登録)
INSERT INTO address (zone_id, code) VALUES
    ((SELECT id FROM zone WHERE name = '前部工区'),   '11'),
    ((SELECT id FROM zone WHERE name = '足回り工区'), '21'),
    ((SELECT id FROM zone WHERE name = '後部工区'),   '31'),
    ((SELECT id FROM zone WHERE name = '内装工区'),   '41');

-- 部品棚(各組の 3 マスを左 → 右の順に登録。すべて 3 段 × 3 列)
-- map_x, map_y: 工場マップ画像(工場マップ.drawio.png、2130 × 2026 px)上の、四角の中心の割合
INSERT INTO parts_shelf (address_id, shelf_no, map_x, map_y, shelf_rows, shelf_cols)
SELECT a.id, v.shelf_no, v.map_x, v.map_y, v.shelf_rows, v.shelf_cols
FROM (VALUES
    ('11', '101', 0.2333, 0.1994, 3, 3),
    ('11', '102', 0.2676, 0.1994, 3, 3),
    ('11', '103', 0.3019, 0.1994, 3, 3),
    ('21', '201', 0.8249, 0.2883, 3, 3),
    ('21', '202', 0.8592, 0.2883, 3, 3),
    ('21', '203', 0.8934, 0.2883, 3, 3),
    ('31', '301', 0.5103, 0.5350, 3, 3),
    ('31', '302', 0.5446, 0.5350, 3, 3),
    ('31', '303', 0.5789, 0.5350, 3, 3),
    ('41', '401', 0.7685, 0.9102, 3, 3),
    ('41', '402', 0.8028, 0.9102, 3, 3),
    ('41', '403', 0.8371, 0.9102, 3, 3)
) AS v (address_code, shelf_no, map_x, map_y, shelf_rows, shelf_cols)
JOIN address a ON a.code = v.address_code;

-- 車両(名前 + 種類。画像は AI 生成の架空の車両。frontend/public/images/vehicles/)
INSERT INTO vehicle (name, image_path) VALUES
    ('ミナモ(軽自動車)', '/images/vehicles/minamo.png'),
    ('ツキカゲ(セダン)', '/images/vehicles/tsukikage.png');

-- 部位(ミナモ(軽自動車)のみ。表 = 外側、裏 = 内側)
-- area_x, area_y, area_w, area_h: 車両の画像(minamo.png、1536 × 1024 px)の上の、押せる範囲(左上の角と幅・高さ。0〜1 の割合)
INSERT INTO vehicle_part (vehicle_id, name, front_image_path, back_image_path, area_x, area_y, area_w, area_h)
SELECT v.id, p.name, p.front_image_path, p.back_image_path, p.area_x, p.area_y, p.area_w, p.area_h
FROM (VALUES
    ('左ヘッドランプ', '/images/parts/minamo_headlamp_front.jpg', '/images/parts/minamo_headlamp_back.jpg', 0.1074, 0.4395, 0.0814, 0.0977),
    ('左F/D',          '/images/parts/minamo_door_front.jpg',     '/images/parts/minamo_door_back.jpg',     0.3125, 0.2197, 0.2539, 0.5273),
    ('ホイール',       '/images/parts/minamo_wheel_front.jpg',    '/images/parts/minamo_wheel_back.jpg',    0.1471, 0.5918, 0.1510, 0.2266),
    ('Rrバンパー',     '/images/parts/minamo_rrbumper_front.jpg', '/images/parts/minamo_rrbumper_back.jpg', 0.8711, 0.5156, 0.0495, 0.2168)
) AS p (name, front_image_path, back_image_path, area_x, area_y, area_w, area_h)
CROSS JOIN (SELECT id FROM vehicle WHERE name = 'ミナモ(軽自動車)') AS v;

-- ボルト(20 種類。部品番号は 9001-系統-連番、背番号は各メーカーが 101、102、103 の順。画像は AI 生成)
-- 系統: 0001 = 六角フランジ M6×16、0002 = M6×10、0003 = M8×25(ワッシャー付き)、0004 = M12×1.5 ナット、0005 = M6×20(ワッシャー一体)
-- 各系統の先頭が、ミナモに使う 5 種類(A〜E)。残りは、間違えそうな仲間(類似ボルト)
INSERT INTO bolt (part_number, supplier_id, back_number, name, spec, image_path)
SELECT b.part_number, s.id, b.back_number, b.name, b.spec, b.image_path
FROM (VALUES
    ('9001-0001-0001', '赤松工業',   '101', '六角フランジボルト M6×16',                 'M6 × 16 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_flange_m6x16.jpg'),
    ('9001-0001-0002', '紫野産業',   '101', '六角フランジボルト M6×16(金色)',           'M6 × 16 / 鋼 / 黄色クロメート',             '/images/bolts/hex_flange_m6x16_gold.jpg'),
    ('9001-0001-0003', '白石ボルト', '101', '六角フランジボルト M6×16(細目ねじ)',       'M6 × 0.75 × 16 / 鋼 / 亜鉛めっき',          '/images/bolts/hex_flange_m6x16_fine.jpg'),
    ('9001-0001-0004', '黒岩工業',   '101', '六角フランジボルト M6×16(半ねじ)',         'M6 × 16 半ねじ / 鋼 / 亜鉛めっき',          '/images/bolts/hex_flange_m6x16_halfthread.jpg'),
    ('9001-0002-0001', '青葉産業',   '101', '六角フランジボルト M6×10',                 'M6 × 10 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_flange_m6x10.jpg'),
    ('9001-0002-0002', '銀谷鉄工',   '101', '大径フランジボルト M6×10',                 'M6 × 10 / 大径フランジ / 亜鉛めっき',       '/images/bolts/hex_flange_large_m6x10.jpg'),
    ('9001-0002-0003', '赤松工業',   '102', '六角ボルト M6×10(フランジなし)',           'M6 × 10 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_m6x10.jpg'),
    ('9001-0002-0004', '青葉産業',   '102', '六角フランジボルト M6×12',                 'M6 × 12 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_flange_m6x12.jpg'),
    ('9001-0003-0001', '黄木ボルト', '101', '平ワッシャー付き六角ボルト M8×25',         'M8 × 25 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_washer_m8x25.jpg'),
    ('9001-0003-0002', '黄木ボルト', '102', '六角ボルト M8×25(ワッシャーなし)',         'M8 × 25 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_m8x25.jpg'),
    ('9001-0003-0003', '橙山製作所', '102', '平ワッシャー付き六角ボルト M8×35',         'M8 × 35 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_washer_m8x35.jpg'),
    ('9001-0003-0004', '緑川鉄工',   '102', '大径ワッシャー付き六角ボルト M8×25',       'M8 × 25 / 大径ワッシャー / 亜鉛めっき',     '/images/bolts/hex_washer_large_m8x25.jpg'),
    ('9001-0004-0001', '橙山製作所', '101', 'ホイールナット M12×1.5',                   'M12 × 1.5 / 鋼 / 亜鉛めっき',               '/images/bolts/wheel_nut_m12.jpg'),
    ('9001-0004-0002', '紫野産業',   '102', '袋ナット M12×1.5',                         'M12 × 1.5 / 袋形 / 亜鉛めっき',             '/images/bolts/cap_nut_m12.jpg'),
    ('9001-0004-0003', '白石ボルト', '102', '薄型ナット M12×1.5',                       'M12 × 1.5 / 薄型 / 亜鉛めっき',             '/images/bolts/thin_nut_m12.jpg'),
    ('9001-0004-0004', '黒岩工業',   '102', 'フランジ付きナット M12×1.5',               'M12 × 1.5 / フランジ付き / 亜鉛めっき',     '/images/bolts/flange_nut_m12.jpg'),
    ('9001-0005-0001', '緑川鉄工',   '101', 'ワッシャー一体型六角ボルト M6×20(黒)',     'M6 × 20 / 鋼 / 黒染め',                     '/images/bolts/hex_washer_flange_m6x20.jpg'),
    ('9001-0005-0002', '銀谷鉄工',   '102', 'ワッシャー一体型六角ボルト M6×20(銀)',     'M6 × 20 / 鋼 / 亜鉛めっき',                 '/images/bolts/hex_washer_flange_m6x20_silver.jpg'),
    ('9001-0005-0003', '赤松工業',   '103', 'タッピンねじ M6×20(黒)',                   'M6 × 20 / 先端尖り / 黒染め',               '/images/bolts/tapping_m6x20.jpg'),
    ('9001-0005-0004', '青葉産業',   '103', 'ワッシャー一体型六角ボルト M6×25(黒)',     'M6 × 25 / 鋼 / 黒染め',                     '/images/bolts/hex_washer_flange_m6x25.jpg')
) AS b (part_number, supplier_name, back_number, name, spec, image_path)
JOIN supplier s ON s.name = b.supplier_name
ORDER BY b.part_number;

-- 取り付け位置(ミナモ。部位の画像の上の、ボルトの頭の中心。x, y は画像の幅・高さに対する割合(0〜1)。画像は 1536 × 1024 px)
-- A = 9001-0001-0001(ヘッドランプの上の 2 本)、B = 9001-0002-0001(ヘッドランプの下の 1 本)、C = 9001-0003-0001(ミラーの 3 本)、D = 9001-0004-0001(ホイールナット)、E = 9001-0005-0001(Rr バンパーの 2 本)
-- ホイールの裏には、ナットがない(穴だけ)ので、行はない。左F/D の表にも、ボルトはない
INSERT INTO bolt_mount (vehicle_part_id, side, x, y, bolt_id)
SELECT p.id, m.side, m.x, m.y, b.id
FROM (VALUES
    ('左ヘッドランプ', 'front', 0.1940, 0.1709, '9001-0001-0001'),
    ('左ヘッドランプ', 'front', 0.8092, 0.1641, '9001-0001-0001'),
    ('左ヘッドランプ', 'front', 0.4824, 0.8223, '9001-0002-0001'),
    ('左ヘッドランプ', 'back',  0.1725, 0.1445, '9001-0001-0001'),
    ('左ヘッドランプ', 'back',  0.8255, 0.1533, '9001-0001-0001'),
    ('左ヘッドランプ', 'back',  0.5059, 0.8369, '9001-0002-0001'),
    ('左F/D',          'back',  0.6908, 0.3359, '9001-0003-0001'),
    ('左F/D',          'back',  0.6914, 0.3857, '9001-0003-0001'),
    ('左F/D',          'back',  0.7253, 0.3896, '9001-0003-0001'),
    ('ホイール',       'front', 0.4980, 0.3760, '9001-0004-0001'),
    ('ホイール',       'front', 0.5417, 0.4199, '9001-0004-0001'),
    ('ホイール',       'front', 0.5417, 0.5273, '9001-0004-0001'),
    ('ホイール',       'front', 0.4980, 0.5586, '9001-0004-0001'),
    ('ホイール',       'front', 0.4460, 0.5273, '9001-0004-0001'),
    ('ホイール',       'front', 0.4460, 0.4199, '9001-0004-0001'),
    ('Rrバンパー',     'front', 0.4036, 0.3438, '9001-0005-0001'),
    ('Rrバンパー',     'front', 0.5944, 0.3418, '9001-0005-0001'),
    ('Rrバンパー',     'back',  0.3971, 0.3301, '9001-0005-0001'),
    ('Rrバンパー',     'back',  0.5957, 0.3291, '9001-0005-0001')
) AS m (part_name, side, x, y, part_number)
JOIN vehicle_part p ON p.name = m.part_name
JOIN vehicle v ON v.id = p.vehicle_id AND v.name = 'ミナモ(軽自動車)'
JOIN bolt b ON b.part_number = m.part_number
ORDER BY p.id, m.side, m.y, m.x;

-- 部品棚への配置(どのボルトを、どの棚の、どのマスに置くか。段 = slot_row、列 = slot_col)
-- 似たボルトを、同じ棚に並べて置く(間違えやすい状況)。A は前部と後部、D は足回りと後部の、2 か所に置く(多対多)
-- 前部工区 = ヘッドランプ(A、B の系統)、足回り工区 = ホイールナット(D)、後部工区 = Rr バンパー(E)、内装工区 = ミラー(C)
INSERT INTO bolt_shelf (bolt_id, parts_shelf_id, slot_row, slot_col)
SELECT b.id, s.id, p.slot_row, p.slot_col
FROM (VALUES
    ('9001-0001-0001', '11', '101', 1, 1),
    ('9001-0001-0002', '11', '101', 1, 2),
    ('9001-0001-0003', '11', '101', 1, 3),
    ('9001-0001-0004', '11', '101', 2, 1),
    ('9001-0002-0001', '11', '102', 1, 1),
    ('9001-0002-0002', '11', '102', 1, 2),
    ('9001-0002-0003', '11', '102', 1, 3),
    ('9001-0002-0004', '11', '102', 2, 1),
    ('9001-0004-0001', '21', '201', 1, 1),
    ('9001-0004-0002', '21', '201', 1, 2),
    ('9001-0004-0003', '21', '201', 1, 3),
    ('9001-0004-0004', '21', '201', 2, 1),
    ('9001-0005-0001', '31', '301', 1, 1),
    ('9001-0005-0002', '31', '301', 1, 2),
    ('9001-0005-0003', '31', '301', 1, 3),
    ('9001-0005-0004', '31', '301', 2, 1),
    ('9001-0001-0001', '31', '302', 1, 1),
    ('9001-0004-0001', '31', '303', 1, 1),
    ('9001-0003-0001', '41', '401', 1, 1),
    ('9001-0003-0002', '41', '401', 1, 2),
    ('9001-0003-0003', '41', '401', 1, 3),
    ('9001-0003-0004', '41', '401', 2, 1)
) AS p (part_number, address_code, shelf_no, slot_row, slot_col)
JOIN bolt b ON b.part_number = p.part_number
JOIN address a ON a.code = p.address_code
JOIN parts_shelf s ON s.address_id = a.id AND s.shelf_no = p.shelf_no;

-- 類似ボルト(間違えそうな組。1 組を 1 行だけ。小さい id を bolt_id 側にする)
-- difference_note: 2 つの違いの説明(画像でも見分けられる違い)
INSERT INTO similar_bolt (bolt_id, similar_bolt_id, difference_note)
SELECT LEAST(b1.id, b2.id), GREATEST(b1.id, b2.id), p.note
FROM (VALUES
    ('9001-0001-0001', '9001-0001-0002', '色が違う(銀色と金色)'),
    ('9001-0001-0001', '9001-0001-0003', 'ねじ山の細かさが違う(並目と細目)'),
    ('9001-0001-0001', '9001-0001-0004', 'ねじ部の形が違う(全ねじと半ねじ)'),
    ('9001-0002-0001', '9001-0002-0002', 'つばの大きさが違う(通常と大径)'),
    ('9001-0002-0001', '9001-0002-0003', 'つばの有無が違う(フランジあり・なし)'),
    ('9001-0002-0001', '9001-0002-0004', 'ねじ部の長さが違う(10mm と 12mm)'),
    ('9001-0003-0001', '9001-0003-0002', 'ワッシャーの有無が違う'),
    ('9001-0003-0001', '9001-0003-0003', 'ねじ部の長さが違う(25mm と 35mm)'),
    ('9001-0003-0001', '9001-0003-0004', 'ワッシャーの大きさが違う(通常と大径)'),
    ('9001-0004-0001', '9001-0004-0002', '形が違う(貫通ナットと袋ナット)'),
    ('9001-0004-0001', '9001-0004-0003', '高さが違う(通常と薄型)'),
    ('9001-0004-0001', '9001-0004-0004', 'つばの有無が違う(フランジなし・あり)'),
    ('9001-0005-0001', '9001-0005-0002', '色が違う(黒と銀)'),
    ('9001-0005-0001', '9001-0005-0003', '先端の形が違う(通常と、尖ったタッピンねじ)'),
    ('9001-0005-0001', '9001-0005-0004', 'ねじ部の長さが違う(20mm と 25mm)'),
    ('9001-0001-0001', '9001-0002-0001', 'ねじ部の長さが違う(16mm と 10mm)。形は同じ'),
    ('9001-0001-0001', '9001-0005-0001', '色・座金・長さが違う(銀のフランジ M6×16 と、黒のワッシャー一体 M6×20)')
) AS p (part_number_1, part_number_2, note)
JOIN bolt b1 ON b1.part_number = p.part_number_1
JOIN bolt b2 ON b2.part_number = p.part_number_2;
