WITH loss_points AS (
    SELECT
        ts,
        value,
        host,
        LAG(value) OVER (PARTITION BY host ORDER BY ts) AS prev_value
    FROM metrics_points
    WHERE metric = 'net.packet_loss.percent'
      AND host = :host
      AND ts BETWEEN :ts_from AND :ts_to
),
event_flags AS (
    SELECT
        ts,
        value,
        host,
        CASE
            WHEN value > 0 AND (prev_value = 0 OR prev_value IS NULL) THEN 1
            ELSE 0
        END AS is_event_start
    FROM loss_points
),
event_groups AS (
    SELECT
        ts,
        value,
        host,
        SUM(is_event_start) OVER (
            PARTITION BY host
            ORDER BY ts
            ROWS UNBOUNDED PRECEDING
        ) AS event_id
    FROM event_flags
    WHERE value > 0
)
SELECT
    MIN(ts) AS event_start,
    MAX(ts) AS event_end,
    EXTRACT(EPOCH FROM MAX(ts) - MIN(ts)) AS duration_seconds,
    MAX(value) AS max_packet_loss_percent,
    AVG(value) AS avg_packet_loss_percent
FROM event_groups
GROUP BY event_id
ORDER BY event_start;
