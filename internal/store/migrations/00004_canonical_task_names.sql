-- +goose Up
UPDATE OR IGNORE events SET task = 'morning-brief'
WHERE task <> 'morning-brief' AND (task LIKE 'morning brief%' OR task LIKE 'Утренний бриф%' OR task LIKE 'утренний бриф%');

UPDATE OR IGNORE events SET task = 'pre-standup-brief'
WHERE task <> 'pre-standup-brief' AND (task LIKE 'pre-standup brief%' OR task LIKE 'pre standup brief%' OR task LIKE 'Перед стендапом%' OR task LIKE 'перед стендапом%' OR task LIKE 'Предстендапный бриф%' OR task LIKE 'предстендапный бриф%');

UPDATE OR IGNORE events SET task = 'weekly-review'
WHERE task <> 'weekly-review' AND (task LIKE 'weekly review%' OR task LIKE 'Еженедельный итог%' OR task LIKE 'еженедельный итог%' OR task LIKE 'Итог недели%' OR task LIKE 'итог недели%');

DELETE FROM events
WHERE task LIKE 'morning brief%' OR task LIKE 'Утренний бриф%' OR task LIKE 'утренний бриф%'
   OR task LIKE 'pre-standup brief%' OR task LIKE 'pre standup brief%' OR task LIKE 'Перед стендапом%' OR task LIKE 'перед стендапом%' OR task LIKE 'Предстендапный бриф%' OR task LIKE 'предстендапный бриф%'
   OR task LIKE 'weekly review%' OR task LIKE 'Еженедельный итог%' OR task LIKE 'еженедельный итог%' OR task LIKE 'Итог недели%' OR task LIKE 'итог недели%';

-- +goose Down
SELECT 1;
