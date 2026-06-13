from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class City(Base):
    __tablename__ = "cities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    wards = relationship("Ward", back_populates="city", cascade="all, delete-orphan")
    terrain_stats = relationship("TerrainStats", back_populates="city", uselist=False, cascade="all, delete-orphan")
    rainfall_stats = relationship("RainfallStats", back_populates="city", cascade="all, delete-orphan")
    rainfall_intensities = relationship("RainfallIntensity", back_populates="city", cascade="all, delete-orphan")

class Ward(Base):
    __tablename__ = "wards"
    
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    ward_number = Column(Integer, index=True)
    name = Column(String, index=True)
    geometry = Column(JSON, nullable=False) # Stores the GeoJSON Geometry dict
    population = Column(Integer, default=0)
    
    city = relationship("City", back_populates="wards")
    yearly_stats = relationship("WardYearlyStats", back_populates="ward", cascade="all, delete-orphan")

class WardYearlyStats(Base):
    __tablename__ = "ward_yearly_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, index=True, nullable=False)
    
    fri_mean = Column(Float)
    fri_max = Column(Float)
    fri_min = Column(Float)
    fri_std = Column(Float)
    
    fhi_mean = Column(Float)
    fhi_max = Column(Float)
    
    fei_mean = Column(Float)
    fei_max = Column(Float)
    
    fvi_mean = Column(Float)
    fvi_max = Column(Float)
    
    category = Column(String) # Very Low, Low, Moderate, High, Very High
    rank = Column(Integer)
    
    ward = relationship("Ward", back_populates="yearly_stats")

class RainfallStats(Base):
    __tablename__ = "rainfall_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, index=True, nullable=False)
    
    breakdown = Column(String)
    peak_month = Column(String)
    peak_value = Column(Float)
    peak_label = Column(String)
    
    mm_jan = Column(Float, default=0.0)
    mm_feb = Column(Float, default=0.0)
    mm_mar = Column(Float, default=0.0)
    mm_apr = Column(Float, default=0.0)
    mm_may = Column(Float, default=0.0)
    mm_jun = Column(Float, default=0.0)
    mm_jul = Column(Float, default=0.0)
    mm_aug = Column(Float, default=0.0)
    mm_sep = Column(Float, default=0.0)
    mm_oct = Column(Float, default=0.0)
    mm_nov = Column(Float, default=0.0)
    mm_dec = Column(Float, default=0.0)
    
    wet_days = Column(Integer, default=0)
    
    city = relationship("City", back_populates="rainfall_stats")

class TerrainStats(Base):
    __tablename__ = "terrain_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    
    elev_min = Column(Float)
    elev_max = Column(Float)
    elev_mean = Column(Float)
    elev_std = Column(Float)
    
    slope_min = Column(Float)
    slope_max = Column(Float)
    slope_mean = Column(Float)
    
    area_km2 = Column(Float)
    
    city = relationship("City", back_populates="terrain_stats")

class RainfallIntensity(Base):
    __tablename__ = "rainfall_intensities"
    
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, index=True, nullable=False)
    
    max_int_date = Column(String)
    max_mm_day = Column(Float)
    
    city = relationship("City", back_populates="rainfall_intensities")
