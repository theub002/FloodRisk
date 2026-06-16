import os

dirs = ['Amarkantak', 'Dindori', 'Khandwa', 'Narmadapuram', 'Punasa']
base = r'c:\Users\MJ\FloodRisk\Wardwise_Shapefiles'

for d in dirs:
    p = os.path.join(base, d)
    dbfs = [f for f in os.listdir(p) if f.endswith('.dbf')]
    if dbfs:
        with open(os.path.join(p, dbfs[0]), 'rb') as f:
            f.seek(32)
            cols = []
            while True:
                b = f.read(32)
                if not b or b[0] == 0x0D:
                    break
                cols.append(b[:11].decode('ascii', errors='ignore').strip('\0'))
            print(f'{d}: {cols}')
