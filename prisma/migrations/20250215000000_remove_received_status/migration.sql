-- Convert existing RECEIVED cargo shipments to WAREHOUSE (RECEIVED status removed from flow)
UPDATE cargo_shipments SET status = 'WAREHOUSE' WHERE status = 'RECEIVED';
