-- Migration to populate event_roles table for existing events
-- This ensures all events have the complete set of roles available

-- Function to populate roles for a specific event
CREATE OR REPLACE FUNCTION populate_event_roles(p_event_config_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if roles already exist for this event
  IF EXISTS (SELECT 1 FROM public.event_roles WHERE event_config_id = p_event_config_id) THEN
    RAISE NOTICE 'Roles already exist for event %, skipping population', p_event_config_id;
    RETURN;
  END IF;

  -- Insert all the event roles
  INSERT INTO public.event_roles (event_config_id, name, description) VALUES
  -- Media team roles
  (p_event_config_id, 'Trưởng ban Truyền thông', 'Chịu trách nhiệm điều phối toàn bộ hoạt động truyền thông của sự kiện'),
  (p_event_config_id, 'Phó ban Truyền thông', 'Hỗ trợ trưởng ban trong việc quản lý các hoạt động truyền thông'),
  (p_event_config_id, 'Thành viên ban Truyền thông', 'Thực hiện các công việc truyền thông như chụp ảnh, quay video, đăng bài'),
  
  -- Activity team roles
  (p_event_config_id, 'Trưởng ban Sinh hoạt', 'Chịu trách nhiệm tổ chức và điều phối các hoạt động sinh hoạt'),
  (p_event_config_id, 'Phó ban Sinh hoạt', 'Hỗ trợ trưởng ban trong việc tổ chức các hoạt động sinh hoạt'),
  (p_event_config_id, 'Thành viên ban Sinh hoạt', 'Thực hiện các hoạt động sinh hoạt, trò chơi, văn nghệ'),
  
  -- Discipline team roles
  (p_event_config_id, 'Trưởng ban Kỷ luật', 'Chịu trách nhiệm duy trì trật tự và kỷ luật trong sự kiện'),
  (p_event_config_id, 'Phó ban Kỷ luật', 'Hỗ trợ trưởng ban trong việc duy trì trật tự'),
  (p_event_config_id, 'Thành viên ban Kỷ luật', 'Thực hiện nhiệm vụ giữ gìn trật tự, hướng dẫn người tham gia'),
  
  -- Logistics team roles
  (p_event_config_id, 'Trưởng ban Hậu cần', 'Chịu trách nhiệm tổ chức và quản lý các hoạt động hậu cần'),
  (p_event_config_id, 'Phó ban Hậu cần', 'Hỗ trợ trưởng ban trong việc quản lý hậu cần'),
  (p_event_config_id, 'Thành viên ban Hậu cần', 'Thực hiện các công việc hậu cần như vận chuyển, chuẩn bị vật dụng'),
  
  -- Liturgy team roles
  (p_event_config_id, 'Trưởng ban Phụng vụ', 'Chịu trách nhiệm tổ chức và điều phối các hoạt động phụng vụ'),
  (p_event_config_id, 'Phó ban Phụng vụ', 'Hỗ trợ trưởng ban trong việc tổ chức phụng vụ'),
  (p_event_config_id, 'Thành viên ban Phụng vụ', 'Thực hiện các nhiệm vụ phụng vụ như ca đoàn, đọc sách, rước lễ'),
  
  -- Security team roles
  (p_event_config_id, 'Trưởng ban An ninh', 'Chịu trách nhiệm đảm bảo an toàn và an ninh cho sự kiện'),
  (p_event_config_id, 'Phó ban An ninh', 'Hỗ trợ trưởng ban trong việc đảm bảo an ninh'),
  (p_event_config_id, 'Thành viên ban An ninh', 'Thực hiện nhiệm vụ bảo vệ, kiểm soát ra vào'),
  
  -- Registration team roles
  (p_event_config_id, 'Trưởng ban Thư ký', 'Chịu trách nhiệm quản lý đăng ký và thông tin người tham gia'),
  (p_event_config_id, 'Phó ban Thư ký', 'Hỗ trợ trưởng ban trong việc quản lý đăng ký'),
  (p_event_config_id, 'Thành viên ban Thư ký', 'Thực hiện các công việc đăng ký, check-in, quản lý thông tin'),
  
  -- Catering team roles
  (p_event_config_id, 'Trưởng ban Ẩm thực', 'Chịu trách nhiệm tổ chức và quản lý các hoạt động ẩm thực'),
  (p_event_config_id, 'Phó ban Ẩm thực', 'Hỗ trợ trưởng ban trong việc quản lý ẩm thực'),
  (p_event_config_id, 'Thành viên ban Ẩm thực', 'Thực hiện các công việc nấu ăn, phục vụ, dọn dẹp'),
  
  -- Health team roles
  (p_event_config_id, 'Trưởng ban Y tế', 'Chịu trách nhiệm chăm sóc sức khỏe người tham gia'),
  (p_event_config_id, 'Phó ban Y tế', 'Hỗ trợ trưởng ban trong việc chăm sóc y tế'),
  (p_event_config_id, 'Thành viên ban Y tế', 'Thực hiện các công việc sơ cứu, chăm sóc sức khỏe'),
  
  -- Audio Light team roles
  (p_event_config_id, 'Trưởng ban Âm thanh Ánh sáng', 'Chịu trách nhiệm quản lý hệ thống âm thanh và ánh sáng'),
  (p_event_config_id, 'Phó ban Âm thanh Ánh sáng', 'Hỗ trợ trưởng ban trong việc quản lý âm thanh ánh sáng'),
  (p_event_config_id, 'Thành viên ban Âm thanh Ánh sáng', 'Thực hiện các công việc kỹ thuật âm thanh và ánh sáng'),
  
  -- Group leadership roles
  (p_event_config_id, 'Trưởng nhóm các đội', 'Chịu trách nhiệm điều phối hoạt động giữa các đội'),
  (p_event_config_id, 'Phó trưởng nhóm các đội', 'Hỗ trợ trưởng nhóm trong việc điều phối'),
  
  -- Organizer roles
  (p_event_config_id, 'Ban tổ chức cốt cán', 'Thành viên ban tổ chức cốt cán, thủ quỹ'),
  (p_event_config_id, 'Ban tổ chức khu vực', 'Thành viên ban tổ chức khu vực');

  RAISE NOTICE 'Successfully populated % roles for event %', 
    (SELECT count(*) FROM public.event_roles WHERE event_config_id = p_event_config_id), 
    p_event_config_id;
END;
$$ LANGUAGE plpgsql;

-- Populate roles for all existing events
DO $$
DECLARE
  event_record RECORD;
  total_events INTEGER := 0;
  populated_events INTEGER := 0;
BEGIN
  -- Get all event configs
  FOR event_record IN 
    SELECT id, name FROM public.event_configs ORDER BY created_at DESC
  LOOP
    total_events := total_events + 1;
    
    -- Check if this event already has roles
    IF NOT EXISTS (SELECT 1 FROM public.event_roles WHERE event_config_id = event_record.id) THEN
      -- Populate roles for this event
      PERFORM populate_event_roles(event_record.id);
      populated_events := populated_events + 1;
      RAISE NOTICE 'Populated roles for event: % (ID: %)', event_record.name, event_record.id;
    ELSE
      RAISE NOTICE 'Event % already has roles, skipping', event_record.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: % events processed, % events populated with roles', total_events, populated_events;
END $$;

-- Drop the function as it's no longer needed after migration
DROP FUNCTION IF EXISTS populate_event_roles(uuid);

SELECT 'Event roles population migration completed successfully!' as message;
