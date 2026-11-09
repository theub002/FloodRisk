import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from database import get_db, engine
import models

# Create database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Urban Flood Risk Index GIS Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
REPORTS_UPLOADS_DIR = os.path.join(UPLOADS_DIR, "reports")
os.makedirs(REPORTS_UPLOADS_DIR, exist_ok=True)

# Mount uploads static folder
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

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
                "population": yearly_stat.population,
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
        "rank": s.rank,
        "population": s.population
    } for s in stats]
    
    return {
        "ward_id": ward.id,
        "ward_number": ward.ward_number,
        "ward_name": ward.name,
        "population": ward.population,
        "trends": trends
    }


# ==========================================
# Community Flood Incident Reporting Endpoints
# ==========================================

@app.post("/api/reports")
async def create_flood_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    city_id: Optional[int] = Form(None),
    city_name: Optional[str] = Form(None),
    ward_id: Optional[int] = Form(None),
    ward_name: Optional[str] = Form(None),
    address_notes: Optional[str] = Form(None),
    flood_depth: str = Form(...),
    flood_depth_custom: Optional[str] = Form(None),
    blockage: str = Form(...),
    blockage_details: Optional[str] = Form(None),
    road_submerged: str = Form(...),
    vehicles_stranded: bool = Form(False),
    house_flooding: str = Form(...),
    description: Optional[str] = Form(None),
    reporter_name: Optional[str] = Form("Anonymous"),
    reporter_phone: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    saved_media_urls = []
    for file in files:
        if file and file.filename:
            # Generate a safe unique filename preserving extension
            ext = os.path.splitext(file.filename)[1].lower()
            safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
            file_path = os.path.join(REPORTS_UPLOADS_DIR, safe_name)
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            saved_media_urls.append(f"/uploads/reports/{safe_name}")

    report = models.FloodReport(
        created_at=datetime.now(timezone.utc).isoformat(),
        city_id=city_id,
        city_name=city_name,
        ward_id=ward_id,
        ward_name=ward_name,
        latitude=latitude,
        longitude=longitude,
        address_notes=address_notes,
        flood_depth=flood_depth,
        flood_depth_custom=flood_depth_custom,
        blockage=blockage,
        blockage_details=blockage_details,
        road_submerged=road_submerged,
        vehicles_stranded=1 if vehicles_stranded else 0,
        house_flooding=house_flooding,
        description=description,
        reporter_name=reporter_name or "Anonymous",
        reporter_phone=reporter_phone,
        media_urls=saved_media_urls,
        status="Reported"
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "created_at": report.created_at,
        "city_id": report.city_id,
        "city_name": report.city_name,
        "ward_id": report.ward_id,
        "ward_name": report.ward_name,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "address_notes": report.address_notes,
        "flood_depth": report.flood_depth,
        "flood_depth_custom": report.flood_depth_custom,
        "blockage": report.blockage,
        "blockage_details": report.blockage_details,
        "road_submerged": report.road_submerged,
        "vehicles_stranded": bool(report.vehicles_stranded),
        "house_flooding": report.house_flooding,
        "description": report.description,
        "reporter_name": report.reporter_name,
        "reporter_phone": report.reporter_phone,
        "media_urls": report.media_urls,
        "status": report.status,
        "message": "Flood report successfully submitted"
    }


@app.get("/api/reports")
def get_flood_reports(
    city_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.FloodReport)
    if city_id is not None:
        query = query.filter(models.FloodReport.city_id == city_id)
    
    reports = query.order_by(models.FloodReport.id.desc()).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "created_at": r.created_at,
            "city_id": r.city_id,
            "city_name": r.city_name,
            "ward_id": r.ward_id,
            "ward_name": r.ward_name,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "address_notes": r.address_notes,
            "flood_depth": r.flood_depth,
            "flood_depth_custom": r.flood_depth_custom,
            "blockage": r.blockage,
            "blockage_details": r.blockage_details,
            "road_submerged": r.road_submerged,
            "vehicles_stranded": bool(r.vehicles_stranded),
            "house_flooding": r.house_flooding,
            "description": r.description,
            "reporter_name": r.reporter_name,
            "media_urls": r.media_urls,
            "status": r.status
        }
        for r in reports
    ]


@app.get("/api/reports/{report_id}")
def get_flood_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.FloodReport).filter(models.FloodReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Flood report not found")
    return {
        "id": report.id,
        "created_at": report.created_at,
        "city_id": report.city_id,
        "city_name": report.city_name,
        "ward_id": report.ward_id,
        "ward_name": report.ward_name,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "address_notes": report.address_notes,
        "flood_depth": report.flood_depth,
        "flood_depth_custom": report.flood_depth_custom,
        "blockage": report.blockage,
        "blockage_details": report.blockage_details,
        "road_submerged": report.road_submerged,
        "vehicles_stranded": bool(report.vehicles_stranded),
        "house_flooding": report.house_flooding,
        "description": report.description,
        "reporter_name": report.reporter_name,
        "reporter_phone": report.reporter_phone,
        "media_urls": report.media_urls,
        "status": report.status
    }
