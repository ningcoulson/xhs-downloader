import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Extract URL if mixed with text (e.g. "Check this out http://xhslink.com/...")
  const urlMatch = url.match(/(https?:\/\/[^\s]+)/);
  const validUrl = urlMatch ? urlMatch[0] : url;

  if (!validUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  try {
    // 1. Fetch the content, following redirects
    // User-Agent is important to avoid bot detection or getting mobile version if needed
    // Using Mobile UA sometimes gets different structure but Desktop is standard for this scraping logic
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();

    // 2. Extract __INITIAL_STATE__
    // The pattern usually looks like: window.__INITIAL_STATE__= {...}
    const regex = /window\.__INITIAL_STATE__\s*=\s*({.+?})(?:<\/script>|;)/;
    const match = html.match(regex);

    if (!match || !match[1]) {
      // Fallback: try to find within parsing Note
      return NextResponse.json({ error: 'Could not find initial state in page content' }, { status: 422 });
    }

    let state;
    try {
      // Sometimes the JSON might contain "undefined" which is invalid JSON, replace it
      const jsonString = match[1].replace(/undefined/g, 'null');
      state = JSON.parse(jsonString);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse initial state JSON', details: (e as Error).message }, { status: 422 });
    }

    // 3. Extract relevant data
    // Data structure can be deep. Usually state.note.noteDetailMap[noteId].note
    // But we need to find the note data regardless of ID.

    // Attempt to locate the note object
    let noteData = state.note?.noteDetailMap?.[state.note.firstNoteId]?.note ||
      state.note?.firstNote ||
      (state.noteData) || // Fallback for mobile structure
      null;

    // Fallback: iterate noteDetailMap if firstNoteId failed
    if (!noteData && state.note?.noteDetailMap) {
      const keys = Object.keys(state.note.noteDetailMap);
      if (keys.length > 0) {
        // Try to find the first non-null note
        for (const k of keys) {
          if (state.note.noteDetailMap[k]?.note) {
            noteData = state.note.noteDetailMap[k].note;
            break;
          }
        }
      }
    }

    if (!noteData) {
      // Include minimal debug info to help user report issues
      const debugInfo = {
        structure: Object.keys(state),
        noteKeys: state.note ? Object.keys(state.note) : 'missing'
      };
      return NextResponse.json({ error: 'Could not locate note data in structure', debug: debugInfo }, { status: 422 });
    }

    const result = {
      title: noteData.title,
      desc: noteData.desc,
      type: noteData.type, // 'video' or 'normal' (images)
      user: {
        nickname: noteData.user?.nickname,
        avatar: noteData.user?.avatar,
      },
      images: noteData.imageList?.map((img: any) => {
        let traceId = img.traceId;
        // If traceId is missing, try to extract from urlDefault
        if (!traceId && img.urlDefault) {
          const match = img.urlDefault.match(/\/spectrum\/(.+?)!/);
          if (match) {
            traceId = match[1];
          }
        }

        // Use traceId to construct clean URL from NA CDN (often no watermark)
        // Fallback to urlDefault if traceId is missing
        const cleanUrl = traceId
          ? `https://sns-na-i1.xhscdn.com/spectrum/${traceId}`
          : (img.urlDefault || '').split('?')[0];

        return {
          url: img.urlDefault || cleanUrl, // Display default webp
          traceId: traceId || '',
          original: cleanUrl,
        };
      }) || [],
      video: noteData.video?.media?.stream?.h264?.[0]?.masterUrl || null,
    };


    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
