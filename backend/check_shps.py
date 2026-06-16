
import shapefile
shp = shapefile.Reader(r'c:/Users/MJ/FloodRisk/Wardwise_Shapefiles/Punasa/Punasa_wards.shp')
print(shp.shape(0).points[:2])
