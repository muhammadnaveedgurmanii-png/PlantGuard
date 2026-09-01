-- PHASE 12: Seed a small curated "Verified PlantGuard Knowledge" base.
-- These are well-established, textbook plant-pathology facts (not scraped,
-- not invented sources -- general agricultural extension knowledge that is
-- widely documented). Source field is intentionally generic/honest: we do
-- not claim a specific citation we haven't verified.

INSERT OR IGNORE INTO knowledge_base (plant_name, disease_name, symptoms, causes, treatment, prevention, source, verified, last_updated) VALUES
('Tomato', 'Tomato Early Blight',
 '["Small dark brown spots with concentric rings (target-like pattern) on older/lower leaves","Yellowing around spots","Leaves eventually wither and drop"]',
 '["Fungus Alternaria solani","Favored by warm temperatures and high humidity/leaf wetness","Spreads via wind, splashing water, and infected debris"]',
 '["Remove and destroy infected leaves promptly","Apply a labeled fungicide (e.g. chlorothalonil or copper-based) at first sign of disease","Improve airflow by pruning and proper plant spacing"]',
 '["Rotate crops (avoid planting tomato/potato in the same spot yearly)","Water at the base, avoid wetting foliage","Mulch to reduce soil splash onto lower leaves","Use resistant varieties where available"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Tomato', 'Tomato Late Blight',
 '["Large, irregular water-soaked dark green to brown lesions on leaves","White fuzzy fungal growth on the underside of lesions in humid conditions","Can rapidly kill entire plants in cool, wet weather"]',
 '["Oomycete Phytophthora infestans","Thrives in cool, wet, humid conditions","Spreads rapidly via wind-blown spores over long distances"]',
 '["Remove and destroy infected plants immediately -- this disease spreads fast","Apply a protective fungicide before/at first symptoms if forecast is cool and wet","Avoid working in wet fields to reduce spread"]',
 '["Plant resistant varieties","Ensure good drainage and airflow","Avoid overhead irrigation","Monitor local/regional blight forecasts during cool, wet seasons"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Potato', 'Potato Late Blight',
 '["Dark, water-soaked lesions on leaves and stems, often starting at leaf tips/edges","White mold growth on lesion undersides in humid weather","Tubers can develop reddish-brown rot"]',
 '["Oomycete Phytophthora infestans","Favored by cool, humid, wet weather","Spreads via wind-blown spores"]',
 '["Remove and destroy infected foliage/tubers","Apply protectant fungicide proactively in high-risk (cool, wet) weather","Harvest tubers only after foliage has dried, avoid bruising"]',
 '["Use certified disease-free seed potatoes","Hill soil over tubers to reduce spore contact","Rotate crops away from tomato/potato family for 2-3 years"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Apple', 'Apple Scab',
 '["Olive-green to black velvety spots on leaves and fruit","Leaves may yellow and drop early","Fruit develops corky, scabby lesions and can crack"]',
 '["Fungus Venturia inaequalis","Spores released and spread during wet spring weather","Infection requires extended leaf wetness"]',
 '["Rake and destroy fallen leaves in autumn to reduce overwintering spores","Apply fungicide sprays starting at bud break through wet spring weather per local guidance","Prune to improve air circulation"]',
 '["Choose scab-resistant apple varieties","Avoid overhead irrigation that prolongs leaf wetness","Maintain good orchard sanitation (remove leaf litter)"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Corn (Maize)', 'Corn Common Rust',
 '["Small, round to elongated orange-brown pustules on both leaf surfaces","Pustules turn dark brown/black as they mature","Severe cases cause leaf yellowing and premature death"]',
 '["Fungus Puccinia sorghi","Favored by moderate temperatures and high humidity","Spores spread by wind over long distances"]',
 '["Apply foliar fungicide if infection is severe and detected early in the season","Remove volunteer corn plants that can host the fungus between seasons"]',
 '["Plant resistant hybrids where available","Avoid excessive nitrogen which can increase susceptibility","Monitor fields regularly during humid periods"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Grape', 'Grape Black Rot',
 '["Small tan/brown circular spots on leaves with dark borders","Black, shriveled, mummified fruit","Cankers on shoots"]',
 '["Fungus Guignardia bidwellii","Overwinters in mummified fruit and infected canes","Spread by rain-splashed spores in warm, wet weather"]',
 '["Remove and destroy mummified fruit and infected canes during pruning","Apply fungicide program starting early in the growing season in high-risk regions"]',
 '["Improve canopy airflow via proper pruning/training","Avoid overhead irrigation","Practice thorough vineyard sanitation each season"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Cherry', 'Cherry Powdery Mildew',
 '["White powdery fungal growth on leaf surfaces and young shoots","Leaf curling and distortion","Reduced fruit quality in severe cases"]',
 '["Fungus Podosphaera clandestina","Favored by warm days, cool nights, and moderate humidity (does not require free water on leaves)","Spreads via airborne spores"]',
 '["Apply sulfur-based or other labeled fungicides at first sign","Prune to increase light penetration and air circulation"]',
 '["Avoid excessive nitrogen fertilization","Choose resistant varieties where available","Space trees to promote airflow"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01'),

('Squash', 'Squash Powdery Mildew',
 '["White powdery patches on leaf surfaces, spreading to cover whole leaves","Leaves may yellow, curl, and die prematurely","Reduced yield and fruit quality"]',
 '["Various powdery mildew fungi (e.g. Podosphaera xanthii)","Favored by high humidity and moderate temperatures, but not free water on leaves","Spreads via wind-blown spores"]',
 '["Apply sulfur, potassium bicarbonate, or other labeled fungicide at first sign","Remove severely infected leaves"]',
 '["Choose resistant varieties","Space plants for good airflow","Avoid overhead watering late in the day"]',
 'PlantGuard curated agronomy reference', 1, '2025-01-01');
