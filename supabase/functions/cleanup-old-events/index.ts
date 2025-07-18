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

    console.log('Starting event cleanup process...')

    // Calculate date 2 days ago
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const cutoffDate = twoDaysAgo.toISOString().split('T')[0]

    console.log(`Deleting events with date before: ${cutoffDate}`)

    // Delete events that are 2+ days past their date
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('events')
      .delete()
      .lt('date', cutoffDate)
      .select('id, title, date')

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
        cutoffDate,
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