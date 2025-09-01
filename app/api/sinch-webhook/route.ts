import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON payload from Sinch
    const event = await req.json();

    // TODO: Add business logic here
    // Examples:
    // - Parse SMS content
    // - Handle different event types (message received, delivery receipt, etc.)
    // - Store messages in database
    // - Send automated responses
    // - Log events for monitoring

    console.log('Sinch webhook event received:', {
      timestamp: new Date().toISOString(),
      event: event
    });

    // Log specific event details if available
    if (event.type) {
      console.log(`Event type: ${event.type}`);
    }

    if (event.message) {
      console.log(`Message content: ${event.message.text}`);
      console.log(`From: ${event.message.from}`);
      console.log(`To: ${event.message.to}`);
    }

    // Always return 200 status for successful receipt
    // Sinch expects this to acknowledge the webhook
    return NextResponse.json(
      { 
        status: 'received',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing Sinch webhook:', error);
    
    // Still return 200 to prevent Sinch from retrying
    // but log the error for debugging
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to process webhook',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Sinch webhook endpoint is active',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
