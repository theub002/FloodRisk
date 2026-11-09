import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'local_reports.json');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'reports');

function getLocalReports(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = fs.readFileSync(REPORTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local reports:', err);
  }
  return [];
}

function saveLocalReports(reports: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local reports:', err);
  }
}

export async function GET(req: NextRequest) {
  // 1. Try local FastAPI backend first if available
  try {
    const fastApiResponse = await fetch('http://127.0.0.1:8000/api/reports', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // Local FastAPI is not running, proceed to fallback storage
  }

  // 2. Return local file-based reports
  const reports = getLocalReports();
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 1. If local FastAPI backend is active, proxy the formData to it
    try {
      const fastApiResponse = await fetch('http://127.0.0.1:8000/api/reports', {
        method: 'POST',
        body: formData,
      });

      if (fastApiResponse.ok) {
        const result = await fastApiResponse.json();
        return NextResponse.json(result);
      }
    } catch {
      // Local FastAPI server not listening on 8000, save locally
    }

    // 2. Save report locally in data/local_reports.json and files in public/uploads/reports
    if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
      fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
    }

    const savedMediaUrls: string[] = [];
    const files = formData.getAll('files');

    for (const fileItem of files) {
      if (fileItem instanceof File && fileItem.name) {
        const ext = path.extname(fileItem.name).toLowerCase() || '.jpg';
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const filePath = path.join(PUBLIC_UPLOADS_DIR, safeName);

        const bytes = await fileItem.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(bytes));
        savedMediaUrls.push(`/uploads/reports/${safeName}`);
      }
    }

    const currentReports = getLocalReports();
    const nextId = currentReports.length > 0 ? Math.max(...currentReports.map((r: any) => r.id || 0)) + 1 : 1;

    const newReport = {
      id: nextId,
      created_at: new Date().toISOString(),
      city_id: formData.get('city_id') ? Number(formData.get('city_id')) : null,
      city_name: (formData.get('city_name') as string) || null,
      ward_id: formData.get('ward_id') ? Number(formData.get('ward_id')) : null,
      ward_name: (formData.get('ward_name') as string) || null,
      latitude: formData.has('latitude') ? Number(formData.get('latitude')) : 23.2599,
      longitude: formData.has('longitude') ? Number(formData.get('longitude')) : 77.4126,
      address_notes: (formData.get('address_notes') as string) || null,
      flood_depth: (formData.get('flood_depth') as string) || 'Knee-deep (~1.5 ft / 45 cm)',
      flood_depth_custom: (formData.get('flood_depth_custom') as string) || null,
      blockage: (formData.get('blockage') as string) || 'Completely Blocked Drain / Culvert',
      blockage_details: (formData.get('blockage_details') as string) || null,
      road_submerged: (formData.get('road_submerged') as string) || 'Fully Submerged & Impassable',
      vehicles_stranded: formData.get('vehicles_stranded') === 'true',
      house_flooding: (formData.get('house_flooding') as string) || 'Water entered inside ground floor living quarters',
      description: (formData.get('description') as string) || null,
      reporter_name: (formData.get('reporter_name') as string) || 'Anonymous Citizen',
      reporter_phone: (formData.get('reporter_phone') as string) || null,
      media_urls: savedMediaUrls,
      status: 'Reported',
      message: 'Flood report successfully submitted',
    };

    currentReports.unshift(newReport);
    saveLocalReports(currentReports);

    return NextResponse.json(newReport);
  } catch (err: any) {
    console.error('Next.js API reports error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing report' },
      { status: 500 }
    );
  }
}

