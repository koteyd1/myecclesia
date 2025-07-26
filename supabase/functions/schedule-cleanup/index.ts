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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting scheduled event cleanup...')

    // Calculate current datetime
    const now = new Date()
    console.log(`Current time: ${now.toISOString()}`)

    // First, get all events that have passed (date is before today)
    const { data: pastDateEvents, error: pastDateError } = await supabase
      .from('events')
      .select('id, title, date, time')
      .lt('date', now.toISOString().split('T')[0])

    let deletedEventIds: string[] = []

    if (!pastDateError && pastDateEvents && pastDateEvents.length > 0) {
      const pastEventIds = pastDateEvents.map(e => e.id)
      
      // Delete events with past dates
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', pastEventIds)

      if (!deleteError) {
        deletedEventIds.push(...pastEventIds)
        console.log(`Deleted ${pastEventIds.length} events with past dates`)
      }
    }

    // Then, get all events from today and check their times
    const { data: todayEvents, error: todayError } = await supabase
      .from('events')
      .select('id, title, date, time')
      .eq('date', now.toISOString().split('T')[0])

    if (!todayError && todayEvents && todayEvents.length > 0) {
      const expiredTodayEvents = todayEvents.filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`)
        return eventDateTime <= now
      })

      if (expiredTodayEvents.length > 0) {
        const expiredIds = expiredTodayEvents.map(e => e.id)
        
        const { error: expiredError } = await supabase
          .from('events')
          .delete()
          .in('id', expiredIds)

        if (!expiredError) {
          deletedEventIds.push(...expiredIds)
          console.log(`Deleted ${expiredIds.length} events from today that have passed`)
        }
      }
    }

    // Clean up related data for all deleted events
    if (deletedEventIds.length > 0) {
      console.log(`Cleaning up related data for ${deletedEventIds.length} deleted events`)
      
      // Delete related registrations
      const { error: regError } = await supabase
        .from('event_registrations')
        .delete()
        .in('event_id', deletedEventIds)

      if (regError) {
        console.error('Error deleting registrations:', regError)
      } else {
        console.log('Deleted related registrations')
      }

      // Delete related calendar entries
      const { error: calError } = await supabase
        .from('user_calendar')
        .delete()
        .in('event_id', deletedEventIds)

      if (calError) {
        console.error('Error deleting calendar entries:', calError)
      } else {
        console.log('Deleted related calendar entries')
      }
    }

    console.log(`Cleanup completed. Total events deleted: ${deletedEventIds.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        deletedEventsCount: deletedEventIds.length,
        deletedEventIds,
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Scheduled cleanup error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})