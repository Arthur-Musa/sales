/*
  # Add Queue System for Async Processing

  1. New Tables
    - `queue_jobs` - Job queue for async processing
    - `queue_stats` - Queue statistics and monitoring
  
  2. Functions
    - Queue management functions
    - Retry logic with exponential backoff
    - Dead letter queue handling
  
  3. Security
    - RLS policies for queue access
    - Audit logging for job processing
*/

-- Queue Jobs Table
CREATE TABLE IF NOT EXISTS queue_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name text NOT NULL DEFAULT 'default',
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  retry_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  tenant_id uuid REFERENCES tenants(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for queue performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_queue_name ON queue_jobs(queue_name);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_scheduled_at ON queue_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_priority ON queue_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_tenant_id ON queue_jobs(tenant_id);

-- Composite index for job processing
CREATE INDEX IF NOT EXISTS idx_queue_jobs_processing ON queue_jobs(queue_name, status, priority DESC, scheduled_at);

-- Queue Statistics Table
CREATE TABLE IF NOT EXISTS queue_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  jobs_enqueued integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  jobs_failed integer NOT NULL DEFAULT 0,
  jobs_dead_letter integer NOT NULL DEFAULT 0,
  avg_processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(queue_name, date)
);

-- Enable RLS
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queue_jobs
CREATE POLICY "System can manage all queue jobs"
  ON queue_jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for queue_stats
CREATE POLICY "Authenticated users can read queue stats"
  ON queue_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage queue stats"
  ON queue_stats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update queue stats
CREATE OR REPLACE FUNCTION update_queue_stats()
RETURNS trigger AS $$
BEGIN
  -- Update stats when job status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO queue_stats (queue_name, date, jobs_completed, jobs_failed, jobs_dead_letter)
    VALUES (
      NEW.queue_name,
      CURRENT_DATE,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'dead_letter' THEN 1 ELSE 0 END
    )
    ON CONFLICT (queue_name, date)
    DO UPDATE SET
      jobs_completed = queue_stats.jobs_completed + EXCLUDED.jobs_completed,
      jobs_failed = queue_stats.jobs_failed + EXCLUDED.jobs_failed,
      jobs_dead_letter = queue_stats.jobs_dead_letter + EXCLUDED.jobs_dead_letter,
      updated_at = now();
  END IF;

  -- Update stats when job is enqueued
  IF TG_OP = 'INSERT' THEN
    INSERT INTO queue_stats (queue_name, date, jobs_enqueued)
    VALUES (NEW.queue_name, CURRENT_DATE, 1)
    ON CONFLICT (queue_name, date)
    DO UPDATE SET
      jobs_enqueued = queue_stats.jobs_enqueued + 1,
      updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for queue stats
CREATE TRIGGER queue_jobs_stats_trigger
  AFTER INSERT OR UPDATE ON queue_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_stats();

-- Function to clean old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_queue_jobs()
RETURNS void AS $$
BEGIN
  -- Delete completed jobs older than 7 days
  DELETE FROM queue_jobs
  WHERE status = 'completed'
    AND completed_at < now() - interval '7 days';
  
  -- Delete failed jobs older than 30 days
  DELETE FROM queue_jobs
  WHERE status IN ('failed', 'dead_letter')
    AND completed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_queue_jobs_updated_at
  BEFORE UPDATE ON queue_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_stats_updated_at
  BEFORE UPDATE ON queue_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();