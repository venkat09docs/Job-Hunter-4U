-- Create course content management tables

-- Course sections table
CREATE TABLE IF NOT EXISTS course_sections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course chapters table (content within sections)
CREATE TABLE IF NOT EXISTS course_chapters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'document')),
    content_data JSONB NOT NULL DEFAULT '{}',
    video_url TEXT,
    article_content TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_sections
CREATE POLICY "Super admins can manage course sections" 
ON course_sections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active course sections" 
ON course_sections 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for course_chapters
CREATE POLICY "Super admins can manage course chapters" 
ON course_chapters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active course chapters" 
ON course_chapters 
FOR SELECT 
USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_order ON course_sections(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_chapters_section_id ON course_chapters(section_id);
CREATE INDEX IF NOT EXISTS idx_course_chapters_order ON course_chapters(section_id, order_index);

-- Update timestamps trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_course_sections_updated_at
    BEFORE UPDATE ON course_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_chapters_updated_at
    BEFORE UPDATE ON course_chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();