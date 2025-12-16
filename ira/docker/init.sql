CREATE TABLE IF NOT EXISTS metrics_points (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    metric TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    host TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metrics_points_metric_ts
    ON metrics_points (metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_ts
    ON metrics_points (ts);
