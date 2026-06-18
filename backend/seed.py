import os
import csv
import json
import shapefile
import unicodedata
from database import engine, SessionLocal
from models import Base, City, Ward, WardYearlyStats, TerrainStats, RainfallStats, RainfallIntensity

# Load transliteration dictionary for Bhopal wards from JSON file
BHOPAL_WARD_MAP = {}
map_path = os.path.join(os.path.dirname(__file__), "bhopal_ward_map.json")
if os.path.exists(map_path):
    with open(map_path, 'r', encoding='utf-8') as f:
        raw_map = json.load(f)
        BHOPAL_WARD_MAP = {unicodedata.normalize('NFC', k).strip(): v for k, v in raw_map.items()}
else:
    print("WARNING: bhopal_ward_map.json not found in backend directory!")

def clean_ward_name(name_val, city_name):
    if isinstance(name_val, bytes):
        try:
            name_val = name_val.decode('utf-8', errors='ignore')
        except Exception:
            name_val = name_val.decode('latin-1', errors='ignore')
    name = str(name_val).strip()
    if city_name == "Bhopal":
        norm_name = unicodedata.normalize('NFC', name).strip()
        if norm_name in BHOPAL_WARD_MAP:
            return BHOPAL_WARD_MAP[norm_name]
    return name

