
INSERT INTO platform_settings (key, value, description)
VALUES ('platform_fee_fixed_pence', '20', 'Fixed fee in pence charged per ticket sold')
ON CONFLICT (key) DO NOTHING;

UPDATE platform_settings SET value = '2.5' WHERE key = 'platform_fee_percent';
