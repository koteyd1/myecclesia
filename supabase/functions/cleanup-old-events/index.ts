import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Require authenticated admin
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    const userId = user.id

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    if (roleError || roleRow?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('Starting event cleanup process...')

    // Calculate current datetime
    const now = new Date()
    const currentDateTime = now.toISOString()

    console.log(`Deleting events that have passed: ${currentDateTime}`)

    // Delete events where the combined date and time have passed
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('events')
      .delete()
      .lt('date', now.toISOString().split('T')[0])
      .select('id, title, date, time')

    // Also delete events from today where the time has passed
    const { data: todayEvents, error: todayError } = await supabase
      .from('events')
      .select('id, title, date, time')
      .eq('date', now.toISOString().split('T')[0])

    if (!todayError && todayEvents) {
      const expiredTodayEvents = todayEvents.filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`)
        return eventDateTime <= now
      })

      if (expiredTodayEvents.length > 0) {
        const expiredIds = expiredTodayEvents.map(e => e.id)
        const { data: expiredDeleted, error: expiredError } = await supabase
          .from('events')
          .delete()
          .in('id', expiredIds)
          .select('id, title, date, time')

        if (!expiredError && expiredDeleted) {
          deletedEvents?.push(...expiredDeleted)
        }
      }
    }

    if (deleteError) {
      console.error('Error deleting events:', deleteError)
      throw deleteError
    }

    console.log(`Deleted ${deletedEvents?.length || 0} events:`, deletedEvents)

    // Also clean up related data (registrations and calendar entries for deleted events)
    if (deletedEvents && deletedEvents.length > 0) {
      const eventIds = deletedEvents.map(event => event.id)
      
      // Delete related registrations
      const { error: regError } = await supabase
        .from('event_registrations')
        .delete()
        .in('event_id', eventIds)

      if (regError) {
        console.error('Error deleting registrations:', regError)
      }

      // Delete related calendar entries
      const { error: calError } = await supabase
        .from('user_calendar')
        .delete()
        .in('event_id', eventIds)

      if (calError) {
        console.error('Error deleting calendar entries:', calError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedEvents: deletedEvents?.length || 0,
        currentDateTime,
        events: deletedEvents
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})