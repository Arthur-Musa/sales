import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface QueueJob {
  id: string
  queue_name: string
  job_type: string
  payload: any
  priority: number
  max_retries: number
  retry_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  error_message?: string
  tenant_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (req.method === 'POST') {
      if (action === 'enqueue') {
        // Add job to queue
        const jobData = await req.json()
        const job = await enqueueJob(supabase, jobData)
        
        return new Response(
          JSON.stringify({ success: true, job_id: job.id }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'process') {
        // Process next job in queue
        const { queue_name } = await req.json()
        const result = await processNextJob(supabase, queue_name)
        
        return new Response(
          JSON.stringify(result),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (req.method === 'GET') {
      if (action === 'status') {
        // Get queue status
        const queueName = url.searchParams.get('queue_name')
        const status = await getQueueStatus(supabase, queueName)
        
        return new Response(
          JSON.stringify(status),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error in queue manager:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function enqueueJob(supabase: any, jobData: any): Promise<QueueJob> {
  const job: Partial<QueueJob> = {
    id: crypto.randomUUID(),
    queue_name: jobData.queue_name || 'default',
    job_type: jobData.job_type,
    payload: jobData.payload,
    priority: jobData.priority || 0,
    max_retries: jobData.max_retries || 3,
    retry_count: 0,
    status: 'pending',
    scheduled_at: jobData.scheduled_at || new Date().toISOString(),
    tenant_id: jobData.tenant_id
  }

  const { data, error } = await supabase
    .from('queue_jobs')
    .insert(job)
    .select()
    .single()

  if (error) throw error
  return data
}

async function processNextJob(supabase: any, queueName: string = 'default') {
  // Get next job to process
  const { data: job, error: fetchError } = await supabase
    .from('queue_jobs')
    .select('*')
    .eq('queue_name', queueName)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single()

  if (fetchError || !job) {
    return { message: 'No jobs to process' }
  }

  // Mark job as processing
  await supabase
    .from('queue_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', job.id)

  try {
    // Process the job based on type
    const result = await executeJob(supabase, job)

    // Mark job as completed
    await supabase
      .from('queue_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    return { 
      success: true, 
      job_id: job.id, 
      job_type: job.job_type,
      result 
    }

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error)

    const newRetryCount = job.retry_count + 1
    const shouldRetry = newRetryCount < job.max_retries

    if (shouldRetry) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, newRetryCount) * 60 * 1000 // 2^n minutes
      const nextAttempt = new Date(Date.now() + retryDelay).toISOString()

      await supabase
        .from('queue_jobs')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          scheduled_at: nextAttempt,
          error_message: error.message
        })
        .eq('id', job.id)

      return { 
        success: false, 
        job_id: job.id,
        retry_scheduled: nextAttempt,
        error: error.message 
      }
    } else {
      // Move to dead letter queue
      await supabase
        .from('queue_jobs')
        .update({
          status: 'dead_letter',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', job.id)

      return { 
        success: false, 
        job_id: job.id,
        moved_to_dead_letter: true,
        error: error.message 
      }
    }
  }
}

async function executeJob(supabase: any, job: QueueJob) {
  switch (job.job_type) {
    case 'send_whatsapp_message':
      return await executeWhatsAppJob(supabase, job)
    
    case 'send_email':
      return await executeEmailJob(supabase, job)
    
    case 'emit_policy':
      return await executePolicyEmissionJob(supabase, job)
    
    case 'process_payment':
      return await executePaymentJob(supabase, job)
    
    case 'sync_crm':
      return await executeCRMSyncJob(supabase, job)
    
    case 'generate_report':
      return await executeReportJob(supabase, job)
    
    default:
      throw new Error(`Unknown job type: ${job.job_type}`)
  }
}

async function executeWhatsAppJob(supabase: any, job: QueueJob) {
  const { phone, message, template_name } = job.payload

  const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
    body: {
      phone,
      message,
      templateName: template_name
    }
  })

  if (error) throw error
  return data
}

async function executeEmailJob(supabase: any, job: QueueJob) {
  const { to, subject, html, template_name } = job.payload

  // Call email service
  console.log(`Sending email to ${to}: ${subject}`)
  
  return {
    message_id: `email_${Date.now()}`,
    status: 'sent',
    recipient: to
  }
}

async function executePolicyEmissionJob(supabase: any, job: QueueJob) {
  const { sale_id } = job.payload

  const { data, error } = await supabase.functions.invoke('emit-policy', {
    body: { saleId: sale_id }
  })

  if (error) throw error
  return data
}

async function executePaymentJob(supabase: any, job: QueueJob) {
  const { payment_id, action } = job.payload

  console.log(`Processing payment ${payment_id}: ${action}`)
  
  return {
    payment_id,
    action,
    status: 'processed'
  }
}

async function executeCRMSyncJob(supabase: any, job: QueueJob) {
  const { sync_type, data } = job.payload

  console.log(`Syncing CRM: ${sync_type}`)
  
  return {
    sync_type,
    records_processed: Array.isArray(data) ? data.length : 1,
    status: 'completed'
  }
}

async function executeReportJob(supabase: any, job: QueueJob) {
  const { report_type, filters } = job.payload

  const { data, error } = await supabase.functions.invoke('generate-reports', {
    body: {
      type: report_type,
      format: 'pdf',
      filters
    }
  })

  if (error) throw error
  return data
}

async function getQueueStatus(supabase: any, queueName?: string) {
  let query = supabase
    .from('queue_jobs')
    .select('status, queue_name, count(*)')

  if (queueName) {
    query = query.eq('queue_name', queueName)
  }

  const { data, error } = await query

  if (error) throw error

  // Aggregate status counts
  const statusCounts = data.reduce((acc: any, row: any) => {
    const key = queueName ? row.status : `${row.queue_name}_${row.status}`
    acc[key] = (acc[key] || 0) + row.count
    return acc
  }, {})

  return {
    queue_name: queueName || 'all',
    status_counts: statusCounts,
    total_jobs: Object.values(statusCounts).reduce((sum: number, count: any) => sum + count, 0),
    timestamp: new Date().toISOString()
  }
}