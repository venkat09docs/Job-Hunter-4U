-- Add unique constraint and insert assignment for Keerthi user
ALTER TABLE clp_attempts ADD CONSTRAINT clp_attempts_user_assignment_unique UNIQUE (user_id, assignment_id);

INSERT INTO clp_attempts (user_id, assignment_id, status, started_at)
VALUES ('46254977-149f-4c97-826d-f2d6b9ac485b', 'dfb87384-2789-40c1-a425-7a7d3d4ed672', 'available', NOW())
ON CONFLICT (user_id, assignment_id) DO NOTHING;

-- Create notification for the assignment
INSERT INTO notifications (user_id, type, title, message, related_id, is_read)
VALUES (
  '46254977-149f-4c97-826d-f2d6b9ac485b', 
  'assignment_assigned',
  'New Assignment Available',
  'Assignment "Intro to Linux" has been assigned after completing section "Linux for Everyone"',
  'dfb87384-2789-40c1-a425-7a7d3d4ed672',
  false
);