from robotics.connectors.kicad_connector import KiCadConnector
from robotics.connectors.librepcb_connector import LibrePCBConnector
from robotics.connectors.sparkfun_connector import SparkFunConnector
from robotics.connectors.ros_connector import ROSConnector
from robotics.services.db import get_conn
from robotics.services.part_indexer import clear_source, insert_parts

CONNECTORS = {
    "kicad": KiCadConnector,
    "librepcb": LibrePCBConnector,
    "sparkfun": SparkFunConnector,
    "ros": ROSConnector,
}


def log_import(source: str, status: str, details: str = ""):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO robotics_import_runs (source, status, details) VALUES (?, ?, ?)",
            (source, status, details),
        )


def run_import(source: str) -> dict:
    connector_cls = CONNECTORS[source]
    connector = connector_cls()

    try:
        log_import(source, "running", "Iniciando importação")
        local_path = connector.fetch()
        items = connector.scan(local_path)

        clear_source(source)
        insert_parts(items)

        result = {
            "ok": True,
            "source": source,
            "imported": len(items),
            "local_path": local_path,
        }
        log_import(source, "success", str(result))
        return result
    except Exception as e:
        result = {"ok": False, "source": source, "error": str(e)}
        log_import(source, "error", str(result))
        return result


def run_import_all() -> list[dict]:
    results = []
    for source in CONNECTORS:
        results.append(run_import(source))
    return results