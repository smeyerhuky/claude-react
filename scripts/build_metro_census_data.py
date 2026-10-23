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
from pathlib import Path
from openpyxl import load_workbook

POP_URL = "https://www2.census.gov/programs-surveys/popest/tables/2020-2025/metro/totals/cbsa-met-est2025-pop.xlsx"
GEO_URLS = [
    "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gazetteer_cbsa_national.zip",
    "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gazetteer_cbsa_national.zip",
]
OUTPUT = Path("public/data/metros-census-2025.csv")
REPORT = Path("public/data/metros-census-2025.report.json")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "claude-react-metro-data/1.0"})
    with urllib.request.urlopen(request, timeout=55) as response:
        return response.read()


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower().replace("metropolitan statistical area", "").replace("metro area", ""))


def gazetteer():
    errors = []
    for url in GEO_URLS:
        try:
            z = zipfile.ZipFile(io.BytesIO(get(url)))
            txt = next(x for x in z.namelist() if x.lower().endswith(".txt"))
            text = z.read(txt).decode("utf-8-sig")
            rows = list(csv.DictReader(io.StringIO(text), delimiter="\t"))
            if not rows:
                raise ValueError("Gazetteer contains no rows")
            return rows, url
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    raise RuntimeError("No official CBSA Gazetteer could be downloaded:\n" + "\n".join(errors))


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
    year_cols = [i for i, x in enumerate(header) if "2025" in x]
    if not year_cols:
        # Census spreadsheets sometimes merge a 2025 year heading above 'Population Estimate'.
        year_cols = [i for i in range(len(header)) if any(
            "2025" in str(rows[j][i]) for j in range(max(0, header_index - 3), header_index + 1)
            if i < len(rows[j]))]
    if not year_cols:
        raise ValueError("Cannot identify the July 1, 2025 population column")
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
        if not name or pop < 100000:
            continue
        code = ""
        if code_cols and code_cols[0] < len(row):
            candidate = str(row[code_cols[0]] or "").strip()
            if re.fullmatch(r"\d{5}(?:\.0)?", candidate):
                code = candidate[:5]
        result.append((name.lstrip("."), code, pop))
    if len(result) < 150:
        raise ValueError(f"Only {len(result)} metro population records; refusing partial release")
    return result


def main():
    gaz, geo_url = gazetteer()
    by_code, by_name = {}, {}
    for row in gaz:
        code = (row.get("GEOID") or row.get("GEOID2") or "").strip()
        name = (row.get("NAME") or "").strip()
        lat = row.get("INTPTLAT") or row.get("INTPTLATITUDE")
        lon = row.get("INTPTLONG") or row.get("INTPTLONGITUDE")
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

    if len(found) < 150:
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
        "anchor_definition": "Census Gazetteer representative point of CBSA geometry, not principal city center",
    }, indent=2) + "\n")
    print(f"Wrote {len(found)} Census metros to {OUTPUT}; unmatched: {len(unmatched)}")


if __name__ == "__main__":
    main()
