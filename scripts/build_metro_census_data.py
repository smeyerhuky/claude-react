#!/usr/bin/env python3
"""Generate reproducible metro anchor CSV from official Census estimates and Gazetteer coordinates.

Sources:
  2025 CBSA-MET-EST2025-POP (Census Population Estimates Program)
  Census Gazetteer CBSA national internal representative points
No fake population values, and no fuzzy merges: join on 5-digit CBSA GEOID when
available, otherwise normalize exact names and flag ambiguous/unmatched entries.
"""
from __future__ import annotations
import csv
import io
import json
import re
import urllib.request
import zipfile
import shapefile
from pathlib import Path
from openpyxl import load_workbook

POP_URL = "https://www2.census.gov/programs-surveys/popest/tables/2020-2025/metro/totals/cbsa-met-est2025-pop.xlsx"
GEO_URL = "https://www2.census.gov/geo/tiger/TIGER2025/CBSA/tl_2025_us_cbsa.zip"
OUTPUT = Path("public/data/metros-census-2025.csv")
REPORT = Path("public/data/metros-census-2025.report.json")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "claude-react-metro-data/1.0"})
    with urllib.request.urlopen(request, timeout=55) as response:
        return response.read()


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower().replace("metropolitan statistical area", "").replace("metro area", ""))


def gazetteer():
    """Use official TIGER CBSA geography; its DBF includes INTPTLAT/INTPTLON."""
    archive = zipfile.ZipFile(io.BytesIO(get(GEO_URL)))
    dbf = next(n for n in archive.namelist() if n.lower().endswith(".dbf"))
    reader = shapefile.Reader(dbf=io.BytesIO(archive.read(dbf)), encoding="utf-8")
    rows = [record.as_dict() for record in reader.records()]
    metros = [r for r in rows if str(r.get("LSAD", "")).strip() == "M1"]
    if len(metros) < 350:
        raise ValueError(f"Expected >=350 metropolitan CBSA shapes, received {len(metros)}")
    return metros, GEO_URL


def poprows():
    wb = load_workbook(io.BytesIO(get(POP_URL)), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.values)
    header_index = next((i for i, row in enumerate(rows[:20]) if
        any("geographic area" in str(cell).lower() for cell in row if cell is not None)), None)
    if header_index is None:
        raise ValueError("Could not locate Census Geographic Area header")
    header = [str(x).strip().lower() if x is not None else "" for x in rows[header_index]]
    area_col = next(i for i, x in enumerate(header) if "geographic area" in x)
    # Census workbook has a two-row header: column titles followed by years.
    year_cols = [i for j in range(max(0, header_index - 2), min(len(rows), header_index + 4))
                 for i, val in enumerate(rows[j])
                 if str(val).strip() == "2025"]
    if not year_cols:
        raise ValueError("Cannot identify 2025 column; header rows: " + repr(rows[:header_index+4]))
    year_col = max(year_cols)
    code_cols = [i for i, x in enumerate(header) if "cbsa" in x or "geographic identifier" in x]
    result = []
    for row in rows[header_index + 1:]:
        name = str(row[area_col] or "").strip()
        raw = row[year_col] if year_col < len(row) else None
        try:
            pop = int(str(raw).replace(",", ""))
        except (ValueError, TypeError):
            continue
        if not name or pop < 100000 or "metro area" not in name.lower():
            continue
        code = ""
        if code_cols and code_cols[0] < len(row):
            candidate = str(row[code_cols[0]] or "").strip()
            if re.fullmatch(r"\d{5}(?:\.0)?", candidate):
                code = candidate[:5]
        result.append((name.lstrip("."), code, pop))
    if len(result) < 300:
        raise ValueError(f"Only {len(result)} metro population records; headers={header!r}; selected_year_col={year_col}; sample_rows={rows[header_index+1:header_index+5]!r}")
    return result


def main():
    gaz, geo_url = gazetteer()
    by_code, by_name = {}, {}
    for row in gaz:
        code = (row.get("GEOID") or row.get("CBSAFP") or "").strip()
        name = (row.get("NAME") or "").strip()
        lat = row.get("INTPTLAT") or row.get("INTPTLATITUDE")
        lon = row.get("INTPTLON") or row.get("INTPTLONG")
        try:
            point = (float(lon), float(lat))
        except (ValueError, TypeError):
            continue
        if code: by_code[code] = (name, *point)
        by_name.setdefault(norm(name), []).append((code, name, *point))

    found, unmatched = [], []
    for name, code, pop in poprows():
        match = by_code.get(code) if code else None
        if not match:
            candidates = by_name.get(norm(name), [])
            if len(candidates) == 1:
                code, matched_name, lon, lat = candidates[0]
                match = (matched_name, lon, lat)
        if match is None:
            unmatched.append(name)
            continue
        matched_name, lon, lat = match
        if not (-125 <= lon <= -66 and 24 <= lat <= 50):
            continue
        found.append((name, lon, lat, pop, code))

    if len(found) < 300:
        raise ValueError(f"Only {len(found)} metros matched official coordinates; review join and input formats")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(("name", "longitude", "latitude", "population", "cbsa"))
        w.writerows(sorted(found, key=lambda x: (-x[3], x[0])))
    REPORT.write_text(json.dumps({
        "population_source": POP_URL, "coordinate_source": geo_url,
        "matched_conus_metros_at_least_100k": len(found),
        "unmatched_names": unmatched, "generated_from": "2025 Census population estimates",
        "matching": "5-digit CBSA ID first; exact normalized name only as fallback",
        "anchor_definition": "TIGER/Line 2025 CBSA internal point, not principal city center",
    }, indent=2) + "\n")
    print(f"Wrote {len(found)} Census metros to {OUTPUT}; unmatched: {len(unmatched)}")


if __name__ == "__main__":
    main()
