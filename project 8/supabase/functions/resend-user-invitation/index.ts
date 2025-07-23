import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Generate new invitation token
    const invitationToken = crypto.randomUUID() + '-' + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Update user with new invitation token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        metadata: {
          ...user.metadata,
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          invitation_resent_at: new Date().toISOString()
        }
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Send new invitation email
    const invitationUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`
    
    await sendInvitationEmail(user.email, user.full_name, user.role, invitationUrl)

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        type: 'info',
        priority: 'medium',
        title: 'Convite Reenviado',
        message: `Convite reenviado para ${user.full_name} (${user.email})`,
        metadata: { user_id: userId, email: user.email, role: user.role }
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation resent successfully',
        invitationUrl: invitationUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error resending invitation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function sendInvitationEmail(email: string, fullName: string, role: string, invitationUrl: string) {
  // Reuse the same email sending logic from send-user-invitation
  console.log(`Resending invitation to ${email}: ${invitationUrl}`)
}