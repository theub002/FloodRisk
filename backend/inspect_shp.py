import shapefile

sf = shapefile.Reader(r"c:\Users\MJ\FloodRisk\data\shapefiles\Wardwise_Shapefiles\Indore\indore_wards.shp")
print("Fields:")
print(sf.fields)

# Print first 5 records
for i, record in enumerate(sf.records()[:5]):
    print(f"\nRecord {i}:")
    for field, val in zip(sf.fields[1:], record):
        print(f"  {field[0]}: {val}")