def seed_city(db, config):
    city_name = config["name"]
    shp_path = config["shp_path"]
    data_dir = config["data_dir"]
    ward_num_field = config["ward_number_field"]
    ward_name_field = config["ward_name_field"]
    
    # 1. Create City entry
    city = City(name=city_name)
    db.add(city)
    db.commit()
    db.refresh(city)
    print(f"Created city: {city.name} with ID: {city.id}")
    
    # 2. Parse Shapefile and create Wards
    sf = shapefile.Reader(shp_path)
    
    # Load population from 1981 folder (same across all years)
    pop_path = os.path.join(data_dir, "1981", "table_ward_population.csv")
    ward_pop = {}
    if os.path.exists(pop_path):
        with open(pop_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                w_id = int(row['ward_id'])
                pop = int(row['population'])
                ward_pop[w_id] = pop
    
    # Insert Wards into database
    wards_by_number = {}
    for sr in sf.shapeRecords():
        record = sr.record
        shape = sr.shape
        
        # Extract ward number
        try:
            ward_num_val = record[ward_num_field]
            if isinstance(ward_num_val, bytes):
                ward_num_val = ward_num_val.decode('utf-8', errors='ignore')
            ward_num = int(float(str(ward_num_val).strip()))
        except (ValueError, KeyError, TypeError) as e:
            continue
            
        try:
            ward_name_val = record[ward_name_field]
            ward_name = clean_ward_name(ward_name_val, city_name)
        except (ValueError, KeyError, TypeError):
            ward_name = f"Ward {ward_num}"
            
        if not ward_name:
            ward_name = f"Ward {ward_num}"
            
        # Convert shape to GeoJSON Geometry
        geometry = shape.__geo_interface__
        
        pop = ward_pop.get(ward_num, 0)
        
        ward = Ward(
            city_id=city.id,
            ward_number=ward_num,
            name=ward_name,
            geometry=geometry,
            population=pop
        )
        db.add(ward)
        wards_by_number[ward_num] = ward
        
    db.commit()
    print(f"Seeded {len(wards_by_number)} wards for {city_name}.")
    
    # 3. Seed Terrain Stats
    terrain_path = os.path.join(data_dir, "1981", "terrain_stats.csv")
    if os.path.exists(terrain_path):
        with open(terrain_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                t_stats = TerrainStats(
                    city_id=city.id,
                    elev_min=float(row['elev_min']),
                    elev_max=float(row['elev_max']),
                    elev_mean=float(row['elev_mean']),
                    elev_std=float(row['elev_std']),
                    slope_min=float(row['slope_min']),
                    slope_max=float(row['slope_max']),
                    slope_mean=float(row['slope_mean']),
                    area_km2=float(row['area_km2'])
                )
                db.add(t_stats)
                break
        db.commit()
        print(f"Seeded terrain stats for {city_name}.")
        
    # 4. Seed Yearly Rainfall and Intensity Stats
    rainfall_path = os.path.join(data_dir, "1981", "table10_monthly_rainfall.csv")
    wet_days_path = os.path.join(data_dir, "1981", "wet_days.csv")
    intensity_path = os.path.join(data_dir, "1981", "table_max_daily_intensity.csv")
    
    wet_days_by_year = {}
    if os.path.exists(wet_days_path):
        with open(wet_days_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                wet_days_by_year[int(row['year'])] = int(row['wet_days'])
                
    if os.path.exists(rainfall_path):
        with open(rainfall_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                yr = int(row['year'])
                rf = RainfallStats(
                    city_id=city.id,
                    year=yr,
                    breakdown=row['breakdown'],
                    peak_month=row['peak_month'],
                    peak_value=float(row['peak_value']),
                    peak_label=row['peak_label'],
                    mm_jan=float(row['mm_jan']),
                    mm_feb=float(row['mm_feb']),
                    mm_mar=float(row['mm_mar']),
                    mm_apr=float(row['mm_apr']),
                    mm_may=float(row['mm_may']),
                    mm_jun=float(row['mm_jun']),
                    mm_jul=float(row['mm_jul']),
                    mm_aug=float(row['mm_aug']),
                    mm_sep=float(row['mm_sep']),
                    mm_oct=float(row['mm_oct']),
                    mm_nov=float(row['mm_nov']),
                    mm_dec=float(row['mm_dec']),
                    wet_days=wet_days_by_year.get(yr, 0)
                )
                db.add(rf)
        db.commit()
        print(f"Seeded monthly rainfall stats for {city_name}.")
        
    if os.path.exists(intensity_path):
        with open(intensity_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ri = RainfallIntensity(
                    city_id=city.id,
                    year=int(row['year']),
                    max_int_date=row['max_int_date'],
                    max_mm_day=float(row['max_mm_day'])
                )
                db.add(ri)
        db.commit()
        print(f"Seeded rainfall intensity stats for {city_name}.")
        
    # 5. Seed Ward Yearly stats (loop through each year folder from 1981 to 2024)
    years = sorted([int(d) for d in os.listdir(data_dir) if d.isdigit()])
    
    for yr in years:
        yr_dir = os.path.join(data_dir, str(yr))
        fri_file = os.path.join(yr_dir, "ward_fri_values.csv")
        indices_file = os.path.join(yr_dir, "table_ward_all_indices.csv")
        pop_file = os.path.join(yr_dir, "table_ward_population.csv")
        
        if not os.path.exists(fri_file) or not os.path.exists(indices_file):
            continue
            
        # Read FRI values
        fri_data = {}
        with open(fri_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    w_num = int(row['ward'])
                    fri_data[w_num] = {
                        'mean': float(row['fri_mean']),
                        'max': float(row['fri_max']),
                        'min': float(row['fri_min']),
                        'std': float(row['fri_std']),
                        'category': row['category']
                    }
                except Exception as e:
                    continue
                
        # Read indices values
        indices_data = {}
        with open(indices_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    w_num = int(row['ward'])
                    indices_data[w_num] = {
                        'fhi_mean': float(row['FHI_mean']),
                        'fhi_max': float(row['FHI_max']),
                        'fei_mean': float(row['FEI_mean']),
                        'fei_max': float(row['FEI_max']),
                        'fvi_mean': float(row['FVI_mean']),
                        'fvi_max': float(row['FVI_max'])
                    }
                except Exception as e:
                    continue
        
        # Read yearly population data
        pop_data = {}
        if os.path.exists(pop_file):
            with open(pop_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        w_id = int(row['ward_id'])
                        pop_val = int(row['population'])
                        pop_data[w_id] = pop_val
                    except Exception:
                        continue
        
        # Rank wards by fri_mean descending
        sorted_wards = sorted(fri_data.keys(), key=lambda w: fri_data[w]['mean'], reverse=True)
        ranks = {w: idx + 1 for idx, w in enumerate(sorted_wards)}
        
        # Save stats
        for w_num, fri in fri_data.items():
            if w_num not in wards_by_number:
                continue
                
            ward_obj = wards_by_number[w_num]
            idx_data = indices_data.get(w_num, {})
            
            stats = WardYearlyStats(
                ward_id=ward_obj.id,
                year=yr,
                fri_mean=fri['mean'],
                fri_max=fri['max'],
                fri_min=fri['min'],
                fri_std=fri['std'],
                fhi_mean=idx_data.get('fhi_mean'),
                fhi_max=idx_data.get('fhi_max'),
                fei_mean=idx_data.get('fei_mean'),
                fei_max=idx_data.get('fei_max'),
                fvi_mean=idx_data.get('fvi_mean'),
                fvi_max=idx_data.get('fvi_max'),
                category=fri['category'],
                rank=ranks.get(w_num, 0),
                population=pop_data.get(w_num, 0)
            )
            db.add(stats)
        db.commit()
    print(f"Successfully finished seeding stats for {city_name}.")

def seed_data():
    # Drop and recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    cities_config = [
        # Existing Cities
        {
            "name": "Indore",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Indore\indore_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_indore",
            "ward_number_field": "sourcewa_1",
            "ward_name_field": "ward_lgd_n"
        },
        {
            "name": "Bhopal",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Bhopal\Bhopal_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_bhopal",
            "ward_number_field": "Ward_Numbe",
            "ward_name_field": "Name"
        },
        {
            "name": "Jabalpur",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Jabalpur\Jabalpur_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_jabalpur",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Amarkantak",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Amarkantak\Amarkantak_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_amarkantak",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Dindori",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Dindori\Dindori_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_dindori",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Khandwa",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Khandwa\Khandwa_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_khandwa",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Narmadapuram",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Narmadapuram\Narmadapuram_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_narmadapuram",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Punasa",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Punasa\Punasa_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_punasa",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        # New Cities
        {
            "name": "Barwaha",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Barwaha\Barwaha_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_barwaha",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Bhedaghat",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Bhedaghat\Bhedaghat.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_bhedaghat",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Budni",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Budni\Budni_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_budni",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Dahi",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Dahi\Dahi_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_dahi",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Dhamnod",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Dhamnod\Dhamnod_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_dhamnod",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Dharampuri",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Dharampuri\Dharampuri_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_dharampuri",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Harsud",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Harsud\Harsud_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_harsud",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Kasrawad",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Kasrawad\Kasrawad_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_kasrawad",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Maheshwar",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Maheshwar\Maheshwar_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_maheshwar",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Mandla",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Mandla\Mandla_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_mandla",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Mandleshwar",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Mandleshwar\Mandleshwar_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_mandleshwar",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Nasrullaganj",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Nasrullaganj\Nasrullaganj_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_nasrullaganj",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Nemawar",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Nemawar\Nemawar_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_nemawar",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Omkareshwar",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Omkareshwar\Omkareshwar_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_omkareshwar",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        },
        {
            "name": "Shahganj",
            "shp_path": r"c:\Users\MJ\FloodRisk\Wardwise_Shapefiles\Shahganj\Shahganj_wards.shp",
            "data_dir": r"c:\Users\MJ\FloodRisk\data\output_shahganj",
            "ward_number_field": "wardno",
            "ward_name_field": "wardname"
        }
    ]
    
    try:
        for config in cities_config:
            # Check shapefile and data directory exist before seeding
            if os.path.exists(config["shp_path"]) and os.path.exists(config["data_dir"]):
                seed_city(db, config)
            else:
                print(f"Skipping {config['name']}: Shapefile or data directory not found.")
                
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
