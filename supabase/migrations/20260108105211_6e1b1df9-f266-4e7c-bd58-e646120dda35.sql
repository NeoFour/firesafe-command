-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', true);

-- Create policy for staff to upload photos
CREATE POLICY "Staff can upload inspection photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'inspection-photos' AND is_staff(auth.uid()));

-- Create policy for anyone to view inspection photos (for applicants to see their inspection results)
CREATE POLICY "Anyone can view inspection photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inspection-photos');

-- Create policy for staff to update inspection photos
CREATE POLICY "Staff can update inspection photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'inspection-photos' AND is_staff(auth.uid()));

-- Create policy for staff to delete inspection photos
CREATE POLICY "Staff can delete inspection photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'inspection-photos' AND is_staff(auth.uid()));