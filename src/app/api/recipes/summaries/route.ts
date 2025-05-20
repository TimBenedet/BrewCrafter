
import { getRecipeSummaries } from '@/lib/recipe-utils';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures the route is always executed dynamically

export async function GET(request: NextRequest) {
  try {
    const summaries = await getRecipeSummaries();
    return NextResponse.json(summaries);
  } catch (error) {
    console.error('API Error: Failed to fetch recipe summaries:', error);
    // It's good practice to not expose detailed internal errors to the client.
    let errorMessage = 'Failed to load recipes due to an internal server error.';
    if (error instanceof Error) {
        // You might want to log error.message for server-side debugging
        // but not necessarily send it to the client unless it's safe to do so.
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

