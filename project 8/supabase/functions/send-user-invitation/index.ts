import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InvitationRequest {
  email: string
  fullName: string
  role: string
  userId?: string
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

    const { email, fullName, role, userId }: InvitationRequest = await req.json()

    if (!email || !fullName || !role) {
      throw new Error('Email, fullName, and role are required')
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create or update user with invitation token
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId || crypto.randomUUID(),
        email,
        full_name: fullName,
        role,
        is_active: false,
        permissions: getDefaultPermissions(role),
        metadata: {
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          invitation_sent_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (userError) throw userError

    // Send invitation email
    const invitationUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`
    
    await sendInvitationEmail(email, fullName, role, invitationUrl)

    // Create notification for admins
    await supabase
      .from('notifications')
      .insert({
        type: 'info',
        priority: 'medium',
        title: 'Convite Enviado',
        message: `Convite enviado para ${fullName} (${email}) como ${role}`,
        metadata: { user_id: user.id, email, role }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user,
        invitationUrl: invitationUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending invitation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateInvitationToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}

function getDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'admin': [
      'manage_users', 'manage_sales', 'manage_commissions', 'manage_policies',
      'view_reports', 'export_data', 'manage_system', 'view_audit_logs'
    ],
    'gestor': [
      'view_users', 'manage_sales', 'manage_commissions', 'view_policies',
      'view_reports', 'export_data', 'view_audit_logs'
    ],
    'vendas': [
      'view_own_sales', 'view_own_commissions', 'view_policies'
    ],
    'operador': [
      'view_sales', 'manage_policies', 'emit_policies', 'view_reports'
    ],
    'cobranca': [
      'view_sales', 'view_commissions', 'view_reports'
    ]
  }

  return permissionMap[role] || []
}

async function sendInvitationEmail(email: string, fullName: string, role: string, invitationUrl: string) {
  try {
    // Get email configuration
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: emailConfig } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'email_config')
      .single()

    if (!emailConfig?.value) {
      console.log('Email not configured, invitation URL:', invitationUrl)
      return
    }

    const config = emailConfig.value

    // Prepare email content
    const emailContent = {
      to: email,
      subject: 'Convite para acessar a plataforma Olga AI',
      html: generateInvitationEmailHTML(fullName, role, invitationUrl)
    }

    // Send email via configured service (SendGrid, SMTP, etc.)
    if (config.provider === 'sendgrid') {
      await sendViaSendGrid(config, emailContent)
    } else if (config.provider === 'smtp') {
      await sendViaSMTP(config, emailContent)
    } else {
      console.log('Email provider not configured, invitation URL:', invitationUrl)
    }

  } catch (error) {
    console.error('Error sending invitation email:', error)
    // Don't throw error - invitation was created successfully
  }
}

function generateInvitationEmailHTML(fullName: string, role: string, invitationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Convite - Olga AI</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937;">Olga AI</h1>
                <p style="color: #6b7280;">Colaboradora Digital</p>
            </div>
            
            <h2>Olá, ${fullName}!</h2>
            
            <p>Você foi convidado(a) para acessar a plataforma Olga AI como <strong>${role}</strong>.</p>
            
            <p>Para ativar sua conta e definir sua senha, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ativar Conta
                </a>
            </div>
            
            <p><strong>Importante:</strong> Este convite expira em 7 dias.</p>
            
            <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #6b7280;">${invitationUrl}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #6b7280;">
                Este é um e-mail automático. Se você não esperava receber este convite, pode ignorá-lo.
            </p>
        </div>
    </body>
    </html>
  `
}

async function sendViaSendGrid(config: any, emailContent: any) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: emailContent.to }]
      }],
      from: { email: config.from_email, name: config.from_name || 'Olga AI' },
      subject: emailContent.subject,
      content: [{
        type: 'text/html',
        value: emailContent.html
      }]
    })
  })

  if (!response.ok) {
    throw new Error(`SendGrid error: ${response.statusText}`)
  }
}

async function sendViaSMTP(config: any, emailContent: any) {
  // SMTP implementation would go here
  // For now, just log the invitation
  console.log('SMTP not implemented, invitation URL:', emailContent.html)
}