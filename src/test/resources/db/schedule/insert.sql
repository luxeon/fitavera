INSERT INTO schedules (id, training_id, location_id, default_trainer_id, start_time, end_time, days_of_week,
                       client_capacity, created_at,
                       updated_at)
VALUES ('9a7632b1-e932-48fd-9296-001036b4ec19', 'ae4d661a-ed70-4e36-9caf-048ee8060290',
        'c35ac7f5-3e4f-462a-a76d-524bd3a5fd01', 'c35ac7f5-3e4f-462a-a76d-524bd3a5fd03',
        '09:00:00', '10:00:00', array ['MONDAY', 'SUNDAY'], 10, now(), now()),
       ('1b350914-43f5-4433-a82e-ff60dc8aa47a', 'ae4d661a-ed70-4e36-9caf-048ee8060290',
        'c35ac7f5-3e4f-462a-a76d-524bd3a5fd01', 'c35ac7f5-3e4f-462a-a76d-524bd3a5fd01',
        '08:00:00', '9:30:00', array ['TUESDAY', 'THURSDAY', 'SATURDAY'], 20, now(), now());