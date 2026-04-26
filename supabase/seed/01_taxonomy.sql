-- ============================================================
-- AutoJobs.ma — Initial Taxonomy Seed
-- ~60 skill tags for automotive/battery/EV sector in Morocco
-- ============================================================

-- Role Families (8)
INSERT INTO skill_tags (name, slug, category, sort_order) VALUES
  ('Assemblage & Production',        'assemblage-production',       'role_family', 10),
  ('Câblage Électrique',             'cablage-electrique',          'role_family', 20),
  ('Ingénierie Électrique',          'ingenierie-electrique',       'role_family', 30),
  ('Qualité & Audit',                'qualite-audit',               'role_family', 40),
  ('Maintenance Industrielle',       'maintenance-industrielle',    'role_family', 50),
  ('Cellules & Batteries',           'cellules-batteries',          'role_family', 60),
  ('Logistique & Supply Chain',      'logistique-supply-chain',     'role_family', 70),
  ('Management & RH',                'management-rh',               'role_family', 80);

-- Technical Skills (~25)
INSERT INTO skill_tags (name, slug, category, sort_order) VALUES
  ('Wire Harness Assembly',          'wire-harness-assembly',       'technical_skill', 10),
  ('PLC Programming',                'plc-programming',             'technical_skill', 20),
  ('Lean Manufacturing',             'lean-manufacturing',          'technical_skill', 30),
  ('FMEA / AMDEC',                   'fmea-amdec',                  'technical_skill', 40),
  ('MSA (Measurement System Analysis)', 'msa',                     'technical_skill', 50),
  ('SPC (Statistical Process Control)', 'spc',                     'technical_skill', 60),
  ('Robot Programming',              'robot-programming',           'technical_skill', 70),
  ('EV Powertrain',                  'ev-powertrain',               'technical_skill', 80),
  ('Lithium Cell Formation',         'lithium-cell-formation',      'technical_skill', 90),
  ('Cathode Coating',                'cathode-coating',             'technical_skill', 100),
  ('BMS Calibration',                'bms-calibration',             'technical_skill', 110),
  ('Electrolyte Filling',            'electrolyte-filling',         'technical_skill', 120),
  ('Welding MIG/TIG',                'welding-mig-tig',             'technical_skill', 130),
  ('CMM Operation',                  'cmm-operation',               'technical_skill', 140),
  ('AutoCAD',                        'autocad',                     'technical_skill', 150),
  ('SAP MM',                         'sap-mm',                      'technical_skill', 160),
  ('5S / Kaizen',                    '5s-kaizen',                   'technical_skill', 170),
  ('PPAP',                           'ppap',                        'technical_skill', 180),
  ('Control Plan',                   'control-plan',                'technical_skill', 190),
  ('IATF 16949 Audit',               'iatf-16949-audit',            'technical_skill', 200),
  ('Electrical Wiring Diagrams',     'electrical-wiring-diagrams',  'technical_skill', 210),
  ('Thermal Management',             'thermal-management',          'technical_skill', 220),
  ('Battery Testing',                'battery-testing',             'technical_skill', 230),
  ('Quality Control (inline)',       'quality-control-inline',      'technical_skill', 240),
  ('ERP / GPAO',                     'erp-gpao',                    'technical_skill', 250);

-- Certifications (~10)
INSERT INTO skill_tags (name, slug, category, sort_order) VALUES
  ('IATF 16949',                     'cert-iatf-16949',             'certification', 10),
  ('ISO 9001',                       'cert-iso-9001',               'certification', 20),
  ('ISO 14001',                      'cert-iso-14001',              'certification', 30),
  ('OHSAS 18001 / ISO 45001',        'cert-ohsas-18001',            'certification', 40),
  ('CACES',                          'cert-caces',                   'certification', 50),
  ('Habilitation Électrique BR/B1V', 'cert-habilitation-electrique','certification', 60),
  ('ASPAM',                          'cert-aspam',                   'certification', 70),
  ('Six Sigma Green Belt',           'cert-six-sigma-green',        'certification', 80),
  ('Six Sigma Black Belt',           'cert-six-sigma-black',        'certification', 90),
  ('APICS CPIM',                     'cert-apics-cpim',             'certification', 100);

-- Languages (6)
INSERT INTO skill_tags (name, slug, category, sort_order) VALUES
  ('Français',                       'lang-francais',               'language', 10),
  ('Anglais',                        'lang-anglais',                'language', 20),
  ('Arabe',                          'lang-arabe',                  'language', 30),
  ('Tamazight',                      'lang-tamazight',              'language', 40),
  ('Mandarin',                       'lang-mandarin',               'language', 50),
  ('Espagnol',                       'lang-espagnol',               'language', 60);
