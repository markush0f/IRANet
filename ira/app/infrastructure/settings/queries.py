async def get_configuration(): 
    query = """
        SELECT
            ts,
            value
        FROM metrics_points
        WHERE metric = $1
          AND host = $2
          AND ts BETWEEN $3 AND $4
        ORDER BY ts ASC
    """