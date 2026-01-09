-- Allow applicants to view inspections for their own applications
CREATE POLICY "Applicants can view their inspections"
ON public.inspections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = inspections.application_id
    AND applications.applicant_id = auth.uid()
  )
);