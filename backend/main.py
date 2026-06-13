from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db, engine
import models

app = FastAPI(title="Urban Flood Risk Index GIS Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/cities")
def get_cities(db: Session = Depends(get_db)):
    cities = db.query(models.City).all()
    return [{"id": c.id, "name": c.name} for c in cities]

@app.get("/api/terrain")
def get_terrain_stats(city_id: int, db: Session = Depends(get_db)):
    stats = db.query(models.TerrainStats).filter(models.TerrainStats.city_id == city_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Terrain stats not found")
    return {
        "elev_min": stats.elev_min,
        "elev_max": stats.elev_max,
        "elev_mean": stats.elev_mean,
        "elev_std": stats.elev_std,
        "slope_min": stats.slope_min,
        "slope_max": stats.slope_max,
        "slope_mean": stats.slope_mean,
        "area_km2": stats.area_km2
    }

@app.get("/api/rainfall")
def get_rainfall_stats(city_id: int, db: Session = Depends(get_db)):
    # Returns rainfall intensity and wet days history
    intensities = db.query(models.RainfallIntensity).filter(models.RainfallIntensity.city_id == city_id).order_by(models.RainfallIntensity.year).all()
    stats = db.query(models.RainfallStats).filter(models.RainfallStats.city_id == city_id).order_by(models.RainfallStats.year).all()
    
    intensity_list = [{
        "year": ri.year,
        "max_int_date": ri.max_int_date,
        "max_mm_day": ri.max_mm_day
    } for ri in intensities]
    
    stats_list = [{
        "year": s.year,
        "wet_days": s.wet_days,
        "peak_month": s.peak_month,
        "peak_value": s.peak_value,
        "peak_label": s.peak_label,
        "breakdown": s.breakdown,
        "months": {
            "Jan": s.mm_jan, "Feb": s.mm_feb, "Mar": s.mm_mar, "Apr": s.mm_apr,
            "May": s.mm_may, "Jun": s.mm_jun, "Jul": s.mm_jul, "Aug": s.mm_aug,
            "Sep": s.mm_sep, "Oct": s.mm_oct, "Nov": s.mm_nov, "Dec": s.mm_dec
        }
    } for s in stats]
    
    return {
        "intensities": intensity_list,
        "rainfall": stats_list
    }

@app.get("/api/wards")
def get_wards(city_id: int, year: int, db: Session = Depends(get_db)):
    # Fetch all wards for the city
    wards = db.query(models.Ward).filter(models.Ward.city_id == city_id).all()
    
    features = []
    for w in wards:
        # Get yearly stats for this specific year
        yearly_stat = db.query(models.WardYearlyStats).filter(
            models.WardYearlyStats.ward_id == w.id,
            models.WardYearlyStats.year == year
        ).first()
        
        if not yearly_stat:
            continue
            
        features.append({
            "type": "Feature",
            "geometry": w.geometry,
            "properties": {
                "ward_id": w.id,
                "ward_number": w.ward_number,
                "ward_name": w.name,
                "population": w.population,
                "year": year,
                "fri_mean": yearly_stat.fri_mean,
                "fri_max": yearly_stat.fri_max,
                "fri_min": yearly_stat.fri_min,
                "fri_std": yearly_stat.fri_std,
                "fhi_mean": yearly_stat.fhi_mean,
                "fhi_max": yearly_stat.fhi_max,
                "fei_mean": yearly_stat.fei_mean,
                "fei_max": yearly_stat.fei_max,
                "fvi_mean": yearly_stat.fvi_mean,
                "fvi_max": yearly_stat.fvi_max,
                "category": yearly_stat.category,
                "rank": yearly_stat.rank
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.get("/api/trends")
def get_ward_trends(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(models.Ward).filter(models.Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    stats = db.query(models.WardYearlyStats).filter(
        models.WardYearlyStats.ward_id == ward_id
    ).order_by(models.WardYearlyStats.year).all()
    
    trends = [{
        "year": s.year,
        "fri_mean": s.fri_mean,
        "fri_max": s.fri_max,
        "fri_min": s.fri_min,
        "fri_std": s.fri_std,
        "fhi_mean": s.fhi_mean,
        "fei_mean": s.fei_mean,
        "fvi_mean": s.fvi_mean,
        "category": s.category,
        "rank": s.rank
    } for s in stats]
    
    return {
        "ward_id": ward.id,
        "ward_number": ward.ward_number,
        "ward_name": ward.name,
        "population": ward.population,
        "trends": trends
    }
