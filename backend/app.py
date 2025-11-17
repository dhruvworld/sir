from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "city_route.parquet"
SOURCE_XLSX = BASE_DIR.parent / "city route.xlsx"
SEARCHABLE_COLUMNS = [
    "name",
    "relative_name",
    "relation",
    "epic_no",
    "house_no",
    "serial_no",
    "section_id",
    "booth_no",
    "ac_no",
    "gender",
]


def _normalize_series(series: pd.Series) -> pd.Series:
    return series.fillna("").astype("string")


def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    for column in df.columns:
        df[column] = _normalize_series(df[column])
    return df


def ensure_parquet() -> None:
    if DATA_PATH.exists():
        return

    if not SOURCE_XLSX.exists():
        raise FileNotFoundError(
            f"Missing dataset. Expected either {DATA_PATH} or the source Excel at {SOURCE_XLSX}."
        )

    df = pd.read_excel(SOURCE_XLSX)
    df.columns = [c.strip().lower() for c in df.columns]
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    prepare_dataframe(df).to_parquet(DATA_PATH, index=False)


@lru_cache(maxsize=1)
def load_data() -> pd.DataFrame:
    ensure_parquet()

    df = pd.read_parquet(DATA_PATH)
    return prepare_dataframe(df)


def filter_dataframe(
    df: pd.DataFrame,
    q: Optional[str] = None,
    name: Optional[str] = None,
    relative_name: Optional[str] = None,
    relation: Optional[str] = None,
    epic_no: Optional[str] = None,
    house_no: Optional[str] = None,
    serial_no: Optional[str] = None,
    section_id: Optional[str] = None,
    booth_no: Optional[str] = None,
    ac_no: Optional[str] = None,
) -> pd.DataFrame:
    filtered = df

    def apply_contains(column: str, value: Optional[str]) -> None:
        nonlocal filtered
        if value:
            pattern = value.strip().lower()
            filtered = filtered[
                filtered[column].str.lower().str.contains(pattern, na=False)
            ]

    apply_contains("name", name)
    apply_contains("relative_name", relative_name)
    apply_contains("relation", relation)
    apply_contains("epic_no", epic_no)
    apply_contains("house_no", house_no)
    apply_contains("serial_no", serial_no)
    apply_contains("section_id", section_id)
    apply_contains("booth_no", booth_no)
    apply_contains("ac_no", ac_no)

    if q:
        text = q.strip().lower()
        mask = pd.Series(False, index=filtered.index)
        for column in SEARCHABLE_COLUMNS:
            mask = mask | filtered[column].str.lower().str.contains(text, na=False)
        filtered = filtered[mask]

    return filtered


def dataframe_to_response(df: pd.DataFrame, limit: Optional[int]) -> List[Dict]:
    if limit is not None and limit > 0:
        df = df.head(limit)
    return df.to_dict(orient="records")


app = FastAPI(title="Kalol 2002 Voter Search", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
async def ping() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
async def meta() -> Dict[str, int]:
    df = load_data()
    return {"total_records": len(df)}


@app.get("/api/voters")
async def search_voters(
    q: Optional[str] = Query(None, description="Global fuzzy search across key fields"),
    name: Optional[str] = Query(None, description="Partial or full voter name"),
    relative_name: Optional[str] = Query(
        None, description="Partial or full relative name"
    ),
    relation: Optional[str] = Query(None, description="Type of relation (e.g., Father)"),
    epic_no: Optional[str] = Query(None, description="EPIC number"),
    house_no: Optional[str] = Query(None, description="House number"),
    serial_no: Optional[str] = Query(None, description="Serial number"),
    section_id: Optional[str] = Query(None, description="Section identifier"),
    booth_no: Optional[str] = Query(None, description="Booth identifier"),
    ac_no: Optional[str] = Query(None, description="AC number"),
    limit: Optional[int] = Query(
        None,
        ge=0,
        description="Optional cap on returned rows. Leave blank to get every match.",
    ),
) -> Dict[str, object]:
    df = load_data()
    filtered = filter_dataframe(
        df,
        q=q,
        name=name,
        relative_name=relative_name,
        relation=relation,
        epic_no=epic_no,
        house_no=house_no,
        serial_no=serial_no,
        section_id=section_id,
        booth_no=booth_no,
        ac_no=ac_no,
    )

    total_matches = len(filtered)
    records = dataframe_to_response(filtered, limit)

    return {
        "total": total_matches,
        "returned": len(records),
        "results": records,
    }

