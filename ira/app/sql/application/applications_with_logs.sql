SELECT a.*
FROM applications a
WHERE EXISTS (
    SELECT 1
    FROM application_logs al
    WHERE al.application_id = a.id
);